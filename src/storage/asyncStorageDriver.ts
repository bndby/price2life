import AsyncStorage from '@react-native-async-storage/async-storage';
import type { StorageDriver } from './incomeStorage';

export function createAsyncStorageDriver(): StorageDriver {
  return {
    getItem: (key) => AsyncStorage.getItem(key),
    setItem: (key, value) => AsyncStorage.setItem(key, value),
    removeItem: (key) => AsyncStorage.removeItem(key),
  };
}
