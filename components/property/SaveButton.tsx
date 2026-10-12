import * as Haptics from 'expo-haptics';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';

import { Glass } from '@/components/ui/glass';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils/cn';
import { useIsSaved, useSavedStore } from '@/stores/saved';

type SaveButtonProps = { id: string; className?: string };

/** Heart toggle on a glass circle, for use over photos and the map. */
export function SaveButton({ id, className }: SaveButtonProps) {
  const { t } = useTranslation();
  const saved = useIsSaved(id);
  const toggle = useSavedStore((s) => s.toggle);
  return (
    <Glass interactive className={cn('h-11 w-11 rounded-full', className)}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={saved ? t('unsave') : t('save')}
        accessibilityState={{ selected: saved }}
        hitSlop={4}
        className="flex-1 items-center justify-center"
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          toggle(id);
        }}
      >
        <Icon name={saved ? 'heartFill' : 'heart'} size={20} className={saved ? 'text-score-low' : 'text-foreground'} />
      </Pressable>
    </Glass>
  );
}
