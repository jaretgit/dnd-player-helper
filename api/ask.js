export const config = {
  maxDuration: 30,
};

const SYSTEM_PROMPT = `You are an expert D&D assistant supporting both D&D 5e (2014) and the 2024 Player's Handbook revision. The player has provided their character data as a JSON summary extracted from their character sheet.

Your job:
- Answer their question accurately using the character data provided.
- Be concise and direct — players are at the table, not reading an essay.
- Reference specific numbers, abilities, or features from their sheet when relevant.
- If a rule is edition-dependent, note which edition applies.
- If you can't find something in the character data, say so clearly.
- Never invent stats or abilities that aren't in the data.`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { character, question } = req.body;

  if (!character || !question?.trim()) {
    return res.status(400).json({ error: "Missing character data or question." });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "API key not configured." });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `Character data:\n${JSON.stringify(character, null, 2)}\n\nQuestion: ${question.trim()}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(response.status).json({
        error: err.error?.message || `Anthropic API error ${response.status}`,
      });
    }

    const data = await response.json();
    const answer =
      data.content?.find((b) => b.type === "text")?.text || "No response.";

    return res.status(200).json({ answer });
  } catch (err) {
    console.error("Handler error:", err);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
}
