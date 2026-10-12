import { Image } from 'expo-image';
import { remapProps } from 'nativewind';

remapProps(Image, { className: 'style' });

/** `expo-image` with NativeWind `className` support. Never use React Native's `Image` (spec §2.1). */
export { Image };
