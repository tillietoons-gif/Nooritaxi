import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { CreditCard, Wallet, Banknote, ShieldCheck } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { getStoredUser, API_URL } from '../lib/api';

export default function CheckoutScreen() {
  const { t } = useTranslation();
  const { amount, currency = 'AFN', orderId, tripId, deliveryId, type = 'TRIP' } = useLocalSearchParams();
  const [method, setMethod] = React.useState('WALLET');
  const [loading, setLoading] = React.useState(false);

  async function processPayment() {
    try {
      setLoading(true);
      const user = await getStoredUser();
      if (!user) {
        router.replace('/(auth)/login');
        return;
      }

      if (method === 'WALLET') {
        const res = await fetch(`${API_URL}/wallet/transfer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            amount: Number(amount),
            currency,
            description: `Payment for ${type}`,
            orderId, tripId, deliveryId
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || 'Insufficient wallet balance');
        }
      } else {
        // HESABPAY or CASH
        const res = await fetch(`${API_URL}/payments/intent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            amount: Number(amount),
            currency,
            provider: method,
            orderId, tripId, deliveryId
          }),
        });
        
        if (!res.ok) throw new Error('Failed to initialize payment');
        
        // Mock verification
        if (method === 'HESABPAY') {
          const { intentId } = await res.json();
          await fetch(`${API_URL}/payments/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ intentId, providerRef: 'MOCK_REF_123' })
          });
        }
      }

      Alert.alert('Success', 'Payment processed successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (err) {
      Alert.alert('Payment Failed', (err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="px-4 py-6">
        <View className="items-center mb-10 mt-6">
          <Text className="text-muted-foreground text-base mb-2">Total Amount</Text>
          <Text className="text-4xl font-bold text-primary">{amount} {currency}</Text>
        </View>

        <Text className="font-bold text-lg mb-4">Payment Method</Text>

        <View className="space-y-3">
          <TouchableOpacity 
            onPress={() => setMethod('WALLET')}
            className={`flex-row items-center p-4 rounded-2xl border ${method === 'WALLET' ? 'border-primary bg-primary/5' : 'border-muted/20 bg-card'}`}
          >
            <View className="w-12 h-12 bg-primary/10 rounded-full items-center justify-center mr-4">
              <Wallet size={24} color="#006947" />
            </View>
            <View className="flex-1">
              <Text className="font-bold text-base">Noori Wallet</Text>
              <Text className="text-xs text-muted-foreground">Pay instantly from balance</Text>
            </View>
            <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${method === 'WALLET' ? 'border-primary' : 'border-muted/30'}`}>
              {method === 'WALLET' && <View className="w-3 h-3 rounded-full bg-primary" />}
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => setMethod('HESABPAY')}
            className={`flex-row items-center p-4 rounded-2xl border ${method === 'HESABPAY' ? 'border-primary bg-primary/5' : 'border-muted/20 bg-card'}`}
          >
            <View className="w-12 h-12 bg-blue-500/10 rounded-full items-center justify-center mr-4">
              <CreditCard size={24} color="#3b82f6" />
            </View>
            <View className="flex-1">
              <Text className="font-bold text-base">HesabPay</Text>
              <Text className="text-xs text-muted-foreground">Digital wallet / Bank transfer</Text>
            </View>
            <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${method === 'HESABPAY' ? 'border-primary' : 'border-muted/30'}`}>
              {method === 'HESABPAY' && <View className="w-3 h-3 rounded-full bg-primary" />}
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => setMethod('CASH')}
            className={`flex-row items-center p-4 rounded-2xl border ${method === 'CASH' ? 'border-primary bg-primary/5' : 'border-muted/20 bg-card'}`}
          >
            <View className="w-12 h-12 bg-orange-500/10 rounded-full items-center justify-center mr-4">
              <Banknote size={24} color="#f97316" />
            </View>
            <View className="flex-1">
              <Text className="font-bold text-base">Cash</Text>
              <Text className="text-xs text-muted-foreground">Pay physical cash</Text>
            </View>
            <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${method === 'CASH' ? 'border-primary' : 'border-muted/30'}`}>
              {method === 'CASH' && <View className="w-3 h-3 rounded-full bg-primary" />}
            </View>
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center gap-2 mt-8 justify-center opacity-60">
          <ShieldCheck size={16} color="#6d7a71" />
          <Text className="text-xs text-center">Secure, encrypted payment processing</Text>
        </View>

        <TouchableOpacity 
          onPress={processPayment} 
          disabled={loading}
          className="bg-primary h-14 rounded-xl items-center justify-center mt-8 mb-6"
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-lg font-bold">Pay {amount} {currency}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
