import React, { useMemo } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { PaperProvider, useTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { RootNavigator } from './src/navigation/RootNavigator';
import { IncomeProvider, useIncome } from './src/storage/IncomeProvider';
import { IncomeStorageService } from './src/storage/incomeStorage';
import { createAsyncStorageDriver } from './src/storage/asyncStorageDriver';
import type { RootStackParamList } from './src/screens/types';

function LoadingScreen() {
  const theme = useTheme();
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.background,
      }}
      accessibilityLabel="Загрузка"
    >
      <ActivityIndicator size="large" color={theme.colors.primary} />
    </View>
  );
}

function AppShell() {
  const { isLoading, isConfigured } = useIncome();
  const navigationRef = useNavigationContainerRef<RootStackParamList>();

  if (isLoading) {
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

export default function App({ service }: { service?: IncomeStorageService }) {
  const resolvedService = useMemo(
    () => service ?? new IncomeStorageService(createAsyncStorageDriver()),
    [service],
  );

  return (
    <PaperProvider>
      <SafeAreaProvider>
        <IncomeProvider service={resolvedService}>
          <AppShell />
        </IncomeProvider>
      </SafeAreaProvider>
    </PaperProvider>
  );
}
