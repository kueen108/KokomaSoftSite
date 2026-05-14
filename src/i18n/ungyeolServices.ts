import type { Lang } from './translations';
import { languageCodes } from '../lib/seo';

export type UngyeolServiceId =
  | 'fortune'
  | 'hidden-feelings'
  | 'reply'
  | 'dream'
  | 'tarot'
  | 'compatibility'
  | 'free-question'
  | 'face-reading';

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
  'hidden-feelings',
  'reply',
  'dream',
  'tarot',
  'compatibility',
  'free-question',
  'face-reading',
];

export const ungyeolProductName: Record<Lang, string> = {
  ko: '운결',
  en: 'Ungyeol',
  zh: 'Ungyeol',
  ja: 'Ungyeol',
};

export const ungyeolLandingCopy: Record<Lang, UngyeolLandingCopy> = {
  ko: {
    eyebrow: 'Ungyeol Web Tools',
    title: '운결 무료 미니 풀이',
    subtitle: '앱 설치 전 운세, 타로, 꿈해몽, 답장 추천을 웹에서 짧게 체험해 보세요. 정밀 풀이와 히스토리는 앱에서 이어집니다.',
    detailTitle: '웹에서 먼저 체험하기',
    detailSubtitle: '운결의 주요 기능을 무료 미니 풀이로 짧게 확인하고, 더 자세한 AI 풀이와 히스토리는 앱에서 이어보세요.',
    breadcrumbLabel: '운결 미니서비스',
  },
  en: {
    eyebrow: 'Ungyeol Web Tools',
    title: 'Free Ungyeol Mini Readings',
    subtitle: 'Try quick web versions of fortune, tarot, dream meaning, reply suggestions, and relationship readings before installing the app.',
    detailTitle: 'Try it on the web first',
    detailSubtitle: 'Preview Ungyeol features with free mini readings, then continue in the app for deeper AI readings and saved history.',
    breadcrumbLabel: 'Ungyeol Mini Services',
  },
  zh: {
    eyebrow: 'Ungyeol Web Tools',
    title: 'Ungyeol 免费迷你解读',
    subtitle: '安装应用前，可先在网页快速体验运势、塔罗、梦境解析、回复建议和缘分解读。',
    detailTitle: '先在网页体验',
    detailSubtitle: '用免费迷你解读快速了解 Ungyeol 的主要功能，更详细的 AI 解读和历史记录可在应用中继续使用。',
    breadcrumbLabel: 'Ungyeol 迷你服务',
  },
  ja: {
    eyebrow: 'Ungyeol Web Tools',
    title: 'Ungyeol 無料ミニ鑑定',
    subtitle: 'アプリを入れる前に、運勢、タロット、夢占い、返信提案、相性鑑定をWebで短く体験できます。',
    detailTitle: 'まずWebで体験',
    detailSubtitle: 'Ungyeolの主要機能を無料ミニ鑑定で確認し、詳しいAI鑑定と履歴保存はアプリで続けられます。',
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
    'hidden-feelings': {
      navLabel: '상대 속마음',
      title: '상대 속마음 미니 풀이',
      description: '관계와 최근 상황을 입력하면 상대의 가능성 있는 마음, 거리감, 다음 행동 힌트를 정리합니다.',
      lead: '확정적인 판단이 아니라 관계를 차분히 돌아보기 위한 엔터테인먼트 풀이입니다.',
      eyebrow: '인연',
      resultTitle: '상대 마음 흐름',
      appPitch: '앱에서는 상대 성향, 상황, 대화 흐름을 더 자세히 반영해 속마음과 다음 행동을 풀어줍니다.',
      fields: [
        { name: 'relationship', label: '관계', type: 'select', options: ['썸', '연인', '전연인', '친구', '직장/동료'] },
        { name: 'status', label: '현재 상황', type: 'select', options: ['답장이 늦어요', '차가워졌어요', '다시 연락할까요', '나를 좋아할까요', '관계가 애매해요'] },
        { name: 'context', label: '최근 상황', type: 'textarea', required: true, placeholder: '최근 대화, 만남 분위기, 걱정되는 점을 적어주세요.' },
      ],
    },
    reply: {
      navLabel: '답장 추천',
      title: '답장 추천',
      description: '상대 메시지, 관계, 말투, 목적을 바탕으로 바로 보낼 수 있는 답장 후보 3개를 제안합니다.',
      lead: '한국어 대화의 존댓말/반말, 연상/동년배/연하 분위기를 고려하는 웹 미니 버전입니다.',
      eyebrow: '대화',
      resultTitle: '추천 답장',
      appPitch: '앱에서는 상대 메시지와 상황을 더 길게 반영해 말투별 답장, 관계 리스크, 후속 질문까지 제안합니다.',
      fields: [
        { name: 'relationship', label: '관계', type: 'select', options: ['썸', '연인', '친구', '직장/동료', '전연인'] },
        { name: 'tone', label: '말투', type: 'select', options: ['부드러운 존댓말', '담백한 존댓말', '편한 반말', '장난스러운 반말'] },
        { name: 'goal', label: '답장의 목적', type: 'select', options: ['관심 표현', '약속 잡기', '사과하기', '거리두기', '대화 이어가기'] },
        { name: 'message', label: '상대 메시지', type: 'textarea', required: true, placeholder: '상대가 보낸 메시지를 붙여넣어 주세요.' },
      ],
    },
    dream: {
      navLabel: '꿈해몽',
      title: '꿈해몽 미니 풀이',
      description: '꿈 키워드와 감정, 구체적인 장면을 바탕으로 오늘 참고할 상징과 조언을 정리합니다.',
      lead: '꿈의 상징을 오늘의 마음 흐름과 연결해 가볍게 확인하는 무료 풀이입니다.',
      eyebrow: '꿈',
      resultTitle: '꿈의 상징',
      appPitch: '앱에서는 키워드, 감정, 꿈 내용, 최근 고민을 함께 반영해 더 풍부한 꿈풀이를 제공합니다.',
      fields: [
        { name: 'keyword', label: '꿈 키워드', type: 'select', options: ['사람', '물', '불', '돈', '가족', '연인', '도망', '시험', '집', '동물'] },
        { name: 'emotion', label: '꿈에서 느낀 감정', type: 'select', options: ['불안', '그리움', '편안함', '무서움', '찝찝함', '기쁨'] },
        { name: 'dreamText', label: '꿈 내용', type: 'textarea', required: true, placeholder: '기억나는 장면을 자유롭게 적어주세요.' },
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
    'face-reading': {
      navLabel: '관상',
      title: '관상 미리보기',
      description: '웹에서는 사진을 받지 않고 인상 키워드 기반 참고 풀이만 제공합니다. 사진 기반 관상은 운결 앱에서 확인할 수 있습니다.',
      lead: '개인 사진 보호와 AI 비용 관리를 위해 웹에서는 사진 업로드 없이 맛보기만 제공합니다.',
      eyebrow: '관상',
      resultTitle: '인상 키워드 풀이',
      appPitch: '사진 기반 관상은 운결 앱에서 동의 후 이용할 수 있으며, 원본 사진은 저장하지 않고 텍스트 결과만 히스토리에 남깁니다.',
      fields: [
        { name: 'impression', label: '가장 가까운 첫인상', type: 'select', options: ['부드러운 인상', '차분한 인상', '선명한 인상', '활기찬 인상', '신중한 인상'] },
        { name: 'focus', label: '궁금한 영역', type: 'select', options: ['연애 인상', '일/금전 흐름', '대인관계', '오늘의 조언'] },
        { name: 'context', label: '참고 상황', type: 'textarea', placeholder: '중요한 만남, 면접, 소개팅 등 참고할 상황이 있다면 적어주세요.' },
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
    'hidden-feelings': {
      navLabel: 'Hidden Feelings',
      title: 'Hidden Feelings Mini Reading',
      description: 'Describe the relationship and recent situation to explore possible feelings, distance, and next-action hints.',
      lead: 'An entertainment reading for reflecting calmly on a relationship, not for making fixed conclusions.',
      eyebrow: 'Connection',
      resultTitle: 'Emotional Flow',
      appPitch: 'The app can reflect personality, context, and conversation flow in more detail for hidden-feelings readings.',
      fields: [
        { name: 'relationship', label: 'Relationship', type: 'select', options: ['Flirting stage', 'Partner', 'Ex-partner', 'Friend', 'Work or colleague'] },
        { name: 'status', label: 'Current situation', type: 'select', options: ['Replies are slow', 'They feel colder', 'Should I contact them again?', 'Do they like me?', 'The relationship feels unclear'] },
        { name: 'context', label: 'Recent context', type: 'textarea', required: true, placeholder: 'Write the recent messages, mood after meeting, or what worries you.' },
      ],
    },
    reply: {
      navLabel: 'Reply Suggestions',
      title: 'Reply Suggestions',
      description: 'Get three message options based on the other person’s message, relationship, tone, and goal.',
      lead: 'A web preview that considers tone, distance, and respectful or casual phrasing for social contexts.',
      eyebrow: 'Conversation',
      resultTitle: 'Suggested Replies',
      appPitch: 'In the app, Ungyeol can use longer messages and situations to suggest tones, risk points, and follow-up questions.',
      fields: [
        { name: 'relationship', label: 'Relationship', type: 'select', options: ['Flirting stage', 'Partner', 'Friend', 'Work or colleague', 'Ex-partner'] },
        { name: 'tone', label: 'Tone', type: 'select', options: ['Warm and polite', 'Calm and polite', 'Casual', 'Playful casual'] },
        { name: 'goal', label: 'Reply goal', type: 'select', options: ['Show interest', 'Make plans', 'Apologize', 'Create distance', 'Keep talking'] },
        { name: 'message', label: 'Their message', type: 'textarea', required: true, placeholder: 'Paste the message you received.' },
      ],
    },
    dream: {
      navLabel: 'Dream Meaning',
      title: 'Dream Meaning Mini Reading',
      description: 'Use a dream keyword, emotion, and scene details to get symbols and advice for today.',
      lead: 'A free reading that connects dream symbols with your current emotional flow.',
      eyebrow: 'Dream',
      resultTitle: 'Dream Symbol',
      appPitch: 'The app combines keywords, emotion, dream details, and recent concerns for a richer dream interpretation.',
      fields: [
        { name: 'keyword', label: 'Dream keyword', type: 'select', options: ['Person', 'Water', 'Fire', 'Money', 'Family', 'Lover', 'Running away', 'Exam', 'House', 'Animal'] },
        { name: 'emotion', label: 'Emotion in the dream', type: 'select', options: ['Anxiety', 'Longing', 'Comfort', 'Fear', 'Uneasiness', 'Joy'] },
        { name: 'dreamText', label: 'Dream details', type: 'textarea', required: true, placeholder: 'Write the scenes you remember.' },
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
    'face-reading': {
      navLabel: 'Face Reading',
      title: 'Face Reading Preview',
      description: 'The web version does not collect photos. It provides only a keyword-based impression preview. Photo-based face reading is available in the app.',
      lead: 'To protect personal photos and control AI cost, the web preview works without uploads.',
      eyebrow: 'Face Reading',
      resultTitle: 'Impression Keywords',
      appPitch: 'Photo-based face reading is available in the app with consent. Original photos are not saved; only text results are kept in history.',
      fields: [
        { name: 'impression', label: 'Closest first impression', type: 'select', options: ['Soft impression', 'Calm impression', 'Sharp impression', 'Energetic impression', 'Careful impression'] },
        { name: 'focus', label: 'Area to check', type: 'select', options: ['Love impression', 'Work or money flow', 'Social relationships', 'Advice for today'] },
        { name: 'context', label: 'Context', type: 'textarea', placeholder: 'Add context such as an important meeting, interview, or date.' },
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
    'hidden-feelings': {
      navLabel: '对方心意',
      title: '对方心意迷你解读',
      description: '输入关系和最近状况，整理对方可能的心情、距离感和下一步提示。',
      lead: '这不是确定判断，而是帮助你冷静回顾关系的娱乐解读。',
      eyebrow: '缘分',
      resultTitle: '对方心意走势',
      appPitch: '应用中可更详细结合对方性格、状况和聊天走向，解读心意与下一步。',
      fields: [
        { name: 'relationship', label: '关系', type: 'select', options: ['暧昧', '恋人', '前任', '朋友', '职场/同事'] },
        { name: 'status', label: '当前状况', type: 'select', options: ['回复变慢', '态度变冷', '要不要再联系', '是否喜欢我', '关系很模糊'] },
        { name: 'context', label: '最近状况', type: 'textarea', required: true, placeholder: '写下最近的聊天、见面气氛或担心的点。' },
      ],
    },
    reply: {
      navLabel: '回复建议',
      title: '回复建议',
      description: '根据对方消息、关系、语气和目的，提供三条可以直接参考的回复。',
      lead: '适合需要根据年龄、距离感、礼貌程度调整语气的社交场景。',
      eyebrow: '对话',
      resultTitle: '推荐回复',
      appPitch: '应用中可结合更长的消息和状况，按语气提供回复、关系风险和后续问题。',
      fields: [
        { name: 'relationship', label: '关系', type: 'select', options: ['暧昧', '恋人', '朋友', '职场/同事', '前任'] },
        { name: 'tone', label: '语气', type: 'select', options: ['温和礼貌', '简洁礼貌', '轻松自然', '活泼自然'] },
        { name: 'goal', label: '回复目的', type: 'select', options: ['表达兴趣', '约时间', '道歉', '保持距离', '继续聊天'] },
        { name: 'message', label: '对方消息', type: 'textarea', required: true, placeholder: '粘贴对方发来的消息。' },
      ],
    },
    dream: {
      navLabel: '梦境解析',
      title: '梦境解析迷你解读',
      description: '根据梦的关键词、情绪和具体场景，整理今天可参考的象征和建议。',
      lead: '把梦的象征与今天的心理状态连接起来，轻松查看的免费解读。',
      eyebrow: '梦',
      resultTitle: '梦的象征',
      appPitch: '应用中会结合关键词、情绪、梦的内容和近期烦恼，提供更丰富的梦境解析。',
      fields: [
        { name: 'keyword', label: '梦的关键词', type: 'select', options: ['人', '水', '火', '钱', '家人', '恋人', '逃跑', '考试', '房子', '动物'] },
        { name: 'emotion', label: '梦中的情绪', type: 'select', options: ['不安', '想念', '安心', '害怕', '别扭', '开心'] },
        { name: 'dreamText', label: '梦的内容', type: 'textarea', required: true, placeholder: '自由写下记得的场景。' },
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
    'face-reading': {
      navLabel: '面相',
      title: '面相预览',
      description: '网页不接收照片，只提供基于印象关键词的参考解读。照片面相可在 Ungyeol 应用中使用。',
      lead: '为保护个人照片并控制 AI 成本，网页仅提供无需上传照片的预览。',
      eyebrow: '面相',
      resultTitle: '印象关键词解读',
      appPitch: '照片面相可在应用中经同意后使用，原始照片不会保存，只保存文字结果到历史记录。',
      fields: [
        { name: 'impression', label: '最接近的第一印象', type: 'select', options: ['温和印象', '沉稳印象', '鲜明印象', '活力印象', '谨慎印象'] },
        { name: 'focus', label: '想了解的领域', type: 'select', options: ['恋爱印象', '工作/金钱走势', '人际关系', '今日建议'] },
        { name: 'context', label: '参考状况', type: 'textarea', placeholder: '如果有重要见面、面试、相亲等状况，可以写下来。' },
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
    'hidden-feelings': {
      navLabel: '相手の本音',
      title: '相手の本音ミニ鑑定',
      description: '関係性と最近の状況を入力すると、相手の可能性ある気持ち、距離感、次の行動ヒントを整理します。',
      lead: '断定ではなく、関係を落ち着いて見直すためのエンタメ鑑定です。',
      eyebrow: '縁',
      resultTitle: '相手の気持ちの流れ',
      appPitch: 'アプリでは相手の傾向、状況、会話の流れをさらに反映して本音と次の行動を読み解きます。',
      fields: [
        { name: 'relationship', label: '関係', type: 'select', options: ['気になる関係', '恋人', '元恋人', '友人', '職場/同僚'] },
        { name: 'status', label: '現在の状況', type: 'select', options: ['返信が遅い', '冷たくなった', 'また連絡するべき？', '好かれている？', '関係が曖昧'] },
        { name: 'context', label: '最近の状況', type: 'textarea', required: true, placeholder: '最近の会話、会った時の雰囲気、不安な点を書いてください。' },
      ],
    },
    reply: {
      navLabel: '返信提案',
      title: '返信提案',
      description: '相手のメッセージ、関係、口調、目的に合わせて、すぐ参考にできる返信候補を3つ提案します。',
      lead: '年齢差、距離感、敬語/カジュアルさが必要な会話に向けたWebミニ版です。',
      eyebrow: '会話',
      resultTitle: 'おすすめ返信',
      appPitch: 'アプリでは長いメッセージや状況を反映し、口調別の返信、関係リスク、次の質問まで提案します。',
      fields: [
        { name: 'relationship', label: '関係', type: 'select', options: ['気になる関係', '恋人', '友人', '職場/同僚', '元恋人'] },
        { name: 'tone', label: '口調', type: 'select', options: ['やわらかい敬語', '落ち着いた敬語', '自然なカジュアル', '明るいカジュアル'] },
        { name: 'goal', label: '返信の目的', type: 'select', options: ['好意を伝える', '約束する', '謝る', '距離を置く', '会話を続ける'] },
        { name: 'message', label: '相手のメッセージ', type: 'textarea', required: true, placeholder: '相手から届いたメッセージを貼り付けてください。' },
      ],
    },
    dream: {
      navLabel: '夢占い',
      title: '夢占いミニ鑑定',
      description: '夢のキーワード、感情、具体的な場面から、今日参考になる象徴とアドバイスを整理します。',
      lead: '夢の象徴を今日の心の流れとつなげて、気軽に確認できる無料鑑定です。',
      eyebrow: '夢',
      resultTitle: '夢の象徴',
      appPitch: 'アプリではキーワード、感情、夢の内容、最近の悩みを合わせて、より豊かな夢占いを提供します。',
      fields: [
        { name: 'keyword', label: '夢のキーワード', type: 'select', options: ['人', '水', '火', 'お金', '家族', '恋人', '逃げる', '試験', '家', '動物'] },
        { name: 'emotion', label: '夢で感じた感情', type: 'select', options: ['不安', '懐かしさ', '安心', '怖さ', '違和感', '喜び'] },
        { name: 'dreamText', label: '夢の内容', type: 'textarea', required: true, placeholder: '覚えている場面を自由に書いてください。' },
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
    'face-reading': {
      navLabel: '人相',
      title: '人相プレビュー',
      description: 'Webでは写真を受け取らず、印象キーワードに基づく参考鑑定のみ提供します。写真ベースの人相鑑定はUngyeolアプリで確認できます。',
      lead: '個人写真の保護とAIコスト管理のため、Webでは写真アップロードなしのプレビューのみ提供します。',
      eyebrow: '人相',
      resultTitle: '印象キーワード鑑定',
      appPitch: '写真ベースの人相鑑定はアプリで同意後に利用できます。元写真は保存せず、テキスト結果のみ履歴に残します。',
      fields: [
        { name: 'impression', label: '近い第一印象', type: 'select', options: ['やわらかい印象', '落ち着いた印象', 'はっきりした印象', '活発な印象', '慎重な印象'] },
        { name: 'focus', label: '気になる領域', type: 'select', options: ['恋愛での印象', '仕事/お金の流れ', '対人関係', '今日のアドバイス'] },
        { name: 'context', label: '参考状況', type: 'textarea', placeholder: '大事な面談、面接、紹介など参考になる状況があれば書いてください。' },
      ],
    },
  },
};

const uiCopy: Record<Lang, UngyeolServiceUi> = {
  ko: {
    backLabel: '운결 미니서비스',
    noteTitle: '무료 웹 미니 풀이',
    noteText: '입력 내용은 브라우저 안에서만 처리됩니다. 정밀 AI 풀이, 히스토리 저장, 사진 기반 관상은 운결 앱에서 이용할 수 있습니다.',
    submitLabel: '미니 풀이 보기',
    disclaimer: '엔터테인먼트 목적의 참고용 결과입니다. 중요한 결정은 현실의 정보와 본인의 판단을 함께 고려해 주세요.',
    emptyTitle: '입력 후 결과가 여기에 표시됩니다',
    emptyText: '짧은 풀이를 확인한 뒤, 앱에서 더 자세한 해석으로 이어갈 수 있습니다.',
    appEyebrow: 'Ungyeol App',
    appTitle: '더 자세한 풀이는 앱에서 이어보세요',
    appButtonLabel: 'Google Play에서 열기',
  },
  en: {
    backLabel: 'Ungyeol Mini Services',
    noteTitle: 'Free Web Mini Reading',
    noteText: 'Your input is processed only in the browser. Detailed AI readings, saved history, and photo-based face readings are available in the Ungyeol app.',
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
    noteText: '输入内容只在浏览器中处理。更详细的 AI 解读、历史记录和照片面相可在 Ungyeol 应用中使用。',
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
    noteText: '入力内容はブラウザ内でのみ処理されます。詳しいAI鑑定、履歴保存、写真ベースの人相鑑定はUngyeolアプリで利用できます。',
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
