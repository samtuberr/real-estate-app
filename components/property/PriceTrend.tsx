import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { Money } from '@/components/common/Money';
import { Num } from '@/components/common/Num';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import type { MarketStats } from '@/lib/domain/types';
import { PriceTrendChart } from './PriceTrendChart';

export function PriceTrend({ history }: { history: MarketStats['priceHistory'] }) {
  const { t } = useTranslation('property');
  const [expanded, setExpanded] = useState(false);
  const points = (history ?? [])
    .filter((p) => Number.isFinite(p.year) && Number.isFinite(p.pricePerSqm) && p.pricePerSqm > 0)
    .sort((a, b) => a.year - b.year);
  return (
    <Card className="gap-3">
      <Text role="heading" variant="label">
        {t('market.chartTitle')}
      </Text>
      {points.length < 2 ? (
        <Text variant="muted">{t('market.noHistory')}</Text>
      ) : (
        <>
          <View className="flex-row justify-between gap-3 rtl:flex-row-reverse">
            <View>
              <Num className="text-caption text-muted-foreground">{points[0].year}</Num>
              <Money value={points[0].pricePerSqm} className="font-sans-semibold" />
            </View>
            <View>
              <Num className="text-caption text-muted-foreground">{points[points.length - 1].year}</Num>
              <Money value={points[points.length - 1].pricePerSqm} className="font-sans-semibold" />
            </View>
          </View>
          <PriceTrendChart history={points} />
          <Button variant="ghost" aria-expanded={expanded} onPress={() => setExpanded(!expanded)}>
            <Text>{t(expanded ? 'market.hideData' : 'market.showData')}</Text>
          </Button>
          {expanded
            ? points.map((point) => (
                <View key={point.year} className="flex-row justify-between gap-3">
                  <Num>{point.year}</Num>
                  <Money value={point.pricePerSqm} />
                </View>
              ))
            : null}
        </>
      )}
    </Card>
  );
}
