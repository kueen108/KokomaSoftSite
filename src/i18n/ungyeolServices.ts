import type { Lang } from './translations';
import { languageCodes } from '../lib/seo';

export type UngyeolServiceId =
  | 'fortune'
  | 'tarot'
  | 'compatibility'
  | 'free-question';

export interface UngyeolServiceField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'date' | 'select';
  placeholder?: string;
  required?: boolean;
  options?: string[];
}

export interface UngyeolServiceUi {
  backLabel: string;
  noteTitle: string;
  noteText: string;
  submitLabel: string;
  disclaimer: string;
  emptyTitle: string;
  emptyText: string;
  appEyebrow: string;
  appTitle: string;
  appButtonLabel: string;
}

export interface UngyeolLandingCopy {
  eyebrow: string;
  title: string;
  subtitle: string;
  detailTitle: string;
  detailSubtitle: string;
  breadcrumbLabel: string;
}

export interface UngyeolServiceInfo {
  id: UngyeolServiceId;
  lang: Lang;
  path: string;
  navLabel: string;
  title: string;
  description: string;
  lead: string;
  eyebrow: string;
  resultTitle: string;
  appPitch: string;
  fields: UngyeolServiceField[];
  ui: UngyeolServiceUi;
}

type UngyeolServiceCopy = Omit<UngyeolServiceInfo, 'id' | 'lang' | 'path' | 'ui'>;

export const ungyeolServiceIds: UngyeolServiceId[] = [
  'fortune',
  'tarot',
  'compatibility',
  'free-question',
];

export const ungyeolProductName: Record<Lang, string> = {
  ko: '왕꽃선녀',
  en: 'Ungyeol',
  zh: 'Ungyeol',
  ja: 'Ungyeol',
};

export const ungyeolLandingCopy: Record<Lang, UngyeolLandingCopy> = {
  ko: {
    eyebrow: 'Wangkkot Seonnyeo Web Tools',
    title: '왕꽃선녀 무료 미니 풀이',
    subtitle: '앱 설치 전 오늘 운세, 타로, 궁합, 자유 질문을 웹에서 짧게 체험해 보세요. 현재 대운, 복채, 히스토리는 앱에서 이어집니다.',
    detailTitle: '웹에서 먼저 체험하기',
    detailSubtitle: '왕꽃선녀의 주요 기능을 무료 미니 풀이로 짧게 확인하고, 더 자세한 AI 풀이와 히스토리는 앱에서 이어보세요.',
    breadcrumbLabel: '왕꽃선녀 미니서비스',
  },
  en: {
    eyebrow: 'Ungyeol Web Tools',
    title: 'Free Ungyeol Mini Readings',
    subtitle: 'Try quick web versions of daily fortune, tarot, compatibility, and free-form questions before installing the app.',
    detailTitle: 'Try it on the web first',
    detailSubtitle: 'Preview Ungyeol features with free mini readings, then continue in the app for major fortune, deeper AI readings, Bokchae, and saved history.',
    breadcrumbLabel: 'Ungyeol Mini Services',
  },
  zh: {
    eyebrow: 'Ungyeol Web Tools',
    title: 'Ungyeol 免费迷你解读',
    subtitle: '安装应用前，可先在网页快速体验每日运势、塔罗、配对和自由提问。',
    detailTitle: '先在网页体验',
    detailSubtitle: '用免费迷你解读快速了解 Ungyeol 的主要功能，更详细的大运、AI 解读、Bokchae 和历史记录可在应用中继续使用。',
    breadcrumbLabel: 'Ungyeol 迷你服务',
  },
  ja: {
    eyebrow: 'Ungyeol Web Tools',
    title: 'Ungyeol 無料ミニ鑑定',
    subtitle: 'アプリを入れる前に、今日の運勢、タロット、相性、自由質問をWebで短く体験できます。',
    detailTitle: 'まずWebで体験',
    detailSubtitle: 'Ungyeolの主要機能を無料ミニ鑑定で確認し、大運、詳しいAI鑑定、福、履歴保存はアプリで続けられます。',
    breadcrumbLabel: 'Ungyeol ミニサービス',
  },
};

const serviceCopies: Record<Lang, Record<UngyeolServiceId, UngyeolServiceCopy>> = {
  ko: {
    fortune: {
      navLabel: '오늘 운세',
      title: '오늘 운세 미니 풀이',
      description: '생년월일과 관심사를 바탕으로 오늘의 흐름, 관계, 일/금전, 조언을 짧게 확인합니다.',
      lead: '정밀 사주 풀이 전, 오늘의 분위기를 빠르게 확인하는 무료 웹 미니 버전입니다.',
      eyebrow: '운세',
      resultTitle: '오늘의 흐름',
      appPitch: '앱에서는 생년월일시, 성별, 히스토리를 반영해 더 긴 오늘 운세와 대운 흐름을 볼 수 있습니다.',
      fields: [
        { name: 'birthDate', label: '생년월일', type: 'date', required: true },
        {
          name: 'birthTime',
          label: '태어난 시간',
          type: 'select',
          options: ['모름', '자시 23:00-01:00', '축시 01:00-03:00', '인시 03:00-05:00', '묘시 05:00-07:00', '진시 07:00-09:00', '사시 09:00-11:00', '오시 11:00-13:00', '미시 13:00-15:00', '신시 15:00-17:00', '유시 17:00-19:00', '술시 19:00-21:00', '해시 21:00-23:00'],
        },
        { name: 'focus', label: '가장 궁금한 흐름', type: 'select', options: ['전체', '연애', '일/학업', '금전', '인간관계'] },
      ],
    },
    tarot: {
      navLabel: '타로',
      title: '타로 3장 미니 리딩',
      description: '질문을 입력하면 현재, 흐름, 조언을 상징하는 3장의 카드로 짧은 리딩을 제공합니다.',
      lead: '질문을 마음속에 정리하고 카드 흐름으로 오늘의 선택을 가볍게 점검해 보세요.',
      eyebrow: '타로',
      resultTitle: '3장 리딩',
      appPitch: '앱에서는 질문별 세부 스프레드, 카드 해석, 히스토리 저장까지 이어집니다.',
      fields: [
        { name: 'topic', label: '질문 분야', type: 'select', options: ['연애', '일/학업', '금전', '인간관계', '선택 고민'] },
        { name: 'question', label: '질문', type: 'textarea', required: true, placeholder: '예: 이 사람에게 먼저 연락해도 될까요?' },
      ],
    },
    compatibility: {
      navLabel: '인연/궁합',
      title: '인연/궁합 미니 풀이',
      description: '두 사람의 생년월일과 관계 상황을 바탕으로 끌림, 충돌 포인트, 오늘의 조언을 정리합니다.',
      lead: '정밀 궁합 전, 서로의 관계 흐름을 빠르게 확인하는 웹 미니 버전입니다.',
      eyebrow: '궁합',
      resultTitle: '두 사람의 흐름',
      appPitch: '앱에서는 두 사람의 생년월일시와 관계 상황을 더 자세히 반영해 궁합을 풀이합니다.',
      fields: [
        { name: 'myBirthDate', label: '내 생년월일', type: 'date', required: true },
        { name: 'theirBirthDate', label: '상대 생년월일', type: 'date', required: true },
        { name: 'relationship', label: '관계', type: 'select', options: ['썸', '연인', '부부', '전연인', '친구', '직장/동료'] },
      ],
    },
    'free-question': {
      navLabel: '자유질문',
      title: '자유질문 미니 풀이',
      description: '지금 고민을 입력하면 상황을 세 갈래로 정리하고 오늘 바로 해볼 행동을 제안합니다.',
      lead: '정답을 단정하지 않고, 생각을 정리하는 관점의 무료 미니 풀이입니다.',
      eyebrow: '질문',
      resultTitle: '질문 정리',
      appPitch: '앱에서는 사주/타로/관계 맥락을 결합해 더 깊은 자유질문 풀이를 제공합니다.',
      fields: [
        { name: 'category', label: '고민 분야', type: 'select', options: ['연애', '일/학업', '금전', '가족', '인간관계', '선택 고민'] },
        { name: 'question', label: '질문', type: 'textarea', required: true, placeholder: '지금 가장 궁금한 질문을 적어주세요.' },
      ],
    },
  },
  en: {
    fortune: {
      navLabel: "Today's Fortune",
      title: "Today's Fortune Mini Reading",
      description: 'Enter your birth date and focus area to get a short reading for today, including relationships, work, money, and advice.',
      lead: 'A free web preview for quickly checking the mood of the day before a deeper saju reading in the app.',
      eyebrow: 'Fortune',
      resultTitle: "Today's Flow",
      appPitch: 'In the app, Ungyeol can use birth time, gender, and saved history to provide longer daily fortune and life-cycle readings.',
      fields: [
        { name: 'birthDate', label: 'Birth date', type: 'date', required: true },
        { name: 'birthTime', label: 'Birth time', type: 'select', options: ['Unknown', '23:00-01:00', '01:00-03:00', '03:00-05:00', '05:00-07:00', '07:00-09:00', '09:00-11:00', '11:00-13:00', '13:00-15:00', '15:00-17:00', '17:00-19:00', '19:00-21:00', '21:00-23:00'] },
        { name: 'focus', label: 'Main focus', type: 'select', options: ['Overall', 'Love', 'Work or study', 'Money', 'Relationships'] },
      ],
    },
    tarot: {
      navLabel: 'Tarot',
      title: 'Three-Card Tarot Mini Reading',
      description: 'Enter a question and receive a short three-card reading for the present, flow, and advice.',
      lead: 'Organize your question and lightly check today’s choice through a card flow.',
      eyebrow: 'Tarot',
      resultTitle: 'Three-Card Reading',
      appPitch: 'The app continues with question-specific spreads, card interpretations, and saved reading history.',
      fields: [
        { name: 'topic', label: 'Question topic', type: 'select', options: ['Love', 'Work or study', 'Money', 'Relationships', 'Decision'] },
        { name: 'question', label: 'Question', type: 'textarea', required: true, placeholder: 'Example: Should I contact this person first?' },
      ],
    },
    compatibility: {
      navLabel: 'Compatibility',
      title: 'Compatibility Mini Reading',
      description: 'Use two birth dates and relationship context to check attraction, friction points, and advice for today.',
      lead: 'A quick web preview for understanding the relationship flow before a detailed compatibility reading.',
      eyebrow: 'Compatibility',
      resultTitle: 'Relationship Flow',
      appPitch: 'The app can use both birth dates, birth times, and relationship context for a fuller compatibility reading.',
      fields: [
        { name: 'myBirthDate', label: 'Your birth date', type: 'date', required: true },
        { name: 'theirBirthDate', label: 'Their birth date', type: 'date', required: true },
        { name: 'relationship', label: 'Relationship', type: 'select', options: ['Flirting stage', 'Partner', 'Spouse', 'Ex-partner', 'Friend', 'Work or colleague'] },
      ],
    },
    'free-question': {
      navLabel: 'Free Question',
      title: 'Free Question Mini Reading',
      description: 'Enter your current concern to organize the situation into three angles and get one action for today.',
      lead: 'A free mini reading for organizing thoughts without claiming one absolute answer.',
      eyebrow: 'Question',
      resultTitle: 'Question Summary',
      appPitch: 'In the app, Ungyeol combines saju, tarot, and relationship context for a deeper free-question reading.',
      fields: [
        { name: 'category', label: 'Concern type', type: 'select', options: ['Love', 'Work or study', 'Money', 'Family', 'Relationships', 'Decision'] },
        { name: 'question', label: 'Question', type: 'textarea', required: true, placeholder: 'Write the question you are most curious about right now.' },
      ],
    },
  },
  zh: {
    fortune: {
      navLabel: '今日运势',
      title: '今日运势迷你解读',
      description: '根据生日和关注主题，快速查看今天的整体走势、人际、工作/金钱和建议。',
      lead: '在应用中进行更详细命理解读前，可先用网页免费快速确认今天的气氛。',
      eyebrow: '运势',
      resultTitle: '今日走势',
      appPitch: '应用中可结合出生时间、性别和历史记录，提供更长的今日运势与大运走势。',
      fields: [
        { name: 'birthDate', label: '出生日期', type: 'date', required: true },
        { name: 'birthTime', label: '出生时间', type: 'select', options: ['不知道', '23:00-01:00', '01:00-03:00', '03:00-05:00', '05:00-07:00', '07:00-09:00', '09:00-11:00', '11:00-13:00', '13:00-15:00', '15:00-17:00', '17:00-19:00', '19:00-21:00', '21:00-23:00'] },
        { name: 'focus', label: '最想了解的方向', type: 'select', options: ['整体', '恋爱', '工作/学习', '金钱', '人际关系'] },
      ],
    },
    tarot: {
      navLabel: '塔罗',
      title: '三张塔罗迷你解读',
      description: '输入问题后，用象征现在、走势和建议的三张牌进行简短解读。',
      lead: '先在心里整理问题，再用牌面走势轻松检查今天的选择。',
      eyebrow: '塔罗',
      resultTitle: '三张牌解读',
      appPitch: '应用中可继续使用不同问题的牌阵、详细牌义和历史记录。',
      fields: [
        { name: 'topic', label: '问题领域', type: 'select', options: ['恋爱', '工作/学习', '金钱', '人际关系', '选择烦恼'] },
        { name: 'question', label: '问题', type: 'textarea', required: true, placeholder: '例：我要不要先联系这个人？' },
      ],
    },
    compatibility: {
      navLabel: '缘分/合盘',
      title: '缘分/合盘迷你解读',
      description: '根据两个人的生日和关系状况，整理吸引点、冲突点和今日建议。',
      lead: '在精细合盘前，快速查看两个人的关系走势。',
      eyebrow: '合盘',
      resultTitle: '两个人的走势',
      appPitch: '应用中可更详细结合两个人的出生日期、时间和关系状况进行合盘解读。',
      fields: [
        { name: 'myBirthDate', label: '我的出生日期', type: 'date', required: true },
        { name: 'theirBirthDate', label: '对方出生日期', type: 'date', required: true },
        { name: 'relationship', label: '关系', type: 'select', options: ['暧昧', '恋人', '夫妻', '前任', '朋友', '职场/同事'] },
      ],
    },
    'free-question': {
      navLabel: '自由提问',
      title: '自由提问迷你解读',
      description: '输入当前烦恼后，将状况整理成三个角度，并给出今天可尝试的行动。',
      lead: '不把答案说死，而是帮助你整理想法的免费迷你解读。',
      eyebrow: '提问',
      resultTitle: '问题整理',
      appPitch: '应用中可结合命理、塔罗和关系背景，提供更深入的自由提问解读。',
      fields: [
        { name: 'category', label: '烦恼领域', type: 'select', options: ['恋爱', '工作/学习', '金钱', '家人', '人际关系', '选择烦恼'] },
        { name: 'question', label: '问题', type: 'textarea', required: true, placeholder: '写下现在最想知道的问题。' },
      ],
    },
  },
  ja: {
    fortune: {
      navLabel: '今日の運勢',
      title: '今日の運勢ミニ鑑定',
      description: '生年月日と気になるテーマから、今日の流れ、人間関係、仕事/お金、アドバイスを短く確認できます。',
      lead: '詳しい四柱推命鑑定の前に、今日の空気感を素早く見る無料Webミニ版です。',
      eyebrow: '運勢',
      resultTitle: '今日の流れ',
      appPitch: 'アプリでは出生時間、性別、履歴を反映し、より長い今日の運勢と運気の流れを確認できます。',
      fields: [
        { name: 'birthDate', label: '生年月日', type: 'date', required: true },
        { name: 'birthTime', label: '生まれた時間', type: 'select', options: ['不明', '23:00-01:00', '01:00-03:00', '03:00-05:00', '05:00-07:00', '07:00-09:00', '09:00-11:00', '11:00-13:00', '13:00-15:00', '15:00-17:00', '17:00-19:00', '19:00-21:00', '21:00-23:00'] },
        { name: 'focus', label: '一番気になる流れ', type: 'select', options: ['全体', '恋愛', '仕事/学業', '金運', '人間関係'] },
      ],
    },
    tarot: {
      navLabel: 'タロット',
      title: 'タロット3枚ミニリーディング',
      description: '質問を入力すると、現在、流れ、アドバイスを象徴する3枚のカードで短く読み解きます。',
      lead: '質問を心の中で整理し、カードの流れで今日の選択を軽く確認してみましょう。',
      eyebrow: 'タロット',
      resultTitle: '3枚リーディング',
      appPitch: 'アプリでは質問別のスプレッド、カード解釈、履歴保存まで続けられます。',
      fields: [
        { name: 'topic', label: '質問分野', type: 'select', options: ['恋愛', '仕事/学業', '金運', '人間関係', '選択の悩み'] },
        { name: 'question', label: '質問', type: 'textarea', required: true, placeholder: '例：この人に先に連絡してもいいですか？' },
      ],
    },
    compatibility: {
      navLabel: '縁/相性',
      title: '縁/相性ミニ鑑定',
      description: '二人の生年月日と関係状況から、惹かれる点、衝突ポイント、今日のアドバイスを整理します。',
      lead: '詳しい相性鑑定の前に、二人の関係の流れを素早く確認するWebミニ版です。',
      eyebrow: '相性',
      resultTitle: '二人の流れ',
      appPitch: 'アプリでは二人の生年月日、出生時間、関係状況をさらに反映して相性を読み解きます。',
      fields: [
        { name: 'myBirthDate', label: '自分の生年月日', type: 'date', required: true },
        { name: 'theirBirthDate', label: '相手の生年月日', type: 'date', required: true },
        { name: 'relationship', label: '関係', type: 'select', options: ['気になる関係', '恋人', '夫婦', '元恋人', '友人', '職場/同僚'] },
      ],
    },
    'free-question': {
      navLabel: '自由質問',
      title: '自由質問ミニ鑑定',
      description: '今の悩みを入力すると、状況を3つの角度で整理し、今日すぐできる行動を提案します。',
      lead: '答えを断定せず、考えを整理するための無料ミニ鑑定です。',
      eyebrow: '質問',
      resultTitle: '質問整理',
      appPitch: 'アプリでは四柱推命、タロット、関係性の文脈を組み合わせて、より深い自由質問鑑定を提供します。',
      fields: [
        { name: 'category', label: '悩みの分野', type: 'select', options: ['恋愛', '仕事/学業', 'お金', '家族', '人間関係', '選択の悩み'] },
        { name: 'question', label: '質問', type: 'textarea', required: true, placeholder: '今いちばん気になる質問を書いてください。' },
      ],
    },
  },
};

const uiCopy: Record<Lang, UngyeolServiceUi> = {
  ko: {
    backLabel: '왕꽃선녀 미니서비스',
    noteTitle: '무료 웹 미니 풀이',
    noteText: '입력 내용은 브라우저 안에서만 처리됩니다. 정밀 AI 풀이, 현재 대운, 히스토리 저장, 복채 충전은 왕꽃선녀 앱에서 이용할 수 있습니다.',
    submitLabel: '미니 풀이 보기',
    disclaimer: '엔터테인먼트 목적의 참고용 결과입니다. 중요한 결정은 현실의 정보와 본인의 판단을 함께 고려해 주세요.',
    emptyTitle: '입력 후 결과가 여기에 표시됩니다',
    emptyText: '짧은 풀이를 확인한 뒤, 앱에서 더 자세한 해석으로 이어갈 수 있습니다.',
    appEyebrow: '왕꽃선녀 앱',
    appTitle: '더 자세한 풀이는 앱에서 이어보세요',
    appButtonLabel: 'Google Play에서 열기',
  },
  en: {
    backLabel: 'Ungyeol Mini Services',
    noteTitle: 'Free Web Mini Reading',
    noteText: 'Your input is processed only in the browser. Detailed AI readings, current major fortune, Bokchae refills, and saved history are available in the Ungyeol app.',
    submitLabel: 'View mini reading',
    disclaimer: 'This is an entertainment reading for reference only. For important decisions, consider real-world information and your own judgment.',
    emptyTitle: 'Your result will appear here after input',
    emptyText: 'Check the short reading here, then continue with a more detailed interpretation in the app.',
    appEyebrow: 'Ungyeol App',
    appTitle: 'Continue deeper readings in the app',
    appButtonLabel: 'Open on Google Play',
  },
  zh: {
    backLabel: 'Ungyeol 迷你服务',
    noteTitle: '免费网页迷你解读',
    noteText: '输入内容只在浏览器中处理。更详细的 AI 解读、当前大运、Bokchae 充值和历史记录可在 Ungyeol 应用中使用。',
    submitLabel: '查看迷你解读',
    disclaimer: '结果仅供娱乐和参考。重要决定请结合现实信息与自己的判断。',
    emptyTitle: '输入后结果会显示在这里',
    emptyText: '先查看简短解读，再到应用中继续获得更详细的解释。',
    appEyebrow: 'Ungyeol App',
    appTitle: '在应用中继续查看更详细解读',
    appButtonLabel: '在 Google Play 打开',
  },
  ja: {
    backLabel: 'Ungyeol ミニサービス',
    noteTitle: '無料Webミニ鑑定',
    noteText: '入力内容はブラウザ内でのみ処理されます。詳しいAI鑑定、現在の大運、福のチャージ、履歴保存はUngyeolアプリで利用できます。',
    submitLabel: 'ミニ鑑定を見る',
    disclaimer: 'エンターテインメント目的の参考結果です。重要な判断は現実の情報とご自身の判断も合わせて考えてください。',
    emptyTitle: '入力後、結果がここに表示されます',
    emptyText: '短い鑑定を確認した後、アプリでさらに詳しい解釈へ進めます。',
    appEyebrow: 'Ungyeol App',
    appTitle: '詳しい鑑定はアプリで続けられます',
    appButtonLabel: 'Google Playで開く',
  },
};

export function ungyeolServicePath(lang: Lang, id: UngyeolServiceId) {
  return `/${lang}/${id}/`;
}

export function ungyeolServiceAlternates(id: UngyeolServiceId) {
  return Object.fromEntries(
    languageCodes.map((lang) => [lang, ungyeolServicePath(lang, id)]),
  ) as Record<Lang, string>;
}

export function getUngyeolLandingCopy(lang: Lang) {
  return ungyeolLandingCopy[lang];
}

export function getUngyeolServices(lang: Lang = 'ko'): UngyeolServiceInfo[] {
  return ungyeolServiceIds.map((id) => ({
    id,
    lang,
    path: ungyeolServicePath(lang, id),
    ui: uiCopy[lang],
    ...serviceCopies[lang][id],
  }));
}

export const ungyeolServices = getUngyeolServices('ko');

export function getUngyeolService(id: UngyeolServiceId, lang: Lang = 'ko') {
  return getUngyeolServices(lang).find((service) => service.id === id);
}
