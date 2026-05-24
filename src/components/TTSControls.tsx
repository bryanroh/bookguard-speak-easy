import { useEffect, useMemo, useRef, useState } from "react";
import { Play, Pause, Square, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

type Props = { html: string; lang: string; onSentenceChange?: (idx: number) => void };

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?。！？\n])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function TTSControls({ html, lang, onSentenceChange }: Props) {
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [rate, setRate] = useState(1);
  const [supported, setSupported] = useState(true);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);
  const idxRef = useRef(0);

  const sentences = useMemo(() => {
    if (typeof document === "undefined") return [];
    const div = document.createElement("div");
    div.innerHTML = html;
    return splitSentences(div.textContent || "");
  }, [html]);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) setSupported(false);
    return () => { window.speechSynthesis?.cancel(); };
  }, []);

  useEffect(() => () => { window.speechSynthesis?.cancel(); onSentenceChange?.(-1); }, [html, onSentenceChange]);

  const langCode = useMemo(() => ({ ko: "ko-KR", en: "en-US", ja: "ja-JP", zh: "zh-CN", es: "es-ES" } as Record<string, string>)[lang] || "ko-KR", [lang]);

  const speakIndex = (i: number) => {
    if (i >= sentences.length) {
      setPlaying(false); setPaused(false); onSentenceChange?.(-1); return;
    }
    idxRef.current = i;
    onSentenceChange?.(i);
    const u = new SpeechSynthesisUtterance(sentences[i]);
    u.lang = langCode; u.rate = rate;
    u.onend = () => speakIndex(i + 1);
    u.onerror = () => { setPlaying(false); setPaused(false); };
    utterRef.current = u;
    window.speechSynthesis.speak(u);
  };

  const start = () => {
    if (!supported || sentences.length === 0) return;
    window.speechSynthesis.cancel();
    setPlaying(true); setPaused(false);
    speakIndex(0);
  };
  const pause = () => { window.speechSynthesis.pause(); setPaused(true); };
  const resume = () => { window.speechSynthesis.resume(); setPaused(false); };
  const stop = () => { window.speechSynthesis.cancel(); setPlaying(false); setPaused(false); onSentenceChange?.(-1); };

  if (!supported) return <p className="text-xs text-muted-foreground">이 브라우저는 음성 읽기를 지원하지 않습니다.</p>;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Volume2 className="h-4 w-4 text-muted-foreground" />
      {!playing ? (
        <Button size="sm" onClick={start}><Play className="mr-1 h-3 w-3" />읽기</Button>
      ) : paused ? (
        <Button size="sm" onClick={resume}><Play className="mr-1 h-3 w-3" />계속</Button>
      ) : (
        <Button size="sm" variant="secondary" onClick={pause}><Pause className="mr-1 h-3 w-3" />일시정지</Button>
      )}
      {playing && <Button size="sm" variant="outline" onClick={stop}><Square className="mr-1 h-3 w-3" />정지</Button>}
      <div className="flex items-center gap-2 px-2">
        <span className="text-xs text-muted-foreground">속도</span>
        <div className="w-24"><Slider value={[rate]} min={0.5} max={2} step={0.1} onValueChange={(v) => setRate(v[0])} /></div>
        <span className="w-8 text-xs">{rate.toFixed(1)}x</span>
      </div>
    </div>
  );
}
