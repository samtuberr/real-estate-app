import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { Money } from '@/components/common/Money';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FlashList } from '@/components/ui/flash-list';
import { Text } from '@/components/ui/text';
import { annualSchedule } from '@/lib/domain/mortgage/plans';
import type { Plan } from '@/lib/domain/mortgage/types';
import { AmortizationChart } from './AmortizationChart';

export function Amortization({ plan }: { plan: Plan }) {
  const { t } = useTranslation('mortgage');
  const [expanded, setExpanded] = useState(false);
  const data = annualSchedule(plan.schedule);
  return (
    <Card className="gap-4">
      <Text variant="h2" role="heading">
        {t('chart.title')}
      </Text>
      <Text variant="caption">{t('chart.subtitle')}</Text>
      <View className="flex-row flex-wrap gap-4">
        <View className="flex-row items-center gap-2">
          <View className="h-2 w-4 rounded bg-primary" />
          <Text variant="caption">{t('chart.principal')}</Text>
        </View>
        <View className="flex-row items-center gap-2">
          <View className="h-2 w-4 rounded bg-plasma" />
          <Text variant="caption">{t('chart.interest')}</Text>
        </View>
      </View>
      <AmortizationChart data={data} />
      <View className="flex-row justify-between rtl:flex-row-reverse">
        <Text variant="caption">{t('chart.year', { count: 1 })}</Text>
        <Text variant="caption">{t('chart.year', { count: data.length })}</Text>
      </View>
      <Button variant="outline" accessibilityState={{ expanded }} onPress={() => setExpanded(!expanded)}>
        <Text>{t(expanded ? 'chart.hideData' : 'chart.showData')}</Text>
      </Button>
      {expanded && (
        <View className="h-96">
          <FlashList
            data={data}
            keyExtractor={(row) => String(row.year)}
            nestedScrollEnabled
            renderItem={({ item }) => (
              <View className="gap-2 border-b border-border py-4">
                <Text variant="label">{t('chart.year', { count: item.year })}</Text>
                {(['payment', 'principal', 'interest', 'indexation', 'balance'] as const).map((key) => (
                  <View key={key} className="flex-row flex-wrap justify-between gap-2">
                    <Text variant="caption">{t(`chart.${key}`)}</Text>
                    <Money value={item[key]} className="text-caption" />
                  </View>
                ))}
              </View>
            )}
          />
        </View>
      )}
    </Card>
  );
}
