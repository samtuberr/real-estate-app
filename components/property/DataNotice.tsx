import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';

export function DataNotice({ source }: { source: string }) {
  const { t } = useTranslation('property');
  return source === 'mock' ? (
    <Card tone="ion" className="gap-1 py-3">
      <Text variant="label">{t('demo.title')}</Text>
      <Text variant="caption">{t('demo.body')}</Text>
    </Card>
  ) : null;
}
