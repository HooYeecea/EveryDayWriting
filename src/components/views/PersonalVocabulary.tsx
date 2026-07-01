import { BookOpen } from 'lucide-react'
import { PlaceholderView } from './PlaceholderView'

export function PersonalVocabulary() {
  return (
    <PlaceholderView
      title="个人词库"
      description="这里将管理你在写作中积累的词汇与短语。"
      icon={BookOpen}
    />
  )
}
