import * as Location from 'expo-location';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Linking } from 'react-native';

import type { LatLng } from '@/lib/domain/types';

function confirm(title: string, body: string, cancel: string, allow: string) {
  return new Promise<boolean>((resolve) => {
    Alert.alert(title, body, [
      { text: cancel, style: 'cancel', onPress: () => resolve(false) },
      { text: allow, onPress: () => resolve(true) },
    ]);
  });
}

/**
 * "Near me" (spec §4.2, §11): location permission is requested only after the user
 * taps the button, behind an in-app explanation. Denial degrades to manual search.
 */
export function useNearMe(onLocated: (position: LatLng) => void) {
  const { t } = useTranslation('explore');
  const { t: tc } = useTranslation();
  const [locating, setLocating] = useState(false);
  const [granted, setGranted] = useState(false);

  async function locate() {
    if (locating) return;
    setLocating(true);
    try {
      let permission = await Location.getForegroundPermissionsAsync();
      if (!permission.granted && permission.canAskAgain) {
        if (!(await confirm(t('locationPrompt.title'), t('locationPrompt.body'), tc('cancel'), t('locationPrompt.allow')))) return;
        permission = await Location.requestForegroundPermissionsAsync();
      }
      if (!permission.granted) {
        if (!permission.canAskAgain) {
          Alert.alert(t('locationDenied.title'), t('locationDenied.body'), [
            { text: tc('cancel'), style: 'cancel' },
            { text: t('locationDenied.settings'), onPress: () => Linking.openSettings() },
          ]);
        }
        return;
      }
      setGranted(true);
      const position =
        (await Location.getLastKnownPositionAsync({ maxAge: 60_000 })) ??
        (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
      onLocated({ lat: position.coords.latitude, lng: position.coords.longitude });
    } catch {
      Alert.alert(t('locationError'));
    } finally {
      setLocating(false);
    }
  }

  return { locate, locating, granted };
}
