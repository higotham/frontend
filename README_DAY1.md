# Gotham Frontend — Day 1 Scaffold

This commit sets up the runnable scaffold:
- Vite + React + alias `@` (see `vite.config.js`)
- Global provider (`RootProvider`) & base styles (`styles/orange.css`)
- Network layer (`services/network/*`) — **do not edit**; configure via `.env`
- Minimal pages (Home, Signup, Canvas, Library, Storyboards*) as placeholders

## Run
```bash
npm i
npm run dev
```

## Env
Copy `.env.example` to `.env` and adjust:
```
VITE_APP_FASTAPI_URL=http://localhost:8000
VITE_APP_GATEWAY_URL=http://localhost:8000
```

## Next days
- Day 2: Library skeleton (hooks + toolbar)
- Day 3–6: Canvas core, UI, and FastAPI bridge
- Day 7–8: Storyboard library/workspace
- Day 9: K-Sampler & responsive/a11y fixes
- Day 10: Docs & v0.1.0 release
