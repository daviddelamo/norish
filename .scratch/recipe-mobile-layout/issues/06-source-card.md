# 06 — Source card

**What to build:** a card showing where a recipe came from — its URL's host, as a link out — on mobile and share-mobile. It replaces the external-link icon that used to sit beside the title (removed in ticket 02). A recipe with no URL renders no card.

**Blocked by:** 02, 03

**Status:** ready-for-agent

- [x] The card shows the source host and opens the original in a new tab with `rel="noopener noreferrer"`
- [x] A recipe with no URL renders no card
- [x] The title carries no source icon
- [x] The card renders on share-mobile
- [x] New strings are added across every supported locale and `pnpm i18n:check` passes
