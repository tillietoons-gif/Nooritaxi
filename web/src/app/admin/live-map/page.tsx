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
        <div className="mx-auto max-w-7xl space-y-6 h-full flex flex-col">
          <AdminPageHeader
            title="Live Map"
            subtitle="Drivers, surge zones, and custom rider places"
          />

          <div className="flex-1 min-h-[600px] overflow-hidden rounded-lg border bg-background shadow-sm relative z-10">
            <LiveMap />
          </div>
        </div>
      </main>
    </AuthGate>
  );
}
