import { useEffect } from 'react';
import { useRouter } from 'next/router';
import SeoHead from '../../components/SeoHead';

export default function Logout() {
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/logout', { method: 'POST' }).then(() => {
      router.push('/');
    });
  }, [router]);

  return <SeoHead title="Logging Out | FounderPostAI" path="/auth/logout" noIndex />;
}
