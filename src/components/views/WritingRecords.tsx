import { ClipboardList } from 'lucide-react'
import { PlaceholderView } from './PlaceholderView'

export function WritingRecords() {
  return (
    <PlaceholderView
      title="写作记录"
      description="这里将展示你的历史写作与批改记录。"
      icon={ClipboardList}
    />
  )
}
