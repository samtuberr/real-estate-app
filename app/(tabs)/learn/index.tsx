import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { EmptyState } from '@/components/common/EmptyState';
import { Screen } from '@/components/common/Screen';
import { Chip } from '@/components/ui/chip';

type Section = 'guides' | 'glossary';

export default function LearnScreen() {
  const { t } = useTranslation('learn');
  const [section, setSection] = useState<Section>('guides');
  return (
    <Screen subtitle={t('subtitle')}>
      <View className="mb-6 flex-row gap-2">
        {(['guides', 'glossary'] as const).map((key) => (
          <Chip key={key} label={t(key)} selected={section === key} onPress={() => setSection(key)} />
        ))}
      </View>
      <EmptyState tone="nebula" icon="learn" title={t('emptyTitle')} body={t('emptyBody')} />
    </Screen>
  );
}
