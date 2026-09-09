import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Surface, Text, IconButton, useTheme } from 'react-native-paper';

export type UIVariant = 'A' | 'B' | 'C';

export interface PrototypeSwitcherProps {
  current: UIVariant;
  onChange: (variant: UIVariant) => void;
}

const VARIANTS: { key: UIVariant; label: string }[] = [
  { key: 'A', label: 'A: Hero Card (Классический M3)' },
  { key: 'B', label: 'B: Metric Grid (Аналитический)' },
  { key: 'C', label: 'C: Conversational (Минимализм)' },
];

export const PrototypeSwitcher: React.FC<PrototypeSwitcherProps> = ({ current, onChange }) => {
  const theme = useTheme();
  const currentIndex = VARIANTS.findIndex((v) => v.key === current);

  const prev = () => {
    const nextIdx = (currentIndex - 1 + VARIANTS.length) % VARIANTS.length;
    onChange(VARIANTS[nextIdx].key);
  };

  const next = () => {
    const nextIdx = (currentIndex + 1) % VARIANTS.length;
    onChange(VARIANTS[nextIdx].key);
  };

  return (
    <Surface style={[styles.container, { backgroundColor: theme.colors.elevation.level5 }]} elevation={5}>
      <IconButton icon="chevron-left" size={20} onPress={prev} accessibilityLabel="Предыдущий вариант" />
      <TouchableOpacity
        style={styles.labelContainer}
        onPress={next}
        activeOpacity={0.7}
      >
        <Text variant="labelMedium" style={{ color: theme.colors.primary, fontWeight: '700' }}>
          {VARIANTS[currentIndex].label}
        </Text>
        <Text variant="bodySmall" style={{ color: theme.colors.outline, fontSize: 10 }}>
          Нажмите для смены варианта UI
        </Text>
      </TouchableOpacity>
      <IconButton icon="chevron-right" size={20} onPress={next} accessibilityLabel="Следующий вариант" />
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 16,
    left: 20,
    right: 20,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  labelContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
});
