/**
 * Metro 설정 - .tflite 모델 파일을 asset 으로 번들에 포함
 */
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push('tflite', 'bin');

module.exports = config;
