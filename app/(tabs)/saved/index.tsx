import { Link } from 'expo-router';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, View } from 'react-native';

import { EmptyState } from '@/components/common/EmptyState';
import { NebulaGlow } from '@/components/common/Screen';
import { PropertyCard } from '@/components/property/PropertyCard';
import { Button } from '@/components/ui/button';
import { FlashList } from '@/components/ui/flash-list';
import { Text } from '@/components/ui/text';
import { usePropertiesByIds } from '@/lib/api/queries';
import { usePalette } from '@/lib/usePalette';
import { useSavedStore } from '@/stores/saved';

/** Saved properties (spec §3), most recently saved first. */
export default function SavedScreen() {
  const { t } = useTranslation('saved');
  const { t: tc } = useTranslation();
  const palette = usePalette();
  const ids = useSavedStore((s) => s.ids);
  const { data = [], isPending, isError, refetch } = usePropertiesByIds(ids);
  // Hide a just-unsaved home right away instead of waiting for the refetch.
  const items = data.filter((p) => ids.includes(p.id));

  return (
    <FlashList
      data={items}
      keyExtractor={(item) => item.id}
      contentInsetAdjustmentBehavior="automatic"
      className="flex-1 bg-background"
      contentContainerClassName="px-5 pb-12 pt-2"
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        <>
          <NebulaGlow />
          {items.length > 0 ? (
            <Text variant="muted" className="mb-6">
              {t('subtitle', { count: items.length })}
            </Text>
          ) : null}
        </>
      }
      renderItem={({ item }) => <PropertyCard property={item} className="mb-4" />}
      ListEmptyComponent={
        ids.length > 0 && isPending ? (
          <View className="items-center py-16">
            <ActivityIndicator color={palette.primary} />
          </View>
        ) : isError ? (
          <EmptyState
            icon="info"
            title={tc('error')}
            action={
              <Button variant="secondary" size="sm" className="mt-2" onPress={() => refetch()}>
                <Text>{tc('retry')}</Text>
              </Button>
            }
          />
        ) : (
          <EmptyState
            tone="nebula"
            icon="saved"
            title={t('emptyTitle')}
            body={t('emptyBody')}
            action={
              <Link href="/explore" asChild>
                <Button variant="secondary" size="sm" className="mt-2">
                  <Text>{tc('notFound.action')}</Text>
                </Button>
              </Link>
            }
          />
        )
      }
    />
  );
}
