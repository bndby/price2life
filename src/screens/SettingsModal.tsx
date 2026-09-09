import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  BackHandler,
  Alert,
  Platform,
} from 'react-native';
import {
  Appbar,
  TextInput,
  Button,
  Text,
  SegmentedButtons,
  RadioButton,
  Card,
  HelperText,
  Surface,
  useTheme,
  Divider,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IncomePeriod, calculateHourlyRate } from '../core/calculator.ts';
import { SettingsModalNavigationProp, SettingsModalRouteProp } from './types.ts';
import { PrototypeSwitcher, UIVariant } from './PrototypeSwitcher.tsx';

export interface SettingsModalProps {
  navigation: SettingsModalNavigationProp;
  route: SettingsModalRouteProp;
  currentIncome: number;
  currentPeriod: IncomePeriod;
  onSave: (income: number, period: IncomePeriod) => Promise<boolean>;
  initialVariant?: UIVariant;
}

const PERIOD_LABELS: Record<IncomePeriod, string> = {
  hour: 'В час',
  day: 'В день (8ч)',
  week: 'В неделю (40ч)',
  month: 'В месяц (~173ч)',
  year: 'В год (2 080ч)',
};

export const SettingsModal: React.FC<SettingsModalProps> = ({
  navigation,
  route,
  currentIncome,
  currentPeriod,
  onSave,
  initialVariant = 'A',
}) => {
  const theme = useTheme();
  const isFirstLaunch = Boolean(route.params?.isFirstLaunch);

  const [variant, setVariant] = useState<UIVariant>(initialVariant);
  const [rawIncome, setRawIncome] = useState<string>(
    currentIncome > 0 ? currentIncome.toString() : ''
  );
  const [period, setPeriod] = useState<IncomePeriod>(currentPeriod || 'month');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const income = useMemo(() => {
    const parsed = parseInt(rawIncome.replace(/\D/g, ''), 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  }, [rawIncome]);

  const previewHourlyRate = useMemo(() => {
    return calculateHourlyRate(income, period);
  }, [income, period]);

  // Android Hardware Back button interception on first launch
  useEffect(() => {
    if (!isFirstLaunch) return;

    const onBackPress = () => {
      Alert.alert(
        'Требуется настройка',
        'Пожалуйста, укажите ваш доход и нажмите «Сохранить», чтобы приложение могло рассчитывать стоимость товаров в часах жизни.',
        [{ text: 'Понятно', style: 'default' }]
      );
      return true; // prevent default back navigation
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [isFirstLaunch]);

  const handleIncomeChange = (text: string) => {
    const clean = text.replace(/\D/g, '');
    setRawIncome(clean);
    if (errorMessage) setErrorMessage('');
  };

  const handleSave = async () => {
    if (income <= 0) {
      setErrorMessage('Введите положительную сумму дохода (целое число)');
      return;
    }

    try {
      setIsSaving(true);
      const success = await onSave(income, period);
      if (success) {
        navigation.goBack();
      }
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : 'Ошибка при сохранении настроек');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (isFirstLaunch && income <= 0) {
      Alert.alert(
        'Завершите настройку',
        'Для перехода к калькулятору необходимо сохранить доход.',
        [{ text: 'Продолжить', style: 'default' }]
      );
      return;
    }
    navigation.goBack();
  };

  // --- VARIANT A: SegmentedButtons Horizontal & Preview Surface ---
  const renderVariantA = () => (
    <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
      {isFirstLaunch && (
        <Surface style={[styles.welcomeBanner, { backgroundColor: theme.colors.primaryContainer }]} elevation={1}>
          <Text variant="titleMedium" style={{ fontWeight: '700', color: theme.colors.onPrimaryContainer }}>
            Добро пожаловать в Price to Life!
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onPrimaryContainer, marginTop: 4 }}>
            Укажите вашу зарплату «на руки» (Net), чтобы приложение могло переводить цены в часы вашей работы.
          </Text>
        </Surface>
      )}

      <Text variant="titleMedium" style={styles.sectionTitle}>
        1. Сумма дохода
      </Text>
      <TextInput
        label="Доход «на руки»"
        value={rawIncome}
        onChangeText={handleIncomeChange}
        keyboardType="number-pad"
        mode="outlined"
        placeholder="150000"
        error={Boolean(errorMessage)}
        style={styles.input}
      />
      {errorMessage ? (
        <HelperText type="error" visible={true}>
          {errorMessage}
        </HelperText>
      ) : (
        <HelperText type="info" visible={true}>
          Только целое положительное число (без копеек и валюты)
        </HelperText>
      )}

      <Text variant="titleMedium" style={styles.sectionTitle}>
        2. Период получения
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
            РАСЧЕТНАЯ ЧАСОВАЯ СТАВКА
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
      >
        Сохранить настройки
      </Button>
    </ScrollView>
  );

  // --- VARIANT B: Vertical Radio Group with Explicit Formulas ---
  const renderVariantB = () => (
    <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
      <Card style={styles.groupCard}>
        <Card.Content>
          <Text variant="titleMedium" style={{ fontWeight: '700', marginBottom: 12 }}>
            Параметры заработка
          </Text>
          <TextInput
            label="Зарплата Net"
            value={rawIncome}
            onChangeText={handleIncomeChange}
            keyboardType="number-pad"
            mode="outlined"
            placeholder="0"
          />
          <HelperText type="info" visible={true}>
            Указывайте сумму после вычета налогов
          </HelperText>
        </Card.Content>
      </Card>

      <Text variant="titleSmall" style={{ marginTop: 16, marginBottom: 8, color: theme.colors.outline }}>
        Выберите график начисления:
      </Text>

      <RadioButton.Group onValueChange={(val) => setPeriod(val as IncomePeriod)} value={period}>
        <Surface style={styles.radioSurface} elevation={1}>
          {(['month', 'year', 'week', 'day', 'hour'] as IncomePeriod[]).map((p, idx) => (
            <React.Fragment key={p}>
              {idx > 0 && <Divider />}
              <RadioButton.Item
                label={PERIOD_LABELS[p]}
                value={p}
                mode="android"
                position="leading"
                labelStyle={{ textAlign: 'left', fontWeight: period === p ? '700' : '400' }}
              />
            </React.Fragment>
          ))}
        </Surface>
      </RadioButton.Group>

      <Surface style={[styles.previewCard, { marginTop: 16, backgroundColor: theme.colors.elevation.level2 }]} elevation={2}>
        <Text variant="bodyMedium">
          При доходе {income.toLocaleString('ru-RU')} ({PERIOD_LABELS[period]}) ваша стоимость часа составит{' '}
          <Text style={{ fontWeight: 'bold', color: theme.colors.primary }}>
            {income > 0 ? Math.round(previewHourlyRate) : 0} единиц/час
          </Text>
        </Text>
      </Surface>

      <Button
        mode="contained"
        onPress={handleSave}
        loading={isSaving}
        disabled={isSaving || income <= 0}
        style={[styles.saveBtn, { marginTop: 20 }]}
      >
        Применить и сохранить
      </Button>
    </ScrollView>
  );

  // --- VARIANT C: Minimalist Clean Form ---
  const renderVariantC = () => (
    <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
      <View style={{ alignItems: 'center', marginVertical: 16 }}>
        <Text variant="headlineSmall" style={{ fontWeight: '800', textAlign: 'center' }}>
          Сколько вы зарабатываете?
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.outline, textAlign: 'center', marginTop: 4 }}>
          Эти данные хранятся только локально на вашем смартфоне.
        </Text>
      </View>

      <TextInput
        label="Сумма"
        value={rawIncome}
        onChangeText={handleIncomeChange}
        keyboardType="number-pad"
        mode="outlined"
        placeholder="0"
        style={styles.input}
      />

      <SegmentedButtons
        value={period}
        onValueChange={(val) => setPeriod(val as IncomePeriod)}
        buttons={[
          { value: 'hour', label: 'Час' },
          { value: 'day', label: 'День' },
          { value: 'week', label: 'Неделя' },
          { value: 'month', label: 'Месяц' },
          { value: 'year', label: 'Год' },
        ]}
        style={{ marginVertical: 16 }}
      />

      <Button
        mode="contained-tonal"
        onPress={handleSave}
        loading={isSaving}
        disabled={isSaving || income <= 0}
        contentStyle={{ paddingVertical: 8 }}
      >
        Готово ({income > 0 ? `~${Math.round(previewHourlyRate)}/ч` : 'введите сумму'})
      </Button>
    </ScrollView>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['top', 'left', 'right', 'bottom']}>
      <Appbar.Header mode="center-aligned">
        {!isFirstLaunch && (
          <Appbar.Action icon="close" onPress={handleClose} accessibilityLabel="Закрыть настройки" />
        )}
        <Appbar.Content
          title={isFirstLaunch ? 'Первоначальная настройка' : 'Настройки дохода'}
          titleStyle={{ fontWeight: '700' }}
        />
        <Appbar.Action
          icon="check"
          onPress={handleSave}
          disabled={income <= 0 || isSaving}
          accessibilityLabel="Сохранить настройки"
        />
      </Appbar.Header>

      <View style={styles.contentWrapper}>
        {variant === 'A' && renderVariantA()}
        {variant === 'B' && renderVariantB()}
        {variant === 'C' && renderVariantC()}
      </View>

      <PrototypeSwitcher current={variant} onChange={setVariant} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  contentWrapper: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 90,
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
    padding: 16,
  },
  saveBtn: {
    marginTop: 10,
    borderRadius: 8,
  },
  btnContent: {
    paddingVertical: 6,
  },
  groupCard: {
    borderRadius: 12,
  },
  radioSurface: {
    borderRadius: 12,
    overflow: 'hidden',
  },
});
