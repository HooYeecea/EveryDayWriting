import { BookOpen, HelpCircle, MessageCircle, Mic, Target, Zap, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useProficiencyGuideRedDot } from '../../hooks/useProficiencyGuideRedDot'
import { MAIN_CONTENT_X_CLASS, PANEL_HEADER_CLASS, PANEL_TITLE_CLASS } from '../layout/layoutConstants'

export function UsageGuide() {
  const { user, isAuthenticated } = useAuth()
  const onboarding = user?.proficiencyOnboarding
  const showGuideRedDot = useProficiencyGuideRedDot()
  const showTestEntry = isAuthenticated && showGuideRedDot

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className={PANEL_HEADER_CLASS}>
        <div className="flex items-center gap-2">
          <HelpCircle size={18} className="text-neutral-500" />
          <h1 className={PANEL_TITLE_CLASS}>使用指南</h1>
          {showTestEntry && (
            <span className="h-2 w-2 rounded-full bg-red-500" aria-label="未完成能力测评" />
          )}
        </div>
      </div>

      <div className={`flex-1 overflow-y-auto py-5 sm:py-8 ${MAIN_CONTENT_X_CLASS}`}>
        <div className="mx-auto max-w-2xl space-y-6">
          {showTestEntry && (
            <section className="rounded-2xl border border-neutral-900 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="relative mt-0.5">
                    <Target size={18} className="text-neutral-700" />
                    <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-red-500" />
                  </div>
                  <div>
                    <h2 className="text-sm font-medium text-neutral-900">英语能力测评</h2>
                    <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                      {onboarding?.status === 'in_progress'
                        ? '你有一份未完成的能力测评，继续完成后可获得个人写作提升计划。'
                        : '你还没有完成英语水平测评。约 5–8 分钟（自评 + 递进基础题 + 双写作），完成后会生成更适合你的练习规划。'}
                    </p>
                  </div>
                </div>
                <Link
                  to="/proficiency-test"
                  className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-neutral-900 px-3 py-2 text-xs font-medium text-white hover:bg-neutral-800"
                >
                  {onboarding?.status === 'in_progress' ? '继续测评' : '开始测评'}
                  <ArrowRight size={14} />
                </Link>
              </div>
            </section>
          )}

          <div className="rounded-2xl border border-neutral-300 bg-neutral-50 p-5 sm:p-6">
            <p className="text-sm font-medium text-neutral-800">公益声明</p>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">
              本项目为<span className="font-medium text-neutral-900">纯公益项目</span>
              ，不收取任何费用，不从任何第三方平台赚取佣金或返利。
              页面中提及的所有第三方服务（DeepSeek、ChatGPT、Gemini 等）均为独立商业产品，
              请自行判断是否购买，本站不提供任何购买链接，也不对第三方服务的质量或收费承担任何责任。
            </p>
          </div>

          <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-2">
              <Zap size={18} className="text-neutral-500" />
              <h2 className="text-sm font-medium text-neutral-900">如何获取和配置 API Token</h2>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-neutral-600">
              本网站的 AI 批改、语法纠错、词汇建议等功能依赖大语言模型 API。
              你需要自行前往第三方平台购买 API Token，并在网站中配置后才能正常使用。
            </p>
            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-4">
                <h3 className="text-sm font-medium text-neutral-800">第一步：购买 API Token</h3>
                <p className="mt-1 text-xs leading-relaxed text-neutral-500">
                  推荐使用 <span className="font-medium text-neutral-700">DeepSeek</span>
                  ，目前性价比最高的中文友好大模型服务。请自行前往 DeepSeek 开放平台注册并购买 API
                  额度。费用极低，日常写作练习每月仅需几元钱。
                </p>
                <p className="mt-2 text-xs text-neutral-400">
                  提示：请自行搜索「DeepSeek 开放平台」进入官网，在 API Keys 页面创建 Key 并充值。
                </p>
              </div>
              <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-4">
                <h3 className="text-sm font-medium text-neutral-800">第二步：在网站中填入 Token</h3>
                <p className="mt-1 text-xs leading-relaxed text-neutral-500">
                  进入
                  <span className="font-medium text-neutral-700">用户中心 → 设置 → AI 连接配置</span>
                  ，选择 Provider（DeepSeek），粘贴你的 API Key，点击「加密并保存」即可。
                </p>
                <p className="mt-1 text-xs text-neutral-400">
                  Key 会加密存储在本地浏览器中，不会上传到服务器。
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-2">
              <BookOpen size={18} className="text-neutral-500" />
              <h2 className="text-sm font-medium text-neutral-900">
                为什么 AI 辅助英语写作是最佳学习路径
              </h2>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-neutral-600">
              传统的英语学习方式——背单词、刷题、听课——最大的问题是
              <span className="font-medium text-neutral-900">缺乏即时反馈</span>
              。你写完一篇文章，可能要等到老师批改才能知道错在哪里，这个延迟严重降低了学习效率。
            </p>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">
              AI 改变了这一切：你提交一篇文章，
              <span className="font-medium text-neutral-900">
                几秒钟内就能收到语法纠错、词汇优化建议和雅思标准评分
              </span>
              。这种即时反馈循环让每一次写作都变成一次精准的学习机会。
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {[
                { label: '即时语法纠错', desc: '每次写作即改即学' },
                { label: '词汇升级建议', desc: '地道表达替代平庸用词' },
                { label: '雅思标准评分', desc: '量化追踪写作进步' },
              ].map(({ label, desc }) => (
                <div
                  key={label}
                  className="rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2.5 text-center"
                >
                  <p className="text-xs font-medium text-neutral-800">{label}</p>
                  <p className="mt-0.5 text-[11px] text-neutral-500">{desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-2">
              <Mic size={18} className="text-neutral-500" />
              <h2 className="text-sm font-medium text-neutral-900">推荐搭配使用的工具</h2>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-neutral-600">
              本网站专注于
              <span className="font-medium text-neutral-900">写作训练</span>
              ，但要全面提升英语能力，口语同样不可忽视。以下工具与本网站互补，建议搭配使用：
            </p>
            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-4">
                <div className="flex items-center gap-2">
                  <MessageCircle size={16} className="text-neutral-500" />
                  <h3 className="text-sm font-medium text-neutral-800">ChatGPT 语音模式</h3>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-neutral-500">
                  ChatGPT 的 Advanced Voice Mode 是目前最自然的 AI 口语陪练工具。
                  你可以和它进行自由对话，它会纠正你的发音和表达，模拟真实对话场景。
                  支持随时打断、语调自然，体验非常接近真人对话。
                </p>
              </div>
              <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-4">
                <div className="flex items-center gap-2">
                  <Mic size={16} className="text-neutral-500" />
                  <h3 className="text-sm font-medium text-neutral-800">豆包 App 语音对话</h3>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-neutral-500">
                  字节跳动的豆包 App 提供免费的 AI 语音对话功能，中英文切换流畅，
                  适合日常口语练习。无需付费即可使用基础语音功能。
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-2">
              <BookOpen size={18} className="text-neutral-500" />
              <h2 className="text-sm font-medium text-neutral-900">词汇量目标：7000 词</h2>
            </div>
            <div className="mt-3 space-y-2">
              <p className="text-sm leading-relaxed text-neutral-600">
                7000 个单词听起来很多，但如果每天背 20 个新词并复习旧词，一年之内就能完成。
                一年之后，你会发现大部分英文内容——新闻、论文、小说、电影字幕——都不再需要频繁查字典。
              </p>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                与此同时，AI 写作工具让这些单词
                <span className="font-medium text-neutral-900">从认知词汇转变为运用词汇</span>
                ——你在写作中真正用出来的词，永远不会忘记。
              </p>
            </div>
            <p className="mt-4 text-center text-xs text-neutral-400">
              词汇决定理解的广度，写作决定表达的深度。两者结合，才是完整的英语能力。
            </p>
          </section>

          <p className="pb-6 text-center text-xs text-neutral-300">
            Everyday Writing · 每日英语写作 · 纯公益项目
          </p>
        </div>
      </div>
    </div>
  )
}
