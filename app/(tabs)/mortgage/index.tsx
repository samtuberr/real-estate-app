import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Disclaimer } from '@/components/common/Disclaimer';
import { EmptyState } from '@/components/common/EmptyState';
import { Num } from '@/components/common/Num';
import { Screen } from '@/components/common/Screen';
import { StatTile } from '@/components/common/StatTile';

export default function MortgageScreen() {
  const { t } = useTranslation('mortgage');
  const placeholder = <Num variant="h1" className="font-sans-bold">—</Num>;
  return (
    <Screen subtitle={t('subtitle')}>
      <View className="mb-4 flex-row gap-3">
        <StatTile label={t('maxPrice')} value={placeholder} />
        <StatTile label={t('monthlyPayment')} value={placeholder} />
      </View>
      <EmptyState tone="solar" icon="mortgage" title={t('emptyTitle')} body={t('emptyBody')} />
      <Disclaimer className="mt-6" />
    </Screen>
  );
}
