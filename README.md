# sferra-desktop

Минимальный кроссплатформенный PoC-браузер на Electron.

Целевые платформы:
- Windows (portable .exe, без инсталлятора)
- macOS (несигнированное .app и .zip, без notarization)
- Linux (AppImage, самодостаточный бинарник)

Долгосрочная цель:
- встроить расширение CryptoPro для браузера,
- встроить нативный плагин CryptoPro,
- встроить CryptoPro CSP Lite,
и поставлять всё это внутри одного приложения, без отдельной установки в ОС.

## Текущее состояние (Шаг 2)

Сделано:
- добавлена конфигурация `electron-builder` в `package.json`;
- добавлена папка `vendor/` (сюда позже попадут бинарники CryptoPro и расширения);
- добавлен workflow `.github/workflows/build.yml` для автоматической сборки.

Что делает CI:
1. Запускается на `ubuntu-latest`, `macos-latest`, `windows-latest`.
2. Ставит Node.js 22.x.
3. Кеширует зависимости npm.
4. Вызывает нужный скрипт сборки для каждой ОС:
   - Windows → `npm run build:win` → `portable` .exe
   - macOS → `npm run build:mac` → несигнированное `.app` и `.zip`
   - Linux → `npm run build:linux` → `.AppImage` и `.tar.gz`
5. Загружает содержимое `dist/` как артефакт.

Как протестировать:
- Сделай push в `main` или открой pull request.
- Зайди во вкладку "Actions" в GitHub.
- Открой последний ран build-and-package.
- Скачай артефакт для своей ОС.

macOS:
- macOS предупредит, что приложение от неизвестного разработчика.
- Открой через правый клик → Open.

Windows:
- SmartScreen может показать предупреждение, потому что .exe не подписан.
- Нажми "More info" → "Run anyway".

## Структура репозитория

- `src/main/` — код main-процесса Electron
- `src/preload/` — preload-скрипт, экспортирующий `desktopAPI`
- `src/renderer/` — простой тулбар + iframe как упрощённый браузер
- `vendor/` — будущие встроенные бинарники CryptoPro (копируются внутрь сборки)
- `dist/` — результаты сборки electron-builder (игнорируется в git)
- `.github/workflows/build.yml` — GitHub Actions для упаковки и артефактов
