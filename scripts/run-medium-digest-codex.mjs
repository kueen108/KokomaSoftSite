#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

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

const date = argValue('--date', todayInSeoul());
mkdirSync(outputDir, { recursive: true });

run('git', ['fetch', 'origin', 'main']);
run('git', ['merge', '--ff-only', 'FETCH_HEAD']);

if (!mediumPostFor(date)) {
  run('node', ['scripts/generate-medium-digest.mjs', '--date', date]);
}

console.log(run('node', ['scripts/publish-medium-digest.mjs', '--date', date]).trim());
