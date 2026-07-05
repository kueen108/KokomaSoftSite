# Daily knowledge blog publishing instructions

Publish one Korean blog post per day for the general knowledge workflow. The post should feel like a thoughtful daily briefing/article: useful to a modern intellectually curious reader, public-facing, and worth saving.

Repository: `/Users/kueen108/git/KokomaSoftSite`
Post directory: `src/content/medium-digest`
Slug format: `knowledge-YYYY-MM-DD-short-topic.md`
Public URL after deploy: `/blog/<slug>/` (intended domain: `https://blog.kokomasoft.com/`)

## Mission
- Each day, choose exactly one topic the reader would benefit from knowing.
- Topic can be from classics, history, science, technology, philosophy, literature, art, film, music, pop culture, business, economics, psychology, language, trends, or any other intellectually valuable area.
- The topic does **not** need to be tied to breaking news. Prefer enduring value, timely relevance, or surprising explanatory power.
- Avoid repeating recent topics. Before writing, inspect existing posts in `src/content/medium-digest` for recent `knowledge-` slugs and choose something meaningfully different.
- Write as an original Korean blog article. Do not copy long passages from sources. Quote sparingly and only when necessary.

## Research and selection
- Use web search/fetch or reliable public references to verify core facts.
- Pick one primary source/reference URL for frontmatter. Add additional links in the body when useful.
- Favor topics with clear explanatory payoff: after reading, the audience should understand a concept, work, movement, person, or phenomenon better.
- Do not make a list of candidates in the final post. The published article is about the chosen topic only.

## Post frontmatter
Use this exact shape so the existing site can render it:

```yaml
---
title: "오늘의 지식: ..."
description: "..."
pubDate: "YYYY-MM-DD"
sourceTitle: "Primary source or reference title"
sourceUrl: "https://..."
sourceAuthor: "Author or organization if known"
tags: ["오늘의 지식", "..."]
---
```

## Body format
Use Korean. Target roughly 1,800-2,800 Korean words when the topic supports it. Write for a public audience; do not mention 챨리 or the owner by name.

Required qualities:
- Start with why this subject is worth knowing now.
- Explain the background clearly enough for a smart non-specialist.
- Include concrete examples, analogies, or cultural references when helpful.
- Add an opinionated interpretation: what people often misunderstand, why it matters, or how to apply it.
- End with a concise takeaway that the reader can remember.
- If facts are uncertain or debated, say so plainly.

Use this structure:

```markdown
## 왜 오늘 이 주제인가
3+ substantial paragraphs.

## 핵심 배경
Explain the concept/person/work/event/movement step by step.

## 사람들이 자주 놓치는 포인트
4~7 bullets or short explanatory paragraphs.

## 현대적으로 읽는 법
Connect it to contemporary life, work, culture, or thinking.

## 더 알아보기
- 2~5 useful links or reading/viewing/listening suggestions.

## 오늘의 한 문장
One memorable takeaway sentence.
```

## Publish steps
1. Run `git pull --ff-only origin main` before editing. If the pull fails because the branch diverged or local changes are dirty, stop and report the sync problem instead of generating a post.
2. Inspect recent `knowledge-` posts to avoid repeating subjects.
3. If today's `knowledge-YYYY-MM-DD-...md` post already exists, update it instead of creating a duplicate.
4. Create/update the markdown post.
5. Run `npm run build`.
6. Commit with `blog: publish daily knowledge digest YYYY-MM-DD`.
7. Push to origin, then run `npx wrangler deploy` so Cloudflare serves the new post.

## Final Telegram response
Keep the final response short:
- 발행 성공 여부
- 블로그 글 제목
- URL: `https://blog.kokomasoft.com/<slug>/`
- Cron/runtime must have Cloudflare auth available, preferably `CLOUDFLARE_API_TOKEN`, because this repo does not have a GitHub Actions deploy workflow.
- 주요 참고 링크
- 빌드/푸시 결과 한 줄

If blocked, briefly report where it got stuck and the next needed action.
