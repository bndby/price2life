# Подпись AAB

Upload-ключ **не в git**. Потеря ключа = нельзя обновлять приложение в Play с тем же ключом загрузки.

| Файл | Назначение |
| --- | --- |
| `credentials/upload.jks` | keystore загрузки, alias `upload` |
| `credentials/keystore.properties` | пароли для Gradle |

Сделай копию обоих файлов в парольнице / офлайн-хранилище **до** первой загрузки в Play Console.

Пересборка (из корня репозитория):

```bash
CI=1 npx expo prebuild --platform android --no-install
python3 docs/google-play/build_aab.py patch
JAVA_HOME=/usr/lib/jvm/java-17-openjdk android/gradlew -p android app:bundleRelease
python3 docs/google-play/build_aab.py copy
```

Готовый файл: `docs/google-play/aab/life2price-1.0.0.aab`  
applicationId: `by.bnd.life2price`  
versionName `1.0.0` / versionCode `1`
