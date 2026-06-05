"use client"

import dynamic from 'next/dynamic';
import { AuthGate } from '@/components/auth-gate';

const LiveMap = dynamic(() => import('@/components/admin/LiveMap'), {
  ssr: false,
  loading: () => <div className="flex h-[calc(100vh-9rem)] items-center justify-center text-sm text-muted-foreground">Loading map...</div>,
});

export default function LiveMapPage() {
  return (
    <AuthGate roles={["ADMIN", "SUPPORT"]}>
      <div className="h-[calc(100vh-5rem)] min-h-[680px] bg-muted/20 p-3 md:p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Live Map</h1>
            <p className="text-sm text-muted-foreground">Drivers, surge zones, and custom rider places</p>
          </div>
        </div>

        <div className="h-[calc(100%-4.25rem)] overflow-hidden rounded-lg border bg-background shadow-sm">
          <LiveMap />
        </div>
      </div>
    </AuthGate>
  );
}
