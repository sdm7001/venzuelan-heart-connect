// Translate gift messages between EN and ES using Lovable AI.
// Returns { source_lang, target_lang, original, translated, skipped? }.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type Lang = "en" | "es";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, target_lang, source_hint } = await req.json();

    const original = String(text ?? "").trim();
    const target: Lang = target_lang === "es" ? "es" : "en";

    if (!original) {
      return json({
        source_lang: source_hint ?? null,
        target_lang: target,
        original: "",
        translated: "",
        skipped: "empty",
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const resp = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            {
              role: "system",
              content:
                "You translate short, personal gift messages between English (en) and Spanish (es) for a serious-relationship dating platform called MatchVenezuelan. Keep the original tone, warmth, names, emojis, and punctuation. Never add commentary. Never solicit, advertise, or modify intent. If the text is already in the target language, return it unchanged.",
            },
            {
              role: "user",
              content: `Translate the following message into ${
                target === "en" ? "English" : "Spanish"
              }. Source language hint: ${source_hint ?? "unknown"}.\n\nMessage:\n"""${original}"""`,
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "return_translation",
                description: "Return detected source language and translated text.",
                parameters: {
                  type: "object",
                  properties: {
                    detected_source_lang: {
                      type: "string",
                      enum: ["en", "es", "other"],
                    },
                    translated_text: { type: "string" },
                  },
                  required: ["detected_source_lang", "translated_text"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "return_translation" },
          },
        }),
      },
    );

    if (resp.status === 429) {
      return json(
        { error: "Rate limits exceeded, please try again later." },
        429,
      );
    }
    if (resp.status === 402) {
      return json(
        { error: "AI credits exhausted. Please add funds to continue." },
        402,
      );
    }
    if (!resp.ok) {
      const t = await resp.text();
      console.error("AI gateway error", resp.status, t);
      return json({ error: "Translation failed" }, 500);
    }

    const data = await resp.json();
    const call = data?.choices?.[0]?.message?.tool_calls?.[0];
    const args = call?.function?.arguments
      ? JSON.parse(call.function.arguments)
      : null;

    if (!args) {
      return json({
        source_lang: source_hint ?? null,
        target_lang: target,
        original,
        translated: original,
        skipped: "no_tool_call",
      });
    }

    const detected: Lang | "other" = args.detected_source_lang;
    const translated = String(args.translated_text ?? original);

    return json({
      source_lang: detected,
      target_lang: target,
      original,
      translated,
      skipped: detected === target ? "same_language" : undefined,
    });
  } catch (e) {
    console.error("translate-gift-message error", e);
    return json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      500,
    );
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
