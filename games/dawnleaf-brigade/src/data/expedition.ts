import { translate } from '../i18n/index';
import type { StageId } from '../types/stage';
export const REGIONS = [
  {
    name: translate('초록빛의 맹세'),
    subtitle: translate('흩어진 기사단을 다시 모으다'),
    art: 'forest-battle',
    color: '#dcc383',
  },
  {
    name: translate('서리의 순례'),
    subtitle: translate('얼어붙은 종소리를 되찾다'),
    art: 'frost-battle',
    color: '#a5dce9',
  },
  {
    name: translate('잿불의 약속'),
    subtitle: translate('무너진 대장간에서 희망을 벼리다'),
    art: 'ember-battle',
    color: '#e8a879',
  },
  {
    name: translate('별빛의 귀환'),
    subtitle: translate('마지막 봉인을 넘어 새벽으로'),
    art: 'astral-battle',
    color: '#c8b6ed',
  },
] as const;
export type Mission = 'siege' | 'hold' | 'hunt';
export const MISSION_NAMES: Record<Mission, string> = {
  siege: translate('요새 공략'),
  hold: translate('성역 수호'),
  hunt: translate('군단 섬멸'),
};
export interface Story {
  region: number;
  mission: Mission;
  duration: number;
  requiredKills: number;
  intro: string;
  ending: string;
  reward: string;
}
const stories: Story[] = [
  {
    region: 0,
    mission: 'siege',
    duration: 0,
    requiredKills: 0,
    intro: translate(
      '숲의 샘이 빛을 잃었습니다. 루미는 곰 수호병과 함께 첫 봉화를 되찾으러 나섭니다.',
    ),
    ending: translate('첫 봉화가 켜졌습니다. 숨어 있던 동료들이 숲길로 모여듭니다.'),
    reward: translate('다음 숲길 개방'),
  },
  {
    region: 0,
    mission: 'siege',
    duration: 0,
    requiredKills: 0,
    intro: translate(
      '무너진 관문 너머로 포로들의 신호가 들립니다. 궁수의 엄호 아래 길을 열어 주세요.',
    ),
    ending: translate('포로들을 구했습니다. 그들은 저주가 북쪽 종탑에서 시작되었다고 말합니다.'),
    reward: translate('묘지로 향하는 길 개방'),
  },
  {
    region: 0,
    mission: 'siege',
    duration: 0,
    requiredKills: 0,
    intro: translate(
      '묘지의 군단이 숲을 봉쇄했습니다. 이들을 돌파하면 치유사 세라가 북쪽 길을 안내할 것입니다.',
    ),
    ending: translate(
      '세라의 종이 울리자 숲의 생명이 돌아옵니다. 하지만 북쪽 하늘에는 푸른 서리가 번집니다.',
    ),
    reward: translate('사슴 치유사 합류 · 아우라 II 강화 가능'),
  },
  {
    region: 1,
    mission: 'hold',
    duration: 75000,
    requiredKills: 12,
    intro: translate(
      '눈보라 속에서 순례자들이 길을 잃었습니다. 75초 동안 성역과 루미를 지키고 적 12명을 격퇴하세요.',
    ),
    ending: translate(
      '마지막 순례자가 무사히 건넜습니다. 올빼미 마법사 루멘이 따뜻한 불씨를 나눕니다.',
    ),
    reward: translate('올빼미 화염술사 합류'),
  },
  {
    region: 1,
    mission: 'hunt',
    duration: 0,
    requiredKills: 0,
    intro: translate(
      '얼어붙은 순례길을 망령들이 배회합니다. 요새보다 먼저 모든 증원 병력을 처치해 길을 정화하세요.',
    ),
    ending: translate(
      '길에 내려앉았던 서리가 걷힙니다. 종탑의 문을 지키는 거대한 그림자가 모습을 드러냅니다.',
    ),
    reward: translate('빙결의 종탑 개방'),
  },
  {
    region: 1,
    mission: 'siege',
    duration: 0,
    requiredKills: 0,
    intro: translate(
      '파수병의 철벽 뒤에서 망령들이 종을 얼리고 있습니다. 화염과 창으로 방벽을 뚫어야 합니다.',
    ),
    ending: translate(
      '종이 다시 울렸습니다. 늑대 창기사 로안이 맹세를 바치고, 남쪽 하늘에 붉은 불길이 보입니다.',
    ),
    reward: translate('늑대 창기사 합류 · 아우라 III 강화 가능'),
  },
  {
    region: 2,
    mission: 'hold',
    duration: 85000,
    requiredKills: 18,
    intro: translate(
      '폭탄병들이 피난 나루를 겨눕니다. 85초를 버티며 적 18명을 격퇴하세요. 밀집한 병력은 폭발에 함께 다칠 수 있습니다.',
    ),
    ending: translate(
      '피난선이 출항했습니다. 강 건너 대장간에 아직 살아 있는 불씨가 있다는 소식이 옵니다.',
    ),
    reward: translate('대장간 진입로 개방'),
  },
  {
    region: 2,
    mission: 'hunt',
    duration: 0,
    requiredKills: 0,
    intro: translate(
      '대장장이들이 갇혔습니다. 모든 적 증원을 소탕하고 오래된 무기고를 되찾으세요.',
    ),
    ending: translate(
      '대장간의 모루가 다시 울립니다. 새벽의 무기를 벼릴 별철이 마지막 왕좌에 있다는 사실을 알게 됩니다.',
    ),
    reward: translate('용광로의 문 개방'),
  },
  {
    region: 2,
    mission: 'siege',
    duration: 0,
    requiredKills: 0,
    intro: translate(
      '용광로의 문을 파괴해야 별빛 회랑으로 갈 수 있습니다. 파수병과 폭탄병의 합동 방어를 무너뜨리세요.',
    ),
    ending: translate(
      '문이 열리고 잿불 위로 별빛이 내립니다. 루미의 오라에 세 지역의 맹세가 모입니다.',
    ),
    reward: translate('아우라 IV 강화 가능'),
  },
  {
    region: 3,
    mission: 'hold',
    duration: 95000,
    requiredKills: 24,
    intro: translate(
      '회랑이 무너지고 있습니다. 적 24명을 격퇴하고 95초 동안 동료들이 별철을 옮길 시간을 벌어 주세요. 서리와 폭발이 함께 밀려옵니다.',
    ),
    ending: translate('별철을 지켜냈습니다. 이제 세 개의 마지막 봉인만 남았습니다.'),
    reward: translate('마지막 봉인 전장 개방'),
  },
  {
    region: 3,
    mission: 'hunt',
    duration: 0,
    requiredKills: 0,
    intro: translate(
      '군단 지휘관들이 봉인을 수호합니다. 아우라와 새 무기를 조합해 모든 증원을 격파하세요.',
    ),
    ending: translate(
      '세 봉인이 하나씩 꺼집니다. 왕좌 뒤에서 오래전 잃어버린 새벽의 빛이 새어 나옵니다.',
    ),
    reward: translate('마지막 왕좌 개방'),
  },
  {
    region: 3,
    mission: 'siege',
    duration: 0,
    requiredKills: 0,
    intro: translate(
      '여정에서 만난 모든 동료가 마지막 문 앞에 섰습니다. 어둠의 왕좌를 파괴하고 새벽을 되찾으세요.',
    ),
    ending: translate(
      '왕좌가 무너지자 숲과 설원, 대장간 위로 같은 해가 떠오릅니다. 루미는 동료들과 집으로 돌아갑니다. 네 지역의 이야기가 완성되었습니다.',
    ),
    reward: translate('이야기 완결 · 모든 전장 재도전 가능'),
  },
];
export const CAMPAIGN_STORY = Object.fromEntries(
  stories.map((story, i) => [`stage-${i + 1}`, story]),
) as Record<StageId, Story>;
