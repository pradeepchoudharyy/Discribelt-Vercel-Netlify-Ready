
function stripFences(s=""){ return s.replace(/^```(?:svg)?|```$/gm, "").trim(); }
function looksLikeSvg(s=""){ return s.includes("<svg") && s.includes("</svg>"); }

async function openai(messages) {
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ model: "gpt-4o-mini", temperature: 0, max_tokens: 1500, messages })
  });
  if (!r.ok) throw new Error(await r.text());
  const j = await r.json();
  return j?.choices?.[0]?.message?.content || "";
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end("Method Not Allowed");
  try {
    const { text = "" } = req.body || {};
    const sys = "Output only a single valid <svg>...</svg> diagram. No explanations or code fences.";
    const user = [
      "Convert the user's description into ONE clean responsive SVG.",
      'Use viewBox and width="100%" height="auto".',
      "Flowcharts: rect/ellipse/diamond nodes + arrows. Charts: axes/labels/legend as needed.",
      "Description:\n" + text
    ].join("\n");

    let svg = stripFences(await openai([{role:"system",content:sys},{role:"user",content:user}]));
    if (!looksLikeSvg(svg)) {
      svg = stripFences(await openai([
        {role:"system",content:"Return ONLY a single valid <svg>…</svg>."},
        {role:"user",content:"Your previous output was not valid SVG. Re-output just the SVG for:\n\n"+text}
      ]));
    }
    res.status(200).json({ svg });
  } catch (e) {
    res.status(500).send(String(e));
  }
}
