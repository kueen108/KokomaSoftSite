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
}

const appDisplayOrder: Record<string, number> = {
  ungyeol: 0,
  lifelotto: 1,
  lifepension: 2,
  mytube: 3,
  onul: 4,
  marknote: 5,
};

export const apps: AppInfo[] = [
  {
    id: 'marknote',
    iconUrl: '/app-icons/marknote.png',
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
    googlePlayUrl: 'https://play.google.com/store/apps/details?id=com.kokomasoft.hottube',
    appStoreUrl: 'https://apps.apple.com/kr/app/my-tube/id6738738608',
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
    id: 'ungyeol',
    iconUrl: '/app-icons/ungyeol.png',
    name: {
      ko: 'Ungyeol',
      en: 'Ungyeol',
      zh: 'Ungyeol',
      ja: 'Ungyeol',
    },
    tagline: {
      ko: '오늘 운세, 타로, 궁합, 상대 속마음, 답장 추천, 꿈해몽, 관상까지 AI 풀이로 확인합니다.',
      en: 'Check daily fortune, tarot, compatibility, hidden feelings, reply ideas, dream readings, and face readings with AI.',
      zh: '通过 AI 查看每日运势、塔罗、配对、对方心意、回复建议、梦境解析和面相解读。',
      ja: '今日の運勢、タロット、相性、相手の気持ち、返信提案、夢占い、顔相までAIで確認できます。',
    },
    description: {
      ko: '사주 기반 오늘 운세부터 관계 고민, 메시지 답장, 꿈의 상징, 사진 기반 관상까지 한 앱에서 가볍게 참고하세요.',
      en: 'Use one app for saju-based daily fortune, relationship reflection, message replies, dream symbols, and photo-based face readings.',
      zh: '从命理每日运势到关系思考、消息回复、梦境象征和照片面相，在一个应用中轻松参考。',
      ja: '四柱推命にもとづく今日の運勢から関係の悩み、返信文、夢の象徴、写真ベースの顔相まで一つのアプリで気軽に参考できます。',
    },
    features: {
      ko: ['생년월일시 기반 오늘 운세와 대운 흐름', '자유 질문, 타로, 궁합을 AI 풀이로 확인', '상대 속마음과 답장 추천으로 관계 대화 정리', '꿈 키워드와 감정을 바탕으로 한 꿈해몽', '사진 동의 기반 관상 풀이와 히스토리 저장'],
      en: ['Daily fortune and major-fortune flow from birth details', 'AI readings for free-form questions, tarot, and compatibility', 'Hidden-feelings readings and reply recommendations for relationship conversations', 'Dream readings from keywords, emotions, and dream details', 'Consent-based face readings with text results saved to history'],
      zh: ['基于出生信息的每日运势和大运走势', '自由提问、塔罗和配对的 AI 解读', '用对方心意解读和回复建议整理关系对话', '根据梦境关键词、情绪和内容进行梦境解析', '基于授权照片的面相解读，并保存文字结果历史'],
      ja: ['生年月日時にもとづく今日の運勢と大運の流れ', '自由質問、タロット、相性をAI鑑定で確認', '相手の気持ちと返信提案で関係の会話を整理', '夢のキーワードと感情をもとにした夢占い', '同意した写真による顔相鑑定とテキスト結果の履歴保存'],
    },
    recommendedFor: {
      ko: ['매일의 운세와 사주 흐름을 짧게 확인하고 싶은 사용자', '애매한 관계의 분위기와 보낼 말을 정리하고 싶은 사용자', '꿈해몽이나 관상을 엔터테인먼트로 가볍게 참고하고 싶은 사용자'],
      en: ['People who want quick daily fortune and saju flow checks', 'Users who want to organize relationship signals and what to send next', 'Anyone who wants light entertainment readings for dreams or face impressions'],
      zh: ['想快速查看每日运势和命理走势的用户', '想整理暧昧关系氛围和下一条回复的用户', '想把梦境解析或面相解读作为轻松娱乐参考的用户'],
      ja: ['毎日の運勢と四柱推命の流れを短く確認したい方', '曖昧な関係の空気感や送る言葉を整理したい方', '夢占いや顔相をエンタメとして気軽に参考したい方'],
    },
    supportNote: {
      ko: '운세, 관계, 꿈, 관상 풀이는 엔터테인먼트 목적의 참고 정보입니다. 관상은 본인 또는 동의를 받은 사진만 사용하며, 원본 사진은 저장하지 않고 텍스트 결과만 히스토리에 저장됩니다.',
      en: 'Fortune, relationship, dream, and face readings are for entertainment and reflection only. Face reading should use your own photo or a photo you have permission to use; the original photo is not stored, only the text result is saved to history.',
      zh: '运势、关系、梦境和面相解读仅用于娱乐和自我反思。面相解读应使用本人照片或已获得授权的照片；原始照片不会保存，只保存文字结果历史。',
      ja: '運勢、関係、夢、顔相の鑑定はエンタメと振り返り目的の参考情報です。顔相は本人または許可を得た写真のみを使用し、写真原本は保存せずテキスト結果だけを履歴に保存します。',
    },
    screenshots: {
      ko: [
        {
          src: '/app-screenshots/ungyeol/ko/home.png',
          caption: { ko: '오늘 운세', en: 'Daily fortune', zh: '每日运势', ja: '今日の運勢' },
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
          caption: { ko: '궁합과 인연', en: 'Compatibility and relationship', zh: '配对与缘分', ja: '相性と縁' },
        },
        {
          src: '/app-screenshots/ungyeol/ko/history.png',
          caption: { ko: '풀이 히스토리', en: 'Reading history', zh: '解读历史', ja: '鑑定履歴' },
        },
      ],
      en: [
        {
          src: '/app-screenshots/ungyeol/en/home.png',
          caption: { ko: '오늘 운세', en: 'Daily fortune', zh: '每日运势', ja: '今日の運勢' },
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
          caption: { ko: '궁합과 인연', en: 'Compatibility and relationship', zh: '配对与缘分', ja: '相性と縁' },
        },
        {
          src: '/app-screenshots/ungyeol/en/history.png',
          caption: { ko: '풀이 히스토리', en: 'Reading history', zh: '解读历史', ja: '鑑定履歴' },
        },
      ],
      ja: [
        {
          src: '/app-screenshots/ungyeol/ja/home.png',
          caption: { ko: '오늘 운세', en: 'Daily fortune', zh: '每日运势', ja: '今日の運勢' },
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
          caption: { ko: '궁합과 인연', en: 'Compatibility and relationship', zh: '配对与缘分', ja: '相性と縁' },
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
].sort(
  (a, b) =>
    (appDisplayOrder[a.id] ?? Number.MAX_SAFE_INTEGER) -
    (appDisplayOrder[b.id] ?? Number.MAX_SAFE_INTEGER),
);
