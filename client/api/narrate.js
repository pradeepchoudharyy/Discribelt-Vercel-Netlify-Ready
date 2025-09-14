
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end("Method Not Allowed");
  try {
    const { lines = [] } = req.body || {};
    const steps = lines.map((l,i)=> `${i+1}. ${l}`).join("\n");

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.5,
        max_tokens: 500,
        messages: [
          { role: "system", content: "You explain diagrams simply and clearly." },
          { role: "user", content: `Convert these flow steps into a clear spoken-style narration:\n\n${steps}` }
        ]
      })
    });
    if (!r.ok) return res.status(500).send(await r.text());
    const j = await r.json();
    const narration = j?.choices?.[0]?.message?.content?.trim() || "";
    res.status(200).json({ narration });
  } catch (e) {
    res.status(500).send(String(e));
  }
}
