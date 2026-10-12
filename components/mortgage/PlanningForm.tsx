import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm, useWatch, type FieldPath } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { BUYER_TYPES, type PlanningInputs } from '@/lib/domain/mortgage/types';
import { REGULATION } from '@/lib/domain/regulation/config';
import { RangeControl } from './RangeControl';

const numeric = (min: number, max: number) =>
  z
    .string()
    .trim()
    .regex(/^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?$/)
    .transform((value) => Number(value.replaceAll(',', '')))
    .pipe(z.number().min(min).max(max));
const schema = z.object({
  price: numeric(1, 100_000_000),
  equity: numeric(0, 100_000_000),
  monthlyIncome: numeric(0, 10_000_000),
  monthlyObligations: numeric(0, 10_000_000),
  buyerType: z.enum(BUYER_TYPES),
  replacementTaxEligible: z.boolean(),
  termYears: z.number().int().min(REGULATION.minTermYears).max(REGULATION.maxTermYears),
  annualCpi: z.number().min(0).max(0.1),
  fees: z.object({
    lawyerRate: numeric(0, 10).transform((value) => value / 100),
    agentRate: numeric(0, 10).transform((value) => value / 100),
    appraiser: numeric(0, 1_000_000),
    advisor: numeric(0, 1_000_000),
    moving: numeric(0, 1_000_000),
    renovation: numeric(0, 10_000_000),
  }),
});
type FormValues = z.input<typeof schema>;
const numberFields = ['price', 'equity', 'monthlyIncome', 'monthlyObligations'] as const;
const feeFields = ['lawyerRate', 'agentRate', 'appraiser', 'advisor', 'moving', 'renovation'] as const;

export function PlanningForm({
  initial,
  isExample,
  onSubmit,
}: {
  initial: PlanningInputs;
  isExample: boolean;
  onSubmit: (inputs: PlanningInputs) => void;
}) {
  const { t } = useTranslation('mortgage');
  const [showFees, setShowFees] = useState(false);
  const form = useForm<FormValues, unknown, PlanningInputs>({
    resolver: zodResolver(schema),
    defaultValues: {
      ...initial,
      price: String(initial.price),
      equity: String(initial.equity),
      monthlyIncome: String(initial.monthlyIncome),
      monthlyObligations: String(initial.monthlyObligations),
      fees: {
        lawyerRate: String(initial.fees.lawyerRate * 100),
        agentRate: String(initial.fees.agentRate * 100),
        appraiser: String(initial.fees.appraiser),
        advisor: String(initial.fees.advisor),
        moving: String(initial.fees.moving),
        renovation: String(initial.fees.renovation),
      },
    },
  });
  const buyerType = useWatch({ control: form.control, name: 'buyerType' });
  const numberField = (name: FieldPath<FormValues>, label: string, percent = false) => (
    <Controller
      key={name}
      control={form.control}
      name={name}
      render={({ field, fieldState }) => (
        <View className="gap-2">
          <Text variant="label">{label}</Text>
          <Input
            accessibilityLabel={label}
            keyboardType="decimal-pad"
            inputMode="decimal"
            selectTextOnFocus
            value={String(field.value)}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            ref={field.ref}
            className={fieldState.error ? 'border-destructive' : undefined}
          />
          {fieldState.error && (
            <Text role="alert" className="text-caption text-destructive">
              {t(percent ? 'form.percentError' : 'form.numberError')}
            </Text>
          )}
        </View>
      )}
    />
  );
  return (
    <View className="gap-6">
      <Card tone="solar" className="gap-2">
        <Text variant="label">{t(isExample ? 'form.exampleTitle' : 'form.title')}</Text>
        <Text variant="caption">{t('form.privacy')}</Text>
        {isExample && <Text variant="caption">{t('form.exampleBody')}</Text>}
      </Card>
      <Card className="gap-5">
        {numberFields.map((name) => numberField(name, t(`form.${name}`)))}
        <Text variant="caption">{t('form.obligationsHint')}</Text>
        <Text variant="label">{t('form.buyerType')}</Text>
        <Controller
          control={form.control}
          name="buyerType"
          render={({ field }) => (
            <View className="flex-row flex-wrap gap-2">
              {BUYER_TYPES.map((type) => (
                <Chip
                  key={type}
                  label={t(`buyerTypes.${type}`)}
                  selected={field.value === type}
                  onPress={() => field.onChange(type)}
                />
              ))}
            </View>
          )}
        />
        {buyerType === 'upgrader' && (
          <View className="gap-2">
            <Text variant="caption">{t('form.replacementHint')}</Text>
            <Controller
              control={form.control}
              name="replacementTaxEligible"
              render={({ field }) => (
                <View className="gap-2">
                  <Chip
                    label={t('form.taxConservative')}
                    selected={!field.value}
                    onPress={() => field.onChange(false)}
                  />
                  <Chip label={t('form.taxEligible')} selected={field.value} onPress={() => field.onChange(true)} />
                </View>
              )}
            />
          </View>
        )}
        <Controller
          control={form.control}
          name="termYears"
          render={({ field }) => (
            <RangeControl
              label={t('term')}
              valueLabel={t('years', { count: field.value })}
              value={field.value}
              min={REGULATION.minTermYears}
              max={REGULATION.maxTermYears}
              step={1}
              onChange={(value) => field.onChange(Math.round(value))}
            />
          )}
        />
        <Controller
          control={form.control}
          name="annualCpi"
          render={({ field }) => (
            <RangeControl
              label={t('cpi')}
              valueLabel={`${(field.value * 100).toFixed(1)}%`}
              value={field.value * 100}
              min={0}
              max={10}
              step={0.5}
              onChange={(value) => field.onChange(value / 100)}
            />
          )}
        />
      </Card>
      <Button variant="outline" accessibilityState={{ expanded: showFees }} onPress={() => setShowFees(!showFees)}>
        <Text>{t('form.editFees')}</Text>
      </Button>
      {showFees && (
        <Card className="gap-5">
          <Text variant="caption">{t('costs.hint')}</Text>
          {feeFields.map((name) => numberField(`fees.${name}`, t(`form.${name}`), name.endsWith('Rate')))}
        </Card>
      )}
      {Object.keys(form.formState.errors).length > 0 && (
        <Text role="alert" className="text-destructive">
          {t('form.fixErrors')}
        </Text>
      )}
      <Button size="lg" onPress={form.handleSubmit(onSubmit, () => setShowFees(true))}>
        <Text>{t('form.calculate')}</Text>
      </Button>
    </View>
  );
}
