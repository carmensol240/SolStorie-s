
## Illustration reliability (Oct 2026)
- [x] Main picture service: 3 tries for temporary errors, no repeat after a safety block
- [x] Backup with same style/character/reference pictures; Flux only with no page-1 picture and no photo
- [x] Mismatched backup pictures not saved; page held for admin
- [x] Admin list of pages needing a picture
- [x] Full prompt saved in logs

## Story creation jump fix (Oct 2026)
- [x] No auto-reload during creation; sign-up guard only at entry; one-time request ID; safety net screen; library hides unfinished stories
- [x] End-to-end browser test (wait, tab switch, reload)

## Value packs (Oct 2026)
- [x] 3 full (179) + 3 digital (99) in catalog, credits, purchase screen only; exact amount match
- [x] Grow links for both packs connected

## Pricing audit (Oct 2026) — report only, wait for approval
- [ ] List every place a price is shown/calculated + current value
- [ ] List all other packages/products with current prices
- [ ] Propose single price source (incl. lock screen + server amount check), unique amounts, delete unused price screens, guard test
- [ ] List Grow links with the price each should charge
- [ ] Accessibility audit (IS 5568 / WCAG AA): report findings per section, no changes until approval
- [ ] Shared story links (/s/...) show generic title/image in WhatsApp/Facebook since leaving Netlify — needs a new preview solution (separate task)
