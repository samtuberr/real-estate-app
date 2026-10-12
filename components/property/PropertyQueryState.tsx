import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, View } from 'react-native';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { usePalette } from '@/lib/usePalette';

export function PropertyQueryState({ pending, error, retry }: { pending: boolean; error: boolean; retry: () => void }) {
  const { t } = useTranslation('property');
  const { t: tc } = useTranslation();
  const palette = usePalette();
  return (
    <View className="flex-1 items-center justify-center bg-background px-5">
      {pending ? (
        <ActivityIndicator color={palette.primary} />
      ) : (
        <EmptyState
          icon="info"
          title={error ? tc('error') : t('notFoundTitle')}
          body={error ? undefined : t('notFoundBody')}
          action={
            <Button variant="secondary" onPress={error ? retry : () => router.replace('/explore')}>
              <Text>{error ? tc('retry') : tc('notFound.action')}</Text>
            </Button>
          }
        />
      )}
    </View>
  );
}
