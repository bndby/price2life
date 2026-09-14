import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  BackHandler,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Platform,
} from 'react-native';
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
  RadioButton,
  Dialog,
  Portal,
  useTheme,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { calculateHourlyRate, type IncomePeriod } from '../core/calculator';
import {
  isFutureDate,
  isValidCalendarDate,
  remainingLifeYears,
  type Sex,
} from '../core/remainingLife';
import {
  APP_LOCALE_ENDONYMS,
  PICKER_LOCALE_ORDER,
  isAppLocale,
  type AppLocale,
} from '../i18n/locales';
import { useIncome } from '../storage/IncomeProvider';
import { usePerson } from '../storage/PersonProvider';
import { useAppLocale } from '../storage/LocaleProvider';
import { PRIVACY_POLICY_URL } from '../legal/privacyPolicy';
import { digitsOnly, formatGroupedInteger, parseIntegerDigits } from './integerField';
import type { SettingsModalNavigationProp, SettingsModalRouteProp } from './types';

const INCOME_PERIODS: readonly IncomePeriod[] = ['hour', 'day', 'week', 'month', 'year'];

const PERIOD_LABEL_KEYS = {
  hour: 'settings.periodHour',
  day: 'settings.periodDay',
  week: 'settings.periodWeek',
  month: 'settings.periodMonth',
  year: 'settings.periodYear',
} as const;

function isIncomePeriod(value: string): value is IncomePeriod {
  return (INCOME_PERIODS as readonly string[]).includes(value);
}

export function SettingsModal() {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<SettingsModalNavigationProp>();
  const route = useRoute<SettingsModalRouteProp>();
  const { income: currentIncome, period: currentPeriod, saveIncome } = useIncome();
  const {
    dateOfBirth: savedDateOfBirth,
    sex: savedSex,
    savePerson,
    clearPerson,
    today,
  } = usePerson();
  const { preference, deviceResolved, numberLocale, selectLocale, followDevice } = useAppLocale();
  const isFirstLaunch = Boolean(route.params?.isFirstLaunch);

  const [rawIncome, setRawIncome] = useState(currentIncome > 0 ? String(currentIncome) : '');
  const [period, setPeriod] = useState<IncomePeriod>(currentPeriod || 'month');
  const [rawDay, setRawDay] = useState(savedDateOfBirth ? String(savedDateOfBirth.day) : '');
  const [rawMonth, setRawMonth] = useState(savedDateOfBirth ? String(savedDateOfBirth.month) : '');
  const [rawYear, setRawYear] = useState(savedDateOfBirth ? String(savedDateOfBirth.year) : '');
  const [sex, setSex] = useState<Sex | null>(savedSex);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [snackVisible, setSnackVisible] = useState(false);
  const [languageDialogVisible, setLanguageDialogVisible] = useState(false);
  const [periodDialogVisible, setPeriodDialogVisible] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const dobOffsetY = useRef(0);
  const dobFocused = useRef(false);

  const income = useMemo(() => parseIntegerDigits(rawIncome), [rawIncome]);

  const previewHourlyRate = useMemo(() => calculateHourlyRate(income, period), [income, period]);

  const filledDobCount = [rawDay, rawMonth, rawYear].filter((part) => part.length > 0).length;
  const draftDateOfBirth =
    filledDobCount === 3
      ? {
          day: parseIntegerDigits(rawDay),
          month: parseIntegerDigits(rawMonth),
          year: parseIntegerDigits(rawYear),
        }
      : null;
  const previewRemainingLife =
    draftDateOfBirth &&
    sex &&
    isValidCalendarDate(draftDateOfBirth) &&
    !isFutureDate(draftDateOfBirth, today)
      ? remainingLifeYears(draftDateOfBirth, sex, today)
      : null;

  useEffect(() => {
    if (!isFirstLaunch) {
      return undefined;
    }

    const onBackPress = () => {
      if (languageDialogVisible) {
        setLanguageDialogVisible(false);
        return true;
      }
      if (periodDialogVisible) {
        setPeriodDialogVisible(false);
        return true;
      }
      setSnackVisible(true);
      return true;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [isFirstLaunch, languageDialogVisible, periodDialogVisible]);

  const scrollDateOfBirthIntoView = useCallback(() => {
    scrollRef.current?.scrollTo({
      y: Math.max(0, dobOffsetY.current - 16),
      animated: true,
    });
  }, []);

  useEffect(() => {
    const shown = Keyboard.addListener('keyboardDidShow', () => {
      if (dobFocused.current) {
        scrollDateOfBirthIntoView();
      }
    });
    return () => shown.remove();
  }, [scrollDateOfBirthIntoView]);

  const handleDobFocus = () => {
    dobFocused.current = true;
    scrollDateOfBirthIntoView();
  };

  const handleDobBlur = () => {
    dobFocused.current = false;
  };

  const handleSave = async () => {
    if (income <= 0) {
      setErrorMessage(t('settings.enterPositiveIncome'));
      return;
    }

    if (filledDobCount > 0 && filledDobCount < 3) {
      setErrorMessage(t('settings.incompletePerson'));
      return;
    }

    if (draftDateOfBirth) {
      if (!isValidCalendarDate(draftDateOfBirth)) {
        setErrorMessage(t('settings.invalidDateOfBirth'));
        return;
      }
      if (isFutureDate(draftDateOfBirth, today)) {
        setErrorMessage(t('settings.futureDateOfBirth'));
        return;
      }
      if (!sex) {
        setErrorMessage(t('settings.incompletePerson'));
        return;
      }
    }

    try {
      setIsSaving(true);
      const success = await saveIncome(income, period);
      if (!success) {
        setErrorMessage(t('settings.saveFailed'));
        return;
      }
      if (draftDateOfBirth && sex) {
        const personSaved = await savePerson(draftDateOfBirth, sex);
        if (!personSaved) {
          setErrorMessage(t('settings.saveFailed'));
          return;
        }
      } else {
        await clearPerson();
      }
      navigation.goBack();
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    if (isFirstLaunch) {
      setSnackVisible(true);
      return;
    }
    navigation.goBack();
  };

  const languageValue = preference ?? 'system';
  const systemLabel = t('settings.systemLanguageWithResolved', {
    system: t('settings.systemLanguage'),
    resolved: APP_LOCALE_ENDONYMS[deviceResolved],
  });
  const selectedLanguageLabel =
    preference === null ? systemLabel : APP_LOCALE_ENDONYMS[preference];

  const handleLanguageChange = (value: string) => {
    if (value === 'system') {
      void followDevice();
    } else if (isAppLocale(value)) {
      void selectLocale(value);
    }
    setLanguageDialogVisible(false);
  };

  const periodLabel = t(PERIOD_LABEL_KEYS[period]);

  const handlePeriodChange = (value: string) => {
    if (isIncomePeriod(value)) {
      setPeriod(value);
    }
    setPeriodDialogVisible(false);
  };

  const openPeriodDialog = () => {
    Keyboard.dismiss();
    setPeriodDialogVisible(true);
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
      edges={['left', 'right', 'bottom']}
    >
      <Appbar.Header mode="center-aligned">
        {!isFirstLaunch && (
          <Appbar.BackAction onPress={handleBack} accessibilityLabel={t('settings.back')} />
        )}
        <Appbar.Content
          title={isFirstLaunch ? t('settings.firstLaunchTitle') : t('settings.incomeTitle')}
          titleStyle={{ fontWeight: '700' }}
          testID="settings-title"
        />
      </Appbar.Header>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.flex} onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView
            ref={scrollRef}
            style={styles.flex}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
        {isFirstLaunch && (
          <Surface style={[styles.welcomeBanner, { backgroundColor: theme.colors.primaryContainer }]} elevation={1}>
            <Text
              variant="titleMedium"
              style={{ fontWeight: '700', color: theme.colors.onPrimaryContainer }}
              accessibilityLabel={t('settings.welcomeTitleA11y')}
            >
              {t('settings.welcomeTitle')}
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onPrimaryContainer, marginTop: 4 }}>
              {t('settings.welcomeBody')}
            </Text>
          </Surface>
        )}

        <Pressable
          onPress={() => setLanguageDialogVisible(true)}
          accessibilityRole="button"
          accessibilityLabel={selectedLanguageLabel}
          testID="settings-language-field"
          style={styles.languageField}
        >
          <View pointerEvents="none">
            <TextInput
              mode="outlined"
              label={t('settings.language')}
              value={selectedLanguageLabel}
              editable={false}
              right={<TextInput.Icon icon="menu-down" />}
              style={styles.input}
            />
          </View>
        </Pressable>

        <View style={styles.incomeRow}>
          <TextInput
            label={t('settings.netIncome')}
            value={formatGroupedInteger(rawIncome, numberLocale)}
            onChangeText={(text) => {
              setRawIncome(digitsOnly(text));
              if (errorMessage) setErrorMessage('');
            }}
            keyboardType="number-pad"
            mode="outlined"
            error={Boolean(errorMessage)}
            accessibilityLabel={t('settings.netIncomeA11y')}
            style={[styles.input, styles.incomeField]}
          />
          <Pressable
            onPress={openPeriodDialog}
            accessibilityRole="button"
            accessibilityLabel={t('settings.periodA11y', { value: periodLabel })}
            testID="settings-period-field"
            style={styles.periodField}
          >
            <View pointerEvents="none">
              <TextInput
                mode="outlined"
                label={t('settings.period')}
                value={periodLabel}
                editable={false}
                right={<TextInput.Icon icon="menu-down" />}
                style={styles.input}
              />
            </View>
          </Pressable>
        </View>
        {errorMessage ? (
          <HelperText type="error" visible>
            {errorMessage}
          </HelperText>
        ) : (
          <HelperText type="info" visible>
            {t('settings.incomeHint')}
          </HelperText>
        )}

        <Card style={[styles.previewCard, { backgroundColor: theme.colors.elevation.level1 }]} mode="elevated">
          <Card.Content>
            <Text variant="labelMedium" style={{ color: theme.colors.outline }}>
              {t('settings.hourlyRate')}
            </Text>
            <Text variant="headlineMedium" style={{ fontWeight: '800', color: theme.colors.primary, marginTop: 6 }}>
              {income > 0
                ? t('settings.perHour', { rate: Math.round(previewHourlyRate).toLocaleString(numberLocale) })
                : '—'}
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.outline, marginTop: 4 }}>
              {t('settings.workSchedule')}
            </Text>
          </Card.Content>
        </Card>

        <View
          onLayout={(event) => {
            dobOffsetY.current = event.nativeEvent.layout.y;
          }}
        >
          <Text variant="titleMedium" style={styles.sectionTitle}>
            {t('settings.dateOfBirth')}
          </Text>
          <View style={styles.dobRow}>
            <TextInput
              label={t('settings.dobDay')}
              value={rawDay}
              onChangeText={(text) => {
                setRawDay(digitsOnly(text).slice(0, 2));
                if (errorMessage) setErrorMessage('');
              }}
              onFocus={handleDobFocus}
              onBlur={handleDobBlur}
              keyboardType="number-pad"
              mode="outlined"
              accessibilityLabel={t('settings.dobDay')}
              style={[styles.input, styles.dobField]}
              testID="settings-dob-day"
            />
            <TextInput
              label={t('settings.dobMonth')}
              value={rawMonth}
              onChangeText={(text) => {
                setRawMonth(digitsOnly(text).slice(0, 2));
                if (errorMessage) setErrorMessage('');
              }}
              onFocus={handleDobFocus}
              onBlur={handleDobBlur}
              keyboardType="number-pad"
              mode="outlined"
              accessibilityLabel={t('settings.dobMonth')}
              style={[styles.input, styles.dobField]}
              testID="settings-dob-month"
            />
            <TextInput
              label={t('settings.dobYear')}
              value={rawYear}
              onChangeText={(text) => {
                setRawYear(digitsOnly(text).slice(0, 4));
                if (errorMessage) setErrorMessage('');
              }}
              onFocus={handleDobFocus}
              onBlur={handleDobBlur}
              keyboardType="number-pad"
              mode="outlined"
              accessibilityLabel={t('settings.dobYear')}
              style={[styles.input, styles.dobYearField]}
              testID="settings-dob-year"
            />
          </View>
        </View>

        <Text variant="titleMedium" style={styles.sectionTitle}>
          {t('settings.sex')}
        </Text>
        <SegmentedButtons
          value={sex ?? ''}
          onValueChange={(val) => {
            setSex(val === 'male' || val === 'female' ? val : null);
            if (errorMessage) setErrorMessage('');
          }}
          density="small"
          buttons={[
            { value: 'male', label: t('settings.sexMale'), testID: 'settings-sex-male' },
            { value: 'female', label: t('settings.sexFemale'), testID: 'settings-sex-female' },
          ]}
          style={styles.segmentedButtons}
        />

        {previewRemainingLife !== null ? (
          <Card style={[styles.previewCard, { backgroundColor: theme.colors.elevation.level1 }]} mode="elevated">
            <Card.Content>
              <Text
                variant="labelMedium"
                style={{ color: theme.colors.outline }}
                testID="remaining-life-preview"
              >
                {t('settings.remainingLifePreview', { count: Math.round(previewRemainingLife) })}
              </Text>
            </Card.Content>
          </Card>
        ) : null}

        <Button
          mode="contained"
          onPress={handleSave}
          loading={isSaving}
          disabled={isSaving || income <= 0}
          contentStyle={styles.btnContent}
          style={styles.saveBtn}
          accessibilityLabel={t('settings.saveIncome')}
        >
          {t('settings.saveIncome')}
        </Button>
        <Button
          mode="text"
          onPress={() => {
            void Linking.openURL(PRIVACY_POLICY_URL);
          }}
          accessibilityLabel={t('settings.privacyPolicy')}
          testID="settings-privacy-policy"
          style={styles.privacyBtn}
        >
          {t('settings.privacyPolicy')}
        </Button>
          </ScrollView>
        </Pressable>
      </KeyboardAvoidingView>

      <Portal>
        <Dialog visible={languageDialogVisible} onDismiss={() => setLanguageDialogVisible(false)}>
          <Dialog.Title>{t('settings.language')}</Dialog.Title>
          <Dialog.Content>
            <RadioButton.Group value={languageValue} onValueChange={handleLanguageChange}>
              <RadioButton.Item
                label={systemLabel}
                value="system"
                position="leading"
                accessibilityLabel={systemLabel}
                testID="settings-language-system"
              />
              {PICKER_LOCALE_ORDER.map((locale: AppLocale) => (
                <RadioButton.Item
                  key={locale}
                  label={APP_LOCALE_ENDONYMS[locale]}
                  value={locale}
                  position="leading"
                  accessibilityLabel={APP_LOCALE_ENDONYMS[locale]}
                  testID={`settings-language-${locale}`}
                />
              ))}
            </RadioButton.Group>
          </Dialog.Content>
        </Dialog>
        <Dialog visible={periodDialogVisible} onDismiss={() => setPeriodDialogVisible(false)}>
          <Dialog.Title>{t('settings.period')}</Dialog.Title>
          <Dialog.Content>
            <RadioButton.Group value={period} onValueChange={handlePeriodChange}>
              {INCOME_PERIODS.map((value) => (
                <RadioButton.Item
                  key={value}
                  label={t(PERIOD_LABEL_KEYS[value])}
                  value={value}
                  position="leading"
                  accessibilityLabel={t(PERIOD_LABEL_KEYS[value])}
                  testID={`settings-period-${value}`}
                />
              ))}
            </RadioButton.Group>
          </Dialog.Content>
        </Dialog>
      </Portal>

      <Snackbar visible={snackVisible} onDismiss={() => setSnackVisible(false)} duration={3000}>
        {t('settings.needIncomeToContinue')}
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  flex: {
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
  languageField: {
    marginBottom: 4,
  },
  incomeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  incomeField: {
    flex: 3,
  },
  periodField: {
    flex: 2,
  },
  sectionTitle: {
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    fontSize: 18,
  },
  dobRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dobField: {
    flex: 1,
  },
  dobYearField: {
    flex: 1.4,
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
  privacyBtn: {
    marginTop: 8,
  },
  btnContent: {
    paddingVertical: 6,
  },
});
