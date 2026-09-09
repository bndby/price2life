import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { calendarDateFromDate, type CalendarDate, type Sex } from '../core/remainingLife';
import {
  derivePersonState,
  type PersonContextState,
  type PersonSettings,
  type PersonStorageService,
} from './personStorage';

export type Clock = () => Date;

const PersonContext = createContext<PersonContextState | null>(null);

export function usePerson(): PersonContextState {
  const value = useContext(PersonContext);
  if (!value) {
    throw new Error('usePerson must be used within PersonProvider');
  }
  return value;
}

export function PersonProvider({
  children,
  service,
  now = () => new Date(),
}: {
  children: React.ReactNode;
  service: PersonStorageService;
  now?: Clock;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<PersonSettings | null>(null);

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

  const savePerson = useCallback(
    async (dateOfBirth: CalendarDate, sex: Sex): Promise<boolean> => {
      try {
        const saved = await service.saveSettings(dateOfBirth, sex);
        setSettings(saved);
        return true;
      } catch {
        return false;
      }
    },
    [service],
  );

  const clearPerson = useCallback(async () => {
    await service.clearSettings();
    setSettings(null);
  }, [service]);

  const value = useMemo<PersonContextState>(() => {
    return {
      ...derivePersonState(settings, isLoading, calendarDateFromDate(now())),
      savePerson,
      clearPerson,
    };
  }, [settings, isLoading, savePerson, clearPerson, now]);

  return <PersonContext.Provider value={value}>{children}</PersonContext.Provider>;
}
