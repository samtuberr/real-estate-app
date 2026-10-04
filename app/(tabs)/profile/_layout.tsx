import { useTranslation } from 'react-i18next';

import { TabStack } from '@/components/navigation/TabStack';

export default function ProfileLayout() {
  const { t } = useTranslation('tabs');
  return <TabStack title={t('profile')} />;
}
