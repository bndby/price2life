import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ConverterScreen } from '../screens/ConverterScreen';
import { SettingsModal } from '../screens/SettingsModal';
import type { RootStackParamList } from '../screens/types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Converter" component={ConverterScreen} />
      <Stack.Screen
        name="Settings"
        component={SettingsModal}
        options={({ route }) => ({
          presentation: 'modal',
          gestureEnabled: !route.params?.isFirstLaunch,
          animation: 'slide_from_bottom',
        })}
      />
    </Stack.Navigator>
  );
}
