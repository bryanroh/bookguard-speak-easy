# YOLOv8n TFLite 모델 위치

이 폴더에 **`yolov8n.tflite`** 파일을 두셔야 카메라 감지가 동작합니다.

빌드 PC 에서:

```bash
pip install ultralytics
yolo export model=yolov8n.pt format=tflite imgsz=320 int8=False
# 결과 파일을 yolov8n.tflite 로 이름 바꿔서 이 폴더에 복사
```

자세한 내용은 `apps/mobile/BUILD_NOTES.md` 의 섹션 2 참고.
