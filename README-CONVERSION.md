# Vercel + Netlify Conversion Kit (Serverless Functions + Browser OCR)

This kit lets you host your current project **without a Flask server**, using:
- **Vercel**: React app in `/client` + API routes in `/client/api/*`
- **Netlify**: React app in `/client` + Functions in `/netlify/functions/*` (routed via `netlify.toml`)

The OCR now runs **in the browser** via `tesseract.js`. Your serverless functions only handle
narration and SVG generation with OpenAI (no long-running server needed).

---

## 1) Copy files into your repo

Place everything in this zip at the **root of your repo**, so it looks like:

```
root/
  client/
    api/               # (Vercel functions)
      health.js
      narrate.js
      svg.js
    src/
      api.js           # client helper for calling the functions
      (your existing App.js, etc.)
  netlify/
    functions/         # (Netlify functions)
      health.js
      narrate.js
      svg.js
  netlify.toml         # choose the CRA or Vite variant below
  README-CONVERSION.md # (this file)
```

> Already have `client/`? Just **merge** the `api/` folder and `src/api.js`. Do **not** move your existing files.

---

## 2) Client setup

Install OCR library:
```bash
cd client
npm i tesseract.js
```

Use the helper in `client/src/api.js` and call the functions with **relative** paths (`/api/*`).
Example usage in your React code:
```js
import Tesseract from "tesseract.js";
import { health, narrate, toSvg } from "./api";

async function runOCR(file, setLines, setNarration, setProgress) {
  const { data } = await Tesseract.recognize(file, "eng", {
    logger: m => m.status === "recognizing text" && setProgress(Math.round(m.progress*100))
  });
  const lines = (data.text || "").split("\n").map(s => s.trim()).filter(Boolean);
  setLines(lines);
  const { narration } = await narrate(lines);
  setNarration(narration || "");
}

async function makeSVG(desc, setSvg) {
  const { svg } = await toSvg(desc);
  setSvg(svg || "");
}
```

---

## 3) Environment variables

Set **OPENAI_API_KEY** in your project dashboard (never put it in client code):
- Vercel: *Project → Settings → Environment Variables*
- Netlify: *Site settings → Build & deploy → Environment*

---

## 4) Deploy

### Vercel
- **Project root directory:** `client`
- Build command:
  - CRA: `npm run build` • Output dir: `build`
  - Vite: `npm run build` • Output dir: `dist`
- API routes in `client/api/*` will be auto-deployed at `/api/*`

### Netlify
Pick **one** of the `netlify.toml` configs and put it at repo root (rename accordingly):

- **CRA version:**
  ```toml
  [build]
    command = "npm run build"
    publish = "client/build"
    base = "client"

  [functions]
    directory = "netlify/functions"

  [[redirects]]
    from = "/api/*"
    to = "/.netlify/functions/:splat"
    status = 200
  ```

- **Vite version:**
  ```toml
  [build]
    command = "npm run build"
    publish = "client/dist"
    base = "client"

  [functions]
    directory = "netlify/functions"

  [[redirects]]
    from = "/api/*"
    to = "/.netlify/functions/:splat"
    status = 200
  ```

Connect your repo, Netlify will build the client and route `/api/*` to functions.

---

## 5) Endpoints provided

- `GET /api/health` → `{ ok: true }`
- `POST /api/narrate` with `{ lines: string[] }` → `{ narration }`
- `POST /api/svg` with `{ text: string }` → `{ svg }`

---

## 6) Notes

- Keep your existing UI; just call the API using `/api/...` as shown.
- All OpenAI calls happen **in functions**, not the browser.
- No additional server configuration is required for this setup.
