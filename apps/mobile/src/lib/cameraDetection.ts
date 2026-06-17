/**
 * 카메라/렌즈 감지 모듈 (TODO: 실제 구현은 EAS 빌드 후)
 *
 * 핵심 원칙:
 *  - 전면 카메라로 주변을 주기적으로 캡처
 *  - 온디바이스 ML (TFLite / Vision Framework / ML Kit)로 추론
 *  - 외부 서버로 이미지 전송 금지 (프라이버시)
 *
 * 감지 대상:
 *  1. 핸드폰/카메라/태블릿 형태 (Object Detection - YOLOv8n.tflite)
 *  2. 렌즈 반사광 (OpenCV HoughCircles + 밝기 분석)
 *  3. 비정상적인 사람 시선/포즈
 *
 * 사용 라이브러리:
 *  - react-native-vision-camera (프레임 프로세서)
 *  - react-native-fast-tflite (TFLite 추론)
 *  - react-native-worklets-core
 *
 * 빌드 시: apps/mobile/assets/models/yolov8n.tflite 모델 파일 추가 필요
 */

export type DetectionResult = {
  cameraDetected: boolean;
  lensGlintDetected: boolean;
  confidence: number;
};

export async function analyzeFrame(_frameBase64: string): Promise<DetectionResult> {
  // TODO: 네이티브 프레임 프로세서에서 호출됨
  return { cameraDetected: false, lensGlintDetected: false, confidence: 0 };
}
