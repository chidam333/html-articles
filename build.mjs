// html-articles: converts every .md in this folder to a bare .html page next to it.
// - Obsidian image embeds like ![[Pasted image 123.png]] become <img> tags pointing at images/
// - PNG images show at half their pixel size (retina captures), capped at MAX_WIDTH, and shrink on phones
// - Footnotes ([^name]) render as linked notes at the bottom
// - Only three CSS rules: a centred column, images that fit the screen, and centred, bordered tables
//
// Copy this file into the article folder, then run: node <folder>/build.mjs
// Needs (pinned, as dev dependencies): markdown-it (a version npm audit reports as clean) and markdown-it-footnote
// Optional byline: set AUTHOR below, or ARTICLE_AUTHOR / ARTICLE_AUTHOR_URL in the environment.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import MarkdownIt from 'markdown-it';
import footnote from 'markdown-it-footnote';

const AUTHOR = {
	name: process.env.ARTICLE_AUTHOR ?? '', // e.g. 'your-github-handle'; leave empty for no byline
	url: process.env.ARTICLE_AUTHOR_URL ?? '', // e.g. 'https://github.com/your-github-handle'
};
const MAX_WIDTH = 720; // column width and largest image width, in CSS pixels
const IMAGE_DIR = 'images'; // where embedded images live, relative to this folder

const dir = new URL('./', import.meta.url);
// breaks: true keeps single line breaks as new lines, the way Obsidian shows them
const md = new MarkdownIt({ html: false, linkify: false, breaks: true }).use(footnote);

const escapeHtml = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Show PNGs at half their pixel size (most screenshots and exported charts are 2x), at most MAX_WIDTH wide.
const pngSize = file => {
	const header = readFileSync(file).subarray(16, 24); // PNG IHDR: width, height as big-endian uint32
	return { width: header.readUInt32BE(0), height: header.readUInt32BE(4) };
};
md.renderer.rules.image = (tokens, idx) => {
	const token = tokens[idx];
	const src = token.attrGet('src');
	let size = '';
	try {
		const { width, height } = pngSize(new URL(decodeURI(src), dir));
		const shown = Math.min(MAX_WIDTH, Math.round(width / 2));
		size = ` width="${shown}" height="${Math.round(height * shown / width)}"`;
	} catch {
		// not a local PNG: leave it at its natural size (the CSS still keeps it inside the column)
	}
	return `<img src="${escapeHtml(src)}" alt="${escapeHtml(token.content)}"${size} loading="lazy">`;
};

const byline = AUTHOR.name
	? AUTHOR.url
		? `<address>By <a rel="author" href="${escapeHtml(AUTHOR.url)}">${escapeHtml(AUTHOR.name)}</a></address>`
		: `<address>By ${escapeHtml(AUTHOR.name)}</address>`
	: '';
const authorHead = [
	AUTHOR.name && `<meta name="author" content="${escapeHtml(AUTHOR.name)}">`,
	AUTHOR.url && `<link rel="author" href="${escapeHtml(AUTHOR.url)}">`,
].filter(Boolean).join('\n');

for (const file of readdirSync(dir).filter(f => f.endsWith('.md'))) {
	const source = readFileSync(new URL(file, dir), 'utf8');
	// Obsidian embeds -> standard markdown images (the .md file itself is not changed)
	const markdown = source.replace(/!\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/g, (_, name) => `![](${IMAGE_DIR}/${encodeURI(name.trim())})`);
	const title = file.replace(/\.md$/, '');
	const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
${authorHead ? authorHead + '\n' : ''}<style>body { max-width: ${MAX_WIDTH}px; margin: 0 auto; padding: 0 16px; } img { max-width: 100%; height: auto; } table { margin: 0 auto; border-collapse: collapse; } th, td { border: 1px solid; padding: 4px 12px; }</style>
</head>
<body>
<article>
<header>
<h1>${escapeHtml(title)}</h1>
${byline ? byline + '\n' : ''}</header>
${md.render(markdown)}</article>
</body>
</html>
`;
	const out = file.replace(/\.md$/, '.html');
	writeFileSync(new URL(out, dir), html);
	console.log(`${file} -> ${out}`);
}
