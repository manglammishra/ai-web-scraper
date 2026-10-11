const MODEL = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";

export async function summarizeText(title, text) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    const e = new Error("Server is missing GEMINI_API_KEY.");
    e.status = 500;
    throw e;
  }

  const prompt =
    `Summarize the following web page in 4-6 concise sentences, ` +
    `then give 3 short bullet-point key takeaways.\n\n` +
    `Title: ${title}\n\nContent:\n${text}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      signal: AbortSignal.timeout(30000),
    }
  );

  if (res.status === 429) {
    const e = new Error("Gemini free-tier rate limit hit. Wait a minute and try again.");
    e.status = 429;
    throw e;
  }
  if (!res.ok) {
    const e = new Error(`Gemini API error (${res.status}).`);
    e.status = 502;
    throw e;
  }

  const data = await res.json();
  const summary = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("").trim();
  if (!summary) {
    const e = new Error("Gemini returned no summary.");
    e.status = 502;
    throw e;
  }
  return summary;
}
