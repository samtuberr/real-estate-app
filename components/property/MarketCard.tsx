import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Money } from '@/components/common/Money';
import { Num } from '@/components/common/Num';
import { StatTile } from '@/components/common/StatTile';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import { pricePerSqm } from '@/lib/domain/filters';
import type { PropertyDetail } from '@/lib/domain/types';
import { useLocale } from '@/lib/i18n/useLocale';
import { useLocalized } from '@/lib/i18n/useLocalized';
import { formatDate, formatNumber } from '@/lib/utils/format';
import { PriceTrend } from './PriceTrend';

/**
 * Nearby houses & market (spec §4.3 item 8): how this listing compares to the
 * neighborhood, price history and the latest comparable deals.
 */
export function MarketCard({ property }: { property: PropertyDetail }) {
  const { t } = useTranslation('property');
  const locale = useLocale();
  const localized = useLocalized();
  const { market, comparableDeals } = property;
  const ppsqm = pricePerSqm(property);
  const diff = Math.round((ppsqm / market.neighborhoodMedianPricePerSqm - 1) * 100);
  const comparison =
    Math.abs(diff) < 2
      ? t('market.atMedian')
      : diff < 0
        ? t('market.belowMedian', { pct: Math.abs(diff) })
        : t('market.aboveMedian', { pct: diff });

  return (
    <View className="gap-3">
      <View className="flex-row gap-3">
        <StatTile
          tone="ion"
          label={t('market.thisHome')}
          value={<Money value={ppsqm} className="font-sans-bold text-h2" />}
        />
        <StatTile
          tone="ion"
          label={t('market.median')}
          value={<Money value={market.neighborhoodMedianPricePerSqm} className="font-sans-bold text-h2" />}
        />
      </View>
      <Card className="gap-1 py-4">
        <Text className={diff <= -2 ? 'font-sans-medium text-score-high' : 'font-sans-medium'}>{comparison}</Text>
        <View className="flex-row items-center justify-between">
          <Text variant="muted">{t('market.fiveYear')}</Text>
          <Num
            className={
              market.fiveYearChange >= 0 ? 'font-sans-semibold text-score-high' : 'font-sans-semibold text-score-low'
            }
          >
            {`${market.fiveYearChange >= 0 ? '+' : ''}${formatNumber(market.fiveYearChange, locale, { style: 'percent' })}`}
          </Num>
        </View>
      </Card>

      <PriceTrend history={market.priceHistory} />

      <Card className="gap-3 py-4">
        <Text role="heading" variant="label">
          {t('market.recentDeals')}
        </Text>
        {comparableDeals.map((deal, i) => (
          <View key={deal.id} className="gap-3">
            {i > 0 ? <Separator /> : null}
            <View className="flex-row items-center gap-3">
              <View className="flex-1 gap-0.5">
                <Text numberOfLines={1}>{localized(deal.address)}</Text>
                <Text variant="caption">
                  {`${t('market.deal', { rooms: formatNumber(deal.rooms, locale), size: deal.sizeSqm })} · ${formatDate(deal.date, locale)}`}
                </Text>
              </View>
              <Money value={deal.price} className="font-sans-semibold" />
            </View>
          </View>
        ))}
      </Card>
    </View>
  );
}
