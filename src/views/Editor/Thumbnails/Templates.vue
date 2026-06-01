<template>
  <div class="templates">
    <div class="catalogs">
      <div class="catalog" 
        :class="{ 'active': activeCatalog === item.id }" 
        v-for="item in templateCatalogs" 
        :key="item.id"
        @click="changeCatalog(item.id)"
      >{{ item.name }}</div>
    </div>
    <div class="content" v-loading="{ state: loading, text: LL.common.loading() }">
      <div class="header">
        <Tabs
          class="types"
          :tabs="types"
          :value="activeType"
          @update:value="value => activeType = value"
        />
        <div class="insert-all" @click="insertTemplates({ slides, theme })">{{ LL.editor.templates.insertAll() }}</div>
      </div>
      <div class="list" ref="listRef">
        <template v-for="slide in slides" :key="slide.id">
          <div 
            class="slide-item"
            v-if="slide.type === activeType || activeType === 'all'"
          >
            <ThumbnailSlide class="thumbnail" :slide="slide" :size="180" />
    
            <div class="btns">
              <Button class="btn" type="primary" size="small" @click="insertTemplate(slide)">{{ LL.editor.templates.insertTemplate() }}</Button>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useSlidesStore } from '@/store'
import type { Slide, SlideTheme } from '@/types/slides'
import api from '@/services'
import { useI18nContext } from '@/i18n/useI18nContext'
import { loadConfiguredTemplate, normalizeTemplatePayload, type TemplatePayload } from '@/configs/templates'

import ThumbnailSlide from '@/views/components/ThumbnailSlide/index.vue'
import Button from '@/components/Button.vue'
import Tabs from '@/components/Tabs.vue'

const emit = defineEmits<{
  (event: 'select', payload: Slide): void
  (event: 'selectAll', payload: { slides: Slide[], theme: Partial<SlideTheme> }): void
}>()

const { LL } = useI18nContext()

const slidesStore = useSlidesStore()
const { templates } = storeToRefs(slidesStore)

const templateCatalogs = computed(() => {
  const T = LL.value.editor.templates
  const nameById: Record<string, () => string> = {
    template_1: T.template1.name,
    template_2: T.template2.name,
    template_3: T.template3.name,
    template_4: T.template4.name,
    template_5: T.template5.name,
    template_6: T.template6.name,
    template_7: T.template7.name,
    template_8: T.template8.name,
  }
  return templates.value.map(item => ({
    ...item,
    name: nameById[item.id]?.() ?? item.name,
  }))
})

const slides = ref<Slide[]>([])
const theme = ref<Partial<SlideTheme>>({})
const listRef = ref<HTMLElement | null>(null)
const types = computed(() => {
  const slideTypes = LL.value.editor.templates.slideTypes
  return [
    { label: slideTypes.all(), key: 'all' },
    { label: slideTypes.cover(), key: 'cover' },
    { label: slideTypes.contents(), key: 'contents' },
    { label: slideTypes.transition(), key: 'transition' },
    { label: slideTypes.content(), key: 'content' },
    { label: slideTypes.end(), key: 'end' },
  ]
})
const activeType = ref('all')

const activeCatalog = ref('')
const loading = ref(false)

const insertTemplate = (slide: Slide) => {
  emit('select', slide)
}

const insertTemplates = ({ slides, theme }: { slides: Slide[], theme: Partial<SlideTheme> }) => {
  emit('selectAll', { slides, theme })
}

type CatalogPayload = TemplatePayload | Slide[]

const catalogCache = new Map<string, Promise<CatalogPayload>>()

const applyCatalogData = (ret: CatalogPayload) => {
  const data = normalizeTemplatePayload(ret, LL.value)
  slides.value = data.slides
  theme.value = data.theme ?? {}
}

const fetchCatalogData = async (id: string): Promise<CatalogPayload> => {
  const configuredTemplate = await loadConfiguredTemplate(id)
  if (configuredTemplate) return configuredTemplate

  return api.getMockData(id)
    // Fall back to the always-bundled demo deck when a host-provided custom
    // template file is missing, so the picker is never empty.
    .catch(() => (id === 'slides' ? Promise.reject() : api.getMockData('slides')))
}

const loadCatalogData = (id: string) => {
  const cached = catalogCache.get(id)
  if (cached) return cached

  const request = fetchCatalogData(id).catch(error => {
    catalogCache.delete(id)
    throw error
  })
  catalogCache.set(id, request)
  return request
}

let catalogRequestId = 0

const changeCatalog = (id: string) => {
  const requestId = ++catalogRequestId
  loading.value = true
  activeCatalog.value = id
  loadCatalogData(id)
    .then(ret => {
      if (requestId !== catalogRequestId) return
      applyCatalogData(ret)
      loading.value = false
      if (listRef.value) listRef.value.scrollTo(0, 0)
    })
    .catch(() => {
      if (requestId !== catalogRequestId) return
      slides.value = []
      loading.value = false
    })
}

onMounted(() => {
  changeCatalog(templates.value[0].id)
})
</script>

<style lang="scss" scoped>
.templates {
  width: 500px;
  height: 500px;
  display: flex;
  user-select: none;
}
.catalogs {
  width: 108px;
  margin-right: 10px;
  padding-right: 10px;
  border-right: 1px solid $borderColor;
  overflow: auto;

  .catalog {
    padding: 7px 8px;
    border-radius: $borderRadius;
    cursor: pointer;

    &:hover {
      background-color: #f5f5f5;
    }

    &.active {
      color: $themeColor;
      background-color: rgba($color: $themeColor, $alpha: .05);
      border-right: 2px solid $themeColor;
      font-weight: 700;
    }

    & + .catalog {
      margin-top: 3px; 
    }
  }
}
.content {
  display: flex;
  flex-direction: column;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding-right: 4px;

  &:hover .insert-all {
    opacity: 1;
    transition: opacity $transitionDelay;
  }
}
.types {
  flex: 1;
  min-width: 0;
  margin-right: 10px;

  :deep(.tabs) {
    border-bottom: 0;
  }
  :deep(.tab) {
    border-radius: $borderRadius;
    padding: 3px 8px;
    font-size: 12px;

    &.active {
      border-bottom-color: transparent;
      color: $themeColor;
      background-color: rgba($color: $themeColor, $alpha:.05);
      font-weight: 700;
    }

    &:hover {
      background-color: #f5f5f5;
    }
  }
}
.insert-all {
  flex: 0 0 auto;
  opacity: 0;
  font-size: 12px;
  color: $themeColor;
  text-decoration: underline;
  cursor: pointer;
}
.list {
  width: 392px;
  padding: 2px;
  margin-right: -10px;
  padding-right: 10px;
  overflow: auto;
  @include flex-grid-layout();
}
.slide-item {
  position: relative;
  @include flex-grid-layout-children(2, 48%);

  &:hover .btns {
    opacity: 1;
  }

  &:hover .thumbnail {
    outline-color: $themeColor;
  }

  .btns {
    @include absolute-0();

    flex-direction: column;
    justify-content: center;
    align-items: center;
    display: flex;
    background-color: rgba($color: #000, $alpha: .25);
    opacity: 0;
    transition: opacity $transitionDelay;
    border-radius: $borderRadius;
  }

  .thumbnail {
    outline: 2px solid $borderColor;
    transition: outline $transitionDelay;
    border-radius: $borderRadius;
    cursor: pointer;
  }
}
</style>