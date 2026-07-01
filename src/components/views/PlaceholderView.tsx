import type { LucideIcon } from 'lucide-react'
import { Construction } from 'lucide-react'

interface PlaceholderViewProps {
  title: string
  description?: string
  icon?: LucideIcon
}

export function PlaceholderView({
  title,
  description = '该功能正在开发中，敬请期待。',
  icon: Icon = Construction,
}: PlaceholderViewProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8 py-16">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-100">
        <Icon size={28} className="text-neutral-400" strokeWidth={1.5} />
      </div>
      <h2 className="mt-5 text-lg font-medium text-neutral-800">{title}</h2>
      <p className="mt-2 max-w-sm text-center text-sm text-neutral-400">
        {description}
      </p>
    </div>
  )
}
