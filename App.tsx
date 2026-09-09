import React, { useMemo } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { PaperProvider, useTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { RootNavigator } from './src/navigation/RootNavigator';
import { IncomeProvider, useIncome } from './src/storage/IncomeProvider';
import { IncomeStorageService } from './src/storage/incomeStorage';
import { PersonProvider, usePerson, type Clock } from './src/storage/PersonProvider';
import { PersonStorageService } from './src/storage/personStorage';
import { createAsyncStorageDriver } from './src/storage/asyncStorageDriver';
import {
  LocaleProvider,
  readDeviceLanguageTagsFromExpo,
  useAppLocale,
  type DeviceLanguageTagsFn,
} from './src/storage/LocaleProvider';
import { LocaleStorageService } from './src/storage/localeStorage';
import type { RootStackParamList } from './src/screens/types';
import './src/i18n/i18n';

function LoadingScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.background,
      }}
      accessibilityLabel={t('loading')}
    >
      <ActivityIndicator size="large" color={theme.colors.primary} />
    </View>
  );
}

function AppShell() {
  const { isLoading, isConfigured } = useIncome();
  const { isLoading: isPersonLoading } = usePerson();
  const { isLoading: isLocaleLoading } = useAppLocale();
  const navigationRef = useNavigationContainerRef<RootStackParamList>();

  if (isLoading || isPersonLoading || isLocaleLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        if (!isConfigured) {
          navigationRef.navigate('Settings', { isFirstLaunch: true });
        }
      }}
    >
      <StatusBar style="auto" />
      <RootNavigator />
    </NavigationContainer>
  );
}

export default function App({
  service,
  personService,
  localeService,
  getDeviceLanguageTags,
  now,
}: {
  service?: IncomeStorageService;
  personService?: PersonStorageService;
  localeService?: LocaleStorageService;
  getDeviceLanguageTags?: DeviceLanguageTagsFn;
  now?: Clock;
}) {
  const resolvedService = useMemo(
    () => service ?? new IncomeStorageService(createAsyncStorageDriver()),
    [service],
  );
  const resolvedPersonService = useMemo(
    () => personService ?? new PersonStorageService(createAsyncStorageDriver()),
    [personService],
  );
  const resolvedLocaleService = useMemo(
    () => localeService ?? new LocaleStorageService(createAsyncStorageDriver()),
    [localeService],
  );
  const resolvedGetDeviceLanguageTags = useMemo(
    () => getDeviceLanguageTags ?? readDeviceLanguageTagsFromExpo,
    [getDeviceLanguageTags],
  );
  const resolvedNow = useMemo(() => now ?? (() => new Date()), [now]);

  return (
    <PaperProvider>
      <SafeAreaProvider>
        <IncomeProvider service={resolvedService}>
          <PersonProvider service={resolvedPersonService} now={resolvedNow}>
            <LocaleProvider
              service={resolvedLocaleService}
              getDeviceLanguageTags={resolvedGetDeviceLanguageTags}
            >
              <AppShell />
            </LocaleProvider>
          </PersonProvider>
        </IncomeProvider>
      </SafeAreaProvider>
    </PaperProvider>
  );
}
