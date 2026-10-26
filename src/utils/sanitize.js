import DOMPurify from 'dompurify'

// Build-time Markdown rendering already disables raw HTML; this is defence in depth.
// DOMPurify strips scripts, event handlers and javascript:/data: URLs in links.
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A' && node.hasAttribute('href')) {
    try {
      const url = new URL(node.getAttribute('href'), window.location.href)
      if (url.origin !== window.location.origin) {
        node.setAttribute('target', '_blank')
        node.setAttribute('rel', 'noopener noreferrer')
      }
    } catch { /* leave malformed hrefs alone; DOMPurify already vetted them */ }
  }
})

export const sanitize = (html) => DOMPurify.sanitize(html, { ADD_ATTR: ['target'] })
