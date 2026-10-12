import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { Num } from '@/components/common/Num';
import { Progress } from '@/components/ui/progress';
import { Text } from '@/components/ui/text';
import { SUB_SCORE_KEYS } from '@/lib/domain/score/config';
import { scoreBand } from '@/lib/domain/score/grade';
import type { PotentialScore } from '@/lib/domain/types';
import { useLocale } from '@/lib/i18n/useLocale';
import { useLocalized } from '@/lib/i18n/useLocalized';
import { formatNumber } from '@/lib/utils/format';
const bars = { high: 'bg-score-high', mid: 'bg-score-mid', low: 'bg-score-low' } as const;

export function ScoreBreakdown({ score, detailed = false }: { score: PotentialScore; detailed?: boolean }) {
  const { t } = useTranslation('property');
  const localized = useLocalized();
  const locale = useLocale();
  return (
    <View className={detailed ? 'gap-7' : 'gap-4'}>
      {SUB_SCORE_KEYS.map((key) => {
        const sub = score.subScores.find((s) => s.key === key);
        return (
          <View key={key} className="gap-2">
            <View className="flex-row items-center justify-between gap-3">
              <Text className="flex-1 font-sans-medium">{t(`subScores.${key}`)}</Text>
              {sub ? (
                <Num className="font-sans-semibold">{sub.value}</Num>
              ) : (
                <Text variant="caption">{t('score.missing')}</Text>
              )}
            </View>
            {sub ? (
              <>
                <Progress
                  accessibilityLabel={t(`subScores.${key}`)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={sub.value}
                  value={sub.value}
                  indicatorClassName={bars[scoreBand(sub.value)]}
                />
                {detailed ? (
                  <Text variant="caption">
                    {t('score.contribution', {
                      weight: formatNumber(sub.weight, locale, { style: 'percent', maximumFractionDigits: 1 }),
                      points: formatNumber(sub.weight * sub.value, locale, { maximumFractionDigits: 1 }),
                    })}
                  </Text>
                ) : null}
                {(detailed ? sub.highlights : sub.highlights.slice(0, 1)).map((highlight, i) => (
                  <Text key={i} variant={detailed ? 'body' : 'caption'}>
                    {localized(highlight)}
                  </Text>
                ))}
              </>
            ) : (
              <Text variant="caption">{t('score.missingBody')}</Text>
            )}
          </View>
        );
      })}
    </View>
  );
}
