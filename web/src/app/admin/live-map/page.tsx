"use client"

import dynamic from 'next/dynamic';
import { AuthGate } from '@/components/auth-gate';
import { AdminPageHeader } from "@/components/admin/admin-page-header"

const LiveMap = dynamic(() => import('@/components/admin/LiveMap'), {
  ssr: false,
  loading: () => <div className="flex h-[calc(100vh-9rem)] items-center justify-center text-sm text-muted-foreground">Loading map...</div>,
});

export default function LiveMapPage() {
  return (
    <AuthGate roles={["ADMIN", "SUPPORT"]}>
      <main className="flex-1 px-4 py-8 md:px-8">
        <div className="mx-auto flex h-full max-w-7xl flex-col gap-6">
          <AdminPageHeader
            title="Live Map"
            subtitle="Drivers, surge zones, and custom rider places styled for the Noori operations workspace."
          />

          <div className="relative z-10 min-h-[640px] flex-1 overflow-hidden rounded-[1.75rem] border border-primary/15 bg-background/70 shadow-[0_24px_55px_rgba(0,33,20,0.12)]">
            <LiveMap />
          </div>
        </div>
      </main>
    </AuthGate>
  );
}
