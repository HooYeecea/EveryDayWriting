import type { AppLocale } from '../types/preferences'
import { toTraditionalChinese } from '../i18n/traditionalChinese'

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

const frSections: PrivacyPolicySection[] = [
  {
    title: '1. Introduction',
    content:
      'Bienvenue sur Everyday Writing. Nous accordons une grande importance à votre vie privée et à vos informations personnelles. La présente Politique de confidentialité explique comment nous collectons, utilisons, stockons et protégeons vos informations. En utilisant ce service, vous confirmez avoir lu et compris cette politique.',
  },
  {
    title: '2. Informations que nous collectons',
    content:
      'Pour fournir les fonctionnalités d’écriture, d’enregistrement, de soumission et de statistiques d’apprentissage, nous pouvons collecter : les informations de compte (e-mail, pseudonyme, avatar), le contenu rédigé (titre, corps du texte, données liées au sujet), le comportement d’utilisation (heures de connexion, journaux d’activité) et les informations techniques nécessaires à la sécurité (telles que l’adresse IP et le type d’appareil).',
  },
  {
    title: '3. Comment nous utilisons les informations',
    content:
      'Vos informations sont utilisées pour : fournir et améliorer les fonctionnalités du produit ; enregistrer et synchroniser les brouillons et les soumissions ; afficher les statistiques d’apprentissage personnelles ; protéger la sécurité du compte et du système ; et respecter les lois applicables. Nous n’utiliserons pas votre contenu rédigé à des fins commerciales au-delà de ce que décrit cette politique.',
  },
  {
    title: '4. Stockage et protection',
    content:
      'Nous mettons en œuvre des mesures techniques et organisationnelles raisonnables pour protéger vos données, notamment le chiffrement des transmissions, le contrôle d’accès et le stockage des mots de passe sous forme hachée. Les données d’écriture sont stockées sur des serveurs protégés ou des systèmes de stockage autorisés. Une sécurité absolue ne peut être garantie sur Internet ; veuillez conserver vos identifiants de compte en lieu sûr.',
  },
  {
    title: '5. Tiers et services LLM',
    content:
      'Si vous utilisez la correction par IA ou des fonctionnalités similaires, les prompts sont fournis par ce service, tandis que les clés API LLM sont configurées localement dans votre navigateur et se connectent directement à des fournisseurs tiers. Nous ne collectons, ne stockons ni ne transmettons vos jetons API LLM. Le contenu envoyé à des tiers est déclenché par vous ; veuillez consulter la politique de confidentialité de chaque fournisseur.',
  },
  {
    title: '6. Vos droits',
    content:
      'Vous pouvez accéder à vos informations personnelles et à vos enregistrements d’écriture, les corriger ou les supprimer lorsque cela est légalement et techniquement possible ; fermer votre compte ; et retirer votre consentement à cette politique (certaines fonctionnalités peuvent devenir indisponibles). Pour exercer ces droits, utilisez le centre de profil intégré à l’application ou contactez l’assistance.',
  },
  {
    title: '7. Protection des mineurs',
    content:
      'Si vous avez moins de 18 ans, veuillez lire cette politique avec un tuteur et n’utiliser le service qu’avec son consentement. Nous ne collectons pas sciemment d’informations personnelles auprès de mineurs.',
  },
  {
    title: '8. Mises à jour de la politique',
    content:
      'Nous pouvons mettre à jour cette Politique de confidentialité de temps à autre. Les modifications importantes seront annoncées dans l’application ou par d’autres moyens appropriés. La poursuite de l’utilisation après une mise à jour signifie que vous acceptez la politique révisée.',
  },
  {
    title: '9. Nous contacter',
    content:
      'Si vous avez des questions concernant cette Politique de confidentialité, contactez-nous via les commentaires intégrés à l’application ou notre e-mail officiel. Nous répondrons dans un délai raisonnable.',
  },
]

const deSections: PrivacyPolicySection[] = [
  {
    title: '1. Einleitung',
    content:
      'Willkommen bei Everyday Writing. Wir legen großen Wert auf Ihre Privatsphäre und Ihre persönlichen Daten. Diese Datenschutzrichtlinie erläutert, wie wir Ihre Informationen erfassen, verwenden, speichern und schützen. Durch die Nutzung dieses Dienstes bestätigen Sie, dass Sie diese Richtlinie gelesen und verstanden haben.',
  },
  {
    title: '2. Von uns erfasste Informationen',
    content:
      'Um Funktionen für Schreiben, Speichern, Einreichen und Lernstatistiken bereitzustellen, können wir erfassen: Kontoinformationen (E-Mail, Spitzname, Avatar), Schreibinhalte (Titel, Text, themenbezogene Daten), Nutzungsverhalten (Anmeldezeiten, Aktivitätsprotokolle) und technische Informationen, die für die Sicherheit erforderlich sind (z. B. IP-Adresse und Gerätetyp).',
  },
  {
    title: '3. Wie wir Informationen verwenden',
    content:
      'Ihre Informationen werden verwendet, um: Produktfunktionen bereitzustellen und zu verbessern; Entwürfe und Einreichungen zu speichern und zu synchronisieren; persönliche Lernstatistiken anzuzeigen; die Sicherheit von Konto und System zu schützen; und geltende Gesetze einzuhalten. Wir verwenden Ihre Schreibinhalte nicht für kommerzielle Zwecke über das hinaus, was in dieser Richtlinie beschrieben ist.',
  },
  {
    title: '4. Speicherung und Schutz',
    content:
      'Wir setzen angemessene technische und organisatorische Maßnahmen zum Schutz Ihrer Daten ein, einschließlich Transportverschlüsselung, Zugriffskontrolle und gehashtem Passwortspeicher. Schreibdaten werden auf geschützten Servern oder autorisierten Speichersystemen gespeichert. Absolute Sicherheit kann im Internet nicht garantiert werden; bitte bewahren Sie Ihre Kontodaten sicher auf.',
  },
  {
    title: '5. Drittanbieter und LLM-Dienste',
    content:
      'Wenn Sie KI-Korrektur oder ähnliche Funktionen nutzen, werden Prompts von diesem Dienst bereitgestellt, während LLM-API-Schlüssel lokal in Ihrem Browser konfiguriert werden und direkt mit Drittanbietern verbunden sind. Wir erfassen, speichern oder leiten Ihre LLM-API-Token nicht weiter. Inhalte, die an Dritte gesendet werden, werden von Ihnen ausgelöst; bitte lesen Sie die Datenschutzrichtlinie jedes Anbieters.',
  },
  {
    title: '6. Ihre Rechte',
    content:
      'Sie können auf Ihre persönlichen Informationen und Schreibaufzeichnungen zugreifen, diese korrigieren oder löschen, soweit rechtlich und technisch möglich; Ihr Konto schließen; und Ihre Einwilligung zu dieser Richtlinie widerrufen (einige Funktionen sind dann möglicherweise nicht mehr verfügbar). Um diese Rechte auszuüben, nutzen Sie das Profilcenter in der App oder wenden Sie sich an den Support.',
  },
  {
    title: '7. Schutz Minderjähriger',
    content:
      'Wenn Sie unter 18 Jahre alt sind, lesen Sie diese Richtlinie bitte gemeinsam mit einem Erziehungsberechtigten und nutzen Sie den Dienst nur mit dessen Einwilligung. Wir erfassen wissentlich keine persönlichen Informationen von Minderjährigen.',
  },
  {
    title: '8. Aktualisierungen der Richtlinie',
    content:
      'Wir können diese Datenschutzrichtlinie von Zeit zu Zeit aktualisieren. Wesentliche Änderungen werden in der App oder auf andere geeignete Weise bekannt gegeben. Die fortgesetzte Nutzung nach einer Aktualisierung bedeutet, dass Sie die überarbeitete Richtlinie akzeptieren.',
  },
  {
    title: '9. Kontakt',
    content:
      'Wenn Sie Fragen zu dieser Datenschutzrichtlinie haben, kontaktieren Sie uns über das Feedback in der App oder unsere offizielle E-Mail. Wir antworten innerhalb einer angemessenen Frist.',
  },
]

const esSections: PrivacyPolicySection[] = [
  {
    title: '1. Introducción',
    content:
      'Bienvenido a Everyday Writing. Valoramos su privacidad y su información personal. Esta Política de privacidad explica cómo recopilamos, usamos, almacenamos y protegemos su información. Al utilizar este servicio, confirma que ha leído y comprendido esta política.',
  },
  {
    title: '2. Información que recopilamos',
    content:
      'Para ofrecer funciones de escritura, guardado, envío y estadísticas de aprendizaje, podemos recopilar: información de la cuenta (correo electrónico, apodo, avatar), contenido escrito (título, cuerpo, datos relacionados con el tema), comportamiento de uso (horarios de inicio de sesión, registros de actividad) e información técnica necesaria para la seguridad (como la dirección IP y el tipo de dispositivo).',
  },
  {
    title: '3. Cómo utilizamos la información',
    content:
      'Su información se utiliza para: proporcionar y mejorar las funciones del producto; guardar y sincronizar borradores y envíos; mostrar estadísticas personales de aprendizaje; proteger la seguridad de la cuenta y del sistema; y cumplir con las leyes aplicables. No utilizaremos su contenido escrito con fines comerciales más allá de lo descrito en esta política.',
  },
  {
    title: '4. Almacenamiento y protección',
    content:
      'Aplicamos medidas técnicas y organizativas razonables para proteger sus datos, incluido el cifrado en tránsito, el control de acceso y el almacenamiento de contraseñas con hash. Los datos de escritura se almacenan en servidores protegidos o sistemas de almacenamiento autorizados. No se puede garantizar una seguridad absoluta en Internet; mantenga sus credenciales de cuenta seguras.',
  },
  {
    title: '5. Terceros y servicios LLM',
    content:
      'Si utiliza la corrección con IA u otras funciones similares, los prompts los proporciona este servicio, mientras que las claves API de LLM se configuran localmente en su navegador y se conectan directamente con proveedores externos. No recopilamos, almacenamos ni reenviamos sus tokens de API de LLM. El contenido enviado a terceros lo activa usted; consulte la política de privacidad de cada proveedor.',
  },
  {
    title: '6. Sus derechos',
    content:
      'Puede acceder, corregir o eliminar su información personal y sus registros de escritura cuando sea legal y técnicamente posible; cerrar su cuenta; y retirar su consentimiento a esta política (algunas funciones pueden dejar de estar disponibles). Para ejercer estos derechos, utilice el centro de perfil en la aplicación o contacte con soporte.',
  },
  {
    title: '7. Protección de menores',
    content:
      'Si es menor de 18 años, lea esta política con un tutor y utilice el servicio solo con su consentimiento. No recopilamos intencionadamente información personal de menores.',
  },
  {
    title: '8. Actualizaciones de la política',
    content:
      'Podemos actualizar esta Política de privacidad periódicamente. Los cambios importantes se anunciarán en la aplicación u otros medios apropiados. El uso continuado después de una actualización significa que acepta la política revisada.',
  },
  {
    title: '9. Contáctenos',
    content:
      'Si tiene preguntas sobre esta Política de privacidad, contáctenos a través de los comentarios en la aplicación o nuestro correo electrónico oficial. Responderemos en un plazo razonable.',
  },
]

const ptSections: PrivacyPolicySection[] = [
  {
    title: '1. Introdução',
    content:
      'Bem-vindo ao Everyday Writing. Valorizamos sua privacidade e suas informações pessoais. Esta Política de Privacidade explica como coletamos, usamos, armazenamos e protegemos suas informações. Ao usar este serviço, você confirma que leu e compreendeu esta política.',
  },
  {
    title: '2. Informações que coletamos',
    content:
      'Para oferecer recursos de escrita, salvamento, envio e estatísticas de aprendizado, podemos coletar: informações da conta (e-mail, apelido, avatar), conteúdo escrito (título, corpo, dados relacionados ao tema), comportamento de uso (horários de login, registros de atividade) e informações técnicas necessárias para a segurança (como endereço IP e tipo de dispositivo).',
  },
  {
    title: '3. Como usamos as informações',
    content:
      'Suas informações são usadas para: fornecer e melhorar os recursos do produto; salvar e sincronizar rascunhos e envios; exibir estatísticas pessoais de aprendizado; proteger a segurança da conta e do sistema; e cumprir as leis aplicáveis. Não usaremos seu conteúdo escrito para fins comerciais além do descrito nesta política.',
  },
  {
    title: '4. Armazenamento e proteção',
    content:
      'Adotamos medidas técnicas e organizacionais razoáveis para proteger seus dados, incluindo criptografia em trânsito, controle de acesso e armazenamento de senhas com hash. Os dados de escrita são armazenados em servidores protegidos ou sistemas de armazenamento autorizados. A segurança absoluta não pode ser garantida na internet; mantenha suas credenciais de conta em segurança.',
  },
  {
    title: '5. Terceiros e serviços de LLM',
    content:
      'Se você usar correção por IA ou recursos semelhantes, os prompts são fornecidos por este serviço, enquanto as chaves de API de LLM são configuradas localmente no seu navegador e se conectam diretamente a provedores terceiros. Não coletamos, armazenamos nem encaminhamos seus tokens de API de LLM. O conteúdo enviado a terceiros é acionado por você; consulte a política de privacidade de cada provedor.',
  },
  {
    title: '6. Seus direitos',
    content:
      'Você pode acessar, corrigir ou excluir suas informações pessoais e registros de escrita quando legal e tecnicamente possível; encerrar sua conta; e retirar o consentimento a esta política (alguns recursos podem ficar indisponíveis). Para exercer esses direitos, use o centro de perfil no aplicativo ou entre em contato com o suporte.',
  },
  {
    title: '7. Proteção de menores',
    content:
      'Se você tiver menos de 18 anos, leia esta política com um responsável e use o serviço apenas com o consentimento dele. Não coletamos intencionalmente informações pessoais de menores.',
  },
  {
    title: '8. Atualizações da política',
    content:
      'Podemos atualizar esta Política de Privacidade periodicamente. Alterações importantes serão anunciadas no aplicativo ou por outros meios apropriados. O uso continuado após uma atualização significa que você aceita a política revisada.',
  },
  {
    title: '9. Fale conosco',
    content:
      'Se tiver dúvidas sobre esta Política de Privacidade, entre em contato conosco pelo feedback no aplicativo ou pelo nosso e-mail oficial. Responderemos em um prazo razoável.',
  },
]

const ruSections: PrivacyPolicySection[] = [
  {
    title: '1. Введение',
    content:
      'Добро пожаловать в Everyday Writing. Мы ценим вашу конфиденциальность и персональные данные. Настоящая Политика конфиденциальности объясняет, как мы собираем, используем, храним и защищаем вашу информацию. Используя этот сервис, вы подтверждаете, что прочитали и поняли эту политику.',
  },
  {
    title: '2. Информация, которую мы собираем',
    content:
      'Для предоставления функций письма, сохранения, отправки и статистики обучения мы можем собирать: данные учётной записи (электронная почта, псевдоним, аватар), содержимое текстов (заголовок, основной текст, данные, связанные с темой), данные об использовании (время входа, журналы активности) и техническую информацию, необходимую для безопасности (например, IP-адрес и тип устройства).',
  },
  {
    title: '3. Как мы используем информацию',
    content:
      'Ваша информация используется для: предоставления и улучшения функций продукта; сохранения и синхронизации черновиков и отправленных работ; отображения персональной статистики обучения; защиты безопасности учётной записи и системы; соблюдения применимого законодательства. Мы не будем использовать ваши тексты в коммерческих целях сверх того, что описано в этой политике.',
  },
  {
    title: '4. Хранение и защита',
    content:
      'Мы применяем разумные технические и организационные меры для защиты ваших данных, включая шифрование при передаче, контроль доступа и хранение паролей в виде хеша. Данные текстов хранятся на защищённых серверах или в авторизованных системах хранения. Абсолютную безопасность в интернете гарантировать невозможно; пожалуйста, храните учётные данные в безопасности.',
  },
  {
    title: '5. Третьи стороны и сервисы LLM',
    content:
      'Если вы используете проверку с помощью ИИ или аналогичные функции, подсказки (prompts) предоставляет этот сервис, а ключи API LLM настраиваются локально в вашем браузере и напрямую подключаются к сторонним провайдерам. Мы не собираем, не храним и не передаём ваши токены API LLM. Отправка содержимого третьим сторонам инициируется вами; ознакомьтесь с политикой конфиденциальности каждого провайдера.',
  },
  {
    title: '6. Ваши права',
    content:
      'Вы можете получить доступ к своим персональным данным и записям текстов, исправить или удалить их, если это допустимо по закону и технически возможно; закрыть учётную запись; отозвать согласие с этой политикой (некоторые функции могут стать недоступными). Для реализации этих прав используйте центр профиля в приложении или обратитесь в службу поддержки.',
  },
  {
    title: '7. Защита несовершеннолетних',
    content:
      'Если вам не исполнилось 18 лет, прочитайте эту политику вместе с опекуном и пользуйтесь сервисом только с его согласия. Мы сознательно не собираем персональные данные несовершеннолетних.',
  },
  {
    title: '8. Обновления политики',
    content:
      'Мы можем время от времени обновлять эту Политику конфиденциальности. Существенные изменения будут объявлены в приложении или другими подходящими способами. Продолжение использования после обновления означает принятие пересмотренной политики.',
  },
  {
    title: '9. Связаться с нами',
    content:
      'Если у вас есть вопросы об этой Политике конфиденциальности, свяжитесь с нами через обратную связь в приложении или по официальной электронной почте. Мы ответим в разумный срок.',
  },
]

const PRIVACY_POLICY_BY_LOCALE: Record<AppLocale, PrivacyPolicySection[]> = {
  zh: zhSections,
  'zh-TW': zhSections,
  en: enSections,
  ja: jaSections,
  ko: koSections,
  fr: frSections,
  de: deSections,
  es: esSections,
  pt: ptSections,
  ru: ruSections,
}

/** 按界面语言返回前端本地隐私协议正文 */
export function getPrivacyPolicySections(locale: AppLocale): PrivacyPolicySection[] {
  const sections = PRIVACY_POLICY_BY_LOCALE[locale] ?? zhSections
  if (locale !== 'zh-TW') return sections
  return sections.map((section) => ({
    title: toTraditionalChinese(section.title),
    content: toTraditionalChinese(section.content),
  }))
}

/** @deprecated 请用 getPrivacyPolicySections(locale) */
export const PRIVACY_POLICY_SECTIONS = zhSections
