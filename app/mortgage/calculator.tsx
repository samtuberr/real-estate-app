import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { Screen } from '@/components/common/Screen';
import { Disclaimer } from '@/components/common/Disclaimer';
import { PlanningForm } from '@/components/mortgage/PlanningForm';
import { useMortgageStore } from '@/stores/mortgage';

export default function CalculatorScreen() {
  const { t } = useTranslation('mortgage');
  const { price } = useLocalSearchParams<{ price?: string }>();
  const inputs = useMortgageStore((state) => state.inputs);
  const hasInputs = useMortgageStore((state) => state.hasInputs);
  const parsedPrice = typeof price === 'string' ? Number(price) : NaN;
  const validPrice = Number.isFinite(parsedPrice) && parsedPrice >= 1 && parsedPrice <= 100_000_000;
  const initial = validPrice ? { ...inputs, price: parsedPrice } : inputs;
  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      <Stack.Screen options={{ title: t('calculator') }} />
      <Screen className="gap-6">
        <PlanningForm
          key={validPrice ? price : 'manual'}
          initial={initial}
          isExample={!hasInputs}
          onSubmit={(values) => {
            useMortgageStore.getState().setInputs(values);
            router.replace('/mortgage');
          }}
        />
        <Disclaimer text={t('disclaimer')} />
      </Screen>
    </KeyboardAvoidingView>
  );
}
