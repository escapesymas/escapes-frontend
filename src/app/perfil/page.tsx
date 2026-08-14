'use client';

import React, { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../components/Header';
import BottomNav from '../../components/BottomNav';
import ProfileView from '../../components/ProfileView';
import { Loader2 } from 'lucide-react';

export default function PerfilPage() {
  const router = useRouter();

  return (
    <div className="bg-background text-foreground flex flex-col font-sans min-h-screen">
      <Header
        selectedBike=""
        onOpenBikeSelector={() => router.push('/?openSelector=true')}
        onCartClick={() => router.push('/?tab=cart')}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 pb-28 md:pb-8">
        <Suspense fallback={
          <div className="min-h-[50vh] flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-accent animate-spin" />
          </div>
        }>
          <ProfileView />
        </Suspense>
      </main>

      <BottomNav
        activeTab="profile"
        onTabChange={(tabId) => {
          if (tabId === 'profile') return;
          if (tabId === 'catalog') {
            router.push('/universales');
          } else {
            router.push(`/?tab=${tabId}`);
          }
        }}
      />
    </div>
  );
}
