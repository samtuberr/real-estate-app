import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Money } from '@/components/common/Money';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { useMortgageEstimate } from '@/lib/mortgage/useMortgageEstimate';
import { useMortgageStore } from '@/stores/mortgage';
import { AffordabilityMeter } from './AffordabilityMeter';

export function PropertyMortgageCard({ price }: { price: number }) {
  const { t } = useTranslation('mortgage');
  const inputs = useMortgageStore((state) => state.inputs);
  const hasInputs = useMortgageStore((state) => state.hasInputs);
  const propertyInputs = { ...inputs, price };
  const { estimate } = useMortgageEstimate(propertyInputs);
  return (
    <Card tone="solar" className="gap-3">
      <Text role="heading" variant="h2">
        {t('propertyTitle')}
      </Text>
      {!hasInputs ? (
        <>
          <Text variant="muted">{t('propertyEmpty')}</Text>
          <Button onPress={() => router.push({ pathname: '/mortgage/calculator', params: { price: String(price) } })}>
            <Text>{t('enterInputs')}</Text>
          </Button>
        </>
      ) : !estimate ? (
        <Text>{t('taxExpired')}</Text>
      ) : (
        <>
          <Text variant="caption">{t('monthlyPayment')}</Text>
          <Money value={estimate.plans[1].monthlyPayment} variant="h1" />
          <Text variant="caption">{t('requiredEquity')}</Text>
          <Money value={estimate.requiredEquity} />
          <AffordabilityMeter
            payment={estimate.plans[1].monthlyPayment}
            income={estimate.disposableIncome}
            equityGap={estimate.equityGap}
          />
          <Text variant="caption">{t('propertyHint')}</Text>
          <Button
            onPress={() => {
              useMortgageStore.getState().setInputs(propertyInputs);
              router.push({ pathname: '/mortgage/[planId]', params: { planId: 'balanced' } });
            }}
          >
            <Text>{t('viewPlan', { name: t('plans.balanced.name') })}</Text>
          </Button>
        </>
      )}
    </Card>
  );
}
