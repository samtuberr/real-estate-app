import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Money } from '@/components/common/Money';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import type { Plan } from '@/lib/domain/mortgage/types';
import { TrackMix } from './TrackMix';

export function PlanCard({ plan }: { plan: Plan }) {
  const { t } = useTranslation('mortgage');
  return (
    <Card tone={plan.id === 'balanced' ? 'solar' : 'default'} className="gap-4">
      <Text role="heading" variant="h2">
        {t(`plans.${plan.id}.name`)}
      </Text>
      <Text variant="muted">{t(`plans.${plan.id}.body`)}</Text>
      <Text variant="caption">{t('monthlyPayment')}</Text>
      <Money value={plan.monthlyPayment} className="font-sans-bold text-display" />
      <TrackMix tracks={plan.tracks} />
      <Text variant="caption">{t('totalRepayment')}</Text>
      <Money value={plan.totalRepayment} className="font-sans-semibold" />
      <Text variant="caption">{t('totalInterest')}</Text>
      <Money value={plan.totalInterest} />
      <Text variant="caption">{t('totalIndexation')}</Text>
      <Money value={plan.totalIndexation} />
      <Button
        variant={plan.id === 'balanced' ? 'default' : 'outline'}
        onPress={() => router.push({ pathname: '/mortgage/[planId]', params: { planId: plan.id } })}
      >
        <Text>{t('viewPlan', { name: t(`plans.${plan.id}.name`) })}</Text>
      </Button>
    </Card>
  );
}
