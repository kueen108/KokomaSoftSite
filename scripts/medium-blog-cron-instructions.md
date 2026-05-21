# Daily Medium blog publishing instructions

Publish one Korean blog post per day for the Medium recommendation workflow.

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
Use Korean and this structure:

```markdown
## 왜 이 글인가
2~3 paragraphs.

## 핵심 요약
- 5~7 bullets.

## 챨리에게 중요한 포인트
- 2~3 bullets.

## 적용 아이디어
- 2~4 concrete actions or experiments.

## 읽기 우선순위
One short, opinionated sentence.

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
