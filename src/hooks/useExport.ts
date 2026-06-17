import { createVNode, render, computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { saveAs } from 'file-saver'
import pptxgen from 'pptxgenjs'
import tinycolor from 'tinycolor2'
import { toPng, toJpeg } from 'html-to-image'
import { useSlidesStore } from '@/store'
import type { PPTElementOutline, PPTElementShadow, PPTElementLink, PPTTextElement, Slide } from '@/types/slides'
import { getElementRange, getLineElementPath, getTableSubThemeColor } from '@/utils/element'
import { type AST, toAST } from '@/utils/htmlParser'
import { type SvgPoints, toPoints } from '@/utils/svgPathParser'
import { encrypt } from '@/utils/crypto'
import { svg2Base64 } from '@/utils/svg2Base64'
import message from '@/utils/message'
import { getLL } from '@/i18n/getLL'

const LL = getLL()

import BaseLatexElement from '@/views/components/element/LatexElement/BaseLatexElement.vue'
import BaseShapeElement from '@/views/components/element/ShapeElement/BaseShapeElement.vue'

interface ExportImageConfig {
  quality: number
  width: number
  fontEmbedCSS?: string
}

export default () => {
  const slidesStore = useSlidesStore()
  const { slides, theme, viewportRatio, title, viewportSize } = storeToRefs(slidesStore)

  const defaultFontSize = 16

  const ratioPx2Inch = computed(() => {
    return 96 * (viewportSize.value / 960)
  })
  const ratioPx2Pt = computed(() => {
    return 96 / 72 * (viewportSize.value / 960)
  })

  const exporting = ref(false)

  const pptxDefaultFontFace = () => theme.value.fontName || 'Calibri'

  // 导出图片
  const exportImage = (domRef: HTMLElement, format: string, quality: number, ignoreWebfont = true) => {
    exporting.value = true
    const toImage = format === 'png' ? toPng : toJpeg

    const foreignObjectSpans = domRef.querySelectorAll('foreignObject [xmlns]')
    foreignObjectSpans.forEach(spanRef => spanRef.removeAttribute('xmlns'))

    setTimeout(() => {
      const config: ExportImageConfig = {
        quality,
        width: 1600,
      }

      if (ignoreWebfont) config.fontEmbedCSS = ''

      toImage(domRef, config).then(dataUrl => {
        exporting.value = false
        saveAs(dataUrl, `${title.value}.${format}`)
      }).catch(() => {
        exporting.value = false
        message.error(LL.export.exportImageFailed())
      })
    }, 200)
  }

  // 导出图片版PPTX
  const exportImagePPTX = (domRefs: NodeListOf<Element>) => {
    exporting.value = true
    
    setTimeout(() => {
      const pptx = new pptxgen()

      const config: ExportImageConfig = {
        quality: 1,
        width: 1600,
      }

      const promiseArr = []
      for (const domRef of domRefs) {
        const foreignObjectSpans = domRef.querySelectorAll('foreignObject [xmlns]')
        foreignObjectSpans.forEach(spanRef => spanRef.removeAttribute('xmlns'))

        const promiseFunc = () => toJpeg((domRef as HTMLElement), config)
        promiseArr.push(promiseFunc)
      }

      Promise.all(promiseArr.map(func => func())).then(imgs => {
        for (const data of imgs) {
          const pptxSlide = pptx.addSlide()
          pptxSlide.addImage({
            data,
            x: 0,
            y: 0,
            w: viewportSize.value / ratioPx2Inch.value,
            h: viewportSize.value * viewportRatio.value / ratioPx2Inch.value,
          })
        }
        pptx.writeFile({ fileName: `${title.value}.pptx` }).then(() => exporting.value = false)
      }).catch(() => {
        exporting.value = false
        message.error(LL.export.exportFailed())
      })
    }, 200)
  }
  
  // 导出pptist文件（特有 .pptist 后缀文件）
  const exportSpecificFile = (_slides: Slide[]) => {
    const json = {
      title: title.value,
      width: viewportSize.value,
      height: viewportSize.value * viewportRatio.value,
      theme: theme.value,
      slides: _slides,
    }
    const blob = new Blob([encrypt(JSON.stringify(json))], { type: '' })
    saveAs(blob, `${title.value}.pptist`)
  }
  
  // 导出JSON文件
  const exportJSON = () => {
    const json = {
      title: title.value,
      width: viewportSize.value,
      height: viewportSize.value * viewportRatio.value,
      theme: theme.value,
      slides: slides.value,
    }
    const blob = new Blob([JSON.stringify(json)], { type: '' })
    saveAs(blob, `${title.value}.json`)
  }

  // 格式化颜色值为 透明度 + HexString，供pptxgenjs使用
  const formatColor = (_color: string) => {
    if (!_color) {
      return {
        alpha: 0,
        color: '#000000',
      }
    }

    const c = tinycolor(_color)
    const alpha = c.getAlpha()
    const color = alpha === 0 ? '#ffffff' : c.setAlpha(1).toHexString()
    return {
      alpha,
      color,
    }
  }

  type FormatColor = ReturnType<typeof formatColor>

  // 判断富文本内容是否为空（仅含空标签/空白）。空的占位元素（如"点击添加标题"）
  // 只是编辑态的交互提示，导出时不应生成空文本框
  const isEmptyHTMLText = (html?: string) => {
    if (!html) return true
    const text = html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&#8203;|\u200b/g, '')
    return text.trim().length === 0
  }

  // 将HTML字符串格式化为pptxgenjs所需的格式
  // 核心思路：将HTML字符串按样式分片平铺，每个片段需要继承祖先元素的样式信息，遇到块级元素需要换行
  const formatHTML = (html: string) => {
    const ast = toAST(html)
    let bulletFlag = false
    let indent = 0

    const slices: pptxgen.TextProps[] = []
    const parse = (obj: AST[], baseStyleObj: Record<string, string> = {}) => {

      for (const item of obj) {
        const isBlockTag = 'tagName' in item && ['div', 'li', 'p'].includes(item.tagName)

        if (isBlockTag && slices.length) {
          const lastSlice = slices[slices.length - 1]
          if (!lastSlice.options) lastSlice.options = {}
          lastSlice.options.breakLine = true
        }

        const styleObj = { ...baseStyleObj }
        const styleAttr = 'attributes' in item ? item.attributes.find(attr => attr.key === 'style') : null
        if (styleAttr && styleAttr.value) {
          let hasGradient = false
          const styleArr = styleAttr.value.split(';')
          for (const styleItem of styleArr) {
            const match = styleItem.match(/([^:]+):\s*(.+)/)
            if (match) {
              const [key, value] = [match[1].trim(), match[2].trim()]
              if (key && value) {
                if (key === 'background' && value.includes('linear-gradient')) {
                  hasGradient = true
                  const colorMatches = value.match(/#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}|rgba?\([^)]+\)/g)
                  if (colorMatches && colorMatches.length > 0) {
                    const colors = colorMatches.map(c => tinycolor(c))
                    const avgColor = colors.reduce((acc, c) => {
                      const rgb = c.toRgb()
                      return {
                        r: acc.r + rgb.r / colors.length,
                        g: acc.g + rgb.g / colors.length,
                        b: acc.b + rgb.b / colors.length,
                      }
                    }, { r: 0, g: 0, b: 0 })
                    styleObj['color'] = tinycolor(avgColor).toHexString()
                  }
                }
                else if (hasGradient && (key === 'background-clip' || key === '-webkit-background-clip' || (key === 'color' && value === 'transparent'))) {
                  continue
                }
                else styleObj[key] = value
              }
            }
          }
        }

        if ('tagName' in item) {
          if (item.tagName === 'em') {
            styleObj['font-style'] = 'italic'
          }
          if (item.tagName === 'strong') {
            styleObj['font-weight'] = 'bold'
          }
          if (item.tagName === 'sup') {
            styleObj['vertical-align'] = 'super'
          }
          if (item.tagName === 'sub') {
            styleObj['vertical-align'] = 'sub'
          }
          if (item.tagName === 'a') {
            const attr = item.attributes.find(attr => attr.key === 'href')
            styleObj['href'] = attr?.value || ''
          }
          if (item.tagName === 'ul') {
            styleObj['list-type'] = 'ul'
          }
          if (item.tagName === 'ol') {
            styleObj['list-type'] = 'ol'
          }
          if (item.tagName === 'li') {
            bulletFlag = true
          }
          if (item.tagName === 'p') {
            if ('attributes' in item) {
              const dataIndentAttr = item.attributes.find(attr => attr.key === 'data-indent')
              if (dataIndentAttr && dataIndentAttr.value) indent = +dataIndentAttr.value
            }
          }
        }

        if ('tagName' in item && item.tagName === 'br') {
          slices.push({ text: '', options: { breakLine: true } })
        }
        else if ('content' in item) {
          const text = item.content.replace(/&nbsp;/g, ' ').replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&').replace(/\n/g, '')
          const options: pptxgen.TextPropsOptions = {}

          if (styleObj['font-size']) {
            options.fontSize = parseInt(styleObj['font-size']) / ratioPx2Pt.value
          }
          if (styleObj['color']) {
            options.color = formatColor(styleObj['color']).color
          }
          if (styleObj['background-color']) {
            options.highlight = formatColor(styleObj['background-color']).color
          }
          if (styleObj['text-decoration-line']) {
            if (styleObj['text-decoration-line'].indexOf('underline') !== -1) {
              options.underline = {
                color: options.color || '#000000',
                style: 'sng',
              }
            }
            if (styleObj['text-decoration-line'].indexOf('line-through') !== -1) {
              options.strike = 'sngStrike'
            }
          }
          if (styleObj['text-decoration']) {
            if (styleObj['text-decoration'].indexOf('underline') !== -1) {
              options.underline = {
                color: options.color || '#000000',
                style: 'sng',
              }
            }
            if (styleObj['text-decoration'].indexOf('line-through') !== -1) {
              options.strike = 'sngStrike'
            }
          }
          if (styleObj['vertical-align']) {
            if (styleObj['vertical-align'] === 'super') options.superscript = true
            if (styleObj['vertical-align'] === 'sub') options.subscript = true
          }
          if (styleObj['text-align']) options.align = styleObj['text-align'] as pptxgen.HAlign
          if (styleObj['font-weight']) options.bold = styleObj['font-weight'] === 'bold'
          if (styleObj['font-style']) options.italic = styleObj['font-style'] === 'italic'
          if (styleObj['font-family']) options.fontFace = styleObj['font-family']
          if (styleObj['href']) options.hyperlink = { url: styleObj['href'] }

          if (bulletFlag && styleObj['list-type'] === 'ol') {
            options.bullet = { type: 'number', indent: (options.fontSize || defaultFontSize) * 1.25 }
            options.paraSpaceBefore = 0.1
            bulletFlag = false
          }
          if (bulletFlag && styleObj['list-type'] === 'ul') {
            options.bullet = { indent: (options.fontSize || defaultFontSize) * 1.25 }
            options.paraSpaceBefore = 0.1
            bulletFlag = false
          }
          if (indent) {
            options.indentLevel = indent
            indent = 0
          }

          slices.push({ text, options })
        }
        else if ('children' in item) parse(item.children, styleObj)
      }
    }
    parse(ast)
    return slices
  }

  type Points = Array<
    | { x: number; y: number; moveTo?: boolean }
    | { x: number; y: number; curve: { type: 'arc'; hR: number; wR: number; stAng: number; swAng: number } }
    | { x: number; y: number; curve: { type: 'quadratic'; x1: number; y1: number } }
    | { x: number; y: number; curve: { type: 'cubic'; x1: number; y1: number; x2: number; y2: number } }
    | { close: true }
  >

  // 将SVG路径信息格式化为pptxgenjs所需要的格式
  const formatPoints = (points: SvgPoints, scale = { x: 1, y: 1 }): Points => {
    return points.map(point => {
      if (point.close !== undefined) {
        return { close: true }
      }
      else if (point.type === 'M') {
        return {
          x: point.x / ratioPx2Inch.value * scale.x,
          y: point.y / ratioPx2Inch.value * scale.y,
          moveTo: true,
        }
      }
      else if (point.curve) {
        if (point.curve.type === 'cubic') {
          return {
            x: point.x / ratioPx2Inch.value * scale.x,
            y: point.y / ratioPx2Inch.value * scale.y,
            curve: {
              type: 'cubic',
              x1: (point.curve.x1 as number) / ratioPx2Inch.value * scale.x,
              y1: (point.curve.y1 as number) / ratioPx2Inch.value * scale.y,
              x2: (point.curve.x2 as number) / ratioPx2Inch.value * scale.x,
              y2: (point.curve.y2 as number) / ratioPx2Inch.value * scale.y,
            },
          }
        }
        else if (point.curve.type === 'quadratic') {
          return {
            x: point.x / ratioPx2Inch.value * scale.x,
            y: point.y / ratioPx2Inch.value * scale.y,
            curve: {
              type: 'quadratic',
              x1: (point.curve.x1 as number) / ratioPx2Inch.value * scale.x,
              y1: (point.curve.y1 as number) / ratioPx2Inch.value * scale.y,
            },
          }
        }
      }
      return {
        x: point.x / ratioPx2Inch.value * scale.x,
        y: point.y / ratioPx2Inch.value * scale.y,
      }
    })
  }

  // 获取阴影配置
  const getShadowOption = (shadow: PPTElementShadow): pptxgen.ShadowProps => {
    const c = formatColor(shadow.color)
    const { h, v } = shadow

    let offset = 4
    let angle = 45

    if (h === 0 && v === 0) {
      offset = 4
      angle = 45
    }
    else if (h === 0) {
      if (v > 0) {
        offset = v
        angle = 90
      }
      else {
        offset = -v
        angle = 270
      }
    }
    else if (v === 0) {
      if (h > 0) {
        offset = h
        angle = 1
      }
      else {
        offset = -h
        angle = 180
      }
    }
    else if (h > 0 && v > 0) {
      offset = Math.max(h, v)
      angle = 45
    }
    else if (h > 0 && v < 0) {
      offset = Math.max(h, -v)
      angle = 315
    }
    else if (h < 0 && v > 0) {
      offset = Math.max(-h, v)
      angle = 135
    }
    else if (h < 0 && v < 0) {
      offset = Math.max(-h, -v)
      angle = 225
    }

    return {
      type: 'outer',
      color: c.color.replace('#', ''),
      opacity: c.alpha,
      blur: shadow.blur / ratioPx2Pt.value,
      offset,
      angle,
    }
  }

  const dashTypeMap = {
    'solid': 'solid',
    'dashed': 'dash',
    'dotted': 'sysDot',
  }

  // 获取边框配置
  const getOutlineOption = (outline: PPTElementOutline): pptxgen.ShapeLineProps => {
    const c = formatColor(outline?.color || '#000000')
    
    return {
      color: c.color, 
      transparency: (1 - c.alpha) * 100,
      width: (outline.width || 1) / ratioPx2Pt.value, 
      dashType: outline.style ? dashTypeMap[outline.style] as 'solid' | 'dash' | 'sysDot' : 'solid',
    }
  }

  // 获取超链接配置
  const getLinkOption = (link: PPTElementLink): pptxgen.HyperlinkProps | null => {
    const { type, target } = link
    if (type === 'web') return { url: target }
    if (type === 'slide') {
      const index = slides.value.findIndex(slide => slide.id === target)
      if (index !== -1) return { slide: index + 1 }
    }

    return null
  }

  // 判断是否为Base64图片地址
  const isBase64Image = (url: string) => {
    const regex = /^data:image\/[^;]+;base64,/
    return url.match(regex) !== null
  }

  // 判断是否为SVG图片地址
  const isSVGImage = (url: string) => {
    const isSVGBase64 = /^data:image\/svg\+xml;base64,/.test(url)
    const isSVGUrl = /\.svg$/.test(url)
    return isSVGBase64 || isSVGUrl
  }

  // 判断是否为已内联的 data: URL（base64 图片 / SVG / 媒体），无需再抓取
  const isInlineDataUrl = (url: string) => {
    return /^data:/i.test(url)
  }

  // 判断是否为需要浏览器同源抓取的“外来”来源（http(s) 或 blob URL）
  const isForeignSource = (url: string) => {
    return /^(https?:|blob:)/i.test(url)
  }

  /**
   * 将单个 Blob 读取为 data: URL（供 pptxgenjs 的 options.data / cover 使用）。
   * 优先用响应自带的 mime，回落到 application/octet-stream（pptxgenjs 仍能识别）。
   */
  const blobToDataUrl = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result
        if (typeof result === 'string') resolve(result)
        else reject(new Error('FileReader produced non-string result'))
      }
      reader.onerror = () => reject(reader.error ?? new Error('FileReader error'))
      reader.readAsDataURL(blob)
    })
  }

  /**
   * 在浏览器（编辑器所在 origin）内抓取任意“外来”来源（图片 / 视频 / 音频 /
   * 视频海报 / 形状图案）并就地转成 base64 data: URL。
   *
   * pptxgenjs 的 writeFile() 会在内部 fetch 每个 `path` URL，但该 fetch 既不携带
   * 凭据也不走宿主页面的 CORS 上下文：存储桶一旦返回 CORS/401/403/404 或网络抖动，
   * 整次 export 都会被 reject 成笼统的 "Export failed"。这在 sciobot 这类把所有
   * 媒体以托管 URL（而非 base64）写入 deck 的宿主上必然踩雷。
   *
   * 这里在导出前先于浏览器内同源抓取（`credentials: 'omit'`，避免把宿主 cookie
   * 发给第三方 CDN），转成 data: URL。随后 image/background/pattern 走
   * isBase64Image()/isSVGImage() 自动路由进 options.data；media/cover 则在各自分支
   * 显式选择 data vs path。抓取失败的来源退回原值（交给 pptxgenjs 再试一次），并
   * 计入失败列表以便在 toast 中提示。
   */
  const fetchSourceAsDataUrl = async (
    src: string,
    failed: Set<string>,
  ): Promise<string> => {
    if (!src) return src
    // 已内联的 data: URL 直接放行
    if (isInlineDataUrl(src)) return src
    // 仅处理 http(s):/blob: 这类需要网络抓取的来源；其它（如相对路径）原样返回
    if (!isForeignSource(src)) return src

    try {
      const res = await fetch(src, { credentials: 'omit' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const blob = await res.blob()
      // 兜底：响应明显不是任何可嵌入二进制（HTML 错误页等）则放弃
      if (!blob.type || /^(text\/html|text\/plain|application\/json)/i.test(blob.type)) {
        throw new Error(`unexpected mime: ${blob.type || 'empty'}`)
      }
      return await blobToDataUrl(blob)
    }
    catch {
      failed.add(src)
      return src
    }
  }

  /**
   * 收集 _slides 中所有“外来”媒体来源（图片元素 / 图片背景 / 形状图案 /
   * 视频 / 音频 / 视频海报），在导出构建循环前并发（带并发上限）解析为 data: URL，
   * 返回 original→resolved 映射。失败的来源保留原值，由 pptxgenjs 的 path 分支
   * 再试，并把失败计数累加到 `failed`。返回值统一供所有 data/path 分支查表。
   */
  const resolveSlideSources = async (
    _slides: Slide[],
    failed: Set<string>,
  ): Promise<Map<string, string>> => {
    const srcs = new Set<string>()
    const collect = (src?: string) => {
      if (src && isForeignSource(src)) srcs.add(src)
    }
    for (const slide of _slides) {
      if (slide.background?.type === 'image') collect(slide.background.image?.src)
      if (!slide.elements) continue
      for (const el of slide.elements) {
        if (el.type === 'image') collect(el.src)
        else if (el.type === 'shape' && el.pattern) collect(el.pattern)
        else if (el.type === 'video' || el.type === 'audio') {
          collect(el.src)
          if (el.type === 'video' && el.poster) collect(el.poster)
        }
      }
    }
    if (!srcs.size) return new Map()

    // 限制并发，避免一次性轰炸存储桶触发限流
    const CONCURRENCY = 6
    const queue = Array.from(srcs)
    const resolved = new Map<string, string>()
    let cursor = 0
    const workers: Promise<void>[] = []
    const run = async () => {
      while (cursor < queue.length) {
        const src = queue[cursor++]
        resolved.set(src, await fetchSourceAsDataUrl(src, failed))
      }
    }
    for (let i = 0; i < Math.min(CONCURRENCY, queue.length); i++) workers.push(run())
    await Promise.all(workers)
    return resolved
  }

  // 导出PPTX文件
  const exportPPTX = async (_slides: Slide[], masterOverwrite: boolean, ignoreMedia: boolean) => {
    exporting.value = true
    const pptx = new pptxgen()

    // 在构建前把所有“外来”媒体来源就地转成 data: URL，绕过 pptxgenjs 的内部 fetch
    const failedSources = new Set<string>()
    const sources = await resolveSlideSources(_slides, failedSources)

    if (viewportRatio.value === 0.625) pptx.layout = 'LAYOUT_16x10'
    else if (viewportRatio.value === 0.75) pptx.layout = 'LAYOUT_4x3'
    else if (viewportRatio.value === 0.70710678) {
      pptx.defineLayout({ name: 'A3', width: 10, height: 7.0710678 })
      pptx.layout = 'A3'
    }
    else if (viewportRatio.value === 1.41421356) {
      pptx.defineLayout({ name: 'A3_V', width: 10, height: 14.1421356 })
      pptx.layout = 'A3_V'
    }
    else pptx.layout = 'LAYOUT_16x9'

    if (masterOverwrite) {
      const { color: bgColor, alpha: bgAlpha } = formatColor(theme.value.backgroundColor)
      pptx.defineSlideMaster({
        title: 'PPTIST_MASTER',
        background: { color: bgColor, transparency: (1 - bgAlpha) * 100 },
      })
    }

    // 用于为每张幻灯片生成唯一母版名（承载标题/正文占位符）
    let phMasterSeq = 0
    // 正文类占位（PowerPoint 仅支持 title/body 等有限类型，副标题/内容统一归入 body）
    const BODY_TEXT_TYPES = ['subtitle', 'content', 'item', 'itemTitle']

    for (const slide of _slides) {
      // 计算本张幻灯片的占位符绑定：标题元素 → title 占位符，首个正文类元素 → body 占位符。
      // 通过自定义母版导出原生 <p:ph type="title|body">，使 PowerPoint 大纲视图/无障碍正确识别标题与正文。
      const phBindings = new Map<string, 'title' | 'body'>()
      type MasterObjects = NonNullable<pptxgen.SlideMasterProps['objects']>
      const masterObjects: MasterObjects = []

      if (slide.elements) {
        const titleEl = slide.elements.find(el => el.type === 'text' && el.textType === 'title') as PPTTextElement | undefined
        const bodyEl = slide.elements.find(el => el.type === 'text' && BODY_TEXT_TYPES.includes(el.textType || '')) as PPTTextElement | undefined

        const registerPlaceholder = (el: PPTTextElement, name: 'title' | 'body', type: 'title' | 'body') => {
          phBindings.set(el.id, name)
          // 母版占位符的几何尺寸与元素一致：pptxgenjs 会以母版几何覆盖元素几何，
          // 设为相同值即可在保持原位置的同时获得正确的占位符语义；空占位则由母版自动补齐并显示原生提示。
          masterObjects.push({
            placeholder: {
              options: {
                name,
                type,
                x: el.left / ratioPx2Inch.value,
                y: el.top / ratioPx2Inch.value,
                w: el.width / ratioPx2Inch.value,
                h: el.height / ratioPx2Inch.value,
              },
              text: '',
            },
          })
        }

        if (titleEl) registerPlaceholder(titleEl, 'title', 'title')
        if (bodyEl) registerPlaceholder(bodyEl, 'body', 'body')
      }

      let pptxSlide: ReturnType<typeof pptx.addSlide>
      if (masterObjects.length) {
        const masterName = `PPTIST_PH_${phMasterSeq++}`
        const masterProps: pptxgen.SlideMasterProps = { title: masterName, objects: masterObjects }
        if (masterOverwrite) {
          const { color: bgColor, alpha: bgAlpha } = formatColor(theme.value.backgroundColor)
          masterProps.background = { color: bgColor, transparency: (1 - bgAlpha) * 100 }
        }
        pptx.defineSlideMaster(masterProps)
        pptxSlide = pptx.addSlide({ masterName })
      }
      else {
        pptxSlide = pptx.addSlide()
      }

      if (slide.background) {
        const background = slide.background
        if (background.type === 'image' && background.image) {
          // 用浏览器预抓取后的来源替换原 URL（成功时为 data: URL，失败时为原值）
          const bgSrc = sources.get(background.image.src) ?? background.image.src
          if (isSVGImage(bgSrc)) {
            pptxSlide.addImage({
              data: bgSrc,
              x: 0,
              y: 0,
              w: viewportSize.value / ratioPx2Inch.value,
              h: viewportSize.value * viewportRatio.value / ratioPx2Inch.value,
            })
          }
          else if (isBase64Image(bgSrc)) {
            pptxSlide.background = { data: bgSrc }
          }
          else {
            pptxSlide.background = { path: bgSrc }
          }
        }
        else if (background.type === 'solid' && background.color) {
          const c = formatColor(background.color)
          pptxSlide.background = { color: c.color, transparency: (1 - c.alpha) * 100 }
        }
        else if (background.type === 'gradient' && background.gradient) {
          const colors = background.gradient.colors
          const color1 = colors[0].color
          const color2 = colors[colors.length - 1].color
          const color = tinycolor.mix(color1, color2).toHexString()
          const c = formatColor(color)
          pptxSlide.background = { color: c.color, transparency: (1 - c.alpha) * 100 }
        }
      }
      if (slide.remark) {
        const doc = new DOMParser().parseFromString(slide.remark, 'text/html')
        const pList = doc.body.querySelectorAll('p')
        const text = []
        for (const p of pList) {
          const textContent = p.textContent
          text.push(textContent || '')
        }
        pptxSlide.addNotes(text.join('\n'))
      }

      if (!slide.elements) continue

      for (const el of slide.elements) {
        if (el.type === 'text') {
          const phName = phBindings.get(el.id)

          // 空内容处理：
          // - 绑定了占位符的空元素：不显式写入，交给 pptxgenjs 依据母版自动补齐为原生空占位符（显示"单击此处添加…"提示）
          // - 其它纯提示性空占位元素：直接跳过，避免导出为多余的空文本框/段落
          if (isEmptyHTMLText(el.content) && (phName || el.placeholder)) continue

          const textProps = formatHTML(el.content)
          const inset = el.inset || [10, 10, 10, 10]

          const options: pptxgen.TextPropsOptions = {
            x: el.left / ratioPx2Inch.value,
            y: el.top / ratioPx2Inch.value,
            w: el.width / ratioPx2Inch.value,
            h: el.height / ratioPx2Inch.value,
            fontSize: defaultFontSize / ratioPx2Pt.value,
            fontFace: pptxDefaultFontFace(),
            color: '#000000',
            valign: 'top',
            margin: [inset[3], inset[1], inset[2], inset[0]].map(item => item / ratioPx2Pt.value) as [number, number, number, number],
            paraSpaceBefore: 5 / ratioPx2Pt.value,
            lineSpacingMultiple: 1.5 / 1.25,
            autoFit: true,
          }
          if (el.rotate) options.rotate = el.rotate
          if (el.wordSpace) options.charSpacing = el.wordSpace / ratioPx2Pt.value
          if (el.lineHeight) options.lineSpacingMultiple = el.lineHeight / 1.25
          if (el.fill) {
            const c = formatColor(el.fill)
            const opacity = el.opacity === undefined ? 1 : el.opacity
            options.fill = { color: c.color, transparency: (1 - c.alpha * opacity) * 100 }
          }
          if (el.defaultColor) options.color = formatColor(el.defaultColor).color
          if (el.defaultFontName) options.fontFace = el.defaultFontName
          if (el.shadow) options.shadow = getShadowOption(el.shadow)
          if (el.outline?.width) options.line = getOutlineOption(el.outline)
          if (el.opacity !== undefined) options.transparency = (1 - el.opacity) * 100
          if (el.paragraphSpace !== undefined) options.paraSpaceBefore = el.paragraphSpace / ratioPx2Pt.value
          if (el.vertical) options.vert = 'eaVert'
          // 绑定到母版的标题/正文占位符，导出为带 <p:ph> 语义的占位元素
          if (phName) options.placeholder = phName

          pptxSlide.addText(textProps, options)
        }

        else if (el.type === 'image') {
          const options: pptxgen.ImageProps = {
            x: el.left / ratioPx2Inch.value,
            y: el.top / ratioPx2Inch.value,
            w: el.width / ratioPx2Inch.value,
            h: el.height / ratioPx2Inch.value,
          }
          // 用浏览器预抓取后的来源替换原 URL（成功时为 data: URL，失败时为原值）
          const imgSrc = sources.get(el.src) ?? el.src
          if (isBase64Image(imgSrc)) options.data = imgSrc
          else options.path = imgSrc

          if (el.flipH) options.flipH = el.flipH
          if (el.flipV) options.flipV = el.flipV
          if (el.rotate) options.rotate = el.rotate
          if (el.link) {
            const linkOption = getLinkOption(el.link)
            if (linkOption) options.hyperlink = linkOption
          }
          if (el.filters?.opacity) options.transparency = 100 - parseInt(el.filters?.opacity)
          if (el.clip) {
            if (el.clip.shape === 'ellipse') options.rounding = true

            const [start, end] = el.clip.range
            const [startX, startY] = start
            const [endX, endY] = end

            const originW = el.width / ((endX - startX) / ratioPx2Inch.value)
            const originH = el.height / ((endY - startY) / ratioPx2Inch.value)

            options.w = originW / ratioPx2Inch.value
            options.h = originH / ratioPx2Inch.value

            options.sizing = {
              type: 'crop',
              x: startX / ratioPx2Inch.value * originW / ratioPx2Inch.value,
              y: startY / ratioPx2Inch.value * originH / ratioPx2Inch.value,
              w: (endX - startX) / ratioPx2Inch.value * originW / ratioPx2Inch.value,
              h: (endY - startY) / ratioPx2Inch.value * originH / ratioPx2Inch.value,
            }
          }

          pptxSlide.addImage(options)
        }

        else if (el.type === 'shape') {
          if (el.special) {
            const container = document.createElement('div')
            const vm = createVNode(BaseShapeElement, { elementInfo: el }, null)
            render(vm, container)
            const svgRef = container.querySelector('svg')
            const base64SVG = svgRef ? svg2Base64(svgRef) : ''
            render(null, container)

            if (!base64SVG) continue

            const options: pptxgen.ImageProps = {
              data: base64SVG,
              x: el.left / ratioPx2Inch.value,
              y: el.top / ratioPx2Inch.value,
              w: el.width / ratioPx2Inch.value,
              h: el.height / ratioPx2Inch.value,
            }
            if (el.rotate) options.rotate = el.rotate
            if (el.flipH) options.flipH = el.flipH
            if (el.flipV) options.flipV = el.flipV
            if (el.link) {
              const linkOption = getLinkOption(el.link)
              if (linkOption) options.hyperlink = linkOption
            }

            pptxSlide.addImage(options)
          }
          else {
            const scale = {
              x: el.width / el.viewBox[0],
              y: el.height / el.viewBox[1],
            }
            const points = formatPoints(toPoints(el.path), scale)
  
            let fillColor = formatColor(el.fill)
            if (el.gradient) {
              const colors = el.gradient.colors
              const color1 = colors[0].color
              const color2 = colors[colors.length - 1].color
              const color = tinycolor.mix(color1, color2).toHexString()
              fillColor = formatColor(color)
            }
            if (el.pattern) fillColor = formatColor('#00000000')
            const opacity = el.opacity === undefined ? 1 : el.opacity
  
            const options: pptxgen.ShapeProps = {
              x: el.left / ratioPx2Inch.value,
              y: el.top / ratioPx2Inch.value,
              w: el.width / ratioPx2Inch.value,
              h: el.height / ratioPx2Inch.value,
              fill: { color: fillColor.color, transparency: (1 - fillColor.alpha * opacity) * 100 },
              points,
            }
            if (el.flipH) options.flipH = el.flipH
            if (el.flipV) options.flipV = el.flipV
            if (el.shadow) options.shadow = getShadowOption(el.shadow)
            if (el.outline?.width) options.line = getOutlineOption(el.outline)
            if (el.rotate) options.rotate = el.rotate
            if (el.link) {
              const linkOption = getLinkOption(el.link)
              if (linkOption) options.hyperlink = linkOption
            }

            pptxSlide.addShape('custGeom' as pptxgen.ShapeType, options)
          }
          if (el.text) {
            const textProps = formatHTML(el.text.content)
            const inset = el.text.inset || [10, 10, 10, 10]

            const options: pptxgen.TextPropsOptions = {
              x: el.left / ratioPx2Inch.value,
              y: el.top / ratioPx2Inch.value,
              w: el.width / ratioPx2Inch.value,
              h: el.height / ratioPx2Inch.value,
              fontSize: defaultFontSize / ratioPx2Pt.value,
              fontFace: pptxDefaultFontFace(),
              color: '#000000',
              paraSpaceBefore: 5 / ratioPx2Pt.value,
              margin: [inset[3], inset[1], inset[2], inset[0]].map(item => item / ratioPx2Pt.value) as [number, number, number, number],
              valign: el.text.align,
            }
            if (el.rotate) options.rotate = el.rotate
            if (el.text.defaultColor) options.color = formatColor(el.text.defaultColor).color
            if (el.text.defaultFontName) options.fontFace = el.text.defaultFontName

            pptxSlide.addText(textProps, options)
          }
          if (el.pattern) {
            const options: pptxgen.ImageProps = {
              x: el.left / ratioPx2Inch.value,
              y: el.top / ratioPx2Inch.value,
              w: el.width / ratioPx2Inch.value,
              h: el.height / ratioPx2Inch.value,
            }
            // 用浏览器预抓取后的来源替换原 URL（成功时为 data: URL，失败时为原值）
            const patternSrc = sources.get(el.pattern) ?? el.pattern
            if (isBase64Image(patternSrc)) options.data = patternSrc
            else options.path = patternSrc
  
            if (el.flipH) options.flipH = el.flipH
            if (el.flipV) options.flipV = el.flipV
            if (el.rotate) options.rotate = el.rotate
            if (el.link) {
              const linkOption = getLinkOption(el.link)
              if (linkOption) options.hyperlink = linkOption
            }

            pptxSlide.addImage(options)
          }
        }

        else if (el.type === 'line') {
          const path = getLineElementPath(el)
          const points = formatPoints(toPoints(path))
          const { minX, maxX, minY, maxY } = getElementRange(el)
          const c = formatColor(el.color)

          const options: pptxgen.ShapeProps = {
            x: el.left / ratioPx2Inch.value,
            y: el.top / ratioPx2Inch.value,
            w: (maxX - minX) / ratioPx2Inch.value,
            h: (maxY - minY) / ratioPx2Inch.value,
            line: {
              color: c.color, 
              transparency: (1 - c.alpha) * 100,
              width: el.width / ratioPx2Pt.value, 
              dashType: dashTypeMap[el.style] as 'solid' | 'dash' | 'sysDot',
              beginArrowType: el.points[0] ? 'arrow' : 'none',
              endArrowType: el.points[1] ? 'arrow' : 'none',
            },
            points,
          }
          if (el.shadow) options.shadow = getShadowOption(el.shadow)

          pptxSlide.addShape('custGeom' as pptxgen.ShapeType, options)
        }

        else if (el.type === 'chart') {
          const chartData = []
          for (let i = 0; i < el.data.series.length; i++) {
            const item = el.data.series[i]
            chartData.push({
              name: LL.export.chartSeries({ index: i + 1 }),
              labels: el.data.labels,
              values: item,
            })
          }

          let chartColors: string[] = []
          if (el.themeColors.length === 10) chartColors = el.themeColors.map(color => formatColor(color).color)
          else if (el.themeColors.length === 1) chartColors = tinycolor(el.themeColors[0]).analogous(10).map(color => formatColor(color.toHexString()).color)
          else {
            const len = el.themeColors.length
            const supplement = tinycolor(el.themeColors[len - 1]).analogous(10 + 1 - len).map(color => color.toHexString())
            chartColors = [...el.themeColors.slice(0, len - 1), ...supplement].map(color => formatColor(color).color)
          }
          
          const options: pptxgen.IChartOpts = {
            x: el.left / ratioPx2Inch.value,
            y: el.top / ratioPx2Inch.value,
            w: el.width / ratioPx2Inch.value,
            h: el.height / ratioPx2Inch.value,
            chartColors: (el.chartType === 'pie' || el.chartType === 'ring') ? chartColors : chartColors.slice(0, el.data.series.length),
          }

          const textColor = formatColor(el.textColor || '#000000').color
          options.catAxisLabelColor = textColor
          options.valAxisLabelColor = textColor

          const fontSize = 14 / ratioPx2Pt.value
          options.catAxisLabelFontSize = fontSize
          options.valAxisLabelFontSize = fontSize
          
          if (el.fill || el.outline) {
            const plotArea: pptxgen.IChartPropsFillLine = {}
            if (el.fill) {
              plotArea.fill = { color: formatColor(el.fill).color }
            }
            if (el.outline) {
              plotArea.border = {
                pt: el.outline.width! / ratioPx2Pt.value,
                color: formatColor(el.outline.color!).color,
              }
            }
            options.plotArea = plotArea
          }

          if ((el.data.series.length > 1 && el.chartType !== 'scatter') || el.chartType === 'pie' || el.chartType === 'ring') {
            options.showLegend = true
            options.legendPos = 'b'
            options.legendColor = textColor
            options.legendFontSize = fontSize
          }

          let type = pptx.ChartType.bar
          if (el.chartType === 'bar') {
            type = pptx.ChartType.bar
            options.barDir = 'col'
            if (el.options?.stack) options.barGrouping = 'stacked'
          }
          else if (el.chartType === 'column') {
            type = pptx.ChartType.bar
            options.barDir = 'bar'
            if (el.options?.stack) options.barGrouping = 'stacked'
          }
          else if (el.chartType === 'line') {
            type = pptx.ChartType.line
            if (el.options?.lineSmooth) options.lineSmooth = true
          }
          else if (el.chartType === 'area') {
            type = pptx.ChartType.area
          }
          else if (el.chartType === 'radar') {
            type = pptx.ChartType.radar
          }
          else if (el.chartType === 'scatter') {
            type = pptx.ChartType.scatter
            options.lineSize = 0
          }
          else if (el.chartType === 'pie') {
            type = pptx.ChartType.pie
          }
          else if (el.chartType === 'ring') {
            type = pptx.ChartType.doughnut
            options.holeSize = 60
          }
          
          pptxSlide.addChart(type, chartData, options)
        }

        else if (el.type === 'table') {
          const hiddenCells = []
          for (let i = 0; i < el.data.length; i++) {
            const rowData = el.data[i]

            for (let j = 0; j < rowData.length; j++) {
              const cell = rowData[j]
              if (cell.colspan > 1 || cell.rowspan > 1) {
                for (let row = i; row < i + cell.rowspan; row++) {
                  for (let col = row === i ? j + 1 : j; col < j + cell.colspan; col++) hiddenCells.push(`${row}_${col}`)
                }
              }
            }
          }

          const tableData = []

          const theme = el.theme
          let themeColor: FormatColor | null = null
          let subThemeColors: FormatColor[] = []
          if (theme) {
            themeColor = formatColor(theme.color)
            subThemeColors = getTableSubThemeColor(theme.color).map(item => formatColor(item))
          }

          for (let i = 0; i < el.data.length; i++) {
            const row = el.data[i]
            const _row = []

            for (let j = 0; j < row.length; j++) {
              const cell = row[j]
              const cellOptions: pptxgen.TableCellProps = {
                colspan: cell.colspan,
                rowspan: cell.rowspan,
                bold: cell.style?.bold || false,
                italic: cell.style?.em || false,
                underline: { style: cell.style?.underline ? 'sng' : 'none' },
                align: cell.style?.align || 'left',
                valign: 'middle',
                fontFace: cell.style?.fontname || pptxDefaultFontFace(),
                fontSize: (cell.style?.fontsize ? parseInt(cell.style?.fontsize) : 14) / ratioPx2Pt.value,
              }
              if (theme && themeColor) {
                let c: FormatColor
                if (i % 2 === 0) c = subThemeColors[1]
                else c = subThemeColors[0]

                if (theme.rowHeader && i === 0) c = themeColor
                else if (theme.rowFooter && i === el.data.length - 1) c = themeColor
                else if (theme.colHeader && j === 0) c = themeColor
                else if (theme.colFooter && j === row.length - 1) c = themeColor

                cellOptions.fill = { color: c.color, transparency: (1 - c.alpha) * 100 }
              }
              if (cell.style?.backcolor) {
                const c = formatColor(cell.style.backcolor)
                cellOptions.fill = { color: c.color, transparency: (1 - c.alpha) * 100 }
              }
              if (cell.style?.color) cellOptions.color = formatColor(cell.style.color).color

              if (!hiddenCells.includes(`${i}_${j}`)) {
                _row.push({
                  text: cell.text,
                  options: cellOptions,
                })
              }
            }
            if (_row.length) tableData.push(_row)
          }

          const options: pptxgen.TableProps = {
            x: el.left / ratioPx2Inch.value,
            y: el.top / ratioPx2Inch.value,
            w: el.width / ratioPx2Inch.value,
            h: el.height / ratioPx2Inch.value,
            colW: el.colWidths.map(item => el.width * item / ratioPx2Inch.value),
          }
          if (el.theme) options.fill = { color: '#ffffff' }
          if (el.outline.width && el.outline.color) {
            options.border = {
              type: el.outline.style === 'solid' ? 'solid' : 'dash',
              pt: el.outline.width / ratioPx2Pt.value,
              color: formatColor(el.outline.color).color,
            }
          }

          pptxSlide.addTable(tableData, options)
        }
        
        else if (el.type === 'latex') {
          const container = document.createElement('div')
          const vm = createVNode(BaseLatexElement, { elementInfo: el }, null)
          render(vm, container)
          const svgRef = container.querySelector('svg')
          const base64SVG = svgRef ? svg2Base64(svgRef) : ''
          render(null, container)

          if (!base64SVG) continue

          const options: pptxgen.ImageProps = {
            data: base64SVG,
            x: el.left / ratioPx2Inch.value,
            y: el.top / ratioPx2Inch.value,
            w: el.width / ratioPx2Inch.value,
            h: el.height / ratioPx2Inch.value,
          }
          if (el.link) {
            const linkOption = getLinkOption(el.link)
            if (linkOption) options.hyperlink = linkOption
          }

          pptxSlide.addImage(options)
        }
        
        else if (!ignoreMedia && (el.type === 'video' || el.type === 'audio')) {
          // 用浏览器预抓取后的来源替换原 URL：成功时为 data: URL → 走 data，
          // 否则退回原 URL → 走 path（pptxgenjs 内部 fetch 再试一次）
          const mediaSrc = sources.get(el.src) ?? el.src
          const isInline = isInlineDataUrl(mediaSrc)
          const options: pptxgen.MediaProps = {
            x: el.left / ratioPx2Inch.value,
            y: el.top / ratioPx2Inch.value,
            w: el.width / ratioPx2Inch.value,
            h: el.height / ratioPx2Inch.value,
            type: el.type,
          }
          if (isInline) options.data = mediaSrc
          else options.path = mediaSrc
          // 视频海报同样就地内联，避免 pptxgenjs 再 fetch 一次外部 URL
          if (el.type === 'video' && el.poster) {
            const posterSrc = sources.get(el.poster) ?? el.poster
            options.cover = posterSrc
          }

          const extMatch = el.src.match(/\.([a-zA-Z0-9]+)(?:[\?#]|$)/)
          if (extMatch && extMatch[1]) options.extn = extMatch[1]
          else if (el.ext) options.extn = el.ext

          const videoExts = ['avi', 'mp4', 'm4v', 'mov', 'wmv']
          const audioExts = ['mp3', 'm4a', 'mp4', 'wav', 'wma']
          if (options.extn && [...videoExts, ...audioExts].includes(options.extn)) {
            pptxSlide.addMedia(options)
          }
        }
      }
    }

    setTimeout(() => {
      pptx.writeFile({ fileName: `${title.value}.pptx` }).then(() => {
        exporting.value = false
        // 导出成功，但有部分外来来源无法就地内联（浏览器抓取失败），提示用户
        if (failedSources.size) {
          message.warning(`${LL.export.exportPartial()} (${failedSources.size})`)
        }
      }).catch(() => {
        exporting.value = false
        // write 本身失败时，若有来源未能内联，把计数附在消息上便于排查
        const detail = failedSources.size ? ` (${failedSources.size})` : ''
        message.error(`${LL.export.exportFailed()}${detail}`)
      })
    }, 200)
  }

  return {
    exporting,
    exportImage,
    exportImagePPTX,
    exportJSON,
    exportSpecificFile,
    exportPPTX,
  }
}
