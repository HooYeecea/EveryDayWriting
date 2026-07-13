import type { ReactNode } from 'react'

const GRAMMAR_LABELS: Record<string, { text: string; className: string }> = {
  original: { text: '原文', className: 'text-red-600 line-through' },
  correction: { text: '修改', className: 'font-medium text-green-700' },
  explanation: { text: '说明', className: 'text-neutral-600' },
}

function stripOuterQuotes(value: string): string {
  const trimmed = value.trim()
  const match = trimmed.match(/^["'](.+)["']$/)
  return match ? match[1] : trimmed
}

function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = []
  let rest = text
  let index = 0
  let guard = 0

  while (rest.length > 0) {
    guard += 1
    if (guard > text.length + 32) {
      nodes.push(rest)
      break
    }

    const boldMatch = rest.match(/^\*\*(.+?)\*\*/)
    if (boldMatch) {
      nodes.push(
        <strong key={`b-${index++}`} className="font-medium text-neutral-800">
          {boldMatch[1]}
        </strong>,
      )
      rest = rest.slice(boldMatch[0].length)
      continue
    }

    const doubleQuoteMatch = rest.match(/^"([^"]*)"/)
    if (doubleQuoteMatch) {
      nodes.push(
        <span
          key={`q-${index++}`}
          className="rounded bg-white px-1.5 py-0.5 font-mono text-[13px] text-neutral-800 ring-1 ring-neutral-200"
        >
          {doubleQuoteMatch[1]}
        </span>,
      )
      rest = rest.slice(doubleQuoteMatch[0].length)
      continue
    }

    const singleQuoteMatch = rest.match(/^'([^']*)'/)
    if (singleQuoteMatch) {
      nodes.push(
        <span
          key={`q-${index++}`}
          className="rounded bg-white px-1.5 py-0.5 font-mono text-[13px] text-neutral-800 ring-1 ring-neutral-200"
        >
          {singleQuoteMatch[1]}
        </span>,
      )
      rest = rest.slice(singleQuoteMatch[0].length)
      continue
    }

    const nextSpecial = rest.search(/\*\*|["']/)
    if (nextSpecial === -1) {
      nodes.push(rest)
      break
    }

    if (nextSpecial > 0) {
      nodes.push(rest.slice(0, nextSpecial))
      rest = rest.slice(nextSpecial)
      continue
    }

    // 未闭合的 ** 或引号：当作普通字符消费，避免死循环
    nodes.push(rest[0])
    rest = rest.slice(1)
  }

  return nodes
}

function parseGrammarLabelLine(line: string): { label: string; value: string } | null {
  const match = line.trim().match(/^(?:\d+\.\s*)?\*\*(Original|Correction|Explanation)\*\*:\s*(.+)$/i)
  if (!match) return null
  return { label: match[1].toLowerCase(), value: stripOuterQuotes(match[2]) }
}

function renderGrammarLabel(label: string, value: string, key: number): ReactNode {
  const meta = GRAMMAR_LABELS[label] ?? {
    text: label,
    className: 'text-neutral-700',
  }

  return (
    <p key={key} className="text-sm leading-relaxed text-neutral-700">
      <span className="mr-1.5 text-xs font-medium text-neutral-500">{meta.text}</span>
      <span className={meta.className}>{renderInline(value)}</span>
    </p>
  )
}

function renderHeading(line: string, key: number): ReactNode | null {
  const trimmed = line.trim()
  if (trimmed.startsWith('### ')) {
    return (
      <h3 key={key} className="mt-4 text-sm font-semibold text-neutral-800 first:mt-0">
        {renderInline(trimmed.slice(4))}
      </h3>
    )
  }
  if (trimmed.startsWith('## ')) {
    return (
      <h2 key={key} className="mt-4 text-base font-semibold text-neutral-900 first:mt-0">
        {renderInline(trimmed.slice(3))}
      </h2>
    )
  }
  return null
}

type ContentBlock =
  | { type: 'grammar-group'; index: number; lines: Array<{ label: string; value: string }> }
  | { type: 'paragraph'; line: string }
  | { type: 'bullet'; line: string }

function buildBlocks(content: string): ContentBlock[] {
  const lines = content.replace(/\r\n/g, '\n').split('\n')
  const blocks: ContentBlock[] = []
  let grammarGroup: Array<{ label: string; value: string }> | null = null
  let grammarIndex = 0

  const flushGrammarGroup = () => {
    if (grammarGroup && grammarGroup.length > 0) {
      blocks.push({ type: 'grammar-group', index: grammarIndex, lines: grammarGroup })
      grammarGroup = null
    }
  }

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) {
      flushGrammarGroup()
      continue
    }

    const grammar = parseGrammarLabelLine(trimmed)
    if (grammar) {
      if (!grammarGroup) {
        grammarIndex += 1
        grammarGroup = []
      }
      grammarGroup.push(grammar)
      continue
    }

    flushGrammarGroup()
    if (trimmed.startsWith('- ')) {
      blocks.push({ type: 'bullet', line: trimmed.slice(2) })
    } else {
      blocks.push({ type: 'paragraph', line: trimmed })
    }
  }

  flushGrammarGroup()
  return blocks
}

function renderBlock(block: ContentBlock, key: number): ReactNode {
  if (block.type === 'grammar-group') {
    return (
      <div key={key} className="mt-3 rounded-lg bg-white p-3 shadow-sm first:mt-0">
        <p className="mb-2 text-xs font-medium text-neutral-400">第 {block.index} 处</p>
        <div className="space-y-1.5">
          {block.lines.map((item, index) => renderGrammarLabel(item.label, item.value, index))}
        </div>
      </div>
    )
  }

  if (block.type === 'bullet') {
    return (
      <li key={key} className="ml-4 list-disc text-sm leading-relaxed text-neutral-700">
        {renderInline(block.line)}
      </li>
    )
  }

  const heading = renderHeading(block.line, key)
  if (heading) return heading

  return (
    <p key={key} className="text-sm leading-relaxed text-neutral-700">
      {renderInline(block.line)}
    </p>
  )
}

interface AiMarkdownContentProps {
  content: string
  className?: string
}

export function AiMarkdownContent({ content, className = '' }: AiMarkdownContentProps) {
  const blocks = buildBlocks(content)

  return <div className={`space-y-1 ${className}`}>{blocks.map(renderBlock)}</div>
}
