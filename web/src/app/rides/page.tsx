import Scene3D from '../../components/interactive/scene-3d';
import LogisticsNetwork from '../../components/interactive/logistics-network';

export default function RidesPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="relative h-screen">
        <Scene3D>
          <LogisticsNetwork focus="rides" />
        </Scene3D>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-6xl font-bold mb-4">Noori Rides</h1>
            <p className="text-2xl">Safe, Fast Rides Across Afghanistan</p>
          </div>
        </div>
      </div>
      {/* More content with 3D elements */}
    </div>
  );
}
