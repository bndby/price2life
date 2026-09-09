import React, { useState, useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import {
  Appbar,
  Card,
  TextInput,
  Text,
  Chip,
  Surface,
  HelperText,
  useTheme,
  Button,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { calculateLifeTime, ConversionResult } from '../core/calculator.ts';
import { ConverterScreenNavigationProp } from './types.ts';
import { PrototypeSwitcher, UIVariant } from './PrototypeSwitcher.tsx';

export interface ConverterScreenProps {
  navigation: ConverterScreenNavigationProp;
  hourlyRate: number;
  isConfigured: boolean;
  initialVariant?: UIVariant;
}

const PRESET_PRICES = [500, 2500, 15000, 80000];

export const ConverterScreen: React.FC<ConverterScreenProps> = ({
  navigation,
  hourlyRate,
  isConfigured,
  initialVariant = 'A',
}) => {
  const theme = useTheme();
  const [variant, setVariant] = useState<UIVariant>(initialVariant);
  const [rawPrice, setRawPrice] = useState<string>('25000');

  const price = useMemo(() => {
    const parsed = parseInt(rawPrice.replace(/\D/g, ''), 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  }, [rawPrice]);

  const conversion: ConversionResult = useMemo(() => {
    return calculateLifeTime(price, hourlyRate);
  }, [price, hourlyRate]);

  const handlePriceChange = (text: string) => {
    const clean = text.replace(/\D/g, '');
    setRawPrice(clean);
  };

  const clearPrice = () => {
    setRawPrice('');
  };

  const openSettings = () => {
    navigation.navigate('Settings');
  };

  // --- RENDER VARIANT A: Hero Card & Large Typography (Material 3 Classic) ---
  const renderVariantA = () => (
    <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
      <Card style={[styles.heroCard, { backgroundColor: theme.colors.elevation.level2 }]} mode="elevated">
        <Card.Content>
          <Text variant="labelMedium" style={{ color: theme.colors.outline, textTransform: 'uppercase' }}>
            Эквивалент рабочего времени
          </Text>
          <Text
            variant="displaySmall"
            style={[styles.heroDisplay, { color: conversion.isValid ? theme.colors.primary : theme.colors.error }]}
          >
            {isConfigured ? conversion.formatted : '—'}
          </Text>
          <View style={styles.badgeRow}>
            <Surface style={[styles.pillBadge, { backgroundColor: theme.colors.primaryContainer }]} elevation={0}>
              <Text variant="labelMedium" style={{ color: theme.colors.onPrimaryContainer, fontWeight: '700' }}>
                {isConfigured ? conversion.formattedTotal : 'Доход не задан'}
              </Text>
            </Surface>
            {isConfigured && (
              <Text variant="bodySmall" style={{ color: theme.colors.outline }}>
                Ставка: {Math.round(hourlyRate).toLocaleString('ru-RU')} / ч
              </Text>
            )}
          </View>
        </Card.Content>
      </Card>

      <View style={styles.inputSection}>
        <TextInput
          label="Цена покупки"
          value={rawPrice}
          onChangeText={handlePriceChange}
          keyboardType="number-pad"
          mode="outlined"
          placeholder="0"
          right={rawPrice ? <TextInput.Icon icon="close-circle" onPress={clearPrice} /> : null}
          style={styles.priceInput}
        />
        <HelperText type={!isConfigured ? 'error' : 'info'} visible={true}>
          {!isConfigured
            ? 'Сначала укажите доход в настройках'
            : 'Введите стоимость товара или услуги (целое число)'}
        </HelperText>

        <Text variant="labelSmall" style={[styles.presetTitle, { color: theme.colors.outline }]}>
          Быстрый выбор цены:
        </Text>
        <View style={styles.chipRow}>
          {PRESET_PRICES.map((preset) => (
            <Chip
              key={preset}
              mode={price === preset ? 'flat' : 'outlined'}
              selected={price === preset}
              onPress={() => setRawPrice(preset.toString())}
              style={styles.chip}
            >
              {preset.toLocaleString('ru-RU')}
            </Chip>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  // --- RENDER VARIANT B: Compact Metric Grid & Analytical Breakdown ---
  const renderVariantB = () => (
    <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
      <Surface style={[styles.elevatedInputBox, { backgroundColor: theme.colors.elevation.level1 }]} elevation={1}>
        <Text variant="titleMedium" style={{ marginBottom: 8, fontWeight: '700' }}>
          Расчет стоимости в часах жизни
        </Text>
        <TextInput
          label="Сумма к оплате"
          value={rawPrice}
          onChangeText={handlePriceChange}
          keyboardType="number-pad"
          mode="outlined"
          placeholder="0"
          right={rawPrice ? <TextInput.Icon icon="close-circle" onPress={clearPrice} /> : null}
        />
        <View style={styles.modifierRow}>
          <Button compact mode="text" onPress={() => setRawPrice(Math.round(price * 0.9).toString())}>
            -10%
          </Button>
          <Button compact mode="text" onPress={() => setRawPrice(Math.round(price * 1.1).toString())}>
            +10%
          </Button>
          <Button compact mode="text" onPress={() => setRawPrice(Math.round(price * 1.5).toString())}>
            +50%
          </Button>
          <Button compact mode="text" onPress={() => setRawPrice((price * 2).toString())}>
            x2
          </Button>
        </View>
      </Surface>

      <Text variant="titleSmall" style={{ marginTop: 16, marginBottom: 8, color: theme.colors.outline }}>
        Детализация рабочего времени:
      </Text>

      <View style={styles.metricGrid}>
        <Surface style={[styles.metricCard, { backgroundColor: theme.colors.elevation.level2 }]} elevation={2}>
          <Text variant="labelSmall" style={{ color: theme.colors.outline }}>ГОДЫ</Text>
          <Text variant="headlineMedium" style={{ fontWeight: '700', color: theme.colors.primary }}>
            {isConfigured ? conversion.years : 0}
          </Text>
        </Surface>

        <Surface style={[styles.metricCard, { backgroundColor: theme.colors.elevation.level2 }]} elevation={2}>
          <Text variant="labelSmall" style={{ color: theme.colors.outline }}>МЕСЯЦЫ</Text>
          <Text variant="headlineMedium" style={{ fontWeight: '700', color: theme.colors.primary }}>
            {isConfigured ? conversion.months : 0}
          </Text>
        </Surface>

        <Surface style={[styles.metricCard, { backgroundColor: theme.colors.elevation.level2 }]} elevation={2}>
          <Text variant="labelSmall" style={{ color: theme.colors.outline }}>ДНИ (8ч)</Text>
          <Text variant="headlineMedium" style={{ fontWeight: '700', color: theme.colors.primary }}>
            {isConfigured ? conversion.days : 0}
          </Text>
        </Surface>

        <Surface style={[styles.metricCard, { backgroundColor: theme.colors.elevation.level2 }]} elevation={2}>
          <Text variant="labelSmall" style={{ color: theme.colors.outline }}>ЧАСЫ</Text>
          <Text variant="headlineMedium" style={{ fontWeight: '700', color: theme.colors.primary }}>
            {isConfigured ? conversion.hours : 0}
          </Text>
        </Surface>
      </View>

      <Surface style={[styles.summaryBanner, { backgroundColor: theme.colors.secondaryContainer }]} elevation={0}>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSecondaryContainer }}>
          Итого: <Text style={{ fontWeight: 'bold' }}>{conversion.formattedTotal}</Text> при ставке{' '}
          <Text style={{ fontWeight: 'bold' }}>{Math.round(hourlyRate)} / час</Text>
        </Text>
      </Surface>
    </ScrollView>
  );

  // --- RENDER VARIANT C: Conversational & Human-Centric Sentence ---
  const renderVariantC = () => (
    <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
      <View style={styles.sentenceContainer}>
        <Text variant="titleLarge" style={{ color: theme.colors.outline, textAlign: 'center' }}>
          Если вещь стоит
        </Text>
        <TextInput
          value={rawPrice}
          onChangeText={handlePriceChange}
          keyboardType="number-pad"
          mode="flat"
          placeholder="0"
          style={styles.hugePriceInput}
          contentStyle={{ textAlign: 'center', fontSize: 36, fontWeight: '800' }}
        />
        <Text variant="titleMedium" style={{ color: theme.colors.outline, textAlign: 'center', marginTop: 12 }}>
          вам придется отдать за неё:
        </Text>

        <Surface style={[styles.statementBox, { backgroundColor: theme.colors.primaryContainer }]} elevation={3}>
          <Text variant="headlineSmall" style={{ color: theme.colors.onPrimaryContainer, textAlign: 'center', fontWeight: '800' }}>
            {isConfigured ? conversion.formatted : 'Настройте доход'}
          </Text>
          {isConfigured && (
            <Text variant="bodyMedium" style={{ color: theme.colors.onPrimaryContainer, textAlign: 'center', marginTop: 6, opacity: 0.8 }}>
              (что эквивалентно {conversion.formattedTotal})
            </Text>
          )}
        </Surface>

        <View style={[styles.chipRow, { justifyContent: 'center', marginTop: 24 }]}>
          {PRESET_PRICES.map((preset) => (
            <Chip
              key={preset}
              compact
              onPress={() => setRawPrice(preset.toString())}
              style={{ marginHorizontal: 4 }}
            >
              {preset.toLocaleString('ru-RU')}
            </Chip>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['top', 'left', 'right']}>
      <Appbar.Header mode="center-aligned">
        <Appbar.Content title="Price to Life" titleStyle={{ fontWeight: '700' }} />
        <Appbar.Action icon="cog" onPress={openSettings} accessibilityLabel="Открыть настройки дохода" />
      </Appbar.Header>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'android' ? undefined : 'padding'}
        style={styles.keyboardView}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.contentWrapper}>
            {variant === 'A' && renderVariantA()}
            {variant === 'B' && renderVariantB()}
            {variant === 'C' && renderVariantC()}
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      <PrototypeSwitcher current={variant} onChange={setVariant} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  contentWrapper: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 90,
  },
  heroCard: {
    borderRadius: 16,
    marginBottom: 20,
    paddingVertical: 8,
  },
  heroDisplay: {
    fontWeight: '800',
    marginVertical: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  pillBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  inputSection: {
    marginBottom: 16,
  },
  priceInput: {
    fontSize: 20,
  },
  presetTitle: {
    marginTop: 12,
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    marginRight: 6,
    marginBottom: 6,
  },
  elevatedInputBox: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  modifierRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  metricCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  summaryBanner: {
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  sentenceContainer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  hugePriceInput: {
    backgroundColor: 'transparent',
    width: '80%',
    alignSelf: 'center',
  },
  statementBox: {
    marginTop: 20,
    padding: 20,
    borderRadius: 16,
    width: '100%',
  },
});
