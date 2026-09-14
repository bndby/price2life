jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageTag: 'ru-RU', languageCode: 'ru' }],
}));

jest.mock('@react-native-community/datetimepicker', () => {
  const React = require('react');
  const { View } = require('react-native');

  function MockDateTimePicker(props) {
    MockDateTimePicker.latestProps = props;
    return React.createElement(View, {
      testID: props.testID ?? 'ios-date-time-picker',
    });
  }
  MockDateTimePicker.latestProps = null;

  return {
    __esModule: true,
    default: MockDateTimePicker,
    DateTimePickerAndroid: {
      open: jest.fn(),
      dismiss: jest.fn(),
    },
  };
});

afterEach(async () => {
  const AsyncStorage = require('@react-native-async-storage/async-storage');
  await AsyncStorage.clear();
  const i18n = require('./src/i18n/i18n').default;
  await i18n.changeLanguage('ru');
  const { DateTimePickerAndroid } = require('@react-native-community/datetimepicker');
  const DateTimePicker = require('@react-native-community/datetimepicker').default;
  DateTimePickerAndroid.open.mockReset();
  DateTimePickerAndroid.dismiss.mockReset();
  DateTimePicker.latestProps = null;
});
