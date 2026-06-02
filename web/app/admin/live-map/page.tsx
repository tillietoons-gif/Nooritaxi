import { Metadata } from 'next';
import dynamic from 'next/dynamic';

export const metadata: Metadata = {
  title: 'Live Driver Map | Nooritaxi Admin',
  description: 'Real-time tracking of all active drivers.',
};

const LiveMap = dynamic(() => import('@/components/admin/LiveMap'), {
  ssr: false,
  loading: () => <div className="flex h-[80vh] items-center justify-center">Loading Map...</div>,
});

export default function LiveMapPage() {
  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-4">Live Driver Tracking</h1>
      <p className="text-gray-600 mb-6">
        This map displays the real-time locations of all drivers with a status of ONLINE or BUSY.
      </p>
      
      <div className="w-full h-[75vh] rounded-lg shadow-lg overflow-hidden border">
        <LiveMap />
      </div>
    </div>
  );
}
