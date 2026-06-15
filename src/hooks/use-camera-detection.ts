import { useEffect, useRef, useState } from "react";
import { ObjectDetector, FilesetResolver } from "@mediapipe/tasks-vision";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Opts = {
  enabled: boolean;
  userId: string | null;
  bookId: string;
  pageId: string;
  onForceLogout: () => Promise<void> | void;
};

// COCO 클래스 중 "촬영 기기"로 간주할 항목
const FORBIDDEN_CLASSES = new Set([
  "cell phone",
  "camera",
  "laptop",
  "tv",
  "remote", // 일부 모델에서 휴대폰을 remote로 오탐 → 안전하게 포함
]);

const DETECTION_THRESHOLD = 0.55; // 신뢰도
const CONSECUTIVE_HITS_REQUIRED = 3; // 3프레임 연속 감지 시 차단 (오탐 방지)
const FRAME_INTERVAL_MS = 700; // 0.7초마다 1프레임 분석

type Status = "idle" | "requesting" | "denied" | "unsupported" | "active" | "blocked";

export function useCameraDetection({ enabled, userId, bookId, pageId, onForceLogout }: Opts) {
  const [status, setStatus] = useState<Status>("idle");
  const [detectedLabel, setDetectedLabel] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<ObjectDetector | null>(null);
  const hitsRef = useRef(0);
  const intervalRef = useRef<number | null>(null);
  const blockedRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    const log = (event_type: string, detail?: string) => {
      supabase
        .from("capture_logs")
        .insert({
          user_id: userId,
          book_id: bookId,
          page_id: pageId,
          event_type,
          user_agent: `${navigator.userAgent}${detail ? ` | ${detail}` : ""}`,
        })
        .then(() => {});
    };

    const cleanup = () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      detectorRef.current?.close();
      detectorRef.current = null;
      videoRef.current?.remove();
      videoRef.current = null;
    };

    const triggerLogout = async (label: string) => {
      if (blockedRef.current) return;
      blockedRef.current = true;
      setStatus("blocked");
      setDetectedLabel(label);
      log("camera_device_detected", `class=${label}`);
      document.body.classList.add("reader-blur");
      toast.error(
        `촬영 기기(${label})가 감지되어 보안 정책에 따라 자동 로그아웃됩니다.`,
        { duration: 6000 },
      );
      try { navigator.clipboard?.writeText(""); } catch {}
      cleanup();
      // 약간의 지연 후 로그아웃 (사용자가 메시지를 인지할 시간)
      setTimeout(async () => {
        await onForceLogout();
      }, 1500);
    };

    const start = async () => {
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        setStatus("unsupported");
        return;
      }
      setStatus("requesting");
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, facingMode: "user" },
          audio: false,
        });
      } catch (e) {
        console.warn("[camera-detect] permission denied", e);
        setStatus("denied");
        log("camera_permission_denied");
        return;
      }
      if (cancelled) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      streamRef.current = stream;

      // 숨김 video 엘리먼트
      const video = document.createElement("video");
      video.autoplay = true;
      video.playsInline = true;
      video.muted = true;
      video.style.position = "fixed";
      video.style.width = "1px";
      video.style.height = "1px";
      video.style.opacity = "0";
      video.style.pointerEvents = "none";
      video.style.left = "-9999px";
      document.body.appendChild(video);
      video.srcObject = stream;
      videoRef.current = video;

      try {
        await video.play();
      } catch (e) {
        console.warn("[camera-detect] video play failed", e);
      }

      // MediaPipe 로더 — WASM/모델은 CDN에서
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm",
        );
        const detector = await ObjectDetector.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite",
            delegate: "GPU",
          },
          scoreThreshold: DETECTION_THRESHOLD,
          runningMode: "VIDEO",
          maxResults: 5,
        });
        if (cancelled) {
          detector.close();
          return;
        }
        detectorRef.current = detector;
        setStatus("active");

        intervalRef.current = window.setInterval(() => {
          if (!videoRef.current || !detectorRef.current || blockedRef.current) return;
          if (videoRef.current.readyState < 2) return;
          const result = detectorRef.current.detectForVideo(
            videoRef.current,
            performance.now(),
          );
          const hit = result.detections.find((d) => {
            const cat = d.categories?.[0];
            return cat && FORBIDDEN_CLASSES.has(cat.categoryName.toLowerCase()) && cat.score >= DETECTION_THRESHOLD;
          });
          if (hit) {
            hitsRef.current += 1;
            const label = hit.categories[0].categoryName;
            if (hitsRef.current >= CONSECUTIVE_HITS_REQUIRED) {
              void triggerLogout(label);
            }
          } else {
            hitsRef.current = 0;
          }
        }, FRAME_INTERVAL_MS);
      } catch (e) {
        console.error("[camera-detect] detector init failed", e);
        setStatus("unsupported");
        cleanup();
      }
    };

    void start();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [enabled, userId, bookId, pageId, onForceLogout]);

  return { status, detectedLabel };
}
