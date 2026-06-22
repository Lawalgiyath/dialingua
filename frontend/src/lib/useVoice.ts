/**
 * useVoice — browser TTS hook using the Web Speech API.
 *
 * Chrome (used for the demo) connects to Google's TTS infrastructure,
 * which has proper voices for Yoruba, Igbo, and Hausa — including
 * tonal pronunciation when diacritics are present in the text.
 *
 * Tier system:
 *   "native"     — dedicated voice for the target language (e.g. Google Yoruba)
 *   "english-ng" — English (Nigeria) approximation
 *   "english"    — Generic English fallback
 *   "none"       — No voice available
 */
import { useCallback, useEffect, useRef, useState } from "react";

// BCP 47 tags to try in priority order for each language code.
// Tags are tried in sequence; first match wins.
const BCP47: Record<string, string[]> = {
  yor: ["yo", "yo-NG", "yo-001"],
  ibo: ["ig", "ig-NG", "ig-001"],
  hau: ["ha", "ha-NG", "ha-Latn-NG"],
  fuv: ["ff", "ff-Latn-NG", "ff-NG"],
  knc: ["kn"],                             // unlikely to have a voice; falls through
  ibb: ["en-NG", "en-GB"],
  bin: ["en-NG", "en-GB"],
  urh: ["en-NG", "en-GB"],
  nup: ["en-NG", "en-GB"],
  pcm: ["en-NG", "en-GB"],
  tiv: ["en-NG", "en-GB"],
  efi: ["en-NG", "en-GB"],
  ijc: ["en-NG", "en-GB"],
  ijb: ["en-NG", "en-GB"],
  jju: ["en-NG", "en-GB"],
  ngas: ["en-NG", "en-GB"],
};

// Speech rate tuning — tonal languages benefit from a slightly slower rate
// so the voice's pitch variation has time to register.
const RATE: Record<string, number> = {
  yor: 0.80,   // 3-tone H/M/L — give each syllable room
  ibo: 0.85,   // 2-tone with downstep
  hau: 0.90,   // 2-tone, fairly clear
  fuv: 0.93,   // atonal — normal speed fine
};

export type VoiceTier = "native" | "english-ng" | "english" | "none";

export interface VoiceResult {
  speak: (text: string, langCode: string) => void;
  stop: () => void;
  speaking: boolean;
  supported: boolean;
  getTier: (langCode: string) => VoiceTier;
}

export function useVoice(): VoiceResult {
  const [speaking, setSpeaking] = useState(false);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const supported =
    typeof window !== "undefined" && "speechSynthesis" in window;

  // Load voices — Chrome fires voiceschanged once online voices are ready.
  useEffect(() => {
    if (!supported) return;
    const load = () => {
      voicesRef.current = speechSynthesis.getVoices();
    };
    load();
    speechSynthesis.addEventListener("voiceschanged", load);
    return () => speechSynthesis.removeEventListener("voiceschanged", load);
  }, [supported]);

  /** Find the best available voice for a language code. */
  const findVoice = useCallback(
    (langCode: string): { voice: SpeechSynthesisVoice | null; tier: VoiceTier } => {
      const voices = voicesRef.current;
      if (!voices.length) return { voice: null, tier: "none" };

      const tags = BCP47[langCode];

      if (tags) {
        for (const tag of tags) {
          const prefix = tag.split("-")[0];
          const isNative = !prefix.startsWith("en");

          // Exact match first
          const exact = voices.find((v) => v.lang === tag);
          if (exact) {
            return {
              voice: exact,
              tier: isNative
                ? "native"
                : tag.includes("NG")
                ? "english-ng"
                : "english",
            };
          }
          // Language prefix match (e.g. "yo" matches "yo-NG")
          const pfx = voices.find((v) => v.lang.startsWith(prefix));
          if (pfx) {
            return { voice: pfx, tier: isNative ? "native" : "english-ng" };
          }
        }
      }

      // Generic fallbacks
      const ng = voices.find((v) => v.lang === "en-NG");
      if (ng) return { voice: ng, tier: "english-ng" };

      const gb = voices.find((v) => v.lang === "en-GB");
      if (gb) return { voice: gb, tier: "english" };

      const any = voices.find((v) => v.lang.startsWith("en"));
      return { voice: any ?? null, tier: any ? "english" : "none" };
    },
    []
  );

  const speak = useCallback(
    (text: string, langCode: string) => {
      if (!supported || !text || text === "-") return;
      speechSynthesis.cancel();

      const { voice, tier } = findVoice(langCode);
      const utt = new SpeechSynthesisUtterance(text);
      if (voice) utt.voice = voice;

      // Set the lang on the utterance — Chrome uses this to select the
      // right online voice even if getVoices() hasn't loaded yet.
      utt.lang = BCP47[langCode]?.[0] ?? "en-NG";
      utt.rate = RATE[langCode] ?? 0.92;
      utt.pitch = 1.0;

      console.log(
        `[Dialingua TTS] ${langCode} | tier=${tier} | voice="${voice?.name ?? "browser-default"}"`
      );

      utt.onstart = () => setSpeaking(true);
      utt.onend = () => setSpeaking(false);
      unerror: utt.onerror = () => setSpeaking(false);

      speechSynthesis.speak(utt);
    },
    [supported, findVoice]
  );

  const stop = useCallback(() => {
    if (supported) speechSynthesis.cancel();
    setSpeaking(false);
  }, [supported]);

  const getTier = useCallback(
    (langCode: string): VoiceTier => findVoice(langCode).tier,
    [findVoice]
  );

  return { speak, stop, speaking, supported, getTier };
}
