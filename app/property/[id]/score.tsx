import { Stack, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { Screen } from '@/components/common/Screen';
import { DataNotice } from '@/components/property/DataNotice';
import { PropertyQueryState } from '@/components/property/PropertyQueryState';
import { ScoreBreakdown } from '@/components/property/ScoreBreakdown';
import { ScoreSummaryCard } from '@/components/property/ScoreSummaryCard';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { useProperty } from '@/lib/api/queries';
import { useLocale } from '@/lib/i18n/useLocale';
import { formatStreet } from '@/lib/utils/address';
import { formatDate } from '@/lib/utils/format';

export default function ScoreScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation('property');
  const locale = useLocale();
  const query = useProperty(id);
  const property = query.data;
  return (
    <>
      <Stack.Screen options={{ title: t('score.deepDive') }} />
      {!property ? (
        <PropertyQueryState pending={query.isPending} error={query.isError} retry={query.refetch} />
      ) : (
        <Screen subtitle={formatStreet(property.address, locale)}>
          <View className="gap-6">
            <DataNotice source={property.source} />
            <ScoreSummaryCard score={property.score} propertyId={id} breakdown={false} />
            {property.score ? (
              <>
                <Card className="gap-3">
                  <Text role="heading" variant="h2">
                    {t('score.how')}
                  </Text>
                  <Text variant="muted">{t('score.method')}</Text>
                  <Text variant="caption">{t('score.coverage')}</Text>
                </Card>
                <Card>
                  <ScoreBreakdown score={property.score} detailed />
                </Card>
                <Text variant="caption">
                  {t('score.metadata', {
                    version: property.score.algorithmVersion,
                    date: formatDate(property.score.computedAt, locale),
                  })}
                </Text>
              </>
            ) : null}
          </View>
        </Screen>
      )}
    </>
  );
}
