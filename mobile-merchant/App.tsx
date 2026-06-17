import { StatusBar } from 'expo-status-bar';
import MerchantDashboardScreen from './src/screens/MerchantDashboardScreen';

export default function App() {
  return (
    <>
      <MerchantDashboardScreen />
      <StatusBar style="auto" />
    </>
  );
}
