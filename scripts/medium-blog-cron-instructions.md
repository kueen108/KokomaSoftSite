# Daily Medium blog publishing instructions

Publish one Korean blog post per day for the Medium recommendation workflow. The detail page should be substantial: close to the depth previously shared in Telegram, not a short teaser.

Repository: `/Users/kueen108/git/KokomaSoftSite`
Post directory: `src/content/medium-digest`
Slug format: `YYYY-MM-DD-short-topic.md`
Public URL after deploy: `/blog/<slug>/` (intended domain: `https://blog.kokomasoft.com/` once Cloudflare routes that hostname to the blog path/site)

## Selection
- Research current Medium articles related to AI, Claude Code, Codex, OpenClaw, and coding agents.
- Pick exactly one article: the most useful for a general developer audience today.
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
Use Korean and this structure. Target 1,800-2,800 Korean words (roughly 8,000-14,000 Korean characters) when source material allows. The list page can stay concise, but the detail page must feel like a full public blog briefing with context, explanation, opinion, and practical takeaways. Do not pad with fluff; add concrete examples, implications, and general-reader interpretation.

Required depth rules:
- `왜 이 글인가`: 3+ paragraphs with context and why it matters now.
- `핵심 요약`: include explanation, not only short bullets.
- Include at least one section that explains the original article’s argument step by step.
- Write for a public audience. Do not mention the owner/user by name. Use headings like `일반 독자에게 중요한 포인트`, `개발자에게 중요한 포인트`, or `실무 적용 포인트`.
- Include concrete checklist/action items.
- Preserve copyright safety: summarize and comment; do not reproduce long source passages.
- Do not include a standing access/verification footer. If access limitations materially affect the article, mention it briefly in the body.

Use this structure:

```markdown
## 왜 이 글인가
3+ substantial paragraphs.

## 핵심 요약
- 7~10 bullets or short explanatory paragraphs.

## 일반 독자에게 중요한 포인트
- 4~6 bullets or paragraphs.

## 적용 아이디어
- 5~8 concrete actions, checks, or experiments.

## 읽기 우선순위
A short but opinionated reading recommendation, plus when to read the original.

```

## Publish steps
1. Run `git pull --ff-only origin main` before editing. If the pull fails because the branch diverged or local changes are dirty, stop and report the sync problem instead of generating a post.
2. If today's post already exists, update it instead of creating a duplicate.
3. Create/update the markdown post.
4. Run `node scripts/publish-medium-digest.mjs --date YYYY-MM-DD`. This script validates the post schema and required headings, runs `npm run build`, commits only the post when changed, pushes the current branch, and checks the public URL once.
5. Report only the script's concise result.

## Cron wrapper
For the actual OpenClaw cron job, prefer the single command below. It performs bounded Medium feed selection, creates the post when needed, then calls the publish script above:

```sh
node scripts/run-medium-digest-codex.mjs --date YYYY-MM-DD
```

## Reliability guardrails
- The Astro content collection schema is in `src/content.config.ts`. Do not read `src/content/config.ts`; that file does not exist in this repository.
- Do not run build, commit, push, or URL checks by hand unless `scripts/publish-medium-digest.mjs` itself fails and the failure message asks for a specific fix.
- Keep terminal output small. The publish script writes command details to `output/medium-digest-cron.log` and prints only a short summary.
