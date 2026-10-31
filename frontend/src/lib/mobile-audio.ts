// Mobile Audio & Web Speech resilience helpers for iOS Safari & Android Chrome

export function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;
  return /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent || navigator.vendor || (window as any).opera || ""
  );
}

/**
 * Mobile browsers (iOS Safari, Android Chrome) block speech synthesis and AudioContext
 * unless primed directly inside a user touch/click event handler.
 */
export function unlockMobileAudio(audioCtx?: AudioContext | null): void {
  if (typeof window === "undefined") return;

  try {
    // 1. Prime Speech Synthesis
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const silent = new SpeechSynthesisUtterance(" ");
      silent.volume = 0.01;
      silent.rate = 2.0;
      window.speechSynthesis.speak(silent);
    }

    // 2. Resume AudioContext if suspended
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {});
    }
  } catch (e) {
    console.warn("Mobile audio unlock attempt:", e);
  }
}

/**
 * Mobile browsers load speech synthesis voices asynchronously.
 * This helper guarantees voices are resolved before speaking.
 */
export function getAvailableVoices(): Promise<SpeechSynthesisVoice[]> {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return Promise.resolve([]);
  }

  const existing = window.speechSynthesis.getVoices();
  if (existing && existing.length > 0) {
    return Promise.resolve(existing);
  }

  return new Promise((resolve) => {
    let resolved = false;

    const onVoices = () => {
      if (!resolved) {
        resolved = true;
        resolve(window.speechSynthesis.getVoices());
      }
    };

    window.speechSynthesis.onvoiceschanged = onVoices;

    // Timeout fallback if event never fires
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve(window.speechSynthesis.getVoices());
      }
    }, 400);
  });
}
