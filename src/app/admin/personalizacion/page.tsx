'use client';

import { useRouter } from 'next/navigation';
import PersonalizationOverview from '@/components/admin/PersonalizationOverview';
import { PersonalizationProvider } from '@/context/PersonalizationContext';

export default function PersonalizacionPage() {
  const router = useRouter();

  const handleNavigate = (section: string) => {
    router.push(`/admin/personalizacion/${section}`);
  };

  return (
    <PersonalizationProvider>
      <div className="container mx-auto px-4 py-8">
        <PersonalizationOverview onNavigate={handleNavigate} />
      </div>
    </PersonalizationProvider>
  );
}
