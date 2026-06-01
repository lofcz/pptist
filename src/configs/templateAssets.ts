const TEMPLATE_IMAGE_ASSETS: Record<string, string> = {
  'template-image-01.jpeg': new URL('../assets/templates/images/template-image-01.jpeg', import.meta.url).href,
  'template-image-02.jpeg': new URL('../assets/templates/images/template-image-02.jpeg', import.meta.url).href,
  'template-image-03.jpeg': new URL('../assets/templates/images/template-image-03.jpeg', import.meta.url).href,
  'template-image-04.jpeg': new URL('../assets/templates/images/template-image-04.jpeg', import.meta.url).href,
  'template-image-05.jpeg': new URL('../assets/templates/images/template-image-05.jpeg', import.meta.url).href,
  'template-image-06.jpeg': new URL('../assets/templates/images/template-image-06.jpeg', import.meta.url).href,
  'template-image-07.jpeg': new URL('../assets/templates/images/template-image-07.jpeg', import.meta.url).href,
  'template-image-08.jpeg': new URL('../assets/templates/images/template-image-08.jpeg', import.meta.url).href,
  'template-image-09.jpeg': new URL('../assets/templates/images/template-image-09.jpeg', import.meta.url).href,
  'template-image-10.jpeg': new URL('../assets/templates/images/template-image-10.jpeg', import.meta.url).href,
  'template-image-11.jpeg': new URL('../assets/templates/images/template-image-11.jpeg', import.meta.url).href,
  'template-image-12.jpg': new URL('../assets/templates/images/template-image-12.jpg', import.meta.url).href,
  'template-image-13.jpeg': new URL('../assets/templates/images/template-image-13.jpeg', import.meta.url).href,
  'template-image-14.jpeg': new URL('../assets/templates/images/template-image-14.jpeg', import.meta.url).href,
  'template-image-15.jpeg': new URL('../assets/templates/images/template-image-15.jpeg', import.meta.url).href,
  'template-image-16.jpeg': new URL('../assets/templates/images/template-image-16.jpeg', import.meta.url).href,
  'template-image-17.jpeg': new URL('../assets/templates/images/template-image-17.jpeg', import.meta.url).href,
}

export const resolveTemplateAssetUrl = (asset: string) => TEMPLATE_IMAGE_ASSETS[asset] ?? asset
