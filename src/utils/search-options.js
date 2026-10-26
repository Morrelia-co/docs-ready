// Shared by the build-time indexer (Node) and the browser. Both sides MUST use identical options.
export const searchOptions = {
  fields: ['title', 'heading', 'text'],
  storeFields: ['slug', 'anchor', 'title', 'heading', 'text', 'category'],
  searchOptions: { boost: { title: 3, heading: 2 }, prefix: true, fuzzy: 0.2, combineWith: 'AND' },
}
