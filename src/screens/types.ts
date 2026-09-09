import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

export type RootStackParamList = {
  Converter: undefined;
  Settings: { isFirstLaunch?: boolean } | undefined;
};

export type ConverterScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Converter'
>;

export type SettingsModalNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Settings'
>;

export type SettingsModalRouteProp = RouteProp<RootStackParamList, 'Settings'>;
