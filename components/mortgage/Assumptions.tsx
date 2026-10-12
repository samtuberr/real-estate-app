import { useTranslation } from 'react-i18next';
import { Linking } from 'react-native';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { REGULATION } from '@/lib/domain/regulation/config';
import { TAX_2026 } from '@/lib/domain/tax/brackets';

export function Assumptions({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation('mortgage');
  return (
    <Card tone="ion" className="gap-2">
      <Text variant="label">{t('assumptions.title')}</Text>
      <Text variant="caption">{t('assumptions.rates')}</Text>
      {!compact && (
        <>
          <Text variant="caption">{t('assumptions.scope')}</Text>
          <Text variant="caption">{t('assumptions.tax')}</Text>
          <Text variant="caption">{t('assumptions.validity')}</Text>
          <Button variant="ghost" size="sm" onPress={() => Linking.openURL(REGULATION.source)}>
            <Text>{t('assumptions.boi')}</Text>
          </Button>
          <Button variant="ghost" size="sm" onPress={() => Linking.openURL(TAX_2026.source)}>
            <Text>{t('assumptions.ita')}</Text>
          </Button>
        </>
      )}
    </Card>
  );
}
