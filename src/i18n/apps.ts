import type { Lang } from './translations';

export interface AppScreenshot {
  src: string;
  caption: Record<Lang, string>;
}

export interface AppInfo {
  id: string;
  iconUrl: string;
  name: Record<Lang, string>;
  tagline: Record<Lang, string>;
  description: Record<Lang, string>;
  features: Record<Lang, string[]>;
  recommendedFor: Record<Lang, string[]>;
  supportNote: Record<Lang, string>;
  screenshots?: Partial<Record<Lang, AppScreenshot[]>>;
  category: 'productivity' | 'lifestyle' | 'utility' | 'entertainment';
  operatingSystem?: string;
  googlePlayUrl?: string;
  appStoreUrl?: string;
  webUrl?: string;
  introVideoUrl?: string;
  supportsAccountDeletion?: boolean;
  /** True when /{lang}/terms/{id}/ pages exist for this app */
  hasTermsPage?: boolean;
}

const appDisplayOrder: Record<string, number> = {
  ungyeol: 0,
  lifelotto: 1,
  lifepension: 2,
  mytube: 3,
  onul: 4,
  marknote: 5,
  smartbap: 6,
  checkme: 7,
  glowup: 8,
};

const smartBapScreenshots = [
  {
    file: '01-diary.png',
    caption: { ko: '날짜별 식단 기록', en: 'Date-based meal diary', zh: '依日期管理飲食', ja: '日付別の食事記録' },
  },
  {
    file: '02-stats.png',
    caption: { ko: '일/주/월 통계', en: 'Daily, weekly, and monthly stats', zh: '日/週/月統計', ja: '日/週/月の統計' },
  },
  {
    file: '03-briefing.png',
    caption: { ko: '최근 7일 식단 브리핑', en: '7-day diet briefing', zh: '最近 7 天飲食簡報', ja: '直近7日間の食事ブリーフィング' },
  },
  {
    file: '04-settings.png',
    caption: { ko: '테마와 개인화 목표', en: 'Themes and personalized goals', zh: '主題與個人化目標', ja: 'テーマと個人化目標' },
  },
  {
    file: '05-meal-detail.png',
    caption: { ko: '음식 구성과 양 편집', en: 'Food and portion editing', zh: '編輯食物與份量', ja: '食品構成と量の編集' },
  },
  {
    file: '06-capture.png',
    caption: { ko: '사진/검색으로 음식 추가', en: 'Add food by photo or search', zh: '用照片或搜尋新增食物', ja: '写真や検索で食事を追加' },
  },
] satisfies Array<{ file: string; caption: Record<Lang, string> }>;

function smartBapLocalizedScreenshots(locale: 'ko' | 'ja' | 'zh'): AppScreenshot[] {
  return smartBapScreenshots.map((screenshot) => ({
    src: `/app-screenshots/smartbap/${locale}/${screenshot.file}`,
    caption: screenshot.caption,
  }));
}

const checkMeScreenshots = [
  {
    file: '01_camera_ai_mirror.png',
    caption: { ko: '카메라에서 바로 체크하는 AI 미러', en: 'AI mirror checks right from the camera', zh: '直接在相机中进行 AI 镜像检查', ja: 'カメラからすぐ実行できるAIミラー' },
  },
  {
    file: '02_result_vibe_read.png',
    caption: { ko: '근거와 팁을 담은 바이브 리드 결과', en: 'Vibe read results with evidence and tips', zh: '附带依据与建议的氛围解读结果', ja: '根拠とヒント付きのバイブリード結果' },
  },
  {
    file: '03_daily_report.png',
    caption: { ko: '오늘의 리포트로 하루 흐름 확인', en: 'Daily report for today’s flow', zh: '用每日报告查看一天的状态', ja: '今日のレポートで1日の流れを確認' },
  },
  {
    file: '04_history_patterns.png',
    caption: { ko: '히스토리와 패턴으로 변화 추적', en: 'Track changes with history and patterns', zh: '通过历史与模式追踪变化', ja: '履歴とパターンで変化を追跡' },
  },
  {
    file: '05_rewards_ranking.png',
    caption: { ko: '리워드, streak, 랭킹', en: 'Rewards, streaks, and rankings', zh: '奖励、连续打卡与排行榜', ja: 'リワード、streak、ランキング' },
  },
] satisfies Array<{ file: string; caption: Record<Lang, string> }>;

function checkMeLocalizedScreenshots(locale: 'ko' | 'en' | 'ja'): AppScreenshot[] {
  return checkMeScreenshots.map((screenshot) => ({
    src: `/app-screenshots/checkme/${locale}/${screenshot.file}`,
    caption: screenshot.caption,
  }));
}

const glowUpScreenshots = [
  {
    file: '01-home.png',
    caption: { ko: 'Glow 리포트 시작하기', en: 'Start your Glow report', zh: '开始创建 Glow 报告', ja: 'Glowレポートを始める' },
  },
  {
    file: '02-photo-ready.png',
    caption: { ko: '선명한 사진 한 장으로', en: 'Use one clear photo', zh: '用一张清晰照片', ja: 'クリアな写真1枚から' },
  },
  {
    file: '03-loading.png',
    caption: { ko: '스타일 리포트를 만드는 중', en: 'Creating your style report', zh: '正在生成风格报告', ja: 'スタイルレポートを作成中' },
  },
  {
    file: '04-result-snapshot.png',
    caption: { ko: 'Glow 스냅샷 확인', en: 'See your Glow snapshot', zh: '查看 Glow 快照', ja: 'Glowスナップショットを見る' },
  },
  {
    file: '05-photo-details.png',
    caption: { ko: '사진 속 근거를 팁으로', en: 'Turn photo details into tips', zh: '将照片细节变成建议', ja: '写真の要素をヒントに' },
  },
  {
    file: '06-history.png',
    caption: { ko: '리포트를 기기에 저장', en: 'Keep reports on your device', zh: '将报告保存在设备上', ja: 'レポートを端末に保存' },
  },
  {
    file: '07-share-card.png',
    caption: { ko: 'Glow 카드로 공유', en: 'Share a polished Glow card', zh: '分享精美 Glow 卡片', ja: 'Glowカードを共有' },
  },
  {
    file: '08-settings.png',
    caption: { ko: '개인정보를 고려한 설정', en: 'Privacy-first controls', zh: '注重隐私的设置', ja: 'プライバシーに配慮した設定' },
  },
] satisfies Array<{ file: string; caption: Record<Lang, string> }>;

function glowUpLocalizedScreenshots(locale: 'ko' | 'en' | 'zh' | 'ja'): AppScreenshot[] {
  return glowUpScreenshots.map((screenshot) => ({
    src: `/app-screenshots/glowup/${locale}/${screenshot.file}`,
    caption: screenshot.caption,
  }));
}

export const apps: AppInfo[] = [
  {
    id: 'marknote',
    iconUrl: '/app-icons/marknote.png',
    hasTermsPage: true,
    name: {
      ko: 'MarkNote',
      en: 'MarkNote',
      zh: 'MarkNote',
      ja: 'MarkNote',
    },
    tagline: {
      ko: 'Markdown 파일을 로컬 폴더와 Google Drive 작업 폴더에서 바로 열고 저장하는 local-first 편집기입니다.',
      en: 'A local-first Markdown editor that opens and saves files directly in local and Google Drive work folders.',
      zh: '一款 local-first Markdown 编辑器，可直接打开并保存本地文件夹和 Google Drive 工作文件夹中的文件。',
      ja: 'ローカルフォルダと Google Drive 作業フォルダの Markdown ファイルを直接開いて保存できる local-first エディタです。',
    },
    description: {
      ko: 'MarkNote는 원본 .md, .markdown, .txt 파일을 앱 전용 데이터베이스에 가두지 않고 Android에서 빠르게 편집하고 안전하게 저장하도록 돕습니다.',
      en: 'MarkNote helps you edit original .md, .markdown, and .txt files quickly on Android without locking documents into a private app database.',
      zh: 'MarkNote 可在 Android 上快速编辑原始 .md、.markdown 和 .txt 文件，不会把文档锁进应用专用数据库。',
      ja: 'MarkNote は元の .md、.markdown、.txt ファイルをアプリ専用データベースに閉じ込めず、Android で素早く編集して安全に保存できます。',
    },
    features: {
      ko: ['로컬 폴더와 Google Drive 작업 폴더의 원본 파일 직접 편집', '굵게, 링크, 이미지, 표, 코드 블록, Mermaid 차트를 돕는 Markdown 툴바', '앱 내 미리보기와 HTML/PDF 내보내기', '파일명과 본문 검색, 새 문서 만들기, 이름 변경, 이동, 복사, 삭제', '자동 저장, 임시 초안 복구, 외부 변경 충돌 감지'],
      en: ['Edit original files directly in local and Google Drive work folders', 'Markdown toolbar for bold, links, images, tables, code blocks, and Mermaid charts', 'In-app preview plus HTML/PDF export', 'File name and body search with create, rename, move, copy, and delete actions', 'Auto save, temporary draft recovery, and external change conflict detection'],
      zh: ['直接编辑本地文件夹和 Google Drive 工作文件夹中的原始文件', 'Markdown 工具栏支持粗体、链接、图片、表格、代码块和 Mermaid 图表', '应用内预览，并可导出 HTML/PDF', '支持文件名和正文搜索，以及新建、重命名、移动、复制、删除', '自动保存、临时草稿恢复和外部变更冲突检测'],
      ja: ['ローカルフォルダと Google Drive 作業フォルダの元ファイルを直接編集', '太字、リンク、画像、表、コードブロック、Mermaid 図を入力しやすい Markdown ツールバー', 'アプリ内プレビューと HTML/PDF エクスポート', 'ファイル名と本文の検索、新規作成、名前変更、移動、コピー、削除', '自動保存、一時下書きの復元、外部変更の競合検出'],
    },
    recommendedFor: {
      ko: ['Syncthing, Google Drive, Dropbox, 파일 관리자 폴더의 Markdown 문서를 그대로 쓰고 싶은 사용자', '모바일에서 기술 문서, 블로그 초안, 회의록, 체크리스트, AI 프롬프트를 작성하는 사용자', '앱 전용 클라우드나 계정 없이 단순한 편집기를 원하는 사용자'],
      en: ['People who keep Markdown documents in Syncthing, Google Drive, Dropbox, or file manager folders', 'Developers, writers, and note takers drafting technical notes, blog posts, meeting notes, checklists, or AI prompts on mobile', 'Users who want a focused editor without a required app cloud or proprietary account'],
      zh: ['想继续使用 Syncthing、Google Drive、Dropbox 或文件管理器文件夹中的 Markdown 文档的用户', '在手机上撰写技术文档、博客草稿、会议记录、清单或 AI prompt 的开发者、写作者和笔记用户', '想要无需应用云端或专有账号的专注编辑器的用户'],
      ja: ['Syncthing、Google Drive、Dropbox、ファイル管理アプリのフォルダにある Markdown 文書をそのまま使いたい方', '技術文書、ブログ下書き、議事録、チェックリスト、AI プロンプトをモバイルで書く開発者、ライター、メモ利用者', '専用クラウドや独自アカウントが必須ではない集中できるエディタを求める方'],
    },
    supportNote: {
      ko: 'MarkNote는 자체 계정, 자체 클라우드 동기화, 광고, 외부 analytics SDK를 제공하지 않습니다. Google Drive 작업 폴더 기능은 사용자가 선택한 Drive 파일을 읽고 저장하기 위해 Google 계정 승인을 사용합니다.',
      en: 'MarkNote does not provide its own account system, app cloud sync, ads, or external analytics SDK. The Google Drive work folder feature uses Google authorization to read and save the Drive files you choose.',
      zh: 'MarkNote 不提供自有账号系统、自有云同步、广告或外部 analytics SDK。Google Drive 工作文件夹功能会使用 Google 授权来读取和保存你选择的 Drive 文件。',
      ja: 'MarkNote は独自アカウント、独自クラウド同期、広告、外部 analytics SDK を提供しません。Google Drive 作業フォルダ機能では、選択した Drive ファイルの読み書きに Google 認証を使用します。',
    },
    screenshots: {
      ko: [
        {
          src: '/app-screenshots/marknote/ko/01-workspace.png',
          caption: { ko: '작업 폴더와 최근 파일', en: 'Work folders and recent files', zh: '工作文件夹和最近文件', ja: '作業フォルダと最近のファイル' },
        },
        {
          src: '/app-screenshots/marknote/ko/02-editor.png',
          caption: { ko: 'Markdown 편집기', en: 'Markdown editor', zh: 'Markdown 编辑器', ja: 'Markdown エディタ' },
        },
        {
          src: '/app-screenshots/marknote/ko/03-preview.png',
          caption: { ko: '문서 미리보기', en: 'Document preview', zh: '文档预览', ja: '文書プレビュー' },
        },
        {
          src: '/app-screenshots/marknote/ko/04-search.png',
          caption: { ko: '파일과 본문 검색', en: 'File and body search', zh: '文件和正文搜索', ja: 'ファイルと本文検索' },
        },
        {
          src: '/app-screenshots/marknote/ko/05-export-settings.png',
          caption: { ko: '내보내기와 설정', en: 'Export and settings', zh: '导出和设置', ja: 'エクスポートと設定' },
        },
      ],
      en: [
        {
          src: '/app-screenshots/marknote/en/01-workspace.png',
          caption: { ko: '작업 폴더와 최근 파일', en: 'Work folders and recent files', zh: '工作文件夹和最近文件', ja: '作業フォルダと最近のファイル' },
        },
        {
          src: '/app-screenshots/marknote/en/02-editor.png',
          caption: { ko: 'Markdown 편집기', en: 'Markdown editor', zh: 'Markdown 编辑器', ja: 'Markdown エディタ' },
        },
        {
          src: '/app-screenshots/marknote/en/03-preview.png',
          caption: { ko: '문서 미리보기', en: 'Document preview', zh: '文档预览', ja: '文書プレビュー' },
        },
        {
          src: '/app-screenshots/marknote/en/04-search.png',
          caption: { ko: '파일과 본문 검색', en: 'File and body search', zh: '文件和正文搜索', ja: 'ファイルと本文検索' },
        },
        {
          src: '/app-screenshots/marknote/en/05-export-settings.png',
          caption: { ko: '내보내기와 설정', en: 'Export and settings', zh: '导出和设置', ja: 'エクスポートと設定' },
        },
      ],
      ja: [
        {
          src: '/app-screenshots/marknote/ja/01-workspace.png',
          caption: { ko: '작업 폴더와 최근 파일', en: 'Work folders and recent files', zh: '工作文件夹和最近文件', ja: '作業フォルダと最近のファイル' },
        },
        {
          src: '/app-screenshots/marknote/ja/02-editor.png',
          caption: { ko: 'Markdown 편집기', en: 'Markdown editor', zh: 'Markdown 编辑器', ja: 'Markdown エディタ' },
        },
        {
          src: '/app-screenshots/marknote/ja/03-preview.png',
          caption: { ko: '문서 미리보기', en: 'Document preview', zh: '文档预览', ja: '文書プレビュー' },
        },
        {
          src: '/app-screenshots/marknote/ja/04-search.png',
          caption: { ko: '파일과 본문 검색', en: 'File and body search', zh: '文件和正文搜索', ja: 'ファイルと本文検索' },
        },
        {
          src: '/app-screenshots/marknote/ja/05-export-settings.png',
          caption: { ko: '내보내기와 설정', en: 'Export and settings', zh: '导出和设置', ja: 'エクスポートと設定' },
        },
      ],
    },
    category: 'productivity',
    operatingSystem: 'Android, Web',
    googlePlayUrl: 'https://play.google.com/store/apps/details?id=com.kokomasoft.marknote',
    webUrl: 'https://md.kokomasoft.com/',
    introVideoUrl: 'https://www.youtube.com/shorts/f1_EF5rne8Y',
  },
  {
    id: 'lifelotto',
    iconUrl: '/app-icons/lifelotto.png',
    name: {
      ko: '인생로또 645',
      en: 'Life Lotto 645',
      zh: '人生乐透 645',
      ja: '人生ロト 645',
    },
    tagline: {
      ko: '번호 생성, 저장, 당첨 결과 확인, 통계 분석까지 로또 루틴을 한곳에서 관리합니다.',
      en: 'Manage lotto number picks, saved tickets, winning results, and statistics in one place.',
      zh: '集中管理彩票号码生成、保存、开奖结果和统计分析。',
      ja: '番号生成、保存、当選結果確認、統計分析までロト習慣をまとめて管理できます。',
    },
    description: {
      ko: '로또 번호 생성과 당첨 결과 분석을 한 곳에서! 나만의 행운 번호를 찾아보세요.',
      en: 'Generate lotto numbers and analyze winning results in one place! Find your lucky numbers.',
      zh: '在一个地方生成彩票号码并分析中奖结果！找到属于您的幸运号码。',
      ja: 'ロト番号の生成と当選結果の分析をワンストップで！あなただけのラッキーナンバーを見つけましょう。',
    },
    features: {
      ko: ['추천 번호와 랜덤 번호 생성', '내 번호 저장 및 기록 관리', '당첨 번호 입력과 결과 확인', '번호별 출현 빈도와 통계 분석'],
      en: ['Recommended and random number generation', 'Saved number history', 'Winning number entry and result checks', 'Number frequency and statistics'],
      zh: ['推荐号码与随机号码生成', '保存并管理我的号码记录', '输入开奖号码并查看结果', '号码出现频率与统计分析'],
      ja: ['おすすめ番号とランダム番号の生成', '自分の番号の保存と履歴管理', '当選番号の入力と結果確認', '番号別出現頻度と統計分析'],
    },
    recommendedFor: {
      ko: ['로또 번호를 매주 따로 메모하던 사용자', '저장한 번호와 당첨 결과를 함께 보고 싶은 사용자', '출현 빈도 같은 간단한 통계를 참고하고 싶은 사용자'],
      en: ['People who usually write lotto picks in separate notes', 'Users who want saved numbers and results together', 'Anyone who wants simple frequency statistics before picking numbers'],
      zh: ['习惯每周单独记录彩票号码的用户', '想把保存号码和开奖结果放在一起查看的用户', '想参考简单出现频率统计的用户'],
      ja: ['毎週のロト番号を別々にメモしている方', '保存した番号と結果を一緒に見たい方', '出現頻度などの簡単な統計を参考にしたい方'],
    },
    supportNote: {
      ko: '저장한 번호와 이용 관련 문의는 이메일로 접수합니다.',
      en: 'Questions about saved numbers or app usage can be sent by email.',
      zh: '关于保存号码或使用方式的问题可通过邮件联系。',
      ja: '保存した番号や利用方法に関する問い合わせはメールで受け付けています。',
    },
    category: 'entertainment',
    googlePlayUrl: 'https://play.google.com/store/apps/details?id=com.kokomasoft.lifelotto',
    appStoreUrl: 'https://apps.apple.com/kr/app/%EC%9D%B8%EC%83%9D%EB%A1%9C%EB%98%90-645/id6752466063',
    introVideoUrl: 'https://www.youtube.com/shorts/dASuSVpuLdA',
  },
  {
    id: 'lifepension',
    iconUrl: '/app-icons/lifepension.png',
    name: {
      ko: '인생연금 720',
      en: 'Life Pension 720',
      zh: '人生年金 720',
      ja: '人生年金 720',
    },
    tagline: {
      ko: '연금복권720+ 당첨 확인, QR 스캔, 번호 저장, 통계 분석과 추천을 한곳에서 관리합니다.',
      en: 'Check Pension Lottery 720+ results, scan QR codes, save picks, and use statistics-based recommendations in one place.',
      zh: '集中查看韩国 Pension Lottery 720+ 结果、扫描 QR、保存号码，并参考统计分析推荐。',
      ja: '韓国 Pension Lottery 720+ の結果確認、QRスキャン、番号保存、統計分析とおすすめを一つにまとめます。',
    },
    description: {
      ko: '인생연금 720은 매주 연금복권720+ 당첨 번호를 확인하고, 구매한 번호를 저장하며, 빈도·분포·패턴 통계를 참고해 번호 조합을 관리할 수 있는 복권 도우미 앱입니다.',
      en: 'Life Pension 720 helps Korean Pension Lottery 720+ players check weekly results, save purchased numbers, and review frequency, distribution, and pattern statistics before organizing picks.',
      zh: '人生年金 720 可帮助韩国 Pension Lottery 720+ 用户查看每周开奖结果、保存已购号码，并参考频率、分布和模式统计来管理号码组合。',
      ja: '人生年金 720 は、韓国 Pension Lottery 720+ の週間結果確認、購入番号の保存、頻度・分布・パターン統計を参考にした番号管理を支援するアプリです。',
    },
    features: {
      ko: ['최신 회차와 과거 회차 당첨 번호 확인', 'QR 코드 스캔과 갤러리 이미지 인식으로 빠른 당첨 확인', '구매 번호 저장, 즐겨찾기, 메모, 자동 확인 알림', '조별·자리별 빈도, 분포, 패턴, 핫/콜드 번호 분석', '1등·2등·보너스 당첨금과 세후 수령액 계산'],
      en: ['Latest and historical draw result checks', 'QR code scanning and gallery image recognition for quick verification', 'Saved numbers, favorites, memos, and automatic result alerts', 'Group and digit frequency, distribution, pattern, and hot/cold number analysis', 'Prize and after-tax payout calculators for first, second, and bonus prizes'],
      zh: ['查看最新和历史开奖信息', '通过 QR 扫描和相册图片识别快速核对中奖结果', '保存号码、收藏、备注和自动结果提醒', '按组别和位数分析频率、分布、模式以及热门/冷门号码', '计算一等奖、二等奖和特别奖的奖金及税后金额'],
      ja: ['最新回と過去回の当選番号確認', 'QRコードスキャンとギャラリー画像認識による素早い照合', '購入番号の保存、お気に入り、メモ、自動結果通知', '組別・桁別の頻度、分布、パターン、ホット/コールド番号分析', '1等・2等・ボーナス賞金と税引後受取額の計算'],
    },
    recommendedFor: {
      ko: ['연금복권720+ 구매 번호를 매주 기록하고 싶은 사용자', 'QR 스캔으로 빠르게 당첨 여부를 확인하고 싶은 사용자', '빈도와 패턴 같은 참고 통계를 함께 보고 싶은 사용자'],
      en: ['People who want to record Korean Pension Lottery 720+ picks every week', 'Users who want fast result checks with QR scanning', 'Anyone who wants reference statistics such as frequency and patterns while choosing numbers'],
      zh: ['想每周记录韩国 Pension Lottery 720+ 号码的用户', '想通过 QR 扫描快速确认中奖结果的用户', '想在选号时参考频率和模式统计的用户'],
      ja: ['韓国 Pension Lottery 720+ の購入番号を毎週記録したい方', 'QRスキャンで素早く当選確認をしたい方', '番号選びの参考として頻度やパターン統計も見たい方'],
    },
    supportNote: {
      ko: '인생연금 720은 당첨을 보장하지 않는 정보·분석 도구입니다. 저장 번호, QR 스캔, 알림, 클라우드 동기화, 통계 기능 관련 문의는 이메일로 접수합니다.',
      en: 'Life Pension 720 is an information and analysis tool and does not guarantee winnings. Email support is available for saved numbers, QR scanning, alerts, cloud sync, and statistics questions.',
      zh: '人生年金 720 是信息和分析工具，不保证中奖。关于保存号码、QR 扫描、提醒、云同步和统计功能的问题可通过邮件联系。',
      ja: '人生年金 720 は情報・分析ツールであり、当選を保証するものではありません。保存番号、QRスキャン、通知、クラウド同期、統計機能に関する問い合わせはメールで受け付けています。',
    },
    screenshots: {
      ko: [
        {
          src: '/app-screenshots/lifepension/results.png',
          caption: { ko: '당첨 기록', en: 'Draw history', zh: '开奖历史', ja: '当選履歴' },
        },
        {
          src: '/app-screenshots/lifepension/recommendations.png',
          caption: { ko: '번호 추천', en: 'Number recommendations', zh: '号码推荐', ja: '番号おすすめ' },
        },
        {
          src: '/app-screenshots/lifepension/statistics.png',
          caption: { ko: '통계 분석', en: 'Statistics', zh: '统计分析', ja: '統計分析' },
        },
        {
          src: '/app-screenshots/lifepension/saved-numbers.png',
          caption: { ko: '내 번호 관리', en: 'Saved numbers', zh: '保存号码', ja: '保存番号' },
        },
      ],
      en: [
        {
          src: '/app-screenshots/lifepension/results.png',
          caption: { ko: '당첨 기록', en: 'Draw history', zh: '开奖历史', ja: '当選履歴' },
        },
        {
          src: '/app-screenshots/lifepension/recommendations.png',
          caption: { ko: '번호 추천', en: 'Number recommendations', zh: '号码推荐', ja: '番号おすすめ' },
        },
        {
          src: '/app-screenshots/lifepension/statistics.png',
          caption: { ko: '통계 분석', en: 'Statistics', zh: '统计分析', ja: '統計分析' },
        },
        {
          src: '/app-screenshots/lifepension/saved-numbers.png',
          caption: { ko: '내 번호 관리', en: 'Saved numbers', zh: '保存号码', ja: '保存番号' },
        },
      ],
      zh: [
        {
          src: '/app-screenshots/lifepension/results.png',
          caption: { ko: '당첨 기록', en: 'Draw history', zh: '开奖历史', ja: '当選履歴' },
        },
        {
          src: '/app-screenshots/lifepension/recommendations.png',
          caption: { ko: '번호 추천', en: 'Number recommendations', zh: '号码推荐', ja: '番号おすすめ' },
        },
        {
          src: '/app-screenshots/lifepension/statistics.png',
          caption: { ko: '통계 분석', en: 'Statistics', zh: '统计分析', ja: '統計分析' },
        },
        {
          src: '/app-screenshots/lifepension/saved-numbers.png',
          caption: { ko: '내 번호 관리', en: 'Saved numbers', zh: '保存号码', ja: '保存番号' },
        },
      ],
      ja: [
        {
          src: '/app-screenshots/lifepension/results.png',
          caption: { ko: '당첨 기록', en: 'Draw history', zh: '开奖历史', ja: '当選履歴' },
        },
        {
          src: '/app-screenshots/lifepension/recommendations.png',
          caption: { ko: '번호 추천', en: 'Number recommendations', zh: '号码推荐', ja: '番号おすすめ' },
        },
        {
          src: '/app-screenshots/lifepension/statistics.png',
          caption: { ko: '통계 분석', en: 'Statistics', zh: '统计分析', ja: '統計分析' },
        },
        {
          src: '/app-screenshots/lifepension/saved-numbers.png',
          caption: { ko: '내 번호 관리', en: 'Saved numbers', zh: '保存号码', ja: '保存番号' },
        },
      ],
    },
    category: 'entertainment',
    operatingSystem: 'Android, iOS',
    googlePlayUrl: 'https://play.google.com/store/apps/details?id=com.kokomasoft.lifepension',
    appStoreUrl: 'https://apps.apple.com/kr/app/%EC%9D%B8%EC%83%9D%EC%97%B0%EA%B8%88-720/id6753057731',
  },
  {
    id: 'mytube',
    iconUrl: '/app-icons/mytube.png',
    name: {
      ko: 'MyTube - Trending Videos Hub',
      en: 'MyTube - Trending Videos Hub',
      zh: 'MyTube - 热门视频中心',
      ja: 'MyTube - トレンド動画ハブ',
    },
    tagline: {
      ko: '전 세계 인기 영상을 카테고리별로 찾고, 검색하고, 플레이리스트로 정리합니다.',
      en: 'Find trending videos by category, search what matters, and organize videos into playlists.',
      zh: '按类别发现全球热门视频，搜索内容并整理到播放列表。',
      ja: '世界のトレンド動画をカテゴリ別に探し、検索してプレイリストに整理できます。',
    },
    description: {
      ko: '전 세계 트렌딩 영상을 한눈에! 인기 있는 동영상을 카테고리별로 탐색하세요.',
      en: 'Discover trending videos from around the world! Browse popular videos by category.',
      zh: '一览全球热门视频！按类别浏览热门视频内容。',
      ja: '世界中のトレンド動画を一目で！カテゴリ別に人気動画を探索しましょう。',
    },
    features: {
      ko: ['일일 트렌딩 영상 탐색', '카테고리별 인기 영상 브라우징', '영상 검색과 발견', '맞춤 플레이리스트와 시청 기록', 'Picture-in-Picture 모드'],
      en: ['Daily trending video discovery', 'Browse popular videos by category', 'Video search and discovery', 'Custom playlists and watch history', 'Picture-in-Picture mode'],
      zh: ['每日热门视频发现', '按类别浏览热门视频', '视频搜索与发现', '自定义播放列表和观看历史', '画中画模式'],
      ja: ['毎日のトレンド動画発見', 'カテゴリ別の人気動画ブラウズ', '動画検索と発見', 'カスタムプレイリストと視聴履歴', 'ピクチャーインピクチャーモード'],
    },
    recommendedFor: {
      ko: ['여러 카테고리의 인기 영상을 빠르게 훑어보고 싶은 사용자', '검색과 시청 기록을 한곳에서 관리하고 싶은 사용자', '관심 영상을 플레이리스트로 정리하고 싶은 사용자'],
      en: ['Users who want a quick scan of popular videos across categories', 'People who want search and watch history in one place', 'Anyone who organizes interesting videos into playlists'],
      zh: ['想快速浏览多个类别热门视频的用户', '想集中管理搜索和观看历史的用户', '想把感兴趣的视频整理到播放列表的用户'],
      ja: ['複数カテゴリの人気動画をすばやく確認したい方', '検索と視聴履歴を一か所で管理したい方', '気になる動画をプレイリストで整理したい方'],
    },
    supportNote: {
      ko: '영상 탐색, 플레이리스트, 기록 관리 관련 문의를 이메일로 받습니다.',
      en: 'Email support is available for video discovery, playlist, and history questions.',
      zh: '视频浏览、播放列表和历史记录相关问题可通过邮件联系。',
      ja: '動画探索、プレイリスト、履歴管理に関する問い合わせはメールで受け付けています。',
    },
    category: 'entertainment',
    operatingSystem: 'Android, iOS, Web',
    googlePlayUrl: 'https://play.google.com/store/apps/details?id=com.kokomasoft.hottube',
    appStoreUrl: 'https://apps.apple.com/kr/app/my-tube/id6738738608',
    webUrl: 'https://mytube.kokomasoft.com/',
    introVideoUrl: 'https://www.youtube.com/shorts/qcywcf0MY7A',
  },
  {
    id: 'onul',
    iconUrl: '/app-icons/onul.png',
    name: {
      ko: 'Onul',
      en: 'Onul',
      zh: 'Onul',
      ja: 'Onul',
    },
    tagline: {
      ko: '짧은 기록과 음성 일기로 감정을 남기고, AI 분석과 코칭으로 마음의 흐름을 봅니다.',
      en: 'Capture short notes or voice diaries, then use AI analysis and coaching to understand your mood patterns.',
      zh: '用短记录或语音日记留下感受，并通过 AI 分析和辅导了解情绪变化。',
      ja: '短い記録や音声日記を残し、AI分析とコーチングで気持ちの流れを見つめます。',
    },
    description: {
      ko: '오늘 하루를 마음챙김으로 시작하세요. 명상과 일상 기록으로 더 나은 하루를 만들어갑니다.',
      en: 'Start your day with mindfulness. Build better days through meditation and daily journaling.',
      zh: '以正念开启新的一天。通过冥想和日常记录打造更美好的每一天。',
      ja: '今日一日をマインドフルネスで始めましょう。瞑想と日々の記録でより良い毎日を作ります。',
    },
    features: {
      ko: ['AI 감정 점수와 핵심 태그 분석', '음성 일기의 자동 텍스트 변환', 'AI 코치와의 대화', '주간·월간 감정 리포트', '연속 기록과 작은 성취 추적'],
      en: ['AI emotion scores and key tags', 'Voice diary transcription', 'AI coach conversations', 'Weekly and monthly mood reports', 'Gentle streak and progress tracking'],
      zh: ['AI 情绪分数和关键标签', '语音日记自动转文字', 'AI 辅导对话', '每周和每月情绪报告', '连续记录和小成就追踪'],
      ja: ['AI感情スコアとキータグ分析', '音声日記の自動文字起こし', 'AIコーチとの対話', '週次・月次の感情レポート', '継続記録と小さな達成の追跡'],
    },
    recommendedFor: {
      ko: ['긴 일기보다 짧은 기록을 꾸준히 남기고 싶은 사용자', '내 감정 패턴을 데이터로 보고 싶은 사용자', '생각이 복잡한 날 부담 없이 정리하고 싶은 사용자'],
      en: ['People who prefer short, consistent journaling over long entries', 'Users who want to see mood patterns as data', 'Anyone who wants a low-pressure way to untangle thoughts'],
      zh: ['比起长篇日记，更想持续留下短记录的用户', '想用数据查看情绪模式的用户', '想在思绪复杂时轻松整理想法的用户'],
      ja: ['長い日記より短い記録を続けたい方', '自分の感情パターンをデータで見たい方', '考えが絡まった日に気軽に整理したい方'],
    },
    supportNote: {
      ko: '계정 삭제 안내가 제공되며, 일기 데이터와 AI 기능 관련 문의를 이메일로 받습니다.',
      en: 'Account deletion guidance is available, and email support covers diary data and AI feature questions.',
      zh: '提供账号删除说明，日记数据和 AI 功能相关问题可通过邮件联系。',
      ja: 'アカウント削除案内を提供しており、日記データやAI機能に関する問い合わせはメールで受け付けています。',
    },
    screenshots: {
      ko: [
        {
          src: '/app-screenshots/onul/ko/home.png',
          caption: { ko: '일기 홈', en: 'Diary home', zh: '日记主页', ja: '日記ホーム' },
        },
        {
          src: '/app-screenshots/onul/ko/analysis.png',
          caption: { ko: '감정 분석', en: 'Emotion analysis', zh: '情绪分析', ja: '感情分析' },
        },
        {
          src: '/app-screenshots/onul/ko/coaching.png',
          caption: { ko: 'AI 코칭', en: 'AI coaching', zh: 'AI 辅导', ja: 'AIコーチング' },
        },
      ],
      en: [
        {
          src: '/app-screenshots/onul/en/home.png',
          caption: { ko: '일기 홈', en: 'Diary home', zh: '日记主页', ja: '日記ホーム' },
        },
        {
          src: '/app-screenshots/onul/en/analysis.png',
          caption: { ko: '감정 분석', en: 'Emotion analysis', zh: '情绪分析', ja: '感情分析' },
        },
        {
          src: '/app-screenshots/onul/en/coaching.png',
          caption: { ko: 'AI 코칭', en: 'AI coaching', zh: 'AI 辅导', ja: 'AIコーチング' },
        },
      ],
      ja: [
        {
          src: '/app-screenshots/onul/ja/home.png',
          caption: { ko: '일기 홈', en: 'Diary home', zh: '日记主页', ja: '日記ホーム' },
        },
        {
          src: '/app-screenshots/onul/ja/analysis.png',
          caption: { ko: '감정 분석', en: 'Emotion analysis', zh: '情绪分析', ja: '感情分析' },
        },
        {
          src: '/app-screenshots/onul/ja/coaching.png',
          caption: { ko: 'AI 코칭', en: 'AI coaching', zh: 'AI 辅导', ja: 'AIコーチング' },
        },
      ],
    },
    category: 'lifestyle',
    googlePlayUrl: 'https://play.google.com/store/apps/details?id=com.kokomasoft.mindfulecho',
    introVideoUrl: 'https://www.youtube.com/shorts/8UVL8eX9r50',
    supportsAccountDeletion: true,
  },
  {
    id: 'smartbap',
    iconUrl: '/app-icons/smartbap.png',
    name: {
      ko: '스마트밥',
      en: 'SmartBap',
      zh: '智慧餐盤',
      ja: 'スマートごはん',
    },
    tagline: {
      ko: '사진, 검색, 직접 입력으로 식사를 기록하고 최근 7일 브리핑과 일/주/월 통계로 영양 균형을 확인합니다.',
      en: 'Log meals by photo, search, or manual entry, then review nutrition balance with 7-day briefings and daily, weekly, and monthly stats.',
      zh: '可透過照片、搜尋或手動輸入記錄餐點，並用最近 7 天簡報與日/週/月統計查看營養均衡。',
      ja: '写真、検索、直接入力で食事を記録し、直近7日間のブリーフィングと日/週/月の統計で栄養バランスを確認できます。',
    },
    description: {
      ko: '스마트밥은 음식 사진 AI 분석과 14만 건 이상의 식품영양성분 DB를 활용해 날짜별 식단, 칼로리 통계, 개인화 목표, 최근 식단 브리핑을 한곳에서 관리하는 식단 기록 앱입니다.',
      en: 'SmartBap combines food-photo AI analysis with a 140,000+ item nutrition database so you can manage date-based meal records, calorie stats, personalized goals, and recent diet briefings in one place.',
      zh: '智慧餐盤結合食物照片 AI 分析與 14 萬筆以上食物營養資料庫，集中管理依日期的飲食紀錄、熱量統計、個人化目標與近期飲食簡報。',
      ja: 'スマートごはんは食品写真AI分析と14万件以上の食品栄養成分DBを組み合わせ、日付別の食事記録、カロリー統計、個人化目標、最近の食事ブリーフィングを一か所で管理できます。',
    },
    features: {
      ko: ['카메라 촬영, 갤러리 선택, 음식 검색, 직접 입력으로 아침/점심/저녁/간식 기록', '14만 건 이상의 식품영양성분 DB 기준 칼로리, 탄수화물, 단백질, 지방 계산과 그램 단위 조정', '달력 기반 날짜 선택, 끼니별 카드, 식사 상세 화면에서 음식 구성과 양 편집', '일/주/월 칼로리 추이, 끼니별 통계, 목표 대비 진행률 확인', '최근 7일 식단 브리핑, 프로필 기반 하루 목표 칼로리, 6개 테마와 라이트/다크/다이내믹 컬러'],
      en: ['Log breakfast, lunch, dinner, and snacks from camera capture, gallery import, food search, or manual entry', 'Calculate calories, carbs, protein, and fat from a 140,000+ item nutrition database with gram-level adjustments', 'Pick dates from the calendar, review meal cards, and edit food composition and portions on the meal detail screen', 'Review daily, weekly, and monthly calorie trends, meal splits, and progress against your target', 'Use 7-day diet briefings, profile-based daily calorie targets, six themes, and light, dark, or dynamic color modes'],
      zh: ['可透過相機、相簿、食物搜尋或手動輸入記錄早餐、午餐、晚餐與點心', '依 14 萬筆以上食物營養資料庫計算熱量、碳水、蛋白質與脂肪，並可用克數調整', '用日曆選擇日期，查看各餐卡片，並在餐點詳細畫面編輯食物組成與份量', '查看日/週/月熱量趨勢、餐別統計與目標達成進度', '提供最近 7 天飲食簡報、依個人資料推估每日目標熱量、6 種主題與淺色/深色/動態色彩模式'],
      ja: ['カメラ撮影、ギャラリー選択、食品検索、直接入力で朝食・昼食・夕食・間食を記録', '14万件以上の食品栄養成分DBにもとづき、カロリー、炭水化物、たんぱく質、脂質を計算し、グラム単位で調整', 'カレンダーで日付を選び、食事カードを確認し、食事詳細画面で食品構成と量を編集', '日/週/月のカロリー推移、食事別統計、目標に対する進捗を確認', '直近7日間の食事ブリーフィング、プロフィールにもとづく1日の目標カロリー、6つのテーマとライト/ダーク/ダイナミックカラーに対応'],
    },
    recommendedFor: {
      ko: ['사진으로 빠르게 식사를 남기고 저장 전 음식과 양을 직접 확인하고 싶은 사용자', '하루 목표 칼로리와 끼니별 섭취 패턴을 일/주/월로 비교하고 싶은 사용자', '최근 7일 식단을 바탕으로 식사량과 영양 균형을 가볍게 점검하고 싶은 사용자', '계정 없이 로컬 중심으로 식단 기록을 관리하고 싶은 사용자'],
      en: ['People who want to log meals quickly from photos while checking food names and portions before saving', 'Users who want to compare daily calorie targets and meal-by-meal intake patterns by day, week, and month', 'Anyone who wants a light 7-day review of meal volume and nutrition balance', 'Users who prefer local-first meal records without creating an account'],
      zh: ['想用照片快速記錄餐點，並在儲存前確認食物名稱與份量的使用者', '想用日/週/月比較每日目標熱量與各餐攝取模式的使用者', '想根據最近 7 天飲食輕量檢查食量與營養均衡的使用者', '偏好不建立帳號、以本機為中心管理飲食紀錄的使用者'],
      ja: ['写真で素早く食事を記録し、保存前に食品名と量を確認したい方', '1日の目標カロリーと食事別の摂取パターンを日/週/月で比較したい方', '直近7日間の食事をもとに、食事量と栄養バランスを軽く見直したい方', 'アカウントなしでローカル中心に食事記録を管理したい方'],
    },
    supportNote: {
      ko: '스마트밥의 칼로리 목표, 통계, 브리핑은 기록 기반 생활 참고 정보이며 의료 진단이나 전문 영양 상담을 대체하지 않습니다. 원격 AI 분석과 광고 표시가 활성화된 빌드에서는 관련 제3자 서비스가 데이터를 처리할 수 있습니다.',
      en: 'SmartBap calorie goals, statistics, and briefings are record-based lifestyle references and do not replace medical diagnosis or professional nutrition advice. Builds with remote AI analysis and ads enabled may process data through related third-party services.',
      zh: '智慧餐盤的熱量目標、統計與簡報是根據紀錄提供的生活參考資訊，不會取代醫療診斷或專業營養諮詢。啟用遠端 AI 分析與廣告顯示的版本，可能會由相關第三方服務處理資料。',
      ja: 'スマートごはんのカロリー目標、統計、ブリーフィングは記録にもとづく生活参考情報であり、医療診断や専門的な栄養相談の代わりではありません。リモートAI分析と広告表示が有効なビルドでは、関連する第三者サービスがデータを処理する場合があります。',
    },
    screenshots: {
      ko: smartBapLocalizedScreenshots('ko'),
      en: smartBapLocalizedScreenshots('ko'),
      zh: smartBapLocalizedScreenshots('zh'),
      ja: smartBapLocalizedScreenshots('ja'),
    },
    category: 'lifestyle',
    operatingSystem: 'iOS, iPadOS, Android',
    googlePlayUrl: 'https://play.google.com/store/apps/details?id=com.kokomasoft.smartbap',
    appStoreUrl: 'https://apps.apple.com/kr/app/%EC%8A%A4%EB%A7%88%ED%8A%B8%EB%B0%A5/id6752108069',
  },
  {
    id: 'ungyeol',
    iconUrl: '/app-icons/ungyeol.png',
    name: {
      ko: '왕꽃선녀',
      en: 'Ungyeol',
      zh: 'Ungyeol',
      ja: 'Ungyeol',
    },
    tagline: {
      ko: '생년월일시 기반 오늘 운세, 현재 대운, 자유 질문, 타로, 궁합을 AI로 가볍게 확인합니다.',
      en: 'Check AI daily fortune, current major fortune, tarot, compatibility, and free-form saju questions from birth details.',
      zh: '根据出生信息查看 AI 每日运势、当前大运、塔罗、配对和自由提问。',
      ja: '生年月日時をもとに、今日の運勢、現在の大運、タロット、相性、自由質問をAIで確認できます。',
    },
    description: {
      ko: '왕꽃선녀는 생년월일시 기반 사주 정보와 타로 카드를 바탕으로 오늘의 흐름을 살펴보고, 질문과 궁합 풀이를 히스토리로 이어볼 수 있는 AI 운세 앱입니다.',
      en: 'Ungyeol combines birth-chart based saju readings with tarot and compatibility insights, then keeps your daily fortunes, questions, and readings in history.',
      zh: 'Ungyeol 结合出生八字、塔罗和配对解读，可查看每日走势、自由提问，并在历史记录中回顾结果。',
      ja: 'Ungyeolは生年月日時にもとづく四柱推命、タロット、相性鑑定を組み合わせ、今日の運勢や質問の結果を履歴で見返せるAI運勢アプリです。',
    },
    features: {
      ko: ['생년월일시, 성별, 출생 도시 기반 오늘 운세 점수와 분야별 흐름', '현재 대운의 큰 흐름과 필요할 때 펼쳐보는 상세 풀이', '일, 관계, 금전, 학업 등 자유 질문에 대한 AI 사주 풀이', '1장, 3장, 켈틱 스프레드를 지원하는 타로 리딩', '두 사람의 생년월일시를 바탕으로 보는 궁합과 히스토리 저장'],
      en: ['Daily fortune score, keywords, cautions, and category flows from birth details', 'Current major fortune with optional detailed readings', 'AI saju readings for free-form questions about work, relationships, money, or study', 'One-card, three-card, and Celtic tarot spreads', 'Compatibility readings from two birth profiles with saved history'],
      zh: ['根据出生日期、时间、性别和出生城市查看每日运势分数、关键词和领域走势', '查看当前大运的大方向，并可展开详细解读', '对工作、关系、金钱、学业等自由提问进行 AI 八字解读', '支持一张牌、三张牌和凯尔特十字塔罗牌阵', '根据两个人的出生信息查看配对，并保存历史记录'],
      ja: ['生年月日時、性別、出生都市から今日の運勢スコア、キーワード、注意点、分野別の流れを確認', '現在の大運の大きな流れと、必要な時に開ける詳細鑑定', '仕事、関係、お金、学業など自由質問へのAI四柱推命鑑定', '1枚、3枚、ケルト十字スプレッドに対応したタロット', '二人の生年月日時にもとづく相性鑑定と履歴保存'],
    },
    recommendedFor: {
      ko: ['매일의 운세 흐름을 짧고 보기 좋게 확인하고 싶은 사용자', '사주와 타로를 한 앱에서 함께 참고하고 싶은 사용자', '중요한 결정을 앞두고 생각을 정리할 소재가 필요한 사용자', '지난 풀이를 모아보고 흐름을 다시 확인하고 싶은 사용자'],
      en: ['People who want a quick daily fortune check', 'Anyone who wants saju and tarot in one app', 'Users who want prompts for reflection before an important decision', 'People who want to revisit past readings and notice patterns'],
      zh: ['想快速查看每日运势走势的用户', '想在一个应用中参考八字和塔罗的用户', '重要决定前需要整理想法素材的用户', '想回顾历史解读并观察走势的用户'],
      ja: ['毎日の運勢を短く見やすく確認したい方', '四柱推命とタロットを一つのアプリで参考にしたい方', '大切な決断の前に考えを整理する材料が欲しい方', '過去の鑑定を見返して流れを確認したい方'],
    },
    supportNote: {
      ko: '왕꽃선녀의 모든 풀이는 엔터테인먼트 목적의 참고 정보입니다. 의료, 법률, 투자 등 중요한 의사결정의 전문 자문을 대체하지 않으며, AI 풀이에는 오류나 누락이 포함될 수 있습니다.',
      en: 'Ungyeol readings are for entertainment and reflection only. They do not replace medical, legal, investment, or other professional advice, and AI responses may contain errors or omissions.',
      zh: 'Ungyeol 的所有解读仅用于娱乐和自我反思，不替代医疗、法律、投资等专业建议；AI 结果可能包含错误或遗漏。',
      ja: 'Ungyeolの鑑定はエンターテインメントと振り返り目的の参考情報です。医療、法律、投資などの専門的助言を代替せず、AI回答には誤りや抜けが含まれる場合があります。',
    },
    screenshots: {
      ko: [
        {
          src: '/app-screenshots/ungyeol/ko/home.png',
          caption: { ko: '오늘 운세와 현재 대운', en: 'Daily and major fortune', zh: '每日运势和大运', ja: '今日の運勢と大運' },
        },
        {
          src: '/app-screenshots/ungyeol/ko/question.png',
          caption: { ko: '자유 질문', en: 'Free-form question', zh: '自由提问', ja: '自由質問' },
        },
        {
          src: '/app-screenshots/ungyeol/ko/tarot.png',
          caption: { ko: '타로 리딩', en: 'Tarot reading', zh: '塔罗解读', ja: 'タロット鑑定' },
        },
        {
          src: '/app-screenshots/ungyeol/ko/compatibility.png',
          caption: { ko: '궁합 보기', en: 'Compatibility', zh: '配对', ja: '相性' },
        },
        {
          src: '/app-screenshots/ungyeol/ko/history.png',
          caption: { ko: '풀이 히스토리', en: 'Reading history', zh: '解读历史', ja: '鑑定履歴' },
        },
      ],
      en: [
        {
          src: '/app-screenshots/ungyeol/en/home.png',
          caption: { ko: '오늘 운세와 현재 대운', en: 'Daily and major fortune', zh: '每日运势和大运', ja: '今日の運勢と大運' },
        },
        {
          src: '/app-screenshots/ungyeol/en/question.png',
          caption: { ko: '자유 질문', en: 'Free-form question', zh: '自由提问', ja: '自由質問' },
        },
        {
          src: '/app-screenshots/ungyeol/en/tarot.png',
          caption: { ko: '타로 리딩', en: 'Tarot reading', zh: '塔罗解读', ja: 'タロット鑑定' },
        },
        {
          src: '/app-screenshots/ungyeol/en/compatibility.png',
          caption: { ko: '궁합 보기', en: 'Compatibility', zh: '配对', ja: '相性' },
        },
        {
          src: '/app-screenshots/ungyeol/en/history.png',
          caption: { ko: '풀이 히스토리', en: 'Reading history', zh: '解读历史', ja: '鑑定履歴' },
        },
      ],
      ja: [
        {
          src: '/app-screenshots/ungyeol/ja/home.png',
          caption: { ko: '오늘 운세와 현재 대운', en: 'Daily and major fortune', zh: '每日运势和大运', ja: '今日の運勢と大運' },
        },
        {
          src: '/app-screenshots/ungyeol/ja/question.png',
          caption: { ko: '자유 질문', en: 'Free-form question', zh: '自由提问', ja: '自由質問' },
        },
        {
          src: '/app-screenshots/ungyeol/ja/tarot.png',
          caption: { ko: '타로 리딩', en: 'Tarot reading', zh: '塔罗解读', ja: 'タロット鑑定' },
        },
        {
          src: '/app-screenshots/ungyeol/ja/compatibility.png',
          caption: { ko: '궁합 보기', en: 'Compatibility', zh: '配对', ja: '相性' },
        },
        {
          src: '/app-screenshots/ungyeol/ja/history.png',
          caption: { ko: '풀이 히스토리', en: 'Reading history', zh: '解读历史', ja: '鑑定履歴' },
        },
      ],
    },
    category: 'lifestyle',
    googlePlayUrl: 'https://play.google.com/store/apps/details?id=com.kokomasoft.ungyeol',
    introVideoUrl: 'https://www.youtube.com/shorts/WO983G2cULg',
  },
  {
    id: 'checkme',
    iconUrl: '/app-icons/checkme.png',
    name: {
      ko: '체크미',
      en: 'CheckMe',
      zh: 'CheckMe',
      ja: 'CheckMe',
    },
    tagline: {
      ko: '사진 한 장으로 오늘의 바이브를 가볍게 확인하고, 공유하기 좋은 결과 카드와 컨디션 팁을 받아보는 AI 미러 앱입니다.',
      en: 'An AI mirror for daily vibe checks — snap a photo to get share-ready result cards and lightweight condition tips.',
      zh: '一款 AI 镜像应用，用一张照片轻松确认今日氛围，并获得适合分享的结果卡片与轻量状态建议。',
      ja: '写真1枚で今日のバイブを気軽にチェックし、シェアしやすい結果カードとコンディションのヒントが届くAIミラーアプリです。',
    },
    description: {
      ko: '체크미는 카메라를 열고 체크 타입을 고르면 조명, 프레이밍, 표정 에너지, 스타일 밸런스, 분위기 같은 사진 속 신호를 AI가 가볍게 읽어주고, 결과를 공유 카드와 짧은 캡션, 바로 해볼 수 있는 팁으로 정리해 주는 데일리 바이브 체크 앱입니다.',
      en: 'CheckMe is a daily vibe check app: open the camera, choose a check type, and AI reads visible photo signals such as lighting, framing, expression energy, style balance, and mood, then turns each check into a share-ready card with a short caption and practical tips.',
      zh: 'CheckMe 是一款每日氛围检查应用：打开相机并选择检查类型，AI 会轻松解读照片中的光线、构图、表情能量、风格平衡与氛围等可见信号，并将结果整理成适合分享的卡片、简短文案与可立即尝试的建议。',
      ja: 'CheckMeは、カメラを開いてチェックタイプを選ぶと、光、フレーミング、表情のエネルギー、スタイルバランス、ムードなど写真で見えるサインをAIが軽く読み取り、結果をシェアしやすいカード、短いキャプション、すぐ試せるヒントとして表示するデイリーバイブチェックアプリです。',
    },
    features: {
      ko: ['컨디션, 스타일, 분위기, 랜덤 체크를 카메라에서 바로 실행', '보이는 근거와 부드러운 다음 액션을 담은 AI 바이브 리드', '오늘의 리포트, 히스토리, 패턴으로 변화 흐름 확인', '리워드, streak, 랭킹으로 다시 체크하고 싶은 루프 제공', '공유하기 좋은 결과 카드와 캡션 생성'],
      en: ['Run Condition, Style, Mood, or Random checks from the camera', 'Review an AI vibe read with visible evidence and gentle next steps', 'Follow changes through daily reports, history, and patterns', 'Build repeat-check motivation with rewards, streaks, and rankings', 'Generate share-ready result cards with auto captions'],
      zh: ['从相机直接运行状态、风格、氛围或随机检查', '查看附带可见依据与温和后续建议的 AI 氛围解读', '通过每日报告、历史与模式查看变化趋势', '通过奖励、连续打卡与排行榜保持再次检查的动力', '生成适合分享的结果卡片与自动文案'],
      ja: ['コンディション、スタイル、ムード、ランダムチェックをカメラから実行', '見える根拠とやさしい次のアクションを含むAIバイブリード', '今日のレポート、履歴、パターンで変化を確認', 'リワード、streak、ランキングで続けやすいループ', 'シェアしやすい結果カードとキャプションを作成'],
    },
    recommendedFor: {
      ko: ['하루를 시작하기 전 컨디션과 스타일을 가볍게 점검하고 싶은 사용자', '체크 결과를 카드와 캡션으로 SNS에 바로 공유하고 싶은 사용자', '리포트와 히스토리로 무드 변화 패턴을 추적하고 싶은 사용자', 'streak과 랭킹으로 데일리 루틴을 재미있게 유지하고 싶은 사용자'],
      en: ['People who want a light condition and style check before starting the day', 'Users who want to share check results on social media as cards with captions', 'Anyone who wants to track mood patterns through reports and history', 'Users who enjoy keeping a daily routine fun with streaks and rankings'],
      zh: ['想在开始一天之前轻松检查状态与风格的用户', '想把检查结果以卡片和文案直接分享到社交媒体的用户', '想通过报告与历史追踪心情变化模式的用户', '想用连续打卡与排行榜让每日习惯更有趣的用户'],
      ja: ['1日を始める前にコンディションとスタイルを気軽にチェックしたい方', 'チェック結果をカードとキャプションでSNSにすぐ共有したい方', 'レポートと履歴でムードの変化パターンを追いたい方', 'streakとランキングでデイリールーティンを楽しく続けたい方'],
    },
    supportNote: {
      ko: '체크미는 의학적 진단이나 민감한 특성 판단을 제공하지 않으며, 사진에서 보이는 비진단적 신호를 바탕으로 셀프 체크 피드백을 제공합니다. 일부 AI 분석은 최적화된 이미지를 Cloudflare 백엔드로 전송해 처리하며, 앱 운영과 개선을 위해 광고 및 Firebase 서비스를 사용합니다.',
      en: 'CheckMe does not provide medical advice or identify sensitive traits; feedback is based on visible, non-diagnostic photo cues. Some AI analysis sends an optimized image to a secure Cloudflare backend, and the app uses ads and Firebase services to operate and improve the experience.',
      zh: 'CheckMe 不提供医疗诊断，也不判断敏感特征；反馈基于照片中可见的非诊断性信号。部分 AI 分析会将优化后的图像发送到 Cloudflare 后端处理，应用还使用广告与 Firebase 服务以运营和改进体验。',
      ja: 'CheckMeは医療アドバイスやセンシティブな特性の判断を行わず、写真で見える非診断的なサインをもとにセルフチェックのフィードバックを提供します。一部のAI分析では最適化された画像をCloudflareバックエンドで処理し、アプリ運用と改善のために広告とFirebaseサービスを使用します。',
    },
    screenshots: {
      ko: checkMeLocalizedScreenshots('ko'),
      en: checkMeLocalizedScreenshots('en'),
      ja: checkMeLocalizedScreenshots('ja'),
    },
    category: 'lifestyle',
    operatingSystem: 'Android',
    googlePlayUrl: 'https://play.google.com/store/apps/details?id=com.kokomasoft.checkme',
  },
  {
    id: 'glowup',
    iconUrl: '/app-icons/glowup.png',
    name: {
      ko: 'GlowUp',
      en: 'GlowUp',
      zh: 'GlowUp',
      ja: 'GlowUp',
    },
    tagline: {
      ko: '사진 기반 Glow 리포트로 코디, 헤어, 촬영 팁을 확인하세요.',
      en: 'Photo-based style reports for outfit, grooming, and photo tips.',
      zh: '用基于照片的 Glow 报告查看穿搭、发型和拍摄建议。',
      ja: '写真ベースのGlowレポートで、コーデ、ヘア、撮影のヒントを確認できます。',
    },
    description: {
      ko: 'GlowUp은 한 장의 사진으로 사진 분위기, 옷차림 밸런스, 그루밍, 헤어 방향, 조명, 구도, 배경을 살펴보고 바로 시도할 수 있는 실용적인 팁으로 정리하는 스타일 리포트 앱입니다.',
      en: 'GlowUp creates a supportive photo-based style report from one clear picture, helping you understand photo mood, outfit balance, grooming details, hair direction, lighting, framing, and practical next steps.',
      zh: 'GlowUp 可用一张清晰照片生成支持性的照片风格报告，帮助你了解照片氛围、穿搭平衡、整理细节、发型方向、光线、构图和可立即尝试的下一步建议。',
      ja: 'GlowUpは、1枚のクリアな写真から写真の雰囲気、服装バランス、グルーミング、ヘアの方向、照明、構図、背景を確認し、すぐ試せる実用的なヒントにまとめるスタイルレポートアプリです。',
    },
    features: {
      ko: ['카메라 또는 갤러리 사진으로 Glow 리포트 생성', '스타일 키워드, Glow 점수, 트렌드 매칭 추정치와 잘 어울리는 점 확인', '조명, 구도, 포즈, 옷차림 밸런스, 헤어, 배경에 대한 실용적인 팁', '이전 리포트를 기기에 저장하고 히스토리에서 다시 열기', '사진, 키워드, 점수, 빠른 팁이 담긴 공유용 Glow 카드 생성', '영어, 한국어, 일본어, 프랑스어, 이탈리아어, 스페인어, 힌디어, 중국어 간체 지원'],
      en: ['Create a photo-based Glow report from camera or gallery', 'Review style keywords, a Glow score, trend-match estimate, and what works in the photo', 'Get practical tips for lighting, framing, pose, outfit balance, hair, and background', 'Save previous reports on your device and reopen them from history', 'Create shareable Glow cards with your photo, keywords, score, and quick tip', 'Supports English, Korean, Japanese, French, Italian, Spanish, Hindi, and Simplified Chinese'],
      zh: ['通过相机或相册照片生成 Glow 报告', '查看风格关键词、Glow 分数、趋势匹配估算和照片中的亮点', '获取关于光线、构图、姿势、穿搭平衡、发型和背景的实用建议', '将之前的报告保存在设备上，并可从历史记录重新打开', '生成包含照片、关键词、分数和快速建议的可分享 Glow 卡片', '支持英语、韩语、日语、法语、意大利语、西班牙语、印地语和简体中文'],
      ja: ['カメラまたはギャラリーの写真からGlowレポートを作成', 'スタイルキーワード、Glowスコア、トレンド一致の目安、写真で良い点を確認', '照明、構図、ポーズ、服装バランス、ヘア、背景について実用的なヒントを表示', '以前のレポートを端末に保存し、履歴から再表示', '写真、キーワード、スコア、クイックヒント入りの共有用Glowカードを作成', '英語、韓国語、日本語、フランス語、イタリア語、スペイン語、ヒンディー語、簡体字中国語に対応'],
    },
    recommendedFor: {
      ko: ['프로필 사진이나 SNS 사진의 인상을 가볍게 점검하고 싶은 사용자', '옷차림, 헤어, 그루밍, 촬영 구도 팁을 한 번에 보고 싶은 사용자', '외모 비교나 랭킹보다 사진 속 개선 포인트를 참고하고 싶은 사용자', '리포트를 기기에 저장하고 공유 카드로 남기고 싶은 사용자'],
      en: ['People who want a light review of a profile or social photo', 'Users who want outfit, hair, grooming, lighting, and framing tips in one place', 'Anyone who prefers practical photo coaching over comparison or ranking', 'People who want to save reports locally or share a polished Glow card'],
      zh: ['想轻松检查头像或社交照片印象的用户', '想一次查看穿搭、发型、整理、光线和构图建议的用户', '比起外貌比较或排名，更想参考照片改进点的用户', '想在设备上保存报告或分享精美 Glow 卡片的用户'],
      ja: ['プロフィール写真やSNS写真の印象を気軽に確認したい方', '服装、ヘア、グルーミング、照明、構図のヒントをまとめて見たい方', '外見の比較やランキングより、写真の改善ポイントを参考にしたい方', 'レポートを端末に保存したり、整ったGlowカードとして共有したい方'],
    },
    supportNote: {
      ko: 'GlowUp은 외모 비교나 랭킹이 아니라 사진에서 보이는 요소를 바탕으로 스타일과 촬영 인상을 정리하는 참고용 코칭 리포트를 제공합니다. 원본 고해상도 사진은 리포트 사본으로 보관하지 않으며, 저장된 리포트와 로컬 미리보기는 히스토리에서 삭제할 수 있습니다.',
      en: 'GlowUp is a style coach experience, not a comparison or ranking tool. Reports focus on visible photo details and turn them into practical coaching. Original full-resolution photos are not kept as report copies, and saved reports plus local previews can be deleted from history.',
      zh: 'GlowUp 是一种风格教练体验，而不是比较或排名工具。报告聚焦照片中可见的细节，并将其转化为实用建议。原始完整分辨率照片不会作为报告副本保留，已保存报告和本地预览可从历史记录中删除。',
      ja: 'GlowUpは比較やランキングのためのツールではなく、写真で見える要素をもとにスタイルと撮影印象を整理する参考用コーチングレポートです。元の高解像度写真をレポートコピーとして保持せず、保存済みレポートとローカルプレビューは履歴から削除できます。',
    },
    screenshots: {
      ko: glowUpLocalizedScreenshots('ko'),
      en: glowUpLocalizedScreenshots('en'),
      zh: glowUpLocalizedScreenshots('zh'),
      ja: glowUpLocalizedScreenshots('ja'),
    },
    category: 'lifestyle',
    operatingSystem: 'Android',
    googlePlayUrl: 'https://play.google.com/store/apps/details?id=com.kokomasoft.glowup',
  },
].sort(
  (a, b) =>
    (appDisplayOrder[a.id] ?? Number.MAX_SAFE_INTEGER) -
    (appDisplayOrder[b.id] ?? Number.MAX_SAFE_INTEGER),
);
