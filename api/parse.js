export const config = {
  maxDuration: 30,
};

const PARSE_PROMPT = `You are parsing a D&D character sheet PDF. Extract all character information and return it as a single JSON object. Return ONLY the JSON — no explanation, no markdown, no backticks.

Extract these fields (use null for anything not found):
{
  "name": string,
  "class": string,
  "subclass": string,
  "level": number,
  "race": string,
  "background": string,
  "alignment": string,
  "experiencePoints": number,
  "abilities": {
    "strength": number, "dexterity": number, "constitution": number,
    "intelligence": number, "wisdom": number, "charisma": number
  },
  "abilityModifiers": {
    "strength": number, "dexterity": number, "constitution": number,
    "intelligence": number, "wisdom": number, "charisma": number
  },
  "savingThrows": { "strength": number, "dexterity": number, "constitution": number, "intelligence": number, "wisdom": number, "charisma": number },
  "proficiencyBonus": number,
  "armorClass": number,
  "initiative": number,
  "speed": string,
  "hitPoints": { "maximum": number, "current": number, "temporary": number },
  "hitDice": string,
  "deathSaves": { "successes": number, "failures": number },
  "skills": {
    "acrobatics": number, "animalHandling": number, "arcana": number, "athletics": number,
    "deception": number, "history": number, "insight": number, "intimidation": number,
    "investigation": number, "medicine": number, "nature": number, "perception": number,
    "performance": number, "persuasion": number, "religion": number, "sleightOfHand": number,
    "stealth": number, "survival": number
  },
  "passivePerception": number,
  "proficiencies": string[],
  "languages": string[],
  "senses": string[],
  "features": [{ "name": string, "description": string }],
  "attacks": [{ "name": string, "bonus": string, "damage": string, "type": string }],
  "spellcastingAbility": string,
  "spellSaveDC": number,
  "spellAttackBonus": number,
  "spellSlots": {
    "1": { "total": number, "used": number },
    "2": { "total": number, "used": number },
    "3": { "total": number, "used": number },
    "4": { "total": number, "used": number },
    "5": { "total": number, "used": number },
    "6": { "total": number, "used": number },
    "7": { "total": number, "used": number },
    "8": { "total": number, "used": number },
    "9": { "total": number, "used": number }
  },
  "spells": {
    "cantrips": string[],
    "level1": string[], "level2": string[], "level3": string[],
    "level4": string[], "level5": string[], "level6": string[],
    "level7": string[], "level8": string[], "level9": string[]
  },
  "equipment": string[],
  "currency": { "cp": number, "sp": number, "ep": number, "gp": number, "pp": number },
  "traits": string,
  "ideals": string,
  "bonds": string,
  "flaws": string,
  "notes": string
}`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { pdfBase64 } = req.body;

  if (!pdfBase64) {
    return res.status(400).json({ error: "Missing pdfBase64." });
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
        max_tokens: 2000,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "document",
                source: {
                  type: "base64",
                  media_type: "application/pdf",
                  data: pdfBase64,
                },
              },
              {
                type: "text",
                text: PARSE_PROMPT,
              },
            ],
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
    const raw = data.content?.find((b) => b.type === "text")?.text || "{}";

    let character;
    try {
      character = JSON.parse(raw.replace(/```json|```/g, "").trim());
    } catch {
      return res.status(500).json({ error: "Could not parse character sheet. Please try again." });
    }

    return res.status(200).json({ character });
  } catch (err) {
    console.error("Parse handler error:", err);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
}
