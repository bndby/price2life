jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageTag: 'ru-RU', languageCode: 'ru' }],
}));

afterEach(async () => {
  const AsyncStorage = require('@react-native-async-storage/async-storage');
  await AsyncStorage.clear();
  const i18n = require('./src/i18n/i18n').default;
  await i18n.changeLanguage('ru');
});
