import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Svg, { Circle } from 'react-native-svg';
import { Num } from '@/components/common/Num';
import { Text } from '@/components/ui/text';
import type { Track } from '@/lib/domain/mortgage/types';
import { usePalette } from '@/lib/usePalette';
import { useLocale } from '@/lib/i18n/useLocale';
import { formatNumber } from '@/lib/utils/format';

export function TrackMix({ tracks }: { tracks: Track[] }) {
  const { t } = useTranslation('mortgage');
  const palette = usePalette();
  const locale = useLocale();
  const colors = [palette.primary, palette.plasma, palette.scoreHigh];
  const circumference = 2 * Math.PI * 34;
  return (
    <View className="flex-row items-center gap-4">
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" aria-hidden>
        <Svg width={84} height={84} viewBox="0 0 84 84">
          {tracks.map((track, i) => {
            const start = tracks.slice(0, i).reduce((sum, part) => sum + part.share, 0);
            return (
              <Circle
                key={track.type}
                cx={42}
                cy={42}
                r={34}
                fill="none"
                stroke={colors[i % colors.length]}
                strokeWidth={9}
                strokeDasharray={`${track.share * circumference} ${circumference}`}
                strokeDashoffset={-start * circumference}
                rotation={-90}
                origin="42,42"
              />
            );
          })}
        </Svg>
      </View>
      <View className="flex-1 gap-2">
        {tracks.map((track, i) => (
          <View key={track.type} className="flex-row items-start gap-2">
            <View className="mt-1.5 h-2 w-2 rounded-full" style={{ backgroundColor: colors[i % colors.length] }} />
            <Text variant="caption" className="flex-1">
              {t(`tracks.${track.type}`)}
            </Text>
            <Num className="text-caption">
              {formatNumber(track.share, locale, { style: 'percent', maximumFractionDigits: 0 })}
            </Num>
          </View>
        ))}
      </View>
    </View>
  );
}
