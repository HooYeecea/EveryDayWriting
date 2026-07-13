import {
  BookOpen,
  ClipboardList,
  PenLine,
  User,
  BarChart3,
  HelpCircle,
} from 'lucide-react'

export const NAV_ICON_MAP = {
  user: User,
  pen: PenLine,
  clipboard: ClipboardList,
  book: BookOpen,
  chart: BarChart3,
  help: HelpCircle,
} as const
