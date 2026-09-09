import React, { useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable, Keyboard } from 'react-native';
import {
  Appbar,
  Card,
  TextInput,
  Text,
  Chip,
  Surface,
  HelperText,
  useTheme,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { calculateLifeTime } from '../core/calculator';
import { useIncome } from '../storage/IncomeProvider';
import { digitsOnly, formatGroupedInteger, parseIntegerDigits } from './integerField';
import type { ConverterScreenNavigationProp } from './types';

const PRESET_PRICES = [500, 2500, 15000, 80000];

export function ConverterScreen() {
  const theme = useTheme();
  const navigation = useNavigation<ConverterScreenNavigationProp>();
  const { hourlyRate, isConfigured } = useIncome();
  const [rawPrice, setRawPrice] = useState('');

  const price = useMemo(() => parseIntegerDigits(rawPrice), [rawPrice]);
  const conversion = useMemo(() => calculateLifeTime(price, hourlyRate), [price, hourlyRate]);

  const resultText = isConfigured ? conversion.formatted : '—';
  const totalText = isConfigured ? conversion.formattedTotal : 'Доход не задан';

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
      edges={['left', 'right', 'bottom']}
    >
      <Appbar.Header mode="center-aligned">
        <Appbar.Content title="Price to Life" titleStyle={{ fontWeight: '700' }} testID="converter-title" />
        <Appbar.Action
          icon="cog"
          onPress={() => navigation.navigate('Settings', isConfigured ? undefined : { isFirstLaunch: true })}
          accessibilityLabel="Открыть настройки"
        />
      </Appbar.Header>

      <Pressable style={styles.contentWrapper} onPress={Keyboard.dismiss} accessible={false}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Card style={[styles.heroCard, { backgroundColor: theme.colors.elevation.level2 }]} mode="elevated">
            <Card.Content>
              <Text variant="labelMedium" style={{ color: theme.colors.outline, textTransform: 'uppercase' }}>
                Эквивалент рабочего времени
              </Text>
              <Text
                variant="headlineLarge"
                style={[styles.heroDisplay, { color: conversion.isValid ? theme.colors.primary : theme.colors.error }]}
                accessibilityLabel={`Эквивалент ${resultText}`}
                testID="life-time-equivalent"
              >
                {resultText}
              </Text>
              <View style={styles.badgeRow}>
                <Surface style={[styles.pillBadge, { backgroundColor: theme.colors.primaryContainer }]} elevation={0}>
                  <Text variant="labelMedium" style={{ color: theme.colors.onPrimaryContainer, fontWeight: '700' }}>
                    {totalText}
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
              value={formatGroupedInteger(rawPrice)}
              onChangeText={(text) => setRawPrice(digitsOnly(text))}
              keyboardType="number-pad"
              mode="outlined"
              placeholder="0"
              accessibilityLabel="Цена покупки"
              right={rawPrice ? <TextInput.Icon icon="close-circle" onPress={() => setRawPrice('')} accessibilityLabel="Очистить цену" /> : null}
              style={styles.priceInput}
            />
            <HelperText type={!isConfigured ? 'error' : 'info'} visible>
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
                  onPress={() => setRawPrice(String(preset))}
                  style={styles.chip}
                  accessibilityLabel={`Цена ${preset.toLocaleString('ru-RU')}`}
                >
                  {preset.toLocaleString('ru-RU')}
                </Chip>
              ))}
            </View>
          </View>
        </ScrollView>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  contentWrapper: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
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
});
