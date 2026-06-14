#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';

const repoRoot = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const postDir = join(repoRoot, 'src/content/medium-digest');

const feeds = [
  'https://medium.com/feed/tag/ai-coding',
  'https://medium.com/feed/tag/coding-ai',
  'https://medium.com/feed/tag/agentic-ai',
  'https://medium.com/feed/tag/llm',
  'https://medium.com/feed/tag/artificial-intelligence',
];

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

function decodeXml(value = '') {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function stripHtml(value = '') {
  return decodeXml(value)
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\bContinue reading on [^»]+»?/gi, ' ')
    .replace(/\bContinue reading\b\s*»?/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tagValue(item, tag) {
  const match = item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return match ? decodeXml(match[1]).trim() : '';
}

function slugify(title) {
  const words = title
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter((word) => !['the', 'and', 'with', 'that', 'this', 'your', 'into', 'from', 'what', 'why', 'how'].includes(word))
    .slice(0, 5);
  return words.join('-') || 'medium-ai-digest';
}

function existingPostFor(date) {
  const matches = readdirSync(postDir)
    .filter((name) => name.startsWith(`${date}-`) && name.endsWith('.md'))
    .sort();
  return matches[0] ? join(postDir, matches[0]) : null;
}

function recentPosts() {
  return readdirSync(postDir)
    .filter((name) => /^\d{4}-\d{2}-\d{2}-.*\.md$/.test(name))
    .sort()
    .slice(-30)
    .map((name) => {
      const content = readFileSync(join(postDir, name), 'utf8');
      return {
        name,
        title: frontmatterValue(content, 'title'),
        description: frontmatterValue(content, 'description'),
        sourceTitle: frontmatterValue(content, 'sourceTitle'),
        sourceUrl: frontmatterValue(content, 'sourceUrl'),
        bodySample: content.replace(/^---\n[\s\S]*?\n---\n?/, '').slice(0, 1800),
      };
    });
}

function frontmatterValue(content, field) {
  return content.match(new RegExp(`^${field}:\\s*["']?(.+?)["']?$`, 'm'))?.[1] ?? '';
}

function recentSourceTitles(posts) {
  return new Set(posts.map((post) => post.sourceTitle).filter(Boolean));
}

function recentSourceUrls(posts) {
  return new Set(posts.map((post) => post.sourceUrl).filter(Boolean));
}

function recentGeneratedTitles(posts) {
  return new Set(posts.map((post) => post.title).filter(Boolean));
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'KokomaSoftSite daily Medium digest bot',
    },
  });
  if (!response.ok) throw new Error(`${url} returned ${response.status}`);
  return response.text();
}

async function collectCandidates() {
  const seen = new Set();
  const candidates = [];
  for (const feed of feeds) {
    try {
      const xml = await fetchText(feed);
      const items = xml.match(/<item>[\s\S]*?<\/item>/gi) ?? [];
      for (const item of items) {
        const title = stripHtml(tagValue(item, 'title'));
        const link = stripHtml(tagValue(item, 'link')).split('?')[0];
        if (!title || !link || seen.has(link)) continue;
        seen.add(link);
        const author = stripHtml(tagValue(item, 'dc:creator'));
        const pubDate = stripHtml(tagValue(item, 'pubDate'));
        const categories = [...item.matchAll(/<category>([\s\S]*?)<\/category>/gi)].map((m) => stripHtml(m[1]));
        const summary = stripHtml(tagValue(item, 'description') || tagValue(item, 'content:encoded')).slice(0, 900);
        candidates.push({ title, link, author, pubDate, categories, summary, feed });
      }
    } catch (error) {
      console.warn(`feed skipped: ${feed}: ${error.message}`);
    }
  }
  return candidates;
}

function score(candidate, recent) {
  if (recent.sourceTitles.has(candidate.title) || recent.sourceUrls.has(candidate.link)) return -1000;
  if (recent.generatedTitles.has(generatedKoreanTitle(candidate))) return -900;
  const haystack = `${candidate.title} ${candidate.categories.join(' ')} ${candidate.summary}`.toLowerCase();
  let value = 0;
  for (const term of ['claude code', 'codex', 'coding agent', 'ai coding', 'agentic', 'agent', 'llm', 'developer', 'workflow', 'testing', 'product adoption']) {
    if (haystack.includes(term)) value += 10;
  }
  if (haystack.includes('medium') || haystack.includes('prompt') || haystack.includes('production')) value += 4;
  if (/2026|jun|june/i.test(candidate.pubDate)) value += 3;
  if (candidate.summary.length > 240) value += 2;

  const candidateTokens = topicTokens(`${candidate.title} ${candidate.summary} ${candidate.categories.join(' ')}`);
  const closest = Math.max(0, ...recent.fingerprints.map((tokens) => jaccard(candidateTokens, tokens)));
  if (closest >= 0.34) value -= 45;
  if (closest >= 0.48) value -= 80;
  return value;
}

function topicTokens(value) {
  const stopwords = new Set([
    'the', 'and', 'for', 'with', 'from', 'that', 'this', 'your', 'you', 'are', 'was', 'were', 'have', 'has',
    'into', 'what', 'why', 'how', 'when', 'will', 'can', 'all', 'about', 'after', 'before', 'today', 'medium',
    'ai', 'artificial', 'intelligence', '글', '오늘의', '원문', '도구', '개발자', '중요한', '포인트', '요약',
  ]);
  return new Set(
    stripHtml(value)
      .toLowerCase()
      .replace(/[^a-z0-9가-힣]+/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length >= 3 && !stopwords.has(word))
      .slice(0, 80),
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

function digestTheme(candidate) {
  const haystack = `${candidate.title} ${candidate.summary} ${candidate.categories.join(' ')}`.toLowerCase();
  if (/parallel|dozens|64|128|multi[-\s]?agent|swarm/.test(haystack)) {
    return {
      title: '오늘의 AI 글: 병렬 코딩 에이전트는 속도가 아니라 조율의 문제다',
      descriptionFocus: '여러 코딩 에이전트를 동시에 돌릴 때 생기는 충돌, 중복, 검증 비용, 통합자 역할을 중심으로 병렬 AI 개발의 현실적인 운영법을 정리한다.',
      openingFrame: '코딩 에이전트를 하나 더 켜는 일은 쉽지만, 여러 개를 동시에 운용하는 일은 완전히 다른 문제다. 병렬성은 속도를 주지만, 같은 만큼 조율 비용도 키운다.',
      sourcePhrase: 'AI 에이전트를 많이 띄우는 순간 무엇이 빨라지고 무엇이 망가지는지를 묻는다.',
      summaryBridge: '이 요지는 코딩 에이전트의 병렬 운영을 단순한 생산성 요령이 아니라 작업 분배, 격리, 검증, 통합의 문제로 보게 만든다.',
      stepHeadings: ['작업을 나누는 기준', '격리된 작업 공간', '통합자의 역할', '검증 비용의 현실'],
      finalLine: '병렬 에이전트의 가치는 많이 켜는 데서가 아니라, 서로 겹치지 않게 일하게 만들고 결과를 차분히 합치는 운영 능력에서 결정된다.',
    };
  }
  if (/debug|hell|bug|broken|fix|vibe/.test(haystack)) {
    return {
      title: '오늘의 AI 글: AI가 쓴 코드는 디버깅 책임까지 함께 온다',
      descriptionFocus: 'AI 코딩으로 빠르게 만든 코드가 왜 디버깅 비용과 유지보수 책임을 남길 수 있는지, 검토 가능한 자동화의 기준을 정리한다.',
      openingFrame: 'AI가 코드를 빠르게 만들어주는 순간은 짜릿하다. 하지만 그 코드가 왜 그렇게 동작하는지 설명하지 못하면 속도는 곧 디버깅 부채가 된다.',
      sourcePhrase: 'AI가 만든 코드의 편리함 뒤에 남는 디버깅 비용과 책임을 묻는다.',
      summaryBridge: '이 요지는 코딩 에이전트를 “코드를 대신 써주는 도구”가 아니라 검토와 책임을 함께 설계해야 하는 작업 파트너로 보게 만든다.',
      stepHeadings: ['빠른 생성의 유혹', '이해 없는 수용의 비용', '테스트와 리뷰의 역할', '책임 있는 사용 습관'],
      finalLine: 'AI 코딩의 가치는 코드를 빨리 쓰는 능력보다, 사람이 이해하고 고칠 수 있는 상태로 남기는 능력에서 결정된다.',
    };
  }
  if (/cost|roi|pricing|token|usage|budget/.test(haystack)) {
    return {
      title: '오늘의 AI 글: AI 코딩의 비용은 구독료가 아니라 사용 방식에서 갈린다',
      descriptionFocus: 'AI 코딩 도구의 비용과 ROI를 토큰, 반복 작업, 검증 시간, 팀 운영 관점에서 읽는 법을 정리한다.',
      openingFrame: 'AI 코딩 도구의 비용은 월 구독료만으로 설명되지 않는다. 어떤 일을 맡기고, 얼마나 다시 검토하고, 실패를 어떻게 복구하는지가 실제 비용을 만든다.',
      sourcePhrase: 'AI 도구의 경제성을 가격표가 아니라 실제 워크플로 안에서 따져보자고 말한다.',
      summaryBridge: '이 요지는 도구 선택을 기능 비교가 아니라 시간, 검증, 실패 비용의 계산 문제로 바꿔준다.',
      stepHeadings: ['표면 가격과 실제 비용', '반복 작업의 절감 효과', '검증 시간의 변수', '팀 단위 ROI'],
      finalLine: 'AI 코딩의 비용 판단은 “얼마인가”보다 “어떤 반복 업무를 얼마나 검증 가능한 방식으로 줄였는가”에 달려 있다.',
    };
  }
  if (/skill|prompt|workflow|context|agent/.test(haystack)) {
    return {
      title: '오늘의 AI 글: 좋은 AI 워크플로는 프롬프트보다 운영 규칙을 남긴다',
      descriptionFocus: 'AI 에이전트를 일회성 프롬프트가 아니라 반복 가능한 업무 흐름, 컨텍스트 관리, 검증 규칙으로 다루는 법을 정리한다.',
      openingFrame: 'AI를 잘 쓰는 사람은 긴 프롬프트 하나에만 기대지 않는다. 반복되는 업무를 규칙과 파일, 검증 절차로 남겨 다음 실행의 품질을 높인다.',
      sourcePhrase: 'AI 에이전트를 단발성 대화가 아니라 반복 가능한 작업 흐름으로 다루는 관점을 제시한다.',
      summaryBridge: '이 요지는 프롬프트 실력보다 업무를 구조화하고 결과를 검증하는 운영 습관이 더 오래 간다는 점을 보여준다.',
      stepHeadings: ['반복 업무의 발견', '컨텍스트의 정리', '규칙의 재사용', '검증의 자동화'],
      finalLine: 'AI 워크플로의 실력은 한 번의 멋진 답변보다, 같은 일을 다음에도 안정적으로 끝내는 구조에서 나온다.',
    };
  }
  return {
    title: '오늘의 AI 글: AI 도구의 가치는 데모가 아니라 실제 사용에서 드러난다',
    descriptionFocus: 'AI 도구와 코딩 에이전트를 기능 시연이 아니라 실제 업무 채택, 반복 사용, 검증 가능한 운영 기준으로 판단해야 하는 이유를 정리한다.',
    openingFrame: 'AI 제품과 코딩 에이전트를 둘러싼 대화는 여전히 데모 중심으로 흐르기 쉽다. 하지만 실제 업무에 들어오면 더 중요한 질문은 반복 사용과 검증 가능성이다.',
    sourcePhrase: 'AI 도구를 데모나 유행어가 아니라 실제 사용 맥락에서 보자는 문제의식을 던진다.',
    summaryBridge: '이 요지는 코딩 에이전트에도 그대로 적용된다.',
    stepHeadings: ['흥분과 채택의 분리', '사용자군 다시 보기', '온보딩과 운영', '자동화의 완료 조건'],
    finalLine: 'AI 도구의 가치는 처음 보여준 마술이 아니라, 다음 주에도 조용히 켜지는 습관에서 결정된다.',
  };
}

function generatedKoreanTitle(candidate) {
  return digestTheme(candidate).title;
}

function koreanPost({ date, slug, candidate, accessNote }) {
  const theme = digestTheme(candidate);
  const safeTitle = candidate.title.replace(/"/g, '\\"');
  const safeAuthor = candidate.author ? candidate.author.replace(/"/g, '\\"') : 'Medium author';
  const summary = (candidate.summary || `${candidate.title}는 AI와 개발 워크플로의 변화가 실제 제품과 팀 운영에 어떤 영향을 주는지 다룬다.`)
    .replace(/\bContinue reading on Medium\b\s*»?/gi, '')
    .trim();
  const tags = ['AI', 'Medium', 'AI Agents', 'Coding Agents'];
  const sourcePhrase = `원문은 "${candidate.title}"라는 제목에서 보이듯, ${theme.sourcePhrase}`;
  const publicNote = accessNote
    ? 'Medium 공개 RSS와 공개 페이지에서 확인 가능한 제목, 작성자, 발행 정보, 요약 텍스트를 바탕으로 정리했다. 전문 접근이 제한될 수 있어 세부 표현을 옮기기보다 공개 정보에서 확인되는 논점과 실무 맥락을 중심으로 해설한다.'
    : 'Medium 공개 페이지와 RSS에서 확인한 정보를 바탕으로 원문의 논점을 한국어 독자를 위해 다시 구성했다.';

  return `---
title: "${theme.title}"
description: "Medium 글 '${safeTitle}'를 바탕으로, ${theme.descriptionFocus}"
pubDate: "${date}"
sourceTitle: "${safeTitle}"
sourceUrl: "${candidate.link}"
sourceAuthor: "${safeAuthor}"
tags: ${JSON.stringify(tags)}
---

## 왜 이 글인가

${theme.openingFrame} 짧은 영상에서 앱이 만들어지고, 몇 줄의 지시로 테스트가 생성되고, 복잡해 보이는 저장소를 한 번에 읽는 장면은 강력하다. 그러나 실제 팀이 매일 쓰는 도구가 되려면 누가 무엇을 맡고, 결과를 누가 검토하고, 실패했을 때 어디서 멈출지까지 정해져야 한다.

오늘 고른 Medium 글은 그 지점을 건드린다. ${sourcePhrase} 이 주제는 단순한 제품 마케팅 비평이 아니다. Claude Code, Codex, Cursor, Gemini CLI 같은 코딩 에이전트도 결국 같은 시험대에 오른다. 처음에는 신기함이 사용을 만든다. 그러나 시간이 지나면 남는 것은 팀의 습관, 리뷰 기준, 비용 구조, 실패했을 때의 복구 가능성이다.

${publicNote} 자동화된 블로그 발행 작업에서도 같은 교훈이 보인다. 에이전트가 글을 잘 쓸 수 있어도 마지막에 빌드, 커밋, 푸시, 공개 URL 확인을 안정적으로 끝내지 못하면 운영상 성공이라고 보기 어렵다. AI 도구의 가치는 멋진 한 번의 실행보다, 다음 날에도 같은 품질로 반복되는 절차에서 드러난다.

이 글을 오늘 읽을 가치가 있는 이유는 AI가 이제 실험실 밖으로 나왔기 때문이다. 개인 생산성 도구로 쓸 때는 실패해도 다시 시도하면 된다. 그러나 고객 응대, 개발 배포, 사내 워크플로, 콘텐츠 운영처럼 매일 돌아가는 영역에서는 실패의 모양이 달라진다. 도구가 똑똑한가보다 중요한 것은 사용자가 그 도구를 신뢰하고 다시 켤 만큼 일관적인가다.

## 핵심 요약

- 원문의 중심 문제는 AI 제품의 첫인상과 실제 채택 사이의 간극이다. 데모는 통제된 환경에서 가장 좋은 흐름만 보여준다. 실제 업무는 예외, 피로, 기존 습관, 조직의 저항, 애매한 책임 경계와 함께 돌아간다.

- ${summary} ${theme.summaryBridge} 새 기능을 빠르게 만드는 장면은 인상적이지만, 팀이 매일 맡겨도 되는 작업과 사람이 반드시 붙어야 하는 작업을 구분하지 못하면 속도는 곧 리스크가 된다.

- AI 도구의 진짜 경쟁력은 "쓸 수 있다"가 아니라 "계속 쓰게 된다"에 있다. 사용자가 불편을 감수하면서도 다시 찾는다면 실제 문제가 해결되고 있다는 뜻이다. 반대로 사용자가 재미있게 테스트만 하고 결제나 반복 사용으로 이어지지 않는다면 채택은 아직 일어나지 않은 것이다.

- 코딩 에이전트의 경우 반복 사용을 가르는 기준은 결과물의 검토 가능성이다. 생성된 코드가 기존 패턴과 맞는지, 테스트가 붙는지, 커밋이 읽히는지, 실패 로그가 남는지 확인할 수 있어야 한다. 사람의 통제감을 없애는 자동화는 오래가지 못한다.

- 조직 도입에서는 기술보다 습관이 병목이 된다. 새 도구를 켜는 일은 쉽지만, 회의 방식, 리뷰 방식, 배포 기준, 장애 대응 절차에 넣는 일은 어렵다. AI 도입이 기대만큼 효과를 내지 못하는 이유는 모델 성능 부족보다 운영 설계 부족인 경우가 많다.

- 좋은 AI 워크플로는 사용자를 게으르게 만드는 것이 아니라 판단을 더 선명하게 만든다. 에이전트가 초안을 만들고, 사람은 목표와 경계를 정하고, 자동화는 검증과 배포 증거를 남기는 식의 역할 분담이 필요하다.

- Medium 글을 읽을 때도 제품 이름보다 질문을 가져오는 편이 좋다. 이 도구는 어떤 고통을 줄이는가, 사용자가 왜 다시 돌아오는가, 도입 후에도 남는 수작업은 무엇인가, 실패했을 때 누가 책임지는가 같은 질문이 더 오래 쓸모 있다.

- 결국 AI 도구의 평가는 벤치마크, 기능표, 데모 영상만으로 끝나지 않는다. 실제 채택률, 반복 사용률, 실패 후 복구 시간, 팀의 신뢰도 같은 운영 지표가 함께 있어야 한다.

## 일반 독자에게 중요한 포인트

- AI 제품을 볼 때 "무엇을 할 수 있는가"보다 "언제 다시 쓰게 되는가"를 물어야 한다. 신기해서 한 번 써보는 행동과, 바쁜 날에도 습관처럼 켜는 행동은 완전히 다르다.

- 데모가 화려할수록 실제 환경을 더 꼼꼼히 봐야 한다. 데이터가 지저분할 때, 사용자가 설명을 덜 해줄 때, 네트워크가 느릴 때, 기존 시스템과 충돌할 때도 가치가 유지되어야 한다.

- 코딩 에이전트는 개발자만의 이야기가 아니다. 소프트웨어 제작 비용과 속도, 고객 지원 품질, 사내 자동화 방식에 영향을 준다. 하지만 좋은 결과는 도구 하나가 아니라 도구를 둘러싼 절차에서 나온다.

- 사용자가 돈을 내는 이유는 "AI라서"가 아니다. 놓친 전화를 줄이거나, 반복 업무를 줄이거나, 배포 전 검증 시간을 줄이거나, 팀의 의사결정을 빠르게 만드는 식의 구체적 고통이 줄어야 한다.

- AI 도입에 실패한 사례를 무조건 기술 실패로만 보면 배울 것이 줄어든다. 때로는 고객군을 잘못 골랐거나, 온보딩을 과하게 수작업으로 했거나, 실제 구매 이유와 데모에서 보여준 이유가 달랐을 수 있다.

- 개인 사용자도 작은 기준표를 만들 수 있다. 한 번 써보고 놀라웠는지보다, 일주일 뒤에도 켰는지, 결과를 고치는 시간이 줄었는지, 실패했을 때 다시 시도할 만큼 신뢰가 남았는지를 보면 된다.

## 원문의 논리를 단계별로 보면

첫 단계는 ${theme.stepHeadings[0]}이다. 초기 사용자의 반응이 좋다고 해서 제품이나 워크플로가 안착한 것은 아니다. 사람들은 새롭고 재미있는 도구를 기꺼이 시험한다. 그러나 실제 반복 사용은 다른 문제다. 반복 사용은 도구가 사용자의 경제적, 시간적, 운영적 고통을 줄이고, 그 결과를 사용자가 이해할 수 있을 때 생긴다.

두 번째 단계는 ${theme.stepHeadings[1]}이다. AI 기능을 좋아하는 사람과 AI 기능이 꼭 필요한 사람은 다를 수 있다. 코딩 에이전트도 마찬가지다. 호기심 많은 개발자는 여러 도구를 테스트하지만, 실제로 비용을 지불하고 워크플로에 넣는 팀은 병목이 뚜렷한 팀이다. 레거시 코드 이해, 반복 테스트 작성, 배포 전 점검, 문서화 같은 고통이 클수록 채택 가능성이 높다.

세 번째 단계는 ${theme.stepHeadings[2]}이다. AI 도구는 모델만으로 완성되지 않는다. 사용자가 어떤 입력을 줘야 하는지, 결과를 어떻게 검토해야 하는지, 실패하면 어디를 봐야 하는지까지 설계되어야 한다. 이 부분이 약하면 기능은 좋아도 습관이 되지 못한다.

마지막 단계는 ${theme.stepHeadings[3]}이다. AI가 중간 산출물을 잘 만드는 것과 업무가 끝나는 것은 다르다. 블로그 발행이라면 글 파일 생성이 끝이 아니라 빌드 통과, 커밋, 푸시, 공개 URL 확인까지가 끝이다. 개발이라면 코드 생성이 끝이 아니라 테스트, 리뷰, 배포, 모니터링까지가 끝이다. 채택되는 도구는 이 마지막 구간을 가볍게 만든다.

## 적용 아이디어

- AI 제품이나 에이전트를 평가할 때 첫날 인상과 7일 뒤 사용 여부를 따로 기록하자. 첫날 점수는 호기심을, 7일 뒤 점수는 실제 채택 가능성을 보여준다.

- 도입 전에 "이 도구가 줄여야 할 고통"을 한 문장으로 적어두자. 예를 들어 "테스트 작성 시간을 줄인다", "고객 문의 누락을 줄인다", "레거시 코드 이해 시간을 줄인다"처럼 구체적이어야 한다.

- 코딩 에이전트에는 완료 조건을 명시하자. 파일 수정뿐 아니라 빌드, 테스트, 커밋 가능 diff, 공개 URL 또는 실행 로그까지 요구하면 중간 성공을 최종 성공으로 착각할 가능성이 줄어든다.

- 팀 단위로는 AI 사용 규칙을 문서화하자. 어떤 파일은 수정 금지인지, 어떤 명령은 실행 가능한지, 어떤 변경은 사람 리뷰가 필요한지 정해두면 도구가 늘어나도 품질이 흔들리지 않는다.

- 사용자 인터뷰에서는 "멋졌나요"보다 "다음에도 쓰겠나요"를 물어야 한다. 더 좋은 질문은 "이 도구가 없으면 오늘 어떤 손해가 생기나요"다. 손해가 분명할수록 채택 가능성이 높다.

- 화이트글러브 온보딩을 조심하자. 사람이 뒤에서 과도하게 맞춤 설정해주면 제품 자체의 힘과 운영자의 노동이 섞인다. 초기에는 도움이 되지만, 반복 가능한 제품성을 판단하기 어려워진다.

- 자동화 작업에는 짧은 검증 스크립트를 붙이자. 사람이나 에이전트가 매번 같은 절차를 기억하게 하기보다, 성공 조건을 코드로 고정하면 실패가 더 빨리 드러난다.

- 도구 선택 회의에서는 기능표보다 실패 시나리오를 먼저 보자. 사용량 제한, 접근 권한, 로그 부재, 검토 불가능한 변경, 배포 지연 같은 문제가 실제 운영 비용을 만든다.

## 읽기 우선순위

이 글은 AI 제품을 만들거나 도입하는 사람에게 우선순위가 높다. 특히 데모 반응은 좋은데 실제 사용량이나 결제가 기대만큼 따라오지 않는 팀이라면, 모델 성능보다 채택 설계를 먼저 봐야 한다. 코딩 에이전트를 쓰는 개발자라면 도구 이름의 승패보다 작업이 끝나는 조건을 어떻게 정의할지에 초점을 맞추면 좋다.

원문은 AI 도구의 실전 사용이라는 큰 주제를 다루지만, 읽고 나면 개발 자동화에도 바로 적용할 수 있다. 오늘의 한 줄은 이렇다. ${theme.finalLine}
`;
}

const date = argValue('--date', todayInSeoul());
const force = process.argv.includes('--force');
const existing = existingPostFor(date);
if (existing && !force) {
  console.log(`existing post: ${existing}`);
  process.exit(0);
}

const posts = recentPosts().filter((post) => !post.name.startsWith(`${date}-`));
const recent = {
  sourceTitles: recentSourceTitles(posts),
  sourceUrls: recentSourceUrls(posts),
  generatedTitles: recentGeneratedTitles(posts),
  fingerprints: posts.map((post) => topicTokens(`${post.title} ${post.description} ${post.sourceTitle} ${post.bodySample}`)),
};
const candidates = await collectCandidates();
if (candidates.length === 0) throw new Error('no Medium candidates found');

const candidate = candidates
  .map((item) => ({ item, score: score(item, recent) }))
  .sort((a, b) => b.score - a.score)[0].item;

let accessNote = true;
try {
  const readerUrl = `https://r.jina.ai/http://${candidate.link.replace(/^https?:\/\//, '')}`;
  const readerText = await fetchText(readerUrl);
  accessNote = readerText.length < 2500 || /sign up|sign in|get app/i.test(readerText);
} catch {
  accessNote = true;
}

const slug = `${date}-${slugify(candidate.title)}.md`;
const postPath = existing && force ? existing : join(postDir, slug);
writeFileSync(postPath, koreanPost({ date, slug, candidate, accessNote }));
console.log(`created ${postPath}`);
console.log(`source ${candidate.link}`);
