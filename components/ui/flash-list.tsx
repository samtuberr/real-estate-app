import { FlashList } from '@shopify/flash-list';
import { cssInterop } from 'nativewind';

cssInterop(FlashList, { className: 'style', contentContainerClassName: 'contentContainerStyle' });

/** FlashList v2 with NativeWind `className` / `contentContainerClassName`. Use for any list over 20 items (spec §2.1). */
export { FlashList };
