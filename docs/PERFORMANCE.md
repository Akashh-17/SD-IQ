# Performance and accessibility

Measured on 9 November 2026. These are local production-build measurements,
not deployed-site results or a measurement of live model latency.

## Method

- Lighthouse 13.6.0, Chrome 157.0.8103.38, Node 24.12.0, Vite 8.1.5 on Windows.
- Lighthouse's default mobile configuration (simulated mobile network and CPU)
  and its official desktop preset. A fresh headless Chrome process per audit,
  with cold caches; no test runner or build running during measurements.
- Frozen before and after production builds served with Vite preview. Both use
  `VITE_MOCK_AUTH=true`, the same offline backend on port 5010 and real HTTP
  requests to that backend. No API responses were intercepted or substituted.
- Demo-user data: one completed SDE2 URL-shortener interview with two evaluated
  answers, and one active SDE2 rate-limiter interview. Each has four diagram
  nodes and three edges. First-run onboarding is dismissed before navigation.
- Audit URLs: `/`, `/dashboard`, `/interview/<active-id>`,
  `/report/<completed-id>`. The report's persisted whiteboard is included.
- Only numeric results and audit findings were retained. No screenshots,
  recordings, traces or HTML reports were saved.

## Results

Mobile after measurements use the median of three runs, with their range shown
so timing variation remains visible. Before and desktop use one run per page.
Further measurement was stopped at the user's request; no desktop repeats were
performed. Scores are performance / accessibility.

| Page | Mobile before | Mobile after (performance range) | Desktop before | Desktop after |
| --- | --- | --- | --- | --- |
| Landing | 94 / 100 | 97 / 100 (92–100) | 100 / 100 | 100 / 100 |
| Dashboard | 87 / 100 | 89 / 100 (89–91) | 99 / 100 | 100 / 100 |
| Interview | 75 / 98 | 83 / 100 (83–84) | 98 / 98 | 78 / 100 |
| Report | 71 / 100 | 79 / 100 (77–82) | 98 / 100 | 99 / 100 |

Accessibility meets the target everywhere. Mobile landing, dashboard and
interview meet their performance targets. The mobile report median is one point
below target, and the single desktop interview run is two points below target
(497 ms total blocking time). Those targets are not claimed as achieved. Scores
varied between runs; a build passing does not guarantee a Lighthouse score.

## Loading changes

- Login, signup and every authenticated page have separate lazy route
  boundaries and a themed, announced loading state. The page and authentication
  guard download concurrently; private content still waits for authentication.
- The public landing page stays in the entry bundle. Making that critical hero
  another lazy boundary introduced a first-paint download waterfall in trials.
- React Flow, Recharts and Framer Motion have separate vendor chunks, using
  Vite 8's native Rolldown splitting. The chunk warning threshold was not raised
  or disabled. Shared tiny utilities can carry a vendor-derived chunk name;
  that does not mean the chart engine is loaded on the landing page.
- The interview canvas and report canvas load behind their own boundaries.
  Existing canvas heights reserve space. PDF printing waits for the saved
  canvas module before opening the print dialog.
- The room's shell, chat and canvas share one initial state request per room,
  instead of issuing three. Failed initial reads remain retryable. Subsequent
  initialization and turn refreshes still fetch fresh state; streaming and
  autosave are unchanged.
- Geist and Geist Mono are self-hosted WOFF2 files, with their original weight
  ranges and language subsets, `font-display: swap` and SIL license files.
  The two Latin files are preloaded. No Google Fonts connection is needed.
- Font CSS and the exact hashed entry CSS are preloaded by the HTML build
  transform; stylesheet links still work normally.
- Social metadata, a 1200 x 630 Open Graph image, a manifest and favicon/touch
  icons use the existing SystemIQ identity. Set `VITE_SITE_URL` to the deployed
  origin when building elsewhere; the default is the README's live demo origin,
  `https://system-iq.vercel.app`.

## Accessibility

- The interview room now exposes its main landmark.
- The account menu uses its visible name and email as its accessible name;
  the collapsed icon retains an explicit account-menu label. Decorative
  initials no longer interfere with that name.
- Keyboard focus on the scrollable transcript has a visible accent outline.
- Existing shared dialog focus containment, Escape dismissal and focus return
  are verified. Shared controls, tokens, colors, layout and animation definitions
  were not redesigned. Existing reduced-motion behavior remains enabled.

## Reproduce

Build the regular release with `cd frontend; npm run build`. For authenticated
offline measurements, use a separate mock build; never deploy that build as
the normal authenticated application:

```powershell
# Terminal 1, backend/
$env:PORT='5010'
$env:CORS_ORIGINS='http://127.0.0.1:5441'
npm run dev:mock

# Terminal 2, frontend/
$env:VITE_MOCK_AUTH='true'
$env:VITE_API_URL='http://127.0.0.1:5010'
npm run build
npx vite preview --host 127.0.0.1 --port 5441 --strictPort
```

Create an interview and a completed report through the mock application, then
use their actual route IDs. For a scripted authenticated Lighthouse run, use
Lighthouse's Node API with Puppeteer, passing the Puppeteer page as its fourth
argument. Before each audit, register:

```js
await page.evaluateOnNewDocument(() => {
  localStorage.setItem('systemiq:onboarding:v1:demo-user', 'done');
});
const result = await lighthouse(url, {
  port: chrome.port,
  onlyCategories: ['performance', 'accessibility'],
  disableFullPageScreenshot: true,
  skipAudits: ['screenshot-thumbnails', 'final-screenshot'],
}, desktop ? desktopConfig : undefined, page);
```

Use `lighthouse/core/config/desktop-config.js` for `desktopConfig`. Launch and
close Chrome for each URL/device, and save only the scores and numeric audit
values. Repeat mobile runs three times. Match data, browser version and audit
settings for comparisons. Real authentication/network latency and larger
whiteboards or histories can produce different scores.

## Verification

| Check | Result |
| --- | --- |
| Backend `npm test` | Pass: 16 files, 194 tests |
| Frontend `npm run lint` | Pass |
| Frontend `npx tsc -b` | Pass |
| Frontend `npm test` | Pass: 32 files, 223 tests |
| Frontend `npm run build` | Pass; no oversized-chunk warning |
| Playwright suite | Skipped: `frontend/e2e` does not exist |

The largest emitted JavaScript chunk is approximately 363 kB (Recharts), below
the default 500 kB warning threshold. Manual browser checks covered the local
fonts, transcript focus indicator, dialog Tab/Shift+Tab containment, Escape and
focus return. Tests also cover authentication gating, lazy route loading,
asset metadata, shared initial-state retry and waiting for the canvas before
printing. Additional final browser checks were not run after measurement was
stopped. No screenshots or recordings were captured.
