# Daily Medium blog publishing instructions

Publish one Korean blog post per day for the Medium recommendation workflow. The detail page should be substantial: close to the depth previously shared in Telegram, not a short teaser.

Repository: `/Users/kueen108/git/KokomaSoftSite`
Post directory: `src/content/medium-digest`
Slug format: `YYYY-MM-DD-short-topic.md`
Public URL after deploy: `/blog/<slug>/` (intended domain: `https://blog.kokomasoft.com/` once Cloudflare routes that hostname to the blog path/site)

## Selection
- Research current Medium articles related to AI, Claude Code, Codex, OpenClaw, and coding agents.
- Pick exactly one article: the most useful for 챨리 today.
- Prefer recent, practical, non-obvious pieces.
- If full Medium access is blocked, use public metadata/snippets and explicitly note the limitation in the post.
- Do not reproduce large copyrighted passages. Summarize and comment in Korean, link to the original.

## Post frontmatter
Use this exact shape:

```yaml
---
title: "오늘의 AI 글: ..."
description: "..."
pubDate: "YYYY-MM-DD"
sourceTitle: "Original Medium title"
sourceUrl: "https://..."
sourceAuthor: "Author name if known"
tags: ["AI", "Claude Code", "Codex"]
---
```

## Body format
Use Korean and this structure. Target 1,800-2,800 Korean words (roughly 8,000-14,000 Korean characters) when source material allows. The list page can stay concise, but the detail page must feel like a full Telegram-style briefing with context, explanation, opinion, and practical takeaways. Do not pad with fluff; add concrete examples, implications, and 챨리-specific interpretation.

Required depth rules:
- `왜 이 글인가`: 3+ paragraphs with context and why it matters now.
- `핵심 요약`: include explanation, not only short bullets.
- Include at least one section that explains the original article’s argument step by step.
- Include a 챨리-specific section connecting the article to OpenClaw/coding-agent/automation habits when relevant.
- Include concrete checklist/action items.
- Preserve copyright safety: summarize and comment; do not reproduce long source passages.

Use this structure:

```markdown
## 왜 이 글인가
3+ substantial paragraphs.

## 핵심 요약
- 7~10 bullets or short explanatory paragraphs.

## 챨리에게 중요한 포인트
- 4~6 bullets or paragraphs.

## 적용 아이디어
- 5~8 concrete actions, checks, or experiments.

## 읽기 우선순위
A short but opinionated reading recommendation, plus when to read the original.

## 접근/검증 메모
Mention whether the full article was available, and what sources were used.
```

## Publish steps
1. Pull latest main branch.
2. If today's post already exists, update it instead of creating a duplicate.
3. Create/update the markdown post.
4. Run `npm run build`.
5. Commit with `blog: publish daily medium digest YYYY-MM-DD`.
6. Push to origin so Cloudflare deploys automatically.
