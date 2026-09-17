const QUALITY_RULES = {
  knowledge: {
    minBodyChars: 3500,
    minHeadings: 12,
    minBullets: 12,
    minLongParagraphs: 10,
    requiredHeadings: [
      '한 번에 이해하기', '왜 지금도 중요한가', '작동 원리를 세 단계로 보기', '상황별로 비교해보기',
      '검증 가능한 기록으로 바꾸기', '작은 사례', '반례와 한계', '오해하기 쉬운 지점',
      '스스로 점검할 질문', '오늘 써먹는 법',
      '더 알아보기', '오늘의 한 줄',
    ],
  },
  developer: {
    minBodyChars: 3300,
    minHeadings: 11,
    minBullets: 14,
    minLongParagraphs: 9,
    requiredHeadings: [
      '왜 개발자가 알아야 하나', '핵심 개념', '설계할 때 먼저 정할 경계', '실패 시나리오로 점검하기',
      '관측 가능성과 운영 기준', '작은 예시 또는 체크리스트', '실무에서 자주 생기는 오해', '도입 순서',
      '오늘 바로 적용해보기', '더 알아보기', '오늘의 takeaway',
    ],
  },
};

export function validateCuratedQuality(content, workflow) {
  const rules = QUALITY_RULES[workflow];
  if (!rules) throw new Error(`unknown curated quality workflow: ${workflow}`);

  const body = stripFrontmatter(content);
  const headings = [...body.matchAll(/^##\s+(.+)$/gm)].map((match) => match[1].trim());
  const bullets = [...body.matchAll(/^[-*]\s+\S.+$/gm)].length;
  const links = [...body.matchAll(/\[[^\]]+\]\(https?:\/\/[^)]+\)/g)].length;
  const paragraphs = body
    .split(/\n{2,}/)
    .map((paragraph) => {
      if (/^[-*]\s+/m.test(paragraph.trim())) return '';
      return paragraph.replace(/^##\s+.+$/gm, '').trim();
    })
    .filter(Boolean);
  const bulletUnits = [...body.matchAll(/^[-*]\s+(.+)$/gm)].map((match) => match[1].trim());
  const longParagraphs = [...paragraphs, ...bulletUnits].filter((paragraph) => paragraph.length >= 120);
  const errors = [];

  if (body.length < rules.minBodyChars) errors.push(`body is ${body.length} chars; minimum is ${rules.minBodyChars}`);
  if (headings.length < rules.minHeadings) errors.push(`heading count is ${headings.length}; minimum is ${rules.minHeadings}`);
  for (const heading of rules.requiredHeadings) if (!headings.includes(heading)) errors.push(`missing heading: ${heading}`);
  if (bullets < rules.minBullets) errors.push(`bullet count is ${bullets}; minimum is ${rules.minBullets}`);
  if (longParagraphs.length < rules.minLongParagraphs) {
    errors.push(`substantive paragraph count is ${longParagraphs.length}; minimum is ${rules.minLongParagraphs}`);
  }
  if (links < 1) errors.push('at least one source link is required');
  if (/\bundefined\b|\[object Object\]|TODO|TBD/.test(body)) errors.push('unresolved template marker found');

  const nearDuplicate = findNearDuplicateParagraphs(longParagraphs);
  if (nearDuplicate) errors.push(`near-duplicate paragraphs found (${nearDuplicate.similarity.toFixed(2)})`);

  const metrics = { bodyChars: body.length, headings: headings.length, bullets, substantiveParagraphs: longParagraphs.length, links };
  if (errors.length > 0) throw new Error(`curated ${workflow} quality check failed: ${errors.join('; ')}`);
  return metrics;
}

function stripFrontmatter(content) {
  return String(content).replace(/^---\n[\s\S]*?\n---\n?/, '').trim();
}

function findNearDuplicateParagraphs(paragraphs) {
  for (let left = 0; left < paragraphs.length; left += 1) {
    const leftTokens = tokens(paragraphs[left]);
    for (let right = left + 1; right < paragraphs.length; right += 1) {
      const similarity = jaccard(leftTokens, tokens(paragraphs[right]));
      if (similarity >= 0.88) return { left, right, similarity };
    }
  }
  return null;
}

function tokens(value) {
  return new Set(String(value).toLowerCase().replace(/[^a-z0-9가-힣]+/g, ' ').split(/\s+/).filter((token) => token.length >= 2));
}

function jaccard(left, right) {
  if (left.size === 0 || right.size === 0) return 0;
  let intersection = 0;
  for (const token of left) if (right.has(token)) intersection += 1;
  return intersection / (left.size + right.size - intersection);
}
