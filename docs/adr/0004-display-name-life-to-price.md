# Отображаемое имя Life to Price при конверсии Price → Life

На экране бренд — `Life❤️to💵Price`, произносимое имя и заголовок контекста — **Life to Price**. Расчёт не меняется: Item Price → Life Time Equivalent. Перевёртыш совпадает с иконкой (ADR-0003): жизнь уходит в покупку. Android applicationId — `by.bnd.life2price`. Репозиторий, Expo slug и storage keys остаются `price2life`. Под иконкой Android — `Life to Price`, без эмодзи: у ярлыка нет отдельного a11y, а TalkBack не должен читать сердце и долларовую купюру.

**Considered Options**: `Price❤️to💵Life` (отклонено: сознательный перевёртыш относительно направления счёта); эмодзи в `expo.name` (отклонено: лаунчер озвучил бы глифы); канон **Price to Life** в CONTEXT.md при экране Life to Price (отклонено: агенты и TalkBack должны говорить одно имя).
