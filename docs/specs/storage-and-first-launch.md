# Спецификация хранения состояния (AsyncStorage) и логики первого запуска

## 1. Контракт персистентного хранилища (AsyncStorage)

### 1.1. Ключи хранилища
Для исключения коллизий с другими библиотеками и версиями используется префиксное именование:
- `STORAGE_KEY_USER_INCOME = '@price2life/user_income_v1'`

### 1.2. Схема хранимых данных
Данные сериализуются в JSON-строку:

```typescript
export interface UserIncomeSettings {
  readonly income: number;     // Положительное целое число (Net-доход, > 0)
  readonly period: IncomePeriod; // 'hour' | 'day' | 'week' | 'month' | 'year'
  readonly updatedAt: number;  // Unix timestamp (мс) момента сохранения
}

export type IncomePeriod = 'hour' | 'day' | 'week' | 'month' | 'year';
```

### 1.3. Значения по умолчанию (неинициализированное состояние)
```typescript
export const DEFAULT_INCOME_SETTINGS: UserIncomeSettings = {
  income: 0,
  period: 'month',
  updatedAt: 0,
};
```

### 1.4. Валидация и устойчивость к сбоям
- **Проверка при чтении (`validateAndParseIncomeSettings`)**:
  - `income` строго `number`, `!isNaN`, целое число (`Number.isInteger`) и `> 0`.
  - `period` строго входит в `['hour', 'day', 'week', 'month', 'year']`.
  - `updatedAt` валидный числовой timestamp.
- **Повреждение JSON или некорректная схема**:
  - При возникновении ошибки парсинга или несоответствии типов сервис возвращает `null` без падения приложения.
  - Состояние трактуется как неинициализированное (`isConfigured: false`).

---

## 2. Архитектура состояния (State Management & React Context)

### 2.1. Контекст `IncomeContext`
Приложение использует React Context (`IncomeProvider`) в корне дерева компонентов.

```typescript
export interface IncomeContextState {
  readonly isLoading: boolean;    // true во время начального чтения из AsyncStorage
  readonly isConfigured: boolean; // true, если сохранен валидный income > 0
  readonly income: number;        // Текущий доход
  readonly period: IncomePeriod;  // Текущий период
  readonly hourlyRate: number;    // Автоматически вычисленная часовая ставка
  readonly updatedAt: number;
  saveIncome(income: number, period: IncomePeriod): Promise<boolean>;
  resetIncome(): Promise<void>;
}
```

### 2.2. Реактивность вычислений
- При вызове `saveIncome(newIncome, newPeriod)`:
  1. Валидируются входные данные (`income > 0`, целое).
  2. Значение записывается в `AsyncStorage`.
  3. Обновляется локальный React-стейт контекста: пересчитывается `hourlyRate = calculateHourlyRate(income, period)`.
  4. Все подписчики контекста (`ConverterScreen`, `SettingsModal`) получают актуальные данные мгновенно без необходимости перезапуска приложения.

---

## 3. Логика первого запуска (First Launch Flow & Navigation State)

### 3.1. Структура навигации
Используется нативный стек React Navigation (`@react-navigation/native-stack`):
- `RootStack`:
  - `Converter`: базовый экран (конвертер цены в рабочее время).
  - `Settings`: модальный экран (`presentation: 'modal'`), открываемый поверх `Converter`.

```typescript
export type RootStackParamList = {
  Converter: undefined;
  Settings: { isFirstLaunch?: boolean } | undefined;
};
```

### 3.2. Диаграмма переходов и состояний при старте

```
[Запуск приложения]
        │
        ▼
[Чтение @price2life/user_income_v1] ─── (isLoading: true, SplashScreen / ActivityIndicator)
        │
        ├───► [Данные есть и income > 0] ───► (isConfigured: true)
        │                                            │
        │                                            ▼
        │                                 Экран `Converter`
        │                                 (готов к вводу цен)
        │
        └───► [Данных нет или income === 0] ──► (isConfigured: false, первый запуск)
                                                     │
                                                     ▼
                                          Автоматическое открытие
                                          модального экрана `Settings`
                                          { isFirstLaunch: true }
                                                     │
                                                     ▼
                                     [Пользователь вводит доход и жмет «Сохранить»]
                                                     │
                                                     ▼
                                          Сохранение в AsyncStorage
                                          Закрытие модального окна
                                          Переход на `Converter`
```

### 3.3. UX-правила экрана настроек при первом запуске (`isFirstLaunch: true`)
1. **Заголовок**: отображается приветственный подзаголовок или пояснение: *«Укажите ваш доход, чтобы начать переводить цены в рабочее время»*.
2. **Блокировка пустого выхода**:
   - Кнопка закрытия (крестик в шапке модального окна) скрыта при `isFirstLaunch: true`.
   - Аппаратная кнопка «Назад» на Android перехватывается (`BackHandler.addEventListener('hardwareBackPress', ...)`): если доход еще не сохранен, всплывает предупреждающий Snackbar: *«Пожалуйста, укажите доход для продолжения»* (или закрытие блокируется).
3. **После успешного сохранения**:
   - `saveIncome` выполняет запись, переводит `isConfigured` в `true`.
   - Выполняется `navigation.goBack()`, открывая экран `Converter`, на котором сразу видна часовая ставка и возможность расчета.
