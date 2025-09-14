
export async function handler(event) {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };
  try {
    const { lines = [] } = JSON.parse(event.body || "{}");
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
    if (!r.ok) return { statusCode: 500, body: await r.text() };
    const j = await r.json();
    const narration = j?.choices?.[0]?.message?.content?.trim() || "";
    return { statusCode: 200, body: JSON.stringify({ narration }) };
  } catch (e) {
    return { statusCode: 500, body: String(e) };
  }
}
