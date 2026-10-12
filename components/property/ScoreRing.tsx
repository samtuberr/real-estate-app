import { BlurMask, Canvas, Circle, LinearGradient, Path, Skia, vec } from '@shopify/react-native-skia';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { TextInput, View, type TextInputProps } from 'react-native';
import Animated, {
  cancelAnimation,
  ReduceMotion,
  useAnimatedProps,
  useDerivedValue,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Text } from '@/components/ui/text';
import { usePalette } from '@/lib/usePalette';

export type ScoreRingProps = { score: number; animationKey: string; size?: number };
const seen = new Set<string>();
const AnimatedInput = Animated.createAnimatedComponent(TextInput);

/** Native signature moment; both number and arc animate on the UI thread. */
export function ScoreRing({ score, animationKey, size = 148 }: ScoreRingProps) {
  const { t } = useTranslation();
  const palette = usePalette();
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(score);
  const glow = useSharedValue(0.3);
  const end = useDerivedValue(() => progress.get() / 100);
  const numberProps = useAnimatedProps<TextInputProps & { text: string }>(() => ({
    text: String(Math.round(progress.get())),
  }));
  const center = size / 2;
  const radius = center - 18;
  const path = Skia.Path.Make();
  path.addArc({ x: 18, y: 18, width: radius * 2, height: radius * 2 }, -90, 360);
  useEffect(() => {
    if (seen.has(animationKey) || reducedMotion) progress.set(score);
    else {
      progress.set(0);
      progress.set(withTiming(score, { duration: 1000, reduceMotion: ReduceMotion.System }));
      glow.set(
        withSequence(
          withTiming(0.8, { duration: 500, reduceMotion: ReduceMotion.System }),
          withTiming(0.3, { duration: 650, reduceMotion: ReduceMotion.System }),
        ),
      );
    }
    seen.add(animationKey);
    return () => {
      cancelAnimation(progress);
      cancelAnimation(glow);
    };
  }, [animationKey, score, reducedMotion, progress, glow]);
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={t('scoreLabel', { score })}
      style={{ width: size, height: size }}
      className="shrink-0"
    >
      <Canvas style={{ width: size, height: size }} accessible={false}>
        <Circle cx={center} cy={center} r={radius} color={palette.border} style="stroke" strokeWidth={8} />
        <Path
          path={path}
          start={0}
          end={end}
          style="stroke"
          strokeWidth={12}
          strokeCap="round"
          opacity={glow}
          color={palette.primary}
        >
          <BlurMask blur={8} style="normal" />
        </Path>
        <Path path={path} start={0} end={end} style="stroke" strokeWidth={8} strokeCap="round">
          <LinearGradient start={vec(0, 0)} end={vec(size, size)} colors={[palette.primary, palette.plasma]} />
        </Path>
      </Canvas>
      <View
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        className="absolute inset-0 items-center justify-center"
      >
        <AnimatedInput
          editable={false}
          caretHidden
          accessible={false}
          underlineColorAndroid="transparent"
          defaultValue={String(score)}
          animatedProps={numberProps}
          className="w-full p-0 text-center font-sans-bold text-display text-foreground"
          style={{ writingDirection: 'ltr', fontVariant: ['tabular-nums'] }}
        />
        <Text variant="caption">/ 100</Text>
      </View>
    </View>
  );
}
