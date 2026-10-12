import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { Disclaimer } from '@/components/common/Disclaimer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import type { PotentialScore } from '@/lib/domain/types';
import { useLocalized } from '@/lib/i18n/useLocalized';
import { ScoreBreakdown } from './ScoreBreakdown';
import { ScoreRing } from './ScoreRing';

export function ScoreSummaryCard({
  score,
  propertyId,
  breakdown = true,
}: {
  score: PotentialScore | undefined;
  propertyId: string;
  breakdown?: boolean;
}) {
  const { t } = useTranslation('property');
  const { t: tc } = useTranslation();
  const localized = useLocalized();
  if (!score)
    return (
      <Card tone="aurora" className="gap-2">
        <Text role="heading" variant="h2">
          {t('score.none')}
        </Text>
        <Text variant="muted">{t('score.noneBody')}</Text>
        <Disclaimer />
      </Card>
    );
  const top = [...score.subScores].sort((a, b) => b.value * b.weight - a.value * a.weight)[0];
  return (
    <Card tone="aurora" className="gap-5">
      <View className="flex-row flex-wrap items-center justify-center gap-3">
        <ScoreRing score={score.total} animationKey={propertyId} />
        <View className="min-w-32 flex-1 gap-2">
          <Text variant="caption">{t('score.title')}</Text>
          <Text role="heading" variant="h2">
            {tc(`grades.${score.grade}`)}
          </Text>
          <Text variant="caption">{t(`score.confidence.${score.confidence}`)}</Text>
          {score.confidence !== 'high' ? (
            <Badge variant="outline">
              <Text>{t('score.limitedData')}</Text>
            </Badge>
          ) : null}
        </View>
      </View>
      {top?.highlights[0] ? <Text>{localized(top.highlights[0])}</Text> : null}
      {breakdown ? (
        <>
          <ScoreBreakdown score={score} />
          <Button
            variant="secondary"
            onPress={() => router.push({ pathname: '/property/[id]/score', params: { id: propertyId } })}
          >
            <Text>{t('score.deepDive')}</Text>
          </Button>
        </>
      ) : null}
      <Disclaimer />
    </Card>
  );
}
