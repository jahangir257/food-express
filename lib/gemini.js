export async function gemini(prompt, { system, json = false } = {}) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY missing');
  const models = [process.env.GEMINI_MODEL, ...(process.env.GEMINI_FALLBACK_MODELS || '').split(',')].map((s) => s?.trim()).filter(Boolean);
  for (const m of models) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify({
          systemInstruction: system ? { parts: [{ text: system }] } : undefined,
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: json ? { responseMimeType: 'application/json' } : undefined }) });
      if (!res.ok) continue;
      const d = await res.json();
      const t = d.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('');
      if (t) return t;
    } catch {}
  }
  throw new Error('AI is unavailable right now');
}

export async function geminiImage(prompt) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY missing');
  const model = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image';
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseModalities: ['IMAGE', 'TEXT'] } }) });
  if (!res.ok) throw new Error('Image generation failed');
  const d = await res.json();
  const part = d.candidates?.[0]?.content?.parts?.find((p) => p.inlineData || p.inline_data);
  const inl = part?.inlineData || part?.inline_data;
  if (!inl?.data) throw new Error('No image returned');
  return { data: Buffer.from(inl.data, 'base64'), contentType: inl.mimeType || inl.mime_type || 'image/png' };
}
