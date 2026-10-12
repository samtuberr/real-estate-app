import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Num } from '@/components/common/Num';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Text } from '@/components/ui/text';
import { scoreBand } from '@/lib/domain/score/grade';
import type { PotentialScore } from '@/lib/domain/types';
import { useLocalized } from '@/lib/i18n/useLocalized';
import { cn } from '@/lib/utils/cn';

const textByBand = { high: 'text-score-high', mid: 'text-score-mid', low: 'text-score-low' } as const;
const barByBand = { high: 'bg-score-high', mid: 'bg-score-mid', low: 'bg-score-low' } as const;

/**
 * Potential Score summary with sub-score bars (spec §4.3 items 3–4). M3 replaces the
 * number with the Skia ScoreRing and links to the deep-dive screen.
 */
export function ScoreSummaryCard({ score }: { score: PotentialScore | undefined }) {
  const { t } = useTranslation('property');
  const { t: tc } = useTranslation();
  const localized = useLocalized();

  if (!score) {
    return (
      <Card tone="aurora" className="gap-1">
        <Text role="heading" variant="h2">
          {t('score.none')}
        </Text>
        <Text variant="muted">{t('score.noneBody')}</Text>
      </Card>
    );
  }

  const band = scoreBand(score.total);
  // The one-line summary is the highlight of the sub-score contributing the most.
  const top = [...score.subScores].sort((a, b) => b.value * b.weight - a.value * a.weight)[0];

  return (
    <Card tone="aurora" className="gap-5">
      <View className="flex-row items-center gap-4">
        <Num className={cn('font-sans-bold text-hero', textByBand[band])}>{score.total}</Num>
        <View className="flex-1 gap-1">
          <Text variant="caption">{t('score.title')}</Text>
          <Text role="heading" variant="h2">
            {tc(`grades.${score.grade}`)}
          </Text>
          {score.confidence === 'low' ? (
            <Badge variant="outline">
              <Text>{t('score.limitedData')}</Text>
            </Badge>
          ) : null}
        </View>
      </View>
      {top?.highlights[0] ? <Text>{localized(top.highlights[0])}</Text> : null}
      <View className="gap-3">
        {score.subScores.map((s) => (
          <View key={s.key} className="gap-1.5">
            <View className="flex-row items-center justify-between">
              <Text variant="muted">{t(`subScores.${s.key}`)}</Text>
              <Num className="font-sans-semibold">{s.value}</Num>
            </View>
            <Progress value={s.value} indicatorClassName={barByBand[scoreBand(s.value)]} className="bg-background/60" />
          </View>
        ))}
      </View>
    </Card>
  );
}
