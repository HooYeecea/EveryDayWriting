import type { AppLocale } from '../types/preferences'

export interface PrivacyPolicySection {
  title: string
  content: string
}

export const PRIVACY_POLICY_UPDATED_AT = '2026-07-01'

const zhSections: PrivacyPolicySection[] = [
  {
    title: '一、引言',
    content:
      '欢迎使用 Everyday Writing（每日英语写作）。我们重视您的隐私与个人信息保护。本隐私协议说明我们如何收集、使用、存储及保护您的信息。使用本服务即表示您已阅读并理解本协议。',
  },
  {
    title: '二、我们收集的信息',
    content:
      '为提供写作、保存、提交及学习统计等功能，我们可能收集：账号信息（邮箱、昵称、头像）、写作内容（标题、正文、题目关联信息）、使用行为数据（登录时间、操作记录）以及为保障服务安全所必需的技术信息（如 IP 地址、设备类型）。',
  },
  {
    title: '三、信息的使用方式',
    content:
      '您的信息将用于：提供与改进产品功能；保存和同步您的写作草稿与提交记录；展示个人学习统计；保障账号与系统安全；在法律法规要求范围内配合监管。我们不会将您的写作内容用于本协议未说明的其他商业目的。',
  },
  {
    title: '四、信息的存储与保护',
    content:
      '我们采取合理的技术与管理措施保护您的数据，包括传输加密、访问控制、密码哈希存储等。写作数据存储于受保护的服务器或经授权的存储系统中。尽管我们尽力保障安全，互联网传输无法保证绝对安全，请您妥善保管账号密码。',
  },
  {
    title: '五、第三方与大模型服务',
    content:
      '若您使用 AI 批改等功能，相关 Prompt 由本服务提供，而大模型 API 密钥由您在前端本地配置并直连第三方服务。我们不会收集、存储或转发您的 LLM API Token。向第三方发送的内容由您主动触发，请查阅相应服务商的隐私政策。',
  },
  {
    title: '六、您的权利',
    content:
      '您有权访问、更正或删除您的个人信息及写作记录（在法律及技术可行范围内）；有权注销账号；有权撤回对本协议的同意（撤回后可能无法继续使用部分功能）。如需行使上述权利，可通过应用内用户中心或联系客服处理。',
  },
  {
    title: '七、未成年人保护',
    content:
      '若您未满 18 周岁，请在监护人陪同下阅读本协议，并在取得监护人同意后使用本服务。我们不会故意收集未成年人的个人信息。',
  },
  {
    title: '八、协议更新',
    content:
      '我们可能适时修订本隐私协议。重大变更将通过应用内通知或其他适当方式告知。更新后继续使用服务，即视为接受修订后的协议。',
  },
  {
    title: '九、联系我们',
    content:
      '如对本隐私协议有任何疑问，请通过应用内反馈渠道或官方邮箱与我们联系。我们将在合理期限内予以答复。',
  },
]

const enSections: PrivacyPolicySection[] = [
  {
    title: '1. Introduction',
    content:
      'Welcome to Everyday Writing. We value your privacy and personal information. This Privacy Policy explains how we collect, use, store, and protect your information. By using this service, you confirm that you have read and understood this policy.',
  },
  {
    title: '2. Information We Collect',
    content:
      'To provide writing, saving, submission, and learning statistics features, we may collect: account information (email, nickname, avatar), writing content (title, body, topic-related data), usage behavior (login times, activity logs), and technical information needed for security (such as IP address and device type).',
  },
  {
    title: '3. How We Use Information',
    content:
      'Your information is used to: provide and improve product features; save and sync drafts and submissions; show personal learning statistics; protect account and system security; and comply with applicable laws. We will not use your writing content for commercial purposes beyond what this policy describes.',
  },
  {
    title: '4. Storage and Protection',
    content:
      'We use reasonable technical and organizational measures to protect your data, including transport encryption, access control, and hashed password storage. Writing data is stored on protected servers or authorized storage systems. Absolute security cannot be guaranteed on the internet; please keep your account credentials safe.',
  },
  {
    title: '5. Third Parties and LLM Services',
    content:
      'If you use AI grading or similar features, prompts are provided by this service, while LLM API keys are configured locally in your browser and connect directly to third-party providers. We do not collect, store, or forward your LLM API tokens. Content sent to third parties is triggered by you; please review each provider’s privacy policy.',
  },
  {
    title: '6. Your Rights',
    content:
      'You may access, correct, or delete your personal information and writing records where legally and technically feasible; close your account; and withdraw consent to this policy (some features may become unavailable). To exercise these rights, use the in-app profile center or contact support.',
  },
  {
    title: '7. Protection of Minors',
    content:
      'If you are under 18, please read this policy with a guardian and use the service only with their consent. We do not knowingly collect personal information from minors.',
  },
  {
    title: '8. Policy Updates',
    content:
      'We may update this Privacy Policy from time to time. Material changes will be announced in-app or by other appropriate means. Continued use after an update means you accept the revised policy.',
  },
  {
    title: '9. Contact Us',
    content:
      'If you have questions about this Privacy Policy, contact us through in-app feedback or our official email. We will respond within a reasonable time.',
  },
]

const jaSections: PrivacyPolicySection[] = [
  {
    title: '1. はじめに',
    content:
      'Everyday Writing（毎日の英語ライティング）へようこそ。当社はお客様のプライバシーと個人情報の保護を重視します。本プライバシーポリシーは、情報の収集・利用・保存・保護の方法を説明します。本サービスを利用することで、本ポリシーを読み理解したことになります。',
  },
  {
    title: '2. 収集する情報',
    content:
      '執筆・保存・提出・学習統計などの機能提供のため、アカウント情報（メール、ニックネーム、アバター）、執筆内容（タイトル、本文、課題関連情報）、利用行動データ（ログイン時刻、操作記録）、およびサービス保安に必要な技術情報（IP アドレス、端末種別など）を収集する場合があります。',
  },
  {
    title: '3. 情報の利用方法',
    content:
      'お客様の情報は、機能の提供と改善、下書きと提出記録の保存・同期、学習統計の表示、アカウントとシステムの保安、法令に基づく対応に使用します。本ポリシーに記載のない商業目的で執筆内容を利用しません。',
  },
  {
    title: '4. 保存と保護',
    content:
      '通信暗号化、アクセス制御、パスワードのハッシュ保存など、合理的な技術・管理措置を講じます。執筆データは保護されたサーバーまたは認可された保存システムに置かれます。インターネット上で絶対的な安全は保証できないため、アカウント情報はご自身で適切に管理してください。',
  },
  {
    title: '5. 第三者および大規模言語モデル',
    content:
      'AI 添削などを利用する場合、Prompt は本サービスが提供し、LLM API キーはお客様がブラウザでローカル設定し第三者へ直接接続します。当社は LLM API Token を収集・保存・転送しません。第三者へ送る内容はお客様の操作によるものです。各サービス提供者のプライバシーポリシーをご確認ください。',
  },
  {
    title: '6. お客様の権利',
    content:
      '法令および技術上可能な範囲で、個人情報と執筆記録へのアクセス・訂正・削除、アカウントの削除、本ポリシーへの同意の撤回（撤回後は一部機能が利用できない場合があります）が可能です。権利行使はアプリ内のユーザーセンターまたはサポートまでご連絡ください。',
  },
  {
    title: '7. 未成年者の保護',
    content:
      '18 歳未満の方は、保護者と一緒に本ポリシーを読み、同意を得たうえで本サービスをご利用ください。当社は未成年者の個人情報を故意に収集しません。',
  },
  {
    title: '8. ポリシーの更新',
    content:
      '本プライバシーポリシーは随時改定することがあります。重要な変更はアプリ内通知など適切な方法でお知らせします。更新後もサービスを継続利用した場合、改定後のポリシーに同意したものとみなします。',
  },
  {
    title: '9. お問い合わせ',
    content:
      '本ポリシーについてご質問がある場合は、アプリ内フィードバックまたは公式メールでご連絡ください。合理的な期間内に回答します。',
  },
]

const koSections: PrivacyPolicySection[] = [
  {
    title: '1. 서문',
    content:
      'Everyday Writing(매일 영어 글쓰기)에 오신 것을 환영합니다. 저희는 귀하의 개인정보 보호를 중요하게 생각합니다. 본 개인정보 처리방침은 정보의 수집·이용·저장·보호 방법을 설명합니다. 본 서비스를 이용함으로써 본 방침을 읽고 이해한 것으로 간주됩니다.',
  },
  {
    title: '2. 수집하는 정보',
    content:
      '글쓰기·저장·제출·학습 통계 기능을 제공하기 위해 계정 정보(이메일, 닉네임, 아바타), 작성 내용(제목, 본문, 주제 관련 정보), 이용 행위 데이터(로그인 시각, 조작 기록), 서비스 보안에 필요한 기술 정보(IP 주소, 기기 유형 등)를 수집할 수 있습니다.',
  },
  {
    title: '3. 정보 이용 방식',
    content:
      '귀하의 정보는 제품 기능 제공 및 개선, 초안·제출 기록 저장과 동기화, 개인 학습 통계 표시, 계정·시스템 보안, 법령에 따른 협조에 사용됩니다. 본 방침에 명시되지 않은 상업적 목적으로 작성 내용을 이용하지 않습니다.',
  },
  {
    title: '4. 저장 및 보호',
    content:
      '전송 암호화, 접근 제어, 비밀번호 해시 저장 등 합리적인 기술·관리 조치를 적용합니다. 작성 데이터는 보호된 서버 또는 승인된 저장 시스템에 보관됩니다. 인터넷 환경에서 절대적 보안은 보장할 수 없으니 계정 정보를 안전하게 관리해 주세요.',
  },
  {
    title: '5. 제3자 및 대규모 언어 모델',
    content:
      'AI 첨삭 등을 사용할 경우 Prompt는 본 서비스가 제공하며, LLM API 키는 브라우저에 로컬로 설정되어 제3자 서비스에 직접 연결됩니다. 저희는 LLM API Token을 수집·저장·전달하지 않습니다. 제3자로 전송되는 내용은 귀하의 조작에 의한 것이므로 각 제공자의 개인정보 처리방침을 확인해 주세요.',
  },
  {
    title: '6. 귀하의 권리',
    content:
      '법률 및 기술적으로 가능한 범위에서 개인정보와 작성 기록에 대한 열람·정정·삭제, 계정 해지, 본 방침 동의 철회(철회 후 일부 기능을 이용하지 못할 수 있음)가 가능합니다. 권리 행사는 앱 내 사용자 센터 또는 고객 지원으로 문의해 주세요.',
  },
  {
    title: '7. 미성년자 보호',
    content:
      '만 18세 미만인 경우 보호자와 함께 본 방침을 읽고, 보호자 동의를 받은 후 서비스를 이용해 주세요. 저희는 고의로 미성년자의 개인정보를 수집하지 않습니다.',
  },
  {
    title: '8. 방침 업데이트',
    content:
      '본 개인정보 처리방침은 수시로 개정될 수 있습니다. 중요한 변경은 앱 내 알림 등 적절한 방법으로 안내합니다. 업데이트 후에도 서비스를 계속 이용하면 개정된 방침에 동의한 것으로 봅니다.',
  },
  {
    title: '9. 문의',
    content:
      '본 방침에 대한 문의는 앱 내 피드백 또는 공식 이메일로 연락해 주세요. 합리적인 기한 내에 답변드리겠습니다.',
  },
]

const PRIVACY_POLICY_BY_LOCALE: Record<AppLocale, PrivacyPolicySection[]> = {
  zh: zhSections,
  en: enSections,
  ja: jaSections,
  ko: koSections,
}

/** 按界面语言返回前端本地隐私协议正文 */
export function getPrivacyPolicySections(locale: AppLocale): PrivacyPolicySection[] {
  return PRIVACY_POLICY_BY_LOCALE[locale] ?? zhSections
}

/** @deprecated 请用 getPrivacyPolicySections(locale) */
export const PRIVACY_POLICY_SECTIONS = zhSections
