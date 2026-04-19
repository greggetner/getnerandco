# Getner & AI

Marketing site for Greg Getner's boutique ActiveCampaign consulting practice.
Homepage at [getner.ai](https://getner.ai) with supporting landing pages,
a blog, and an AI-powered chat terminal ("Probe My Brain") that answers
ActiveCampaign questions in Greg's voice.

## Stack

- **Static HTML** — no build step, no framework. Every page is a standalone `index.html` with inline or shared CSS/JS.
- **Netlify** — hosting, forms backend, and serverless functions.
- **Netlify Forms** — four forms detected at build time: `application`, `contact`, `migration-assessment`, `audit-request`, plus the AI-terminal lead capture `ai-terminal-leads`.
- **Netlify Functions** — one TypeScript function, `probe-brain.mts`, which proxies chat messages to the Anthropic Claude API.
- **Anthropic Claude API** — powers the Probe My Brain terminal. Requires `ANTHROPIC_API_KEY`.
- **Calendly** — embedded on apply and migration-success flows.
- **Shared CSS** — `/blog/blog.css` holds the design system tokens, typography, forms, and modals; reused by `/blog/`, `/audit/`, and `/free-migration/` pages. The homepage keeps its own inline CSS because of volume and history.

## Project structure

```
/
├── index.html                      # Homepage (hero, clients, probe-my-brain terminal, CTA, footer)
├── audit/
│   └── index.html                  # /audit/ — free ActiveCampaign audit landing page
├── blog/
│   ├── index.html                  # Blog index with post cards
│   ├── blog.css                    # Shared stylesheet for blog + audit + migration
│   ├── rss.xml                     # RSS 2.0 feed
│   └── *.html                      # Individual posts
├── free-migration/
│   └── index.html                  # /free-migration/ — free AC migration service landing
├── netlify/
│   └── functions/
│       └── probe-brain.mts         # Anthropic Claude proxy for the AI terminal
├── assets/
│   ├── favicons/                   # SVG + PNG + ICO + apple-touch-icon
│   ├── images/
│   │   └── greg-getner-photo.png   # Portrait
│   └── videos/
│       └── greg-ballet.mp4         # Dance Easter egg (1.7MB, H.264, muted)
├── netlify.toml                    # Build config: publish = ".", functions dir, dev port
├── .gitignore                      # Excludes .env, .netlify/, node_modules/
└── README.md
```

## Local development

### First-time setup (one-time)

1. Install Node + npm:
   ```sh
   brew install node
   ```
2. Install the Netlify CLI globally:
   ```sh
   npm install -g netlify-cli
   ```
3. Create a `.env` file at the project root with:
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ```
   (`.env` is gitignored. Get the key from [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys).)

### Every time

```sh
netlify dev
```

Serves the site at **http://localhost:8888**. Hot-reloads the function on `.mts` edits. HTML/CSS changes require a browser refresh.

### Known caveats

- **Form submissions do not work on `netlify dev`.** Netlify Forms are detected at deploy time and processed by Netlify's edge — the local static server has no equivalent. Form validation, success states, and the embedded Calendly flow all work locally; only the actual POST will fail until deployed.
- **Browser caching can mask CSS changes.** If a change to `index.html` doesn't appear after a hard refresh, open DevTools → Network → check "Disable cache" and reload.
- **CSS specificity traps:** the homepage has several `.hero-content p`, `.hero-content h1` rules that override class-scoped styles. When a margin/size change doesn't apply, check for a more-specific selector before debugging cache.

## Environment variables

| Variable | Where | Purpose |
|----------|-------|---------|
| `ANTHROPIC_API_KEY` | `.env` locally, Netlify site env vars in prod | Probe My Brain / Claude API calls |

## Netlify dashboard setup (post-first-deploy)

1. **Set the `ANTHROPIC_API_KEY`** in Site configuration → Environment variables.
2. **Add email notifications** for each form under Forms → (form name) → Settings & usage → Form notifications:
   - `application` → `greg@getner.ai`
   - `contact` → `greg@getner.ai`
   - `migration-assessment` → `greg@getner.ai`
   - `audit-request` → `greg@getner.ai`
   - `ai-terminal-leads` → `greg@getner.ai`

## Deployment

Pushing to `main` on GitHub triggers an auto-build on Netlify (no CI config
required beyond `netlify.toml`). A deploy takes under a minute for this
static site.

## Notable pages & flows

- **Homepage** — hero with portrait/dance-video Easter egg, client roster, Probe My Brain AI terminal, testimonials, features/process/CTA sections, footer.
- **Apply modal** — opens on any `a[href="#apply"]` link. Prequalification form → Calendly embed on success.
- **Contact modal** — `a[href="#contact"]`. Short form, plain success message.
- **Probe My Brain** — 5-question AI chat. Email gate → `fetch()` to `probe-brain` function → Anthropic Claude → typewriter-animated response. Captures lead to `ai-terminal-leads` on email + first Q&A.
- **/audit/** — 3-question survey → manual audit promise → email delivery. First milestone of the OAuth audit tool (manual for now, automation to come).
- **/free-migration/** — free AC migration service, 5-column platform comparison table, Calendly embed on success.
- **/blog/** — field notes on automations, retention, and AC internals.

## AI terminal / Probe My Brain

The terminal lives in `index.html`. The chat backend (`netlify/functions/probe-brain.mts`) forwards messages to the Claude API with a system prompt that casts Greg's voice. Conversation history is accumulated client-side and sent with each request so the model stays in context across the 5-question session. On the 5th question the "Session complete" state surfaces with an embedded Calendly CTA.

## Credits

Built with ❤️ by Greg & Claude. Deployed to Netlify.
