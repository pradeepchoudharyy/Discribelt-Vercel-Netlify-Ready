from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import pytesseract
import os
from openai import OpenAI
from dotenv import load_dotenv
import uuid
import re


# Load environment variables
load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

if not os.getenv("OPENAI_API_KEY"):
    raise ValueError("❌ OPENAI_API_KEY not found. Check your .env file.")

pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

app = Flask(__name__)
CORS(app)

# -------- Helpers --------
def generate_narration(lines):
    steps = "\n".join([f"{i+1}. {line}" for i, line in enumerate(lines)])
    prompt = f"""
You're an assistant that converts flowchart steps into clear, human-style spoken descriptions, must be accurate according to data provided.

Steps:
{steps}
"""
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "You explain diagrams simply."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.5,
        max_tokens=500
    )
    return response.choices[0].message.content.strip()

FENCE_RE = re.compile(r"^```(?:svg)?|```$", flags=re.MULTILINE)

def _clean_svg(s: str) -> str:
    """Strip markdown fences & trim."""
    if not s:
        return ""
    return FENCE_RE.sub("", s).strip()

def _looks_like_svg(s: str) -> bool:
    """Minimal sanity check that we got an SVG root and a viewBox."""
    return "<svg" in s and "</svg>" in s


def generate_svg(text_description: str):
    # We let the model infer the best visualization unless the user specifies one.
    prompt = f"""
You are a professional diagram generator.

Goal: Convert the user's description into ONE clean, responsive **SVG diagram** that best represents the data or process.
If the user specified a chart type (e.g., "bar chart", "pie chart", "flowchart"), use it. Otherwise, choose the most appropriate.

Hard requirements:
- Output ONLY a single <svg>...</svg>. No prose, no markdown, no code fences.
- Include viewBox="0 0 WIDTH HEIGHT" and preserveAspectRatio="xMidYMid meet".
- Set width="100%" and height="auto".
- Use a minimal, readable style (sans-serif). Make labels clear and non-overlapping.
- Bar/line charts: include axes, gridlines, and numeric value labels (above bars / near points).
- Pie charts: show % labels inside slices and a legend if needed.
- Flowcharts: use <rect> for steps, <ellipse> for start/end, diamonds for decisions; equal node sizes, centered text, clear arrows.
- Keep adequate padding/margins so nothing is clipped.

User description:
{text_description}
""".strip()

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system",
             "content": (
                 "You output only valid, self-contained SVG markup. "
                 "Never include code fences or explanations."
             )},
            {"role": "user", "content": prompt}
        ],
        temperature=0,          # deterministic visual layout
        max_tokens=1500,
    )

    svg = _clean_svg(response.choices[0].message.content)

    # Retry once if the model didn't return valid SVG.
    if not _looks_like_svg(svg):
        retry = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system",
                 "content": "Return ONLY a single, valid <svg>…</svg> (no fences)."},
                {"role": "user",
                 "content": (
                     "Your previous response was not valid SVG. "
                     "Re-output the diagram strictly as <svg>…</svg> for this description:\n\n"
                     + text_description
                 )},
            ],
            temperature=0,
            max_tokens=1500,
        )
        svg = _clean_svg(retry.choices[0].message.content)

    return svg


# -------- Unified route --------
@app.route("/process", methods=["POST"])
def process():
    if "image" in request.files:   # 📷 Diagram → Text
        file = request.files["image"]
        ext = os.path.splitext(file.filename)[1] or ".png"
        filename = f"{uuid.uuid4().hex}{ext}"
        filepath = os.path.join("uploads", filename)
        os.makedirs("uploads", exist_ok=True)
        file.save(filepath)

        img = Image.open(filepath)
        ocr_data = pytesseract.image_to_data(img, output_type=pytesseract.Output.DICT)

        results = []
        for i in range(len(ocr_data['text'])):
            if ocr_data['text'][i].strip() != "":
                results.append({
                    "text": ocr_data['text'][i],
                    "left": ocr_data['left'][i],
                    "top": ocr_data['top'][i],
                    "width": ocr_data['width'][i],
                    "height": ocr_data['height'][i]
                })

        # Group OCR text into lines
        lines = []
        if results:
            results.sort(key=lambda b: (b["top"], b["left"]))
            current_top = results[0]["top"]
            current_line = []
            for block in results:
                if abs(block["top"] - current_top) < 25:
                    current_line.append(block["text"])
                else:
                    lines.append(" ".join(current_line))
                    current_line = [block["text"]]
                    current_top = block["top"]
            if current_line:
                lines.append(" ".join(current_line))

        narration = generate_narration(lines)
        os.remove(filepath)

        return jsonify({"mode": "diagram-to-text", "lines": lines, "narration": narration})

    else:   # 📝 Text → Diagram
        data = request.get_json()
        text_description = data.get("text", "")
        if not text_description.strip():
            return jsonify({"error": "No text provided"}), 400

        svg_code = generate_svg(text_description)
        return jsonify({"mode": "text-to-diagram", "svg": svg_code})

if __name__ == "__main__":
    app.run(debug=True)
