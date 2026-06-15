import { useEffect, useState } from "react";
import { ShieldAlert, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";

type Status = "checking" | "no_camera" | "ok";

/**
 * Blocks access entirely if the device has no camera. Required because the
 * security model depends on camera-based capture detection.
 */
export function CameraGate({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.enumerateDevices) {
        if (!cancelled) setStatus("no_camera");
        return;
      }
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasCamera = devices.some((d) => d.kind === "videoinput");
        if (!cancelled) setStatus(hasCamera ? "ok" : "no_camera");
      } catch {
        if (!cancelled) setStatus("no_camera");
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (status === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">기기 검사 중…</p>
      </div>
    );
  }

  if (status === "no_camera") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md rounded-lg border border-red-500/40 bg-red-500/5 p-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/15 text-red-600">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h2 className="font-serif text-xl font-semibold">카메라가 필요합니다</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            본 서비스의 보안 정책상 <strong>카메라가 장착된 기기</strong>에서만 콘텐츠 열람이 가능합니다.
          </p>
          <div className="mt-4 space-y-2 text-left text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <Camera className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span><strong>데스크톱</strong>: USB 웹캠을 연결한 뒤 페이지를 새로고침하세요.</span>
            </div>
            <div className="flex items-start gap-2">
              <Camera className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span><strong>노트북·태블릿·스마트폰</strong>: 정상적으로 이용 가능합니다.</span>
            </div>
          </div>
          <Button className="mt-5 w-full" onClick={() => location.reload()}>다시 검사</Button>
          <p className="mt-3 text-[11px] text-muted-foreground">
            저작권 보호를 위해 카메라 기반 외부 촬영 감지가 필수입니다.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
