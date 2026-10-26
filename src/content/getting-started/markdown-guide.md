---
title: Markdown guide
description: Every Markdown feature Docs-Ready supports, with the syntax and a live example of each.
category: Getting Started
order: 2
published: true
lastUpdated: 2026-10-27
---

Docs-Ready pages are plain Markdown files with a small set of extensions. Everything on this page is rendered by the real pipeline, so each example shows exactly what its syntax produces. If a feature is not listed here, it is not supported (see [What is not supported](#what-is-not-supported)).

:::tip How to read this page
Each feature has a short **syntax** block (a fenced code example) followed by the **result**. Copy the syntax block into any page and it will work.
:::

## Page basics

Every page is one `.md` file. The file path becomes the URL: `src/content/guides/setup.md` is served at `/guides/setup`. A block of settings called *frontmatter* goes at the very top, between two `---` lines.

```markdown title="src/content/guides/setup.md"
---
title: Set up your project
description: One sentence shown under the title and used in search.
category: Guides
order: 2
published: true
lastUpdated: 2026-10-27
---

Write the page here.
```

| Field | Required | What it does |
| --- | --- | --- |
| `title` | Recommended | The page title. If missing, a leading `# Heading` is used, then the file name. |
| `description` | No | Shown under the title, used for search results and link previews. |
| `category` | No | The sidebar section. Must match a section name exactly. Defaults to the folder name. |
| `order` | No | Position inside the section; lower comes first. Defaults to the end. |
| `published` | No | `false` keeps the page out of the site, the sidebar and the search index. |
| `lastUpdated` | No | A `YYYY-MM-DD` date shown at the bottom of the page. |

:::note
You do not need a `# Title` line in the body. The title comes from the frontmatter and is displayed for you. If a page does start with a single `#` heading, it is removed so the title never appears twice.
:::

## Headings and the page outline

Use `##` for sections and `###` for sub-sections. Both appear in the **On this page** outline on wide screens, and the outline highlights where you are as you scroll. Every heading is also a link: click one and its direct address appears in the browser's address bar, ready to share. A `#` appears next to a heading when you hover it.

```markdown
## A section

### A sub-section
```

Deeper levels (`####` and below) render as headings but are not listed in the outline, so prefer two levels for long pages.

## Text formatting

```markdown
**bold**, *italic*, ***both***, ~~strikethrough~~, `inline code`, ==highlighted==

A line break inside a paragraph needs two trailing spaces  
or a backslash at the end of the line.

---
```

**bold**, *italic*, ***both***, ~~strikethrough~~, `inline code`, ==highlighted==

A line break inside a paragraph needs two trailing spaces  
and then the text continues on a new line.

---

The `==highlight==` marker is the way to draw attention to a key phrase without using a callout. Highlights work inside other formatting too, such as **==bold and highlighted==**.

## Links

```markdown
[A page in the same project](markdown-guide.md#links)
[A page in another folder](../other-section/page.md)
[An external site](https://developer.mozilla.org/)
A bare address becomes a link automatically: https://example.com
```

- **Relative `.md` links** are converted to the right site address, and they also work in GitHub's file preview. This is the recommended way to link between pages. If you rename or move a file, update the links that point to it.
- **Anchors** after the `#` jump to a heading, using the same text lowercased with dashes (`## Links` becomes `#links`).
- **External links** open in a new tab and are marked `noopener noreferrer` automatically.
- **Bare addresses** such as https://example.com are turned into links.

Live example: [jump back to Page basics](markdown-guide.md#page-basics), or visit [MDN](https://developer.mozilla.org/).

## Images and captions

Put image files in `public/images/` and reference them with an absolute path. Text in quotes after the path becomes a caption.

```markdown
![Alt text that describes the image](/images/banner.jpg "Caption shown below the image")
```

![Alt text that describes the image](/images/banner.jpg "Caption shown below the image")

Always write meaningful alt text; it is read by screen readers and shown if the image fails to load. Images load lazily, never stretch beyond the content width, and keep their proportions. Without a quoted title, the image is shown without a caption.

For a wide, prominent image, use a [banner](#banner-images) instead.

## Lists

```markdown
- Unordered item
  - Nested item
- Another item

1. First step
2. Second step
   1. A nested step

- [x] A finished task
- [ ] A task still to do
```

- Unordered item
  - Nested item
- Another item

1. First step
2. Second step
   1. A nested step

- [x] A finished task
- [ ] A task still to do

Task lists are display-only checkboxes: readers cannot tick them. Use them for checklists in the page itself, such as an installation checklist.

## Tables

```markdown
| Feature | Supported | Notes |
| :------ | :-------: | ----: |
| Tables  | Yes       | 3 columns |
| Alignment | Yes     | Colons set it |
```

| Feature | Supported | Notes |
| :------ | :-------: | ----: |
| Tables  | Yes       | Left, centered and right alignment |
| Wide tables | Yes   | Scroll sideways on narrow screens instead of breaking the page |

Cells can contain inline formatting, links and code, but not block elements such as lists or code blocks. Tables scroll horizontally on small screens, so long tables are safe.

## Block quotes

```markdown
> Quotes are good for citing a source, or for short pull-outs.
>
> They can span several paragraphs.
```

> Quotes are good for citing a source, or for short pull-outs.
>
> They can span several paragraphs.

Use a [callout](#callouts) instead when the text is a warning or a tip, because callouts are announced to screen readers as notes and carry a clear label.

## Code blocks

Fenced code blocks are syntax highlighted at build time and have a **Copy** button. Name the language after the opening fence. Add `title="..."` to show a file name instead of the language.

````markdown
```bash
npm install
npm run dev
```

```json title="package.json"
{ "name": "my-docs", "private": true }
```
````

```bash
npm install
npm run dev
```

```json title="package.json"
{ "name": "my-docs", "private": true }
```

```yaml title=".github/workflows/build.yml"
on: push
jobs:
  build:
    runs-on: ubuntu-latest
```

Inline code uses single backticks, like `npm run build`. To show a block that itself contains triple backticks, wrap it in a fence of four backticks.

**Supported languages:** `bash`, `json`, `yaml`, `python`, `javascript`, `typescript`, `jsx`, `tsx`, `vue`, `sql`, `html`, `xml`, `css`, `markdown`, `diff`, `ini` and `toml`. A block with no language, or with a language that is not in this list, is shown as plain text, still with the Copy button. Code blocks keep a dark surface in every theme.

## Callouts

Four callout types highlight information that readers should not miss. Open a block with `:::` and the type, and close it with `:::`.

```markdown
:::note
Neutral background information.
:::

:::tip Optional custom title
A helpful shortcut or recommendation.
:::

:::warning
Something that can go wrong.
:::

:::danger
A destructive or irreversible action.
:::
```

:::note
Neutral background information.
:::

:::tip Optional custom title
A helpful shortcut or recommendation.
:::

:::warning
Something that can go wrong.
:::

:::danger
A destructive or irreversible action.
:::

Text after the type replaces the default title (`Note`, `Tip`, `Warning`, `Danger`). The default titles are translated for each site language; a custom title is shown exactly as you write it. A callout can contain any Markdown, including lists and code:

:::warning Before you deploy
1. Run `npm run build` and fix any errors.
2. Check the site with `npm run preview`.

```bash
npm run build && npm run preview
```
:::

Callouts use color **and** a text label, so their meaning never depends on color alone.

## Columns

Columns place content side by side on wide screens and stack it on narrow ones. Wrap `:::column` blocks in a `::::columns` block. The outer block uses **one more colon** than the blocks inside it.

```markdown
::::columns
:::column
**First column.** Any Markdown.
:::
:::column
**Second column.** Lists, code, links.
:::
::::
```

::::columns
:::column
**First column.** Any Markdown works here, including lists:

- One
- Two
:::
:::column
**Second column.** And `inline code`, [links](#links) and images.
:::
::::

Use as many columns as you need. They share the width and wrap onto new rows when space runs out, so three or four short columns work well for feature lists:

::::columns
:::column
**Fast**

Pages are prebuilt and load on demand.
:::
:::column
**Searchable**

Search is built in and runs in the browser.
:::
:::column
**Plain text**

Every page is a Markdown file.
:::
::::

## Banner images

A banner is a full-width image for the top of a page or a section. It crops to a maximum height and uses the caption, if any, as a visible label.

```markdown
:::banner
![A wide abstract banner](/images/banner.jpg "Banner with a caption")
:::
```

:::banner
![A wide abstract banner](/images/banner.jpg "Banner with a caption")
:::

Wide images (around 1200 by 300 pixels) work best, because the banner is cropped rather than stretched.

## Buttons

Put one or more links in a `:::buttons` block to turn them into call-to-action buttons. The **first link is the primary button**; the others are secondary.

```markdown
:::buttons
[Start here](/)
[Read the license](https://opensource.org/license/mit)
:::
```

:::buttons
[Start here](/)
[Read the license](https://opensource.org/license/mit)
:::

Buttons are normal links, so they are keyboard accessible and work with screen readers. Internal links such as `/` navigate without reloading the page; external links open in a new tab.

## Combining features

Blocks can be nested. Give each outer level **one more colon** than the level inside it, so the parser knows which `:::` closes which block.

````markdown
:::::columns
::::column
:::note
A callout inside a column.
:::
::::
::::column
```bash
npm run build
```
::::
:::::
````

:::::columns
::::column
:::note
A callout inside a column.
:::
::::
::::column
```bash
npm run build
```
::::
:::::

## Search, drafts and translations

- **Search** indexes each page by title, description, headings and body text (including code). A result links straight to the matching heading, so clear headings make pages easier to find. Search results only cover the language being viewed.
- **Drafts:** set `published: false` in the frontmatter. The page is left out of the sidebar, the routes and the search index, and its content is not included in the built site.
- **Translations:** put translated files in `src/content/<language code>/` using the **same relative path** as the original. The language switcher then opens the translated page, and falls back to that language's first page when there is no translation.

## What is not supported

Docs-Ready is deliberately small. These are not supported, so avoid them rather than expecting them to work:

- **Raw HTML.** HTML tags in Markdown are shown as plain text, never rendered. This keeps pages safe and predictable.
- **MDX and embedded components.** Pages are Markdown only.
- **Footnotes, math, diagrams (such as Mermaid), emoji shortcodes and definition lists.**
- **Custom heading IDs and line numbers in code blocks.**
- **Interactive task lists.** Checkboxes display state only.

:::note Need something that is missing?
The Markdown pipeline is a standard `markdown-it` setup configured in `plugins/docs-plugin.js`, so additional `markdown-it` plugins can be added there. New syntax needs matching styles in `src/styles/global.css`.
:::

## Quick reference

| To get | Write |
| --- | --- |
| A section in the outline | `## Heading` |
| Highlighted text | `==text==` |
| Link to another page | `[text](../folder/page.md)` |
| Image with caption | `![alt](/images/x.png "caption")` |
| Code with a file name | ```` ```js title="file.js" ```` |
| Callout | `:::note`, `:::tip`, `:::warning`, `:::danger` |
| Columns | `::::columns` with `:::column` blocks |
| Banner | `:::banner` around an image |
| Buttons | `:::buttons` around links |
| Hide a draft | `published: false` |
