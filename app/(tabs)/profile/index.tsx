import Constants from 'expo-constants';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Screen } from '@/components/common/Screen';
import { SectionHeader } from '@/components/common/SectionHeader';
import { Badge } from '@/components/ui/badge';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { SUPPORTED_LOCALES } from '@/lib/i18n/locales';
import { useChangeLocale } from '@/lib/i18n/useChangeLocale';
import { useLocale } from '@/lib/i18n/useLocale';
import { type ThemePreference, useSettingsStore } from '@/stores/settings';

const THEMES: ThemePreference[] = ['system', 'light', 'dark'];

export default function ProfileScreen() {
  const { t } = useTranslation('profile');
  const { t: tc } = useTranslation('common');
  const locale = useLocale();
  const changeLocale = useChangeLocale();
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);

  return (
    <Screen>
      <Card tone="aurora" className="mb-8">
        <CardHeader className="mb-0 flex-row items-center gap-4">
          <View className="h-12 w-12 items-center justify-center rounded-full bg-background">
            <Icon name="profile" className="text-primary" />
          </View>
          <View className="flex-1 gap-1">
            <CardTitle>{t('buyerProfile')}</CardTitle>
            <CardDescription>{t('buyerProfileBody')}</CardDescription>
          </View>
        </CardHeader>
        <Badge variant="secondary" className="mt-4">
          <Text>{tc('comingSoon')}</Text>
        </Badge>
      </Card>

      <SectionHeader title={t('language')} className="mb-3" />
      <View className="mb-8 flex-row gap-2">
        {SUPPORTED_LOCALES.map((code) => (
          <Chip
            key={code}
            label={tc(`languages.${code}`)}
            selected={locale === code}
            onPress={() => changeLocale(code)}
          />
        ))}
      </View>

      <SectionHeader title={t('theme')} className="mb-3" />
      <View className="mb-8 flex-row flex-wrap gap-2">
        {THEMES.map((value) => (
          <Chip
            key={value}
            label={t(`themes.${value}`)}
            selected={theme === value}
            onPress={() => setTheme(value)}
          />
        ))}
      </View>

      <Text variant="caption" className="text-center">
        {t('version', { version: Constants.expoConfig?.version ?? '' })}
      </Text>
    </Screen>
  );
}
