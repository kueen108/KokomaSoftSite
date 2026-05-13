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
