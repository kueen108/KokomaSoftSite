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

export interface UngyeolServiceInfo {
  id: UngyeolServiceId;
  path: string;
  navLabel: string;
  title: string;
  description: string;
  lead: string;
  eyebrow: string;
  resultTitle: string;
  appPitch: string;
  fields: UngyeolServiceField[];
}

export const ungyeolServices: UngyeolServiceInfo[] = [
  {
    id: 'fortune',
    path: '/ko/fortune/',
    navLabel: '오늘 운세',
    title: '오늘 운세 미니 풀이',
    description: '생년월일과 관심사를 바탕으로 오늘의 흐름, 관계, 일/금전, 조언을 짧게 확인합니다.',
    lead: '정밀 사주 풀이 전, 오늘의 분위기를 빠르게 확인하는 무료 웹 미니 버전입니다.',
    eyebrow: '운세',
    resultTitle: '오늘의 흐름',
    appPitch: '앱에서는 생년월일시, 성별, 히스토리를 반영해 더 긴 오늘 운세와 대운 흐름을 볼 수 있습니다.',
    fields: [
      {
        name: 'birthDate',
        label: '생년월일',
        type: 'date',
        required: true,
      },
      {
        name: 'birthTime',
        label: '태어난 시간',
        type: 'select',
        options: ['모름', '자시 23:00-01:00', '축시 01:00-03:00', '인시 03:00-05:00', '묘시 05:00-07:00', '진시 07:00-09:00', '사시 09:00-11:00', '오시 11:00-13:00', '미시 13:00-15:00', '신시 15:00-17:00', '유시 17:00-19:00', '술시 19:00-21:00', '해시 21:00-23:00'],
      },
      {
        name: 'focus',
        label: '가장 궁금한 흐름',
        type: 'select',
        options: ['전체', '연애', '일/학업', '금전', '인간관계'],
      },
    ],
  },
  {
    id: 'hidden-feelings',
    path: '/ko/hidden-feelings/',
    navLabel: '상대 속마음',
    title: '상대 속마음 미니 풀이',
    description: '관계와 최근 상황을 입력하면 상대의 가능성 있는 마음, 거리감, 다음 행동 힌트를 정리합니다.',
    lead: '확정적인 판단이 아니라 관계를 차분히 돌아보기 위한 엔터테인먼트 풀이입니다.',
    eyebrow: '인연',
    resultTitle: '상대 마음 흐름',
    appPitch: '앱에서는 상대 성향, 상황, 대화 흐름을 더 자세히 반영해 속마음과 다음 행동을 풀어줍니다.',
    fields: [
      {
        name: 'relationship',
        label: '관계',
        type: 'select',
        options: ['썸', '연인', '전연인', '친구', '직장/동료'],
      },
      {
        name: 'status',
        label: '현재 상황',
        type: 'select',
        options: ['답장이 늦어요', '차가워졌어요', '다시 연락할까요', '나를 좋아할까요', '관계가 애매해요'],
      },
      {
        name: 'context',
        label: '최근 상황',
        type: 'textarea',
        required: true,
        placeholder: '최근 대화, 만남 분위기, 걱정되는 점을 적어주세요.',
      },
    ],
  },
  {
    id: 'reply',
    path: '/ko/reply/',
    navLabel: '답장 추천',
    title: '답장 추천',
    description: '상대 메시지, 관계, 말투, 목적을 바탕으로 바로 보낼 수 있는 답장 후보 3개를 제안합니다.',
    lead: '한국어 대화의 존댓말/반말, 연상/동년배/연하 분위기를 고려하는 웹 미니 버전입니다.',
    eyebrow: '대화',
    resultTitle: '추천 답장',
    appPitch: '앱에서는 상대 메시지와 상황을 더 길게 반영해 말투별 답장, 관계 리스크, 후속 질문까지 제안합니다.',
    fields: [
      {
        name: 'relationship',
        label: '관계',
        type: 'select',
        options: ['썸', '연인', '친구', '직장/동료', '전연인'],
      },
      {
        name: 'tone',
        label: '말투',
        type: 'select',
        options: ['부드러운 존댓말', '담백한 존댓말', '편한 반말', '장난스러운 반말'],
      },
      {
        name: 'goal',
        label: '답장의 목적',
        type: 'select',
        options: ['관심 표현', '약속 잡기', '사과하기', '거리두기', '대화 이어가기'],
      },
      {
        name: 'message',
        label: '상대 메시지',
        type: 'textarea',
        required: true,
        placeholder: '상대가 보낸 메시지를 붙여넣어 주세요.',
      },
    ],
  },
  {
    id: 'dream',
    path: '/ko/dream/',
    navLabel: '꿈해몽',
    title: '꿈해몽 미니 풀이',
    description: '꿈 키워드와 감정, 구체적인 장면을 바탕으로 오늘 참고할 상징과 조언을 정리합니다.',
    lead: '꿈의 상징을 오늘의 마음 흐름과 연결해 가볍게 확인하는 무료 풀이입니다.',
    eyebrow: '꿈',
    resultTitle: '꿈의 상징',
    appPitch: '앱에서는 키워드, 감정, 꿈 내용, 최근 고민을 함께 반영해 더 풍부한 꿈풀이를 제공합니다.',
    fields: [
      {
        name: 'keyword',
        label: '꿈 키워드',
        type: 'select',
        options: ['사람', '물', '불', '돈', '가족', '연인', '도망', '시험', '집', '동물'],
      },
      {
        name: 'emotion',
        label: '꿈에서 느낀 감정',
        type: 'select',
        options: ['불안', '그리움', '편안함', '무서움', '찝찝함', '기쁨'],
      },
      {
        name: 'dreamText',
        label: '꿈 내용',
        type: 'textarea',
        required: true,
        placeholder: '기억나는 장면을 자유롭게 적어주세요.',
      },
    ],
  },
  {
    id: 'tarot',
    path: '/ko/tarot/',
    navLabel: '타로',
    title: '타로 3장 미니 리딩',
    description: '질문을 입력하면 현재, 흐름, 조언을 상징하는 3장의 카드로 짧은 리딩을 제공합니다.',
    lead: '질문을 마음속에 정리하고 카드 흐름으로 오늘의 선택을 가볍게 점검해 보세요.',
    eyebrow: '타로',
    resultTitle: '3장 리딩',
    appPitch: '앱에서는 질문별 세부 스프레드, 카드 해석, 히스토리 저장까지 이어집니다.',
    fields: [
      {
        name: 'topic',
        label: '질문 분야',
        type: 'select',
        options: ['연애', '일/학업', '금전', '인간관계', '선택 고민'],
      },
      {
        name: 'question',
        label: '질문',
        type: 'textarea',
        required: true,
        placeholder: '예: 이 사람에게 먼저 연락해도 될까요?',
      },
    ],
  },
  {
    id: 'compatibility',
    path: '/ko/compatibility/',
    navLabel: '인연/궁합',
    title: '인연/궁합 미니 풀이',
    description: '두 사람의 생년월일과 관계 상황을 바탕으로 끌림, 충돌 포인트, 오늘의 조언을 정리합니다.',
    lead: '정밀 궁합 전, 서로의 관계 흐름을 빠르게 확인하는 웹 미니 버전입니다.',
    eyebrow: '궁합',
    resultTitle: '두 사람의 흐름',
    appPitch: '앱에서는 두 사람의 생년월일시와 관계 상황을 더 자세히 반영해 궁합을 풀이합니다.',
    fields: [
      {
        name: 'myBirthDate',
        label: '내 생년월일',
        type: 'date',
        required: true,
      },
      {
        name: 'theirBirthDate',
        label: '상대 생년월일',
        type: 'date',
        required: true,
      },
      {
        name: 'relationship',
        label: '관계',
        type: 'select',
        options: ['썸', '연인', '부부', '전연인', '친구', '직장/동료'],
      },
    ],
  },
  {
    id: 'free-question',
    path: '/ko/free-question/',
    navLabel: '자유질문',
    title: '자유질문 미니 풀이',
    description: '지금 고민을 입력하면 상황을 세 갈래로 정리하고 오늘 바로 해볼 행동을 제안합니다.',
    lead: '정답을 단정하지 않고, 생각을 정리하는 관점의 무료 미니 풀이입니다.',
    eyebrow: '질문',
    resultTitle: '질문 정리',
    appPitch: '앱에서는 사주/타로/관계 맥락을 결합해 더 깊은 자유질문 풀이를 제공합니다.',
    fields: [
      {
        name: 'category',
        label: '고민 분야',
        type: 'select',
        options: ['연애', '일/학업', '금전', '가족', '인간관계', '선택 고민'],
      },
      {
        name: 'question',
        label: '질문',
        type: 'textarea',
        required: true,
        placeholder: '지금 가장 궁금한 질문을 적어주세요.',
      },
    ],
  },
  {
    id: 'face-reading',
    path: '/ko/face-reading/',
    navLabel: '관상',
    title: '관상 미리보기',
    description: '웹에서는 사진을 받지 않고 인상 키워드 기반 참고 풀이만 제공합니다. 사진 기반 관상은 운결 앱에서 확인할 수 있습니다.',
    lead: '개인 사진 보호와 AI 비용 관리를 위해 웹에서는 사진 업로드 없이 맛보기만 제공합니다.',
    eyebrow: '관상',
    resultTitle: '인상 키워드 풀이',
    appPitch: '사진 기반 관상은 운결 앱에서 동의 후 이용할 수 있으며, 원본 사진은 저장하지 않고 텍스트 결과만 히스토리에 남깁니다.',
    fields: [
      {
        name: 'impression',
        label: '가장 가까운 첫인상',
        type: 'select',
        options: ['부드러운 인상', '차분한 인상', '선명한 인상', '활기찬 인상', '신중한 인상'],
      },
      {
        name: 'focus',
        label: '궁금한 영역',
        type: 'select',
        options: ['연애 인상', '일/금전 흐름', '대인관계', '오늘의 조언'],
      },
      {
        name: 'context',
        label: '참고 상황',
        type: 'textarea',
        placeholder: '중요한 만남, 면접, 소개팅 등 참고할 상황이 있다면 적어주세요.',
      },
    ],
  },
];

export function getUngyeolService(id: UngyeolServiceId) {
  return ungyeolServices.find((service) => service.id === id);
}
