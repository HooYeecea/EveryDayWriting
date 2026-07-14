import { Extension } from '@tiptap/core'
import { Plugin, PluginKey, type Transaction } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import type { ReplaceStep } from '@tiptap/pm/transform'
import { isTypingAnimationEnabled } from '../../storage/typingAnimationStorage'

const ANIMATION_DURATION_MS = 400
/** 单次 transaction 最多动画的字符数（超过此值跳过，处理粘贴场景） */
const MAX_CHARS_PER_TRANSACTION = 200

const pluginKey = new PluginKey<DecorationSet>('typingAnimation')

interface DecorationSpec {
  createdAt: number
}

/**
 * 从 transaction 的 steps 中找出所有纯插入（无删除）的文本范围，
 * 返回它们在最终文档中的位置。
 */
function getInsertedRanges(tr: Transaction): Array<{ from: number; to: number }> {
  const ranges: Array<{ from: number; to: number }> = []
  let totalInserted = 0

  for (let i = 0; i < tr.steps.length; i++) {
    const step = tr.steps[i] as ReplaceStep

    // 只处理纯插入（from === to 表示没有删除任何内容）
    if (!step.slice || step.from !== step.to) continue

    const insertedLen = step.slice.content.size
    if (insertedLen === 0) continue

    totalInserted += insertedLen

    // 映射 from 位置：先经过前 i 个步骤
    let pos = step.from
    for (let j = 0; j < i; j++) {
      pos = tr.steps[j].getMap().map(pos)
    }

    // 现在 pos 是插入点在 post-step-(i-1) 文档中的位置
    // 插入内容在 post-step-i 文档中占据 [pos, pos + insertedLen)
    let rangeFrom = pos
    let rangeTo = pos + insertedLen

    // 经过当前步骤之后的剩余步骤映射到最终文档
    // 注意：不能包含 step i 自身，因为 [rangeFrom, rangeTo) 已经是 post-step-i 的坐标
    for (let j = i + 1; j < tr.steps.length; j++) {
      rangeFrom = tr.steps[j].getMap().map(rangeFrom)
      rangeTo = tr.steps[j].getMap().map(rangeTo)
    }

    if (rangeFrom < rangeTo && rangeFrom < tr.doc.content.size) {
      ranges.push({ from: rangeFrom, to: Math.min(rangeTo, tr.doc.content.size) })
    }
  }

  // 超过阈值则跳过动画（大段粘贴等场景）
  if (totalInserted > MAX_CHARS_PER_TRANSACTION) {
    return []
  }

  return ranges
}

export const TypingAnimation = Extension.create({
  name: 'typingAnimation',

  addProseMirrorPlugins() {
    return [
      new Plugin<DecorationSet>({
        key: pluginKey,

        state: {
          init() {
            return DecorationSet.empty
          },

          apply(tr, oldSet, _oldState, _newState) {
            // 用户关闭时直接清除所有装饰
            if (!isTypingAnimationEnabled()) {
              return DecorationSet.empty
            }

            const now = Date.now()

            // 1. 将已有装饰映射过当前 transaction
            let currentSet = oldSet.map(tr.mapping, tr.doc)

            // 2. 清理过期的装饰
            const active: Decoration[] = []
            currentSet.find().forEach((dec) => {
              const spec = dec.spec as DecorationSpec
              if (spec.createdAt && now - spec.createdAt < ANIMATION_DURATION_MS) {
                active.push(dec)
              }
            })
            currentSet = DecorationSet.create(tr.doc, active)

            // 3. 为本次新插入的文本创建装饰
            const ranges = getInsertedRanges(tr)
            if (ranges.length > 0) {
              const newDecorations: Decoration[] = []
              for (const { from, to } of ranges) {
                if (from < to) {
                  newDecorations.push(
                    Decoration.inline(
                      from,
                      to,
                      { class: 'typing-char-animation' },
                      {
                        createdAt: now,
                        inclusiveStart: false,
                        inclusiveEnd: false,
                      },
                    ),
                  )
                }
              }
              currentSet = currentSet.add(tr.doc, newDecorations)
            }

            return currentSet
          },
        },

        props: {
          decorations(state) {
            return pluginKey.getState(state) ?? DecorationSet.empty
          },
        },
      }),
    ]
  },
})
