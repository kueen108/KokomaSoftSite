import type { Lang } from './translations';

export interface AppInfo {
  id: string;
  iconUrl: string;
  name: Record<Lang, string>;
  description: Record<Lang, string>;
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
    description: {
      ko: '로또 번호 생성과 당첨 결과 분석을 한 곳에서! 나만의 행운 번호를 찾아보세요.',
      en: 'Generate lotto numbers and analyze winning results in one place! Find your lucky numbers.',
      zh: '在一个地方生成彩票号码并分析中奖结果！找到属于您的幸运号码。',
      ja: 'ロト番号の生成と当選結果の分析をワンストップで！あなただけのラッキーナンバーを見つけましょう。',
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
    description: {
      ko: '전 세계 트렌딩 영상을 한눈에! 인기 있는 동영상을 카테고리별로 탐색하세요.',
      en: 'Discover trending videos from around the world! Browse popular videos by category.',
      zh: '一览全球热门视频！按类别浏览热门视频内容。',
      ja: '世界中のトレンド動画を一目で！カテゴリ別に人気動画を探索しましょう。',
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
    description: {
      ko: '오늘 하루를 마음챙김으로 시작하세요. 명상과 일상 기록으로 더 나은 하루를 만들어갑니다.',
      en: 'Start your day with mindfulness. Build better days through meditation and daily journaling.',
      zh: '以正念开启新的一天。通过冥想和日常记录打造更美好的每一天。',
      ja: '今日一日をマインドフルネスで始めましょう。瞑想と日々の記録でより良い毎日を作ります。',
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
    description: {
      ko: '오늘의 운세와 사주, 궁합까지! 동양 철학 기반의 운세 서비스로 하루를 시작하세요.',
      en: 'Daily fortune, horoscope, and compatibility! Start your day with Eastern philosophy-based fortune telling.',
      zh: '今日运势、命理、配对！基于东方哲学的运势服务，开启美好一天。',
      ja: '今日の運勢、四柱推命、相性まで！東洋哲学に基づく占いサービスで一日を始めましょう。',
    },
    category: 'lifestyle',
    googlePlayUrl: 'https://play.google.com/store/apps/details?id=com.kokomasoft.ungyeol',
  },
];
