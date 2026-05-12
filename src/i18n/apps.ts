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
  googlePlayUrl?: string;
  appStoreUrl?: string;
  supportsAccountDeletion?: boolean;
}

export const apps: AppInfo[] = [
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
      ko: '오늘 운세, 자유 질문, 타로, 궁합을 AI 풀이로 가볍게 확인합니다.',
      en: 'Check daily fortune, free-form questions, tarot, and compatibility with AI-assisted readings.',
      zh: '通过 AI 解读轻松查看每日运势、自由提问、塔罗和配对。',
      ja: '今日の運勢、自由質問、タロット、相性をAI鑑定で気軽に確認できます。',
    },
    description: {
      ko: '오늘의 운세와 사주, 궁합까지! 동양 철학 기반의 운세 서비스로 하루를 시작하세요.',
      en: 'Daily fortune, horoscope, and compatibility! Start your day with Eastern philosophy-based fortune telling.',
      zh: '今日运势、命理、配对！基于东方哲学的运势服务，开启美好一天。',
      ja: '今日の運勢、四柱推命、相性まで！東洋哲学に基づく占いサービスで一日を始めましょう。',
    },
    features: {
      ko: ['생년월일시 기반 오늘 운세', '현재 대운과 분야별 흐름 확인', '자유 질문 AI 사주 풀이', '1장·3장·켈틱 타로 리딩', '두 사람의 궁합과 지난 풀이 히스토리'],
      en: ['Daily fortune from birth details', 'Current major fortune and category flows', 'AI saju readings for free-form questions', 'One-card, three-card, and Celtic tarot readings', 'Compatibility readings and history'],
      zh: ['基于出生信息的每日运势', '当前大运和分类走势', '自由提问的 AI 命理解读', '一张、三张和凯尔特十字塔罗', '配对解读和历史记录'],
      ja: ['生年月日時にもとづく今日の運勢', '現在の大運と分野別の流れ', '自由質問のAI四柱推命鑑定', '1枚・3枚・ケルト十字タロット', '相性鑑定と履歴'],
    },
    recommendedFor: {
      ko: ['매일의 운세 흐름을 짧게 확인하고 싶은 사용자', '사주와 타로를 한 앱에서 참고하고 싶은 사용자', '중요한 선택 전 생각을 정리할 소재가 필요한 사용자'],
      en: ['People who want a quick daily fortune check', 'Users interested in saju and tarot in one app', 'Anyone who wants reflective prompts before decisions'],
      zh: ['想快速查看每日运势的用户', '想在一个应用中参考命理和塔罗的用户', '在重要选择前想整理想法的用户'],
      ja: ['毎日の運勢を短く確認したい方', '四柱推命とタロットを一つのアプリで見たい方', '大事な選択の前に考えを整理したい方'],
    },
    supportNote: {
      ko: '운세 풀이는 엔터테인먼트 목적의 참고 정보이며, 의료·법률·투자 등 전문 자문을 대체하지 않습니다.',
      en: 'Readings are for entertainment and reflection only, and do not replace medical, legal, financial, or professional advice.',
      zh: '解读仅用于娱乐和自我反思，不替代医疗、法律、投资或其他专业建议。',
      ja: '鑑定はエンターテインメントと振り返り目的であり、医療・法律・投資などの専門的助言ではありません。',
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
      ],
    },
    category: 'lifestyle',
    googlePlayUrl: 'https://play.google.com/store/apps/details?id=com.kokomasoft.ungyeol',
  },
];
