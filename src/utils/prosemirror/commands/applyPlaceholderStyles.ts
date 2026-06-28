import { TextSelection } from 'prosemirror-state'
import type { EditorView } from 'prosemirror-view'
import { setTextAlign } from './setTextAlign'

export interface PlaceholderStyleOptions {
  fontSize: string
  align: string
  color: string
  fontName?: string
}

/** Apply placeholder typography to the whole doc without selecting all (keeps caret). */
export const applyPlaceholderStyles = (view: EditorView, options: PlaceholderStyleOptions) => {
  const { state } = view
  const { doc, schema, selection } = state
  const cursorPos = selection.from
  const { fontsize, forecolor, fontname } = schema.marks

  let tr = state.tr

  doc.nodesBetween(0, doc.content.size, (node, pos) => {
    if (!node.isText) return
    const from = pos
    const to = pos + node.nodeSize
    tr = tr.addMark(from, to, fontsize.create({ fontsize: options.fontSize }))
    tr = tr.addMark(from, to, forecolor.create({ color: options.color }))
    if (options.fontName) {
      tr = tr.addMark(from, to, fontname.create({ fontname: options.fontName }))
    }
  })

  tr = setTextAlign(
    tr.setSelection(TextSelection.create(doc, 0, doc.content.size)),
    schema,
    options.align,
  )

  const mappedPos = tr.mapping.map(cursorPos, -1)
  tr = tr.setSelection(TextSelection.create(tr.doc, mappedPos))

  view.dispatch(tr)
}
