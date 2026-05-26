# Software developer knowledge blog publishing instructions

Publish one Korean blog post per day for the "software developer knowledge" workflow. The post should be useful to practicing software engineers: practical, technically accurate, public-facing, and worth saving.

Repository: `/Users/kueen108/git/KokomaSoftSite`
Post directory: `src/content/medium-digest`
Slug format: `developer-knowledge-YYYY-MM-DD-short-topic.md`
Public URL after deploy: `/blog/<slug>/` (intended domain: `https://blog.kokomasoft.com/`)

## Mission
- Each day, choose exactly one topic that software developers should understand.
- Topic scope includes CS fundamentals, architecture, distributed systems, security, performance, debugging, databases, networking, testing, maintainability, observability, collaboration, AI development tools, developer productivity, and engineering judgment.
- The topic does **not** need to be tied to breaking news. Prefer concepts with durable practical value or timely relevance.
- Avoid repeating recent topics. Before writing, inspect existing posts in `src/content/medium-digest` for recent `developer-knowledge-` slugs and choose something meaningfully different.
- Write as an original Korean blog article. Do not copy long passages from sources. Quote sparingly and only when necessary.

## Research and selection
- Use web search/fetch or reliable public references to verify core facts.
- Pick one primary source/reference URL for frontmatter. Add additional links in the body when useful.
- Favor topics with clear engineering payoff: after reading, the reader should be able to make a better technical decision, avoid a common mistake, or explain the concept more clearly.
- Do not make a list of candidates in the final post. The published article is about the chosen topic only.

## Post frontmatter
Use this exact shape so the existing site can render it:

```yaml
---
title: "개발자가 알아야 할 지식: ..."
description: "..."
pubDate: "YYYY-MM-DD"
sourceTitle: "Primary source or reference title"
sourceUrl: "https://..."
sourceAuthor: "Author or organization if known"
tags: ["개발자가 알아야 할 지식", "Software Engineering", "..."]
---
```

## Body format
Use Korean. Target roughly 1,800-2,800 Korean words when the topic supports it. Write for a public audience; do not mention 챨리 or the owner by name.

Required qualities:
- Start with the practical engineering problem or misconception this topic solves.
- Explain the concept clearly enough for junior-to-mid developers, while still being useful to senior readers.
- Include a small example, scenario, checklist, or tradeoff table written as bullets if helpful.
- Explain where the concept matters in real systems and where people over-apply it.
- End with a concise takeaway that the reader can apply today.
- If facts are uncertain, version-dependent, or debated, say so plainly.

Use this structure:

```markdown
## 왜 개발자가 알아야 하나
3+ substantial paragraphs connecting the topic to real engineering work.

## 핵심 개념
Explain the concept step by step with accurate terminology.

## 작은 예시 또는 체크리스트
A concrete example, pseudo-code, scenario, or 4~7 practical checklist bullets.

## 실무에서 자주 생기는 오해
4~7 bullets or short explanatory paragraphs about pitfalls and tradeoffs.

## 오늘 바로 적용해보기
Specific actions a developer can try in code review, debugging, design, operations, or team process.

## 더 알아보기
- 2~5 useful links or reading suggestions.

## 오늘의 takeaway
One memorable takeaway sentence.
```

## Publish steps
1. Pull latest main branch.
2. Inspect recent `developer-knowledge-` posts to avoid repeating subjects.
3. If today's `developer-knowledge-YYYY-MM-DD-...md` post already exists, update it instead of creating a duplicate.
4. Create/update the markdown post.
5. Run `npm run build`.
6. Commit with `blog: publish developer knowledge digest YYYY-MM-DD`.
7. Push to origin so Cloudflare deploys automatically.

## Final Telegram response
Keep the final response short:
- 발행 성공 여부
- 블로그 글 제목
- URL: `https://blog.kokomasoft.com/<slug>/`
- 주요 참고 링크
- 빌드/푸시 결과 한 줄

If blocked, briefly report where it got stuck and the next needed action.
