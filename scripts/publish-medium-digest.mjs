#!/usr/bin/env node
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';

const repoRoot = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const postDir = join(repoRoot, 'src/content/medium-digest');
const logDir = join(repoRoot, 'output');
const logPath = join(logDir, 'medium-digest-cron.log');

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

function run(command, args, options = {}) {
  mkdirSync(logDir, { recursive: true });
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 8,
    ...options,
  });
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;
  writeFileSync(logPath, `\n\n$ ${command} ${args.join(' ')}\n${output}`, { flag: 'a' });
  if (result.status !== 0) {
    const tail = output.trim().split('\n').slice(-50).join('\n');
    throw new Error(`${command} ${args.join(' ')} failed\n${tail}`);
  }
  return output;
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

function validatePost(filePath, date) {
  const content = readFileSync(filePath, 'utf8');
  const data = parseFrontmatter(content);
  const required = ['title', 'description', 'pubDate', 'sourceTitle', 'sourceUrl'];
  for (const field of required) {
    if (!data[field]) throw new Error(`${basename(filePath)} frontmatter is missing ${field}`);
  }
  if (data.pubDate !== date) throw new Error(`pubDate ${data.pubDate} does not match ${date}`);
  new URL(data.sourceUrl);

  const body = content.replace(/^---\n[\s\S]*?\n---\n?/, '').trim();
  const requiredHeadings = [
    '## 왜 이 글인가',
    '## 핵심 요약',
    '## 일반 독자에게 중요한 포인트',
    '## 적용 아이디어',
    '## 읽기 우선순위',
  ];
  for (const heading of requiredHeadings) {
    if (!body.includes(heading)) throw new Error(`${basename(filePath)} is missing heading: ${heading}`);
  }
  if (body.length < 4500) {
    throw new Error(`${basename(filePath)} body is too short for the public digest (${body.length} chars)`);
  }
  if (/챨리|Eunjin Kwon|kueen108/i.test(body)) {
    throw new Error(`${basename(filePath)} appears to include private owner context`);
  }
  return data;
}

function findPost(date) {
  if (!existsSync(postDir)) throw new Error(`post directory not found: ${postDir}`);
  const matches = readdirSync(postDir)
    .filter((name) => name.startsWith(`${date}-`) && name.endsWith('.md'))
    .sort();
  if (matches.length === 0) {
    throw new Error(`no Medium digest post found for ${date}; create src/content/medium-digest/${date}-short-topic.md first`);
  }
  if (matches.length > 1) {
    throw new Error(`multiple Medium digest posts found for ${date}: ${matches.join(', ')}`);
  }
  return join(postDir, matches[0]);
}

function gitOutput(args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' }).trim();
}

const date = argValue('--date', todayInSeoul());
const postPath = findPost(date);
const meta = validatePost(postPath, date);
const slug = basename(postPath, '.md');
const url = `https://blog.kokomasoft.com/${slug}/`;

run('npm', ['run', 'build']);

run('git', ['add', postPath]);
const staged = gitOutput(['diff', '--cached', '--name-only']);
let commit = 'no new commit';
if (staged) {
  run('git', ['commit', '-m', `blog: publish daily medium digest ${date}`]);
  commit = gitOutput(['rev-parse', '--short', 'HEAD']);
}

const branch = gitOutput(['branch', '--show-current']) || 'HEAD';
run('git', ['push', 'origin', branch]);

let httpStatus = 'not checked';
try {
  const response = await fetch(url, { redirect: 'manual' });
  httpStatus = String(response.status);
} catch (error) {
  httpStatus = `check failed: ${error.message}`;
}

console.log(`발행 검증 완료`);
console.log(`제목: ${meta.title}`);
console.log(`URL: ${url}`);
console.log(`원문: ${meta.sourceUrl}`);
console.log(`빌드: npm run build 통과`);
console.log(`커밋/푸시: ${commit}, origin ${branch} push 완료`);
console.log(`공개 URL HTTP 상태: ${httpStatus}`);
