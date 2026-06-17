/**
 * 카메라/렌즈 감지 모듈
 * ------------------------------------------------------------
 * 동작 원리:
 *  1. react-native-vision-camera 의 Frame Processor 로 매 프레임을 받음
 *  2. vision-camera-resize-plugin 으로 320x320 RGB Uint8 로 다운샘플
 *  3. react-native-fast-tflite 로 YOLOv8n.tflite (COCO 80 class) 추론
 *  4. class id 67 (cell phone) / 73 (laptop) / 63 (tv) / 62 (monitor)
 *     검출 시 cameraDetected = true
 *  5. 동시에 프레임 평균 밝기 + 고휘도 점광원(반사광) heuristic 으로
 *     lensGlintDetected 판정
 *
 * 프라이버시:
 *  - 모든 추론은 온디바이스. 프레임/이미지를 외부로 전송하지 않음.
 *  - 결과(boolean + confidence)만 React state 로 올림.
 *
 * 빌드 필수:
 *  - apps/mobile/assets/models/yolov8n.tflite  (모델 파일, 약 6MB)
 *    → Ultralytics 공식 export 사용:
 *      `yolo export model=yolov8n.pt format=tflite imgsz=320 int8=False`
 *  - metro.config.js 에서 .tflite asset 허용 필요 (아래 metro 설정 참고)
 */

import { useTensorflowModel } from 'react-native-fast-tflite';
import { useResizePlugin } from 'vision-camera-resize-plugin';
import { useCallback } from 'react';
import { Worklets } from 'react-native-worklets-core';
import type { Frame } from 'react-native-vision-camera';

export type DetectionResult = {
  cameraDetected: boolean;
  lensGlintDetected: boolean;
  confidence: number;
  detectedClasses: number[];
};

// COCO class ids 가 "촬영 가능 기기" 로 간주되는 목록
// 67 cell phone, 63 laptop, 62 tv, 73 book(false-positive 방지용 제외)
const SUSPICIOUS_CLASSES = new Set<number>([67, 63, 62]);
const CONFIDENCE_THRESHOLD = 0.45;

/**
 * React hook: 모델 로딩 + frameProcessor + JS 콜백 묶음.
 * Library 화면의 숨겨진 <Camera> 컴포넌트에 frameProcessor 로 연결한다.
 */
export function useCameraDetector(onResult: (r: DetectionResult) => void) {
  const model = useTensorflowModel(require('../../assets/models/yolov8n.tflite'));
  const { resize } = useResizePlugin();

  // worklet -> JS thread 로 결과 전달
  const postResult = Worklets.createRunOnJS(onResult);

  const frameProcessor = useCallback(
    (frame: Frame) => {
      'worklet';
      const m = model.state === 'loaded' ? model.model : null;
      if (!m) return;

      // 320x320 RGB Uint8
      const input = resize(frame, {
        scale: { width: 320, height: 320 },
        pixelFormat: 'rgb',
        dataType: 'uint8',
      });

      const outputs = m.runSync([input]);
      // YOLOv8n tflite 출력: [1, 84, 2100]  (xywh + 80 class scores)
      const out = outputs[0] as unknown as Float32Array;
      const numBoxes = 2100;
      const stride = 84;

      let best = 0;
      const detected: number[] = [];

      for (let i = 0; i < numBoxes; i++) {
        // class scores: index 4..83
        let bestClass = -1;
        let bestScore = 0;
        for (let c = 0; c < 80; c++) {
          const s = out[(4 + c) * numBoxes + i];
          if (s > bestScore) {
            bestScore = s;
            bestClass = c;
          }
        }
        if (bestScore > CONFIDENCE_THRESHOLD && SUSPICIOUS_CLASSES.has(bestClass)) {
          detected.push(bestClass);
          if (bestScore > best) best = bestScore;
        }
      }

      // 간이 렌즈 반사광 휴리스틱: 320x320 RGB 의 매우 밝은 픽셀 비율
      let brightCount = 0;
      const sample = 4; // 4픽셀 간격 sampling 으로 비용 절감
      for (let p = 0; p < input.length; p += 3 * sample) {
        const r = input[p];
        const g = input[p + 1];
        const b = input[p + 2];
        if (r > 240 && g > 240 && b > 240) brightCount++;
      }
      const brightRatio = brightCount / (input.length / (3 * sample));
      const lensGlintDetected = brightRatio > 0.002 && brightRatio < 0.02;

      postResult({
        cameraDetected: detected.length > 0,
        lensGlintDetected,
        confidence: best,
        detectedClasses: detected,
      });
    },
    [model, resize]
  );

  return {
    frameProcessor,
    modelLoaded: model.state === 'loaded',
    modelError: model.state === 'error' ? model.error : null,
  };
}
