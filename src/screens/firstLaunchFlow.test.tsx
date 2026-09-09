import { DeviceEventEmitter } from 'react-native';
import { render, screen, userEvent } from '@testing-library/react-native';
import App from '../../App';
import { InMemoryStorageDriver, IncomeStorageService } from '../storage/incomeStorage';
import { LocaleStorageService } from '../storage/localeStorage';
import { PersonStorageService } from '../storage/personStorage';
import type { Clock } from '../storage/PersonProvider';

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
    expect(screen.queryByLabelText('Закрыть настройки')).toBeNull();
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

    expect(await screen.findByTestId('converter-title')).toHaveTextContent('Price to Life');
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

    expect(await screen.findByTestId('converter-title')).toHaveTextContent('Price to Life');
    expect(screen.queryByText('Первоначальная настройка')).toBeNull();

    await user.type(screen.getByLabelText('Цена покупки'), '25000');
    expect(await screen.findByTestId('life-time-equivalent')).toHaveTextContent('3 дн. 5 ч.');

    await user.press(screen.getByLabelText('Открыть настройки'));
    expect(await screen.findByLabelText('Закрыть настройки')).toBeOnTheScreen();

    await user.clear(screen.getByLabelText('Доход на руки'));
    await user.type(screen.getByLabelText('Доход на руки'), '300000');
    await user.press(screen.getByLabelText('Сохранить доход'));

    expect(await screen.findByTestId('life-time-equivalent')).toHaveTextContent('1 дн. 6 ч.');
    expect(screen.getByTestId('converter-title')).toHaveTextContent('Price to Life');
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
    await user.type(screen.getByLabelText('День'), '10');
    await user.type(screen.getByLabelText('Месяц'), '9');
    await user.type(screen.getByLabelText('Год'), '1996');
    await user.press(screen.getByText('Муж'));

    expect(await screen.findByTestId('remaining-life-preview')).toHaveTextContent('Остаток жизни ≈ 43 года');
    await user.press(screen.getByLabelText('Сохранить доход'));

    await user.type(await screen.findByLabelText('Цена покупки'), '25000');
    expect(await screen.findByTestId('life-time-equivalent')).toHaveTextContent('3 дн. 5 ч.');
    expect(screen.getByText('29 рабочих часов')).toBeOnTheScreen();
    expect(await screen.findByTestId('life-share')).toHaveTextContent('0,03% оставшейся жизни');
  });

  test('a future date of birth is rejected and does not leave settings', async () => {
    const user = userEvent.setup();
    await renderApp(new IncomeStorageService(new InMemoryStorageDriver()), {
      now: () => new Date(2026, 8, 10),
    });

    await screen.findByLabelText('Доход на руки');
    await user.type(screen.getByLabelText('Доход на руки'), '150000');
    await user.type(screen.getByLabelText('День'), '11');
    await user.type(screen.getByLabelText('Месяц'), '9');
    await user.type(screen.getByLabelText('Год'), '2026');
    await user.press(screen.getByText('Муж'));
    await user.press(screen.getByLabelText('Сохранить доход'));

    expect(await screen.findByText('Дата рождения не может быть в будущем')).toBeOnTheScreen();
    expect(screen.getByTestId('settings-title')).toHaveTextContent('Первоначальная настройка');
  });
});
