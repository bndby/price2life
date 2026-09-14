import { DeviceEventEmitter, Platform } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { render, screen, userEvent, waitFor } from '@testing-library/react-native';
import App from '../../App';
import { InMemoryStorageDriver, IncomeStorageService } from '../storage/incomeStorage';
import { LocaleStorageService } from '../storage/localeStorage';
import { PersonStorageService } from '../storage/personStorage';
import type { Clock } from '../storage/PersonProvider';

function pickerOpenParams() {
  const open = DateTimePickerAndroid.open as jest.Mock;
  expect(open).toHaveBeenCalled();
  return open.mock.calls[open.mock.calls.length - 1][0];
}

function confirmPickerDate(date: Date) {
  const { onValueChange } = pickerOpenParams();
  onValueChange({ nativeEvent: { timestamp: date.getTime(), utcOffset: 0 } }, date);
}

function dismissPicker() {
  pickerOpenParams().onDismiss();
}

async function renderApp(
  service = new IncomeStorageService(new InMemoryStorageDriver()),
  options: {
    localeService?: LocaleStorageService;
    personService?: PersonStorageService;
    getDeviceLanguageTags?: () => readonly string[];
    now?: Clock;
  } = {},
) {
  const localeService = options.localeService ?? new LocaleStorageService(new InMemoryStorageDriver());
  const personService = options.personService ?? new PersonStorageService(new InMemoryStorageDriver());
  await render(
    <App
      service={service}
      personService={personService}
      localeService={localeService}
      getDeviceLanguageTags={options.getDeviceLanguageTags ?? (() => ['ru-RU'])}
      now={options.now}
    />,
  );
}

describe('first launch flow', () => {
  test('opens settings with an explanation and no close control when income is missing', async () => {
    await renderApp();

    expect(
      await screen.findByText(/Укажите ваш доход, чтобы начать переводить цены в рабочее время/),
    ).toBeOnTheScreen();
    expect(screen.getByText(/Данные остаются только на этом устройстве/)).toBeOnTheScreen();
    expect(screen.getByLabelText('Политика конфиденциальности')).toBeOnTheScreen();
    expect(screen.queryByLabelText('Назад')).toBeNull();
    expect(screen.getByTestId('settings-title')).toHaveTextContent('Первоначальная настройка');
  });

  test('hardware back on first launch shows a hint and does not leave settings', async () => {
    await renderApp();
    await screen.findByText(/Укажите ваш доход/);

    DeviceEventEmitter.emit('hardwareBackPress');
    expect(await screen.findByText('Пожалуйста, укажите доход для продолжения')).toBeOnTheScreen();
    expect(screen.getByTestId('settings-title')).toHaveTextContent('Первоначальная настройка');
  });

  test('saving income opens the converter and shows life time equivalent for an item price', async () => {
    const user = userEvent.setup();
    await renderApp();

    await screen.findByLabelText('Доход на руки');
    await user.type(screen.getByLabelText('Доход на руки'), '150000');
    await user.press(screen.getByLabelText('Сохранить доход'));

    expect(await screen.findByTestId('converter-title')).toHaveTextContent('Life❤️to💵Price');
    expect(screen.getByLabelText('Life to Price')).toBeOnTheScreen();
    expect(screen.queryByText(/Ставка:/)).toBeNull();
    expect(screen.queryByText('Быстрый выбор цены:')).toBeNull();
    expect(screen.queryByLabelText('Цена 500')).toBeNull();
    expect(screen.queryByLabelText('Цена 2 500')).toBeNull();
    expect(screen.queryByLabelText('Цена 15 000')).toBeNull();
    expect(screen.queryByLabelText('Цена 80 000')).toBeNull();
    await user.type(screen.getByLabelText('Цена покупки'), '25000');

    expect(await screen.findByTestId('life-time-equivalent')).toHaveTextContent('3 дн. 5 ч.');
    expect(screen.getByText('29 рабочих часов')).toBeOnTheScreen();
    expect(screen.queryByTestId('life-share')).toBeNull();
  });

  test('a previously saved income skips settings and still converts the current price after a raise', async () => {
    const user = userEvent.setup();
    const driver = new InMemoryStorageDriver();
    const service = new IncomeStorageService(driver);
    await service.saveSettings(150000, 'month');

    await renderApp(service);

    expect(await screen.findByTestId('converter-title')).toHaveTextContent('Life❤️to💵Price');
    expect(screen.queryByText('Первоначальная настройка')).toBeNull();

    await user.type(screen.getByLabelText('Цена покупки'), '25000');
    expect(await screen.findByTestId('life-time-equivalent')).toHaveTextContent('3 дн. 5 ч.');

    await user.press(screen.getByLabelText('Открыть настройки'));
    expect(await screen.findByLabelText('Назад')).toBeOnTheScreen();

    await user.clear(screen.getByLabelText('Доход на руки'));
    await user.type(screen.getByLabelText('Доход на руки'), '300000');
    await user.press(screen.getByLabelText('Сохранить доход'));

    expect(await screen.findByTestId('life-time-equivalent')).toHaveTextContent('1 дн. 6 ч.');
    expect(screen.getByTestId('converter-title')).toHaveTextContent('Life❤️to💵Price');
  });

  test('a previously saved person shows remaining-life share without opening settings', async () => {
    const user = userEvent.setup();
    const driver = new InMemoryStorageDriver();
    const service = new IncomeStorageService(driver);
    const personService = new PersonStorageService(driver);
    await service.saveSettings(150000, 'month');
    await personService.saveSettings({ year: 1996, month: 9, day: 10 }, 'male');

    await renderApp(service, {
      personService,
      now: () => new Date(2026, 8, 10),
    });

    await user.type(await screen.findByLabelText('Цена покупки'), '25000');
    expect(await screen.findByTestId('life-share')).toHaveTextContent('0,03% оставшейся жизни');
  });

  test('date of birth and sex add a remaining-life share badge under working hours', async () => {
    const user = userEvent.setup();
    await renderApp(new IncomeStorageService(new InMemoryStorageDriver()), {
      now: () => new Date(2026, 8, 10),
    });

    await screen.findByLabelText('Доход на руки');
    await user.type(screen.getByLabelText('Доход на руки'), '150000');
    await user.press(screen.getByTestId('settings-dob-field'));
    const opened = pickerOpenParams();
    expect(opened.display).toBe('spinner');
    expect(opened.mode).toBe('date');
    expect(opened.value).toEqual(new Date(1996, 8, 10));
    expect(opened.maximumDate).toEqual(new Date(2026, 8, 10));
    expect(opened.minimumDate).toEqual(new Date(1906, 8, 10));
    confirmPickerDate(new Date(1996, 8, 10));
    expect(await screen.findByLabelText('Дата рождения, 10 сентября 1996 г.')).toBeOnTheScreen();
    await user.press(screen.getByText('Муж'));

    expect(await screen.findByTestId('remaining-life-preview')).toHaveTextContent('Остаток жизни ≈ 43 года');
    await user.press(screen.getByLabelText('Сохранить доход'));

    await user.type(await screen.findByLabelText('Цена покупки'), '25000');
    expect(await screen.findByTestId('life-time-equivalent')).toHaveTextContent('3 дн. 5 ч.');
    expect(screen.getByText('29 рабочих часов')).toBeOnTheScreen();
    expect(await screen.findByTestId('life-share')).toHaveTextContent('0,03% оставшейся жизни');
  });

  test('cancelling the date picker leaves date of birth empty', async () => {
    const user = userEvent.setup();
    await renderApp(new IncomeStorageService(new InMemoryStorageDriver()), {
      now: () => new Date(2026, 8, 10),
    });

    await screen.findByLabelText('Дата рождения');
    await user.press(screen.getByTestId('settings-dob-field'));
    dismissPicker();

    expect(screen.getByLabelText('Дата рождения')).toBeOnTheScreen();
    expect(screen.queryByLabelText('Очистить дату рождения')).toBeNull();
    expect(screen.queryByTestId('remaining-life-preview')).toBeNull();
  });

  test('clearing date of birth removes the remaining-life preview and does not keep sex coupled', async () => {
    const user = userEvent.setup();
    await renderApp(new IncomeStorageService(new InMemoryStorageDriver()), {
      now: () => new Date(2026, 8, 10),
    });

    await screen.findByLabelText('Доход на руки');
    await user.type(screen.getByLabelText('Доход на руки'), '150000');
    await user.press(screen.getByTestId('settings-dob-field'));
    confirmPickerDate(new Date(1996, 8, 10));
    await user.press(screen.getByText('Муж'));
    expect(await screen.findByTestId('remaining-life-preview')).toBeOnTheScreen();

    await user.press(screen.getByLabelText('Очистить дату рождения'));
    expect(screen.getByLabelText('Дата рождения')).toBeOnTheScreen();
    expect(screen.queryByTestId('remaining-life-preview')).toBeNull();
    expect(screen.getByText('Муж')).toBeOnTheScreen();
  });

  test('a future date of birth is rejected and does not leave settings', async () => {
    const user = userEvent.setup();
    await renderApp(new IncomeStorageService(new InMemoryStorageDriver()), {
      now: () => new Date(2026, 8, 10),
    });

    await screen.findByLabelText('Доход на руки');
    await user.type(screen.getByLabelText('Доход на руки'), '150000');
    await user.press(screen.getByTestId('settings-dob-field'));
    confirmPickerDate(new Date(2026, 8, 11));
    await user.press(screen.getByText('Муж'));
    await user.press(screen.getByLabelText('Сохранить доход'));

    expect(await screen.findByText('Дата рождения не может быть в будущем')).toBeOnTheScreen();
    expect(screen.getByTestId('settings-title')).toHaveTextContent('Первоначальная настройка');
  });

  test('income period select defaults to per-month and changes conversion after save', async () => {
    const user = userEvent.setup();
    await renderApp();

    await screen.findByLabelText('Доход на руки');
    expect(screen.getByLabelText('Период, в месяц')).toBeOnTheScreen();
    expect(screen.queryByText('Сумма дохода')).toBeNull();
    expect(screen.queryByText('Период получения')).toBeNull();

    await user.type(screen.getByLabelText('Доход на руки'), '150000');
    await user.press(screen.getByTestId('settings-period-field'));
    await user.press(await screen.findByTestId('settings-period-year'));
    expect(screen.getByLabelText('Период, в год')).toBeOnTheScreen();
    await user.press(screen.getByLabelText('Сохранить доход'));

    await user.type(await screen.findByLabelText('Цена покупки'), '25000');
    expect(await screen.findByTestId('life-time-equivalent')).toHaveTextContent('2 мес.');
    expect(screen.getByText('347 рабочих часов')).toBeOnTheScreen();
  });

  test('hardware back closes the income period dialog on first launch without leaving settings', async () => {
    const user = userEvent.setup();
    await renderApp();

    await screen.findByLabelText('Период, в месяц');
    await user.press(screen.getByTestId('settings-period-field'));
    expect(await screen.findByTestId('settings-period-year')).toBeOnTheScreen();

    DeviceEventEmitter.emit('hardwareBackPress');
    await waitFor(() => {
      expect(screen.queryByTestId('settings-period-year')).not.toBeOnTheScreen();
    });
    expect(screen.queryByText('Пожалуйста, укажите доход для продолжения')).toBeNull();
    expect(screen.getByTestId('settings-title')).toHaveTextContent('Первоначальная настройка');

    DeviceEventEmitter.emit('hardwareBackPress');
    expect(await screen.findByText('Пожалуйста, укажите доход для продолжения')).toBeOnTheScreen();
  });
});

type MockIosDateTimePicker = typeof DateTimePicker & {
  latestProps: {
    value: Date;
    locale?: string;
    display?: string;
    mode?: string;
    minimumDate?: Date;
    maximumDate?: Date;
    onValueChange?: (event: { nativeEvent: { timestamp: number; utcOffset: number } }, date: Date) => void;
  } | null;
};

function iosPickerProps() {
  const props = (DateTimePicker as MockIosDateTimePicker).latestProps;
  expect(props).not.toBeNull();
  return props!;
}

describe('iOS date of birth picker', () => {
  const originalOS = Platform.OS;

  beforeAll(() => {
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      get: () => 'ios',
    });
  });

  afterAll(() => {
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      get: () => originalOS,
    });
  });

  test('spinner dialog commits only on confirm and does not use the Android opener', async () => {
    const user = userEvent.setup();
    await renderApp(new IncomeStorageService(new InMemoryStorageDriver()), {
      now: () => new Date(2026, 8, 10),
    });

    await screen.findByLabelText('Дата рождения');
    await user.press(screen.getByTestId('settings-dob-field'));

    expect(DateTimePickerAndroid.open).not.toHaveBeenCalled();
    expect(await screen.findByTestId('settings-dob-picker')).toBeOnTheScreen();
    const opened = iosPickerProps();
    expect(opened.display).toBe('spinner');
    expect(opened.mode).toBe('date');
    expect(opened.locale).toBe('ru-RU');
    expect(opened.value).toEqual(new Date(1996, 8, 10));
    expect(opened.maximumDate).toEqual(new Date(2026, 8, 10));
    expect(opened.minimumDate).toEqual(new Date(1906, 8, 10));

    opened.onValueChange?.(
      { nativeEvent: { timestamp: new Date(1980, 0, 15).getTime(), utcOffset: 0 } },
      new Date(1980, 0, 15),
    );
    expect(screen.getByLabelText('Дата рождения')).toBeOnTheScreen();

    await user.press(screen.getByTestId('settings-dob-picker-confirm'));
    expect(await screen.findByLabelText('Дата рождения, 15 января 1980 г.')).toBeOnTheScreen();
    expect(screen.queryByLabelText('Очистить дату рождения')).toBeOnTheScreen();
  });

  test('cancel after spinning leaves date of birth empty', async () => {
    const user = userEvent.setup();
    await renderApp(new IncomeStorageService(new InMemoryStorageDriver()), {
      now: () => new Date(2026, 8, 10),
    });

    await screen.findByLabelText('Дата рождения');
    await user.press(screen.getByTestId('settings-dob-field'));
    iosPickerProps().onValueChange?.(
      { nativeEvent: { timestamp: new Date(1980, 0, 15).getTime(), utcOffset: 0 } },
      new Date(1980, 0, 15),
    );
    await user.press(screen.getByTestId('settings-dob-picker-cancel'));

    expect(screen.getByLabelText('Дата рождения')).toBeOnTheScreen();
    expect(screen.queryByLabelText('Очистить дату рождения')).toBeNull();
  });
});
