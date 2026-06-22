/**
 * useVoice — Dialingua Custom Cloud TTS Engine
 *
 * Uses the Lingva API proxy for Google TTS to guarantee native
 * Nigerian pronunciation (Hausa, Igbo, Yoruba) without browser CORS issues
 * or hotlink protection blocks.
 */
import { useCallback, useEffect, useRef, useState } from "react";

// Cloud engine mapping for supported languages
const CLOUD_LANG_CODES: Record<string, string> = {
  yor: "yo",
  ibo: "ig",
  hau: "ha",
};

export type VoiceTier = "cloud-native" | "none";

export interface VoiceResult {
  speak: (text: string, langCode: string) => Promise<void>;
  stop: () => void;
  speaking: boolean;
  supported: boolean;
  getTier: (langCode: string) => VoiceTier;
}

export function useVoice(): VoiceResult {
  const [speaking, setSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize a hidden audio element for our custom TTS engine
    const audio = new Audio();
    audio.addEventListener("play", () => setSpeaking(true));
    audio.addEventListener("ended", () => setSpeaking(false));
    audio.addEventListener("error", () => setSpeaking(false));
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, []);

  const getTier = useCallback((langCode: string): VoiceTier => {
    if (CLOUD_LANG_CODES[langCode]) return "cloud-native";
    return "none";
  }, []);

  const supported = true; // Our cloud engine works everywhere

  const speak = useCallback(
    async (text: string, langCode: string) => {
      if (!text || text === "-" || !audioRef.current) return;

      const cloudCode = CLOUD_LANG_CODES[langCode];
      if (!cloudCode) {
        console.warn(`[Dialingua TTS] No cloud voice available for ${langCode}.`);
        return;
      }

      console.log(`[Dialingua TTS] Generating native audio... (lang=${cloudCode})`);

      // Cancel any ongoing audio
      audioRef.current.pause();
      
      try {
        setSpeaking(true); // show loading state while fetching

        // Fetch audio data using Lingva open API to bypass Google TTS hotlink restrictions
        const res = await fetch(`https://lingva.ml/api/v1/audio/${cloudCode}/${encodeURIComponent(text)}`);
        if (!res.ok) throw new Error("Audio generation failed");
        
        const data = await res.json();
        if (!data.audio || !data.audio.length) throw new Error("Empty audio returned");

        // Reconstruct audio file from byte array
        const byteArray = new Uint8Array(data.audio);
        const blob = new Blob([byteArray], { type: "audio/mpeg" });
        const url = URL.createObjectURL(blob);

        audioRef.current.src = url;
        audioRef.current.playbackRate = 0.9; // Slight slowdown for tonal clarity (essential for Yoruba/Igbo)
        await audioRef.current.play();

      } catch (err) {
        console.error("Cloud TTS playback failed:", err);
        setSpeaking(false);
      }
    },
    []
  );

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setSpeaking(false);
  }, []);

  return { speak, stop, speaking, supported, getTier };
}
