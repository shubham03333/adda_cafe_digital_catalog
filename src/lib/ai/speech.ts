export type BrowserSpeechRecognition = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  abort: () => void;
};

type SpeechCtor = new () => BrowserSpeechRecognition;

export function speechRecognitionSupported() {
  if (typeof window === "undefined") return false;
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function createSpeechRecognizer(): BrowserSpeechRecognition | null {
  const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Ctor) return null;
  const recognition = new Ctor();
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.lang = "en-IN";
  return recognition;
}

function voiceLang(language: "en" | "hi" | "mr") {
  if (language === "hi") return ["hi-IN", "hi"];
  if (language === "mr") return ["mr-IN", "hi-IN", "hi"];
  return ["en-IN", "en-GB", "en-US", "en"];
}

function scoreVoice(voice: SpeechSynthesisVoice, wanted: string[]) {
  let score = 0;
  const lang = voice.lang.toLowerCase();
  const name = voice.name.toLowerCase();
  if (wanted.some((code) => lang.startsWith(code.toLowerCase()))) score += 8;
  if (/female|zira|samantha|heera|nira|vaani|google/.test(name)) score += 6;
  if (/natural|neural|premium/.test(name)) score += 3;
  if (voice.localService) score += 2;
  return score;
}

export function speakWaiterReply(text: string, language: "en" | "hi" | "mr") {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text.slice(0, 500));
  const wanted = voiceLang(language);
  utterance.lang = wanted[0];
  utterance.rate = 1;
  utterance.pitch = 1.05;
  const voices = window.speechSynthesis.getVoices();
  const best = [...voices].sort((a, b) => scoreVoice(b, wanted) - scoreVoice(a, wanted))[0];
  if (best) utterance.voice = best;
  window.speechSynthesis.speak(utterance);
}

export function stopWaiterSpeech() {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechCtor;
    webkitSpeechRecognition?: SpeechCtor;
  }
}
