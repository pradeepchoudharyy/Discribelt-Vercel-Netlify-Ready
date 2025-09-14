Discribelt

Turn diagrams and UI mockups into structured text — and text into clean, downloadable diagrams (SVG/PNG). Built with React + Flask, powered by Tesseract OCR and an LLM.

<p align="center"> <a href="https://github.com/pradeepchoudharyy/Discribelt/stargazers"> <img alt="Stars" src="https://img.shields.io/github/stars/pradeepchoudharyy/Discribelt?style=flat&logo=github"> </a> <a href="https://github.com/pradeepchoudharyy/Discribelt/issues"> <img alt="Issues" src="https://img.shields.io/github/issues/pradeepchoudharyy/Discribelt"> </a> <a href="#"> <img alt="License" src="https://img.shields.io/badge/license-MIT-informational"> </a> <img alt="Last Commit" src="https://img.shields.io/github/last-commit/pradeepchoudharyy/Discribelt"> <img alt="Node" src="https://img.shields.io/badge/Node-%E2%89%A518-6DA55F"> <img alt="Python" src="https://img.shields.io/badge/Python-%E2%89%A53.9-3776AB"> </p> <p align="center"> <a href="#-features">Features</a> • <a href="#-quick-start">Quick Start</a> • <a href="#-usage">Usage</a> • <a href="#-api">API</a> • <a href="#-project-structure">Structure</a> • <a href="#-deployment">Deployment</a> • <a href="#-roadmap">Roadmap</a> • <a href="#-contributing">Contributing</a> </p>
✨ Features

Diagram → Text (D2T): Upload an image; extract text with OCR; generate a clean, step-wise description.

Text → Diagram (T2D): Paste structured text; get a well-laid-out SVG you can also export as PNG.

Narration: Optional spoken output via the Web Speech API for accessibility.

Single, simple API: A unified /process endpoint (plus focused routes if you choose).

Privacy-first OCR: Images processed locally via Tesseract; only compact prompts/metadata go to the LLM.

Downloadables: SVG, PNG, and raw JSON where applicable.

Tip: Add a short GIF demo under docs/demo.gif and link it here.

🧱 Tech Stack

Frontend: React (JS), Web Speech API
Backend: Python (Flask), pytesseract, Pillow
OCR: Tesseract OCR
LLM: OpenAI API (model configurable)

Badges:

🚀 Quick Start
Prerequisites

Node.js ≥ 18

Python ≥ 3.9

Tesseract OCR installed (Windows users: note the install path)

OpenAI API key (for LLM features)

1) Clone
git clone https://github.com/pradeepchoudharyy/Discribelt.git
cd Discribelt

2) Server (Flask)
cd server
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt   # update if filename differs


Create server/.env:

OPENAI_API_KEY=sk-...
# Windows example (adjust as installed):
TESSERACT_CMD=C:\Program Files\Tesseract-OCR\tesseract.exe
CORS_ORIGINS=http://localhost:5173
OPENAI_MODEL=gpt-4o
PORT=5000


Run:

python app.py
# or: flask --app app.py run --port 5000

3) Client (React)
cd ../client
npm install
# If Vite:
npm run dev
# If CRA:
# npm start


Create client/.env (pick the variant your client actually reads):

VITE_API_BASE_URL=http://localhost:5000
# or:
# REACT_APP_API_BASE_URL=http://localhost:5000

🧪 Usage
Diagram → Text (D2T)

Choose Diagram to Text, upload PNG/JPG/SVG.

Click Process to run OCR + LLM narration.

Review steps/entities; export JSON if needed.

Text → Diagram (T2D)

Choose Text to Diagram, paste structured steps/nodes/edges.

Click Generate Diagram.

Download SVG (crisp) or PNG.

🔌 API

The app exposes a unified /process endpoint and may include focused routes (e.g., /ocr, /diagram-to-text, /text-to-diagram). Update names if your code differs.

POST /process
D2T (multipart)
Content-Type: multipart/form-data
file=<your_image>
mode=diagram_to_text


Response (example)

{
  "mode": "diagram_to_text",
  "text": "Flow begins at Idle. User inserts card...",
  "entities": [
    {"type":"state","label":"Idle"},
    {"type":"action","label":"Insert Card"}
  ],
  "svg": null,
  "meta": {"ocr_ms": 148, "model": "gpt-4o"}
}

T2D (JSON)
POST /process
Content-Type: application/json

{
  "mode": "text_to_diagram",
  "content": "Start -> Validate PIN -> Dispense Cash -> End"
}


Response

{
  "mode":"text_to_diagram",
  "svg":"<svg ...>...</svg>",
  "meta":{"model":"gpt-4o"}
}

🗂 Project Structure
Discribelt/
├─ client/                # React app (upload, previews, narration)
│  ├─ src/
│  │  ├─ components/      # UI components
│  │  ├─ pages/           # D2T / T2D screens
│  │  ├─ lib/             # API client, utils
│  │  └─ styles/
│  └─ public/             # favicon & static assets
├─ server/                # Flask API
│  ├─ app.py              # Entrypoint
│  ├─ services/           # OCR, LLM, SVG generation
│  ├─ routes/             # (optional) blueprints
│  └─ requirements.txt
├─ uploads/               # Temp files (gitignored)
└─ README.md

☁️ Deployment

Client: Vercel / Netlify / GitHub Pages

Server: Railway / Render / Fly.io / AWS

Notes

Configure OPENAI_API_KEY and (on Windows) TESSERACT_CMD.

If uploads are ephemeral, write to a temp folder and clean up.

Set CORS to the deployed client origin.

♿ Accessibility

Keyboard navigation for all interactive elements

ARIA labels/roles on custom controls

Contrast at least WCAG AA

Optional narration via Web Speech API

🧰 Troubleshooting

TesseractNotFoundError / empty OCR → Ensure Tesseract is installed; set TESSERACT_CMD on Windows.

401/403 from LLM → Check OPENAI_API_KEY and model access.

CORS errors → Add client origin (e.g., http://localhost:5173) to CORS_ORIGINS.

Blurry exports → Prefer SVG; for PNG, render at 2× pixel ratio.

Uneven preview sizing → Use consistent grid/flex sizing; set object-fit: contain.

🗺️ Roadmap

 Dark theme for the client

 Drag-to-reposition nodes in generated SVG

 One-click Docs site (Docsify)

 Docker files for client/server

 Example prompts & datasets

🤝 Contributing

Fork → feature branch: git checkout -b feat/your-feature

Commit using Conventional Commits (e.g., feat:, fix:).

Include screenshots for UI changes and note any a11y impacts.

Open a PR.

Good first issues: documentation polish, error messages, image/SVG preview sizing.

📜 License

This project is released under the MIT License. See LICENSE (add if missing).

🙏 Acknowledgements

Tesseract OCR

OpenAI API

The open-source community
