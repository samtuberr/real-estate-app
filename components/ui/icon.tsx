import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { cssInterop } from 'nativewind';
import * as React from 'react';

import { icons, type IconName } from '@/constants/icons';
import { cn } from '@/lib/utils/cn';

type IconProps = Omit<SymbolViewProps, 'name'> & { name: IconName; className?: string };

function IconBase({ name, size = 22, ...props }: IconProps) {
  return <SymbolView name={icons[name]} size={size} {...props} />;
}

cssInterop(IconBase, {
  className: { target: 'style', nativeStyleToProp: { color: 'tintColor' } },
});

/**
 * SF Symbol on iOS, Material Symbol on Android/web, styled with NativeWind:
 * `<Icon name="search" className="text-primary" />`. Directional icons
 * (`chevronForward`) mirror automatically in RTL.
 */
export function Icon({ className, ...props }: IconProps) {
  return <IconBase className={cn('text-foreground', className)} {...props} />;
}
