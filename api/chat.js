// Abdullah AI server-side API route for Vercel.
// Keep the API key in the hosting provider's environment variables only.

module.exports = async function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  if (req.headers && req.headers["content-length"] && Number(req.headers["content-length"]) > 70000) {
    return res.status(413).json({ error: "The request is too large. Please shorten your message." });
  }

  if (!req.headers || !String(req.headers["content-type"] || "").toLowerCase().includes("application/json")) {
    return res.status(415).json({ error: "Send the request as JSON." });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: "The AI service is not configured. The project owner must configure it in the hosting dashboard."
    });
  }

  let body = req.body || {};
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch (_) {
      return res.status(400).json({ error: "The request body is not valid JSON." });
    }
  }

  const messages = body && Array.isArray(body.messages) ? body.messages : [];
  if (!messages.length || messages.length > 30) {
    return res.status(400).json({ error: "Please send a valid conversation with no more than 30 messages." });
  }

  const safeMessages = [];
  for (const message of messages.slice(-12)) {
    if (!message || (message.role !== "user" && message.role !== "assistant") || typeof message.content !== "string") {
      continue;
    }

    const content = message.content.trim();
    if (!content) continue;
    if (content.length > 3500) {
      return res.status(413).json({ error: "A message is too long. The limit is 3,500 characters." });
    }
    safeMessages.push({ role: message.role, content });
  }

  if (!safeMessages.length || safeMessages[safeMessages.length - 1].role !== "user") {
    return res.status(400).json({ error: "Please send a message first." });
  }

  const totalChars = safeMessages.reduce((total, message) => total + message.content.length, 0);
  if (totalChars > 16000) {
    return res.status(413).json({ error: "This conversation is too long. Start a new chat or shorten your messages." });
  }

  const configuredModel = String(process.env.OPENAI_MODEL || "gpt-6-luna").trim();
  const configuredTokens = Number.parseInt(process.env.OPENAI_MAX_OUTPUT_TOKENS || "900", 10);
  const maxOutputTokens = Number.isFinite(configuredTokens)
    ? Math.min(1500, Math.max(200, configuredTokens))
    : 900;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 40000);

  try {
    const upstream = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Authorization": "Bearer " + apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: configuredModel,
        instructions: "You are Abdullah AI, a helpful and thoughtful assistant created by ABDULLAH TECHNOLOGIES. Reply in the language the user uses. Be clear, patient, and age-appropriate for a general audience that may include teenagers. Explain learning topics step by step when asked. Do not claim to have capabilities, live access, or facts you do not have. Encourage users not to share passwords, payment details, or other sensitive personal information.",
        input: safeMessages.map(message => ({
          role: message.role,
          content: message.content
        })),
        max_output_tokens: maxOutputTokens
      })
    });

    let data;
    try {
      data = await upstream.json();
    } catch (_) {
      return res.status(502).json({ error: "The AI provider returned an unreadable response. Please try again." });
    }

    if (!upstream.ok) {
      const providerType = data && data.error ? data.error.type : "unknown";
      console.error("OpenAI API request failed:", upstream.status, providerType);
      if (upstream.status === 429) {
        return res.status(429).json({ error: "The AI service is busy or its usage limit has been reached. Please try again later." });
      }
      return res.status(502).json({ error: "The AI provider could not complete this request. Please try again later." });
    }

    const answer = typeof data.output_text === "string" ? data.output_text.trim() : "";
    if (!answer) {
      return res.status(502).json({ error: "The AI returned an empty response. Please try again." });
    }

    return res.status(200).json({ reply: answer });
  } catch (error) {
    if (error && error.name === "AbortError") {
      return res.status(504).json({ error: "The request took too long. Please try again." });
    }
    console.error("Abdullah AI server error:", error && error.message ? error.message : "unknown");
    return res.status(500).json({ error: "Something went wrong on the server. Please try again." });
  } finally {
    clearTimeout(timeout);
  }
};