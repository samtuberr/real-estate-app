import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/common/EmptyState';
import { NebulaGlow } from '@/components/common/Screen';
import { Glass } from '@/components/ui/glass';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

// M2 replaces the body with the full-screen map, clustered markers and listing sheet
// (spec §4.2). The floating glass search bar and controls stay as they are.
export default function ExploreScreen() {
  const { t } = useTranslation('explore');
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-background">
      <NebulaGlow className="-top-24 h-[480px]" />

      <View className="flex-1 justify-center gap-8 px-5">
        <View className="gap-3">
          <Text role="heading" variant="hero">
            {t('title')}
          </Text>
          <Text variant="muted">{t('subtitle')}</Text>
        </View>
        <EmptyState tone="ion" icon="mapPin" title={t('emptyTitle')} body={t('emptyBody')} />
      </View>

      <View className="absolute start-4 end-4 flex-row items-center gap-3" style={{ top: insets.top + 8 }}>
        <Glass className="h-14 flex-1 flex-row items-center gap-3 rounded-full px-5">
          <Icon name="search" size={18} className="text-muted-foreground" />
          <Text className="flex-1 text-muted-foreground" numberOfLines={1}>
            {t('searchPlaceholder')}
          </Text>
        </Glass>
        <Glass interactive className="h-14 w-14 rounded-full">
          <Pressable
            disabled
            accessibilityRole="button"
            accessibilityLabel={t('filters')}
            className="flex-1 items-center justify-center"
          >
            <Icon name="filters" size={20} />
          </Pressable>
        </Glass>
      </View>
    </View>
  );
}
