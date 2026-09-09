import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, BackHandler } from 'react-native';
import {
  Appbar,
  TextInput,
  Button,
  Text,
  SegmentedButtons,
  Card,
  HelperText,
  Surface,
  Snackbar,
  useTheme,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { calculateHourlyRate, type IncomePeriod } from '../core/calculator';
import { useIncome } from '../storage/IncomeProvider';
import { digitsOnly, formatGroupedInteger, parseIntegerDigits } from './integerField';
import type { SettingsModalNavigationProp, SettingsModalRouteProp } from './types';

export function SettingsModal() {
  const theme = useTheme();
  const navigation = useNavigation<SettingsModalNavigationProp>();
  const route = useRoute<SettingsModalRouteProp>();
  const { income: currentIncome, period: currentPeriod, saveIncome } = useIncome();
  const isFirstLaunch = Boolean(route.params?.isFirstLaunch);

  const [rawIncome, setRawIncome] = useState(currentIncome > 0 ? String(currentIncome) : '');
  const [period, setPeriod] = useState<IncomePeriod>(currentPeriod || 'month');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [snackVisible, setSnackVisible] = useState(false);

  const income = useMemo(() => parseIntegerDigits(rawIncome), [rawIncome]);

  const previewHourlyRate = useMemo(() => calculateHourlyRate(income, period), [income, period]);

  useEffect(() => {
    if (!isFirstLaunch) {
      return undefined;
    }

    const onBackPress = () => {
      setSnackVisible(true);
      return true;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [isFirstLaunch]);

  const handleSave = async () => {
    if (income <= 0) {
      setErrorMessage('Введите положительную сумму дохода (целое число)');
      return;
    }

    try {
      setIsSaving(true);
      const success = await saveIncome(income, period);
      if (!success) {
        setErrorMessage('Не удалось сохранить доход');
        return;
      }
      navigation.goBack();
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (isFirstLaunch) {
      setSnackVisible(true);
      return;
    }
    navigation.goBack();
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
      edges={['left', 'right', 'bottom']}
    >
      <Appbar.Header mode="center-aligned">
        {!isFirstLaunch && (
          <Appbar.Action icon="close" onPress={handleClose} accessibilityLabel="Закрыть настройки" />
        )}
        <Appbar.Content
          title={isFirstLaunch ? 'Первоначальная настройка' : 'Настройки дохода'}
          titleStyle={{ fontWeight: '700' }}
          testID="settings-title"
        />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {isFirstLaunch && (
          <Surface style={[styles.welcomeBanner, { backgroundColor: theme.colors.primaryContainer }]} elevation={1}>
            <Text variant="titleMedium" style={{ fontWeight: '700', color: theme.colors.onPrimaryContainer }}>
              Добро пожаловать в Price to Life
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onPrimaryContainer, marginTop: 4 }}>
              Укажите ваш доход, чтобы начать переводить цены в рабочее время. Данные остаются только на этом устройстве.
            </Text>
          </Surface>
        )}

        <Text variant="titleMedium" style={styles.sectionTitle}>
          Сумма дохода
        </Text>
        <TextInput
          label="Доход «на руки»"
          value={formatGroupedInteger(rawIncome)}
          onChangeText={(text) => {
            setRawIncome(digitsOnly(text));
            if (errorMessage) setErrorMessage('');
          }}
          keyboardType="number-pad"
          mode="outlined"
          placeholder="150 000"
          error={Boolean(errorMessage)}
          accessibilityLabel="Доход на руки"
          style={styles.input}
        />
        {errorMessage ? (
          <HelperText type="error" visible>
            {errorMessage}
          </HelperText>
        ) : (
          <HelperText type="info" visible>
            Только целое положительное число (без копеек и валюты)
          </HelperText>
        )}

        <Text variant="titleMedium" style={styles.sectionTitle}>
          Период получения
        </Text>
        <SegmentedButtons
          value={period}
          onValueChange={(val) => setPeriod(val as IncomePeriod)}
          density="small"
          buttons={[
            { value: 'hour', label: 'Час' },
            { value: 'day', label: 'День' },
            { value: 'week', label: 'Нед.' },
            { value: 'month', label: 'Месяц' },
            { value: 'year', label: 'Год' },
          ]}
          style={styles.segmentedButtons}
        />

        <Card style={[styles.previewCard, { backgroundColor: theme.colors.elevation.level1 }]} mode="elevated">
          <Card.Content>
            <Text variant="labelMedium" style={{ color: theme.colors.outline }}>
              Расчётная часовая ставка
            </Text>
            <Text variant="headlineMedium" style={{ fontWeight: '800', color: theme.colors.primary, marginTop: 6 }}>
              {income > 0 ? `${Math.round(previewHourlyRate).toLocaleString('ru-RU')} / час` : '—'}
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.outline, marginTop: 4 }}>
              Стандартный график: 8 ч/день, 40 ч/неделю, 2080 ч/год (~173.33 ч/мес).
            </Text>
          </Card.Content>
        </Card>

        <Button
          mode="contained"
          onPress={handleSave}
          loading={isSaving}
          disabled={isSaving || income <= 0}
          contentStyle={styles.btnContent}
          style={styles.saveBtn}
          accessibilityLabel="Сохранить доход"
        >
          Сохранить доход
        </Button>
      </ScrollView>

      <Snackbar visible={snackVisible} onDismiss={() => setSnackVisible(false)} duration={3000}>
        Пожалуйста, укажите доход для продолжения
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  welcomeBanner: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  sectionTitle: {
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    fontSize: 18,
  },
  segmentedButtons: {
    marginVertical: 10,
  },
  previewCard: {
    marginVertical: 16,
    borderRadius: 12,
  },
  saveBtn: {
    marginTop: 10,
    borderRadius: 8,
  },
  btnContent: {
    paddingVertical: 6,
  },
});
