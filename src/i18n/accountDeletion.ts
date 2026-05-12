import type { Lang } from './translations';

export const supportEmail = 'kokomasoft@gmail.com';

export const accountDeletion: Record<Lang, {
  title: string;
  subtitle: (appName: string) => string;
  lastUpdated: string;
  overviewHeading: string;
  overview: (appName: string) => string;
  requestHeading: string;
  requestIntro: string;
  emailCta: string;
  emailSubject: (appName: string) => string;
  includeHeading: string;
  includeItems: string[];
  deletionHeading: string;
  deletionItems: string[];
  retentionHeading: string;
  retention: string;
  subscriptionHeading: string;
  subscription: string;
  timelineHeading: string;
  timeline: string;
}> = {
  ko: {
    title: '계정 및 데이터 삭제 요청',
    subtitle: (appName) => `${appName} 계정과 관련 데이터를 삭제하도록 요청할 수 있습니다.`,
    lastUpdated: '최종 수정일: 2026년 5월 12일',
    overviewHeading: '안내',
    overview: (appName) =>
      `KokomaSoft는 ${appName} 사용자가 앱 계정과 관련 데이터를 삭제하도록 요청할 수 있는 경로를 제공합니다. 앱을 삭제했거나 앱에 접근할 수 없는 경우에도 이 페이지에서 삭제 요청 방법을 확인할 수 있습니다.`,
    requestHeading: '삭제 요청 방법',
    requestIntro: '아래 이메일 링크를 사용하거나 직접 이메일을 작성해 주세요.',
    emailCta: '삭제 요청 이메일 보내기',
    emailSubject: (appName) => `${appName} 계정/데이터 삭제 요청`,
    includeHeading: '이메일에 포함할 정보',
    includeItems: [
      'Google 로그인에 사용한 이메일 주소',
      '삭제 범위: 계정 삭제, 데이터 삭제, 또는 계정 및 데이터 모두 삭제',
      '본인 확인과 처리 안내를 받을 수 있는 회신 이메일 주소',
    ],
    deletionHeading: '삭제 대상',
    deletionItems: [
      '계정 식별 정보와 로그인 연동 정보',
      '일기 기록, 감정 분석 결과, 리포트 및 앱 내 저장 데이터',
      '음성 일기 파일 등 계정에 연결된 사용자 제공 콘텐츠',
      '지원 요청 처리에 더 이상 필요하지 않은 계정 관련 데이터',
    ],
    retentionHeading: '보관될 수 있는 정보',
    retention:
      '보안, 부정 사용 방지, 분쟁 대응, 법적 의무 이행에 필요한 일부 기록은 관련 법령 또는 정당한 보관 목적에 필요한 기간 동안 제한적으로 보관될 수 있습니다.',
    subscriptionHeading: '구독 안내',
    subscription:
      'Google Play 구독이 활성화되어 있는 경우 계정 삭제 요청과 별도로 Google Play 구독 관리 화면에서 구독을 취소해야 할 수 있습니다.',
    timelineHeading: '처리 기간',
    timeline:
      '요청을 받은 뒤 본인 확인이 완료되면 합리적으로 가능한 범위에서 신속하게 처리하고, 추가 확인이 필요한 경우 회신 이메일로 안내합니다.',
  },
  en: {
    title: 'Account and Data Deletion Request',
    subtitle: (appName) => `You can request deletion of your ${appName} account and associated data.`,
    lastUpdated: 'Last updated: May 12, 2026',
    overviewHeading: 'Overview',
    overview: (appName) =>
      `KokomaSoft provides a way for ${appName} users to request deletion of their app account and associated data. You can use this page even if you have uninstalled the app or cannot access the in-app support flow.`,
    requestHeading: 'How to Request Deletion',
    requestIntro: 'Use the email link below or send us an email directly.',
    emailCta: 'Send deletion request email',
    emailSubject: (appName) => `${appName} account/data deletion request`,
    includeHeading: 'Information to Include',
    includeItems: [
      'The email address used for Google sign-in',
      'Deletion scope: account deletion, data deletion, or both account and data deletion',
      'A reply email address for identity verification and processing updates',
    ],
    deletionHeading: 'Data Covered by Deletion',
    deletionItems: [
      'Account identifiers and sign-in linkage data',
      'Diary entries, emotion analysis results, reports, and in-app stored data',
      'User-provided content linked to the account, such as voice diary files',
      'Account-related data no longer needed to process support requests',
    ],
    retentionHeading: 'Information We May Retain',
    retention:
      'Some records may be retained for a limited period when necessary for security, abuse prevention, dispute handling, legal obligations, or other legitimate retention purposes.',
    subscriptionHeading: 'Subscription Notice',
    subscription:
      'If you have an active Google Play subscription, you may need to cancel it separately in Google Play subscription management.',
    timelineHeading: 'Processing Time',
    timeline:
      'After we receive your request and complete identity verification, we will process it as soon as reasonably possible and contact you by reply email if additional confirmation is needed.',
  },
  zh: {
    title: '账号和数据删除请求',
    subtitle: (appName) => `您可以请求删除您的 ${appName} 账号及相关数据。`,
    lastUpdated: '最后更新：2026年5月12日',
    overviewHeading: '说明',
    overview: (appName) =>
      `KokomaSoft 为 ${appName} 用户提供请求删除应用账号及相关数据的方式。即使您已卸载应用或无法访问应用内支持流程，也可以通过本页面提交删除请求。`,
    requestHeading: '如何请求删除',
    requestIntro: '请使用下面的邮件链接，或直接发送电子邮件给我们。',
    emailCta: '发送删除请求邮件',
    emailSubject: (appName) => `${appName} 账号/数据删除请求`,
    includeHeading: '邮件中请包含',
    includeItems: [
      '用于 Google 登录的电子邮件地址',
      '删除范围：删除账号、删除数据，或同时删除账号和数据',
      '用于身份确认和接收处理进度的回复邮箱',
    ],
    deletionHeading: '删除范围',
    deletionItems: [
      '账号标识信息和登录关联信息',
      '日记记录、情绪分析结果、报告和应用内保存的数据',
      '与账号关联的用户提供内容，例如语音日记文件',
      '处理支持请求不再需要的账号相关数据',
    ],
    retentionHeading: '可能保留的信息',
    retention:
      '出于安全、防止滥用、争议处理、法律义务或其他正当保留目的，部分记录可能会在必要期间内有限保留。',
    subscriptionHeading: '订阅说明',
    subscription:
      '如果您有有效的 Google Play 订阅，可能需要在 Google Play 订阅管理页面中单独取消订阅。',
    timelineHeading: '处理时间',
    timeline:
      '收到请求并完成身份确认后，我们会在合理可行的范围内尽快处理。如需进一步确认，我们会通过回复邮件联系您。',
  },
  ja: {
    title: 'アカウントおよびデータ削除リクエスト',
    subtitle: (appName) => `${appName} のアカウントと関連データの削除をリクエストできます。`,
    lastUpdated: '最終更新日：2026年5月12日',
    overviewHeading: '概要',
    overview: (appName) =>
      `KokomaSoftは、${appName} のユーザーがアプリのアカウントと関連データの削除をリクエストできる手段を提供しています。アプリをアンインストール済み、またはアプリ内サポートにアクセスできない場合でも、このページから削除リクエスト方法を確認できます。`,
    requestHeading: '削除リクエスト方法',
    requestIntro: '下のメールリンクを使用するか、直接メールを送信してください。',
    emailCta: '削除リクエストメールを送信',
    emailSubject: (appName) => `${appName} アカウント/データ削除リクエスト`,
    includeHeading: 'メールに含める情報',
    includeItems: [
      'Googleログインに使用したメールアドレス',
      '削除範囲：アカウント削除、データ削除、またはアカウントとデータの両方',
      '本人確認と処理状況の連絡を受け取れる返信用メールアドレス',
    ],
    deletionHeading: '削除対象',
    deletionItems: [
      'アカウント識別情報とログイン連携情報',
      '日記、感情分析結果、レポート、アプリ内保存データ',
      '音声日記ファイルなど、アカウントに関連するユーザー提供コンテンツ',
      'サポート対応に不要となったアカウント関連データ',
    ],
    retentionHeading: '保持される場合がある情報',
    retention:
      'セキュリティ、不正利用防止、紛争対応、法的義務、その他正当な保持目的のために必要な一部の記録は、必要な期間に限り保持される場合があります。',
    subscriptionHeading: 'サブスクリプションに関する注意',
    subscription:
      '有効なGoogle Playサブスクリプションがある場合、アカウント削除リクエストとは別にGoogle Playのサブスクリプション管理画面で解約が必要になる場合があります。',
    timelineHeading: '処理期間',
    timeline:
      'リクエストを受領し本人確認が完了した後、合理的に可能な範囲で速やかに処理します。追加確認が必要な場合は返信メールでご連絡します。',
  },
};
