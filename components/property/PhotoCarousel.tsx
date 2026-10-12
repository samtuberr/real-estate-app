import { Link } from 'expo-router';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, useWindowDimensions, View } from 'react-native';

import { Num } from '@/components/common/Num';
import { FlashList } from '@/components/ui/flash-list';
import { Glass } from '@/components/ui/glass';
import { Image } from '@/components/ui/image';
import type { PropertyImage } from '@/lib/domain/types';

type PhotoCarouselProps = { propertyId: string; images: PropertyImage[]; height: number };

/** Swipeable listing photos with blurhash placeholders (spec §4.3). Tap opens the full-screen gallery. */
export function PhotoCarousel({ propertyId, images, height }: PhotoCarouselProps) {
  const { t } = useTranslation('property');
  const { width } = useWindowDimensions();
  const [index, setIndex] = React.useState(0);

  return (
    <View style={{ height }}>
      <FlashList
        data={images}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.url}
        onViewableItemsChanged={({ viewableItems }) => {
          const first = viewableItems[0]?.index;
          if (first != null) setIndex(first);
        }}
        viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
        renderItem={({ item, index: i }) => (
          <Link href={{ pathname: '/property/[id]/gallery', params: { id: propertyId, index: String(i) } }} asChild>
            <Pressable accessibilityRole="imagebutton" accessibilityLabel={t('photoOf', { index: i + 1, total: images.length })}>
              <Image
                source={item.url}
                placeholder={item.blurhash ? { blurhash: item.blurhash } : undefined}
                contentFit="cover"
                transition={200}
                style={{ width, height }}
                accessibilityIgnoresInvertColors
              />
            </Pressable>
          </Link>
        )}
      />
      {images.length > 1 ? (
        <Glass pointerEvents="none" className="absolute bottom-4 end-4 rounded-full px-3 py-1">
          <Num className="font-sans-medium text-caption">{`${index + 1} / ${images.length}`}</Num>
        </Glass>
      ) : null}
    </View>
  );
}
