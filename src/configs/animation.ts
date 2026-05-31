import type { TurningMode } from '@/types/slides'
import { getLL } from '@/i18n/getLL'

export const ANIMATION_DEFAULT_DURATION = 1000
export const ANIMATION_DEFAULT_TRIGGER = 'click'
export const ANIMATION_CLASS_PREFIX = 'animate__'

const LL = getLL()
const enter = LL.configs.animation.enter
const exit = LL.configs.animation.exit
const attention = LL.configs.animation.attention
const slide = LL.configs.animation.slide

export const ENTER_ANIMATIONS = [
  {
    type: 'bounce',
    name: enter.groups.bounce(),
    children: [
      { name: enter.effects.bounceIn(), value: 'bounceIn' },
      { name: enter.effects.bounceInLeft(), value: 'bounceInLeft' },
      { name: enter.effects.bounceInRight(), value: 'bounceInRight' },
      { name: enter.effects.bounceInUp(), value: 'bounceInUp' },
      { name: enter.effects.bounceInDown(), value: 'bounceInDown' },
    ],
  },
  {
    type: 'fade',
    name: enter.groups.fade(),
    children: [
      { name: enter.effects.fadeIn(), value: 'fadeIn' },
      { name: enter.effects.fadeInDown(), value: 'fadeInDown' },
      { name: enter.effects.fadeInDownBig(), value: 'fadeInDownBig' },
      { name: enter.effects.fadeInLeft(), value: 'fadeInLeft' },
      { name: enter.effects.fadeInLeftBig(), value: 'fadeInLeftBig' },
      { name: enter.effects.fadeInRight(), value: 'fadeInRight' },
      { name: enter.effects.fadeInRightBig(), value: 'fadeInRightBig' },
      { name: enter.effects.fadeInUp(), value: 'fadeInUp' },
      { name: enter.effects.fadeInUpBig(), value: 'fadeInUpBig' },
      { name: enter.effects.fadeInTopLeft(), value: 'fadeInTopLeft' },
      { name: enter.effects.fadeInTopRight(), value: 'fadeInTopRight' },
      { name: enter.effects.fadeInBottomLeft(), value: 'fadeInBottomLeft' },
      { name: enter.effects.fadeInBottomRight(), value: 'fadeInBottomRight' },
    ],
  },
  {
    type: 'rotate',
    name: enter.groups.rotate(),
    children: [
      { name: enter.effects.rotateIn(), value: 'rotateIn' },
      { name: enter.effects.rotateInDownLeft(), value: 'rotateInDownLeft' },
      { name: enter.effects.rotateInDownRight(), value: 'rotateInDownRight' },
      { name: enter.effects.rotateInUpLeft(), value: 'rotateInUpLeft' },
      { name: enter.effects.rotateInUpRight(), value: 'rotateInUpRight' },
    ],
  },
  {
    type: 'zoom',
    name: enter.groups.zoom(),
    children: [
      { name: enter.effects.zoomIn(), value: 'zoomIn' },
      { name: enter.effects.zoomInDown(), value: 'zoomInDown' },
      { name: enter.effects.zoomInLeft(), value: 'zoomInLeft' },
      { name: enter.effects.zoomInRight(), value: 'zoomInRight' },
      { name: enter.effects.zoomInUp(), value: 'zoomInUp' },
    ],
  },
  {
    type: 'slide',
    name: enter.groups.slide(),
    children: [
      { name: enter.effects.slideInDown(), value: 'slideInDown' },
      { name: enter.effects.slideInLeft(), value: 'slideInLeft' },
      { name: enter.effects.slideInRight(), value: 'slideInRight' },
      { name: enter.effects.slideInUp(), value: 'slideInUp' },
    ],
  },
  {
    type: 'flip',
    name: enter.groups.flip(),
    children: [
      { name: enter.effects.flipInX(), value: 'flipInX' },
      { name: enter.effects.flipInY(), value: 'flipInY' },
    ],
  },
  {
    type: 'back',
    name: enter.groups.back(),
    children: [
      { name: enter.effects.backInDown(), value: 'backInDown' },
      { name: enter.effects.backInLeft(), value: 'backInLeft' },
      { name: enter.effects.backInRight(), value: 'backInRight' },
      { name: enter.effects.backInUp(), value: 'backInUp' },
    ],
  },
  {
    type: 'lightSpeed',
    name: enter.groups.lightSpeed(),
    children: [
      { name: enter.effects.lightSpeedInRight(), value: 'lightSpeedInRight' },
      { name: enter.effects.lightSpeedInLeft(), value: 'lightSpeedInLeft' },
    ],
  },
]

export const EXIT_ANIMATIONS = [
  {
    type: 'bounce',
    name: exit.groups.bounce(),
    children: [
      { name: exit.effects.bounceOut(), value: 'bounceOut' },
      { name: exit.effects.bounceOutLeft(), value: 'bounceOutLeft' },
      { name: exit.effects.bounceOutRight(), value: 'bounceOutRight' },
      { name: exit.effects.bounceOutUp(), value: 'bounceOutUp' },
      { name: exit.effects.bounceOutDown(), value: 'bounceOutDown' },
    ],
  },
  {
    type: 'fade',
    name: exit.groups.fade(),
    children: [
      { name: exit.effects.fadeOut(), value: 'fadeOut' },
      { name: exit.effects.fadeOutDown(), value: 'fadeOutDown' },
      { name: exit.effects.fadeOutDownBig(), value: 'fadeOutDownBig' },
      { name: exit.effects.fadeOutLeft(), value: 'fadeOutLeft' },
      { name: exit.effects.fadeOutLeftBig(), value: 'fadeOutLeftBig' },
      { name: exit.effects.fadeOutRight(), value: 'fadeOutRight' },
      { name: exit.effects.fadeOutRightBig(), value: 'fadeOutRightBig' },
      { name: exit.effects.fadeOutUp(), value: 'fadeOutUp' },
      { name: exit.effects.fadeOutUpBig(), value: 'fadeOutUpBig' },
      { name: exit.effects.fadeOutTopLeft(), value: 'fadeOutTopLeft' },
      { name: exit.effects.fadeOutTopRight(), value: 'fadeOutTopRight' },
      { name: exit.effects.fadeOutBottomLeft(), value: 'fadeOutBottomLeft' },
      { name: exit.effects.fadeOutBottomRight(), value: 'fadeOutBottomRight' },
    ],
  },
  {
    type: 'rotate',
    name: exit.groups.rotate(),
    children: [
      { name: exit.effects.rotateOut(), value: 'rotateOut' },
      { name: exit.effects.rotateOutDownLeft(), value: 'rotateOutDownLeft' },
      { name: exit.effects.rotateOutDownRight(), value: 'rotateOutDownRight' },
      { name: exit.effects.rotateOutUpLeft(), value: 'rotateOutUpLeft' },
      { name: exit.effects.rotateOutUpRight(), value: 'rotateOutUpRight' },
    ],
  },
  {
    type: 'zoom',
    name: exit.groups.zoom(),
    children: [
      { name: exit.effects.zoomOut(), value: 'zoomOut' },
      { name: exit.effects.zoomOutDown(), value: 'zoomOutDown' },
      { name: exit.effects.zoomOutLeft(), value: 'zoomOutLeft' },
      { name: exit.effects.zoomOutRight(), value: 'zoomOutRight' },
      { name: exit.effects.zoomOutUp(), value: 'zoomOutUp' },
    ],
  },
  {
    type: 'slide',
    name: exit.groups.slide(),
    children: [
      { name: exit.effects.slideOutDown(), value: 'slideOutDown' },
      { name: exit.effects.slideOutLeft(), value: 'slideOutLeft' },
      { name: exit.effects.slideOutRight(), value: 'slideOutRight' },
      { name: exit.effects.slideOutUp(), value: 'slideOutUp' },
    ],
  },
  {
    type: 'flip',
    name: exit.groups.flip(),
    children: [
      { name: exit.effects.flipOutX(), value: 'flipOutX' },
      { name: exit.effects.flipOutY(), value: 'flipOutY' },
    ],
  },
  {
    type: 'back',
    name: exit.groups.back(),
    children: [
      { name: exit.effects.backOutDown(), value: 'backOutDown' },
      { name: exit.effects.backOutLeft(), value: 'backOutLeft' },
      { name: exit.effects.backOutRight(), value: 'backOutRight' },
      { name: exit.effects.backOutUp(), value: 'backOutUp' },
    ],
  },
  {
    type: 'lightSpeed',
    name: exit.groups.lightSpeed(),
    children: [
      { name: exit.effects.lightSpeedOutRight(), value: 'lightSpeedOutRight' },
      { name: exit.effects.lightSpeedOutLeft(), value: 'lightSpeedOutLeft' },
    ],
  },
]

export const ATTENTION_ANIMATIONS = [
  {
    type: 'shake',
    name: attention.groups.shake(),
    children: [
      { name: attention.effects.shakeX(), value: 'shakeX' },
      { name: attention.effects.shakeY(), value: 'shakeY' },
      { name: attention.effects.headShake(), value: 'headShake' },
      { name: attention.effects.swing(), value: 'swing' },
      { name: attention.effects.wobble(), value: 'wobble' },
      { name: attention.effects.tada(), value: 'tada' },
      { name: attention.effects.jello(), value: 'jello' },
    ],
  },
  {
    type: 'other',
    name: attention.groups.other(),
    children: [
      { name: attention.effects.bounce(), value: 'bounce' },
      { name: attention.effects.flash(), value: 'flash' },
      { name: attention.effects.pulse(), value: 'pulse' },
      { name: attention.effects.rubberBand(), value: 'rubberBand' },
      { name: attention.effects.heartBeat(), value: 'heartBeat' },
    ],
  },
]

interface SlideAnimation {
  label: string
  value: TurningMode
}

export const SLIDE_ANIMATIONS: SlideAnimation[] = [
  { label: slide.no(), value: 'no' },
  { label: slide.random(), value: 'random' },
  { label: slide.slideX(), value: 'slideX' },
  { label: slide.slideY(), value: 'slideY' },
  { label: slide.slideX3D(), value: 'slideX3D' },
  { label: slide.slideY3D(), value: 'slideY3D' },
  { label: slide.fade(), value: 'fade' },
  { label: slide.rotate(), value: 'rotate' },
  { label: slide.scaleY(), value: 'scaleY' },
  { label: slide.scaleX(), value: 'scaleX' },
  { label: slide.scale(), value: 'scale' },
  { label: slide.scaleReverse(), value: 'scaleReverse' },
]
