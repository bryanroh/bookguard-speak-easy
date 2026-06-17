module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // worklets-core 는 reanimated/plugin 보다 먼저 와야 vision-camera frame processor 가 동작
      ['react-native-worklets-core/plugin'],
      'react-native-reanimated/plugin',
    ],
  };
};
