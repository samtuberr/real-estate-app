import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { Money } from '@/components/common/Money';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { Separator } from '@/components/ui/separator';
import type { purchaseCosts } from '@/lib/domain/tax/purchase';

export function PurchaseCosts({
  price,
  loan,
  costs,
}: {
  price: number;
  loan: number;
  costs: ReturnType<typeof purchaseCosts>;
}) {
  const { t } = useTranslation('mortgage');
  const rows = [
    ['price', price],
    ...Object.entries(costs.items),
    ['closing', costs.closingCosts],
    ['total', costs.total],
    ['cash', costs.total - loan],
  ] as const;
  return (
    <Card className="gap-4">
      <Text role="heading" variant="h2">
        {t('costs.title')}
      </Text>
      <Text variant="caption">{t('costs.hint')}</Text>
      {rows.map(([key, value]) => (
        <View key={key} className="gap-3">
          {key === 'total' && <Separator />}
          <View className="flex-row flex-wrap items-center justify-between gap-2">
            <Text className="flex-shrink">{t(`costs.${key as 'price'}`)}</Text>
            <Money value={value} className={key === 'total' || key === 'cash' ? 'font-sans-semibold' : undefined} />
          </View>
        </View>
      ))}
    </Card>
  );
}
