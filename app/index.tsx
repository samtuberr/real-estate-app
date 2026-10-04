import { Redirect } from 'expo-router';

// M1 adds the onboarding branch: redirect to /(onboarding)/welcome until a profile exists.
export default function Index() {
  return <Redirect href="/explore" />;
}
