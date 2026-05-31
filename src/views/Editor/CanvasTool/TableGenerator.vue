<template>
  <div class="table-generator">
    <div class="title">
      <div class="lef">{{ tableTitle }}</div>
      <div class="right" @click="isCustom = !isCustom">{{ isCustom ? LL.common.back() : LL.editor.canvasTool.tableGenerator.custom() }}</div>
    </div>
    <table 
      @mouseleave="endCell = []" 
      @click="handleClickTable()" 
      v-if="!isCustom"
    >
      <tbody>
        <tr v-for="row in 10" :key="row">
          <td 
            @mouseenter="endCell = [row, col]"
            v-for="col in 10" :key="col"
          >
            <div 
              class="cell" 
              :class="{ 'active': endCell.length && row <= endCell[0] && col <= endCell[1] }"
            ></div>
          </td>
        </tr>
      </tbody>
    </table>

    <div class="custom" v-else>
      <div class="row">
        <div class="label" style="width: 25%;">{{ LL.editor.canvasTool.tableGenerator.rows() }}</div>
        <NumberInput
          :min="1"
          :max="20"
          v-model:value="customRow"
          style="width: 75%;"
        />
      </div>
      <div class="row">
        <div class="label" style="width: 25%;">{{ LL.editor.canvasTool.tableGenerator.cols() }}</div>
        <NumberInput
          :min="1"
          :max="20"
          v-model:value="customCol"
          style="width: 75%;"
        />
      </div>
      <div class="btns">
        <Button class="btn" @click="close()">{{ LL.common.cancel() }}</Button>
        <Button class="btn" type="primary" @click="insertCustomTable()">{{ LL.common.confirm() }}</Button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import message from '@/utils/message'
import Button from '@/components/Button.vue'
import NumberInput from '@/components/NumberInput.vue'
import { useI18nContext } from '@/i18n/useI18nContext'

const { LL } = useI18nContext()

interface InsertData {
  row: number
  col: number
}

const emit = defineEmits<{
  (event: 'insert', payload: InsertData): void
  (event: 'close'): void
}>()

const endCell = ref<number[]>([])
const customRow = ref(3)
const customCol = ref(3)
const isCustom = ref(false)

const tableTitle = computed(() => {
  if (!endCell.value.length) return LL.value.editor.canvasTool.tableGenerator.table()
  const [rows, cols] = endCell.value
  return LL.value.editor.canvasTool.tableGenerator.tableWithSize({ rows, cols })
})

const handleClickTable = () => {
  if (!endCell.value.length) return
  const [row, col] = endCell.value
  emit('insert', { row, col })
}

const insertCustomTable = () => {
  if (customRow.value < 1 || customRow.value > 20) return message.warning(LL.value.editor.canvasTool.tableGenerator.rowColRangeWarning())
  if (customCol.value < 1 || customCol.value > 20) return message.warning(LL.value.editor.canvasTool.tableGenerator.rowColRangeWarning())
  emit('insert', { row: customRow.value, col: customCol.value })
  isCustom.value = false
}

const close = () => {
  emit('close')
  isCustom.value = false
}
</script>

<style lang="scss" scoped>
.table-generator {
  width: 100%;
  margin-top: -10px;
}
.title {
  height: 28px;
  line-height: 28px;
  background-color: $lightGray;
  margin: 0 -10px 10px -10px;
  padding: 0 14px;
  font-size: 12px;
  display: flex;
  justify-content: space-between;
  border-top-left-radius: $borderRadius;
  border-top-right-radius: $borderRadius;
  user-select: none;

  .right {
    cursor: pointer;

    &:hover {
      color: $themeColor;
    }
  }
}
table {
  border-collapse: separate;
}
td {
  width: 23px;
  height: 23px;
  line-height: 23px;
  border: 2px solid #fff;
  background-color: #f7f7f7;
}
.cell {
  width: 100%;
  height: 100%;
  border: 1px solid #dcdcdc;

  &.active {
    background-color: rgba($color: $themeColor, $alpha: .1);
    border-color: $themeColor;
  }
}

.custom {
  width: 230px;

  .row {
    display: flex;
    align-items: center;

    & + .row {
      margin-top: 10px;
    }
  }
}

.btns {
  margin-top: 10px;
  text-align: right;

  .btn {
    margin-left: 10px;
  }
}
</style>
