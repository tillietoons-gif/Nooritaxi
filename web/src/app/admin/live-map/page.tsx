"use client"

import dynamic from 'next/dynamic';
import { AuthGate } from '@/components/auth-gate';

const LiveMap = dynamic(() => import('@/components/admin/LiveMap'), {
  ssr: false,
  loading: () => <div className="flex h-[80vh] items-center justify-center">Loading Map...</div>,
});

export default function LiveMapPage() {
  return (
    <AuthGate roles={["ADMIN", "SUPPORT"]}>
      <div className="p-4 md:p-6">
        <h1 className="text-2xl font-bold mb-4">Live Driver Tracking</h1>
        <p className="text-muted-foreground mb-6">
          This map displays the real-time locations of all drivers with a status of ONLINE or BUSY.
        </p>
        
        <div className="w-full h-[75vh] rounded-lg shadow-lg overflow-hidden border">
          <LiveMap />
        </div>
      </div>
    </AuthGate>
  );
}
