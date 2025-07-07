import { useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/(tabs)/math');  // Redirect to math screen by default
  }, []);

  return null;
}