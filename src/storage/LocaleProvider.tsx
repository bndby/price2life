import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { getLocales } from 'expo-localization';
import i18n from '../i18n/i18n';
import {
  type AppLocale,
  numberLocaleFor,
  readDeviceLanguageTags,
  resolveAppLocaleFromDevice,
  resolveEffectiveAppLocale,
} from '../i18n/locales';
import type { LocaleStorageService } from './localeStorage';

export type DeviceLanguageTagsFn = () => readonly string[];

export function readDeviceLanguageTagsFromExpo(): string[] {
  return readDeviceLanguageTags(getLocales());
}

export interface LocaleContextState {
  readonly isLoading: boolean;
  readonly preference: AppLocale | null;
  readonly resolved: AppLocale;
  readonly deviceResolved: AppLocale;
  readonly numberLocale: string;
  selectLocale(locale: AppLocale): Promise<void>;
  followDevice(): Promise<void>;
}

const LocaleContext = createContext<LocaleContextState | null>(null);

export function useAppLocale(): LocaleContextState {
  const value = useContext(LocaleContext);
  if (!value) {
    throw new Error('useAppLocale must be used within LocaleProvider');
  }
  return value;
}

export function LocaleProvider({
  children,
  service,
  getDeviceLanguageTags,
}: {
  children: React.ReactNode;
  service: LocaleStorageService;
  getDeviceLanguageTags: DeviceLanguageTagsFn;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [preference, setPreference] = useState<AppLocale | null>(null);
  const [deviceTags, setDeviceTags] = useState<readonly string[]>(() => [...getDeviceLanguageTags()]);
  const preferenceRef = useRef(preference);
  preferenceRef.current = preference;
  const getTagsRef = useRef(getDeviceLanguageTags);
  getTagsRef.current = getDeviceLanguageTags;

  useEffect(() => {
    let cancelled = false;
    service.getPreference().then(async (loaded) => {
      if (cancelled) {
        return;
      }
      const tags = [...getTagsRef.current()];
      await i18n.changeLanguage(resolveEffectiveAppLocale(loaded, tags));
      if (cancelled) {
        return;
      }
      setDeviceTags(tags);
      setPreference(loaded);
      setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [service]);

  useEffect(() => {
    let cancelled = false;
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') {
        return;
      }
      if (preferenceRef.current !== null) {
        return;
      }
      const tags = [...getTagsRef.current()];
      void i18n.changeLanguage(resolveAppLocaleFromDevice(tags)).then(() => {
        if (!cancelled) {
          setDeviceTags(tags);
        }
      });
    });
    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, []);

  const selectLocale = useCallback(
    async (locale: AppLocale) => {
      await service.savePreference(locale);
      await i18n.changeLanguage(locale);
      setPreference(locale);
    },
    [service],
  );

  const followDevice = useCallback(async () => {
    await service.clearPreference();
    const tags = [...getTagsRef.current()];
    await i18n.changeLanguage(resolveAppLocaleFromDevice(tags));
    setPreference(null);
    setDeviceTags(tags);
  }, [service]);

  const deviceResolved = resolveAppLocaleFromDevice(deviceTags);
  const resolved = resolveEffectiveAppLocale(preference, deviceTags);

  const value = useMemo<LocaleContextState>(
    () => ({
      isLoading,
      preference,
      resolved,
      deviceResolved,
      numberLocale: numberLocaleFor(resolved),
      selectLocale,
      followDevice,
    }),
    [isLoading, preference, resolved, deviceResolved, selectLocale, followDevice],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}
