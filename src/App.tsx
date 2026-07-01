import { useState } from 'react'
import { Layout } from './components/layout/Layout'
import { UserCenter } from './components/views/UserCenter'
import { StartWriting } from './components/views/StartWriting'
import { WritingRecords } from './components/views/WritingRecords'
import { PersonalVocabulary } from './components/views/PersonalVocabulary'
import { PersonalAssessment } from './components/views/PersonalAssessment'
import type { MenuKey } from './types'

function App() {
  const [activeMenu, setActiveMenu] = useState<MenuKey>('start-writing')

  const renderContent = () => {
    switch (activeMenu) {
      case 'user-center':
        return <UserCenter />
      case 'start-writing':
        return <StartWriting />
      case 'writing-records':
        return <WritingRecords />
      case 'personal-vocabulary':
        return <PersonalVocabulary />
      case 'personal-assessment':
        return <PersonalAssessment />
      default:
        return null
    }
  }

  return (
    <Layout activeKey={activeMenu} onMenuSelect={setActiveMenu}>
      {renderContent()}
    </Layout>
  )
}

export default App
