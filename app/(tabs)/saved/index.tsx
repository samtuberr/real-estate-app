import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components/common/EmptyState';
import { Screen } from '@/components/common/Screen';

export default function SavedScreen() {
  const { t } = useTranslation('saved');
  return (
    <Screen>
      <EmptyState tone="nebula" icon="saved" title={t('emptyTitle')} body={t('emptyBody')} />
    </Screen>
  );
}
