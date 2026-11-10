# html-articles

A [Claude Code](https://claude.com/claude-code) skill for writing articles in Obsidian (or any markdown editor)
and publishing them as a plain HTML page you style yourself.

It covers three things:

1. **Reviewing a draft without rewording it.** Claude lists factual issues, inconsistencies and typos with line
   numbers, then edits only what you approve. Caveats go into footnotes.
2. **Packaging an article.** The markdown and only the images it embeds are copied into one folder.
3. **Converting to HTML** with a small script ([`build.mjs`](build.mjs)):
   - Obsidian image embeds (`![[Pasted image ….png]]`) become normal images
   - retina screenshots and charts show at half their pixel size, capped at 720px, and shrink on phones
   - the page loads compressed WebP copies of the PNGs (about two-thirds smaller), and every image has its size
     set so nothing shifts while images load
   - footnotes, tables and Obsidian-style line breaks render correctly
   - an optional author byline using the standard HTML authorship tags
   - a few CSS rules only: a centred column, images that fit the screen, and centred tables with thin borders

## Install

Clone the repo into your Claude Code skills folder:

```bash
git clone https://github.com/chidam333/html-articles ~/.claude/skills/html-articles
```

Claude Code picks it up in new sessions. Ask for things like "review my article", "turn this note into an HTML
page" or "package this post with its images".

## Using the script on its own

`build.mjs` also works without Claude. Put it in a folder next to your `.md` files and an `images/` folder, then:

```bash
npm install --save-dev --save-exact markdown-it@<version> markdown-it-footnote@<version> sharp@<version>
npm audit                      # pick a markdown-it version with no known advisories
ARTICLE_AUTHOR="your-handle" ARTICLE_AUTHOR_URL="https://github.com/your-handle" node build.mjs
```

Each `<name>.md` becomes `<name>.html` next to it, and each embedded PNG gets a WebP copy in `images/web/`
(publish that folder with the page). Leave out the two `ARTICLE_*` variables for no byline.
Requires Node 20.9 or later (for sharp).

## License

[MIT](LICENSE)
