import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { Disclaimer } from '@/components/common/Disclaimer';
import { Screen } from '@/components/common/Screen';
import { PlansMap } from '@/components/map/PlansMap';
import { PlanDetails } from '@/components/property/ContextSections';
import { DataNotice } from '@/components/property/DataNotice';
import { PropertyQueryState } from '@/components/property/PropertyQueryState';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { useProperty } from '@/lib/api/queries';
import { useLocalized } from '@/lib/i18n/useLocalized';

export default function PlansScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation('property');
  const localized = useLocalized();
  const query = useProperty(id);
  const property = query.data;
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <>
      <Stack.Screen options={{ title: t('plans.title') }} />
      {!property ? (
        <PropertyQueryState pending={query.isPending} error={query.isError} retry={query.refetch} />
      ) : (
        <Screen>
          <View className="gap-5">
            <DataNotice source={property.source} />
            <Text variant="muted">{t('plans.radius')}</Text>
            {property.plans?.length ? (
              <>
                <View className="h-72 overflow-hidden rounded-3xl">
                  <PlansMap
                    location={property.location}
                    plans={property.plans}
                    selectedId={selected}
                    onSelect={setSelected}
                  />
                </View>
                <Text variant="caption">{t('plans.select')}</Text>
                <View role="radiogroup" accessibilityLabel={t('plans.title')} className="gap-5">
                  {property.plans.map((plan) => (
                    <Pressable
                      key={plan.id}
                      accessibilityRole="radio"
                      aria-checked={selected === plan.id}
                      accessibilityLabel={t('plans.selectPlan', { name: localized(plan.name) })}
                      onPress={() => setSelected(plan.id)}
                    >
                      <Card tone={selected === plan.id ? 'ion' : 'default'}>
                        <PlanDetails plan={plan} />
                      </Card>
                    </Pressable>
                  ))}
                </View>
              </>
            ) : (
              <Card>
                <Text variant="muted">{t(property.plans ? 'plans.empty' : 'context.unavailable')}</Text>
              </Card>
            )}
            <Disclaimer text={t('plans.disclaimer')} />
          </View>
        </Screen>
      )}
    </>
  );
}
