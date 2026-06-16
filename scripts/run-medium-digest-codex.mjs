#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';

const repoRoot = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const postDir = join(repoRoot, 'src/content/medium-digest');
const outputDir = join(repoRoot, 'output');
const logPath = join(outputDir, 'medium-digest-codex.log');

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

function mediumPostFor(date) {
  if (!existsSync(postDir)) return null;
  const matches = readdirSync(postDir)
    .filter((name) => name.startsWith(`${date}-`) && name.endsWith('.md'))
    .sort();
  return matches.length === 1 ? matches[0] : null;
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

function gitStatus(command, args) {
  return spawnSync(command, args, {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 8,
  }).status ?? 1;
}

function frontmatterValue(content, field) {
  return content.match(new RegExp(`^${field}:\\s*["']?(.+?)["']?$`, 'm'))?.[1] ?? '';
}

function archiveUntrackedPost(filename, reason) {
  const postPath = join(postDir, filename);
  const relativePath = join('src/content/medium-digest', filename);
  if (gitStatus('git', ['ls-files', '--error-unmatch', relativePath]) === 0) {
    throw new Error(`refusing to archive tracked post after publish failure: ${filename}`);
  }

  const rejectedDir = join(outputDir, 'rejected-medium-digest');
  mkdirSync(rejectedDir, { recursive: true });
  const archivedPath = join(rejectedDir, `${Date.now()}-${filename}`);
  renameSync(postPath, archivedPath);
  writeFileSync(logPath, `\n\nArchived rejected Medium post: ${filename}\nReason: ${reason}\nPath: ${archivedPath}\n`, { flag: 'a' });
  return {
    archivedPath,
    sourceUrl: frontmatterValue(readFileSync(archivedPath, 'utf8'), 'sourceUrl'),
  };
}

const date = argValue('--date', todayInSeoul());
mkdirSync(outputDir, { recursive: true });

run('git', ['fetch', 'origin', 'main']);
run('git', ['merge', '--ff-only', 'FETCH_HEAD']);

const excludedSourceUrls = [];
let lastError = null;

const maxAttempts = 20;
for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
  if (!mediumPostFor(date)) {
    run('node', ['scripts/generate-medium-digest.mjs', '--date', date, ...excludedSourceUrls.flatMap((url) => ['--exclude-source-url', url])]);
  }

  try {
    console.log(run('node', ['scripts/publish-medium-digest.mjs', '--date', date]).trim());
    process.exit(0);
  } catch (error) {
    lastError = error;
    const message = error.message;
    if (!/too similar|duplicates sourceUrl|duplicates title/.test(message)) throw error;

    const filename = mediumPostFor(date);
    if (!filename) throw error;
    const archived = archiveUntrackedPost(filename, message.split('\n').slice(-1)[0] || message);
    if (archived.sourceUrl) excludedSourceUrls.push(archived.sourceUrl);
    console.warn(`rejected ${filename}; retrying with another Medium candidate (${attempt}/${maxAttempts})`);
  }
}

throw lastError ?? new Error('Medium digest retry attempts exhausted');
