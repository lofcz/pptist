import { computed, type Ref } from 'vue'

// Compute element flip transform styles
export default (flipH: Ref<boolean | undefined>, flipV: Ref<boolean | undefined>) => {
  const flipStyle = computed(() => {
    let style = ''
    
    if (flipH.value && flipV.value) style = 'rotateX(180deg) rotateY(180deg)'
    else if (flipV.value) style = 'rotateX(180deg)'
    else if (flipH.value) style = 'rotateY(180deg)'

    return style
  })

  return {
    flipStyle,
  }
}