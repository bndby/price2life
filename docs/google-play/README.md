# Карточка Google Play — Life to Price

Пакет для загрузки в **Grow users → Store presence → Main store listing**.

Идентификатор приложения: `by.bnd.life2price`. Название в магазине и на ярлыке: **Life to Price** (без эмодзи). Заголовок внутри приложения остаётся `Life❤️to💵Price` (ADR-0004).

## Состав

```
docs/google-play/
  README.md
  console.md                          ← категория, Data safety, рейтинг, URL политики
  listing/en-US.txt                   ← язык по умолчанию
  listing/ru-RU.txt
  listing/zh-CN.txt
  graphics/icon-512.png
  graphics/feature-graphic-en-US.png
  graphics/feature-graphic-ru-RU.png
  graphics/feature-graphic-zh-CN.png
  screenshots/phone/{en-US,ru-RU,zh-CN}/01-converter.png
                                      /02-converter-large.png
                                      /03-first-launch.png
                                      /04-settings-person.png
  preview/phone.html                  ← макеты экранов для пересъёмки
  aab/life2price-1.0.0.aab            ← signed bundle (gitignored)
  signing.md                          ← upload-ключ, пересборка
  build_aab.py
```

Скриншоты — HTML-реконструкция двух экранов приложения (конвертер и настройки) на цветах MD3 Paper и с теми же строками i18n. Системная шапка Android условная. Перед продом можно переснять те же четыре сцены с устройства.

## Загрузка в Console

1. Default language: **English (United States)**.
2. Добавить локали **Russian** и **Chinese (Simplified)**.
3. В каждой локали вставить name / short / full из `listing/`.
4. Иконка — одна на все языки: `graphics/icon-512.png`.
5. Feature graphic и 4 скриншота телефона — из папки соответствующей локали (для en-US — `feature-graphic-en-US.png` и `screenshots/phone/en-US/`).
6. Alt-текст — блоки в конце каждого `listing/*.txt`.
7. Категория, Data safety, контакт — `console.md`. Политика: https://bndby.github.io/price2life/ (исходник `docs/privacy/`; публикуется GitHub Pages с `master`).

Пересборка графики и скриншотов (нужны Python Pillow и Chrome/Chromium):

```bash
python docs/google-play/render_assets.py
```

AAB: `docs/google-play/aab/life2price-1.0.0.aab`. Ключ загрузки и команды пересборки — `signing.md`. Файл и `credentials/` в git не попадают.

## Политика метаданных

В названии и кратком описании нет эмодзи, капса и призывов «скачай». Полное описание без отзывов и рейтингов.
