import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { Disclaimer } from '@/components/common/Disclaimer';
import { Money } from '@/components/common/Money';
import { Screen } from '@/components/common/Screen';
import { SectionHeader } from '@/components/common/SectionHeader';
import { StatTile } from '@/components/common/StatTile';
import { AffordabilityMeter } from '@/components/mortgage/AffordabilityMeter';
import { Assumptions } from '@/components/mortgage/Assumptions';
import { PlanCard } from '@/components/mortgage/PlanCard';
import { PurchaseCosts } from '@/components/mortgage/PurchaseCosts';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { useMortgageEstimate } from '@/lib/mortgage/useMortgageEstimate';
import { DEMO_INPUTS, useMortgageStore } from '@/stores/mortgage';

export default function MortgageScreen() {
  const { t } = useTranslation('mortgage');
  const inputs = useMortgageStore((state) => state.inputs);
  const hasInputs = useMortgageStore((state) => state.hasInputs);
  const { estimate, rates } = useMortgageEstimate(inputs);
  return (
    <Screen subtitle={t('subtitle')} className="gap-6">
      {!hasInputs ? (
        <Card tone="solar" className="gap-4">
          <Text role="heading" variant="h1">
            {t('startTitle')}
          </Text>
          <Text variant="muted">{t('startBody')}</Text>
          <Button onPress={() => router.push('/mortgage/calculator')}>
            <Text>{t('enterInputs')}</Text>
          </Button>
          <Button variant="outline" onPress={() => useMortgageStore.getState().setInputs(DEMO_INPUTS)}>
            <Text>{t('useExample')}</Text>
          </Button>
        </Card>
      ) : !estimate ? (
        <Card>
          <Text role="alert">{t('taxExpired')}</Text>
        </Card>
      ) : (
        <>
          <Card tone="solar" className="gap-3">
            <Text variant="label">{t('planningPrice')}</Text>
            <Money value={inputs.price} className="font-sans-bold text-display" />
            <Text variant="caption">{t('sessionNotice')}</Text>
            <Button variant="outline" onPress={() => router.push('/mortgage/calculator')}>
              <Text>{t('editInputs')}</Text>
            </Button>
          </Card>
          <View className="flex-row flex-wrap gap-3">
            <StatTile
              className="min-w-36"
              label={t('maxPrice')}
              value={<Money value={estimate.maxPropertyPrice} variant="h2" />}
            />
            <StatTile
              className="min-w-36"
              label={t('maxLoan')}
              value={<Money value={estimate.maxLoan} variant="h2" />}
            />
          </View>
          <Text variant="caption">{t('maxPriceHint', { rate: (rates.fixed_unlinked * 100).toFixed(2) })}</Text>
          <View className="flex-row flex-wrap gap-3">
            <StatTile
              className="min-w-36"
              label={t('requiredEquity')}
              value={<Money value={estimate.requiredEquity} variant="h2" />}
            />
            <StatTile
              className="min-w-36"
              label={t('loanNeeded')}
              value={<Money value={estimate.loanNeeded} variant="h2" />}
            />
          </View>
          <Card className="gap-4">
            <Text variant="label">{t('balancedAssessment')}</Text>
            <AffordabilityMeter
              payment={estimate.plans[1].monthlyPayment}
              income={estimate.disposableIncome}
              equityGap={estimate.equityGap}
            />
          </Card>
          {estimate.loanNeeded === 0 ? (
            <Card>
              <Text>{t('noLoan')}</Text>
            </Card>
          ) : (
            <>
              <SectionHeader title={t('plansTitle')} />
              <Button variant="outline" onPress={() => router.push('/mortgage/compare')}>
                <Text>{t('compare')}</Text>
              </Button>
              {estimate.plans.map((plan) => (
                <PlanCard key={plan.id} plan={plan} />
              ))}
            </>
          )}
          <PurchaseCosts price={inputs.price} loan={estimate.loanNeeded} costs={estimate.costs} />
          <Button variant="ghost" onPress={() => useMortgageStore.getState().clear()}>
            <Text>{t('clearInputs')}</Text>
          </Button>
        </>
      )}
      <Assumptions />
      <Disclaimer text={t('disclaimer')} />
    </Screen>
  );
}
