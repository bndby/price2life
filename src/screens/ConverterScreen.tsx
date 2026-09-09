import React, { useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable, Keyboard } from 'react-native';
import {
  Appbar,
  Card,
  TextInput,
  Text,
  Surface,
  HelperText,
  useTheme,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { calculateLifeTime } from '../core/calculator';
import { formatLifeShare, lifeSharePercent } from '../core/lifeShare';
import { useIncome } from '../storage/IncomeProvider';
import { usePerson } from '../storage/PersonProvider';
import { useAppLocale } from '../storage/LocaleProvider';
import { digitsOnly, formatGroupedInteger, parseIntegerDigits } from './integerField';
import type { ConverterScreenNavigationProp } from './types';

export function ConverterScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<ConverterScreenNavigationProp>();
  const { hourlyRate, isConfigured } = useIncome();
  const { remainingLifeYears } = usePerson();
  const { numberLocale } = useAppLocale();
  const [rawPrice, setRawPrice] = useState('');

  const price = useMemo(() => parseIntegerDigits(rawPrice), [rawPrice]);
  const conversion = useMemo(
    () => calculateLifeTime(price, hourlyRate),
    [price, hourlyRate, numberLocale],
  );
  const lifeShareText = useMemo(() => {
    if (!isConfigured || remainingLifeYears === null) {
      return null;
    }
    return formatLifeShare(lifeSharePercent(conversion.totalWorkingHours, remainingLifeYears));
  }, [isConfigured, remainingLifeYears, conversion.totalWorkingHours, numberLocale]);

  const resultText = isConfigured ? conversion.formatted : '—';
  const totalText = isConfigured ? conversion.formattedTotal : t('converter.incomeNotSet');

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
      edges={['left', 'right', 'bottom']}
    >
      <Appbar.Header mode="center-aligned">
        <Appbar.Content title={t('brand')} titleStyle={{ fontWeight: '700' }} testID="converter-title" />
        <Appbar.Action
          icon="cog"
          onPress={() => navigation.navigate('Settings', isConfigured ? undefined : { isFirstLaunch: true })}
          accessibilityLabel={t('converter.openSettings')}
        />
      </Appbar.Header>

      <Pressable style={styles.contentWrapper} onPress={Keyboard.dismiss} accessible={false}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Card style={[styles.heroCard, { backgroundColor: theme.colors.elevation.level2 }]} mode="elevated">
            <Card.Content>
              <Text variant="labelMedium" style={{ color: theme.colors.outline, textTransform: 'uppercase' }}>
                {t('converter.lifeTimeEquivalent')}
              </Text>
              <Text
                variant="headlineLarge"
                style={[styles.heroDisplay, { color: conversion.isValid ? theme.colors.primary : theme.colors.error }]}
                accessibilityLabel={t('converter.lifeTimeEquivalentA11y', { value: resultText })}
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
              </View>
              {lifeShareText ? (
                <View style={[styles.badgeRow, styles.lifeShareRow]}>
                  <Surface
                    style={[styles.pillBadge, { backgroundColor: theme.colors.secondaryContainer }]}
                    elevation={0}
                  >
                    <Text
                      variant="labelMedium"
                      style={{ color: theme.colors.onSecondaryContainer, fontWeight: '700' }}
                      testID="life-share"
                    >
                      {lifeShareText}
                    </Text>
                  </Surface>
                </View>
              ) : null}
            </Card.Content>
          </Card>

          <View style={styles.inputSection}>
            <TextInput
              label={t('converter.itemPrice')}
              value={formatGroupedInteger(rawPrice, numberLocale)}
              onChangeText={(text) => setRawPrice(digitsOnly(text))}
              keyboardType="number-pad"
              mode="outlined"
              placeholder="0"
              accessibilityLabel={t('converter.itemPrice')}
              right={
                rawPrice ? (
                  <TextInput.Icon
                    icon="close-circle"
                    onPress={() => setRawPrice('')}
                    accessibilityLabel={t('converter.clearPrice')}
                  />
                ) : null
              }
              style={styles.priceInput}
            />
            <HelperText type={!isConfigured ? 'error' : 'info'} visible>
              {!isConfigured ? t('converter.setIncomeFirst') : t('converter.enterItemPrice')}
            </HelperText>
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
  lifeShareRow: {
    marginTop: 8,
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
});
