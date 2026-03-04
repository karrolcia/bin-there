/**
 * Quality check for generated pSEO pages.
 * Validates: unique titles/descriptions, minimum content, valid JSON-LD, no broken links.
 * Run: npm run quality-check
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const publicDir = join(__dirname, '..', 'public', 'bins');

interface QualityIssue {
  file: string;
  type: 'error' | 'warning';
  message: string;
}

const issues: QualityIssue[] = [];
const titles = new Map<string, string>();
const descriptions = new Map<string, string>();

function getAllHtmlFiles(dir: string): string[] {
  const files: string[] = [];
  if (!existsSync(dir)) return files;

  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      files.push(...getAllHtmlFiles(fullPath));
    } else if (entry.endsWith('.html')) {
      files.push(fullPath);
    }
  }
  return files;
}

function extractTag(html: string, regex: RegExp): string | null {
  const match = html.match(regex);
  return match ? match[1] : null;
}

function countWords(html: string): number {
  // Strip HTML tags, decode entities, count words
  const text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text.split(' ').filter(w => w.length > 0).length;
}

function validateJsonLd(html: string, file: string): void {
  const ldRegex = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
  let match;
  let found = false;

  while ((match = ldRegex.exec(html)) !== null) {
    found = true;
    try {
      const data = JSON.parse(match[1]);
      // Check it has @context and @type
      if (Array.isArray(data)) {
        for (const item of data) {
          if (!item['@context'] || !item['@type']) {
            issues.push({ file, type: 'error', message: 'JSON-LD item missing @context or @type' });
          }
        }
      } else {
        if (!data['@context'] || !data['@type']) {
          issues.push({ file, type: 'error', message: 'JSON-LD missing @context or @type' });
        }
      }
    } catch (e) {
      issues.push({ file, type: 'error', message: `Invalid JSON-LD: ${(e as Error).message}` });
    }
  }

  if (!found) {
    issues.push({ file, type: 'warning', message: 'No JSON-LD structured data found' });
  }
}

function validatePage(filePath: string): void {
  const html = readFileSync(filePath, 'utf-8');
  const relPath = filePath.replace(join(__dirname, '..', 'public') + '/', '');

  // Check title
  const title = extractTag(html, /<title>([^<]+)<\/title>/);
  if (!title) {
    issues.push({ file: relPath, type: 'error', message: 'Missing <title> tag' });
  } else {
    if (titles.has(title)) {
      issues.push({ file: relPath, type: 'error', message: `Duplicate title "${title}" (also in ${titles.get(title)})` });
    }
    titles.set(title, relPath);
  }

  // Check meta description
  const desc = extractTag(html, /meta name="description" content="([^"]+)"/);
  if (!desc) {
    issues.push({ file: relPath, type: 'error', message: 'Missing meta description' });
  } else {
    if (descriptions.has(desc)) {
      issues.push({ file: relPath, type: 'warning', message: `Duplicate description (also in ${descriptions.get(desc)})` });
    }
    descriptions.set(desc, relPath);
  }

  // Check canonical
  const canonical = extractTag(html, /link rel="canonical" href="([^"]+)"/);
  if (!canonical) {
    issues.push({ file: relPath, type: 'error', message: 'Missing canonical URL' });
  }

  // Check H1
  const h1 = extractTag(html, /<h1[^>]*>([^<]+)<\/h1>/);
  if (!h1) {
    issues.push({ file: relPath, type: 'error', message: 'Missing H1 tag' });
  }

  // Check word count (city pages should have 200+ words)
  const wordCount = countWords(html);
  if (relPath.split('/').length > 2 && wordCount < 200) {
    issues.push({ file: relPath, type: 'warning', message: `Low word count: ${wordCount} words (target: 200+)` });
  }

  // Validate JSON-LD
  validateJsonLd(html, relPath);

  // Check internal links
  const linkRegex = /href="(\/[^"]+)"/g;
  let linkMatch;
  while ((linkMatch = linkRegex.exec(html)) !== null) {
    const href = linkMatch[1];
    // Check if the linked page exists (either as file or directory with index.html)
    if (href.startsWith('/bins/')) {
      const targetPath = join(__dirname, '..', 'public', href, 'index.html');
      const targetPathDirect = join(__dirname, '..', 'public', href);
      if (!existsSync(targetPath) && !existsSync(targetPathDirect)) {
        issues.push({ file: relPath, type: 'warning', message: `Potentially broken internal link: ${href}` });
      }
    }
  }
}

// Main
console.log('Running quality checks on generated pages...\n');

const htmlFiles = getAllHtmlFiles(publicDir);

if (htmlFiles.length === 0) {
  console.log('No generated pages found in public/bins/. Run npm run generate-pages first.');
  process.exit(0);
}

for (const file of htmlFiles) {
  validatePage(file);
}

// Report
const errors = issues.filter(i => i.type === 'error');
const warnings = issues.filter(i => i.type === 'warning');

console.log(`Checked ${htmlFiles.length} pages\n`);

if (errors.length > 0) {
  console.log(`ERRORS (${errors.length}):`);
  for (const e of errors) {
    console.log(`  [ERROR] ${e.file}: ${e.message}`);
  }
  console.log('');
}

if (warnings.length > 0) {
  console.log(`WARNINGS (${warnings.length}):`);
  for (const w of warnings) {
    console.log(`  [WARN]  ${w.file}: ${w.message}`);
  }
  console.log('');
}

if (errors.length === 0 && warnings.length === 0) {
  console.log('All pages passed quality checks.');
}

console.log(`Summary: ${htmlFiles.length} pages, ${errors.length} errors, ${warnings.length} warnings`);

if (errors.length > 0) {
  process.exit(1);
}
