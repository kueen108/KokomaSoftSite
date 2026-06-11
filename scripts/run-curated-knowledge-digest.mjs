#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const repoRoot = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const postDir = join(repoRoot, 'src/content/medium-digest');
const outputDir = join(repoRoot, 'output');
const logPath = join(outputDir, 'curated-knowledge-digest.log');

function todayInSeoul() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 16,
  });
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;
  writeFileSync(logPath, `\n\n$ ${command} ${args.join(' ')}\n${output}`, { flag: 'a' });
  if (result.status !== 0) {
    const tail = output.trim().split('\n').slice(-80).join('\n');
    throw new Error(`${command} ${args.join(' ')} failed\n${tail}`);
  }
  return output;
}

function yamlString(value) {
  return `"${String(value).replaceAll('\\', '\\\\').replaceAll('"', '\\"')}"`;
}

function frontmatter(post, date, workflow) {
  const tagPrefix = workflow === 'developer' ? '개발자가 알아야 할 지식' : '오늘의 지식';
  return [
    '---',
    `title: ${yamlString(post.title)}`,
    `description: ${yamlString(post.description)}`,
    `pubDate: ${yamlString(date)}`,
    `sourceTitle: ${yamlString(post.sourceTitle)}`,
    `sourceUrl: ${yamlString(post.sourceUrl)}`,
    `sourceAuthor: ${yamlString(post.sourceAuthor)}`,
    `tags: [${[tagPrefix, ...post.tags].map(yamlString).join(', ')}]`,
    '---',
    '',
  ].join('\n');
}

function firstExistingForDate(prefix, date) {
  if (!existsSync(postDir)) return null;
  return readdirSync(postDir)
    .filter((name) => name.startsWith(`${prefix}-${date}-`) && name.endsWith('.md'))
    .sort()[0] ?? null;
}

function selectTopic(prefix, posts) {
  const existingNames = existsSync(postDir) ? readdirSync(postDir) : [];
  return posts.find((post) => !existingNames.some((name) => name.includes(`-${post.slug}.md`))) ?? posts[0];
}

function developerArticle(post) {
  return `${post.intro}

## 왜 개발자가 알아야 하나

${post.why.join('\n\n')}

## 핵심 개념

${post.concepts.join('\n\n')}

## 작은 예시 또는 체크리스트

${post.example}

${post.checklist.map((item) => `- ${item}`).join('\n')}

## 실무에서 자주 생기는 오해

${post.misconceptions.map((item) => `- ${item}`).join('\n\n')}

## 오늘 바로 적용해보기

${post.actions.join('\n\n')}

## 더 알아보기

${post.links.map((link) => `- [${link.title}](${link.url})`).join('\n')}

## 오늘의 takeaway

${post.takeaway}
`;
}

function knowledgeArticle(post) {
  return `${post.intro}

## 한 번에 이해하기

${post.explain.join('\n\n')}

## 왜 지금도 중요한가

${post.why.join('\n\n')}

## 작은 사례

${post.examples.join('\n\n')}

## 오해하기 쉬운 지점

${post.misconceptions.map((item) => `- ${item}`).join('\n\n')}

## 오늘 써먹는 법

${post.actions.map((item) => `- ${item}`).join('\n')}

## 더 알아보기

${post.links.map((link) => `- [${link.title}](${link.url})`).join('\n')}

## 오늘의 한 줄

${post.takeaway}
`;
}

const developerPosts = [
  {
    slug: 'graceful-degradation',
    title: '개발자가 알아야 할 지식: 그레이스풀 디그라데이션, 일부가 망가져도 서비스는 계속되어야 한다',
    description: '장애를 완전히 없앨 수 없을 때 핵심 기능부터 지키는 설계 원칙과 실무 체크리스트를 정리합니다.',
    sourceTitle: 'AWS Well-Architected Framework: Reliability pillar',
    sourceUrl: 'https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/welcome.html',
    sourceAuthor: 'Amazon Web Services',
    tags: ['Reliability', 'Architecture', 'Operations'],
    intro: '완벽히 안정적인 시스템은 없습니다. 그래서 좋은 시스템은 실패하지 않는 척하기보다, 실패했을 때 무엇을 계속 제공할지 미리 정합니다.',
    why: [
      '실무 서비스는 결제, 검색, 추천, 알림, 이미지 처리, 분석 로그처럼 서로 다른 중요도를 가진 기능으로 이루어집니다. 모든 기능이 같은 순간에 같은 수준으로 살아 있어야 한다고 가정하면 작은 장애도 전체 장애가 됩니다.',
      '그레이스풀 디그라데이션은 장애 상황에서 핵심 사용자 여정을 우선 지키는 사고방식입니다. 추천 서버가 느리면 기본 목록을 보여주고, 이미지 변환이 실패하면 원본 이미지를 보여주며, 분석 이벤트 전송이 막혀도 사용자의 저장 버튼은 동작하게 만드는 식입니다.',
      '이 개념은 운영팀만의 일이 아닙니다. 프론트엔드의 로딩 상태, 백엔드의 타임아웃, 데이터베이스의 fallback query, 배포 전략, 제품 요구사항 우선순위가 모두 연결됩니다. 개발자가 이 원칙을 모르면 장애를 “예외 상황”으로만 처리하고, 사용자가 실제로 겪는 실패 경험은 방치하기 쉽습니다.',
    ],
    concepts: [
      '핵심은 기능을 중요도에 따라 나누는 것입니다. 반드시 성공해야 하는 경로, 실패해도 대체 가능한 경로, 조용히 포기해도 되는 경로를 구분해야 합니다. 이 구분이 없으면 코드에서는 모든 예외가 같은 무게를 갖습니다.',
      '두 번째는 의존성의 실패 모드를 명시하는 것입니다. 외부 API가 느릴 때 기다릴지, 캐시를 쓸지, 빈 값을 반환할지, 사용자에게 재시도를 안내할지 정해야 합니다. 장애 대응은 런타임의 즉흥 판단이 아니라 설계의 결과여야 합니다.',
      '세 번째는 관측 가능성입니다. fallback이 동작했다고 해서 장애가 사라진 것은 아닙니다. 사용자는 큰 불편 없이 지나가더라도 시스템은 degraded 상태를 기록하고 알림을 보내야 합니다. 조용한 fallback만 있고 지표가 없으면 장애가 오래 숨어 있습니다.',
    ],
    example: '예를 들어 상품 상세 페이지가 가격, 재고, 추천, 리뷰, 배송 예상일을 각각 다른 서비스에서 가져온다고 해봅시다. 구매 버튼과 가격은 핵심이고, 추천 상품은 보조 기능입니다. 추천 API가 실패했을 때 전체 페이지를 500으로 만드는 것은 사용자의 구매 여정을 불필요하게 망가뜨립니다. 대신 추천 영역만 숨기고, 지표에는 추천 API fallback 발생률을 남기는 편이 낫습니다.',
    checklist: [
      '이 기능이 실패하면 사용자가 정말 작업을 완료할 수 없는가?',
      '외부 의존성이 느릴 때 전체 요청 타임아웃을 잡아먹지 않는가?',
      '캐시, 기본값, 이전 성공 결과처럼 쓸 수 있는 대체 경로가 있는가?',
      'fallback이 발생했음을 로그와 지표로 확인할 수 있는가?',
      'degraded 상태에서 사용자에게 보여줄 문구가 제품적으로 정리되어 있는가?',
      '테스트가 정상 경로뿐 아니라 의존성 실패 경로도 검증하는가?',
    ],
    misconceptions: [
      '“fallback이 있으면 장애가 아니다”는 오해가 있습니다. fallback은 사용자 피해를 줄이는 장치이지 원인 해결이 아닙니다. 발생률이 높아지면 반드시 알림과 후속 조치가 필요합니다.',
      '“아무 값이나 기본값으로 주면 된다”도 위험합니다. 가격, 권한, 결제, 의료 정보처럼 틀린 값이 빈 값보다 더 해로운 영역이 있습니다. 이런 곳에서는 실패를 숨기지 말고 안전하게 막아야 합니다.',
      '“프론트에서 예쁘게 처리하면 된다”는 생각도 절반만 맞습니다. 화면은 부드러워 보여도 서버가 계속 느린 의존성을 기다리면 비용과 지연은 그대로 쌓입니다. 타임아웃과 회로 차단 같은 백엔드 정책이 함께 필요합니다.',
      '“나중에 장애가 나면 붙이자”는 접근은 늦습니다. 장애가 난 뒤에는 어떤 기능을 희생해도 되는지 제품 판단을 차분히 하기 어렵습니다. 중요한 경로일수록 설계 단계에서 degraded mode를 정해야 합니다.',
    ],
    actions: [
      '오늘 코드 리뷰에서 외부 API 호출 하나를 골라 “이 호출이 실패하면 사용자는 무엇을 보게 되는가”를 물어보세요. 답이 “전체 실패”라면 정말 그래야 하는 기능인지 다시 나눠볼 수 있습니다.',
      '운영 대시보드에는 성공률뿐 아니라 fallback 발생률을 추가해보세요. 정상 응답 200만 보면 서비스가 괜찮아 보여도, 실제로는 보조 기능이 계속 빠지고 있을 수 있습니다.',
      '제품 문서에는 핵심 기능과 보조 기능을 구분해두세요. 기술적인 장애 대응처럼 보여도 결국 어떤 사용자 경험을 지킬지의 문제입니다.',
    ],
    links: [
      { title: 'AWS Reliability Pillar', url: 'https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/welcome.html' },
      { title: 'Microsoft Azure: Design for self healing', url: 'https://learn.microsoft.com/en-us/azure/well-architected/reliability/self-healing' },
      { title: 'Google SRE Book: Addressing Cascading Failures', url: 'https://sre.google/sre-book/addressing-cascading-failures/' },
    ],
    takeaway: '좋은 장애 대응은 모든 것을 살리는 기술이 아니라, 망가진 순간에도 무엇을 반드시 살릴지 미리 정해두는 설계입니다.',
  },
  {
    slug: 'golden-signals',
    title: '개발자가 알아야 할 지식: 골든 시그널, 서비스 상태를 네 가지 질문으로 보는 법',
    description: '지연 시간, 트래픽, 오류, 포화도를 중심으로 운영 지표를 단순하고 실용적으로 잡는 방법을 정리합니다.',
    sourceTitle: 'Site Reliability Engineering: Monitoring Distributed Systems',
    sourceUrl: 'https://sre.google/sre-book/monitoring-distributed-systems/',
    sourceAuthor: 'Google SRE',
    tags: ['Observability', 'SRE', 'Monitoring'],
    intro: '모니터링은 지표를 많이 모으는 일이 아니라, 문제가 생겼을 때 무엇을 먼저 볼지 정하는 일입니다.',
    why: [
      '서비스가 커질수록 대시보드는 쉽게 복잡해집니다. CPU, 메모리, GC, 큐 길이, DB 커넥션, 캐시 hit rate, 네트워크 재전송률까지 모두 중요해 보입니다. 하지만 장애 순간에 모든 그래프를 동시에 읽을 수는 없습니다.',
      'Google SRE 책에서 말하는 네 가지 골든 시그널은 이 혼란을 줄이는 출발점입니다. 사용자가 얼마나 요청하는지, 얼마나 느린지, 얼마나 실패하는지, 시스템이 얼마나 꽉 찼는지를 먼저 봅니다.',
      '개발자가 이 기준을 알면 기능을 만들 때부터 운영 가능한 형태로 계측할 수 있습니다. “로그 남겼으니 됐다”가 아니라, 사용자의 경험과 시스템 한계를 보여주는 지표를 남기는 습관이 생깁니다.',
    ],
    concepts: [
      'Latency는 요청이 완료되기까지 걸린 시간입니다. 평균보다 p95, p99 같은 상위 백분위가 중요할 때가 많습니다. 대부분의 사용자는 평균 사용자가 아니고, 느린 꼬리 지연이 실제 체감을 망칩니다.',
      'Traffic은 시스템이 받는 수요입니다. HTTP 요청 수, 작업 큐 처리량, 초당 메시지 수, 활성 사용자 수처럼 서비스 성격에 맞게 정의합니다. 트래픽을 모르면 오류율과 지연 시간의 의미도 흐려집니다.',
      'Errors는 실패한 요청의 비율이나 수입니다. HTTP 500만 오류가 아닙니다. timeout, 잘못된 fallback, 결제 거절, background job 실패처럼 사용자 목표가 실패한 사건을 서비스 기준으로 정의해야 합니다.',
      'Saturation은 시스템이 얼마나 한계에 가까운지 보여줍니다. CPU 90% 자체보다 큐가 계속 쌓이는지, connection pool이 고갈되는지, 디스크 I/O가 밀리는지가 더 직접적인 신호일 수 있습니다.',
    ],
    example: '새 API를 배포한다면 최소한 endpoint별 요청 수, 상태 코드별 오류율, p50/p95/p99 지연 시간, 주요 의존성 timeout 수를 남겨야 합니다. 큐 기반 작업이라면 처리량, 실패율, 처리 지연, 큐 backlog가 첫 화면에 있어야 합니다.',
    checklist: [
      '이 기능의 사용자 성공과 실패를 지표로 구분할 수 있는가?',
      '평균 지연 시간만 보고 꼬리 지연을 놓치고 있지 않은가?',
      '트래픽 급증과 오류 증가를 같은 시간축에서 볼 수 있는가?',
      '시스템 한계가 CPU가 아니라 큐, DB, 외부 API일 가능성을 보고 있는가?',
      '알림은 원인 후보가 아니라 사용자 영향에 가까운 지표에서 울리는가?',
    ],
    misconceptions: [
      '“CPU가 낮으니 괜찮다”는 판단은 위험합니다. 서비스는 CPU보다 DB 락, 외부 API, 큐 backlog, connection pool 때문에 먼저 막힐 수 있습니다.',
      '“로그가 많으면 나중에 보면 된다”는 생각도 부족합니다. 장애 대응의 첫 5분에는 검색보다 대시보드의 방향성이 중요합니다.',
      '“오류율 0%면 정상이다”도 아닙니다. timeout 전에 사용자가 이탈하거나, fallback만 계속 제공되거나, 비동기 작업이 뒤에서 실패하면 성공 응답만으로는 알 수 없습니다.',
      '“모든 지표에 알림을 걸자”는 접근은 알림 피로를 만듭니다. 사용자의 실제 영향과 가까운 소수의 신호에서 시작하고, 원인 분석용 지표는 대시보드에 두는 편이 낫습니다.',
    ],
    actions: [
      '운영 중인 서비스 하나를 골라 네 가지 질문으로 대시보드를 다시 그려보세요. 얼마나 들어오는가, 얼마나 느린가, 얼마나 실패하는가, 어디가 꽉 차는가입니다.',
      '새 기능을 만들 때는 구현 완료 조건에 지표를 포함하세요. API가 동작하는 것과 운영 가능한 것은 다릅니다.',
      '알림을 정리할 때는 “이 알림을 받으면 사용자가 어떤 피해를 보는가”를 기준으로 남기세요. 설명할 수 없는 알림은 대개 조정이 필요합니다.',
    ],
    links: [
      { title: 'Google SRE Book: Monitoring Distributed Systems', url: 'https://sre.google/sre-book/monitoring-distributed-systems/' },
      { title: 'Google SRE Workbook: Alerting on SLOs', url: 'https://sre.google/workbook/alerting-on-slos/' },
      { title: 'OpenTelemetry Documentation', url: 'https://opentelemetry.io/docs/' },
    ],
    takeaway: '대시보드가 복잡해질수록 먼저 볼 것은 네 가지입니다. 얼마나 들어오고, 얼마나 느리고, 얼마나 실패하고, 얼마나 꽉 찼는가.',
  },
  {
    slug: 'content-negotiation',
    title: '개발자가 알아야 할 지식: 콘텐츠 협상, 같은 URL이 다른 표현을 돌려주는 방식',
    description: 'HTTP Accept 헤더와 콘텐츠 협상이 API 호환성, 캐싱, 오류 처리에 주는 영향을 정리합니다.',
    sourceTitle: 'RFC 9110: HTTP Semantics',
    sourceUrl: 'https://www.rfc-editor.org/rfc/rfc9110.html',
    sourceAuthor: 'IETF',
    tags: ['HTTP', 'API Design', 'Web'],
    intro: 'API가 JSON만 돌려준다고 생각하기 쉽지만, HTTP는 처음부터 같은 리소스를 여러 표현으로 주고받을 수 있게 설계되었습니다.',
    why: [
      '웹 서비스는 브라우저, 모바일 앱, CLI, 서버 간 호출처럼 서로 다른 클라이언트를 상대합니다. 같은 데이터라도 JSON, HTML, CSV, 이미지 포맷처럼 필요한 표현이 달라질 수 있습니다.',
      '콘텐츠 협상은 클라이언트가 원하는 표현을 헤더로 알리고 서버가 가능한 표현을 고르는 HTTP 메커니즘입니다. 가장 흔한 예는 `Accept: application/json`이고, 언어는 `Accept-Language`, 압축은 `Accept-Encoding`과 연결됩니다.',
      '이 개념을 모르면 API 버전 관리, 캐시 키, 오류 응답 형식에서 미묘한 버그가 생깁니다. 특히 CDN이나 프록시가 끼면 `Vary` 헤더를 제대로 다루지 않은 콘텐츠 협상은 다른 사용자에게 잘못된 표현을 전달할 수 있습니다.',
    ],
    concepts: [
      'HTTP에서 리소스와 표현은 다릅니다. `/reports/123`이라는 리소스는 HTML 페이지로도, JSON 문서로도, CSV 다운로드로도 표현될 수 있습니다. URL이 같다고 바이트까지 같아야 하는 것은 아닙니다.',
      '`Accept` 헤더는 클라이언트가 처리할 수 있는 미디어 타입을 서버에 알려줍니다. 서버는 그중 가능한 것을 선택해 `Content-Type`으로 실제 응답 형식을 명시합니다.',
      '`Vary` 헤더는 캐시에게 어떤 요청 헤더가 응답 선택에 영향을 주었는지 알려줍니다. `Accept-Language`에 따라 응답이 달라진다면 캐시는 언어별로 별도 응답을 보관해야 합니다.',
    ],
    example: '예를 들어 `/profile`이 브라우저에는 HTML을, 앱에는 JSON을 반환한다고 합시다. 서버가 `Accept`를 보고 응답을 바꾸면서 `Vary: Accept`를 주지 않으면 중간 캐시가 HTML 응답을 JSON을 기대한 앱에 전달할 수 있습니다.',
    checklist: [
      '응답 형식이 요청 헤더에 따라 달라지는가?',
      '그렇다면 `Content-Type`이 항상 정확히 설정되는가?',
      '`Vary` 헤더가 캐시 키에 필요한 요청 헤더를 포함하는가?',
      '지원하지 않는 미디어 타입에는 일관된 406 또는 fallback 정책이 있는가?',
      '오류 응답도 정상 응답과 같은 협상 규칙을 따르는가?',
    ],
    misconceptions: [
      '“REST API는 URL을 나누면 되니 협상이 필요 없다”는 말은 상황에 따라 맞습니다. `/report.csv`처럼 명시적 URL이 더 단순할 때도 많지만, 헤더 기반 협상을 쓰는 순간 캐시와 문서화까지 같이 설계해야 합니다.',
      '“JSON만 쓰면 신경 쓸 필요 없다”도 완전히 맞지 않습니다. 클라이언트가 엉뚱한 `Accept`를 보내거나 서버가 오류 페이지를 HTML로 돌려주면 SDK와 앱이 깨질 수 있습니다.',
      '“Content-Type은 대충 application/json이면 된다”는 습관은 장기 호환성을 해칩니다. 버전이 들어간 vendor media type이나 charset 정책을 쓰는 팀이라면 더 엄격해야 합니다.',
      '“브라우저에서 되면 API도 된다”는 판단도 위험합니다. 브라우저는 넓은 Accept 헤더와 관대한 파싱을 갖지만 서버 간 클라이언트는 훨씬 엄격할 수 있습니다.',
    ],
    actions: [
      'API 하나를 골라 요청의 `Accept`와 응답의 `Content-Type`을 실제로 확인해보세요. 문서와 구현이 다르면 클라이언트 버그의 씨앗입니다.',
      'CDN을 쓰는 엔드포인트에서 `Vary` 헤더를 점검하세요. 언어, 인코딩, 미디어 타입에 따라 응답이 달라지는데 캐시 키가 같으면 문제가 됩니다.',
      '오류 응답도 JSON API에서는 JSON으로 내려가도록 테스트를 추가하세요. 장애 순간에 HTML 에러 페이지가 SDK를 깨뜨리는 경우가 생각보다 많습니다.',
    ],
    links: [
      { title: 'RFC 9110: HTTP Semantics', url: 'https://www.rfc-editor.org/rfc/rfc9110.html' },
      { title: 'MDN: Content negotiation', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Content_negotiation' },
      { title: 'MDN: Vary header', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Vary' },
    ],
    takeaway: '같은 URL이 항상 같은 바이트를 뜻하지는 않습니다. 요청 헤더가 응답을 바꾼다면 캐시와 오류 응답까지 함께 설계해야 합니다.',
  },
];

const knowledgePosts = [
  {
    slug: 'observer-effect',
    title: '오늘의 지식: 관찰자 효과, 측정하는 순간 대상도 달라진다',
    description: '물리학에서 출발해 조직, 제품, 데이터 분석까지 이어지는 관찰자 효과의 의미를 정리합니다.',
    sourceTitle: 'Encyclopaedia Britannica: observer effect',
    sourceUrl: 'https://www.britannica.com/science/observer-effect',
    sourceAuthor: 'Encyclopaedia Britannica',
    tags: ['Science', 'Psychology', 'Data'],
    intro: '무언가를 관찰한다는 행위는 대상을 있는 그대로 보는 일처럼 느껴집니다. 하지만 때로는 보는 순간 대상이 바뀝니다.',
    explain: [
      '관찰자 효과는 관찰이나 측정 행위가 관찰 대상의 상태나 행동에 영향을 주는 현상을 말합니다. 물리학에서는 측정 장치가 미시 세계의 상태에 영향을 줄 수 있다는 맥락에서 이야기되고, 사회과학에서는 사람이 관찰받는다는 사실 때문에 행동을 바꾸는 현상으로 확장되어 쓰입니다.',
      '중요한 점은 “관찰은 언제나 나쁘다”가 아닙니다. 관찰 없이는 배울 수 없습니다. 다만 관찰 결과를 해석할 때, 우리가 사용한 측정 방법이 결과를 바꾸었을 가능성을 함께 봐야 한다는 뜻입니다.',
      '이 개념은 호손 효과와도 닿아 있습니다. 직원들이 연구 대상이 되었다는 사실만으로 업무 태도가 달라질 수 있고, 제품 지표를 공개하면 팀이 그 지표를 최적화하도록 행동이 바뀔 수 있습니다.',
    ],
    why: [
      '현대 사회는 측정으로 움직입니다. 앱은 클릭과 체류 시간을 측정하고, 회사는 KPI를 측정하고, 학교는 시험 점수를 측정합니다. 측정은 방향을 만들지만 동시에 행동을 바꿉니다.',
      '예를 들어 고객지원팀에 “처리 건수”만 강조하면 상담원은 빠르게 닫을 수 있는 티켓을 선호할 수 있습니다. “평균 응답 시간”만 보면 어려운 문제를 깊게 해결하는 행동이 불리해질 수 있습니다.',
      '관찰자 효과를 이해하면 지표를 더 겸손하게 다룰 수 있습니다. 숫자는 현실의 사진이 아니라, 측정 장치와 현실이 만난 결과입니다.',
    ],
    examples: [
      '제품팀이 새 기능의 클릭률을 크게 보여주는 대시보드를 만들면 팀은 자연스럽게 클릭률을 올리는 문구와 배치를 찾습니다. 이것이 반드시 나쁜 것은 아니지만, 장기 만족도나 신뢰를 해치면서 클릭만 늘릴 수도 있습니다.',
      '학생에게 시험 범위와 채점 기준을 알려주면 학습 방향이 바뀝니다. 좋은 기준은 더 깊은 학습을 유도하지만, 좁은 기준은 암기와 요령을 강화합니다.',
      '운동량을 기록하는 사람은 기록 자체 때문에 더 걷게 됩니다. 이 경우 관찰자 효과는 오히려 원하는 행동 변화를 만드는 도구가 됩니다.',
    ],
    misconceptions: [
      '관찰자 효과는 “모든 데이터가 쓸모없다”는 뜻이 아닙니다. 데이터는 여전히 필요합니다. 다만 데이터가 만들어진 조건을 함께 읽어야 합니다.',
      '이 효과는 양자역학에만 갇힌 개념도 아닙니다. 사람과 조직이 포함된 시스템에서는 관찰받는다는 사실이 특히 강한 피드백이 됩니다.',
      '측정을 숨기면 해결된다는 뜻도 아닙니다. 숨겨진 측정은 신뢰를 잃게 만들 수 있습니다. 더 좋은 방법은 측정 목적과 한계를 분명히 하는 것입니다.',
    ],
    actions: [
      '어떤 지표를 볼 때 “이 지표가 공개되면서 사람들의 행동이 어떻게 바뀌었을까”를 함께 물어보세요.',
      '한 가지 숫자만 보지 말고 보완 지표를 같이 두세요. 속도를 보면 품질도 보고, 클릭을 보면 만족도도 봐야 합니다.',
      '측정을 설계할 때는 원하는 행동과 원치 않는 부작용을 같이 적어보세요.',
    ],
    links: [
      { title: 'Britannica: observer effect', url: 'https://www.britannica.com/science/observer-effect' },
      { title: 'Wikipedia: Observer effect', url: 'https://en.wikipedia.org/wiki/Observer_effect' },
      { title: 'HBS Baker Library: Hawthorne Experiments', url: 'https://www.library.hbs.edu/hc/hawthorne/' },
    ],
    takeaway: '측정은 현실을 보여주지만, 동시에 현실을 조금 바꿉니다.',
  },
  {
    slug: 'map-territory',
    title: '오늘의 지식: 지도와 영토, 모델은 현실이 아니다',
    description: '알프레드 코르지브스키의 유명한 문장을 통해 모델, 지표, 설명의 한계를 이해합니다.',
    sourceTitle: 'Encyclopaedia Britannica: Alfred Korzybski',
    sourceUrl: 'https://www.britannica.com/biography/Alfred-Korzybski',
    sourceAuthor: 'Encyclopaedia Britannica',
    tags: ['Philosophy', 'Thinking', 'Models'],
    intro: '“지도는 영토가 아니다”라는 말은 단순한 비유처럼 보이지만, 현대의 데이터와 모델 중심 사회에서 점점 더 중요해지는 경고입니다.',
    explain: [
      '지도는 현실을 압축한 표현입니다. 길, 거리, 경계, 이름을 보여주지만 냄새, 소음, 경사, 위험, 분위기를 모두 담지는 못합니다. 좋은 지도는 목적에 맞는 정보를 남기고 나머지는 버립니다.',
      '문제는 우리가 종종 지도를 현실 자체로 착각한다는 데 있습니다. 점수, 등급, 차트, 예측 모델, 조직도, 로드맵은 모두 현실을 이해하기 위한 도구지만 현실의 전부는 아닙니다.',
      '이 문장은 폴란드계 미국 사상가 알프레드 코르지브스키와 연결되어 널리 알려졌습니다. 핵심은 인간의 언어와 추상화가 유용하지만 언제나 불완전하다는 사실입니다.',
    ],
    why: [
      '오늘날 우리는 수많은 지도를 봅니다. 내비게이션 지도뿐 아니라 KPI 대시보드, 신용 점수, 추천 알고리즘, 조직 평가표, 시장 리포트가 모두 현실의 일부를 압축합니다.',
      '지도는 행동을 쉽게 만듭니다. 하지만 지도에 없는 것을 없다고 생각하면 판단이 좁아집니다. 매출 그래프에는 고객의 짜증이 바로 보이지 않고, 시험 점수에는 호기심이 다 담기지 않습니다.',
      '좋은 판단은 지도를 버리는 것이 아니라, 어떤 지도인지 아는 데서 시작합니다. 축척이 무엇인지, 생략된 것은 무엇인지, 만든 사람의 목적은 무엇인지 봐야 합니다.',
    ],
    examples: [
      '도시 지하철 노선도는 실제 지리와 다르게 그려집니다. 목적은 정확한 거리 표시가 아니라 환승과 노선 이해입니다. 걷는 시간을 예측하려면 다른 지도가 필요합니다.',
      '회사 대시보드에서 활성 사용자 수가 늘어도 사용자 만족이 늘었다고 단정할 수 없습니다. 어떤 행동을 활성으로 셌는지, 봇이나 일회성 방문은 빠졌는지 확인해야 합니다.',
      'AI 모델의 벤치마크 점수도 지도입니다. 실제 업무의 맥락, 비용, 안정성, 사용자 신뢰를 모두 담지는 못합니다.',
    ],
    misconceptions: [
      '“지도는 틀렸으니 보지 말자”는 결론은 아닙니다. 지도 없이 움직이면 더 위험합니다. 필요한 것은 지도와 현실 사이의 거리를 기억하는 태도입니다.',
      '정교한 모델일수록 현실과 같다는 착각도 위험합니다. 복잡한 모델은 더 많은 정보를 담을 수 있지만, 여전히 선택과 생략의 결과입니다.',
      '경험만 믿자는 뜻도 아닙니다. 개인 경험 역시 작은 지도입니다. 좋은 판단은 여러 지도를 겹쳐 보고 실제 영토와 계속 대조하는 데서 나옵니다.',
    ],
    actions: [
      '중요한 숫자를 볼 때 그 숫자가 현실의 어떤 부분을 생략했는지 적어보세요.',
      '하나의 대시보드나 리포트만 보지 말고 다른 관점의 자료를 하나 더 붙이세요.',
      '모델이 틀렸을 때의 비용을 생각해보고, 되돌릴 수 없는 결정에는 현장 확인을 추가하세요.',
    ],
    links: [
      { title: 'Britannica: Alfred Korzybski', url: 'https://www.britannica.com/biography/Alfred-Korzybski' },
      { title: 'Wikipedia: Map-territory relation', url: 'https://en.wikipedia.org/wiki/Map%E2%80%93territory_relation' },
      { title: 'Library of Congress: Sanborn Maps', url: 'https://www.loc.gov/collections/sanborn-maps/' },
    ],
    takeaway: '좋은 지도는 현실을 대신하지 않습니다. 현실로 돌아갈 길을 더 잘 알려줄 뿐입니다.',
  },
];

const workflows = {
  developer: {
    prefix: 'developer-knowledge',
    commit: (date) => `blog: publish developer knowledge digest ${date}`,
    article: developerArticle,
    posts: developerPosts,
  },
  knowledge: {
    prefix: 'knowledge',
    commit: (date) => `blog: publish daily knowledge digest ${date}`,
    article: knowledgeArticle,
    posts: knowledgePosts,
  },
};

const workflowName = argValue('--workflow', 'developer');
const workflow = workflows[workflowName];
if (!workflow) {
  throw new Error(`Unknown workflow: ${workflowName}`);
}

const date = argValue('--date', todayInSeoul());
mkdirSync(outputDir, { recursive: true });
mkdirSync(postDir, { recursive: true });

if (!hasFlag('--skip-pull')) {
  run('git', ['pull', '--ff-only', 'origin', 'main']);
}

let filename = firstExistingForDate(workflow.prefix, date);
let created = false;
if (!filename) {
  const post = selectTopic(workflow.prefix, workflow.posts);
  filename = `${workflow.prefix}-${date}-${post.slug}.md`;
  const content = `${frontmatter(post, date, workflowName)}${workflow.article(post)}`;
  writeFileSync(join(postDir, filename), content);
  created = true;
}

run('npm', ['run', 'build']);

const status = run('git', ['status', '--short']).trim();
let commit = 'no new commit';
if (status) {
  run('git', ['add', join('src/content/medium-digest', filename)]);
  const commitOutput = run('git', ['commit', '-m', workflow.commit(date)]);
  commit = commitOutput.match(/\[[^\]]+\s+([a-f0-9]+)\]/)?.[1] ?? 'committed';
}

run('git', ['push', 'origin', 'HEAD']);

const fileContent = readFileSync(join(postDir, filename), 'utf8');
const title = fileContent.match(/^title:\s+"(.+)"$/m)?.[1]?.replaceAll('\\"', '"') ?? filename;
const sourceUrl = fileContent.match(/^sourceUrl:\s+"(.+)"$/m)?.[1] ?? '';
const slug = filename.replace(/\.md$/, '');
let publicStatus = 'not checked';
try {
  const response = spawnSync('curl', ['-L', '-s', '-o', '/dev/null', '-w', '%{http_code}', `https://blog.kokomasoft.com/${slug}/`], {
    cwd: repoRoot,
    encoding: 'utf8',
    timeout: 20000,
  });
  publicStatus = response.stdout?.trim() || 'unknown';
} catch {
  publicStatus = 'check failed';
}

console.log([
  created ? '발행 생성 완료' : '기존 글 검증 완료',
  `제목: ${title}`,
  `URL: https://blog.kokomasoft.com/${slug}/`,
  `주요 참고: ${sourceUrl}`,
  `빌드: 통과`,
  `커밋/푸시: ${commit}, origin HEAD push 완료`,
  `공개 URL HTTP 상태: ${publicStatus}`,
].join('\n'));
