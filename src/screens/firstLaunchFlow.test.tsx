import { DeviceEventEmitter } from 'react-native';
import { render, screen, userEvent } from '@testing-library/react-native';
import App from '../../App';
import { InMemoryStorageDriver, IncomeStorageService } from '../storage/incomeStorage';

async function renderApp(service = new IncomeStorageService(new InMemoryStorageDriver())) {
  await render(<App service={service} />);
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
    await user.type(screen.getByLabelText('Цена покупки'), '25000');

    expect(await screen.findByTestId('life-time-equivalent')).toHaveTextContent('3 дн. 5 ч.');
    expect(screen.getByText('29 рабочих часов')).toBeOnTheScreen();
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
});
