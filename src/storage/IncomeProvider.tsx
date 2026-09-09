import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { IncomePeriod } from '../core/calculator';
import {
  deriveIncomeState,
  type IncomeContextState,
  type IncomeStorageService,
  type UserIncomeSettings,
} from './incomeStorage';

const IncomeContext = createContext<IncomeContextState | null>(null);

export function useIncome(): IncomeContextState {
  const value = useContext(IncomeContext);
  if (!value) {
    throw new Error('useIncome must be used within IncomeProvider');
  }
  return value;
}

export function IncomeProvider({
  children,
  service,
}: {
  children: React.ReactNode;
  service: IncomeStorageService;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<UserIncomeSettings | null>(null);

  useEffect(() => {
    let cancelled = false;
    service.getSettings().then((loaded) => {
      if (!cancelled) {
        setSettings(loaded);
        setIsLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [service]);

  const saveIncome = useCallback(
    async (income: number, period: IncomePeriod): Promise<boolean> => {
      try {
        const saved = await service.saveSettings(income, period);
        setSettings(saved);
        return true;
      } catch {
        return false;
      }
    },
    [service],
  );

  const resetIncome = useCallback(async () => {
    await service.clearSettings();
    setSettings(null);
  }, [service]);

  const value = useMemo<IncomeContextState>(() => {
    return {
      ...deriveIncomeState(settings, isLoading),
      saveIncome,
      resetIncome,
    };
  }, [settings, isLoading, saveIncome, resetIncome]);

  return <IncomeContext.Provider value={value}>{children}</IncomeContext.Provider>;
}
