#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';

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

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) throw new Error('frontmatter block is missing');
  const data = {};
  for (const line of match[1].split('\n')) {
    const field = line.match(/^([A-Za-z][A-Za-z0-9]*):\s*(.*)$/);
    if (!field) continue;
    data[field[1]] = field[2].replace(/^"|"$/g, '').replace(/^'|'$/g, '');
  }
  return data;
}

function stripFrontmatter(content) {
  return content.replace(/^---\n[\s\S]*?\n---\n?/, '').trim();
}

function frontmatter(post, date, workflow) {
  const tagPrefix = workflow === 'developer' ? '개발자가 알아야 할 지식' : '오늘의 지식';
  return [
    '---',
    `title: ${yamlString(post.title)}`,
    `canonicalSlug: ${yamlString(`${tagPrefix === '개발자가 알아야 할 지식' ? 'developer-knowledge' : 'knowledge'}-${date}-${post.slug}`)}`,
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

function selectTopic(prefix, posts, workflowName) {
  const existingPosts = readExistingPosts(prefix);
  const candidate = [...posts, ...fallbackPostsForWorkflow(workflowName)].find((post) => !isDuplicateTopic(post, existingPosts));
  if (!candidate) {
    const used = existingPosts.map((post) => post.slug ?? post.title).filter(Boolean).join(', ');
    throw new Error(`no unused ${prefix} topic remains after curated and fallback pools. Used: ${used}`);
  }
  return candidate;
}

function fallbackPostsForWorkflow(workflowName) {
  return workflowName === 'developer' ? fallbackDeveloperPosts : fallbackKnowledgePosts;
}

function readExistingPosts(prefix) {
  if (!existsSync(postDir)) return [];
  return readdirSync(postDir)
    .filter((name) => name.startsWith(`${prefix}-`) && name.endsWith('.md'))
    .map((name) => {
      const content = readFileSync(join(postDir, name), 'utf8');
      const data = parseFrontmatter(content);
      return {
        file: name,
        title: data.title,
        description: data.description,
        sourceTitle: data.sourceTitle,
        sourceUrl: data.sourceUrl,
        slug: slugFromFilename(name, prefix),
        tokens: topicTokens(`${data.title} ${data.description} ${data.sourceTitle} ${stripFrontmatter(content).slice(0, 2200)}`),
      };
    });
}

function slugFromFilename(name, prefix) {
  const match = name.match(new RegExp(`^${prefix}-\\d{4}-\\d{2}-\\d{2}-(.+)\\.md$`));
  return match?.[1] ?? null;
}

function isDuplicateTopic(post, existingPosts, currentFile = null) {
  const candidateTokens = topicTokens(`${post.title} ${post.description} ${post.sourceTitle}`);
  return existingPosts.some((existing) => {
    if (existing.file === currentFile) return false;
    if (existing.slug && existing.slug === post.slug) return true;
    if (existing.title && existing.title === post.title) return true;
    if (existing.sourceUrl && existing.sourceUrl === post.sourceUrl) return true;
    return jaccard(candidateTokens, existing.tokens) >= 0.42;
  });
}

function validateNoDuplicateCuratedPost(filePath, prefix) {
  const currentName = basename(filePath);
  const content = readFileSync(filePath, 'utf8');
  const data = parseFrontmatter(content);
  const post = {
    slug: slugFromFilename(currentName, prefix),
    title: data.title,
    description: data.description,
    sourceTitle: data.sourceTitle,
    sourceUrl: data.sourceUrl,
  };
  const duplicate = readExistingPosts(prefix).find((existing) => {
    if (existing.file === currentName) return false;
    if (existing.title && existing.title === post.title) return true;
    if (existing.sourceUrl && existing.sourceUrl === post.sourceUrl) return true;
    const currentTokens = topicTokens(`${data.title} ${data.description} ${data.sourceTitle} ${stripFrontmatter(content).slice(0, 2200)}`);
    return jaccard(currentTokens, existing.tokens) >= 0.42;
  });
  if (duplicate) {
    throw new Error(`${currentName} duplicates or is too similar to ${duplicate.file}`);
  }
}

function topicTokens(value) {
  const stopwords = new Set([
    'the', 'and', 'for', 'with', 'from', 'that', 'this', 'your', 'you', 'are', 'was', 'were', 'have', 'has',
    'into', 'what', 'why', 'how', 'when', 'will', 'can', 'all', 'about', 'after', 'before', 'today',
    '오늘의', '지식', '개발자가', '알아야', '중요한', '실무', '서비스', '사용자', '시스템', '정리합니다',
    '것입니다', '있습니다', '합니다', '됩니다', '때문입니다', '개념', '방법', '체크리스트',
  ]);
  return new Set(
    String(value)
      .toLowerCase()
      .replace(/<[^>]+>/g, ' ')
      .replace(/[^a-z0-9가-힣]+/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length >= 3 && !stopwords.has(word))
      .slice(0, 140),
  );
}

function jaccard(a, b) {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) intersection += 1;
  }
  return intersection / (a.size + b.size - intersection);
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
    slug: 'rate-limiting',
    title: '개발자가 알아야 할 지식: 레이트 리미팅, 친절한 거절도 시스템 설계다',
    description: '트래픽 폭주와 남용을 막기 위한 rate limit 설계 원칙, 429 응답, Retry-After, 사용자 경험을 정리합니다.',
    sourceTitle: 'RFC 6585: Additional HTTP Status Codes',
    sourceUrl: 'https://www.rfc-editor.org/rfc/rfc6585.html',
    sourceAuthor: 'IETF',
    tags: ['HTTP', 'Reliability', 'API Design'],
    intro: '서비스를 안정적으로 운영하려면 모든 요청을 끝까지 받아주는 것만큼, 일부 요청을 제때 거절하는 능력도 중요합니다.',
    why: [
      '레이트 리미팅은 일정 시간 동안 허용할 요청 수를 제한하는 기법입니다. 로그인 시도, 검색 API, 파일 업로드, 메시지 발송, 결제 검증, AI 추론 호출처럼 비용이 크거나 남용될 수 있는 기능에서 특히 중요합니다.',
      '개발자가 이 개념을 알아야 하는 이유는 레이트 리밋이 단순한 방화벽 설정이 아니기 때문입니다. 어디를 기준으로 제한할지, 초과했을 때 어떤 응답을 줄지, 정상 사용자와 공격자를 어떻게 구분할지, 클라이언트가 언제 재시도해야 할지까지 제품과 API 계약이 함께 걸려 있습니다.',
      '제한이 없으면 작은 버그도 장애가 됩니다. 모바일 앱의 자동 재시도 루프, 배치 작업의 잘못된 스케줄, 봇의 반복 요청, 외부 파트너의 급격한 트래픽 증가가 모두 같은 하위 시스템을 압박할 수 있습니다. 좋은 레이트 리밋은 시스템을 보호하면서도 정상 사용자가 무엇을 해야 하는지 알게 해줍니다.',
    ],
    concepts: [
      '첫 번째 결정은 기준입니다. IP 주소, 사용자 ID, API 키, 조직 ID, 디바이스, 엔드포인트, 비용 단위 중 무엇으로 제한할지 정해야 합니다. 로그인 실패는 계정과 IP를 함께 봐야 하고, 유료 API는 고객 조직이나 API 키 단위가 더 자연스러울 수 있습니다.',
      '두 번째는 알고리즘입니다. 고정 윈도우는 단순하지만 경계 시점에 요청이 몰릴 수 있습니다. 슬라이딩 윈도우는 더 부드럽지만 구현 비용이 있습니다. 토큰 버킷은 평소에는 토큰을 채우고 순간적인 burst를 일정 부분 허용할 수 있어 API에서 자주 쓰입니다.',
      '세 번째는 응답 계약입니다. HTTP에서는 너무 많은 요청을 의미하는 `429 Too Many Requests`가 쓰입니다. 가능하면 `Retry-After` 헤더나 남은 한도 정보를 함께 제공해 클라이언트가 무작정 재시도하지 않게 해야 합니다. 제한은 서버 내부 사정이 아니라 클라이언트와 맺는 계약입니다.',
    ],
    example: '예를 들어 이미지 생성 API가 있다고 합시다. 요청 하나가 비싸고 처리 시간이 길다면 사용자별 분당 요청 수, 조직별 일일 총량, 동시 실행 수를 따로 제한할 수 있습니다. 초과 시에는 `429`와 함께 “몇 초 뒤 다시 시도하라”는 정보를 주고, UI는 버튼을 잠시 비활성화하거나 대기열 상태를 보여주는 편이 낫습니다.',
    checklist: [
      '제한 기준이 IP 하나에만 묶여 있어 공유 네트워크 사용자를 과하게 막고 있지 않은가?',
      '로그인, 검색, 업로드, 알림 발송처럼 비용과 남용 위험이 큰 경로에 별도 정책이 있는가?',
      '초과 응답이 `429`와 재시도 힌트를 명확히 제공하는가?',
      '클라이언트가 `429`를 받았을 때 즉시 반복 재시도하지 않는가?',
      '운영자가 한도 초과율, 차단 대상, 상위 호출자를 볼 수 있는가?',
      '유료 플랜, 내부 관리자, 파트너 API처럼 서로 다른 사용량 정책이 코드에 명확히 표현되어 있는가?',
    ],
    misconceptions: [
      '“CDN이나 WAF에서 막으면 끝난다”는 오해가 있습니다. 엣지 제한은 중요하지만 사용자 ID, 조직 ID, 기능별 비용처럼 애플리케이션만 아는 기준도 있습니다.',
      '“429는 장애다”라고만 보는 것도 부족합니다. 정상적으로 설계된 제한은 장애가 아니라 보호 장치입니다. 다만 한도 초과가 급증하면 사용자 경험 문제나 클라이언트 버그를 의심해야 합니다.',
      '“강하게 막을수록 안전하다”도 항상 맞지 않습니다. 너무 낮은 한도는 정상 사용자를 밀어내고, 너무 불친절한 응답은 클라이언트의 공격적인 재시도를 부릅니다.',
      '“읽기 요청은 제한하지 않아도 된다”는 생각도 위험합니다. 검색, 추천, 리포트, AI 요약처럼 읽기라도 계산 비용이 큰 요청은 충분히 시스템을 무너뜨릴 수 있습니다.',
    ],
    actions: [
      '먼저 최근 장애나 느린 API 하나를 골라 호출자별 요청 분포를 확인해보세요. 평균 요청 수보다 상위 1% 호출자가 시스템에 주는 압박을 보는 것이 중요합니다.',
      '다음으로 `429` 응답을 클라이언트가 어떻게 처리하는지 확인하세요. 웹, 앱, 배치, 파트너 SDK가 같은 방식으로 재시도하지 않을 수 있습니다. 특히 즉시 재시도 루프가 있으면 레이트 리밋이 오히려 부하 증폭기가 됩니다.',
      '마지막으로 한도 정책을 문서화하세요. 어떤 기준으로, 어느 시간 창에서, 초과 시 어떤 응답을 주는지 적어두면 운영자와 클라이언트 개발자가 같은 계약을 보고 움직일 수 있습니다.',
    ],
    links: [
      { title: 'RFC 6585: Additional HTTP Status Codes', url: 'https://www.rfc-editor.org/rfc/rfc6585.html' },
      { title: 'MDN: 429 Too Many Requests', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/429' },
      { title: 'Cloudflare: Rate limiting rules', url: 'https://developers.cloudflare.com/waf/rate-limiting-rules/' },
    ],
    takeaway: '좋은 레이트 리밋은 사용자를 막는 장벽이 아니라, 시스템이 모두에게 계속 응답하기 위한 질서입니다.',
  },
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
  {
    slug: 'structured-logging',
    title: '개발자가 알아야 할 지식: 구조화 로그, 검색 가능한 사건 기록을 남기는 법',
    description: '문자열 로그의 한계를 넘어서 JSON 필드, correlation ID, 로그 레벨을 운영 가능한 형태로 설계하는 방법을 정리합니다.',
    sourceTitle: 'OpenTelemetry Documentation: Logs',
    sourceUrl: 'https://opentelemetry.io/docs/concepts/signals/logs/',
    sourceAuthor: 'OpenTelemetry',
    tags: ['Observability', 'Logging', 'Operations'],
    intro: '로그는 장애가 난 뒤에 읽는 일기가 아니라, 시스템이 남기는 사건 기록입니다. 기록이 구조화되어 있으면 검색과 집계가 훨씬 쉬워집니다.',
    why: [
      '문자열 로그는 사람이 읽기에는 편하지만, 운영 도구가 안정적으로 해석하기 어렵습니다. 같은 의미의 사용자 ID가 `user`, `userId`, `uid`로 흩어지면 장애 순간에 한 사용자의 흐름을 따라가기 힘듭니다.',
      '구조화 로그는 메시지와 함께 key-value 필드를 남기는 방식입니다. 요청 ID, 사용자 ID, 주문 ID, 외부 API 이름, 지연 시간, 오류 코드처럼 나중에 필터링할 값을 명시적으로 남기면 로그가 검색 가능한 데이터가 됩니다.',
      '개발자가 이 개념을 알아야 하는 이유는 로그 품질이 코드 작성 순간에 결정되기 때문입니다. 운영팀이 나중에 대시보드를 잘 만들어도 애플리케이션이 필요한 필드를 남기지 않으면 원인 분석은 계속 감에 기대게 됩니다.',
    ],
    concepts: [
      '첫 번째 원칙은 안정적인 필드 이름입니다. `request_id`, `trace_id`, `user_id`, `order_id`, `error_code`처럼 팀이 합의한 이름을 반복해서 써야 도구와 사람이 같은 기준으로 찾을 수 있습니다.',
      '두 번째는 correlation입니다. 한 요청이 여러 서비스와 큐를 지나가면 공통 ID가 있어야 흐름을 이어볼 수 있습니다. 로그, 트레이스, 메트릭이 같은 ID를 공유하면 문제의 경로가 선명해집니다.',
      '세 번째는 민감정보 절제입니다. 구조화되어 있다고 해서 모든 값을 남기면 안 됩니다. 이메일, 토큰, 결제 정보, 개인 식별자는 마스킹하거나 남기지 않는 정책이 필요합니다.',
    ],
    example: '`console.log("payment failed", error)`만 남기면 결제 실패가 얼마나 자주, 어느 결제사에서, 어떤 오류 코드로 나는지 세기 어렵습니다. 대신 `event=payment_failed`, `provider`, `order_id`, `request_id`, `error_code`, `duration_ms`를 필드로 남기면 장애 범위와 원인을 바로 좁힐 수 있습니다.',
    checklist: [
      '서비스 전반에서 요청 ID나 trace ID가 같은 필드명으로 남는가?',
      '사용자, 조직, 주문처럼 문제 범위를 좁히는 ID가 필요한 곳에 남는가?',
      '오류 메시지와 오류 코드가 분리되어 검색 가능한가?',
      '민감정보를 로그에 남기지 않도록 테스트나 필터가 있는가?',
      '로그 레벨이 알림과 보관 비용을 고려해 정리되어 있는가?',
    ],
    misconceptions: [
      '“로그를 많이 남기면 된다”는 오해가 있습니다. 양이 많아도 필드가 없으면 검색 비용만 커집니다.',
      '“JSON이면 구조화 로그다”도 절반만 맞습니다. 필드 이름과 의미가 제각각이면 JSON 문자열 묶음일 뿐입니다.',
      '“나중에 파싱하면 된다”는 접근은 깨지기 쉽습니다. 사람이 쓴 문장은 조금만 바뀌어도 정규식과 대시보드를 망가뜨립니다.',
    ],
    actions: [
      '장애 대응에 자주 쓰는 검색어 세 개를 골라, 그 값이 별도 필드로 남는지 확인해보세요.',
      '팀 공통 로그 필드 목록을 짧게 정하고 새 코드 리뷰 체크리스트에 넣어보세요.',
      '민감정보가 로그에 들어가지 않는지 샘플 로그와 필터 설정을 함께 점검하세요.',
    ],
    links: [
      { title: 'OpenTelemetry: Logs', url: 'https://opentelemetry.io/docs/concepts/signals/logs/' },
      { title: 'Google SRE Book: Practical Alerting', url: 'https://sre.google/sre-book/practical-alerting/' },
      { title: 'OWASP Logging Cheat Sheet', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html' },
    ],
    takeaway: '좋은 로그는 예쁜 문장이 아니라, 장애 순간에 정확히 찾을 수 있는 필드입니다.',
  },
  {
    slug: 'feature-flags',
    title: '개발자가 알아야 할 지식: 기능 플래그, 배포와 출시를 분리하는 스위치',
    description: '기능 플래그가 점진적 출시, 빠른 롤백, 실험 운영에 주는 장점과 관리 비용을 정리합니다.',
    sourceTitle: 'Martin Fowler: Feature Toggles',
    sourceUrl: 'https://martinfowler.com/articles/feature-toggles.html',
    sourceAuthor: 'Martin Fowler',
    tags: ['Release', 'Operations', 'Product'],
    intro: '코드를 배포했다는 사실과 사용자에게 기능을 열었다는 사실은 같지 않아도 됩니다. 기능 플래그는 이 둘 사이에 스위치를 둡니다.',
    why: [
      '큰 기능을 한 번에 배포하면 위험도 한 번에 열립니다. 기능 플래그를 쓰면 코드는 미리 배포하되 내부 사용자, 일부 고객, 특정 지역처럼 작은 범위부터 기능을 켤 수 있습니다.',
      '개발자에게 중요한 이유는 배포 전략이 코드 구조에 영향을 주기 때문입니다. 플래그 경계가 너무 넓거나 오래 남으면 코드가 복잡해지고, 반대로 잘 설계하면 롤백과 실험이 훨씬 쉬워집니다.',
      '운영 중 장애가 났을 때도 플래그는 유용합니다. 전체 배포를 되돌리지 않고 문제가 된 기능만 끌 수 있다면 복구 시간이 짧아지고 다른 변경까지 함께 되돌리는 위험을 줄일 수 있습니다.',
    ],
    concepts: [
      '플래그에는 종류가 있습니다. 짧게 쓰는 release flag, 실험용 experiment flag, 운영 차단용 ops flag, 권한 제어용 permission flag는 수명과 관리 방식이 달라야 합니다.',
      '플래그 평가는 안정적이어야 합니다. 같은 사용자가 매 요청마다 다른 결과를 받으면 실험과 경험이 흔들립니다. 사용자 ID나 조직 ID 기준으로 일관되게 나누는 방식이 흔합니다.',
      '플래그도 부채가 됩니다. 기능이 완전히 출시된 뒤에도 분기 코드가 남아 있으면 테스트 조합이 늘고 버그가 숨어듭니다. 플래그마다 소유자와 제거 시점을 정해야 합니다.',
    ],
    example: '새 결제 화면을 만들 때 `new_checkout_enabled` 플래그를 두고 내부 계정에서 먼저 켭니다. 문제가 없으면 5%, 25%, 100%처럼 점진적으로 넓힙니다. 결제 실패율이 오르면 배포 롤백 대신 플래그를 끄고 원인을 분석할 수 있습니다.',
    checklist: [
      '플래그의 목적과 예상 제거 날짜가 기록되어 있는가?',
      '기본값이 안전하며 설정 서비스 장애 때 어떤 값으로 동작하는가?',
      '플래그 상태별 핵심 경로 테스트가 있는가?',
      '플래그 변경 이력이 감사 로그로 남는가?',
      '완료된 플래그를 제거하는 정리 루틴이 있는가?',
    ],
    misconceptions: [
      '“기능 플래그가 있으면 배포가 항상 안전하다”는 오해가 있습니다. 잘못된 플래그 경계나 의존성 변경은 여전히 장애를 만들 수 있습니다.',
      '“모든 것을 플래그로 감싸자”도 위험합니다. 플래그가 많아질수록 가능한 상태 조합이 폭발하고 테스트가 어려워집니다.',
      '“출시 후 나중에 지우면 된다”는 말은 대개 잊힙니다. 오래된 플래그는 코드 이해를 방해하는 숨은 조건문이 됩니다.',
    ],
    actions: [
      '현재 코드에 남아 있는 오래된 플래그 목록을 뽑고 실제로 꺼질 수 있는지 확인해보세요.',
      '새 플래그를 만들 때 생성 이유, 소유자, 제거 조건을 같은 PR에 적어두세요.',
      '플래그 설정 시스템이 느리거나 실패할 때 서비스가 어떤 기본값을 쓰는지 테스트하세요.',
    ],
    links: [
      { title: 'Martin Fowler: Feature Toggles', url: 'https://martinfowler.com/articles/feature-toggles.html' },
      { title: 'LaunchDarkly: Feature flag best practices', url: 'https://launchdarkly.com/docs/guides/flags/' },
      { title: 'Google SRE Book: Release Engineering', url: 'https://sre.google/sre-book/release-engineering/' },
    ],
    takeaway: '기능 플래그는 배포를 느슨하게 만드는 도구가 아니라, 출시의 위험을 더 작게 나누는 운영 장치입니다.',
  },
];

const knowledgePosts = [
  {
    slug: 'falsifiability',
    title: '오늘의 지식: 검증 가능성, 틀릴 수 있어야 배울 수 있다',
    description: '과학철학의 검증 가능성 개념을 일상 판단, 조직 지표, 제품 실험에 연결해 설명합니다.',
    sourceTitle: 'Stanford Encyclopedia of Philosophy: Karl Popper',
    sourceUrl: 'https://plato.stanford.edu/entries/popper/',
    sourceAuthor: 'Stanford Encyclopedia of Philosophy',
    tags: ['Philosophy', 'Science', 'Thinking'],
    intro: '좋은 설명은 그럴듯한 말이 아니라, 틀렸는지 확인할 수 있는 말입니다. 이 차이를 놓치면 우리는 오래 설득력 있어 보이는 주장 곁에서 계속 제자리걸음을 하게 됩니다.',
    explain: [
      '검증 가능성, 더 정확히는 반증 가능성은 어떤 주장이나 이론이 경험적 관찰을 통해 틀렸다고 판정될 수 있어야 한다는 생각입니다. 카를 포퍼는 과학과 비과학을 가르는 중요한 기준으로 이 관점을 제시했습니다. 핵심은 “언젠가 증명될 수 있느냐”보다 “어떤 결과가 나오면 이 주장을 버릴 것인가”입니다.',
      '예를 들어 “모든 백조는 희다”는 주장은 검은 백조 한 마리가 발견되면 틀릴 수 있습니다. 반대로 “보이지 않는 힘이 언제나 모든 일을 적절히 조정한다”처럼 어떤 결과가 나와도 설명을 바꿔 살아남는 주장은 경험으로 배우기 어렵습니다.',
      '이 개념은 실험실 밖에서도 중요합니다. 제품 가설, 투자 판단, 조직 전략, 개인 습관까지 우리는 매일 작고 큰 주장을 세웁니다. 그 주장이 틀릴 조건을 미리 정하지 않으면, 결과가 나빠도 해석만 바꿔 같은 판단을 반복하게 됩니다.',
    ],
    why: [
      '현대의 정보 환경은 그럴듯한 설명으로 가득합니다. 시장이 오른 이유, 사용자가 떠난 이유, 팀이 느린 이유, 콘텐츠가 퍼지지 않은 이유를 우리는 빠르게 설명합니다. 문제는 많은 설명이 사후 해석이라는 점입니다. 일이 벌어진 뒤에는 거의 모든 결과를 그럴듯하게 이야기할 수 있습니다.',
      '검증 가능성은 이런 사후 해석의 함정을 줄입니다. “다음 배포에서 가입 전환율이 5% 이상 오르지 않으면 이 온보딩 가설은 틀린 것으로 본다”처럼 판단 기준을 앞에 놓으면, 우리는 결과를 더 정직하게 배울 수 있습니다.',
      '조직에서도 같은 원칙이 필요합니다. “브랜드 인지도를 높이자”는 말은 방향일 수 있지만 검증 기준이 없으면 회의 때마다 살아남습니다. 어떤 대상에게, 어떤 기간 안에, 어떤 지표가 어떻게 움직이면 성공인지 정해야 다음 결정을 개선할 수 있습니다.',
    ],
    examples: [
      '제품팀이 “사용자가 기능을 몰라서 쓰지 않는다”고 믿는다고 해봅시다. 이 주장은 맞을 수도 있습니다. 하지만 검증 가능하게 만들려면 “기능 발견률을 높이는 안내를 추가하면 2주 안에 신규 사용자의 첫 사용률이 10% 이상 오른다”처럼 바꿔야 합니다. 결과가 오르지 않으면 문제는 인지가 아니라 필요성, 성능, 가격, 신뢰일 수 있습니다.',
      '채용에서도 “좋은 사람은 면접에서 바로 보인다”는 말은 위험합니다. 어떤 면접 질문이 입사 후 성과와 연결되는지 추적하지 않으면, 면접관의 확신만 남습니다. 검증 가능한 기준은 사람을 기계처럼 보자는 뜻이 아니라, 우리의 직감을 계속 교정하자는 뜻입니다.',
      '개인 습관도 마찬가지입니다. “나는 아침형 인간이 아니라서 운동을 못 한다”는 설명은 편하지만 잘 틀리지 않습니다. “2주 동안 저녁 8시에 운동복을 입어도 운동 횟수가 늘지 않으면 시간대가 문제가 아니라고 본다”처럼 바꾸면 다음 실험으로 넘어갈 수 있습니다.',
    ],
    misconceptions: [
      '검증 가능성은 “숫자로 못 재면 의미 없다”는 뜻이 아닙니다. 질적 관찰도 기준을 미리 정하면 배움의 재료가 됩니다.',
      '모든 주장이 과학 이론처럼 엄격해야 한다는 뜻도 아닙니다. 다만 중요한 결정일수록 틀릴 조건을 더 분명히 해야 합니다.',
      '한 번의 실험으로 영원한 결론을 내리자는 말도 아닙니다. 좋은 검증은 결론을 닫는 것이 아니라 다음 질문을 더 좋게 만듭니다.',
    ],
    actions: [
      '중요한 주장 하나를 “무엇이 나오면 이 생각을 바꿀 것인가”라는 문장으로 다시 써보세요.',
      '회의에서 전략을 말할 때 성공 기준뿐 아니라 실패 기준도 함께 정하세요.',
      '지표가 나빠졌을 때 설명을 덧붙이기 전에, 원래 세운 예측이 무엇이었는지 먼저 확인하세요.',
    ],
    links: [
      { title: 'Stanford Encyclopedia of Philosophy: Karl Popper', url: 'https://plato.stanford.edu/entries/popper/' },
      { title: 'Encyclopaedia Britannica: Karl Popper', url: 'https://www.britannica.com/biography/Karl-Popper' },
      { title: 'Internet Encyclopedia of Philosophy: Karl Popper', url: 'https://iep.utm.edu/pop-sci/' },
    ],
    takeaway: '틀릴 수 없는 설명은 마음을 편하게 하지만, 틀릴 수 있는 설명만 우리를 앞으로 움직입니다.',
  },
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
  {
    slug: 'survivorship-bias',
    title: '오늘의 지식: 생존자 편향, 남아 있는 것만 보고 판단하는 실수',
    description: '성공 사례와 관측 가능한 데이터 뒤에 숨어 있는 실패 사례를 함께 보는 사고법을 정리합니다.',
    sourceTitle: 'Encyclopaedia Britannica: survivorship bias',
    sourceUrl: 'https://www.britannica.com/science/survivorship-bias',
    sourceAuthor: 'Encyclopaedia Britannica',
    tags: ['Thinking', 'Statistics', 'Decision Making'],
    intro: '우리는 보이는 것에서 배웁니다. 문제는 실패해서 사라진 것, 기록되지 않은 것, 표본에 들어오지 못한 것이 종종 더 중요한 단서라는 점입니다.',
    explain: [
      '생존자 편향은 어떤 과정에서 살아남거나 관측 가능한 대상만 보고 전체를 판단하는 오류입니다. 성공한 회사, 유명한 예술가, 살아 돌아온 비행기, 오래 버틴 제품만 보면 실패한 대부분의 사례가 빠집니다.',
      '이 편향은 “성공한 사람들은 이렇게 했다”는 조언에서 특히 강하게 나타납니다. 같은 행동을 했지만 실패한 사람들을 함께 보지 않으면 그 행동이 원인인지, 운 좋게 살아남은 결과인지 구분하기 어렵습니다.',
      '핵심은 보이지 않는 표본을 상상하는 습관입니다. 데이터에 없는 것이 정말 없어서인지, 측정 과정에서 탈락했는지 물어야 합니다.',
    ],
    why: [
      '오늘날 우리는 성공 사례를 빠르게 소비합니다. 스타트업 회고, 투자 성공담, 공부법, 생산성 루틴은 읽기 쉽고 동기를 줍니다. 하지만 성공한 사람의 공통점이 성공의 원인이라는 보장은 없습니다.',
      '제품 분석에서도 마찬가지입니다. 남아 있는 사용자 인터뷰만 보면 이탈한 사용자의 불만을 놓칩니다. 구매 고객의 행동만 보면 구매하지 않은 고객이 어디서 막혔는지 보이지 않습니다.',
      '생존자 편향을 이해하면 사례 연구를 더 조심스럽게 읽게 됩니다. 성공의 패턴뿐 아니라 실패의 빈도와 탈락한 경로를 같이 봐야 판단이 단단해집니다.',
    ],
    examples: [
      '유명한 예로 전쟁 중 귀환한 비행기의 피탄 부위만 보고 장갑을 보강하려던 사례가 자주 언급됩니다. 돌아오지 못한 비행기는 데이터에 없으므로, 오히려 귀환한 비행기에 덜 맞은 부위가 치명적인 곳일 수 있습니다.',
      '앱의 충성 사용자만 인터뷰하면 “기능이 충분히 좋다”는 결론이 나오기 쉽습니다. 하지만 첫날 떠난 사용자는 복잡한 가입 절차나 느린 첫 화면에서 이미 탈락했을 수 있습니다.',
      '투자에서 살아남은 펀드의 수익률만 보면 시장 전체가 실제보다 좋아 보일 수 있습니다. 폐쇄된 펀드나 실패한 전략을 빼면 위험이 작게 보입니다.',
    ],
    misconceptions: [
      '생존자 편향은 성공 사례가 쓸모없다는 뜻이 아닙니다. 다만 성공 사례만으로 원인을 확정하지 말자는 뜻입니다.',
      '모든 누락 데이터를 완벽히 복원해야 한다는 뜻도 아닙니다. 중요한 것은 어떤 표본이 빠졌을 가능성이 큰지 의식하는 것입니다.',
      '실패 사례만 보면 된다는 말도 아닙니다. 성공과 실패를 같은 기준으로 비교할 때 배움이 생깁니다.',
    ],
    actions: [
      '성공 사례를 읽을 때 “같은 방식을 썼지만 실패한 사례는 어디에 있을까”를 함께 적어보세요.',
      '제품 지표를 볼 때 남아 있는 사용자와 떠난 사용자를 분리해서 비교하세요.',
      '포트폴리오, 리뷰, 추천 목록처럼 선별된 자료를 볼 때 선별 기준을 먼저 확인하세요.',
    ],
    links: [
      { title: 'Britannica: Survivorship bias', url: 'https://www.britannica.com/science/survivorship-bias' },
      { title: 'Encyclopaedia Britannica: selection bias', url: 'https://www.britannica.com/science/selection-bias' },
      { title: 'NASA History: Abraham Wald and aircraft survivability', url: 'https://history.nasa.gov/monograph12/ch2.htm' },
    ],
    takeaway: '보이는 데이터는 살아남은 데이터입니다. 빠진 것을 묻는 순간 판단이 한 단계 좋아집니다.',
  },
  {
    slug: 'pareto-principle',
    title: '오늘의 지식: 파레토 법칙, 결과의 대부분은 소수의 원인에서 온다',
    description: '80대 20 법칙으로 알려진 파레토 원리를 일, 제품, 문제 해결에 적용할 때의 장점과 한계를 설명합니다.',
    sourceTitle: 'NIST Engineering Statistics Handbook: Pareto chart',
    sourceUrl: 'https://www.itl.nist.gov/div898/handbook/pmc/section3/pmc323.htm',
    sourceAuthor: 'NIST/SEMATECH',
    tags: ['Thinking', 'Productivity', 'Economics'],
    intro: '모든 원인이 같은 무게를 갖지는 않습니다. 어떤 문제는 작은 원인 몇 개가 결과의 큰 부분을 만들고, 그 사실을 아는 것만으로도 우선순위가 달라집니다.',
    explain: [
      '파레토 법칙은 결과의 큰 비중이 비교적 적은 원인에서 나온다는 관찰입니다. 흔히 80대 20 법칙으로 불리지만, 정확히 80%와 20%가 항상 맞는다는 뜻은 아닙니다.',
      '핵심은 불균등한 분포입니다. 매출의 상당 부분이 소수 고객에서 나오고, 버그의 상당 부분이 일부 모듈에서 나오며, 사용자의 대부분은 제품의 몇 가지 핵심 기능만 반복해서 쓸 수 있습니다.',
      '이 원리는 우선순위를 잡는 데 강력합니다. 하지만 숫자를 주문처럼 외우면 위험합니다. 실제 분포를 확인하고, 소수의 원인을 고쳤을 때 부작용은 없는지 봐야 합니다.',
    ],
    why: [
      '시간과 자원은 늘 부족합니다. 모든 일을 같은 힘으로 처리하려 하면 중요한 문제와 사소한 문제가 같은 줄에 섭니다. 파레토 관점은 어디에 먼저 힘을 써야 효과가 큰지 묻습니다.',
      '제품팀이라면 상위 사용자 여정, 상위 오류, 상위 고객 요청을 먼저 보면 개선 효과를 빨리 낼 수 있습니다. 운영팀이라면 장애의 대부분을 만드는 엔드포인트나 의존성을 찾는 일이 출발점이 됩니다.',
      '다만 이 원리를 사람이나 고객을 함부로 버리는 논리로 쓰면 안 됩니다. 적은 비중처럼 보이는 문제도 법적, 윤리적, 신뢰 측면에서 매우 클 수 있습니다.',
    ],
    examples: [
      '버그 리포트 100개가 있을 때 실제 원인은 몇 개의 공통 컴포넌트일 수 있습니다. 증상별로 하나씩 고치기보다 공통 원인을 찾으면 훨씬 빠르게 품질이 좋아집니다.',
      '개인 업무에서도 하루 산출의 대부분은 집중이 잘 된 한두 시간에서 나올 수 있습니다. 그렇다면 그 시간을 회의와 알림에서 보호하는 것이 긴 근무시간보다 중요할 수 있습니다.',
      '매출 분석에서는 상위 고객군이 큰 비중을 차지할 수 있지만, 신규 고객의 학습 비용이나 장기 성장 가능성도 함께 봐야 합니다.',
    ],
    misconceptions: [
      '파레토 법칙은 자연법칙처럼 항상 80대 20이라는 뜻이 아닙니다. 70대 30일 수도 있고 95대 5일 수도 있습니다.',
      '작은 원인은 무시해도 된다는 뜻도 아닙니다. 보안 취약점이나 접근성 문제처럼 빈도는 낮아도 피해가 큰 일이 있습니다.',
      '상위 항목만 최적화하면 된다는 생각도 위험합니다. 장기적으로는 작은 문제들이 신뢰를 깎거나 새로운 성장 기회를 막을 수 있습니다.',
    ],
    actions: [
      '최근 문제 목록을 빈도나 영향도 기준으로 정렬하고 상위 원인 몇 개가 전체에 얼마나 기여하는지 확인해보세요.',
      '업무 시간 기록에서 가장 큰 결과를 낸 활동을 찾아 비슷한 조건을 반복할 수 있게 만드세요.',
      '상위 항목을 고른 뒤, 빈도는 낮지만 치명적인 예외가 없는지 한 번 더 확인하세요.',
    ],
    links: [
      { title: 'NIST Engineering Statistics Handbook: Pareto chart', url: 'https://www.itl.nist.gov/div898/handbook/pmc/section3/pmc323.htm' },
      { title: 'Encyclopaedia Britannica: Vilfredo Pareto', url: 'https://www.britannica.com/biography/Vilfredo-Pareto' },
      { title: 'NIST Engineering Statistics Handbook: Pareto chart', url: 'https://www.itl.nist.gov/div898/handbook/pmc/section3/pmc323.htm' },
    ],
    takeaway: '모든 문제가 같은 크기는 아닙니다. 먼저 큰 원인을 찾되, 작은 빈도의 큰 피해도 놓치지 않는 균형이 필요합니다.',
  },
];

const fallbackDeveloperPosts = [
  {
    slug: 'webhooks',
    title: '개발자가 알아야 할 지식: 웹훅, 이벤트를 밖으로 안전하게 내보내는 계약',
    description: '웹훅을 설계할 때 필요한 서명 검증, 재시도, 멱등성, 이벤트 버전 관리를 실무 관점에서 정리합니다.',
    sourceTitle: 'Stripe Docs: Best practices for using webhooks',
    sourceUrl: 'https://docs.stripe.com/webhooks',
    sourceAuthor: 'Stripe',
    tags: ['API Design', 'Integration', 'Reliability'],
    intro: '웹훅은 “무언가 일어났으니 너도 알아야 한다”는 메시지를 외부 시스템에 보내는 방식입니다. 결제 완료, 구독 갱신, 파일 처리 완료, 배포 상태 변경처럼 상대 시스템이 즉시 반응해야 하는 일에 자주 쓰입니다.',
    why: [
      '웹훅은 단순한 HTTP POST처럼 보이지만 실제로는 시스템 간 계약입니다. 보내는 쪽은 이벤트가 무엇인지, 언제 재시도하는지, 어떤 순서를 보장하는지 알려야 하고, 받는 쪽은 인증, 중복 처리, 장애 복구를 준비해야 합니다.',
      '개발자가 웹훅을 알아야 하는 이유는 연동 장애가 조용히 쌓이기 쉽기 때문입니다. 한 번 실패한 결제 이벤트, 두 번 도착한 배송 이벤트, 순서가 뒤집힌 상태 변경 이벤트는 데이터 불일치로 이어집니다.',
      '좋은 웹훅 설계는 외부 파트너에게 친절합니다. 문서화된 이벤트 타입, 검증 가능한 서명, 안정적인 재시도 정책, 테스트 도구가 있으면 연동 비용이 크게 줄어듭니다.',
    ],
    concepts: [
      '첫 번째는 인증입니다. 웹훅 엔드포인트는 인터넷에 열려 있으므로 요청 본문과 타임스탬프를 공유 비밀키로 서명하고, 받는 쪽은 그 서명을 검증해야 합니다. 단순히 IP allowlist만 믿으면 운영 환경 변화에 약합니다.',
      '두 번째는 멱등성입니다. 네트워크 오류 때문에 같은 이벤트가 여러 번 도착할 수 있습니다. 수신자는 이벤트 ID를 저장하고 이미 처리한 이벤트를 다시 처리하지 않아야 합니다.',
      '세 번째는 재시도와 순서입니다. 대부분의 웹훅은 적어도 한 번 전달을 목표로 하며 정확히 한 번 전달을 보장하지 않습니다. 이벤트 순서도 항상 믿기 어렵기 때문에 현재 상태 조회 API와 함께 설계하는 편이 안전합니다.',
    ],
    example: '결제 서비스가 `invoice.paid` 웹훅을 보낸다고 합시다. 수신 서버가 500을 반환하면 발신자는 일정 시간 뒤 재시도합니다. 이때 수신자가 이벤트 ID를 기준으로 중복 처리를 하지 않으면 사용자의 구독 기간이 두 번 연장될 수 있습니다. 반대로 재시도 정책이 없다면 일시 장애 하나로 결제 완료 상태가 영원히 반영되지 않을 수 있습니다.',
    checklist: [
      '모든 웹훅 요청에 검증 가능한 서명과 타임스탬프가 포함되는가?',
      '수신자가 이벤트 ID를 저장해 중복 처리를 막는가?',
      '2xx와 비2xx 응답에 대한 재시도 정책이 문서화되어 있는가?',
      '이벤트 스키마와 버전 변경 정책이 명확한가?',
      '웹훅 실패를 운영자가 볼 수 있는 로그, 대시보드, 재전송 기능이 있는가?',
      '웹훅만 믿지 않고 필요할 때 현재 상태를 다시 조회할 API가 있는가?',
    ],
    misconceptions: [
      '“POST 한 번 보내면 끝”이라는 오해가 있습니다. 웹훅은 네트워크, 인증, 중복, 재시도, 문서화가 모두 들어간 통합 계약입니다.',
      '“순서대로 올 것이다”라고 가정하는 것도 위험합니다. 서로 다른 큐나 재시도 경로를 거치면 생성 순서와 도착 순서가 달라질 수 있습니다.',
      '“서명 검증은 받는 쪽 책임”이라고만 보는 것도 부족합니다. 발신자는 안전하게 검증할 수 있는 서명 방식과 예제를 제공해야 합니다.',
      '“실패하면 파트너가 다시 보내겠지”라는 생각도 불친절합니다. 발신 쪽에는 실패 기록과 재전송 도구가 있어야 운영자가 문제를 복구할 수 있습니다.',
    ],
    actions: [
      '현재 운영 중인 웹훅 하나를 골라 같은 이벤트가 두 번 들어왔을 때 결과가 달라지는지 확인해보세요.',
      '서명 검증 실패, 오래된 타임스탬프, 알 수 없는 이벤트 타입을 각각 어떻게 처리하는지 테스트를 추가하세요.',
      '문서에는 예시 payload만 두지 말고 재시도 간격, timeout, 응답 코드 의미, 이벤트 버전 정책을 함께 적어두세요.',
    ],
    links: [
      { title: 'Stripe Docs: Webhooks', url: 'https://docs.stripe.com/webhooks' },
      { title: 'GitHub Docs: Webhook events and payloads', url: 'https://docs.github.com/en/webhooks/webhook-events-and-payloads' },
      { title: 'Svix: Webhook best practices', url: 'https://www.svix.com/resources/webhook-best-practices/' },
    ],
    takeaway: '웹훅은 HTTP 요청 하나가 아니라, 실패와 중복을 전제로 만든 시스템 간 약속입니다.',
  },
  {
    slug: 'optimistic-locking',
    title: '개발자가 알아야 할 지식: 낙관적 잠금, 충돌은 드물지만 확인은 꼭 해야 한다',
    description: '동시 수정 문제를 버전 필드와 조건부 업데이트로 다루는 낙관적 잠금의 원리와 한계를 정리합니다.',
    sourceTitle: 'Martin Fowler: Optimistic Offline Lock',
    sourceUrl: 'https://martinfowler.com/eaaCatalog/optimisticOfflineLock.html',
    sourceAuthor: 'Martin Fowler',
    tags: ['Databases', 'Concurrency', 'Architecture'],
    intro: '여러 사용자가 같은 데이터를 수정할 때 문제는 “누가 먼저 저장했는가”보다 “내가 본 값이 아직도 최신인가”입니다.',
    why: [
      '웹 애플리케이션에서는 같은 문서, 주문, 설정, 재고를 여러 요청이 동시에 건드릴 수 있습니다. 마지막 저장이 무조건 이기면 앞선 사용자의 변경이 조용히 사라집니다.',
      '낙관적 잠금은 충돌이 자주 일어나지 않는다고 보고, 미리 잠그기보다 저장 순간에 버전이 바뀌었는지 확인합니다. 충돌이 있으면 저장을 거부하고 사용자나 호출자에게 다시 판단하게 합니다.',
      '이 방식은 긴 편집 세션, 분산 시스템, REST API에서 특히 유용합니다. 데이터베이스 락을 오래 잡지 않으면서도 잃어버린 업데이트를 막을 수 있기 때문입니다.',
    ],
    concepts: [
      '보통 레코드에 `version`, `updated_at`, `etag` 같은 값을 둡니다. 클라이언트는 읽은 버전을 함께 보내고, 서버는 현재 버전이 같을 때만 업데이트합니다.',
      'SQL에서는 `UPDATE documents SET body = ?, version = version + 1 WHERE id = ? AND version = ?` 같은 조건부 업데이트가 핵심입니다. 영향받은 row가 0이면 누군가 먼저 수정한 것입니다.',
      'HTTP에서는 `ETag`와 `If-Match` 헤더를 활용할 수 있습니다. 클라이언트가 알고 있는 ETag와 서버의 현재 ETag가 다르면 `412 Precondition Failed`로 충돌을 알려줄 수 있습니다.',
    ],
    example: '관리자 A와 B가 같은 상품 설명을 열었습니다. A가 먼저 저장하면서 version이 7에서 8이 됩니다. B가 여전히 version 7 기준으로 저장하려 하면 서버는 업데이트를 거부합니다. B는 최신 내용을 다시 보고 병합하거나 자신의 변경을 포기할 수 있습니다.',
    checklist: [
      '동시 수정될 수 있는 주요 엔티티에 버전 필드가 있는가?',
      '업데이트 쿼리가 ID만이 아니라 이전 버전까지 조건으로 확인하는가?',
      '충돌 시 클라이언트가 명확한 오류와 복구 경로를 받는가?',
      '자동 재시도가 사용자의 변경을 무조건 덮어쓰지 않는가?',
      '배치 작업과 관리자 도구도 같은 충돌 규칙을 따르는가?',
    ],
    misconceptions: [
      '“트랜잭션을 쓰면 필요 없다”는 오해가 있습니다. 짧은 트랜잭션은 DB 내부 일관성을 지키지만, 사용자가 화면을 열어두는 긴 시간의 충돌까지 자동으로 해결하지는 않습니다.',
      '“updated_at만 보면 충분하다”도 조심해야 합니다. 시간 정밀도, 시계 동기화, DB 갱신 방식에 따라 버전 숫자가 더 명확할 수 있습니다.',
      '“충돌은 드물다”는 말은 무시해도 된다는 뜻이 아닙니다. 드문 충돌일수록 조용히 데이터가 사라지면 찾기 어렵습니다.',
    ],
    actions: [
      '중요한 수정 화면 하나를 골라 두 브라우저 탭에서 동시에 저장해보세요. 앞선 변경이 사라지면 낙관적 잠금 후보입니다.',
      'API 문서에 업데이트 요청이 어떤 버전 조건을 요구하는지 명시하세요.',
      '충돌 메시지는 기술 오류가 아니라 사용자가 다음 선택을 할 수 있는 안내로 작성하세요.',
    ],
    links: [
      { title: 'Martin Fowler: Optimistic Offline Lock', url: 'https://martinfowler.com/eaaCatalog/optimisticOfflineLock.html' },
      { title: 'MDN: ETag', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/ETag' },
      { title: 'MDN: If-Match', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/If-Match' },
    ],
    takeaway: '낙관적 잠금은 충돌이 없다고 믿는 기술이 아니라, 충돌이 있을 때 조용히 덮어쓰지 않게 만드는 안전장치입니다.',
  },
];

const fallbackKnowledgePosts = [
  {
    slug: 'dunning-kruger-effect',
    title: '오늘의 지식: 더닝-크루거 효과, 모를수록 확신하기 쉬운 이유',
    description: '자기 평가의 오류로 알려진 더닝-크루거 효과를 학습, 조직 의사결정, 전문가 신뢰의 관점에서 설명합니다.',
    sourceTitle: 'Encyclopaedia Britannica: Dunning-Kruger effect',
    sourceUrl: 'https://www.britannica.com/science/Dunning-Kruger-effect',
    sourceAuthor: 'Encyclopaedia Britannica',
    tags: ['Psychology', 'Thinking', 'Decision Making'],
    intro: '사람은 자신이 모르는 것을 정확히 모릅니다. 이 단순한 사실 때문에 어떤 사람은 실력이 부족할수록 오히려 더 강하게 확신하고, 실력이 늘수록 자신의 한계를 더 잘 보게 됩니다.',
    explain: [
      '더닝-크루거 효과는 특정 영역에서 능력이 낮은 사람이 자신의 능력을 과대평가하기 쉬운 현상을 말합니다. 문제를 풀 능력이 부족하면 동시에 자신의 풀이가 왜 틀렸는지 알아차리는 능력도 부족해지기 때문입니다.',
      '이 효과는 “무능한 사람은 모두 자신감이 넘친다”는 조롱이 아닙니다. 인간의 자기 평가가 얼마나 어려운지 보여주는 심리학적 경고입니다. 초보자는 무엇을 모르는지 모르고, 숙련자는 변수가 얼마나 많은지 알기 때문에 더 조심스러워질 수 있습니다.',
      '핵심은 지식과 메타인지가 함께 자란다는 점입니다. 어느 분야를 조금 배울 때는 세상이 단순해 보이지만, 더 깊이 들어가면 예외, 맥락, 조건, 한계가 보이기 시작합니다.',
    ],
    why: [
      '현대 사회는 빠른 의견을 보상합니다. 회의, 소셜 미디어, 투자 판단, 기술 선택에서 확신 있는 말은 종종 전문성처럼 보입니다. 하지만 확신의 크기와 판단의 품질은 같은 것이 아닙니다.',
      '조직에서는 이 효과가 의사결정의 위험이 됩니다. 문제를 잘 모르는 사람이 단순한 해결책을 강하게 밀고, 실제로 복잡성을 아는 사람은 조심스럽게 말하다가 덜 설득력 있어 보일 수 있습니다.',
      '개인 학습에서도 중요합니다. 무언가를 처음 익힌 뒤 “이제 알겠다”는 느낌이 들 때가 오히려 가장 조심해야 할 때일 수 있습니다. 그 순간 필요한 것은 더 큰 확신이 아니라 피드백과 검증입니다.',
    ],
    examples: [
      '프로그래밍을 막 배운 사람이 작은 앱 하나를 만들고 “대부분의 서비스는 간단하다”고 생각할 수 있습니다. 하지만 운영, 보안, 장애 대응, 데이터 마이그레이션, 사용자 지원을 겪으면 같은 문제를 훨씬 조심스럽게 보게 됩니다.',
      '투자에서도 짧은 상승장을 경험한 초보자는 자신의 판단력을 과대평가하기 쉽습니다. 반대로 여러 사이클을 겪은 사람은 운, 유동성, 리스크 관리의 역할을 더 크게 봅니다.',
      '토론에서 목소리가 큰 사람이 항상 더 많이 아는 것은 아닙니다. 때로는 복잡성을 모르는 사람이 더 짧고 단정적인 문장을 만들기 쉽습니다.',
    ],
    misconceptions: [
      '더닝-크루거 효과는 특정 집단을 비웃는 말이 아닙니다. 누구나 낯선 영역에서는 이 함정에 빠질 수 있습니다.',
      '자신감이 나쁘다는 뜻도 아닙니다. 문제는 자신감이 검증과 피드백 없이 전문성처럼 취급될 때입니다.',
      '전문가는 항상 자신감이 낮다는 뜻도 아닙니다. 좋은 전문가는 확신할 수 있는 부분과 불확실한 부분을 구분해서 말합니다.',
    ],
    actions: [
      '새로 배운 주제에 대해 “내가 아직 구분하지 못하는 예외는 무엇인가”를 적어보세요.',
      '중요한 결정을 내릴 때 확신의 정도와 근거의 질을 분리해서 평가하세요.',
      '회의에서는 가장 단정적인 의견뿐 아니라 “어떤 조건에서는 틀릴 수 있는가”를 말하는 사람의 신호도 들어보세요.',
    ],
    links: [
      { title: 'Britannica: Dunning-Kruger effect', url: 'https://www.britannica.com/science/Dunning-Kruger-effect' },
      { title: 'APA Dictionary: Dunning-Kruger effect', url: 'https://dictionary.apa.org/dunning-kruger-effect' },
      { title: 'Cornell Chronicle: Unskilled and unaware of it', url: 'https://news.cornell.edu/stories/1999/12/study-shows-incompetent-people-too-ignorant-know-it' },
    ],
    takeaway: '진짜 배움은 확신이 커지는 과정만이 아니라, 내가 무엇을 모르는지 더 정확히 보게 되는 과정입니다.',
  },
  {
    slug: 'cobra-effect',
    title: '오늘의 지식: 코브라 효과, 보상이 문제를 더 키울 때',
    description: '잘못 설계된 인센티브가 예상과 반대로 행동을 바꾸는 코브라 효과를 정책, 조직, 제품 지표에 연결합니다.',
    sourceTitle: 'Encyclopaedia Britannica: perverse incentive',
    sourceUrl: 'https://www.britannica.com/topic/perverse-incentive',
    sourceAuthor: 'Encyclopaedia Britannica',
    tags: ['Economics', 'Behavior', 'Decision Making'],
    intro: '문제를 줄이려고 보상을 만들었는데, 사람들이 그 보상을 얻기 위해 문제를 더 많이 만들기 시작한다면 어떻게 될까요. 코브라 효과는 선의의 인센티브가 반대로 작동하는 순간을 설명합니다.',
    explain: [
      '코브라 효과는 어떤 문제를 해결하려고 만든 보상이나 규칙이 오히려 그 문제를 늘리는 현상을 말합니다. 흔히 식민지 인도에서 코브라를 줄이려고 죽은 코브라에 현상금을 걸었더니 사람들이 코브라를 사육했다는 이야기에서 이름이 왔습니다.',
      '이 일화의 역사적 정확성은 논쟁이 있지만, 개념 자체는 매우 유용합니다. 사람은 제도가 측정하고 보상하는 행동에 반응합니다. 그래서 목표와 지표가 어긋나면 문제 해결이 아니라 지표 최적화가 일어납니다.',
      '핵심은 “사람들이 나쁘다”가 아니라 “시스템이 어떤 행동을 유도하는가”입니다. 좋은 의도만으로는 충분하지 않고, 보상을 받은 사람이 어떻게 우회할지까지 상상해야 합니다.',
    ],
    why: [
      '회사와 서비스는 인센티브로 움직입니다. 영업 보상, 고객지원 처리 건수, 앱의 체류 시간, 크리에이터 수익 배분, 교육 평가가 모두 사람의 행동을 바꿉니다.',
      '단일 지표가 강하게 보상되면 사람은 그 지표를 올리는 가장 쉬운 길을 찾습니다. 처리 건수만 보상하면 어려운 상담을 피하고, 클릭만 보상하면 자극적인 제목이 늘고, 배포 횟수만 보상하면 품질보다 빈도가 앞설 수 있습니다.',
      '코브라 효과를 이해하면 정책과 제품 실험을 더 신중하게 설계할 수 있습니다. 보상은 목표를 향한 지름길이 아니라, 예상치 못한 우회로까지 함께 만드는 힘입니다.',
    ],
    examples: [
      '버그를 많이 찾은 사람에게만 보상하면 사소한 버그를 쪼개서 보고하거나, 품질을 처음부터 높이는 활동은 덜 인정받을 수 있습니다.',
      '콘텐츠 플랫폼이 조회 수만 보상하면 짧은 호기심을 자극하는 제목과 반복 업로드가 늘 수 있습니다. 장기 만족도나 신고율을 함께 보지 않으면 생태계 품질이 내려갑니다.',
      '조직에서 야근 시간을 성실함으로 보상하면 실제 생산성보다 오래 앉아 있는 행동이 강화될 수 있습니다.',
    ],
    misconceptions: [
      '코브라 효과는 인센티브를 쓰지 말자는 뜻이 아닙니다. 인센티브는 강력하기 때문에 더 정교하게 설계해야 한다는 뜻입니다.',
      '사람들이 일부러 제도를 악용한다는 이야기만도 아닙니다. 선량한 사람도 평가 기준이 바뀌면 자연스럽게 행동을 조정합니다.',
      '보조 지표를 많이 붙이면 자동으로 해결되는 것도 아닙니다. 지표가 많아질수록 무엇이 정말 중요한지 흐려질 수 있습니다.',
    ],
    actions: [
      '지금 쓰는 핵심 지표 하나에 대해 “이 숫자만 올리려면 어떤 나쁜 행동이 가능할까”를 적어보세요.',
      '보상 지표와 방어 지표를 함께 두세요. 속도를 보상한다면 품질과 재작업률도 같이 봐야 합니다.',
      '새 정책을 작게 시작하고, 사람들이 실제로 어떻게 반응하는지 관찰한 뒤 확대하세요.',
    ],
    links: [
      { title: 'Britannica: Perverse incentive', url: 'https://www.britannica.com/topic/perverse-incentive' },
      { title: 'Wikipedia: Cobra effect', url: 'https://en.wikipedia.org/wiki/Perverse_incentive#The_original_cobra_effect' },
      { title: 'OECD: Behavioural insights', url: 'https://www.oecd.org/gov/regulatory-policy/behavioural-insights.htm' },
    ],
    takeaway: '사람은 목표가 아니라 보상받는 행동을 반복합니다. 좋은 제도는 그 차이를 끝까지 의심합니다.',
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
  run('git', ['fetch', 'origin', 'main']);
  run('git', ['merge', '--ff-only', 'FETCH_HEAD']);
}

let filename = firstExistingForDate(workflow.prefix, date);
let created = false;
if (!filename) {
  const post = selectTopic(workflow.prefix, workflow.posts, workflowName);
  filename = `${workflow.prefix}-${date}-${post.slug}.md`;
  const content = `${frontmatter(post, date, workflowName)}${workflow.article(post)}`;
  writeFileSync(join(postDir, filename), content);
  created = true;
}

validateNoDuplicateCuratedPost(join(postDir, filename), workflow.prefix);

run('npm', ['run', 'build']);

const postPath = join('src/content/medium-digest', filename);
const status = run('git', ['status', '--short', '--', postPath]).trim();
let commit = 'no new commit';
if (status) {
  run('git', ['add', postPath]);
  const commitOutput = run('git', ['commit', '-m', workflow.commit(date)]);
  commit = commitOutput.match(/\[[^\]]+\s+([a-f0-9]+)\]/)?.[1] ?? 'committed';
}

run('git', ['push', 'origin', 'HEAD']);

const fileContent = readFileSync(join(postDir, filename), 'utf8');
const title = fileContent.match(/^title:\s+"(.+)"$/m)?.[1]?.replaceAll('\\"', '"') ?? filename;
const sourceUrl = fileContent.match(/^sourceUrl:\s+"(.+)"$/m)?.[1] ?? '';
const slug = filename.replace(/\.md$/, '');
const publicUrl = `https://blog.kokomasoft.com/blog/${slug}/`;
let publicStatus = 'not checked';
try {
  const response = spawnSync('curl', ['-L', '-s', '-o', '/dev/null', '-w', '%{http_code}', publicUrl], {
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
  `URL: ${publicUrl}`,
  `주요 참고: ${sourceUrl}`,
  `빌드: 통과`,
  `커밋/푸시: ${commit}, origin HEAD push 완료`,
  `공개 URL HTTP 상태: ${publicStatus}`,
].join('\n'));
