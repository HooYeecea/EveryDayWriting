import { useState } from 'react'
import { FileCheck, Lightbulb, Sparkles, Wand2 } from 'lucide-react'

export function WritingAiAssist() {
  const [postSubmitReview, setPostSubmitReview] = useState(false)
  const [postSubmitSuggestions, setPostSubmitSuggestions] = useState(false)
  const [realtimeAssist, setRealtimeAssist] = useState(false)

  return (
    <section className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
      <div className="flex items-center gap-2">
        <Sparkles size={18} className="text-neutral-500" strokeWidth={1.75} />
        <h4 className="text-sm font-medium text-neutral-900">AI 助手</h4>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-neutral-500">
        按需开启 AI 辅助，帮助检查、修改写作并在过程中提供建议。
      </p>

      <div className="mt-4 space-y-3">
        <div>
          <p className="text-xs font-medium text-neutral-600">提交后辅助</p>
          <p className="mt-1 text-[11px] leading-relaxed text-neutral-400">
            提交完成后由 AI 处理，不影响当前写作流程。
          </p>
          <div className="mt-2 space-y-2">
            <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2.5">
              <input
                type="checkbox"
                checked={postSubmitReview}
                onChange={(e) => setPostSubmitReview(e.target.checked)}
                className="mt-0.5 rounded border-neutral-300"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <Wand2 size={14} className="shrink-0 text-neutral-400" />
                  <span className="text-xs font-medium text-neutral-800">AI 检查与修改</span>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">
                  提交后自动检查语法、表达等问题，并给出修改版本供参考。
                </p>
              </div>
            </label>
            <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2.5">
              <input
                type="checkbox"
                checked={postSubmitSuggestions}
                onChange={(e) => setPostSubmitSuggestions(e.target.checked)}
                className="mt-0.5 rounded border-neutral-300"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <Lightbulb size={14} className="shrink-0 text-neutral-400" />
                  <span className="text-xs font-medium text-neutral-800">提升建议</span>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">
                  提交后综合点评文章结构与语言，给出针对性的进步建议。
                </p>
              </div>
            </label>
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-neutral-600">写作过程中</p>
          <div className="mt-2">
            <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2.5">
              <input
                type="checkbox"
                checked={realtimeAssist}
                onChange={(e) => setRealtimeAssist(e.target.checked)}
                className="mt-0.5 rounded border-neutral-300"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <FileCheck size={14} className="shrink-0 text-neutral-400" />
                  <span className="text-xs font-medium text-neutral-800">实时辅助写作</span>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">
                  边写边获得 AI 提示，包括用词、句式和结构方面的即时建议。
                </p>
              </div>
            </label>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-dashed border-neutral-300 bg-white px-3 py-3">
        <p className="text-[11px] leading-relaxed text-neutral-400">
          以上选项仅为功能预览，保存后将应用于后续写作。具体 AI 能力即将上线。
        </p>
      </div>

      <button
        type="button"
        disabled
        className="mt-3 w-full rounded-lg bg-neutral-900 py-2 text-sm font-medium text-white opacity-50"
      >
        保存设置（即将上线）
      </button>
    </section>
  )
}
