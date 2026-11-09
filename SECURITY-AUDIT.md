# Security audit: Morrelia-co/docs-ready (11/9/2026)

- **Scope:** the repository at `https://github.com/Morrelia-co/docs-ready`, branch `main`, commit `e78eb25` (the only commit; 55 files).
- **Method:** source review, dependency and lockfile analysis, and hands-on testing. Exploits were run against a clone, not against any live site.
- **Result:** 2 high-severity findings, 1 bug that breaks the wizard's output, 5 low, and several informational items. All are fixed in `docs-ready-security-patch.zip`, and every fix was re-tested against the original attack.

## Summary

| # | Severity | Finding | Status in patch |
| --- | --- | --- | --- |
| 1 | **High** | Any Markdown file can run code during the build (`---js` frontmatter) | Fixed, verified |
| 2 | **High** | `markdown-it` 15.0.2: quadratic-time rendering (GHSA-gfr2-rv44-r23c, CVSS 7.5) | Fixed (15.0.3) |
| 3 | Low in context | `dompurify` 3.4.16: three advisories (npm audit labels it critical) | Fixed (3.4.17) |
| 4 | Medium (bug) | Wizard-generated projects fail to build and ship your logo | Fixed, verified |
| 5 | Low | SVG upload filter passes 6 active-content patterns | Fixed, verified |
| 6 | Low | Generator trusts the UI's validation | Fixed, verified |
| 7 | Low | URLs like `/constructor` hit inherited object properties | Fixed, verified |
| 8 | Low | Malformed `#%E0%A4%A` hash throws an unhandled error | Fixed, verified |
| 9 | Low | Missing repository hygiene (`.gitignore`, policy, CI, Dependabot) | Fixed |
| 10 | Info | Personal email address in public commit metadata | Your decision |
| 11 | Info | CSP trade-offs | No change |
| 12 | Info | Project source is served to every visitor | Optional |
| 13 | Info | Missing favicon files, 2.3 MB banner | Your decision |

## Findings

### 1. High: arbitrary code execution at build time via frontmatter

**What.** `gray-matter` supports `---js` and `---javascript` frontmatter and runs it through `eval()`. `plugins/docs-plugin.js` called `matter(...)` with default options, so any `.md` file could execute JavaScript on the machine that builds the site.

**Proof.** A file beginning `---js` with a `require('fs').writeFileSync(...)` call ran during `npm run build` and wrote a file as `root`.

**Impact.** The build environment (CI, Vercel preview builds) can read environment variables and tokens. A contributor who can only change documentation could take them, and a pull request that touches only `.md` files looks harmless to reviewers.

**Fix.** Disable the JavaScript and CoffeeScript engines so only YAML is accepted. After the fix, the same file makes the build fail with: "Only YAML frontmatter is allowed. JavaScript/CoffeeScript frontmatter is disabled for security." Normal YAML frontmatter still parses.

### 2. High: `markdown-it` quadratic-time rendering

GHSA-gfr2-rv44-r23c (CVSS 7.5) affects 15.0.0 through 15.0.2 and triggers with default options, which you use. `markdown-it` only runs at build time, so the impact is a build denial of service from crafted Markdown (for example, a pull request that stalls the build until it times out). There is no runtime exposure for visitors. Upgraded to 15.0.3. I relied on the advisory and did not reproduce the slowdown.

### 3. Low in context: `dompurify` advisories

GHSA-cg2g-xh64-v4q7 (`SAFE_FOR_TEMPLATES`), GHSA-mrv2-3pqr-j5jr (`IN_PLACE`) and GHSA-c6gr-qvv4-5v3f (XHTML parser mode) all concern options your code never sets. Your only call is `DOMPurify.sanitize(html, { ADD_ATTR: ['target'] })`, so I do not believe any is exploitable as configured. I confirmed this by reading usage, not by writing exploits. Upgraded to 3.4.17 anyway, and `package.json` now requires the patched minimum so a fresh install cannot resolve an old version. `npm audit` now reports 0 vulnerabilities.

### 4. Medium (bug): wizard-generated projects fail to build and carry your logo

**What.** `TopNav.vue` hardcoded `<img src="/512x512.png">`. Vue resolves that path at compile time, but the wizard's ZIP only contains text files, so generated projects fail with `Could not resolve '/512x512.png'`. Even if it had built, every generated site would have shown the Docs-Ready logo as someone else's brand.

**Fix.** The template again shows the neutral default mark unless a logo is configured, and your own logo moved to `branding.logo: '512x512.png'` in `docs.config.js`. Your site looks the same, and a project generated from the patched code installs and builds.

### 5. Low: SVG upload filter bypasses

The old filter rejected only `<script`, `on…=` attributes preceded by whitespace, `javascript:`, `<foreignObject` and `<!ENTITY`. Six patterns passed: `<svg/onload=…>`, entity-encoded `javascript:`, SMIL `<set attributeName="onmouseover">`, an external `<image href>` (tracking), `@import`, and `<?xml-stylesheet?>`.

**Impact is limited.** An SVG shown through `<img>` cannot run script, the uploader is the site owner, and your Vercel CSP (`script-src 'self'`) blocks inline script if the file is opened directly. On a host without that CSP, a file opened directly could run script.

**Fix.** A stricter denylist now rejects all 13 test vectors and still accepts plain logos, gradients, same-document `<use href="#id">`, and a plain DOCTYPE. A denylist can never be complete, so `vercel.json` also adds a `sandbox` CSP for `.svg` files. That header rule is untested on live Vercel; after deploying, check it with `curl -I https://<site>/favicon.svg` and confirm the CSP appears there and on the normal pages.

### 6. Low: the generator trusted the UI

`generateFiles()` produced CSS injection (an unvalidated font family) and a path with `..` (an unvalidated file extension) if called without the wizard's validation. This is reachable only by bypassing the UI in your own browser. `buildFiles()` now re-validates every step and the upload extensions before writing anything, and throws on bad input.

### 7. Low: inherited properties as routes

`/constructor`, `/__proto__` and `/toString` found `Object` properties in the page lookup and showed "could not be loaded" instead of "Page not found". Lookups now use null-prototype maps.

### 8. Low: malformed hash

`/page#%E0%A4%A` made `decodeURIComponent` throw inside an async handler (an unhandled rejection). It now falls back to the raw value.

### 9. Low: repository hygiene

`.gitignore` had only `/dist` and `/node_modules`. Added `.env`, `.env.*`, `.vercel`, logs, editor folders and `*.local`. Added `SECURITY.md` (using GitHub private vulnerability reporting, with no invented contact), `.github/dependabot.yml`, and `.github/workflows/ci.yml` (`npm ci --ignore-scripts`, an `npm audit --omit=dev --audit-level=high` gate, and the build, with read-only permissions). I did not add `CODEOWNERS`, because it needs your real team or user names.

### Informational

10. **Personal email in history.** Commit author metadata contains `morrg25@gmail.com` and is public. Consider GitHub's no-reply address and "Keep my email addresses private". With one commit, rewriting history is cheap now and hard later.
11. **CSP.** `style-src 'unsafe-inline'` is needed for the syntax highlighter's inline styles and Vue's `:style`. `img-src https:` allows any HTTPS image, so a content author could embed a tracking pixel. Both are reasonable for this design.
12. **Project source is public.** Because the wizard is enabled, `dist/assets/_virtual_project-source-*.js` (296 KB, 83 KB gzipped) is served to every visitor. It holds the same files as your public repo (source, lockfile, config, the Markdown guide). If you deploy a docs site that doesn't need the wizard, set `features.onboarding: false` and this file is not built.
13. **Functional.** `index.html` links `./favicon/*` files that don't exist, so those requests get the SPA's `index.html` back, and the relative paths also break on nested routes. `public/images/banner.jpg` is 7445×1695 and 2.3 MB.

## Checked and found sound

- **No secrets.** None in the files or the history; no `.env` tracked.
- **Lockfile.** All 208 packages come from `registry.npmjs.org` with integrity hashes and no git or URL dependencies. The only install script is the optional macOS `fsevents`.
- **Markdown injection.** A hostile page tested 21 payloads: raw `<script>`, `<iframe>`, `javascript:`, `vbscript:`, `data:` and entity-encoded URLs, reference-style links, hostile frontmatter titles and categories, callout titles, code-fence labels, and headings with `onload`. Result: 0 scripts, 0 iframes, 0 event-handler attributes, 0 dangerous URLs; every hostile title rendered as literal text. External links all received `target="_blank" rel="noopener noreferrer"`.
- **Search.** Snippet and title highlighting escape HTML before adding `<mark>`.
- **Wizard output.** 16 hostile project names (quote breakouts, `${}`, `</title>`, newlines, `..\`, `__proto__`) each produced a `docs.config.js` that evaluates to exactly the intended strings, an `index.html` with no breakout, and ZIP paths with no traversal.
- **Dangerous sinks.** The three `v-html` uses are all fed by sanitized or escaped content; there is no `eval`, `new Function`, `innerHTML`, cookie or `postMessage` use. The only network call is a same-origin fetch of the search index.
- **Build output.** No sourcemaps, no inline scripts, no external hosts in `index.html`, and unpublished pages are absent from the search index.
- **Images.** No EXIF or GPS metadata in any image.

## Limitations

- I could not inspect repository settings (branch protection, secret scanning, Dependabot alerts, Actions permissions, 2FA): the GitHub API was rate-limited and those need authentication. Please check them yourself.
- I had no deployment URL, so the live response headers are untested.
- Rendering tests used a simulated browser (jsdom), not a real one.
- The `markdown-it` slowdown and the DOMPurify advisories were assessed from the advisories and your code, not reproduced.
- This is a point-in-time review of one commit.

## Verification of the patch

On a patched clone: `npm audit` reports 0 vulnerabilities; a fresh `npm ci --ignore-scripts`, the audit gate and `npm run build` all pass; the `---js` file fails the build without executing; the hostile-Markdown, route and hash tests pass; and all 13 SVG attacks are rejected while 4 legitimate SVGs are accepted. A project generated by the wizard from the patched code installs and builds.
