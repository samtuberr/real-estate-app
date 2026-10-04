import { Link, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

export default function NotFoundScreen() {
  const { t } = useTranslation();
  return (
    <>
      <Stack.Screen options={{ title: t('notFound.title') }} />
      <View className="flex-1 justify-center bg-background p-5">
        <EmptyState
          icon="mapOff"
          title={t('notFound.title')}
          body={t('notFound.body')}
          action={
            <Link href="/explore" asChild>
              <Button className="mt-2">
                <Text>{t('notFound.action')}</Text>
              </Button>
            </Link>
          }
        />
      </View>
    </>
  );
}
