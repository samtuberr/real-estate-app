import { router, useLocalSearchParams } from 'expo-router';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Num } from '@/components/common/Num';
import { FlashList } from '@/components/ui/flash-list';
import { Glass } from '@/components/ui/glass';
import { Icon } from '@/components/ui/icon';
import { Image } from '@/components/ui/image';
import { colors } from '@/constants/theme';
import { useProperty } from '@/lib/api/queries';

/** Full-screen photo gallery (spec §3 `property/[id]/gallery`). Always dark, like the system photo viewer. */
export default function GalleryScreen() {
  const { id, index: initial } = useLocalSearchParams<{ id: string; index?: string }>();
  const { t } = useTranslation('property');
  const { t: tc } = useTranslation();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { data: property } = useProperty(id);
  const images = property?.images ?? [];
  const startIndex = Math.min(Number(initial ?? 0) || 0, Math.max(images.length - 1, 0));
  const [index, setIndex] = React.useState(startIndex);

  return (
    <View className="flex-1" style={{ backgroundColor: colors.dark.background }}>
      <FlashList
        data={images}
        horizontal
        pagingEnabled
        initialScrollIndex={startIndex}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.url}
        onViewableItemsChanged={({ viewableItems }) => {
          const first = viewableItems[0]?.index;
          if (first != null) setIndex(first);
        }}
        viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
        renderItem={({ item, index: i }) => (
          <Image
            source={item.url}
            placeholder={item.blurhash ? { blurhash: item.blurhash } : undefined}
            contentFit="contain"
            transition={200}
            style={{ width, height }}
            accessibilityLabel={t('photoOf', { index: i + 1, total: images.length })}
          />
        )}
      />

      <View
        className="absolute start-4 end-4 flex-row items-center justify-between"
        style={{ top: insets.top + 8 }}
        pointerEvents="box-none"
      >
        <Glass className="rounded-full px-4 py-2">
          <Num className="font-sans-medium">{`${index + 1} / ${images.length}`}</Num>
        </Glass>
        <Glass interactive className="h-11 w-11 rounded-full">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={tc('close')}
            className="flex-1 items-center justify-center"
            onPress={() => router.back()}
          >
            <Icon name="close" size={18} />
          </Pressable>
        </Glass>
      </View>
    </View>
  );
}
