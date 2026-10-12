import { Stack, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { Money } from '@/components/common/Money';
import { Disclaimer } from '@/components/common/Disclaimer';
import { Screen } from '@/components/common/Screen';
import { Assumptions } from '@/components/mortgage/Assumptions';
import { MortgagePrompt } from '@/components/mortgage/MortgagePrompt';
import { TrackMix } from '@/components/mortgage/TrackMix';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { useMortgageEstimate } from '@/lib/mortgage/useMortgageEstimate';
import { useMortgageStore } from '@/stores/mortgage';

const METRICS = ['monthlyPayment', 'peakPayment', 'totalRepayment', 'totalInterest', 'totalIndexation'] as const;
export default function CompareScreen() {
  const { t } = useTranslation('mortgage');
  const inputs = useMortgageStore((state) => state.inputs);
  const hasInputs = useMortgageStore((state) => state.hasInputs);
  const { estimate } = useMortgageEstimate(inputs);
  return (
    <Screen className="gap-6">
      <Stack.Screen options={{ title: t('compare') }} />
      {!hasInputs || !estimate ? (
        <MortgagePrompt expired={!estimate} />
      ) : (
        <>
          <Text variant="muted">{t('compareHint')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator contentContainerClassName="gap-3 pb-4">
            {estimate.plans.map((plan) => (
              <Card key={plan.id} tone={plan.id === 'balanced' ? 'solar' : 'default'} className="w-64 gap-5">
                <Text variant="h2" role="heading">
                  {t(`plans.${plan.id}.name`)}
                </Text>
                {METRICS.map((metric) => (
                  <View key={metric} className="gap-1">
                    <Text variant="caption">{t(metric)}</Text>
                    <Money value={plan[metric]} variant="h2" />
                  </View>
                ))}
                <TrackMix tracks={plan.tracks} />
                <Button
                  variant="outline"
                  onPress={() => router.push({ pathname: '/mortgage/[planId]', params: { planId: plan.id } })}
                >
                  <Text>{t('viewPlan', { name: t(`plans.${plan.id}.name`) })}</Text>
                </Button>
              </Card>
            ))}
          </ScrollView>
        </>
      )}
      <Assumptions compact />
      <Disclaimer text={t('disclaimer')} />
    </Screen>
  );
}
