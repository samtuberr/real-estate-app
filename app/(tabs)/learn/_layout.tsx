import { useTranslation } from 'react-i18next';

import { TabStack } from '@/components/navigation/TabStack';

export default function LearnLayout() {
  const { t } = useTranslation('tabs');
  return <TabStack title={t('learn')} />;
}
