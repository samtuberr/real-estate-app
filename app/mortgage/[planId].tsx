import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, View } from 'react-native';
import { Disclaimer } from '@/components/common/Disclaimer';
import { Money } from '@/components/common/Money';
import { Num } from '@/components/common/Num';
import { Screen } from '@/components/common/Screen';
import { AffordabilityMeter } from '@/components/mortgage/AffordabilityMeter';
import { Amortization } from '@/components/mortgage/Amortization';
import { Assumptions } from '@/components/mortgage/Assumptions';
import { MortgagePrompt } from '@/components/mortgage/MortgagePrompt';
import { PurchaseCosts } from '@/components/mortgage/PurchaseCosts';
import { RangeControl } from '@/components/mortgage/RangeControl';
import { TrackMix } from '@/components/mortgage/TrackMix';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Text } from '@/components/ui/text';
import { amortize, isLinked } from '@/lib/domain/mortgage/math';
import { calculatePlan, createPlan, PLAN_MIXES } from '@/lib/domain/mortgage/plans';
import { PLAN_IDS, type PlanId, type RateTable, type RepaymentMethod } from '@/lib/domain/mortgage/types';
import { REGULATION } from '@/lib/domain/regulation/config';
import { useLocale } from '@/lib/i18n/useLocale';
import { useMortgageEstimate } from '@/lib/mortgage/useMortgageEstimate';
import { formatCurrency, formatNumber } from '@/lib/utils/format';
import { useMortgageStore } from '@/stores/mortgage';

export default function PlanScreen() {
  const { planId } = useLocalSearchParams<{ planId: string }>();
  const { t } = useTranslation('mortgage');
  const valid = PLAN_IDS.includes(planId as PlanId);
  return (
    <>
      <Stack.Screen options={{ title: valid ? t(`plans.${planId as PlanId}.name`) : t('missingPlan') }} />
      {valid ? (
        <PlanDetail key={planId} id={planId as PlanId} />
      ) : (
        <Screen>
          <MortgagePrompt missing />
        </Screen>
      )}
    </>
  );
}

function PlanDetail({ id }: { id: PlanId }) {
  const { t } = useTranslation('mortgage');
  const locale = useLocale();
  const inputs = useMortgageStore((state) => state.inputs);
  const hasInputs = useMortgageStore((state) => state.hasInputs);
  const { estimate, rates } = useMortgageEstimate(inputs);
  const [amountOverride, setAmount] = useState<number>();
  const [termOverride, setTerm] = useState<number>();
  const [fixedOverride, setFixed] = useState<number>();
  const [cpiOverride, setCpi] = useState<number>();
  const [rateOverrides, setRates] = useState<Partial<RateTable>>({});
  const [method, setMethod] = useState<RepaymentMethod>('annuity');
  if (!hasInputs || !estimate)
    return (
      <Screen>
        <MortgagePrompt expired={!estimate} />
      </Screen>
    );
  const amount = amountOverride ?? estimate.loanNeeded;
  const term = termOverride ?? inputs.termYears;
  const cpi = cpiOverride ?? inputs.annualCpi;
  const fixed = fixedOverride ?? PLAN_MIXES[id].fixed_unlinked!;
  const plan = createPlan(id, amount, term, { ...rates, ...rateOverrides }, cpi, method, fixed);
  const cashGap = Math.max(0, estimate.costs.total - amount - inputs.equity);
  const ltvExceeded = amount > estimate.maxLoan + 0.01;
  const percent = (value: number) => formatNumber(value, locale, { style: 'percent', maximumFractionDigits: 2 });
  const stressTracks = plan.tracks.map((track) => ({
    ...track,
    annualRate:
      track.type === 'prime' || track.type.startsWith('variable') ? track.annualRate + 0.01 : track.annualRate,
  }));
  const stress = calculatePlan(id, stressTracks, cpi, method);
  return (
    <Screen className="gap-6">
      <Card tone="solar" className="gap-3">
        <Text variant="muted">{t(`plans.${id}.body`)}</Text>
        <Text variant="caption">{t('monthlyPayment')}</Text>
        <Money value={plan.monthlyPayment} className="font-sans-bold text-display" />
        <Text variant="caption">{t('peakPayment')}</Text>
        <Money value={plan.peakPayment} variant="h2" />
        <TrackMix tracks={plan.tracks} />
        <AffordabilityMeter payment={plan.monthlyPayment} income={estimate.disposableIncome} equityGap={cashGap} />
        {ltvExceeded && (
          <Text role="alert" className="text-destructive">
            {t('ltvExceeded', { limit: percent(REGULATION.maxLtv[inputs.buyerType]) })}
          </Text>
        )}
        <Text variant="caption">{t('stressPayment')}</Text>
        <Money value={stress.monthlyPayment} />
        <Text variant="caption">{t('stressHint')}</Text>
      </Card>
      <Card className="gap-5">
        <Text variant="h2" role="heading">
          {t('customize')}
        </Text>
        <Text variant="caption">{t('customizeHint')}</Text>
        <RangeControl
          label={t('loanAmount')}
          valueLabel={formatCurrency(amount, locale)}
          value={amount}
          min={0}
          max={inputs.price}
          step={Math.min(10_000, inputs.price)}
          onChange={setAmount}
        />
        <RangeControl
          label={t('term')}
          valueLabel={t('years', { count: term })}
          value={term}
          min={REGULATION.minTermYears}
          max={REGULATION.maxTermYears}
          step={1}
          onChange={(value) => setTerm(Math.round(value))}
        />
        <RangeControl
          label={t('fixedShare')}
          valueLabel={percent(fixed)}
          value={fixed * 100}
          min={34}
          max={100}
          step={1}
          onChange={(value) => setFixed(value / 100)}
        />
        <Text variant="caption">{t('mixHint')}</Text>
        <View className="flex-row flex-wrap gap-2">
          <Chip label={t('annuity')} selected={method === 'annuity'} onPress={() => setMethod('annuity')} />
          <Chip
            label={t('equalPrincipal')}
            selected={method === 'equal_principal'}
            onPress={() => setMethod('equal_principal')}
          />
        </View>
        <Text variant="label">{t('cpiScenario')}</Text>
        <View className="flex-row flex-wrap gap-2">
          {[...new Set([0, inputs.annualCpi, 0.04])].map((value) => (
            <Chip
              key={value}
              label={t('cpiValue', { value: percent(value) })}
              selected={cpi === value}
              onPress={() => setCpi(value)}
            />
          ))}
        </View>
        <Text variant="caption">{t('cpiHint')}</Text>
        <Button
          variant="ghost"
          onPress={() => {
            setAmount(undefined);
            setTerm(undefined);
            setFixed(undefined);
            setCpi(undefined);
            setRates({});
            setMethod('annuity');
          }}
        >
          <Text>{t('resetPlan')}</Text>
        </Button>
      </Card>
      <Amortization plan={plan} />
      <Card className="gap-4">
        <Text variant="h2" role="heading">
          {t('totals')}
        </Text>
        {(['totalRepayment', 'totalInterest', 'totalIndexation'] as const).map((key) => (
          <View key={key} className="gap-1">
            <Text variant="caption">{t(key)}</Text>
            <Money value={plan[key]} variant="h2" />
          </View>
        ))}
        <Text variant="caption">{t('indexationHint')}</Text>
      </Card>
      <Text variant="h2" role="heading">
        {t('trackDetails')}
      </Text>
      {plan.tracks.map((track) => (
        <Card key={track.type} className="gap-3">
          <Text variant="label">{t(`tracks.${track.type}`)}</Text>
          <Num>{percent(track.share)}</Num>
          <Money value={track.amount} variant="h2" />
          <Text variant="caption">
            {t('trackTerms', { years: term, linkage: t(isLinked(track.type) ? 'linked' : 'unlinked') })}
          </Text>
          <RangeControl
            label={t('trackRate', { track: t(`tracks.${track.type}`) })}
            valueLabel={percent(track.annualRate)}
            value={track.annualRate * 100}
            min={0}
            max={15}
            step={0.25}
            onChange={(value) => setRates({ ...rateOverrides, [track.type]: value / 100 })}
          />
          <Text variant="caption">{t('monthlyPayment')}</Text>
          <Money value={amortize(track, cpi, method)[0].payment} />
        </Card>
      ))}
      <PurchaseCosts price={inputs.price} loan={amount} costs={estimate.costs} />
      <Button variant="outline" onPress={() => router.push('/mortgage/calculator')}>
        <Text>{t('editInputs')}</Text>
      </Button>
      <Assumptions />
      <Button onPress={() => Alert.alert(t('advisorTitle'), t('advisorPending'))}>
        <Text>{t('advisorCta')}</Text>
      </Button>
      <Disclaimer text={t('disclaimer')} />
    </Screen>
  );
}
