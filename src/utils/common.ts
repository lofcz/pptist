import { padStart } from 'lodash'

/**
 * Pad the number of digits
 * @param digit number
 * @param len length
 */
export const fillDigit = (digit: number, len: number) => {
  return padStart('' + digit, len, '0')
}

/**
 * Check the device
 */
export const isPC = () => {
  return !navigator.userAgent.match(/(iPhone|iPod|iPad|Android|Mobile|BlackBerry|Symbian|Windows Phone)/i)
}

/**
 * Check the URL string
 */
export const isValidURL = (url: string) => {
  return /^(https?:\/\/)([\w-]+\.)+[\w-]{2,}(\/[\w-./?%&=]*)?$/i.test(url)
}

/**
 * HTML转纯文本
 */
export const htmlToText = (html: string) => {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return doc.body.textContent || ''
}

/**
 * 浮点数比较
 */
export const isFloatEqual = (a: number, b: number, epsilon = 1e-10) => {
  return Math.abs(a - b) < epsilon
}