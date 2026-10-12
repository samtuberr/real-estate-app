import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';

export function MortgagePrompt({ expired = false, missing = false }: { expired?: boolean; missing?: boolean }) {
  const { t } = useTranslation('mortgage');
  return (
    <Card tone="solar" className="gap-4">
      <Text variant="h2">{t(missing ? 'missingPlan' : expired ? 'taxExpired' : 'startTitle')}</Text>
      {!expired && (
        <Button onPress={() => router.replace('/mortgage')}>
          <Text>{t('backToPlans')}</Text>
        </Button>
      )}
    </Card>
  );
}
