# Expo bare workflow compatibility with Node 26 and Android SDK

**Date:** 2026-09-09  
**Ticket:** https://github.com/bndby/price2life/issues/2  
**Environment (verified locally):** Node.js v26.2.0, npm 12.0.2, OpenJDK 17.0.20.1, `ANDROID_HOME=/home/by/Android/Sdk` (platforms `android-35`/`android-36`, build-tools through `36.0.0`, NDK `27.1.12297006`), Linux Manjaro, target Android

## Executive summary

- **Recommended stack:** Expo SDK **57** (`expo@^57.0.21`) + React Native **0.86.3** + React **19.2.3** — current stable matrix from Expo docs.
- **Node v26.2.0:** allowed by React Native `0.86` `engines` (`>= 25.0.0`), meets Expo SDK 57’s **minimum** Node `22.13.x`, but is **not** the version Expo/EAS bake into their reference image (Node **22.23.1**). Risk: `app.config.ts` without a project TypeScript install can fail on Node 26.
- **Java 17 + local Android SDK/NDK** match Expo SDK 57 / EAS Android image expectations (`compileSdk`/`targetSdk` **36**, NDK **27.1.12297006**).
- **UI/navigation/storage:** React Native Paper **5.15.3** (stable), `@react-navigation/native-stack` **7.x**, `@react-native-async-storage/async-storage` **2.2.0** via `npx expo install` (SDK-pinned; do not jump to npm `3.x` without a reason).
- Prefer template **`bare-minimum`** or CNG (`npx expo prebuild` / `npx expo run:android`) with Metro based on `expo/metro-config`. Expo has deprecated the old “bare vs managed” framing in favor of Continuous Native Generation (CNG).

## Recommended version matrix

| Package | Recommended stable | Minimum (for this env) | Notes / peers |
| --- | --- | --- | --- |
| Expo SDK (`expo`) | **57** (`57.0.21` latest tag) | 57 | Pairs with RN 0.86; docs min Node `22.13.x` |
| React Native | **0.86.3** | 0.86.0 | Expo `bundledNativeModules` pins `0.86.3` |
| React | **19.2.3** | 19.2.3 | Locked with SDK 57 / RN 0.86 |
| React Native Paper | **5.15.3** | 5.x with peers satisfied | Stable; `6.0.0-alpha.0` exists but not stable |
| `@react-navigation/native` | **^7.3.18** | 7.x | Peer of native-stack |
| `@react-navigation/native-stack` | **7.18.x** (e.g. 7.18.10) | 7.x | Needs `react-native-screens` ≥ 4 and `safe-area-context` ≥ 4 |
| `@react-native-async-storage/async-storage` | **2.2.0** | 2.2.0 (Expo pin) | Install with `npx expo install`; npm latest `3.1.1` is outside Expo’s tested pin |
| `react-native-screens` | **~4.26.0** | ≥ 4.0.0 | Expo pin; required by native-stack |
| `react-native-safe-area-context` | **~5.7.0** | ≥ 4.0.0 (Paper / Navigation) | Expo pin; required by Paper and Navigation |
| Node.js | **22.23.x LTS** for fewest surprises; **26.2.0 usable with caveats** | ≥ 22.13.0 (Expo SDK 57 floor) | RN 0.86 allows `>= 25.0.0` |
| JDK | **17** | 17 | RN docs recommend 17; EAS SDK 57 image is JDK 17 |
| Android `compileSdk` / `targetSdk` | **36** | 36 (SDK 57) | Local SDK has `android-36` and build-tools `36.0.0` |
| Android NDK | **27.1.12297006** | as shipped by template/EAS | Matches local install and EAS `sdk-57` image |

## Node.js v26.2.0 compatibility

1. **Expo SDK 57 minimum Node** is documented as **22.13.x** (version floor in the SDK ↔ RN matrix), not an upper bound: [Expo SDK reference](https://docs.expo.dev/versions/latest/).
2. **React Native 0.86.3 `engines.node`** is explicitly:

   ```text
   ^20.19.4 || ^22.13.0 || ^24.3.0 || >= 25.0.0
   ```

   Source: [`react-native@0.86.3` package.json via unpkg](https://unpkg.com/react-native@0.86.3/package.json). **Node 26.2.0 satisfies `>= 25.0.0`.**
3. **EAS reference environment for SDK 57** uses **Node.js 22.23.1** (not 26): [EAS Build infrastructure — `ubuntu-26.04-jdk-17-ndk-r27b-sdk-57`](https://docs.expo.dev/build-reference/infrastructure/). Treat Node 22.x as the “known-good” CI/dev default even when local Node 26 is present.
4. **Known Node 26 footgun (closed issue, still instructional):** loading `app.config.ts` **without** installing TypeScript in the project can fail because Node 26 removed `stripTypeScriptTypes` `mode: 'transform'`, and Expo’s fallback path still used it — [expo/expo#48725](https://github.com/expo/expo/issues/48725). Mitigation from maintainers: install the TypeScript version Expo recommends (do not rely on the Node built-in stripper). Prefer `app.config.js`/`app.json`, or ensure `typescript` is installed before using `app.config.ts` on Node 26.
5. Expo’s own toolchain raised the **minimum** Node gate toward `^22.13.0` ([expo/expo#47202](https://github.com/expo/expo/pull/47202)); that PR discussion notes doctor/CLI gates historically emphasize “too old”, while odd/new majors may still be underspecified in warnings — another reason to treat Node 26 as **allowed by RN engines, under-tested by Expo’s reference image**.

**Practical verdict for this machine:** Node **26.2.0 can drive Expo SDK 57 / RN 0.86** for Android builds, provided TypeScript config loading is handled. For “бесшовной” (seamless) day-to-day work and parity with EAS, pin a **Node 22.13+ / 22.23.x** toolchain (e.g. via `nvm`/mise/`engines` + Corepack) even if the host default stays 26.

## Java 17 and Android SDK requirements

| Requirement | Source | Local status |
| --- | --- | --- |
| JDK **17** | [React Native environment setup (Android)](https://reactnative.dev/docs/set-up-your-environment?platform=android) recommends JDK 17; EAS SDK 57 image is Java 17 ([infrastructure](https://docs.expo.dev/build-reference/infrastructure/)) | OpenJDK **17.0.20.1** — OK |
| `compileSdkVersion` / `targetSdkVersion` **36** | [Expo SDK 57 support table](https://docs.expo.dev/versions/latest/) | Platforms **android-36** present — OK |
| Build-tools (RN docs mention **36.0.0** among tools) | [RN Android environment](https://reactnative.dev/docs/set-up-your-environment?platform=android) | **36.0.0** installed — OK |
| NDK **27.1.12297006** | EAS `sdk-57` image ([infrastructure](https://docs.expo.dev/build-reference/infrastructure/)) | Local NDK **27.1.12297006** — exact match |
| `ANDROID_HOME` + `platform-tools` on `PATH` | RN / Expo Android setup | Set to `/home/by/Android/Sdk` |

Expo apps can override Gradle SDK versions via [`expo-build-properties`](https://docs.expo.dev/versions/v57.0.0/sdk/build-properties/) during Prebuild; defaults from the SDK 57 template already target API 36.

## Library compatibility details

### Expo SDK (bare / CNG)

- Latest stable SDK: **57**, React Native **0.86**, React **19.2.3**, min Node **22.13.x** — [Expo SDK reference](https://docs.expo.dev/versions/latest/), [SDK 57 changelog](https://expo.dev/changelog/sdk-57).
- Create a project with native directories:  
  `npx create-expo-app@latest my-app --template bare-minimum`  
  ([create-expo-app templates](https://docs.expo.dev/more/create-expo/): `bare-minimum` runs `npx expo prebuild` and generates `android`/`ios`).
- Terminology: Expo docs redirect “bare vs managed / eject” language to **Continuous Native Generation (CNG)** — [Prebuild / CNG](https://docs.expo.dev/workflow/prebuild/). Keeping generated `android/` committed is optional; CNG regenerates from app config + config plugins. For a classic “bare” checkout, use `bare-minimum` or run `npx expo prebuild` once and own the native tree.
- All Expo SDK packages work in any RN app with `expo` installed; existing RN apps can adopt via `npx install-expo-modules` — [bare overview](https://docs.expo.dev/bare/overview/).

### React Native

- Use the Expo-pinned **0.86.3** (`bundledNativeModules.json` on branch `sdk-57`: [`react-native`: `0.86.3`](https://raw.githubusercontent.com/expo/expo/sdk-57/packages/expo/bundledNativeModules.json)).
- Peer React: **^19.2.3**.
- Install aligned versions with `npx expo install expo@^57.0.0 --fix` / `npx expo install react-native` rather than free-floating npm majors.

### React Native Paper

- **Stable latest:** `react-native-paper@5.15.3` with peers `react`, `react-native`, `react-native-safe-area-context` (`*` on npm).
- **Not recommended for production yet:** `6.0.0-alpha.0` (main branch) adds peers `react-native-reanimated >= 4.3.0` and `react-native-worklets >= 0.8.1` — those versions **are** available in Expo SDK 57 pins (`reanimated` `4.5.1`, `worklets` `0.10.1`), but Paper 6 remains alpha.
- For Expo, install Paper’s native peers with Expo’s resolver, e.g. `npx expo install react-native-safe-area-context react-native-reanimated react-native-worklets` when following Paper 6 docs; for Paper **5.15.x**, `safe-area-context` alone is the hard peer — still install Expo-aligned `~5.7.0`.

### React Navigation (`@react-navigation/native-stack`)

- Current stable line: **v7**. Example: `@react-navigation/native-stack@7.18.10` peers ([package.json](https://unpkg.com/@react-navigation/native-stack@7.18.10/package.json)):
  - `@react-navigation/native`: `^7.3.18`
  - `react`: `>= 18.2.0`
  - `react-native`: `*`
  - `react-native-screens`: `>= 4.0.0`
  - `react-native-safe-area-context`: `>= 4.0.0`
- Official install path: install `@react-navigation/native` + `@react-navigation/native-stack`, then for Expo `npx expo install react-native-screens react-native-safe-area-context` — [React Navigation getting started](https://reactnavigation.org/docs/getting-started), [native stack](https://reactnavigation.org/docs/native-stack-navigator/).
- Expo SDK 57 pins (`screens` `~4.26.0`, `safe-area-context` `~5.7.0`) satisfy these peers.

### `@react-native-async-storage/async-storage`

- Expo documents installation via **`npx expo install @react-native-async-storage/async-storage`** for the SDK-compatible version — [Expo async-storage page (SDK 57)](https://docs.expo.dev/versions/latest/sdk/async-storage/).
- SDK 57 **`bundledNativeModules`** pins **`2.2.0`** ([source](https://raw.githubusercontent.com/expo/expo/sdk-57/packages/expo/bundledNativeModules.json)). Peer on 2.2.0: `react-native` `^0.0.0-0 || >=0.65 <1.0`.
- npm **latest is 3.1.1** (peers `react`/`react-native` `*`). Usable in principle on RN 0.86, but **out of Expo’s compatibility table** — prefer **2.2.0** for seamless Expo doctor / prebuild alignment unless you intentionally leave the Expo-tested set.

## Bare workflow setup nuances (template / Gradle / Metro)

### Template choice

1. **With checked-in native projects:**  
   `npx create-expo-app@latest <name> --template bare-minimum`  
   ([create-expo templates](https://docs.expo.dev/more/create-expo/)).
2. **CNG (recommended long-term):** default/blank template, generate natives with `npx expo prebuild` / `npx expo run:android` as needed ([CNG/Prebuild](https://docs.expo.dev/workflow/prebuild/)).
3. Example with React Navigation (no Expo Router): `npx create-expo-app --example with-react-navigation`.

### Metro

- Customize via `metro.config.js` that **extends `expo/metro-config`** (not a bare `@expo/metro-config` import alone):

  ```js
  const { getDefaultConfig } = require('expo/metro-config');
  const config = getDefaultConfig(__dirname);
  module.exports = config;
  ```

  Generate with `npx expo customize metro.config.js` — [Customizing Metro](https://docs.expo.dev/guides/customizing-metro/).
- From SDK 56+, on-demand filesystem is enabled by default (`experiments.onDemandFilesystem`); symlinked deps outside the project root resolve more reliably.

### Gradle / Android native

- Build locally with **`npx expo run:android`** (Expo CLI) after SDK present — [CNG usage](https://docs.expo.dev/workflow/prebuild/).
- Ensure **`JAVA_HOME` points at JDK 17** (not a newer default JDK); RN warns that higher JDKs may break builds ([RN env setup](https://reactnative.dev/docs/set-up-your-environment?platform=android)).
- SDK 57 templates resolve Android Gradle Plugin / Kotlin via Expo’s version catalog (`expoAutolinking.useExpoVersionCatalog()` pattern in templates) — avoid manually pinning random AGP versions unless using `expo-build-properties`.
- Optional overrides (`compileSdkVersion`, `targetSdkVersion`, `buildToolsVersion`, `kotlinVersion`, …): [`expo-build-properties`](https://docs.expo.dev/versions/v57.0.0/sdk/build-properties/).
- Keep `ANDROID_HOME`/`ANDROID_SDK_ROOT` and `platform-tools` on `PATH`; local tree already matches API 36 + NDK r27b used by EAS SDK 57.

### Dependency installation hygiene

- Prefer **`npx expo install <pkg>`** for anything in `bundledNativeModules` so versions stay inside the SDK 57 matrix.
- Install Paper / Navigation JS packages with npm/yarn as usual, but resolve **native companions** (`screens`, `safe-area-context`, `reanimated`, `gesture-handler`, `async-storage`) through `expo install`.

### Node 26 project checklist (seamless local Android)

1. Use Expo SDK **57** + RN **0.86.3**.
2. Install **TypeScript** at the version Expo/doctor expects if using `app.config.ts`, **or** keep `app.json` / `app.config.js` ([#48725](https://github.com/expo/expo/issues/48725)).
3. Confirm JDK 17 for Gradle (`java -version`).
4. `npx expo prebuild` (or bare-minimum template) → `npx expo run:android`.
5. Optionally add `"engines": { "node": ">=22.13.0" }` and document that **CI/EAS uses Node 22** while local may be 26.

## Risks and open questions

- **Node 26 vs Expo reference Node 22:** engines allow 26 (via RN); Expo docs/EAS do not advertise 26 as the supported daily driver. Expect occasional CLI/config edge cases first.
- **`app.config.ts` + missing `typescript` on Node 26:** historically broken; verify after scaffolding.
- **async-storage 3.x:** newest on npm, but Expo SDK 57 still pins **2.2.0** — staying on 2.2.0 avoids doctor/prebuild skew.
- **React Native Paper 6:** only alpha; stick to **5.15.3** unless prototyping Paper 6 deliberately.
- **npm 12.0.2** with Node 26: not contradicted by Expo/RN docs found in this pass; watch for package-manager-specific install layout issues (prefer npm/pnpm setups as documented for `create-expo-app`).
- This research did **not** run a full `expo run:android` compile on the host; conclusions are from primary version matrices, package `engines`/peers, and local SDK inventory.

## Sources

1. https://docs.expo.dev/versions/latest/ — Expo SDK ↔ RN ↔ Node ↔ Android API tables (SDK 57)  
2. https://expo.dev/changelog/sdk-57 — SDK 57 release notes  
3. https://docs.expo.dev/more/create-expo/ — `bare-minimum` and other templates  
4. https://docs.expo.dev/workflow/prebuild/ — CNG / Prebuild (successor to “bare workflow” framing)  
5. https://docs.expo.dev/bare/overview/ — Expo in existing / native-directory RN apps  
6. https://docs.expo.dev/guides/customizing-metro/ — `expo/metro-config`  
7. https://docs.expo.dev/versions/latest/sdk/async-storage/ — Expo-managed async-storage install  
8. https://docs.expo.dev/versions/v57.0.0/sdk/build-properties/ — Gradle property overrides  
9. https://docs.expo.dev/build-reference/infrastructure/ — EAS SDK 57 image (Node 22.23.1, JDK 17, NDK 27.1.12297006)  
10. https://raw.githubusercontent.com/expo/expo/sdk-57/packages/expo/bundledNativeModules.json — exact Expo pins (RN 0.86.3, async-storage 2.2.0, screens, etc.)  
11. https://unpkg.com/react-native@0.86.3/package.json — Node `engines` including `>= 25.0.0`  
12. https://github.com/expo/expo/issues/48725 — Node 26 + `app.config.ts` / `stripTypeScriptTypes`  
13. https://github.com/expo/expo/pull/47202 — Expo minimum Node raised toward `^22.13.0`  
14. https://reactnative.dev/docs/set-up-your-environment?platform=android — JDK 17, Android SDK/build-tools guidance  
15. https://reactnavigation.org/docs/getting-started — Navigation install + Expo native deps  
16. https://reactnavigation.org/docs/native-stack-navigator/ — native-stack usage  
17. https://unpkg.com/@react-navigation/native-stack@7.18.10/package.json — peerDependencies  
18. npm registry: `react-native-paper@5.15.3` / `6.0.0-alpha.0` peerDependencies (via `npm view`)  
19. Local inventory: Node v26.2.0, OpenJDK 17, Android SDK platforms/build-tools/NDK as listed in the environment header  
