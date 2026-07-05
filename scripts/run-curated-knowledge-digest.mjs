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

function selectTopic(prefix, posts, workflowName, date) {
  const existingPosts = readExistingPosts(prefix);
  const candidate = [
    ...posts,
    ...fallbackPostsForWorkflow(workflowName),
    ...generatedPostsForWorkflow(workflowName),
    ...proceduralPostsForWorkflow(workflowName, date),
  ].find((post) => !isDuplicateTopic({ ...post, body: articleBodyForWorkflow(workflowName, post) }, existingPosts));
  if (!candidate) {
    const used = existingPosts.map((post) => post.slug ?? post.title).filter(Boolean).join(', ');
    throw new Error(`no unused ${prefix} topic remains after curated, fallback, generated, and procedural topic pools. Used: ${used}`);
  }
  return candidate;
}

function articleBodyForWorkflow(workflowName, post) {
  return workflowName === 'developer' ? developerArticle(post) : knowledgeArticle(post);
}

function fallbackPostsForWorkflow(workflowName) {
  return workflowName === 'developer' ? fallbackDeveloperPosts : fallbackKnowledgePosts;
}

function generatedPostsForWorkflow(workflowName) {
  return workflowName === 'developer'
    ? generatedDeveloperTopicBank.map(developerPostFromTopic)
    : generatedKnowledgeTopicBank.map(knowledgePostFromTopic);
}

function proceduralPostsForWorkflow(workflowName, date) {
  const topics = workflowName === 'developer' ? proceduralDeveloperTopics : proceduralKnowledgeTopics;
  const angles = workflowName === 'developer' ? proceduralDeveloperAngles : proceduralKnowledgeAngles;
  const pairs = [];
  for (const topic of topics) {
    for (const angle of angles) {
      const suffix = safeSlug(angle.slug);
      pairs.push({
        ...topic,
        slug: `${topic.slug}-${suffix}`,
        angle: angle.textFor(topic),
        description: angle.descriptionFor(topic),
      });
    }
  }
  const offset = Math.abs(hashString(`${workflowName}:${date}`)) % Math.max(1, pairs.length);
  return [...pairs.slice(offset), ...pairs.slice(0, offset)]
    .map((topic) => (workflowName === 'developer' ? developerPostFromTopic(topic) : knowledgePostFromTopic(topic)));
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
  const candidateTokens = topicTokens(`${post.title} ${post.description} ${post.sourceTitle} ${post.body ?? ''}`);
  return existingPosts.some((existing) => {
    if (existing.file === currentFile) return false;
    if (existing.slug && existing.slug === post.slug) return true;
    if (existing.title && existing.title === post.title) return true;
    if (existing.sourceUrl && existing.sourceUrl === post.sourceUrl) return true;
    return jaccard(candidateTokens, existing.tokens) >= 0.58;
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
    return jaccard(currentTokens, existing.tokens) >= 0.58;
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

function developerPostFromTopic(topic) {
  const problem = topic.problem ?? `${topic.subject}는 작은 코드 조각보다 시스템의 약속에 더 가깝습니다.`;
  const risk = topic.risk ?? '이 기준이 없으면 구현은 동작해도 운영 순간에 비용, 장애, 데이터 불일치가 드러납니다.';
  const payoff = topic.payoff ?? '개발자가 이 개념을 알면 설계 결정의 이유를 더 분명히 설명하고, 장애가 나기 전에 위험을 줄일 수 있습니다.';
  return {
    slug: topic.slug,
    title: `개발자가 알아야 할 지식: ${topic.subject}, ${topic.angle}`,
    description: topic.description,
    sourceTitle: topic.sourceTitle,
    sourceUrl: topic.sourceUrl,
    sourceAuthor: topic.sourceAuthor,
    tags: topic.tags,
    intro: topic.intro ?? `${topic.subject}는 코드가 커지고 사용자가 늘어날수록 조용히 중요해지는 실무 개념입니다. 처음에는 세부 구현처럼 보이지만, 실제로는 시스템이 실패를 어떻게 다룰지 정하는 기준이 됩니다.`,
    why: [
      problem,
      risk,
      payoff,
    ],
    concepts: [
      topic.principles?.[0] ?? `첫 번째 핵심은 경계입니다. ${topic.subject}가 적용되는 범위와 적용되지 않는 범위를 구분해야 합니다. 경계가 흐리면 예외 처리가 곳곳에 흩어지고, 나중에는 같은 문제가 서로 다른 방식으로 해결됩니다.`,
      topic.principles?.[1] ?? `두 번째 핵심은 계약입니다. 서버, 클라이언트, 데이터베이스, 운영 도구가 어떤 값을 믿고 어떤 실패를 허용하는지 문서와 코드에 함께 드러나야 합니다.`,
      topic.principles?.[2] ?? `세 번째 핵심은 관측 가능성입니다. 제대로 설계했는지 알려면 성공 경로뿐 아니라 거절, 충돌, 지연, 재시도 같은 사건도 로그와 지표로 확인할 수 있어야 합니다.`,
    ],
    example: topic.example ?? `${topic.subject}를 새 기능에 적용한다고 해봅시다. 처음에는 정상 경로만 보이지만 실제 운영에서는 지연, 중복 요청, 권한 차이, 배포 순서처럼 작은 예외가 함께 움직입니다. 이때 ${topic.subject}의 기준을 미리 정해두면 문제를 코드 곳곳의 임시 처리로 흩뜨리지 않고 한 곳에서 설명할 수 있습니다.`,
    checklist: topic.checklist ?? [
      `${topic.subject}가 적용되는 경계와 예외가 문서와 코드에 드러나는가?`,
      '실패하거나 지연될 때 호출자가 어떤 응답을 받는지 정해져 있는가?',
      '중복 실행, 재시도, 롤백 상황에서도 데이터가 일관되게 남는가?',
      '운영자가 성공뿐 아니라 거절, 충돌, 지연을 지표로 확인할 수 있는가?',
      '새 팀원이 이 설계를 왜 쓰는지 한 문단으로 이해할 수 있는가?',
    ],
    misconceptions: topic.misconceptions ?? [
      `“${topic.subject}는 나중에 트래픽이 커지면 보면 된다”는 오해가 있습니다. 많은 운영 문제는 작은 규모에서 만든 계약이 그대로 커지면서 생깁니다.`,
      '“라이브러리가 알아서 해준다”는 생각도 부족합니다. 도구는 메커니즘을 제공하지만 어떤 실패를 허용할지는 서비스가 정해야 합니다.',
      '“문제가 생기면 로그를 보면 된다”도 늦습니다. 필요한 필드를 남기지 않은 로그는 장애 순간에 방향을 주지 못합니다.',
    ],
    actions: topic.actions ?? [
      `현재 서비스에서 ${topic.subject}와 연결된 코드 경로 하나를 골라 정상 경로와 실패 경로를 함께 그려보세요.`,
      '코드 리뷰 체크리스트에 경계, 재시도, 관측 가능성 중 빠진 항목이 있는지 확인하세요.',
      '운영 대시보드에 이 개념이 제대로 동작하는지 보여주는 최소 지표 하나를 추가하세요.',
    ],
    links: [
      { title: topic.sourceTitle, url: topic.sourceUrl },
      ...(topic.links ?? []),
    ],
    takeaway: topic.takeaway ?? `${topic.subject}는 구현 디테일처럼 보이지만, 시간이 지나면 서비스가 실패를 다루는 방식 그 자체가 됩니다.`,
  };
}

function knowledgePostFromTopic(topic) {
  const explain = topic.explain ?? [
    `${topic.subject}는 우리가 상황을 해석할 때 자주 놓치는 구조를 이름 붙인 개념입니다.`,
    `핵심은 ${topic.angle}는 점입니다. 같은 사건도 어떤 기준으로 보느냐에 따라 전혀 다른 결론으로 이어질 수 있습니다.`,
    '이런 개념의 쓸모는 어려운 말을 아는 데 있지 않습니다. 복잡한 상황에서 무엇을 먼저 의심하고 확인해야 하는지 알려주는 데 있습니다.',
  ];
  const why = topic.why ?? [
    '현대의 일상은 정보와 선택지가 많아서 빠른 판단을 자주 요구합니다. 이때 우리는 사실보다 익숙한 설명이나 눈에 잘 띄는 신호에 기대기 쉽습니다.',
    `${topic.subject}를 알면 문제를 개인의 의지나 성격으로만 보지 않고, 판단을 만든 환경과 구조까지 함께 볼 수 있습니다.`,
    '좋은 개념은 답을 대신 주지 않습니다. 대신 질문의 방향을 바꿔서 같은 실수를 덜 반복하게 만듭니다.',
  ];
  const examples = topic.examples ?? [
    `회의에서 ${topic.subject}의 관점으로 보면, 겉으로 드러난 의견보다 어떤 기준이 사람들의 선택을 이끄는지 더 잘 보입니다.`,
    '제품이나 서비스에서도 비슷합니다. 사용자의 말 하나보다 행동이 만들어진 맥락을 같이 보면 더 나은 결정을 할 수 있습니다.',
    '개인 생활에서는 반복되는 판단 실수를 발견하는 데 도움이 됩니다. 왜 같은 선택을 다시 하는지 이름을 붙이면 바꾸기도 쉬워집니다.',
  ];
  return {
    slug: topic.slug,
    title: `오늘의 지식: ${topic.subject}, ${topic.angle}`,
    description: topic.description,
    sourceTitle: topic.sourceTitle,
    sourceUrl: topic.sourceUrl,
    sourceAuthor: topic.sourceAuthor,
    tags: topic.tags,
    intro: topic.intro ?? `${topic.subject}는 익숙한 현상을 조금 다르게 보게 해주는 개념입니다. 이름은 짧지만, 그 안에는 우리가 판단하고 행동하는 방식에 대한 중요한 힌트가 들어 있습니다.`,
    explain,
    why,
    examples,
    misconceptions: topic.misconceptions ?? [
      `${topic.subject}는 모든 상황을 하나로 설명하는 만능 열쇠가 아닙니다.`,
      '개념을 안다고 해서 편향이나 실수가 자동으로 사라지는 것도 아닙니다. 실제로는 판단 절차와 환경을 함께 바꿔야 합니다.',
      '반대로 너무 복잡하게 생각하라는 뜻도 아닙니다. 중요한 결정일수록 한 번 더 확인할 기준을 갖자는 뜻입니다.',
    ],
    actions: topic.actions ?? [
      `오늘 내린 결정 하나를 ${topic.subject} 관점에서 다시 읽어보세요.`,
      '그 판단에서 빠진 정보, 너무 크게 본 정보, 처음부터 당연하게 둔 가정을 각각 적어보세요.',
      '다음 비슷한 상황에서 확인할 질문 하나를 미리 정해두세요.',
    ],
    links: [
      { title: topic.sourceTitle, url: topic.sourceUrl },
      ...(topic.links ?? []),
    ],
    takeaway: topic.takeaway ?? `좋은 판단은 정답을 빨리 고르는 일보다, 내가 무엇에 끌려가고 있는지 알아차리는 데서 시작합니다.`,
  };
}

const generatedDeveloperTopicBank = [
  {
    slug: 'schema-migration',
    subject: '스키마 마이그레이션',
    angle: '데이터 변경은 배포보다 오래 남는다',
    description: 'DB 스키마 변경을 안전하게 배포하기 위한 expand-contract, 롤백, 호환성 원칙을 정리합니다.',
    sourceTitle: 'Prisma Docs: Data migrations',
    sourceUrl: 'https://www.prisma.io/docs/orm/prisma-migrate/workflows/data-migration',
    sourceAuthor: 'Prisma',
    tags: ['Databases', 'Deployment', 'Reliability'],
    problem: '코드는 되돌리기 쉽지만 데이터 구조는 한 번 바뀌면 오래 남습니다. 컬럼 삭제, 타입 변경, 인덱스 추가, 백필 작업은 배포 버튼보다 느리게 진행되고 장애 범위도 넓습니다.',
    risk: '마이그레이션을 앱 배포와 한 덩어리로만 보면 새 코드와 옛 코드가 동시에 떠 있는 순간을 놓칩니다. 롤링 배포 중 일부 인스턴스가 새 컬럼을 쓰고 일부는 옛 컬럼만 읽으면 예측하기 어려운 오류가 생깁니다.',
    payoff: '개발자가 마이그레이션 흐름을 알면 변경을 확장, 전환, 정리 단계로 나누고 데이터 손실 없이 배포할 수 있습니다.',
    principles: [
      '첫 번째는 호환성입니다. 새 스키마는 잠시 동안 옛 코드와 새 코드를 모두 받아들여야 합니다. 컬럼을 바로 지우기보다 먼저 추가하고, 양쪽 쓰기나 백필을 거친 뒤 읽기 경로를 옮기는 편이 안전합니다.',
      '두 번째는 작업 크기입니다. 큰 테이블에 인덱스를 만들거나 값을 채우는 작업은 온라인 여부, 잠금, 배치 크기, 재시도 가능성을 확인해야 합니다.',
      '세 번째는 검증입니다. 마이그레이션이 끝났다는 것은 명령이 성공했다는 뜻만이 아니라 데이터 개수, null 비율, 읽기 경로, 오류율이 기대와 맞는다는 뜻이어야 합니다.',
    ],
    example: '사용자 이름 컬럼을 `name`에서 `display_name`으로 바꾼다고 합시다. 안전한 흐름은 새 컬럼 추가, 기존 값 백필, 새 코드에서 양쪽 쓰기, 읽기 경로 전환, 충분한 관측 후 옛 컬럼 제거입니다. 한 번에 rename하면 롤링 배포 중 일부 서버가 컬럼을 찾지 못할 수 있습니다.',
    checklist: [
      '새 스키마가 옛 코드와 새 코드 모두에서 안전하게 동작하는가?',
      '대용량 테이블 변경이 긴 잠금이나 복제를 밀리게 만들지 않는가?',
      '백필은 중단 후 다시 실행해도 같은 결과를 내는가?',
      '롤백할 때 코드뿐 아니라 데이터 상태도 고려했는가?',
      '마이그레이션 완료를 검증할 쿼리와 지표가 준비되어 있는가?',
    ],
    misconceptions: [
      '“마이그레이션 파일이 있으니 안전하다”는 오해가 있습니다. 파일은 절차일 뿐이고 운영 데이터의 크기와 배포 방식이 실제 위험을 정합니다.',
      '“트래픽 적은 시간에 하면 된다”도 절반만 맞습니다. 잠금과 복제 지연은 적은 트래픽에서도 치명적일 수 있습니다.',
      '“실패하면 롤백하면 된다”는 말도 데이터 변경에서는 조심해야 합니다. 삭제되거나 합쳐진 데이터는 코드처럼 간단히 되돌릴 수 없습니다.',
    ],
    actions: [
      '다음 스키마 변경을 expand, migrate, contract 세 단계로 나눠 적어보세요.',
      '백필 스크립트는 작은 배치와 재시작 가능성을 기준으로 점검하세요.',
      '마이그레이션 PR에는 롤백 계획과 완료 검증 쿼리를 함께 남기세요.',
    ],
    links: [
      { title: 'PlanetScale: Online schema changes', url: 'https://planetscale.com/docs/concepts/online-schema-change' },
      { title: 'GitLab Docs: Database migrations style guide', url: 'https://docs.gitlab.com/development/database/migrations_for_multiple_databases/' },
    ],
    takeaway: '좋은 스키마 변경은 한 번에 바꾸는 기술이 아니라, 옛 세계와 새 세계가 잠시 공존하게 만드는 설계입니다.',
  },
  {
    slug: 'queue-visibility-timeout',
    subject: '큐 visibility timeout',
    angle: '작업이 사라진 것이 아니라 잠시 안 보이는 것이다',
    description: '메시지 큐에서 visibility timeout이 중복 처리, 재시도, 작업 시간 설계에 주는 영향을 설명합니다.',
    sourceTitle: 'AWS SQS Developer Guide: Visibility timeout',
    sourceUrl: 'https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-visibility-timeout.html',
    sourceAuthor: 'Amazon Web Services',
    tags: ['Queues', 'Reliability', 'Distributed Systems'],
    problem: '큐에서 메시지를 가져오는 순간 메시지가 삭제된다고 생각하면 재시도와 중복 처리의 핵심을 놓칩니다. 많은 큐는 소비자가 처리하는 동안 메시지를 잠시 숨길 뿐, 성공 삭제가 오기 전까지는 다시 나타날 수 있습니다.',
    risk: '작업 시간이 visibility timeout보다 길면 같은 메시지가 다른 워커에게 다시 전달됩니다. 반대로 timeout을 너무 길게 잡으면 실패한 작업이 오래 묶여 복구가 늦어집니다.',
    payoff: '이 개념을 알면 작업 처리 시간을 현실적으로 측정하고, 중복 실행을 전제로 안전한 워커를 만들 수 있습니다.',
    principles: [
      '첫 번째는 처리 시간과 timeout의 관계입니다. 평균이 아니라 느린 경우까지 보고 timeout을 정해야 합니다.',
      '두 번째는 멱등성입니다. 메시지는 한 번만 처리된다고 가정하면 안 됩니다. 작업 ID, 이벤트 ID, 상태 전이를 기준으로 중복 실행을 막아야 합니다.',
      '세 번째는 연장과 실패 처리입니다. 긴 작업은 heartbeat나 timeout 연장을 쓰고, 반복 실패 메시지는 dead letter queue로 보내 원인을 따로 봐야 합니다.',
    ],
    example: '이미지 변환 작업이 보통 20초지만 가끔 3분 걸린다고 합시다. visibility timeout이 60초라면 느린 작업은 아직 처리 중인데 큐에 다시 보입니다. 두 워커가 같은 이미지를 변환하고, 결과 파일을 서로 덮어쓸 수 있습니다.',
    checklist: [
      '작업 시간의 p95, p99가 visibility timeout보다 충분히 짧은가?',
      '작업이 중복 실행되어도 최종 상태가 망가지지 않는가?',
      '긴 작업은 timeout을 연장하거나 작은 작업으로 나뉘어 있는가?',
      '반복 실패 메시지는 DLQ로 이동하고 알림이 가는가?',
      '메시지 삭제는 실제 처리 성공 뒤에만 수행되는가?',
    ],
    misconceptions: [
      '“큐에서 받았으니 내 것이다”라는 오해가 있습니다. 처리 성공을 확정하기 전까지 메시지는 다시 나타날 수 있습니다.',
      '“timeout을 아주 길게 잡으면 안전하다”도 위험합니다. 워커가 죽었을 때 복구가 늦어지고 큐 지연이 커집니다.',
      '“중복은 큐가 막아준다”는 생각도 부족합니다. 대부분의 분산 큐는 적어도 한 번 전달을 기준으로 설계됩니다.',
    ],
    actions: [
      '가장 오래 걸리는 큐 작업의 처리 시간 분포를 확인하세요.',
      '작업 결과 저장 경로에 idempotency key나 상태 전이 조건을 넣으세요.',
      'DLQ 메시지를 운영자가 쉽게 볼 수 있는 대시보드에 올리세요.',
    ],
    links: [
      { title: 'Google Cloud Pub/Sub: Exactly-once delivery', url: 'https://cloud.google.com/pubsub/docs/exactly-once-delivery' },
      { title: 'RabbitMQ: Consumer acknowledgements', url: 'https://www.rabbitmq.com/docs/confirms' },
    ],
    takeaway: '큐 작업은 한 번 가져오면 끝이 아닙니다. 성공을 확인할 때까지 메시지는 다시 돌아올 수 있습니다.',
  },
  {
    slug: 'database-indexes',
    subject: '데이터베이스 인덱스',
    angle: '빠른 조회는 공짜가 아니다',
    description: '인덱스가 읽기 성능을 높이는 방식과 쓰기 비용, 선택도, 실행 계획을 함께 보는 법을 정리합니다.',
    sourceTitle: 'PostgreSQL Docs: Indexes',
    sourceUrl: 'https://www.postgresql.org/docs/current/indexes.html',
    sourceAuthor: 'PostgreSQL Global Development Group',
    tags: ['Databases', 'Performance', 'SQL'],
    example: '주문 테이블에서 `WHERE user_id = ? ORDER BY created_at DESC LIMIT 20` 쿼리가 자주 쓰인다면 `user_id`만 있는 인덱스보다 `(user_id, created_at)` 복합 인덱스가 더 적합할 수 있습니다. 하지만 모든 필드에 인덱스를 붙이면 주문 생성과 업데이트가 느려집니다.',
    checklist: [
      '느린 쿼리의 WHERE, JOIN, ORDER BY가 어떤 인덱스를 실제로 쓰는가?',
      '인덱스 컬럼의 선택도가 충분한가?',
      '복합 인덱스의 컬럼 순서가 실제 쿼리 패턴과 맞는가?',
      '쓰기 빈도가 높은 테이블에 불필요한 인덱스가 쌓여 있지 않은가?',
      'EXPLAIN 결과를 보고 추측과 실제 실행 계획을 비교했는가?',
    ],
    misconceptions: [
      '“인덱스는 많을수록 빠르다”는 오해가 있습니다. 인덱스는 읽기를 돕지만 쓰기와 저장 공간 비용을 늘립니다.',
      '“컬럼 하나씩 인덱스를 만들면 된다”도 부족합니다. 실제 쿼리는 여러 조건과 정렬을 함께 사용합니다.',
      '“개발 DB에서 빠르면 운영도 빠르다”는 판단은 위험합니다. 데이터 크기와 분포가 바뀌면 실행 계획도 바뀝니다.',
    ],
    actions: [
      '가장 느린 쿼리 하나를 골라 EXPLAIN을 읽어보세요.',
      '사용되지 않는 인덱스를 찾아 제거 후보로 분류하세요.',
      '새 인덱스는 어떤 쿼리를 빠르게 만들고 어떤 쓰기를 느리게 할지 PR에 적으세요.',
    ],
    takeaway: '인덱스는 검색을 빠르게 하는 마법이 아니라, 읽기와 쓰기 사이의 명시적인 거래입니다.',
  },
  {
    slug: 'cache-invalidation',
    subject: '캐시 무효화',
    angle: '빠른 데이터보다 맞는 데이터가 먼저다',
    description: '캐시 TTL, 삭제, 갱신 전략을 데이터 신선도와 장애 대응 관점에서 설명합니다.',
    sourceTitle: 'AWS Whitepaper: Caching challenges and strategies',
    sourceUrl: 'https://docs.aws.amazon.com/whitepapers/latest/database-caching-strategies-using-redis/caching-challenges-and-strategies.html',
    sourceAuthor: 'Amazon Web Services',
    tags: ['Caching', 'Performance', 'Reliability'],
    example: '상품 가격을 10분 캐시한다고 합시다. 조회는 빨라지지만 가격 변경 직후 사용자는 오래된 가격을 볼 수 있습니다. 결제처럼 정확성이 중요한 경로에서는 캐시 값을 그대로 믿지 않고 원본 저장소에서 다시 확인해야 합니다.',
    checklist: [
      '캐시된 값이 틀렸을 때 사용자나 비즈니스 피해가 얼마나 큰가?',
      'TTL은 데이터 변경 빈도와 허용 가능한 오래됨을 기준으로 정했는가?',
      '쓰기 후 캐시 삭제나 갱신이 실패하면 어떻게 복구되는가?',
      '캐시 stampede를 막는 보호 장치가 있는가?',
      '캐시 hit rate뿐 아니라 stale 데이터 문제도 추적하는가?',
    ],
    misconceptions: [
      '“TTL만 있으면 언젠가 맞아진다”는 말은 운영 피해를 과소평가합니다. 언젠가 맞는 것과 지금 안전한 것은 다릅니다.',
      '“캐시는 읽기 성능 문제다”도 부족합니다. 캐시는 데이터 일관성과 장애 전파 방식까지 바꿉니다.',
      '“삭제하면 끝”이라는 생각도 위험합니다. 삭제 요청 자체가 실패하거나 순서가 뒤집힐 수 있습니다.',
    ],
    actions: [
      '캐시된 데이터 하나를 골라 허용 가능한 stale 시간을 명확히 적으세요.',
      '쓰기 경로에서 캐시 삭제 실패를 로그와 지표로 남기세요.',
      '핵심 경로는 캐시 값을 다시 검증해야 하는지 확인하세요.',
    ],
    links: [
      { title: 'Cloudflare: Cache concepts', url: 'https://developers.cloudflare.com/cache/concepts/' },
      { title: 'Redis Docs: Caching', url: 'https://redis.io/solutions/caching/' },
    ],
    takeaway: '캐시의 목표는 빠른 오답이 아니라, 충분히 빠른 정답을 안정적으로 주는 것입니다.',
  },
  {
    slug: 'secret-rotation',
    subject: '시크릿 로테이션',
    angle: '비밀은 한 번 만들고 잊는 값이 아니다',
    description: 'API 키와 토큰을 안전하게 교체하기 위한 이중 키, 배포 순서, 만료 정책을 정리합니다.',
    sourceTitle: 'AWS Secrets Manager: Rotate secrets',
    sourceUrl: 'https://docs.aws.amazon.com/secretsmanager/latest/userguide/rotating-secrets.html',
    sourceAuthor: 'Amazon Web Services',
    tags: ['Security', 'Operations', 'Configuration'],
    example: '결제 API 키를 바꿔야 하는데 서버 20대가 환경 변수를 읽고 있다고 합시다. 새 키를 발급하고, 앱이 새 키와 옛 키를 모두 허용하는 기간을 둔 뒤, 모든 인스턴스 배포가 끝난 것을 확인하고 옛 키를 폐기해야 끊김이 없습니다.',
    checklist: [
      '시크릿이 코드, 로그, 빌드 산출물에 남지 않는가?',
      '새 키와 옛 키가 공존할 수 있는 전환 기간이 있는가?',
      '키 교체 후 실제로 새 키가 사용되는지 확인할 지표가 있는가?',
      '폐기한 키로 요청이 들어오면 알림을 받을 수 있는가?',
      '정기 로테이션과 긴급 유출 대응 절차가 구분되어 있는가?',
    ],
    misconceptions: [
      '“환경 변수에 넣었으니 안전하다”는 오해가 있습니다. 환경 변수도 프로세스, 로그, 디버깅 도구를 통해 노출될 수 있습니다.',
      '“키를 바꾸면 끝”도 부족합니다. 모든 클라이언트가 새 키를 쓰는지, 옛 키가 정말 막혔는지 확인해야 합니다.',
      '“유출 사고 때만 교체하면 된다”는 접근은 늦습니다. 평소에 교체 가능한 구조여야 긴급 상황에서도 움직입니다.',
    ],
    actions: [
      '가장 오래된 API 키 하나를 찾아 소유자와 사용처를 확인하세요.',
      '시크릿 교체 절차를 실제로 한 번 리허설해보세요.',
      '로그에서 토큰 형태의 문자열이 마스킹되는지 테스트하세요.',
    ],
    links: [
      { title: 'OWASP Secrets Management Cheat Sheet', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html' },
      { title: 'Google Cloud Secret Manager rotation', url: 'https://cloud.google.com/secret-manager/docs/rotation-recommendations' },
    ],
    takeaway: '시크릿 관리는 숨기는 일이 아니라, 안전하게 바꾸고 폐기할 수 있게 만드는 일입니다.',
  },
  {
    slug: 'pagination-cursors',
    subject: '커서 페이지네이션',
    angle: '다음 페이지는 숫자가 아니라 위치다',
    description: 'offset pagination의 한계와 cursor 기반 페이지네이션이 무한 스크롤과 변경 많은 데이터에 유리한 이유를 설명합니다.',
    sourceTitle: 'GraphQL Docs: Pagination',
    sourceUrl: 'https://graphql.org/learn/pagination/',
    sourceAuthor: 'GraphQL Foundation',
    tags: ['API Design', 'Databases', 'Performance'],
    example: '피드에서 `OFFSET 1000 LIMIT 20`을 쓰면 앞쪽 데이터가 추가되거나 삭제될 때 같은 항목이 다시 보이거나 건너뛸 수 있습니다. `created_at`과 `id`를 묶은 커서를 쓰면 마지막으로 본 위치 이후의 데이터를 안정적으로 가져올 수 있습니다.',
    checklist: [
      '정렬 기준이 항상 결정적이고 고유한가?',
      '커서가 사용자가 임의로 조작해도 안전한 형태인가?',
      '새 데이터가 끼어드는 상황에서 중복과 누락이 허용 범위 안인가?',
      '역방향 페이지 이동이 필요한지 제품 요구사항을 확인했는가?',
      '커서에 담긴 필드 변경이 API 호환성을 깨지 않는가?',
    ],
    misconceptions: [
      '“페이지 번호가 사용자에게 더 쉽다”는 말은 일부 화면에서만 맞습니다. 끝없는 피드나 로그에서는 위치 기반이 더 자연스럽습니다.',
      '“커서는 그냥 마지막 ID다”도 부족합니다. 정렬 기준이 시간이라면 동률을 깨는 ID까지 함께 필요할 수 있습니다.',
      '“offset도 인덱스 있으면 괜찮다”는 생각은 큰 offset에서 비용과 일관성 문제를 놓칩니다.',
    ],
    actions: [
      '무한 스크롤 API 하나를 골라 중복과 누락 가능성을 테스트하세요.',
      '정렬 기준에 동률이 생길 때 결과 순서가 흔들리지 않는지 확인하세요.',
      '커서 포맷을 외부 계약으로 보고 버전 변경 가능성을 고려하세요.',
    ],
    links: [
      { title: 'Stripe API pagination', url: 'https://docs.stripe.com/api/pagination' },
      { title: 'PostgreSQL: LIMIT and OFFSET', url: 'https://www.postgresql.org/docs/current/queries-limit.html' },
    ],
    takeaway: '커서 페이지네이션은 몇 번째 묶음인지보다, 마지막으로 어디까지 봤는지를 더 정확히 기억합니다.',
  },
  {
    slug: 'rate-limit-budget',
    subject: '사용량 예산',
    angle: '한도는 차단선이 아니라 운영 계약이다',
    description: 'API 사용량, 비용, 공정성을 다루기 위한 quota와 budget 설계 원칙을 설명합니다.',
    sourceTitle: 'Google Cloud: Quotas and limits',
    sourceUrl: 'https://cloud.google.com/docs/quotas',
    sourceAuthor: 'Google Cloud',
    tags: ['API Design', 'Cost', 'Operations'],
    example: 'AI 요약 API를 조직별 월간 예산과 사용자별 분당 한도로 나누면 비용 폭주와 단일 사용자의 남용을 따로 제어할 수 있습니다. 둘 중 하나만 있으면 공정성이나 비용 중 한쪽이 비게 됩니다.',
    checklist: [
      '제한 기준이 사용자, 조직, API 키, 기능 비용 중 무엇인지 명확한가?',
      '한도 초과 응답이 다음 행동을 안내하는가?',
      '운영자가 임시 증액과 차단을 감사 로그와 함께 수행할 수 있는가?',
      '사용자가 자신의 남은 예산을 볼 수 있는가?',
      '무료, 유료, 내부 트래픽 정책이 서로 섞이지 않았는가?',
    ],
    misconceptions: [
      '“한도는 고객을 막는 장치”라는 오해가 있습니다. 좋은 한도는 서비스를 계속 쓰게 만드는 공정성의 장치입니다.',
      '“비용 큰 기능만 보면 된다”도 부족합니다. 낮은 비용 요청도 반복되면 장애를 만들 수 있습니다.',
      '“운영자가 수동으로 풀어주면 된다”는 방식은 감사와 일관성을 잃기 쉽습니다.',
    ],
    actions: [
      '가장 비용 큰 API의 호출자를 상위 순으로 확인하세요.',
      '한도 초과 메시지가 사용자에게 남은 시간이나 대안을 알려주는지 보세요.',
      '예외 증액 절차를 문서화하고 만료 시간을 두세요.',
    ],
    links: [
      { title: 'GitHub REST API rate limits', url: 'https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api' },
      { title: 'OpenAI API rate limits guide', url: 'https://platform.openai.com/docs/guides/rate-limits' },
    ],
    takeaway: '사용량 예산은 사용자를 밀어내는 선이 아니라, 모두가 예측 가능하게 쓰기 위한 약속입니다.',
  },
  {
    slug: 'outbox-pattern',
    subject: '아웃박스 패턴',
    angle: 'DB 저장과 이벤트 발행 사이의 틈을 줄이는 법',
    description: '트랜잭션 아웃박스가 데이터 변경과 메시지 발행의 일관성을 다루는 방식을 정리합니다.',
    sourceTitle: 'microservices.io: Transactional outbox',
    sourceUrl: 'https://microservices.io/patterns/data/transactional-outbox.html',
    sourceAuthor: 'Chris Richardson',
    tags: ['Architecture', 'Messaging', 'Databases'],
    example: '주문 상태를 DB에 결제 완료로 바꾼 뒤 Kafka 이벤트를 발행해야 한다고 합시다. DB 저장은 성공했는데 이벤트 발행 전에 서버가 죽으면 다른 서비스는 결제 완료를 모릅니다. 아웃박스는 같은 DB 트랜잭션 안에 발행할 이벤트를 기록하고, 별도 프로세스가 안정적으로 내보내게 합니다.',
    checklist: [
      '상태 변경과 이벤트 기록이 같은 트랜잭션 안에서 일어나는가?',
      '이벤트 발행기는 중복 발행을 전제로 설계되었는가?',
      '아웃박스 테이블 적체와 실패율을 모니터링하는가?',
      '이벤트 순서가 중요한 aggregate 기준으로 보장되는가?',
      '소비자는 이벤트 ID로 중복 처리를 막는가?',
    ],
    misconceptions: [
      '“DB 저장 후 바로 publish하면 충분하다”는 오해가 있습니다. 두 작업 사이의 아주 짧은 틈이 운영에서는 데이터 불일치가 됩니다.',
      '“아웃박스를 쓰면 exactly once가 된다”도 틀립니다. 보통은 중복 가능성을 소비자와 함께 다룹니다.',
      '“이벤트 브로커 트랜잭션만 쓰면 된다”는 생각도 시스템 경계와 저장소 종류에 따라 맞지 않을 수 있습니다.',
    ],
    actions: [
      '중요한 이벤트 발행 경로 하나에서 DB 성공 후 publish 실패 시나리오를 그려보세요.',
      '소비자 중복 처리 키가 실제로 저장되는지 확인하세요.',
      '아웃박스 적체가 사용자 영향으로 이어지기 전에 알림을 걸어두세요.',
    ],
    links: [
      { title: 'Debezium: Outbox event router', url: 'https://debezium.io/documentation/reference/stable/transformations/outbox-event-router.html' },
      { title: 'AWS Prescriptive Guidance: Transactional outbox', url: 'https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/transactional-outbox.html' },
    ],
    takeaway: '아웃박스 패턴은 저장과 발행을 완벽히 하나로 만들기보다, 실패해도 따라잡을 수 있는 기록을 남깁니다.',
  },
  {
    slug: 'slo-error-budget',
    subject: 'SLO와 에러 버짓',
    angle: '완벽한 안정성 대신 합의된 위험을 관리한다',
    description: '서비스 수준 목표와 에러 버짓이 기능 출시와 안정성 투자를 조율하는 방법을 설명합니다.',
    sourceTitle: 'Google SRE Workbook: Implementing SLOs',
    sourceUrl: 'https://sre.google/workbook/implementing-slos/',
    sourceAuthor: 'Google SRE',
    tags: ['SRE', 'Reliability', 'Operations'],
    example: '월간 가용성 목표가 99.9%라면 약 43분의 실패 여유가 있습니다. 이 여유를 빠르게 소진한다면 새 기능 출시보다 안정성 개선을 우선해야 한다는 신호가 됩니다.',
    checklist: [
      'SLO가 내부 시스템 지표가 아니라 사용자 경험에 가까운가?',
      '측정 기간과 제외 조건이 명확한가?',
      '에러 버짓 소진 속도를 보고 출시 정책이 바뀌는가?',
      '알림이 SLO 위반 위험과 연결되어 있는가?',
      '제품팀과 엔지니어링팀이 같은 목표를 보고 있는가?',
    ],
    misconceptions: [
      '“100% 안정성이 목표”라는 말은 현실적인 의사결정을 흐립니다. 비용과 속도까지 고려하면 목표 수준을 합의하는 편이 낫습니다.',
      '“SLO는 운영팀 문서”도 아닙니다. 사용자의 기대와 제품 약속을 기술 지표로 바꾸는 작업입니다.',
      '“한 번 정하면 끝”도 아닙니다. 사용자 규모와 제품 성격이 바뀌면 SLO도 다시 봐야 합니다.',
    ],
    actions: [
      '핵심 사용자 여정 하나를 골라 성공률 SLO 초안을 만들어보세요.',
      '최근 한 달 장애가 에러 버짓을 얼마나 썼는지 계산하세요.',
      'SLO 위반 위험이 커질 때 출시를 늦출 기준을 정하세요.',
    ],
    links: [
      { title: 'Google SRE Book: Service Level Objectives', url: 'https://sre.google/sre-book/service-level-objectives/' },
      { title: 'Atlassian: SLOs, SLIs and SLAs', url: 'https://www.atlassian.com/incident-management/kpis/sla-vs-slo-vs-sli' },
    ],
    takeaway: '에러 버짓은 장애를 허락하는 면죄부가 아니라, 속도와 안정성의 대화를 숫자로 만드는 도구입니다.',
  },
  {
    slug: 'connection-pooling',
    subject: '커넥션 풀',
    angle: '연결을 아끼지 않으면 빠른 서비스도 멈춘다',
    description: 'DB와 외부 서비스 커넥션 풀의 크기, 대기열, 타임아웃을 설계하는 법을 정리합니다.',
    sourceTitle: 'HikariCP Wiki: About pool sizing',
    sourceUrl: 'https://github.com/brettwooldridge/HikariCP/wiki/About-Pool-Sizing',
    sourceAuthor: 'HikariCP',
    tags: ['Databases', 'Performance', 'Reliability'],
    example: '웹 서버 인스턴스 20대가 각각 DB 커넥션 풀 50개를 열면 최대 1000개 연결이 됩니다. DB가 감당할 수 있는 연결 수보다 크면 요청이 늘어난 순간 처리량이 늘기보다 context switching과 대기만 늘어납니다.',
    checklist: [
      '전체 인스턴스 수를 곱한 최대 커넥션 수가 DB 한도 안에 있는가?',
      '풀 대기 시간과 획득 실패를 지표로 보고 있는가?',
      '느린 쿼리가 커넥션을 오래 붙잡고 있지 않은가?',
      '외부 API 클라이언트도 연결과 동시성 한도를 갖고 있는가?',
      '풀 크기 조정이 부하 테스트로 검증되었는가?',
    ],
    misconceptions: [
      '“풀을 크게 하면 더 빠르다”는 오해가 있습니다. 병렬성이 늘어도 DB가 처리할 수 있는 일의 양은 제한되어 있습니다.',
      '“커넥션 에러는 DB 문제”라고만 보면 애플리케이션의 대기열과 timeout 설정을 놓칩니다.',
      '“기본값이면 충분하다”는 생각도 위험합니다. 인스턴스 수와 트래픽 패턴에 따라 기본값은 과하거나 부족할 수 있습니다.',
    ],
    actions: [
      '서비스 전체 최대 DB 커넥션 수를 계산하세요.',
      '커넥션 획득 대기 시간을 대시보드에 추가하세요.',
      '느린 쿼리와 풀 고갈이 같은 시간에 발생하는지 비교하세요.',
    ],
    links: [
      { title: 'PostgreSQL Docs: Managing kernel resources', url: 'https://www.postgresql.org/docs/current/kernel-resources.html' },
      { title: 'Microsoft Learn: Connection pooling', url: 'https://learn.microsoft.com/en-us/dotnet/framework/data/adonet/sql-server-connection-pooling' },
    ],
    takeaway: '커넥션 풀은 많이 열수록 좋은 수도꼭지가 아니라, 병목을 통제하기 위한 제한 장치입니다.',
  },
];

const generatedKnowledgeTopicBank = [
  {
    slug: 'anchoring-bias',
    subject: '앵커링 효과',
    angle: '처음 본 숫자가 판단을 붙잡는다',
    description: '협상, 가격, 의사결정에서 첫 정보가 이후 판단에 강한 기준점이 되는 현상을 설명합니다.',
    sourceTitle: 'The Decision Lab: Anchoring Bias',
    sourceUrl: 'https://thedecisionlab.com/biases/anchoring-bias',
    sourceAuthor: 'The Decision Lab',
    tags: ['Psychology', 'Decision Making', 'Behavior'],
    intro: '사람은 새 정보를 볼 때 완전히 빈 상태에서 판단하지 않습니다. 처음 본 숫자, 처음 들은 설명, 먼저 제시된 선택지가 마음속 기준점이 됩니다.',
    explain: [
      '앵커링 효과는 처음 접한 정보가 이후 판단에 과도한 영향을 주는 인지 편향입니다. 가격표, 예상 일정, 연봉 제안, 뉴스의 첫 문장이 모두 앵커가 될 수 있습니다.',
      '흥미로운 점은 앵커가 반드시 합리적이거나 관련성이 높을 필요가 없다는 것입니다. 무작위 숫자조차 사람의 추정값을 끌어당길 수 있다는 연구들이 이 효과를 보여줍니다.',
      '핵심은 기준점의 힘입니다. 우리는 기준점에서 조금씩 조정한다고 느끼지만, 실제로는 충분히 멀리 조정하지 못하는 경우가 많습니다.',
    ],
    why: [
      '가격 협상에서는 먼저 제시된 금액이 대화의 범위를 좁힙니다. 제품 할인 전 가격, 부동산 호가, 프로젝트 일정 추정치가 모두 이후 판단의 출발점이 됩니다.',
      '조직 의사결정에서도 첫 의견이 강한 앵커가 됩니다. 회의 초반에 나온 숫자가 검증되지 않았더라도 뒤의 논의는 그 주변에서 맴돌기 쉽습니다.',
      '앵커링을 알면 처음 제시된 정보와 근거의 품질을 분리해서 볼 수 있습니다. 빠른 기준점은 편리하지만, 중요한 판단에서는 일부러 다른 기준점을 찾아야 합니다.',
    ],
    examples: [
      '정가 10만 원에 50% 할인이라고 적힌 상품은 처음부터 5만 원으로 제시된 상품보다 싸게 느껴질 수 있습니다.',
      '개발 일정 회의에서 누군가 “2주면 되지 않을까”라고 말하면, 충분한 분석 전에도 논의가 2주 주변에서 시작될 수 있습니다.',
      '중고 거래에서 판매자가 높은 가격을 먼저 부르면 구매자는 그 가격을 기준으로 깎는 폭을 생각하게 됩니다.',
    ],
    misconceptions: [
      '앵커링 효과는 어리석은 사람만 겪는 현상이 아닙니다. 전문가도 시간 압박과 정보 부족 상황에서는 기준점의 영향을 받습니다.',
      '첫 정보가 항상 틀렸다는 뜻도 아닙니다. 문제는 그 정보가 근거보다 더 큰 힘을 가질 때입니다.',
      '앵커를 무시하겠다고 마음먹는 것만으로 충분하지 않습니다. 대안 기준과 독립적인 추정 절차가 필요합니다.',
    ],
    actions: [
      '중요한 숫자를 결정할 때 첫 제안과 독립적으로 계산한 값을 따로 적어보세요.',
      '회의에서는 첫 추정치를 말하기 전에 각자 조용히 추정한 값을 먼저 모아보세요.',
      '가격을 볼 때 할인율보다 최종 지불 가치와 대체재 가격을 함께 비교하세요.',
    ],
    links: [
      { title: 'Wikipedia: Anchoring effect', url: 'https://en.wikipedia.org/wiki/Anchoring_effect' },
      { title: 'Nielsen Norman Group: Anchoring Bias', url: 'https://www.nngroup.com/articles/anchoring-bias/' },
    ],
    takeaway: '처음 본 숫자는 출발점처럼 보이지만, 종종 생각의 울타리가 됩니다.',
  },
  {
    slug: 'confirmation-bias',
    subject: '확증 편향',
    angle: '믿고 싶은 증거가 더 잘 보인다',
    description: '사람이 기존 믿음을 지지하는 정보는 쉽게 받아들이고 반대 정보는 덜 보는 경향을 설명합니다.',
    sourceTitle: 'Britannica: Confirmation bias',
    sourceUrl: 'https://www.britannica.com/science/confirmation-bias',
    sourceAuthor: 'Encyclopaedia Britannica',
    tags: ['Psychology', 'Thinking', 'Decision Making'],
    explain: [
      '확증 편향은 기존 믿음이나 가설을 지지하는 정보를 더 찾고, 더 기억하고, 더 설득력 있게 느끼는 경향입니다.',
      '이 편향은 정보를 일부러 왜곡하는 행동만을 뜻하지 않습니다. 검색어 선택, 읽는 기사, 기억에 남는 사례, 반박을 대하는 태도에서 조용히 작동합니다.',
      '핵심은 생각의 편안함입니다. 사람은 자신의 세계관을 흔드는 정보보다 이미 가진 생각을 정리해주는 정보를 더 빨리 이해합니다.',
    ],
    why: [
      '소셜 미디어와 추천 알고리즘은 확증 편향을 키우기 쉽습니다. 내가 반응한 정보와 비슷한 정보가 더 많이 오면 세상이 내 생각과 비슷하게만 보입니다.',
      '투자, 채용, 제품 기획에서도 위험합니다. 마음에 든 후보나 아이디어가 생기면 좋은 신호만 모으고 경고 신호를 설명해버릴 수 있습니다.',
      '확증 편향을 줄이는 목적은 의견을 없애는 것이 아닙니다. 의견을 갖되, 그 의견이 틀렸을 가능성을 확인할 절차를 두는 것입니다.',
    ],
    examples: [
      '새 제품 아이디어가 마음에 들면 긍정적인 사용자 반응 몇 개는 크게 보이고, 무관심한 다수의 신호는 “아직 몰라서 그렇다”고 넘길 수 있습니다.',
      '건강 정보를 찾을 때 이미 믿는 치료법 이름과 “효과”를 함께 검색하면 반대 근거보다 지지 사례를 더 많이 보게 됩니다.',
      '팀원이 마음에 들지 않으면 같은 실수도 성격 문제로 해석하고, 마음에 드는 사람의 실수는 상황 탓으로 돌릴 수 있습니다.',
    ],
    misconceptions: [
      '확증 편향은 고집 센 사람만의 문제가 아닙니다. 누구나 빠르게 판단해야 할 때 자기 믿음에 기대기 쉽습니다.',
      '반대 의견을 한 번 읽는 것만으로 해결되지 않습니다. 어떤 반대 증거가 실제로 내 결론을 바꿀지 미리 정해야 합니다.',
      '모든 의견을 같은 무게로 보라는 뜻도 아닙니다. 근거의 품질을 따지되, 불편한 근거를 자동으로 낮게 평가하지 말자는 뜻입니다.',
    ],
    actions: [
      '중요한 결론을 내리기 전에 “이 생각이 틀렸다면 어떤 증거가 보여야 할까”를 적어보세요.',
      '검색할 때 내 주장과 반대되는 문장으로도 한 번 찾아보세요.',
      '회의에서 한 사람에게 의도적으로 반대 근거 수집 역할을 맡겨보세요.',
    ],
    links: [
      { title: 'Wikipedia: Confirmation bias', url: 'https://en.wikipedia.org/wiki/Confirmation_bias' },
      { title: 'APA Dictionary: confirmation bias', url: 'https://dictionary.apa.org/confirmation-bias' },
    ],
    takeaway: '좋은 판단은 증거를 많이 모으는 것보다, 내 생각을 흔드는 증거도 들어오게 만드는 데서 시작합니다.',
  },
  {
    slug: 'planning-fallacy',
    subject: '계획 오류',
    angle: '우리는 미래의 방해를 너무 작게 본다',
    description: '일정과 비용을 예측할 때 낙관적으로 과소평가하는 계획 오류를 프로젝트와 일상에 연결합니다.',
    sourceTitle: 'APA Dictionary: planning fallacy',
    sourceUrl: 'https://dictionary.apa.org/planning-fallacy',
    sourceAuthor: 'American Psychological Association',
    tags: ['Psychology', 'Productivity', 'Decision Making'],
    explain: [
      '계획 오류는 사람들이 작업을 끝내는 데 필요한 시간, 비용, 노력을 반복적으로 과소평가하는 경향입니다.',
      '문제는 경험이 없어서만 생기지 않습니다. 과거에도 늦었는데 이번에는 다를 것이라고 생각하는 순간에도 계획 오류가 작동합니다.',
      '핵심은 내부 관점의 함정입니다. 우리는 이번 작업의 의도와 순서를 자세히 보지만, 과거 비슷한 작업들이 실제로 얼마나 지연되었는지는 덜 봅니다.',
    ],
    why: [
      '프로젝트 일정은 기술 문제가 아니라 신뢰 문제입니다. 반복적으로 낙관적인 일정은 팀의 집중력과 이해관계자의 신뢰를 동시에 깎습니다.',
      '개인 일정에서도 마찬가지입니다. 이동 시간, 준비 시간, 컨텍스트 전환, 예상 못 한 질문을 빼고 계획하면 하루가 늘 밀립니다.',
      '계획 오류를 이해하면 의지가 아니라 기준을 바꾸게 됩니다. “열심히 하면 된다”보다 과거 데이터와 버퍼를 쓰는 편이 더 정직합니다.',
    ],
    examples: [
      '간단한 기능이라고 생각했는데 권한, 빈 상태, 에러 처리, QA, 배포 승인까지 붙으면서 일정이 두 배가 될 수 있습니다.',
      '이사 준비를 하루면 된다고 생각하지만 포장재 구매, 주소 변경, 청소, 예상 못 한 수리까지 시간이 늘어납니다.',
      '글 하나를 쓰는 시간도 초안 작성만 계산하면 짧아 보이지만 자료 확인, 편집, 이미지, 발행 확인까지 포함하면 달라집니다.',
    ],
    misconceptions: [
      '계획 오류는 게으름의 문제가 아닙니다. 성실한 사람도 불확실성을 낮게 잡으면 같은 오류를 냅니다.',
      '버퍼를 넣는 것은 비효율이 아닙니다. 변동성이 있는 일을 현실적으로 다루는 방법입니다.',
      '과거 평균만 보면 충분하다는 뜻도 아닙니다. 이번 작업이 과거와 어떤 점에서 다른지 함께 봐야 합니다.',
    ],
    actions: [
      '새 일정 추정 전에 비슷한 과거 작업 세 개의 실제 소요 시간을 확인하세요.',
      '작업을 “개발 완료”가 아니라 검증과 배포까지 포함한 완료 기준으로 나누세요.',
      '일정에는 집중 시간뿐 아니라 리뷰 대기와 컨텍스트 전환 비용도 넣어보세요.',
    ],
    links: [
      { title: 'Wikipedia: Planning fallacy', url: 'https://en.wikipedia.org/wiki/Planning_fallacy' },
      { title: 'LessWrong: Planning fallacy', url: 'https://www.lesswrong.com/tag/planning-fallacy' },
    ],
    takeaway: '계획은 의지의 선언이 아니라, 과거의 방해까지 포함한 예측이어야 합니다.',
  },
  {
    slug: 'loss-aversion',
    subject: '손실 회피',
    angle: '잃는 고통은 얻는 기쁨보다 크게 느껴진다',
    description: '같은 크기의 이익과 손실을 다르게 느끼는 손실 회피가 선택과 협상에 미치는 영향을 설명합니다.',
    sourceTitle: 'The Decision Lab: Loss Aversion',
    sourceUrl: 'https://thedecisionlab.com/biases/loss-aversion',
    sourceAuthor: 'The Decision Lab',
    tags: ['Behavioral Economics', 'Psychology', 'Decision Making'],
    explain: [
      '손실 회피는 같은 크기의 이익보다 손실을 더 강하게 느끼는 경향입니다. 10만 원을 얻는 기쁨보다 10만 원을 잃는 고통이 더 크게 다가올 수 있습니다.',
      '이 현상은 행동경제학에서 중요한 개념으로, 사람들이 위험을 피하거나 이미 가진 것을 과하게 지키려는 행동을 설명합니다.',
      '핵심은 기준점입니다. 무엇을 이미 내 것이라고 느끼는지에 따라 같은 변화도 이익이나 손실로 다르게 해석됩니다.',
    ],
    why: [
      '제품과 가격 정책에서는 무료 체험 종료, 기능 제거, 요금제 변경이 강한 반발을 부를 수 있습니다. 사용자는 새 혜택보다 잃는 기능을 더 크게 봅니다.',
      '투자에서는 손실을 확정하기 싫어 손해 난 자산을 오래 붙잡는 행동으로 이어질 수 있습니다.',
      '손실 회피를 이해하면 변화 관리가 달라집니다. 사람들에게 무엇을 얻게 되는지만 말하지 말고, 무엇을 잃는다고 느끼는지도 다뤄야 합니다.',
    ],
    examples: [
      '앱에서 자주 쓰던 버튼 위치가 바뀌면 새 디자인이 더 좋아도 사용자는 익숙함을 잃었다고 느낄 수 있습니다.',
      '협상에서 같은 금액이라도 “할인 제공”보다 “할인 종료”가 더 강한 행동을 유도할 수 있습니다.',
      '정리해야 할 물건을 버리지 못하는 이유도 이미 가진 것의 손실을 크게 느끼기 때문일 수 있습니다.',
    ],
    misconceptions: [
      '손실 회피는 비합리적이라는 비난으로 끝낼 개념이 아닙니다. 손실에 민감한 태도는 생존과 안전에 도움이 되었던 면도 있습니다.',
      '모든 사람이 항상 손실을 피한다는 뜻도 아닙니다. 상황과 성향, 손실의 의미에 따라 위험을 감수하기도 합니다.',
      '손실을 강조하면 언제나 설득이 잘 된다는 뜻도 아닙니다. 과도한 위협은 불신과 피로를 만듭니다.',
    ],
    actions: [
      '변경을 안내할 때 사용자가 잃는다고 느낄 요소를 먼저 목록으로 적어보세요.',
      '투자나 구매 결정에서는 “손실을 확정하기 싫어서 미루는가”를 따로 물어보세요.',
      '무언가를 정리할 때 이미 가진 비용보다 앞으로의 사용 가치로 다시 판단해보세요.',
    ],
    links: [
      { title: 'Wikipedia: Loss aversion', url: 'https://en.wikipedia.org/wiki/Loss_aversion' },
      { title: 'Nobel Prize: Daniel Kahneman facts', url: 'https://www.nobelprize.org/prizes/economic-sciences/2002/kahneman/facts/' },
    ],
    takeaway: '사람은 변화의 총합보다 잃는 부분을 먼저 봅니다. 좋은 설득은 그 감각을 무시하지 않습니다.',
  },
  {
    slug: 'network-effect',
    subject: '네트워크 효과',
    angle: '사람이 늘수록 가치도 달라진다',
    description: '사용자 수가 제품 가치에 영향을 주는 네트워크 효과의 힘과 한계를 설명합니다.',
    sourceTitle: 'Harvard Business Review: Managing Network Effects',
    sourceUrl: 'https://hbr.org/2019/01/managing-network-effects',
    sourceAuthor: 'Harvard Business Review',
    tags: ['Economics', 'Technology', 'Product'],
    explain: [
      '네트워크 효과는 사용자가 늘수록 제품이나 서비스의 가치가 함께 커지는 현상입니다. 전화, 메신저, 결제망, 마켓플레이스, 소셜 플랫폼이 대표적입니다.',
      '중요한 점은 규모 자체가 아니라 연결의 가치입니다. 사람이 많아도 서로 찾기 어렵거나 품질이 낮으면 네트워크 효과는 약해질 수 있습니다.',
      '네트워크 효과는 직접 효과와 간접 효과로 나뉩니다. 메신저는 친구가 많을수록 직접 가치가 커지고, 앱스토어는 사용자와 개발자가 서로를 끌어당기는 간접 효과를 가집니다.',
    ],
    why: [
      '네트워크 효과가 강한 시장에서는 초반 성장이 이후 경쟁력을 크게 좌우합니다. 사용자는 사람이 있는 곳으로 가고, 공급자는 수요가 있는 곳으로 갑니다.',
      '하지만 네트워크 효과는 품질 문제도 증폭합니다. 스팸, 허위 정보, 낮은 품질 공급자가 늘면 사람이 많다는 장점이 오히려 피로가 됩니다.',
      '이 개념을 알면 플랫폼의 성장을 단순 사용자 수가 아니라 연결 품질과 유동성으로 보게 됩니다.',
    ],
    examples: [
      '메신저 앱은 기능이 조금 부족해도 주변 사람이 모두 쓰면 가치가 커집니다.',
      '중고거래 플랫폼은 구매자와 판매자가 충분히 있어야 검색과 판매가 빨라집니다.',
      '개발자 생태계에서는 사용자가 많아야 라이브러리와 문서가 늘고, 자료가 많아질수록 다시 사용자가 늘어납니다.',
    ],
    misconceptions: [
      '네트워크 효과는 자동으로 생기지 않습니다. 같은 공간에 사용자를 모아도 서로에게 가치 있는 연결이 일어나야 합니다.',
      '크면 항상 강하다는 뜻도 아닙니다. 품질 관리가 실패하면 큰 네트워크는 큰 혼잡이 됩니다.',
      '초기 사용자가 적으면 불가능하다는 뜻도 아닙니다. 좁은 집단에서 강한 밀도를 먼저 만들 수 있습니다.',
    ],
    actions: [
      '플랫폼을 볼 때 전체 가입자보다 실제로 가치 있는 연결 수를 확인하세요.',
      '초기 서비스라면 넓은 시장보다 좁은 커뮤니티에서 밀도를 먼저 만드는 전략을 생각해보세요.',
      '사용자 증가가 품질 저하를 부르는 지점을 미리 정하고 관리 지표를 두세요.',
    ],
    links: [
      { title: 'Wikipedia: Network effect', url: 'https://en.wikipedia.org/wiki/Network_effect' },
      { title: 'a16z: Network effects', url: 'https://a16z.com/network-effects/' },
    ],
    takeaway: '네트워크 효과의 핵심은 숫자가 아니라, 그 숫자들이 서로에게 만들어주는 가치입니다.',
  },
  {
    slug: 'tragedy-of-commons',
    subject: '공유지의 비극',
    angle: '모두에게 열린 자원은 모두가 망칠 수도 있다',
    description: '공유 자원을 개인의 합리적 선택이 고갈시키는 문제와 제도 설계의 필요성을 설명합니다.',
    sourceTitle: 'Britannica: Tragedy of the commons',
    sourceUrl: 'https://www.britannica.com/science/tragedy-of-the-commons',
    sourceAuthor: 'Encyclopaedia Britannica',
    tags: ['Economics', 'Society', 'Environment'],
    explain: [
      '공유지의 비극은 누구나 쓸 수 있는 공동 자원이 개인의 합리적 사용 때문에 과도하게 소비되어 망가지는 현상을 말합니다.',
      '목초지, 어장, 대기, 도로, 공용 주방, 온라인 커뮤니티의 주의력까지 모두 공유 자원의 성격을 가질 수 있습니다.',
      '핵심은 개인의 이익과 전체의 지속 가능성이 어긋나는 구조입니다. 한 사람의 추가 사용은 작아 보여도 모두가 같은 선택을 하면 자원이 무너집니다.',
    ],
    why: [
      '환경 문제에서 이 개념은 매우 중요합니다. 오염과 탄소 배출은 개인이나 기업이 비용을 외부로 넘길 때 전체 사회의 부담으로 돌아옵니다.',
      '디지털 공간에서도 보입니다. 누구나 글을 올릴 수 있는 커뮤니티는 관리 규칙이 없으면 스팸과 저품질 콘텐츠로 가치가 떨어집니다.',
      '공유지의 비극을 이해하면 도덕적 비난보다 제도 설계가 중요하다는 점을 보게 됩니다. 좋은 규칙은 개인 선택과 공동 이익을 다시 맞춥니다.',
    ],
    examples: [
      '어장에서 각 어부가 조금 더 잡는 것은 개인에게 이익이지만, 모두가 그렇게 하면 물고기 수가 회복되지 못합니다.',
      '회사 공용 회의실을 아무 규칙 없이 예약하면 일부 사람이 과하게 선점하고 전체 생산성이 떨어질 수 있습니다.',
      '무료 API가 제한 없이 열려 있으면 일부 사용자의 과도한 호출이 전체 서비스 품질을 낮출 수 있습니다.',
    ],
    misconceptions: [
      '공유지는 반드시 실패한다는 뜻이 아닙니다. 엘리너 오스트롬의 연구처럼 공동체 규칙과 감시, 제재가 있으면 잘 관리될 수 있습니다.',
      '해결책이 항상 사유화나 강한 규제 하나뿐인 것도 아닙니다. 자원의 성격과 공동체에 따라 다양한 제도가 가능합니다.',
      '개인의 선의만으로 충분하다는 뜻도 아닙니다. 선의가 있어도 구조가 나쁘면 나쁜 결과가 반복됩니다.',
    ],
    actions: [
      '공유 자원을 볼 때 누가 비용을 내고 누가 이익을 얻는지 나눠보세요.',
      '공용 도구나 커뮤니티에는 사용 규칙, 제한, 복구 절차를 명확히 두세요.',
      '문제가 반복되면 개인 탓만 하기보다 인센티브와 감시 구조를 점검하세요.',
    ],
    links: [
      { title: 'Nobel Prize: Elinor Ostrom facts', url: 'https://www.nobelprize.org/prizes/economic-sciences/2009/ostrom/facts/' },
      { title: 'Wikipedia: Tragedy of the commons', url: 'https://en.wikipedia.org/wiki/Tragedy_of_the_commons' },
    ],
    takeaway: '공유 자원은 모두의 것이기 때문에 더 많은 설계와 책임이 필요합니다.',
  },
  {
    slug: 'streisand-effect',
    subject: '스트라이샌드 효과',
    angle: '숨기려 할수록 더 널리 퍼진다',
    description: '정보를 억누르려는 시도가 오히려 관심을 키우는 역설적 현상을 설명합니다.',
    sourceTitle: 'Wikipedia: Streisand effect',
    sourceUrl: 'https://en.wikipedia.org/wiki/Streisand_effect',
    sourceAuthor: 'Wikipedia contributors',
    tags: ['Media', 'Society', 'Internet'],
    explain: [
      '스트라이샌드 효과는 어떤 정보를 숨기거나 삭제하려는 시도가 오히려 그 정보에 대한 관심과 확산을 키우는 현상입니다.',
      '이름은 바브라 스트라이샌드가 자신의 집 사진 삭제를 요구하면서 오히려 더 큰 관심을 불러온 사건에서 유래했습니다.',
      '핵심은 금지와 호기심의 결합입니다. 사람들은 왜 숨기려 하는지 궁금해하고, 복제 가능한 인터넷 환경에서는 억제가 확산의 신호가 되기 쉽습니다.',
    ],
    why: [
      '오늘날 정보는 캡처, 복사, 재업로드가 쉽습니다. 단순 삭제 요청은 문제 해결보다 더 많은 사람에게 존재를 알리는 신호가 될 수 있습니다.',
      '기업과 공인의 위기 대응에서도 중요합니다. 작은 비판을 과도하게 법적 대응하면 비판 내용보다 대응 방식이 더 큰 뉴스가 됩니다.',
      '이 개념은 침묵하라는 뜻이 아닙니다. 대응의 강도와 방식이 정보의 확산을 어떻게 바꿀지 계산해야 한다는 뜻입니다.',
    ],
    examples: [
      '작은 게시글 하나를 강하게 삭제 요청했더니 사람들이 원문을 보존하고 공유하면서 더 널리 알려질 수 있습니다.',
      '제품 결함을 설명 없이 숨기면 사용자 커뮤니티는 스스로 증거를 모으고 의혹은 커집니다.',
      '학교나 조직이 가벼운 풍자를 금지하면 풍자 자체보다 금지 조치가 더 큰 관심을 받기도 합니다.',
    ],
    misconceptions: [
      '스트라이샌드 효과는 모든 삭제 요청이 틀렸다는 뜻이 아닙니다. 개인정보, 불법 콘텐츠, 명백한 허위 정보는 대응이 필요합니다.',
      '아무 대응도 하지 말라는 뜻도 아닙니다. 때로는 투명한 설명과 빠른 수정이 확산을 줄입니다.',
      '관심을 끌기 위해 일부러 논란을 만들면 된다는 뜻도 아닙니다. 신뢰 손상은 단기 주목보다 오래 갑니다.',
    ],
    actions: [
      '민감한 게시물에 대응하기 전 삭제, 설명, 수정, 무대응의 확산 가능성을 각각 비교하세요.',
      '실수가 사실이라면 숨기기보다 무엇을 고쳤는지 빠르게 설명하세요.',
      '법적 대응은 내용보다 대응 자체가 뉴스가 될 가능성을 검토한 뒤 결정하세요.',
    ],
    links: [
      { title: 'EFF: The Streisand Effect', url: 'https://www.eff.org/deeplinks/2013/01/streisand-effect' },
      { title: 'Wikipedia: Barbra Streisand', url: 'https://en.wikipedia.org/wiki/Barbra_Streisand' },
    ],
    takeaway: '인터넷에서 억제는 때로 가장 큰 홍보가 됩니다. 대응은 내용만큼 신호를 관리하는 일입니다.',
  },
  {
    slug: 'moral-hazard',
    subject: '도덕적 해이',
    angle: '위험을 남이 부담하면 행동도 달라진다',
    description: '보험, 금융, 조직에서 위험 부담이 분리될 때 생기는 행동 변화와 제도 설계를 설명합니다.',
    sourceTitle: 'Britannica: Moral hazard',
    sourceUrl: 'https://www.britannica.com/money/moral-hazard',
    sourceAuthor: 'Encyclopaedia Britannica',
    tags: ['Economics', 'Risk', 'Society'],
    explain: [
      '도덕적 해이는 어떤 행동의 위험이나 비용을 본인이 온전히 부담하지 않을 때 더 위험하게 행동할 수 있는 현상입니다.',
      '보험이 대표적인 예입니다. 보호 장치가 생기면 사람은 안심하지만, 일부는 사고 예방 노력을 줄일 수 있습니다.',
      '핵심은 나쁜 사람의 문제가 아니라 위험 분담 구조입니다. 누가 이익을 얻고 누가 손실을 부담하는지가 행동을 바꿉니다.',
    ],
    why: [
      '금융 위기나 기업 구제 논의에서 도덕적 해이는 중요한 쟁점입니다. 손실은 사회가 부담하고 이익은 개인이나 기업이 가져가면 위험한 선택이 반복될 수 있습니다.',
      '조직에서도 보입니다. 실험 실패 비용을 다른 팀이 떠안고 성과만 특정 팀이 가져가면 무리한 출시가 늘 수 있습니다.',
      '도덕적 해이를 이해하면 보호와 책임의 균형을 보게 됩니다. 안전망은 필요하지만, 행동을 왜곡하지 않도록 설계해야 합니다.',
    ],
    examples: [
      '렌터카 보험이 모든 손상을 보장한다고 느끼면 운전자가 자기 차보다 덜 조심할 수 있습니다.',
      '회사가 장애 비용을 운영팀에만 떠넘기고 기능 출시 성과는 개발팀만 받으면 안정성 투자가 줄 수 있습니다.',
      '은행이 실패해도 구제받는다고 믿으면 위험한 투자에 더 쉽게 뛰어들 수 있습니다.',
    ],
    misconceptions: [
      '도덕적 해이는 보험이나 안전망이 나쁘다는 뜻이 아닙니다. 문제는 보호가 책임과 완전히 분리될 때입니다.',
      '모든 사람이 보호를 받으면 무책임해진다는 뜻도 아닙니다. 제도 설계와 감시, 자기부담 구조가 행동을 조정합니다.',
      '도덕성만 강조하면 구조를 놓칩니다. 개인의 마음보다 비용 배분 방식이 더 강한 신호일 때가 많습니다.',
    ],
    actions: [
      '어떤 정책을 볼 때 이익과 손실을 누가 각각 가져가는지 그려보세요.',
      '팀 목표를 만들 때 성과 지표와 실패 비용이 같은 곳에 보이도록 설계하세요.',
      '안전망에는 남용을 줄이는 자기부담, 조건, 모니터링을 함께 생각하세요.',
    ],
    links: [
      { title: 'Investopedia: Moral Hazard', url: 'https://www.investopedia.com/terms/m/moralhazard.asp' },
      { title: 'Wikipedia: Moral hazard', url: 'https://en.wikipedia.org/wiki/Moral_hazard' },
    ],
    takeaway: '위험을 누가 부담하는지 바뀌면, 사람의 선택도 조용히 바뀝니다.',
  },
  {
    slug: 'sunk-cost-fallacy',
    subject: '매몰비용 오류',
    angle: '이미 쓴 비용은 결정을 대신할 수 없다',
    description: '이미 투입한 시간과 돈 때문에 좋지 않은 선택을 계속하는 매몰비용 오류를 설명합니다.',
    sourceTitle: 'The Decision Lab: Sunk Cost Fallacy',
    sourceUrl: 'https://thedecisionlab.com/biases/the-sunk-cost-fallacy',
    sourceAuthor: 'The Decision Lab',
    tags: ['Psychology', 'Economics', 'Decision Making'],
    explain: [
      '매몰비용 오류는 이미 쓴 돈, 시간, 노력이 아까워서 앞으로의 가치가 낮은 선택을 계속하는 경향입니다.',
      '합리적으로는 되돌릴 수 없는 비용보다 앞으로 얻을 이익과 추가 비용을 봐야 합니다. 하지만 사람은 포기를 실패로 느끼기 쉽습니다.',
      '핵심은 과거와 미래를 분리하는 일입니다. 이미 쓴 비용은 배움의 자료가 될 수 있지만, 다음 결정을 자동으로 정당화하지는 못합니다.',
    ],
    why: [
      '프로젝트가 커질수록 매몰비용 오류는 강해집니다. 이미 개발한 기능, 이미 쓴 예산, 이미 발표한 계획이 방향 전환을 어렵게 만듭니다.',
      '개인 생활에서도 영화가 재미없어도 끝까지 보거나, 맞지 않는 공부법을 오래 붙잡는 식으로 나타납니다.',
      '이 오류를 이해하면 중단을 패배가 아니라 자원 재배치로 볼 수 있습니다. 중요한 것은 과거 비용의 체면보다 미래 선택의 품질입니다.',
    ],
    examples: [
      '사용자가 거의 없는 기능에 이미 3개월을 썼다는 이유로 계속 개발하면 더 큰 비용이 들어갈 수 있습니다.',
      '비싼 공연 티켓을 샀지만 몸이 아픈데도 억지로 가면 이미 쓴 돈에 건강까지 더 잃을 수 있습니다.',
      '오래 쓴 도구가 팀에 맞지 않는데 이전 설정 비용이 아까워 전환을 미루는 경우도 있습니다.',
    ],
    misconceptions: [
      '매몰비용을 무시하라는 말은 과거를 배우지 말라는 뜻이 아닙니다. 과거 비용은 회고의 대상이지 미래 투자의 이유가 아닙니다.',
      '중단이 항상 정답이라는 뜻도 아닙니다. 앞으로의 기대 가치가 충분하면 계속하는 것이 맞습니다.',
      '감정을 배제하라는 뜻도 아닙니다. 아쉬움을 인정하되 결정 기준을 미래로 옮기자는 뜻입니다.',
    ],
    actions: [
      '계속할지 고민되는 일을 “오늘 처음 시작한다면 다시 선택할까”로 물어보세요.',
      '프로젝트에는 사전에 중단 기준을 정해두세요.',
      '이미 쓴 비용과 앞으로 필요한 비용을 문서에서 분리해 적으세요.',
    ],
    links: [
      { title: 'Wikipedia: Sunk cost', url: 'https://en.wikipedia.org/wiki/Sunk_cost' },
      { title: 'BehavioralEconomics.com: Sunk Cost Fallacy', url: 'https://www.behavioraleconomics.com/resources/mini-encyclopedia-of-be/sunk-cost-fallacy/' },
    ],
    takeaway: '과거의 비용은 되돌릴 수 없습니다. 그래서 다음 선택은 미래의 가치로 해야 합니다.',
  },
  {
    slug: 'bike-shedding',
    subject: '파킨슨의 사소함 법칙',
    angle: '쉬운 문제일수록 말이 길어진다',
    description: '사람들이 복잡한 핵심보다 이해하기 쉬운 사소한 문제에 과도하게 시간을 쓰는 현상을 설명합니다.',
    sourceTitle: 'Wikipedia: Law of triviality',
    sourceUrl: 'https://en.wikipedia.org/wiki/Law_of_triviality',
    sourceAuthor: 'Wikipedia contributors',
    tags: ['Organizations', 'Decision Making', 'Productivity'],
    explain: [
      '파킨슨의 사소함 법칙은 사람들이 복잡하고 중요한 문제보다 이해하기 쉬운 사소한 문제에 더 많은 논의를 쏟는 경향을 말합니다.',
      '자주 쓰이는 비유는 원자력 발전소 예산보다 자전거 보관소 색상에 회의 시간이 더 길어진다는 이야기입니다.',
      '핵심은 참여 장벽입니다. 복잡한 문제는 전문가가 아니면 말하기 어렵지만, 사소한 문제는 누구나 의견을 낼 수 있어 논의가 쉽게 커집니다.',
    ],
    why: [
      '조직 회의에서 이 현상은 의사결정 비용을 크게 만듭니다. 중요한 구조적 선택은 조용히 지나가고, 버튼 색상이나 문구처럼 쉬운 주제에 에너지가 몰립니다.',
      '제품 개발에서도 위험합니다. 사용자 가치와 아키텍처 결정보다 취향 논쟁이 앞서면 일정은 늦고 품질은 좋아지지 않습니다.',
      '이 법칙을 알면 회의 안건의 무게와 토론 시간을 의식적으로 맞추게 됩니다.',
    ],
    examples: [
      '신규 결제 구조의 위험은 5분 만에 넘어가고, 영수증 이메일 제목은 30분 토론하는 회의가 생길 수 있습니다.',
      '문서의 핵심 정책보다 폰트와 표지 디자인에 피드백이 몰리는 것도 비슷한 현상입니다.',
      '코드 리뷰에서 데이터 손실 가능성보다 변수명 취향 논쟁이 길어지는 경우도 있습니다.',
    ],
    misconceptions: [
      '사소한 문제는 모두 무시하라는 뜻이 아닙니다. 작은 디테일도 사용자 경험에 중요할 수 있습니다.',
      '전문가만 말해야 한다는 뜻도 아닙니다. 다만 논의 시간은 결정의 영향도에 맞아야 합니다.',
      '취향 논쟁을 막는다고 창의성이 줄어드는 것은 아닙니다. 오히려 중요한 선택에 에너지를 남깁니다.',
    ],
    actions: [
      '회의 안건마다 예상 영향도와 최대 토론 시간을 정하세요.',
      '취향성 피드백은 담당자에게 위임하고 원칙 수준에서만 합의하세요.',
      '긴 논의가 시작되면 “이 결정의 되돌리기 비용은 얼마인가”를 물어보세요.',
    ],
    links: [
      { title: 'Wikipedia: C. Northcote Parkinson', url: 'https://en.wikipedia.org/wiki/C._Northcote_Parkinson' },
      { title: 'Parkinson’s Law of Triviality', url: 'https://en.wikipedia.org/wiki/Law_of_triviality' },
    ],
    takeaway: '모두가 말하기 쉬운 문제가 반드시 가장 중요한 문제는 아닙니다.',
  },
  {
    slug: 'compound-interest',
    subject: '복리',
    angle: '작은 차이가 시간이 지나며 구조가 된다',
    description: '복리가 돈뿐 아니라 지식, 습관, 신뢰에도 적용되는 누적 효과를 설명합니다.',
    sourceTitle: 'Investor.gov: Compound Interest Calculator',
    sourceUrl: 'https://www.investor.gov/financial-tools-calculators/calculators/compound-interest-calculator',
    sourceAuthor: 'U.S. Securities and Exchange Commission',
    tags: ['Economics', 'Learning', 'Productivity'],
    explain: [
      '복리는 이자가 원금에 더해지고, 다음에는 그 합계에 다시 이자가 붙는 구조입니다. 시간이 길어질수록 선형 증가가 아니라 곡선형 증가가 됩니다.',
      '돈의 세계에서 출발한 개념이지만, 학습과 습관에도 비슷한 패턴이 있습니다. 매일의 작은 개선은 즉시 크게 보이지 않지만, 쌓이면 선택지를 바꿉니다.',
      '핵심은 시간과 재투자입니다. 결과를 다시 다음 결과의 기반으로 넣을 때 복리 효과가 생깁니다.',
    ],
    why: [
      '현대 사회는 즉시 보이는 성과를 좋아하지만, 많은 중요한 것은 늦게 드러납니다. 신뢰, 실력, 건강, 브랜드는 하루 단위보다 누적 단위로 움직입니다.',
      '복리를 이해하면 작은 반복을 가볍게 보지 않게 됩니다. 반대로 작은 부채, 작은 나쁜 습관, 작은 품질 저하도 누적되면 큰 문제가 됩니다.',
      '이 개념은 조급함을 줄이고 방향의 중요성을 키웁니다. 매일 조금씩이라도 같은 방향으로 쌓이는 것이 강력합니다.',
    ],
    examples: [
      '매일 30분씩 읽은 기술 문서는 한 달 뒤에는 작아 보여도 몇 년 뒤 문제를 이해하는 속도를 바꿉니다.',
      '운동을 하루 쉬는 것은 작지만, 쉬는 습관이 쌓이면 체력의 기준선이 내려갑니다.',
      '팀에서 작은 약속을 계속 지키면 신뢰가 쌓이고, 작은 약속을 계속 어기면 협업 비용이 커집니다.',
    ],
    misconceptions: [
      '복리는 무조건 긍정적인 힘이 아닙니다. 좋은 것도 나쁜 것도 누적됩니다.',
      '작게 시작하면 항상 성공한다는 뜻도 아닙니다. 방향이 틀리면 누적은 잘못된 곳으로 데려갑니다.',
      '초반 성과가 작다고 실패라는 뜻도 아닙니다. 복리는 초반보다 후반에 더 눈에 띕니다.',
    ],
    actions: [
      '반복할 작은 행동 하나를 정하고 결과를 다음 행동의 기반으로 남기세요.',
      '나쁜 복리가 생기는 영역, 예를 들어 기술 부채나 수면 부족을 찾아보세요.',
      '성과를 하루 단위가 아니라 누적 그래프로 기록해보세요.',
    ],
    links: [
      { title: 'Wikipedia: Compound interest', url: 'https://en.wikipedia.org/wiki/Compound_interest' },
      { title: 'Khan Academy: Compound interest', url: 'https://www.khanacademy.org/economics-finance-domain/core-finance/interest-tutorial' },
    ],
    takeaway: '복리는 속도가 아니라 방향과 시간이 만드는 힘입니다.',
  },
];

const proceduralDeveloperTopics = [
  { slug: 'timeout-budget', subject: '타임아웃 예산', sourceTitle: 'Google SRE Book: Handling Overload', sourceUrl: 'https://sre.google/sre-book/handling-overload/', sourceAuthor: 'Google SRE', tags: ['Reliability', 'Backend', 'Operations'] },
  { slug: 'idempotent-consumers', subject: '멱등 소비자', sourceTitle: 'microservices.io: Idempotent Consumer', sourceUrl: 'https://microservices.io/patterns/communication-style/idempotent-consumer.html', sourceAuthor: 'Chris Richardson', tags: ['Messaging', 'Reliability', 'Distributed Systems'] },
  { slug: 'dead-letter-queues', subject: '데드레터 큐', sourceTitle: 'AWS SQS: Dead-letter queues', sourceUrl: 'https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-dead-letter-queues.html', sourceAuthor: 'Amazon Web Services', tags: ['Queues', 'Operations', 'Reliability'] },
  { slug: 'backfill-jobs', subject: '백필 작업', sourceTitle: 'GitLab Docs: Batched background migrations', sourceUrl: 'https://docs.gitlab.com/development/database/batched_background_migrations/', sourceAuthor: 'GitLab', tags: ['Databases', 'Migration', 'Operations'] },
  { slug: 'health-checks', subject: '헬스 체크', sourceTitle: 'Kubernetes Docs: Probes', sourceUrl: 'https://kubernetes.io/docs/concepts/configuration/liveness-readiness-startup-probes/', sourceAuthor: 'Kubernetes', tags: ['Deployment', 'Reliability', 'Operations'] },
  { slug: 'readiness-probes', subject: '준비성 프로브', sourceTitle: 'Kubernetes Docs: Configure Liveness, Readiness and Startup Probes', sourceUrl: 'https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/', sourceAuthor: 'Kubernetes', tags: ['Deployment', 'Reliability', 'Kubernetes'] },
  { slug: 'audit-logs', subject: '감사 로그', sourceTitle: 'OWASP Logging Cheat Sheet', sourceUrl: 'https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html', sourceAuthor: 'OWASP', tags: ['Security', 'Compliance', 'Operations'] },
  { slug: 'event-versioning', subject: '이벤트 버전 관리', sourceTitle: 'Microsoft Learn: Event-driven architecture style', sourceUrl: 'https://learn.microsoft.com/en-us/azure/architecture/guide/architecture-styles/event-driven', sourceAuthor: 'Microsoft Learn', tags: ['Architecture', 'Messaging', 'API Design'] },
  { slug: 'api-versioning', subject: 'API 버전 관리', sourceTitle: 'Microsoft REST API Guidelines: Versioning', sourceUrl: 'https://github.com/microsoft/api-guidelines/blob/vNext/azure/Guidelines.md#api-versioning', sourceAuthor: 'Microsoft', tags: ['API Design', 'Compatibility', 'Web'] },
  { slug: 'retry-storms', subject: '재시도 폭풍', sourceTitle: 'Google SRE Book: Addressing Cascading Failures', sourceUrl: 'https://sre.google/sre-book/addressing-cascading-failures/', sourceAuthor: 'Google SRE', tags: ['Reliability', 'Incident', 'Backend'] },
  { slug: 'bulkheads', subject: '벌크헤드 패턴', sourceTitle: 'Microsoft Learn: Bulkhead pattern', sourceUrl: 'https://learn.microsoft.com/en-us/azure/architecture/patterns/bulkhead', sourceAuthor: 'Microsoft Learn', tags: ['Architecture', 'Reliability', 'Resilience'] },
  { slug: 'leader-election', subject: '리더 선출', sourceTitle: 'Kubernetes Docs: Lease API', sourceUrl: 'https://kubernetes.io/docs/concepts/architecture/leases/', sourceAuthor: 'Kubernetes', tags: ['Distributed Systems', 'Coordination', 'Reliability'] },
  { slug: 'clock-skew', subject: '시계 오차', sourceTitle: 'Google SRE Book: Time, Clocks, and Ordering of Events', sourceUrl: 'https://sre.google/sre-book/time-clocks-and-ordering/', sourceAuthor: 'Google SRE', tags: ['Distributed Systems', 'Time', 'Reliability'] },
  { slug: 'rate-limit-headers', subject: '레이트 리밋 헤더', sourceTitle: 'RFC 9333: RateLimit Fields for HTTP', sourceUrl: 'https://www.rfc-editor.org/rfc/rfc9333.html', sourceAuthor: 'IETF', tags: ['HTTP', 'API Design', 'Operations'] },
  { slug: 'content-security-policy', subject: '콘텐츠 보안 정책', sourceTitle: 'MDN: Content-Security-Policy', sourceUrl: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP', sourceAuthor: 'MDN', tags: ['Security', 'Web', 'Frontend'] },
  { slug: 'dependency-pinning', subject: '의존성 고정', sourceTitle: 'OWASP Dependency-Check', sourceUrl: 'https://owasp.org/www-project-dependency-check/', sourceAuthor: 'OWASP', tags: ['Security', 'Supply Chain', 'Build'] },
  { slug: 'semantic-versioning', subject: '시맨틱 버저닝', sourceTitle: 'Semantic Versioning 2.0.0', sourceUrl: 'https://semver.org/', sourceAuthor: 'SemVer', tags: ['Release', 'Compatibility', 'API Design'] },
  { slug: 'snapshot-testing', subject: '스냅샷 테스트', sourceTitle: 'Jest Docs: Snapshot Testing', sourceUrl: 'https://jestjs.io/docs/snapshot-testing', sourceAuthor: 'Jest', tags: ['Testing', 'Frontend', 'Quality'] },
  { slug: 'contract-testing', subject: '컨트랙트 테스트', sourceTitle: 'Pact Docs: Contract Testing', sourceUrl: 'https://docs.pact.io/', sourceAuthor: 'Pact', tags: ['Testing', 'API Design', 'Microservices'] },
  { slug: 'accessibility-regression', subject: '접근성 회귀', sourceTitle: 'WCAG 2 Overview', sourceUrl: 'https://www.w3.org/WAI/standards-guidelines/wcag/', sourceAuthor: 'W3C WAI', tags: ['Accessibility', 'Frontend', 'Quality'] },
];

const proceduralDeveloperAngles = [
  { slug: 'failure-contract', textFor: (topic) => '실패 방식까지 계약해야 실무 설계가 된다', descriptionFor: (topic) => `${topic.subject}를 정상 경로뿐 아니라 실패 계약, 재시도, 관측 가능성까지 포함해 설계하는 법을 정리합니다.` },
  { slug: 'operational-boundary', textFor: (topic) => '운영 경계가 흐리면 코드도 흔들린다', descriptionFor: (topic) => `${topic.subject}가 배포, 장애 대응, 팀 책임 경계에 어떤 영향을 주는지 설명합니다.` },
  { slug: 'small-defaults', textFor: (topic) => '작은 기본값이 큰 장애를 만든다', descriptionFor: (topic) => `${topic.subject}의 기본값과 예외 처리가 규모가 커질 때 어떤 위험으로 바뀌는지 살펴봅니다.` },
  { slug: 'observable-design', textFor: (topic) => '보이지 않는 설계는 고칠 수도 없다', descriptionFor: (topic) => `${topic.subject}를 로그, 지표, 알림과 연결해 운영 가능한 설계로 만드는 방법을 정리합니다.` },
  { slug: 'compatibility-first', textFor: (topic) => '호환성을 먼저 생각해야 배포가 조용해진다', descriptionFor: (topic) => `${topic.subject}를 이전 버전, 롤링 배포, 외부 클라이언트와 함께 안전하게 운영하는 법을 설명합니다.` },
  { slug: 'cost-of-assumptions', textFor: (topic) => '당연한 가정 하나가 운영 비용이 된다', descriptionFor: (topic) => `${topic.subject}에서 자주 놓치는 가정과 그 가정이 비용, 장애, 데이터 문제로 이어지는 과정을 다룹니다.` },
  { slug: 'review-checklist', textFor: (topic) => '코드 리뷰에서 먼저 물어야 할 질문들', descriptionFor: (topic) => `${topic.subject}를 구현할 때 리뷰어가 확인해야 할 경계, 테스트, 운영 질문을 체크리스트로 정리합니다.` },
  { slug: 'team-memory', textFor: (topic) => '팀의 기억으로 남겨야 반복 실수를 줄인다', descriptionFor: (topic) => `${topic.subject}를 개인 노하우가 아니라 문서, 테스트, 지표로 남기는 방법을 설명합니다.` },
];

const proceduralKnowledgeTopics = [
  { slug: 'normalcy-bias', subject: '정상성 편향', sourceTitle: 'Encyclopaedia Britannica: cognitive bias', sourceUrl: 'https://www.britannica.com/science/cognitive-bias', sourceAuthor: 'Encyclopaedia Britannica', tags: ['Psychology', 'Risk', 'Decision Making'] },
  { slug: 'status-quo-bias', subject: '현상 유지 편향', sourceTitle: 'The Decision Lab: Status Quo Bias', sourceUrl: 'https://thedecisionlab.com/biases/status-quo-bias', sourceAuthor: 'The Decision Lab', tags: ['Psychology', 'Decision Making', 'Behavior'] },
  { slug: 'framing-effect', subject: '프레이밍 효과', sourceTitle: 'The Decision Lab: Framing Effect', sourceUrl: 'https://thedecisionlab.com/biases/framing-effect', sourceAuthor: 'The Decision Lab', tags: ['Psychology', 'Communication', 'Decision Making'] },
  { slug: 'hindsight-bias', subject: '사후 확신 편향', sourceTitle: 'APA Dictionary: hindsight bias', sourceUrl: 'https://dictionary.apa.org/hindsight-bias', sourceAuthor: 'American Psychological Association', tags: ['Psychology', 'Thinking', 'Decision Making'] },
  { slug: 'recency-bias', subject: '최근성 편향', sourceTitle: 'The Decision Lab: Recency Bias', sourceUrl: 'https://thedecisionlab.com/biases/recency-bias', sourceAuthor: 'The Decision Lab', tags: ['Psychology', 'Memory', 'Decision Making'] },
  { slug: 'selection-bias', subject: '선택 편향', sourceTitle: 'Encyclopaedia Britannica: selection bias', sourceUrl: 'https://www.britannica.com/science/selection-bias', sourceAuthor: 'Encyclopaedia Britannica', tags: ['Statistics', 'Research', 'Thinking'] },
  { slug: 'base-rate-neglect', subject: '기저율 무시', sourceTitle: 'The Decision Lab: Base Rate Fallacy', sourceUrl: 'https://thedecisionlab.com/biases/base-rate-fallacy', sourceAuthor: 'The Decision Lab', tags: ['Statistics', 'Psychology', 'Decision Making'] },
  { slug: 'false-consensus-effect', subject: '허위 합의 효과', sourceTitle: 'APA Dictionary: false-consensus effect', sourceUrl: 'https://dictionary.apa.org/false-consensus-effect', sourceAuthor: 'American Psychological Association', tags: ['Psychology', 'Society', 'Communication'] },
  { slug: 'halo-effect', subject: '후광 효과', sourceTitle: 'APA Dictionary: halo effect', sourceUrl: 'https://dictionary.apa.org/halo-effect', sourceAuthor: 'American Psychological Association', tags: ['Psychology', 'Judgment', 'Behavior'] },
  { slug: 'fundamental-attribution-error', subject: '기본적 귀인 오류', sourceTitle: 'Britannica: attribution theory', sourceUrl: 'https://www.britannica.com/science/attribution-theory', sourceAuthor: 'Encyclopaedia Britannica', tags: ['Psychology', 'Society', 'Thinking'] },
  { slug: 'social-proof', subject: '사회적 증거', sourceTitle: 'Nielsen Norman Group: Social Proof', sourceUrl: 'https://www.nngroup.com/articles/social-proof/', sourceAuthor: 'Nielsen Norman Group', tags: ['Behavior', 'Design', 'Decision Making'] },
  { slug: 'choice-overload', subject: '선택 과부하', sourceTitle: 'The Decision Lab: Choice Overload', sourceUrl: 'https://thedecisionlab.com/biases/choice-overload-bias', sourceAuthor: 'The Decision Lab', tags: ['Psychology', 'Productivity', 'Decision Making'] },
  { slug: 'peak-end-rule', subject: '피크엔드 법칙', sourceTitle: 'The Decision Lab: Peak-End Rule', sourceUrl: 'https://thedecisionlab.com/biases/peak-end-rule', sourceAuthor: 'The Decision Lab', tags: ['Psychology', 'Experience', 'Memory'] },
  { slug: 'availability-cascade', subject: '가용성 폭포', sourceTitle: 'Wikipedia: Availability cascade', sourceUrl: 'https://en.wikipedia.org/wiki/Availability_cascade', sourceAuthor: 'Wikipedia contributors', tags: ['Media', 'Society', 'Risk'] },
  { slug: 'second-order-effects', subject: '2차 효과', sourceTitle: 'Farnam Street: Second-Order Thinking', sourceUrl: 'https://fs.blog/second-order-thinking/', sourceAuthor: 'Farnam Street', tags: ['Thinking', 'Strategy', 'Decision Making'] },
  { slug: 'unknown-unknowns', subject: '알려지지 않은 미지', sourceTitle: 'Wikipedia: There are unknown unknowns', sourceUrl: 'https://en.wikipedia.org/wiki/There_are_unknown_unknowns', sourceAuthor: 'Wikipedia contributors', tags: ['Risk', 'Thinking', 'Uncertainty'] },
  { slug: 'signal-to-noise', subject: '신호와 잡음', sourceTitle: 'Encyclopaedia Britannica: signal-to-noise ratio', sourceUrl: 'https://www.britannica.com/science/signal-to-noise-ratio', sourceAuthor: 'Encyclopaedia Britannica', tags: ['Statistics', 'Thinking', 'Data'] },
  { slug: 'feedback-loops', subject: '피드백 루프', sourceTitle: 'Encyclopaedia Britannica: feedback control system', sourceUrl: 'https://www.britannica.com/technology/feedback-control-system', sourceAuthor: 'Encyclopaedia Britannica', tags: ['Systems', 'Thinking', 'Behavior'] },
  { slug: 'path-dependence', subject: '경로 의존성', sourceTitle: 'Britannica: path dependence', sourceUrl: 'https://www.britannica.com/topic/path-dependence', sourceAuthor: 'Encyclopaedia Britannica', tags: ['Economics', 'History', 'Decision Making'] },
  { slug: 'negative-space', subject: '여백의 가치', sourceTitle: 'Britannica: design', sourceUrl: 'https://www.britannica.com/art/design', sourceAuthor: 'Encyclopaedia Britannica', tags: ['Design', 'Thinking', 'Culture'] },
];

const proceduralKnowledgeAngles = [
  { slug: 'hidden-standard', textFor: (topic) => '보이지 않는 기준이 판단을 움직인다', descriptionFor: (topic) => `${topic.subject}를 통해 우리가 어떤 숨은 기준에 따라 선택하고 해석하는지 살펴봅니다.` },
  { slug: 'daily-decisions', textFor: (topic) => '일상의 작은 선택에도 구조가 있다', descriptionFor: (topic) => `${topic.subject}를 일상 판단, 회의, 제품 선택과 연결해 쉽게 설명합니다.` },
  { slug: 'misread-signals', textFor: (topic) => '우리는 자주 신호와 잡음을 헷갈린다', descriptionFor: (topic) => `${topic.subject}가 정보 과잉 속에서 중요한 신호를 가려내는 데 주는 힌트를 정리합니다.` },
  { slug: 'better-questions', textFor: (topic) => '정답보다 먼저 질문을 바꿔야 한다', descriptionFor: (topic) => `${topic.subject}를 이용해 같은 문제를 더 나은 질문으로 바꾸는 법을 설명합니다.` },
  { slug: 'decision-hygiene', textFor: (topic) => '판단에도 위생이 필요하다', descriptionFor: (topic) => `${topic.subject}가 성급한 결론을 줄이고 판단 과정을 점검하게 해주는 방식을 다룹니다.` },
  { slug: 'modern-reading', textFor: (topic) => '현대 사회를 읽는 작은 렌즈', descriptionFor: (topic) => `${topic.subject}를 뉴스, 조직, 플랫폼, 개인 습관을 이해하는 렌즈로 소개합니다.` },
  { slug: 'quiet-trap', textFor: (topic) => '조용한 함정은 대개 익숙한 얼굴을 하고 있다', descriptionFor: (topic) => `${topic.subject}가 왜 익숙한 상황에서 더 잘 숨어드는지 사례와 함께 설명합니다.` },
  { slug: 'practical-skepticism', textFor: (topic) => '의심은 부정이 아니라 확인의 기술이다', descriptionFor: (topic) => `${topic.subject}를 통해 더 차분하게 의심하고 더 정확하게 확인하는 태도를 정리합니다.` },
];

function safeSlug(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

function hashString(value) {
  let hash = 0;
  for (const char of String(value)) {
    hash = ((hash << 5) - hash + char.charCodeAt(0)) | 0;
  }
  return hash;
}

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
  const post = selectTopic(workflow.prefix, workflow.posts, workflowName, date);
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
