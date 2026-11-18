// Abdullah AI server-side API route for Vercel
// Set OPENAI_API_KEY in the hosting dashboard's Environment Variables.
// Never put the key in index.html or commit it to GitHub.

module.exports = async function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: "The AI service is not configured yet. A project owner must add OPENAI_API_KEY to the hosting environment."
    });
  }

  try {
    const body = req.body || {};
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const safeMessages = messages
      .filter(m => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .slice(-12)
      .map(m => ({ role: m.role, content: m.content.slice(0, 6000) }));

    if (!safeMessages.length || safeMessages[safeMessages.length - 1].role !== "user") {
      return res.status(400).json({ error: "Please send a message first." });
    }

    const upstream = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-6-astra",
        instructions: "You are Abdullah AI, a helpful, clear, friendly assistant created by ABDULLAH TECHNOLOGIES. Reply in the language the user uses. Explain school topics patiently and age-appropriately. Be honest when uncertain. Do not claim to have capabilities or access you do not have.",
        input: safeMessages.map(m => ({ role: m.role, content: m.content })),
        max_output_tokens: 900
      })
    });

    const data = await upstream.json();
    if (!upstream.ok) {
      console.error("OpenAI API error:", upstream.status, data && data.error ? data.error.type : "unknown");
      return res.status(502).json({ error: "The AI provider could not complete this request. Please try again later." });
    }

    const answer = typeof data.output_text === "string" ? data.output_text : "";
    if (!answer) return res.status(502).json({ error: "The AI returned an empty response. Please try again." });
    return res.status(200).json({ reply: answer });
  } catch (error) {
    console.error("Abdullah AI server error:", error && error.message ? error.message : "unknown");
    return res.status(500).json({ error: "Something went wrong on the server. Please try again." });
  }
};
