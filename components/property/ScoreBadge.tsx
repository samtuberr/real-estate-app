import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Num } from '@/components/common/Num';
import { scoreBand } from '@/lib/domain/score/grade';
import { cn } from '@/lib/utils/cn';

const bandClass = { high: 'bg-score-high', mid: 'bg-score-mid', low: 'bg-score-low' } as const;

type ScoreBadgeProps = { score: number | undefined; size?: 'sm' | 'md'; className?: string };

/** Compact Potential Score chip colored by band. The full ring arrives with M3. */
export function ScoreBadge({ score, size = 'sm', className }: ScoreBadgeProps) {
  const { t } = useTranslation();
  if (score == null) return null;
  return (
    <View
      accessibilityLabel={t('scoreLabel', { score })}
      className={cn(
        'items-center justify-center rounded-full',
        bandClass[scoreBand(score)],
        size === 'sm' ? 'h-8 min-w-8 px-2' : 'h-11 min-w-11 px-3',
        className,
      )}
    >
      <Num className={cn('font-sans-bold text-background', size === 'sm' ? 'text-caption' : 'text-body')}>{score}</Num>
    </View>
  );
}
