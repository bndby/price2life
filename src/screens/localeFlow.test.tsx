import { render, screen, userEvent } from '@testing-library/react-native';
import App from '../../App';
import { InMemoryStorageDriver, IncomeStorageService } from '../storage/incomeStorage';
import { LocaleStorageService } from '../storage/localeStorage';

async function renderApp(options: {
  incomeService?: IncomeStorageService;
  localeService?: LocaleStorageService;
  getDeviceLanguageTags?: () => readonly string[];
} = {}) {
  const driver = new InMemoryStorageDriver();
  await render(
    <App
      service={options.incomeService ?? new IncomeStorageService(driver)}
      localeService={options.localeService ?? new LocaleStorageService(driver)}
      getDeviceLanguageTags={options.getDeviceLanguageTags ?? (() => ['en-US'])}
    />,
  );
}

describe('App Locale', () => {
  test('follows the device language when no preference is saved', async () => {
    await renderApp({ getDeviceLanguageTags: () => ['en-US'] });

    expect(await screen.findByTestId('settings-title')).toHaveTextContent('Initial setup');
    expect(screen.getByText('Welcome to Price to Life')).toBeOnTheScreen();
    expect(screen.getByLabelText('System language · English')).toBeOnTheScreen();
    expect(screen.queryByLabelText('中文')).toBeNull();
  });

  test('an explicit language is saved immediately and no longer follows the device', async () => {
    const user = userEvent.setup();
    const driver = new InMemoryStorageDriver();
    const localeService = new LocaleStorageService(driver);

    await renderApp({
      localeService,
      getDeviceLanguageTags: () => ['en-US'],
    });

    await screen.findByText('Welcome to Price to Life');
    await user.press(screen.getByTestId('settings-language-field'));
    await user.press(await screen.findByLabelText('中文'));

    expect(await screen.findByTestId('settings-title')).toHaveTextContent('初始设置');
    expect(await localeService.getPreference()).toBe('zh-Hans');
  });

  test('system language clears the preference and follows the device again', async () => {
    const user = userEvent.setup();
    const driver = new InMemoryStorageDriver();
    const localeService = new LocaleStorageService(driver);
    await localeService.savePreference('zh-Hans');

    await renderApp({
      localeService,
      getDeviceLanguageTags: () => ['en-US'],
    });

    expect(await screen.findByTestId('settings-title')).toHaveTextContent('初始设置');
    await user.press(screen.getByTestId('settings-language-field'));
    await user.press(await screen.findByTestId('settings-language-system'));

    expect(await screen.findByTestId('settings-title')).toHaveTextContent('Initial setup');
    expect(await localeService.getPreference()).toBeNull();
  });

  test('saving income does not persist a language preference', async () => {
    const user = userEvent.setup();
    const driver = new InMemoryStorageDriver();
    const localeService = new LocaleStorageService(driver);

    await renderApp({
      localeService,
      getDeviceLanguageTags: () => ['en-US'],
    });

    await screen.findByLabelText('Take-home income');
    await user.type(screen.getByLabelText('Take-home income'), '150000');
    await user.press(screen.getByLabelText('Save income'));

    expect(await screen.findByTestId('converter-title')).toHaveTextContent('Price to Life');
    expect(await localeService.getPreference()).toBeNull();
  });

  test('a saved App Locale is used even when the device language differs', async () => {
    const driver = new InMemoryStorageDriver();
    const incomeService = new IncomeStorageService(driver);
    const localeService = new LocaleStorageService(driver);
    await incomeService.saveSettings(150000, 'month');
    await localeService.savePreference('ru');

    await renderApp({
      incomeService,
      localeService,
      getDeviceLanguageTags: () => ['zh-CN'],
    });

    expect(await screen.findByTestId('converter-title')).toHaveTextContent('Price to Life');
    expect(screen.getByText('Эквивалент рабочего времени')).toBeOnTheScreen();
  });
});
