# Security policy

## Reporting a vulnerability

Please do not open a public issue for security problems. Use GitHub's private reporting instead:
**Security tab → Report a vulnerability** (https://github.com/Morrelia-co/docs-ready/security/advisories/new).
Include what you found, how to reproduce it, and the impact you expect.

## Scope

Docs-Ready builds a static site from Markdown. In scope: the build plugin (`plugins/`), the rendering and sanitization code,
the onboarding wizard and the ZIP it generates, and the shipped `vercel.json` headers. Out of scope: vulnerabilities in the
hosting platform, and content you publish yourself (a deployed static site is public unless you add access protection).

## Content is trusted at build time

Markdown files are processed during the build. Treat pull requests that change content like code: review them, and avoid
exposing secrets to preview builds of untrusted forks.
