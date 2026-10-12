import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { Money } from '@/components/common/Money';
import { Num } from '@/components/common/Num';
import { Text } from '@/components/ui/text';
import { Progress } from '@/components/ui/progress';
import { REGULATION } from '@/lib/domain/regulation/config';
import { useLocale } from '@/lib/i18n/useLocale';
import { formatNumber } from '@/lib/utils/format';

export function AffordabilityMeter({
  payment,
  income,
  equityGap = 0,
}: {
  payment: number;
  income: number;
  equityGap?: number;
}) {
  const { t } = useTranslation('mortgage');
  const locale = useLocale();
  const ratio = income > 0 ? payment / income : payment > 0 ? Infinity : 0;
  const status =
    ratio > REGULATION.maxPaymentRatio
      ? 'overLimit'
      : ratio > REGULATION.recommendedPaymentRatio
        ? 'stretched'
        : 'comfortable';
  return (
    <View className="gap-2">
      <Text variant="label">{t('paymentRatio')}</Text>
      <Num variant="h2">
        {Number.isFinite(ratio) ? formatNumber(ratio, locale, { style: 'percent', maximumFractionDigits: 1 }) : '—'}
      </Num>
      <Progress
        value={Math.min(100, ratio * 100)}
        accessibilityLabel={t('paymentRatio')}
        indicatorClassName={
          status === 'overLimit' ? 'bg-destructive' : status === 'stretched' ? 'bg-score-mid' : 'bg-score-high'
        }
      />
      <Text className={status === 'overLimit' ? 'text-destructive' : 'text-muted-foreground'}>
        {t(`affordability.${status}`)}
      </Text>
      <Text variant="caption">{t('affordability.basis')}</Text>
      {equityGap > 0 && (
        <View className="gap-1 rounded-2xl border border-destructive p-3" accessibilityLiveRegion="polite">
          <Text className="font-sans-medium text-destructive">{t('equityGap')}</Text>
          <Money value={equityGap} className="text-destructive" />
          <Text variant="caption">{t('equityGapBody')}</Text>
        </View>
      )}
    </View>
  );
}
