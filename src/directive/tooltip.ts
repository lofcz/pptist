import type { Directive, DirectiveBinding } from 'vue'
import tippy, { type Instance, type Placement } from 'tippy.js'
import { getPptistPortalTarget } from '@/utils/portal'

// tippy.js core styles MUST ship in the bundle. Without them the floating box has
// no layout/positioning rules of its own, so when PPTist is embedded in a host
// (sciobot-next) the host's CSS reset (Tailwind Preflight, universal border, etc.)
// leaks in and the tooltip renders unstyled/broken. Import the base before the
// theme so the themed selectors win on the cascade.
import 'tippy.js/dist/tippy.css'
import './tooltip.scss'

const TOOLTIP_INSTANCE = 'TOOLTIP_INSTANCE'

interface CustomHTMLElement extends HTMLElement {
  [TOOLTIP_INSTANCE]?: Instance
}

type Delay = number | [number | null, number | null]

interface BindingValue {
  content: string
  placement?: Placement
  delay?: Delay
}

const TooltipDirective: Directive = {
  mounted(el: CustomHTMLElement, binding: DirectiveBinding<BindingValue | string>) {
    let content = ''
    let placement: Placement = 'top'
    let delay: Delay = [300, 0]

    if (typeof binding.value === 'string') {
      content = binding.value
    }
    else {
      content = binding.value.content
      if (binding.value.placement !== undefined) placement = binding.value.placement
      if (binding.value.delay !== undefined) delay = binding.value.delay
    }

    el[TOOLTIP_INSTANCE] = tippy(el, {
      content,
      theme: 'tooltip',
      duration: 100,
      animation: 'scale',
      allowHTML: true,
      placement,
      delay,
      // Render inside the PPTist portal (the embed root) when embedded, so the
      // tooltip lives within PPTist's own styling scope instead of the host body.
      appendTo: () => getPptistPortalTarget(),
    })
  },

  updated(el: CustomHTMLElement, binding: DirectiveBinding<BindingValue | string>) {
    let content = ''
    if (typeof binding.value === 'string') {
      content = binding.value
    }
    else {
      content = binding.value.content
    }
    if (el[TOOLTIP_INSTANCE]) el[TOOLTIP_INSTANCE].setContent(content)
  },
  
  unmounted(el: CustomHTMLElement) {
    if (el[TOOLTIP_INSTANCE]) el[TOOLTIP_INSTANCE].destroy()
  },
}

export default TooltipDirective