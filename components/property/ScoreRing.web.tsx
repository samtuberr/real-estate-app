import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Num } from '@/components/common/Num';
import { Text } from '@/components/ui/text';
import { usePalette } from '@/lib/usePalette';
import type { ScoreRingProps } from './ScoreRing';

/** Static web preview. Native uses Skia; no CanvasKit download needed on web. */
export function ScoreRing({ score, size = 148 }: ScoreRingProps) {
  const palette = usePalette();
  const { t } = useTranslation();
  const id = useId();
  const radius = size / 2 - 18;
  const circumference = 2 * Math.PI * radius;
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={t('scoreLabel', { score })}
      style={{ width: size, height: size }}
      className="shrink-0"
    >
      <Svg width={size} height={size} aria-hidden>
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={palette.primary} />
            <Stop offset="1" stopColor={palette.plasma} />
          </LinearGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={palette.border} strokeWidth={8} />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${id})`}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference * (1 - score / 100)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View aria-hidden className="absolute inset-0 items-center justify-center">
        <Num className="font-sans-bold text-display">{score}</Num>
        <Text variant="caption">/ 100</Text>
      </View>
    </View>
  );
}
