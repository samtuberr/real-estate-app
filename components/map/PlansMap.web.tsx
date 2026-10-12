import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import type { PlansMapProps } from './PlansMap';

export function PlansMap(_props: PlansMapProps) {
  const { t } = useTranslation('property');
  return (
    <View className="flex-1 items-center justify-center gap-2 bg-tone-ion p-5">
      <Text variant="h2">{t('plans.mapNative')}</Text>
      <Text variant="muted">{t('plans.mapNativeBody')}</Text>
    </View>
  );
}
