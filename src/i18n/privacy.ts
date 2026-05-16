import type { Lang } from './translations';

export const privacy: Record<Lang, {
  title: string;
  lastUpdated: string;
  intro: (appName: string) => string;
  sections: { heading: string; content: string }[];
  contact: string;
}> = {
  ko: {
    title: '개인정보처리방침',
    lastUpdated: '최종 수정일: 2026년 5월 13일',
    intro: (appName) => `KokomaSoft(이하 "회사")는 ${appName}(이하 "앱") 이용자의 개인정보를 중요하게 생각하며, 관련 법령을 준수합니다. 본 개인정보처리방침은 앱이 수집하는 정보와 그 사용 방식에 대해 설명합니다.`,
    sections: [
      {
        heading: '1. 수집하는 개인정보 항목',
        content: '본 앱은 서비스 제공을 위해 최소한의 정보를 수집합니다. 자동으로 수집되는 정보에는 기기 정보(기기 모델, OS 버전), 앱 사용 로그, 광고 식별자(Google Advertising ID) 등이 포함될 수 있습니다. 회원가입이 필요한 경우 이메일 주소 등의 정보가 추가로 수집될 수 있습니다.',
      },
      {
        heading: '2. 개인정보의 수집 및 이용 목적',
        content: '수집된 정보는 앱 서비스 제공 및 개선, 맞춤형 콘텐츠 제공, 광고 게재, 오류 분석 및 서비스 안정성 확보, 이용자 문의 대응을 위해 사용됩니다.',
      },
      {
        heading: '3. 개인정보의 보유 및 이용 기간',
        content: '이용자의 개인정보는 수집 목적이 달성된 후 지체 없이 파기합니다. 단, 관련 법령에 의해 보존이 필요한 경우 해당 기간 동안 보관합니다.',
      },
      {
        heading: '4. 개인정보의 제3자 제공',
        content: '회사는 이용자의 동의 없이 개인정보를 제3자에게 제공하지 않습니다. 다만, 앱 내 광고 서비스를 위해 Google AdMob 등의 광고 파트너가 광고 식별자 등의 정보를 수집할 수 있습니다.',
      },
      {
        heading: '5. 광고 및 분석 서비스',
        content: '본 앱은 Google AdMob을 통한 광고 서비스를 사용할 수 있으며, Google Firebase Analytics를 통해 앱 사용 통계를 수집할 수 있습니다. 이러한 서비스는 각각의 개인정보처리방침에 따라 운영됩니다.',
      },
      {
        heading: '6. 이용자의 권리',
        content: '이용자는 언제든지 개인정보의 열람, 수정, 삭제를 요청할 수 있습니다. 광고 식별자는 기기 설정에서 재설정하거나 비활성화할 수 있습니다.',
      },
      {
        heading: '7. 개인정보처리방침의 변경',
        content: '본 방침은 법령 또는 서비스 변경에 따라 수정될 수 있으며, 변경 시 앱 내 공지를 통해 알려드립니다.',
      },
    ],
    contact: '개인정보 관련 문의는 아래 이메일로 연락해 주세요.',
  },
  en: {
    title: 'Privacy Policy',
    lastUpdated: 'Last updated: May 13, 2026',
    intro: (appName) => `KokomaSoft ("Company") values the privacy of ${appName} ("App") users and complies with applicable laws and regulations. This Privacy Policy explains what information the App collects and how it is used.`,
    sections: [
      {
        heading: '1. Information We Collect',
        content: 'The App collects minimal information necessary to provide its services. Automatically collected information may include device information (device model, OS version), app usage logs, and advertising identifiers (Google Advertising ID). If account registration is required, additional information such as email addresses may be collected.',
      },
      {
        heading: '2. How We Use Information',
        content: 'Collected information is used to provide and improve app services, deliver personalized content, display advertisements, analyze errors and ensure service stability, and respond to user inquiries.',
      },
      {
        heading: '3. Data Retention',
        content: 'Personal information is deleted without delay once the purpose of collection has been fulfilled. However, if retention is required by applicable laws, the information will be stored for the legally mandated period.',
      },
      {
        heading: '4. Sharing with Third Parties',
        content: 'The Company does not share personal information with third parties without user consent. However, advertising partners such as Google AdMob may collect advertising identifiers and related information for in-app advertising purposes.',
      },
      {
        heading: '5. Advertising and Analytics',
        content: 'The App may use advertising services through Google AdMob and collect app usage statistics through Google Firebase Analytics. These services operate under their respective privacy policies.',
      },
      {
        heading: '6. Your Rights',
        content: 'Users may request access to, correction of, or deletion of their personal information at any time. Advertising identifiers can be reset or disabled through device settings.',
      },
      {
        heading: '7. Changes to This Policy',
        content: 'This policy may be updated due to changes in laws or services. Any changes will be notified through in-app announcements.',
      },
    ],
    contact: 'For privacy-related inquiries, please contact us at the email below.',
  },
  zh: {
    title: '隐私政策',
    lastUpdated: '最后更新：2026年5月13日',
    intro: (appName) => `KokomaSoft（以下简称"公司"）重视${appName}（以下简称"应用"）用户的隐私，并遵守相关法律法规。本隐私政策说明应用收集的信息及其使用方式。`,
    sections: [
      {
        heading: '1. 我们收集的信息',
        content: '本应用收集提供服务所需的最少信息。自动收集的信息可能包括设备信息（设备型号、操作系统版本）、应用使用日志和广告标识符（Google Advertising ID）。如需注册账户，可能会额外收集电子邮件地址等信息。',
      },
      {
        heading: '2. 信息使用目的',
        content: '收集的信息用于提供和改进应用服务、提供个性化内容、展示广告、分析错误并确保服务稳定性，以及回应用户咨询。',
      },
      {
        heading: '3. 数据保留',
        content: '个人信息在收集目的达成后将立即删除。但如法律要求保留，将在法定期限内保存。',
      },
      {
        heading: '4. 向第三方提供信息',
        content: '未经用户同意，公司不会向第三方提供个人信息。但广告合作伙伴（如Google AdMob）可能会为应用内广告目的收集广告标识符等信息。',
      },
      {
        heading: '5. 广告与分析服务',
        content: '本应用可能通过Google AdMob使用广告服务，并通过Google Firebase Analytics收集应用使用统计数据。这些服务按照各自的隐私政策运营。',
      },
      {
        heading: '6. 您的权利',
        content: '用户可以随时请求查阅、更正或删除其个人信息。广告标识符可以通过设备设置重置或停用。',
      },
      {
        heading: '7. 政策变更',
        content: '本政策可能因法律或服务变更而更新。任何变更将通过应用内通知告知。',
      },
    ],
    contact: '如有隐私相关问题，请通过以下邮箱联系我们。',
  },
  ja: {
    title: 'プライバシーポリシー',
    lastUpdated: '最終更新日：2026年5月13日',
    intro: (appName) => `KokomaSoft（以下「当社」）は、${appName}（以下「アプリ」）のユーザーのプライバシーを重視し、関連法令を遵守しています。本プライバシーポリシーは、アプリが収集する情報とその使用方法について説明します。`,
    sections: [
      {
        heading: '1. 収集する情報',
        content: '本アプリは、サービス提供に必要な最小限の情報を収集します。自動的に収集される情報には、デバイス情報（デバイスモデル、OSバージョン）、アプリ使用ログ、広告識別子（Google Advertising ID）などが含まれる場合があります。アカウント登録が必要な場合、メールアドレスなどの情報が追加で収集されることがあります。',
      },
      {
        heading: '2. 情報の利用目的',
        content: '収集された情報は、アプリサービスの提供・改善、パーソナライズされたコンテンツの提供、広告の表示、エラー分析・サービス安定性の確保、ユーザーからのお問い合わせ対応のために使用されます。',
      },
      {
        heading: '3. データの保持期間',
        content: '個人情報は、収集目的が達成された後、遅滞なく削除されます。ただし、関連法令により保存が必要な場合は、法定期間中保管されます。',
      },
      {
        heading: '4. 第三者への情報提供',
        content: '当社は、ユーザーの同意なく個人情報を第三者に提供しません。ただし、Google AdMobなどの広告パートナーが、アプリ内広告のために広告識別子などの情報を収集する場合があります。',
      },
      {
        heading: '5. 広告・分析サービス',
        content: '本アプリは、Google AdMobによる広告サービスを使用し、Google Firebase Analyticsによるアプリ使用統計を収集する場合があります。これらのサービスは、それぞれのプライバシーポリシーに従って運営されます。',
      },
      {
        heading: '6. ユーザーの権利',
        content: 'ユーザーはいつでも個人情報の閲覧、修正、削除を要求できます。広告識別子は、デバイスの設定からリセットまたは無効化できます。',
      },
      {
        heading: '7. ポリシーの変更',
        content: '本ポリシーは、法令またはサービスの変更に伴い更新される場合があります。変更がある場合は、アプリ内のお知らせでお伝えします。',
      },
    ],
    contact: 'プライバシーに関するお問い合わせは、以下のメールアドレスまでご連絡ください。',
  },
};

export const appPrivacySections: Partial<Record<string, Record<Lang, { heading: string; content: string }[]>>> = {
  ungyeol: {
    ko: [
      {
        heading: 'Ungyeol AI 풀이 기능 안내',
        content: 'Ungyeol은 오늘 운세, 자유 질문, 타로, 궁합, 상대 속마음, 답장 추천, 꿈해몽, 관상 기능 제공을 위해 생년월일시, 질문 및 상황 입력, 상대 메시지, 꿈 키워드·감정·내용, 선택한 사진 데이터를 처리할 수 있습니다. 관상 사진 원본은 저장하지 않으며, AI가 생성한 텍스트 결과와 입력 요약만 히스토리에 저장됩니다. 본인 사진 또는 사용 동의를 받은 사진만 이용해 주세요.',
      },
    ],
    en: [
      {
        heading: 'Ungyeol AI Reading Features',
        content: 'Ungyeol may process birth details, questions and situation text, partner messages, dream keywords, emotions and details, and selected photo data to provide daily fortune, free-form question, tarot, compatibility, hidden-feelings, reply recommendation, dream reading, and face-reading features. Original face-reading photos are not stored; only generated text results and input summaries are saved to history. Please use only your own photo or a photo you have permission to use.',
      },
    ],
    zh: [
      {
        heading: 'Ungyeol AI 解读功能说明',
        content: 'Ungyeol 可能会处理出生信息、问题和情境文字、对方消息、梦境关键词、情绪和内容，以及所选照片数据，以提供每日运势、自由提问、塔罗、配对、对方心意、回复建议、梦境解析和面相解读功能。面相解读的原始照片不会保存；仅保存 AI 生成的文字结果和输入摘要到历史记录。请仅使用本人照片或已获得使用许可的照片。',
      },
    ],
    ja: [
      {
        heading: 'Ungyeol AI鑑定機能について',
        content: 'Ungyeolは、今日の運勢、自由質問、タロット、相性、相手の気持ち、返信提案、夢占い、顔相機能を提供するため、生年月日時、質問や状況の入力、相手のメッセージ、夢のキーワード・感情・内容、選択した写真データを処理する場合があります。顔相用の写真原本は保存せず、AIが生成したテキスト結果と入力要約のみを履歴に保存します。本人の写真、または使用許可を得た写真のみを利用してください。',
      },
    ],
  },
};

export const appPrivacySectionOverrides: Partial<Record<string, Record<Lang, { heading: string; content: string }[]>>> = {
  marknote: {
    ko: [
      {
        heading: '1. 앱이 접근하거나 처리하는 데이터',
        content: 'MarkNote는 사용자가 Android 파일 선택기로 선택한 폴더와 파일, 앱 내부 작업 폴더에 생성한 Markdown 문서, 최근 파일, 현재 작업 폴더, 표시 및 편집 설정, 자동 저장 설정, 임시 초안에 접근하거나 이를 기기 내부에 저장할 수 있습니다. Google Drive 작업 폴더를 연결한 경우 사용자가 선택한 Drive 폴더와 파일의 메타데이터, Markdown 파일 본문, Google 계정 이메일 및 승인 세션 정보가 기능 제공을 위해 처리될 수 있습니다.',
      },
      {
        heading: '2. 이용 목적',
        content: '수집 또는 처리되는 데이터는 Markdown 파일 열기, 편집, 자동 저장, 이름 변경, 이동, 복사, 삭제, 미리보기, 검색, HTML/PDF 내보내기, 최근 파일과 작업 폴더 복원, Google Drive 작업 폴더 연결, 임시 초안 복구, 저장 충돌 대응을 위해 사용됩니다.',
      },
      {
        heading: '3. 로컬 처리와 앱 운영자 서버',
        content: '로컬 폴더의 파일 내용은 기기 안에서 처리됩니다. MarkNote 운영자 서버로 문서 본문, 파일명, 폴더 경로를 전송하지 않습니다. MarkNote는 자체 회원가입, 자체 클라우드 동기화, 광고, 외부 analytics SDK, 외부 crash reporting SDK를 제공하지 않습니다.',
      },
      {
        heading: '4. Google Drive 기능',
        content: 'Google Drive 작업 폴더 기능은 선택 사항이며, 로컬 폴더 편집은 Google 계정 없이 사용할 수 있습니다. 사용자가 Google Drive 작업 폴더를 연결하면 MarkNote는 Google 계정 승인과 Google Drive API를 사용하여 사용자가 선택한 Drive 파일을 읽고 저장합니다. MarkNote의 Google 사용자 데이터 사용 및 다른 앱으로의 전송은 Google API Services User Data Policy와 Limited Use 요구사항을 준수합니다.',
      },
      {
        heading: '5. Mermaid 미리보기',
        content: '문서에 Mermaid 코드 블록이 있을 때 MarkNote는 Mermaid 차트를 렌더링하기 위해 jsDelivr의 Mermaid 스크립트를 로드할 수 있습니다. 일반 Markdown 미리보기에서는 JavaScript와 네트워크 로딩을 사용하지 않습니다.',
      },
      {
        heading: '6. 보관 및 삭제',
        content: '로컬 설정과 임시 초안은 사용자가 Android 앱 데이터를 삭제하면 제거됩니다. 앱 내부 작업 폴더 파일은 앱의 파일 삭제 기능 또는 Android 앱 데이터 삭제로 제거할 수 있습니다. SAF 로컬 폴더와 Google Drive 원본 파일은 사용자가 선택한 외부 저장소에 남으며, 앱의 파일 삭제 기능 또는 해당 저장소 앱에서 직접 삭제할 수 있습니다. Google Drive 작업 폴더 연결은 앱에서 연결 해제할 수 있으며 원본 Drive 파일은 삭제되지 않습니다.',
      },
      {
        heading: '7. 아동, 보안 및 변경',
        content: 'MarkNote는 일반 생산성 도구이며 아동을 대상으로 하지 않습니다. Android의 저장소 권한 모델과 Google OAuth/Drive API의 HTTPS 통신을 사용하며, 중요한 문서는 별도로 백업하는 것을 권장합니다. 앱 기능, 데이터 처리 방식, 외부 SDK 사용이 변경되면 본 방침을 업데이트합니다.',
      },
    ],
    en: [
      {
        heading: '1. Data the App Accesses or Processes',
        content: 'MarkNote may access or store on device the folders and files you choose through the Android file picker, Markdown documents created in app work folders, recent files, the current work folder, display and editing settings, auto-save settings, and temporary drafts. If you connect a Google Drive work folder, metadata for the Drive folders and files you choose, Markdown file contents, Google account email, and authorization session information may be processed to provide the feature.',
      },
      {
        heading: '2. How Data Is Used',
        content: 'Data is used to open, edit, auto-save, rename, move, copy, delete, preview, search, and export Markdown files as HTML/PDF, restore recent files and work folders, connect Google Drive work folders, recover temporary drafts, and handle save conflicts.',
      },
      {
        heading: '3. Local Processing and Operator Servers',
        content: 'Local file contents are processed on device. MarkNote does not send document bodies, file names, or folder paths to MarkNote operator servers. MarkNote does not provide its own account system, app cloud sync, ads, external analytics SDK, or external crash reporting SDK.',
      },
      {
        heading: '4. Google Drive Feature',
        content: 'The Google Drive work folder feature is optional, and local folder editing works without a Google account. If you connect a Google Drive work folder, MarkNote uses Google authorization and the Google Drive API to read and save the Drive files you choose. MarkNote use and transfer of information received from Google APIs adheres to the Google API Services User Data Policy, including Limited Use requirements.',
      },
      {
        heading: '5. Mermaid Preview',
        content: 'When a document contains Mermaid code blocks, MarkNote may load the Mermaid script from jsDelivr to render charts. Regular Markdown preview does not use JavaScript or network loading.',
      },
      {
        heading: '6. Retention and Deletion',
        content: 'Local settings and temporary drafts are removed when you delete the app data in Android settings. Files in app work folders can be removed through the app file deletion flow or Android app data deletion. SAF local folders and original Google Drive files remain in the external storage you chose and can be deleted through the app file deletion flow or the relevant storage app. Google Drive work folder connections can be disconnected in the app; original Drive files are not deleted by disconnecting.',
      },
      {
        heading: '7. Children, Security, and Changes',
        content: 'MarkNote is a general productivity tool and is not directed to children. It uses the Android storage permission model and HTTPS communication through Google OAuth and Drive APIs; you should separately back up important documents. This policy will be updated if app features, data handling, or external SDK usage changes.',
      },
    ],
    zh: [
      {
        heading: '1. 应用访问或处理的数据',
        content: 'MarkNote 可能会访问或在设备内保存你通过 Android 文件选择器选择的文件夹和文件、在应用工作文件夹中创建的 Markdown 文档、最近文件、当前工作文件夹、显示和编辑设置、自动保存设置以及临时草稿。连接 Google Drive 工作文件夹时，你选择的 Drive 文件夹和文件元数据、Markdown 文件正文、Google 账号邮箱和授权会话信息可能会为提供功能而被处理。',
      },
      {
        heading: '2. 数据使用目的',
        content: '这些数据用于打开、编辑、自动保存、重命名、移动、复制、删除、预览、搜索 Markdown 文件，将文件导出为 HTML/PDF，恢复最近文件和工作文件夹，连接 Google Drive 工作文件夹，恢复临时草稿，以及处理保存冲突。',
      },
      {
        heading: '3. 本地处理和运营者服务器',
        content: '本地文件内容在设备内处理。MarkNote 不会将文档正文、文件名或文件夹路径发送到 MarkNote 运营者服务器。MarkNote 不提供自有账号系统、自有云同步、广告、外部 analytics SDK 或外部 crash reporting SDK。',
      },
      {
        heading: '4. Google Drive 功能',
        content: 'Google Drive 工作文件夹功能为可选功能；本地文件夹编辑无需 Google 账号即可使用。连接 Google Drive 工作文件夹时，MarkNote 会使用 Google 授权和 Google Drive API 读取并保存你选择的 Drive 文件。MarkNote 对从 Google API 获取的信息的使用和传输遵守 Google API Services User Data Policy，包括 Limited Use 要求。',
      },
      {
        heading: '5. Mermaid 预览',
        content: '当文档包含 Mermaid 代码块时，MarkNote 可能会从 jsDelivr 加载 Mermaid 脚本来渲染图表。普通 Markdown 预览不会使用 JavaScript 或网络加载。',
      },
      {
        heading: '6. 保存与删除',
        content: '本地设置和临时草稿会在你通过 Android 设置删除应用数据时移除。应用工作文件夹中的文件可通过应用内文件删除功能或 Android 应用数据删除来移除。SAF 本地文件夹和 Google Drive 原始文件会保留在你选择的外部存储中，可通过应用内文件删除功能或相应存储应用直接删除。Google Drive 工作文件夹连接可在应用中断开，断开连接不会删除原始 Drive 文件。',
      },
      {
        heading: '7. 儿童、安全与变更',
        content: 'MarkNote 是通用生产力工具，并非面向儿童。应用使用 Android 存储权限模型以及 Google OAuth/Drive API 的 HTTPS 通信；建议你另行备份重要文档。如应用功能、数据处理方式或外部 SDK 使用发生变化，本政策将更新。',
      },
    ],
    ja: [
      {
        heading: '1. アプリがアクセスまたは処理するデータ',
        content: 'MarkNote は、Android ファイル選択画面でユーザーが選択したフォルダとファイル、アプリ作業フォルダに作成した Markdown 文書、最近のファイル、現在の作業フォルダ、表示・編集設定、自動保存設定、一時下書きにアクセスし、端末内に保存する場合があります。Google Drive 作業フォルダを接続した場合、選択した Drive フォルダとファイルのメタデータ、Markdown ファイル本文、Google アカウントのメールアドレス、認証セッション情報が機能提供のために処理される場合があります。',
      },
      {
        heading: '2. データの利用目的',
        content: 'これらのデータは、Markdown ファイルのオープン、編集、自動保存、名前変更、移動、コピー、削除、プレビュー、検索、HTML/PDF エクスポート、最近のファイルと作業フォルダの復元、Google Drive 作業フォルダの接続、一時下書きの復元、保存競合への対応に使用されます。',
      },
      {
        heading: '3. ローカル処理と運営者サーバー',
        content: 'ローカルファイルの内容は端末内で処理されます。MarkNote は文書本文、ファイル名、フォルダパスを MarkNote 運営者サーバーへ送信しません。MarkNote は独自アカウント、独自クラウド同期、広告、外部 analytics SDK、外部 crash reporting SDK を提供しません。',
      },
      {
        heading: '4. Google Drive 機能',
        content: 'Google Drive 作業フォルダ機能は任意であり、ローカルフォルダ編集は Google アカウントなしで利用できます。Google Drive 作業フォルダを接続すると、MarkNote は Google 認証と Google Drive API を使用して、選択された Drive ファイルを読み書きします。MarkNote による Google API から取得した情報の使用および他アプリへの転送は、Limited Use 要件を含む Google API Services User Data Policy に従います。',
      },
      {
        heading: '5. Mermaid プレビュー',
        content: '文書に Mermaid コードブロックが含まれる場合、MarkNote は図をレンダリングするために jsDelivr から Mermaid スクリプトを読み込むことがあります。通常の Markdown プレビューでは JavaScript やネットワーク読み込みを使用しません。',
      },
      {
        heading: '6. 保持と削除',
        content: 'ローカル設定と一時下書きは、Android 設定でアプリデータを削除すると削除されます。アプリ作業フォルダ内のファイルは、アプリのファイル削除機能または Android アプリデータ削除で削除できます。SAF ローカルフォルダと Google Drive の元ファイルは、ユーザーが選択した外部ストレージに残り、アプリのファイル削除機能または該当するストレージアプリから直接削除できます。Google Drive 作業フォルダ接続はアプリ内で解除でき、解除しても元の Drive ファイルは削除されません。',
      },
      {
        heading: '7. 子ども、セキュリティ、変更',
        content: 'MarkNote は一般的な仕事効率化ツールであり、子どもを対象としていません。Android のストレージ権限モデルと Google OAuth/Drive API の HTTPS 通信を使用します。重要な文書は別途バックアップすることを推奨します。アプリ機能、データ処理方法、外部 SDK の使用に変更がある場合、本ポリシーを更新します。',
      },
    ],
  },
};

export const appPrivacyLastUpdated: Partial<Record<string, Record<Lang, string>>> = {
  marknote: {
    ko: '최종 수정일: 2026년 5월 11일',
    en: 'Last updated: May 11, 2026',
    zh: '最后更新：2026年5月11日',
    ja: '最終更新日：2026年5月11日',
  },
};
