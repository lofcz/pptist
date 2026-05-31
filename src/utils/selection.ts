// Clear the text selection range
export const removeAllRanges = () => {
  const selection = window.getSelection()
  selection && selection.removeAllRanges()
}