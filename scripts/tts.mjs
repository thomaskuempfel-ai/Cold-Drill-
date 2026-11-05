// Sample-call audio for the landing page with Gemini TTS (same voice family as the Cold Drill app).
// Reads scripts/demo-lines.json, writes audio/demo-<n>.mp3 and audio/manifest.json.
// Needs GEMINI_API_KEY (GitHub secret) and ffmpeg. Run: node scripts/tts.mjs
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";

const KEY = process.env.GEMINI_API_KEY;
if (!KEY) { console.error("GEMINI_API_KEY missing"); process.exit(1); }
const MODELS = (process.env.TTS_MODEL || "gemini-2.5-flash-preview-tts,gemini-2.5-pro-preview-tts").split(",");
const { lines } = JSON.parse(readFileSync("scripts/demo-lines.json", "utf8"));
mkdirSync("audio", { recursive: true });

async function speak(line) {
  let last;
  for (const model of MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
    const body = {
      contents: [{ parts: [{ text: `${line.style}\n\n${line.text}` }] }],
      generationConfig: { responseModalities: ["AUDIO"], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: line.voice } } } },
    };
    const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json", "x-goog-api-key": KEY }, body: JSON.stringify(body) });
    if (!r.ok) { last = `${model}: HTTP ${r.status} ${(await r.text()).slice(0, 200)}`; console.warn(last); continue; }
    const j = await r.json();
    const part = j?.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
    if (!part) { last = `${model}: no audio in answer`; console.warn(last); continue; }
    return { pcm: Buffer.from(part.inlineData.data, "base64"), mime: part.inlineData.mimeType || "audio/L16;rate=24000", model };
  }
  throw new Error(last);
}

const files = [];
for (let i = 0; i < lines.length; i++) {
  const { pcm, mime, model } = await speak(lines[i]);
  const rate = Number((/rate=(\d+)/.exec(mime) || [])[1] || 24000);
  writeFileSync("audio/tmp.pcm", pcm);
  const out = `audio/demo-${i + 1}.mp3`;
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "s16le", "-ar", String(rate), "-ac", "1", "-i", "audio/tmp.pcm", "-codec:a", "libmp3lame", "-b:a", "64k", out]);
  files.push(out.replace(/^audio\//, ""));
  console.log(`${out} (${model}, ${lines[i].voice}): ${lines[i].text.slice(0, 50)}`);
}
execFileSync("rm", ["-f", "audio/tmp.pcm"]);
writeFileSync("audio/manifest.json", JSON.stringify({ files, generatedAt: new Date().toISOString(), voices: "Gemini TTS" }, null, 1));
