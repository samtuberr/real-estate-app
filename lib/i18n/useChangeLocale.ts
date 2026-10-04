import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

import { flushSettings, useSettingsStore } from '@/stores/settings';

import { applyDirection, directionMatches, reloadApp } from './direction';
import type { Locale } from './locales';

/**
 * Switches language. When the layout direction flips (he ⇄ en on native), asks the
 * user to confirm a restart first, because RTL only applies after a reload.
 */
export function useChangeLocale() {
  const { t, i18n } = useTranslation();
  const setLocale = useSettingsStore((s) => s.setLocale);

  return useCallback(
    (locale: Locale) => {
      if (locale === i18n.language) return;

      if (directionMatches(locale)) {
        setLocale(locale);
        applyDirection(locale);
        i18n.changeLanguage(locale);
        return;
      }

      Alert.alert(t('restart.title'), t('restart.body'), [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('restart.action'),
          onPress: async () => {
            setLocale(locale);
            await flushSettings();
            applyDirection(locale);
            await reloadApp();
          },
        },
      ]);
    },
    [i18n, setLocale, t],
  );
}
