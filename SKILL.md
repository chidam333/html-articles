---
name: html-articles
description: Review an article draft without rewording it, package an Obsidian markdown article with its pasted images into a folder, and turn it into a plain HTML page — a centred column, images at sensible size that shrink on phones and load as compressed WebP without layout shift, centred bordered tables, footnotes, and an optional author byline, with almost no styling. Use when the user wants an article or blog post reviewed, exported or published as HTML, an Obsidian/Quartz note converted to HTML, or an article folder set up in a repo.
---

# HTML articles

A workflow for articles written in Obsidian (or any markdown editor) that need a review pass, a
self-contained folder (markdown + images) and a bare HTML page the author styles themselves.

## 1. Reviewing a draft

- **Never reword without asking.** Read the article, then report problems as a numbered list with line
  numbers, grouped as: factual issues (worth fixing), inconsistencies, smaller things, typos (flagged, not
  changed). Then wait: the author answers per item ("fix it", "footnote", "leave it"), and only those get edited.
- Check every claim against its source data (result files, measurements, linked pages), not against memory.
  Check that every embedded image exists and every link loads.
- Look at the images and charts too: a chart label that disagrees with a number in the text needs a note.
- When fixing, keep the author's voice and style; change only the words needed.
- For caveats the author wants kept out of the main text, use **footnotes** (`[^name]` in the text,
  `[^name]: …` at the end). For a note about an image, put a line starting with `\*` directly under it.
- The author may be editing the file at the same time. If an edit fails because the file changed, re-read it,
  keep their changes, and re-apply only what was agreed.

## 2. Titles and file names

- In Obsidian and Quartz, a note's title is usually its **file name**. Renaming the file changes the page's URL,
  so ask before renaming, check that no other note links to the old name, and keep `?` and other URL-unsafe
  characters out of file names. If a title needs such characters, a `title:` frontmatter line is the alternative.

## 3. Packaging an article

Create a folder (default `article/`), usually next to whatever the article is about:

```
article/
├── <Post title>.md          exact copy of the source note, unchanged
├── <Post title>.html        generated
├── build.mjs                copied from this skill
└── images/                  only the images the post embeds
    └── web/                 generated WebP copies the page actually loads
```

- Find images by reading the `![[…]]` embeds out of the post, then locate each file in the vault (often an
  `images/` or attachments folder). Copy only those.
- Don't edit the copied `.md`; all conversion happens in `build.mjs`. Confirm the copy is identical (`cmp`).

## 4. Converting to HTML

Copy [`build.mjs`](build.mjs) from this skill's folder into the article folder. Install its three libraries as
**dev dependencies, pinned to exact versions**:

```bash
npm install --save-dev --save-exact markdown-it@<version> markdown-it-footnote@<version> sharp@<version>
npm audit
node article/build.mjs
```

- **Choose a markdown-it version with no known vulnerabilities.** Older 14.x releases have ReDoS and
  quadratic-time advisories. Run `npm audit`; if it flags markdown-it, check release dates with
  `npm view markdown-it time --json` and pin the newest patched version that has been out for at least two weeks.
- Plain markdown converters drop footnotes; that is what `markdown-it-footnote` is for.
- **Byline:** ask the author how they want to be credited (name or handle, and a link such as their GitHub
  profile). Set `AUTHOR` at the top of `build.mjs`, or pass `ARTICLE_AUTHOR` / `ARTICLE_AUTHOR_URL` in the
  environment. Leave both empty for no byline. Never add a real name or email the author didn't give.

What the script does, and why — keep all of it:

| Behaviour | Why |
|---|---|
| `breaks: true` | Obsidian shows a single newline as a line break; without this, stacked lines (log output, formulas) merge into one paragraph. |
| `![[name.png]]` → `<img src="images/name%20…png">` | Browsers and GitHub don't understand Obsidian embeds. File names often contain spaces, so they're URL-encoded. |
| PNG `width`/`height` = half the pixel size, capped at `MAX_WIDTH` (720) | Pasted screenshots and exported charts are usually 2x (1,300–2,000px wide) and dominate the page at full size. Sizes are read from the PNG header; other formats keep their natural size. |
| `width`/`height` on every PNG, plus `img { height: auto }` | The browser reserves each image's box before it loads, so text doesn't jump (no layout shift). Keep both: the attributes give the aspect ratio, the CSS lets the box shrink on phones. |
| PNGs → WebP copies in `images/web/`, at most 2× `MAX_WIDTH` (1440px) wide | Screenshots straight from the clipboard are large. 2× the column is still sharp on retina screens. On a typical article this cuts images by about two-thirds (~820 KB → ~280 KB). The original PNGs stay untouched for Obsidian. |
| Per image, the smaller of WebP quality 90 and lossless WebP | Lossy wins for charts and photos, lossless for small screenshots of text (it can be a third the size). Quality 90 keeps chart text crisp. |
| Copies rebuilt only when the PNG is newer | Re-running the build is fast. |
| `loading="lazy"`, `decoding="async"` | Images below the fold load as the reader scrolls and decode off the main thread. |
| `<meta name="author">`, `<link rel="author">`, `<address>By <a rel="author">…</a></address>` | The standard HTML way to mark authorship, read by browsers, search engines and link previews. |
| `<article>` + `<header>` around title, byline and body | Ties the byline to the post. |
| `<title>` and `<h1>` from the file name | Matches how Obsidian/Quartz title notes. |

## 5. Styling: almost none

The author adds their own styling. The page gets only these rules:

```css
body { max-width: 720px; margin: 0 auto; padding: 48px 16px; } /* centred column, space above the title, side margins */
img { max-width: 100%; height: auto; }                        /* images shrink on phones */
table { margin: 0 auto; border-collapse: collapse; }          /* tables sit in the middle of the column */
th, td { border: 1px solid; padding: 4px 12px; }              /* thin borders; padding keeps text off the lines */
```

- The column width matches the image cap, so on desktop the `img` rule never triggers.
- Without `img { max-width: 100% }`, fixed image widths overflow on phones and push text off-screen.
- Don't add fonts, colours or anything else unless asked.

## 6. Checks before handing over

After `node article/build.mjs`:

- every `<img>` src resolves to a file (decode the URL first); local PNGs point at `images/web/*.webp`, and
  every one has `width` and `height`;
- look at the page itself (for example a headless Chrome screenshot at `--force-device-scale-factor=2`), not
  just the image files, to confirm the WebP images are sharp and the boxes are the right size;
- the number of tables and `footnote-item`s matches the markdown, and no `[[` is left in the HTML;
- `<body>` and `<article>` each appear once;
- stacked lines (logs, formulas) kept their line breaks.

If the author sends a screenshot that doesn't match the current output, it is usually a stale page: say so and
ask them to reload before changing any code.

## 7. Committing

Don't commit or push unless asked. When asked, commit the article folder (including `images/web/`), the build
script and the `package.json`/lockfile changes together.
