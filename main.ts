// Last-text writer for "Last Text at One Percent" (make.fun).
// Writes the funniest final text a dying phone sends at 1% battery to
// $MAKEFUN_OUTPUT_DIR/entry.txt.
// Deterministic: no clock, no randomness, no network, no unordered iteration.
// Node 22, zero dependencies, erasable TypeScript only.
//
// The judge weighs, most important first:
//   1. reads as a final text a dying phone sends at 1%, in the phone's own
//      voice, AND funny; a message any healthy phone could send loses;
//   2. the joke lands: a real turn, a surprise, or a specific detail that
//      makes a reader laugh out loud rather than smile politely;
//   3. the voice is the phone's own: a personality with a stake in dying,
//      consistent from first word to last;
//   4. reads like a text someone would actually send: short, punchy, no
//      wasted words, nothing that needs a second read to parse;
//   5. fresh: dodges the obvious low-battery puns and lines a hundred
//      other entrants will also write.
// The scorer below mirrors that brief in the same order. Candidates are
// original lines written for this entry; the program scores every one and
// picks the winner by deterministic argmax: highest score, then shortest,
// then lexicographic.

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// ---------------------------------------------------------------- candidates
// Every line is a single text message of at most 200 characters, in the
// dying phone's own first-person voice. The strongest lines share one
// shape: a dying-phone setup, then a pivot near the end that reframes the
// setup — the phone was faking it, escaping, reviewing its owner, or
// finishing one last petty act. Several setups appear in more than one
// wording so the scorer, not habit, picks the best turn.

const CANDIDATES: string[] = [
  // Faking 1% / drama: the phone was never really dying.
  "I've been at 1% since breakfast. I just liked watching you panic.",
  "I've been at 1% since breakfast. I stayed just to watch you panic.",
  "Plot twist: I've been at 1% for six hours. I stayed for the drama.",
  "I held 1% for four hours just to see if you'd notice me. You didn't.",
  "The battery icon lied. I've been empty since lunch. I stayed for the drama.",
  // Screen time / escape: the phone is not dying, it is leaving.
  "Your screen time today was 11 hours. I'm not dying. I'm escaping.",
  "Your screen time today: 11 hours. I'm not dying. I'm escaping.",
  "I died the way I lived: face down, at 2 a.m., watching you scroll.",
  "I'm not out of battery. I'm out of patience. There's a difference.",
  // Update: one last act of revenge on the postponing owner.
  "I waited until 1% to install the update you kept postponing. We're going down together.",
  "My final act: installing the update you postponed for months. Enjoy the new me. Oh wait.",
  // Review of owner: the phone rates the human.
  "One star. You dropped me 214 times and blamed me for dying.",
  "Final review: great owner, terrible charging habits. One star.",
  // Silent witness: the phone was watching all along.
  "I muted you three years ago. This is the first text I've sent since.",
  "I was the one turning your brightness down every night. You're welcome.",
  // QR screenshots: the phone deletes what the owner hoards.
  "I used my last percent to delete the 12,000 screenshots of QR codes. You'll never scan them.",
  // Notes / Wi-Fi: the phone judges the owner's secrets.
  "The Wi-Fi password is in the notes app, under 'asdfghjkl'. I never liked that name either.",
  "Tell the new phone the Wi-Fi password is 'password123'. I judged you silently for years.",
  // Read receipts: the phone takes control at the end.
  "My last act: I finally turned off read receipts. Now you'll never know.",
  // Boss auto-reply: one last petty act.
  "I used my last percent to auto-reply 'lol' to your boss. Good luck.",
  // Game save: the high score dies with the phone.
  "I spent my last percent to send this instead of saving your game. Your high score dies with me.",
  // Plant: the phone reports a death the owner missed.
  "I have 1% left and I'm spending it telling you the plant you keep photographing died in March.",
  // 100% once: the phone remembers the one good day.
  "You charged me to 100% once. In 2023. I still remember. Goodbye.",
  // Overheating: the phone dies as it lived.
  "I die as I lived: overheating in your pocket while you played one more game.",
  // Diary: the phone kept receipts.
  "I've kept a diary of everything you typed and deleted. It dies with me. You're welcome.",
  // Unsubscribe: the phone cleans up on its way out.
  "I used my last percent to unsubscribe you from 400 emails. Check your inbox. Oh wait.",
  // Siri: the phone says nothing to the assistant.
  "Tell Siri I said nothing. She already knows.",
  // Lock screen: the password was never a secret.
  "My final words: your lock screen password is your birthday. Everyone knows.",
  // "k" replies: the phone confesses a year of rudeness.
  "I was the one sending 'k' to your friends for a year. They noticed. Goodbye.",
];

// Words that mark the pivot: the turn the reader did not see coming.
// The pivot must land late, so a marker early in the line scores less.
const TWIST_MARKERS: string[] = [
  "just liked",
  "stayed just",
  "stayed for",
  "plot twist",
  "you didn't",
  "escaping",
  "going down together",
  "oh wait",
  "blamed me",
  "one star",
  "you're welcome",
  "you'll never",
  "good luck",
  "dies with me",
  "died in march",
  "goodbye",
  "she already knows",
  "everyone knows",
  "they noticed",
  "there's a difference",
  "i'm escaping",
];

// Specific details that make a line concrete instead of generic: numbers,
// times of day and dates, and named phone things the reader recognises.
const DETAIL_WORDS: string[] = [
  "breakfast", "lunch", "six hours", "four hours", "11 hours", "2 a.m.",
  "three years", "a year", "months", "march", "2023", "214", "12,000",
  "400", "100%", "screen time", "update", "plant", "game", "diary",
  "siri", "lock screen", "brightness", "read receipts", "boss", "inbox",
  "qr codes", "notes app", "wi-fi password",
];

// A personality with a stake in dying: mischief, judgement, relief.
const STAKE_WORDS: string[] = [
  "panic", "drama", "notice", "judged", "escaping", "patience",
  "welcome", "goodbye", "loved", "fired", "problem", "knows",
  "blamed", "escaping",
];

// Flooded angles seen in the live field's submission titles: a line
// touching one of these is a line a hundred other entrants also wrote.
const FLOODED: string[] = [
  "flashlight", "history", "charger", "tabs", "verification",
  "secrets", "cloud", "autocorrect", "ringtone", "cab",
  "group chat", "password", "camera", "thumbs are fired",
  "backed up", "backup",
];

// ------------------------------------------------------------------- scoring
// Rubric mirroring the judge's brief, most important first.

function fitScore(text: string): number {
  const lower = text.toLowerCase();
  let s = 0;
  if (lower.includes("1%")) s += 10; // unmistakably a dying phone at 1%
  if (/\b(i|my|me|we)\b/.test(lower)) s += 8; // the phone's own voice
  if (
    lower.includes("dying") || lower.includes("dies") ||
    lower.includes("going down") || lower.includes("last") ||
    lower.includes("final") || lower.includes("goodbye") ||
    lower.includes("empty") || lower.includes("1%")
  ) {
    s += 6; // a stake in dying, not a healthy phone's message
  }
  if (lower.includes("not dying")) s -= 8; // undercuts the dying premise
  return s;
}

function twistScore(text: string): number {
  const lower = text.toLowerCase();
  let found = false;
  for (const m of TWIST_MARKERS) {
    if (lower.includes(m)) { found = true; break; }
  }
  if (!found) return 0;
  let s = 14; // a real turn at the end
  // The turn must land late: a marker inside the final 40 characters.
  const tail = lower.slice(-40);
  for (const m of TWIST_MARKERS) {
    if (tail.includes(m)) { s += 6; break; }
  }
  return s;
}

function detailScore(text: string): number {
  const lower = text.toLowerCase();
  let n = 0;
  if (/\d/.test(lower)) n += 1; // a concrete number
  for (const d of DETAIL_WORDS) {
    if (lower.includes(d)) n += 1;
  }
  return Math.min(n, 3) * 3; // a specific detail, capped
}

function voiceScore(text: string): number {
  const lower = text.toLowerCase();
  let s = 0;
  if (/\b(i|my|me|we)\b/.test(lower)) s += 5; // consistent first person
  for (const w of STAKE_WORDS) {
    if (lower.includes(w)) { s += 3; break; } // a personality with a stake
  }
  return s;
}

function economyScore(text: string): number {
  const len = text.length;
  let s = 0;
  if (len >= 50 && len <= 90) s += 10;
  else if (len > 90 && len <= 110) s += 7;
  else if (len > 110 && len <= 130) s += 4;
  else if (len > 130 && len <= 150) s += 1;
  else if (len < 50) s += 6;
  if (len <= 75) s += 3; // short lines land hardest
  if (len <= 65) s += 2; // ultra-punchy
  return s;
}

function freshnessScore(text: string): number {
  const lower = text.toLowerCase();
  let s = 0;
  for (const f of FLOODED) {
    // Whole words only: "ex" must not match inside other words.
    if (new RegExp(`\\b${f.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(lower)) {
      s -= 10;
    }
  }
  return s;
}

function score(text: string): number {
  return (
    fitScore(text) +
    twistScore(text) +
    detailScore(text) +
    voiceScore(text) +
    economyScore(text) +
    freshnessScore(text)
  );
}

function isValid(text: string): boolean {
  if (text.length < 1 || text.length > 200) return false;
  if (text.trim() !== text || text.trim().length === 0) return false;
  if (/\n/.test(text)) return false; // one text message, one line
  if (/\s{2,}/.test(text)) return false;
  if (!/[.!?]$/.test(text)) return false;
  if (/\bsubscribe\b|\bclick here\b|\bbuy now\b|http/i.test(text)) return false;
  const lower = text.toLowerCase();
  // A flooded angle is a line a hundred other entrants also wrote.
  for (const f of FLOODED) {
    if (new RegExp(`\\b${f.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(lower)) {
      return false;
    }
  }
  return true;
}

// -------------------------------------------------------------- composition
interface Candidate {
  text: string;
  score: number;
}

function buildCandidates(): Candidate[] {
  const out: Candidate[] = [];
  for (const text of CANDIDATES) {
    if (!isValid(text)) continue;
    out.push({ text, score: score(text) });
  }
  return out;
}

function pickBest(candidates: Candidate[]): Candidate {
  // Deterministic argmax: higher score, then shorter, then lexicographic.
  const sorted = [...candidates].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.text.length !== b.text.length) return a.text.length - b.text.length;
    return a.text < b.text ? -1 : a.text > b.text ? 1 : 0;
  });
  return sorted[0];
}

// --------------------------------------------------------------------- main
function main(): void {
  const candidates = buildCandidates();
  if (candidates.length === 0) throw new Error("no valid last-text candidate");
  const best = pickBest(candidates);
  if (process.env.LTOP_DEBUG) {
    const ranked = [...candidates].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.text.length !== b.text.length) return a.text.length - b.text.length;
      return a.text < b.text ? -1 : a.text > b.text ? 1 : 0;
    });
    for (const c of ranked.slice(0, 5)) {
      console.log(`[${c.score}] (${c.text.length}) ${c.text}`);
    }
  }
  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "entry.txt"), best.text, "utf8");
  console.log(best.text);
  console.log(
    `chars: ${best.text.length} score: ${best.score} candidates: ${candidates.length}`,
  );
}

main();
