# Поля Play Console, кроме карточки магазина

Заполнить в Console вручную. Тексты названия и описаний — в `listing/`.

## Идентификация

| Поле | Значение |
| --- | --- |
| Package name / applicationId | `by.bnd.life2price` |
| Имя на устройстве (`expo.name`) | Life to Price |
| Expo slug | `price2life` (не id приложения) |
| Версия в репозитории | `1.0.0` |
| Категория | Finance |
| Теги | Personal finance, Calculator, Lifestyle |
| Контактный email | *ваш адрес разработчика* |
| Политика конфиденциальности (URL) | https://bndby.github.io/price2life/ |

## Языки карточки

| Play locale | Файл | Статус |
| --- | --- | --- |
| English (United States) — `en-US` | `listing/en-US.txt` | язык по умолчанию |
| Russian — `ru-RU` | `listing/ru-RU.txt` | перевод |
| Chinese (Simplified) — `zh-CN` | `listing/zh-CN.txt` | перевод |

Других локалей в приложении нет. Не добавляйте в Console языки без скриншотов и текстов.

## Графика

| Ассет | Файл | Требование Play |
| --- | --- | --- |
| Иконка карточки | `graphics/icon-512.png` | 512×512, PNG 32-bit с альфой, ≤1024 KB |
| Feature graphic | `graphics/feature-graphic-{locale}.png` | 1024×500, PNG 24-bit без альфы |
| Скриншоты телефона | `screenshots/phone/{locale}/01…04.png` | 1080×1920, 9:16, PNG без альфы; минимум 4 штуки ≥1080px для рекомендаций |

Название в карточке — **Life to Price**, без эмодзи (политика метаданных Play). На экране приложения заголовок — `Life❤️to💵Price` (ADR-0004).

## Data safety

В форме Play «сбор» — это передача данных **с устройства**. Локальное хранение туда не входит. Ответ на «Does your app collect or share any of the required user data types?»: **No**.

На устройстве (не в Data safety, но в политике) остаются доход и период, по желанию дата рождения и пол, по желанию язык. Это описано на https://bndby.github.io/price2life/. Политика и форма должны совпадать: разработчик данные не получает.

Нет аккаунта, рекламы, аналитики, покупки в приложении, фоновой геолокации.

## Анкета возрастного рейтинга (ориентир)

- Категория: утилита / финансы, не игра.
- Нет пользовательского контента, чата, рекламы, покупок.
- Нет сцен насилия. Дата рождения и пол — для таблицы дожития, не соцсеть.
- Целевая аудитория: 18+ разумна из‑за темы остатка жизни; формальный рейтинг выставит IARC.

## Что этот пакет не содержит

AAB/APK, подпись, Play App Signing, ответ на Data safety в Console. Это шаги в аккаунте разработчика после `expo prebuild` и сборки Android.

Политика конфиденциальности: страница в `docs/privacy/`, URL после публикации GitHub Pages — https://bndby.github.io/price2life/. В Console: **Policy and programs → App content → Privacy policy**. Та же ссылка открывается из настроек приложения.
