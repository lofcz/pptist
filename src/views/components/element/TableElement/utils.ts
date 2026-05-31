import type { CSSProperties } from 'vue'
import type { PPTElementOutline, TableCellStyle } from '@/types/slides'

/**
 * Compute table cell box styles from outline and optional cell style.
 */
export const getCellStyle = (outline: PPTElementOutline, style?: TableCellStyle): CSSProperties => {
  return {
    backgroundColor: style?.backcolor || '',
    borderStyle: outline.style,
    borderColor: outline.color,
    borderWidth: outline.width + 'px',
  }
}

/**
 * Compute table cell text layout styles from optional cell style.
 */
export const getTextStyle = (cellMinHeight: number, style?: TableCellStyle): CSSProperties => {
  if (!style) return {}

  const {
    bold,
    em,
    underline,
    strikethrough,
    color,
    fontsize,
    fontname,
    align,
    vAlign,
  } = style

  const vAlignMap = {
    'top': 'flex-start',
    'middle': 'center',
    'bottom': 'flex-end',
  }

  let textDecoration = `${underline ? 'underline' : ''} ${strikethrough ? 'line-through' : ''}`
  if (textDecoration === ' ') textDecoration = 'none'
  
  return {
    fontWeight: bold ? 'bold' : 'normal',
    fontStyle: em ? 'italic' : 'normal',
    textDecoration,
    color: color || '#000',
    fontSize: fontsize || '14px',
    fontFamily: fontname || '',
    justifyContent: vAlignMap[vAlign || 'top'],
    textAlign: align || 'left',
    minHeight: (cellMinHeight - 4) + 'px',
  }
}

export const formatText = (text: string) => {
  return text.replace(/\n/g, '</br>').replace(/ /g, '&nbsp;')
}
