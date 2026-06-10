import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, Alert, ActivityIndicator, TextInput } from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { Banknote, ShieldCheck, ArrowLeft } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { getStoredUser, redeemPromotion } from '../lib/api';
import { withSessionGuard } from '../lib/SessionGuard';

function CheckoutScreen() {
  const { t } = useTranslation();
  const { amount, currency = 'AFN', type = 'TRIP', orderId, tripId } = useLocalSearchParams();
  const [loading, setLoading] = React.useState(false);
  const [promoCode, setPromoCode] = React.useState('');
  const [discount, setDiscount] = React.useState(0);
  const [applyingPromo, setApplyingPromo] = React.useState(false);
  const baseAmount = Number(amount ?? 0);
  const amountDue = Math.max(baseAmount - discount, 0);

  async function applyPromo() {
    const user = await getStoredUser();
    if (!user || !promoCode.trim()) return;

    try {
      setApplyingPromo(true);
      const result = await redeemPromotion({
        code: promoCode.trim().toUpperCase(),
        userId: user.id,
        orderId: orderId ? String(orderId) : undefined,
        tripId: tripId ? String(tripId) : undefined,
        spend: baseAmount,
      });
      setDiscount(Number(result.discount ?? 0));
      Alert.alert('Promotion applied', `Discount: ${Number(result.discount ?? 0).toLocaleString()} ${currency}`);
    } catch (err) {
      Alert.alert('Promo unavailable', (err as Error).message);
    } finally {
      setApplyingPromo(false);
    }
  }

  async function processPayment() {
    try {
      setLoading(true);
      Alert.alert('Success', `Your ${String(type).toLowerCase()} is confirmed. Please pay cash to the partner.`, [
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
        <Stack.Screen options={{
          headerShown: true,
          title: t('checkout.title', 'Checkout'),
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} className="ml-2">
              <ArrowLeft size={24} color="#1b1b1b" />
            </TouchableOpacity>
          ),
        }} />
        <ScrollView className="px-4 py-6">
          <View className="items-center mb-10 mt-6">
            <Text className="text-muted-foreground text-base mb-2">{t('checkout.total_amount', 'Total Amount')}</Text>
            <Text className="text-4xl font-bold text-primary">{amountDue.toLocaleString()} {currency}</Text>
            {discount > 0 ? (
              <Text className="text-success font-bold mt-2">Saved {discount.toLocaleString()} {currency}</Text>
            ) : null}
          </View>

          <View className="bg-card rounded-2xl border border-muted/20 p-4 mb-6">
            <Text className="font-bold text-foreground mb-3">Promotion</Text>
            <View className="flex-row gap-2">
              <TextInput
                value={promoCode}
                onChangeText={setPromoCode}
                autoCapitalize="characters"
                placeholder="Promo code"
                className="flex-1 h-12 rounded-xl border border-muted/20 px-3 font-bold text-foreground"
              />
              <TouchableOpacity
                onPress={applyPromo}
                disabled={applyingPromo || !promoCode.trim() || discount > 0}
                className={`h-12 px-5 rounded-xl items-center justify-center ${applyingPromo || discount > 0 ? 'bg-muted' : 'bg-primary'}`}
              >
                <Text className="text-white font-bold">{applyingPromo ? '...' : 'Apply'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text className="font-bold text-lg mb-4">{t('checkout.payment_method', 'Payment Method')}</Text>

          <View className="space-y-3">
            <View className="flex-row items-center p-4 rounded-2xl border border-primary bg-primary/5">
              <View className="w-12 h-12 bg-orange-500/10 rounded-full items-center justify-center mr-4">
                <Banknote size={24} color="#f97316" />
              </View>
              <View className="flex-1">
                <Text className="font-bold text-base text-foreground">{t('checkout.cash', 'Cash')}</Text>
                <Text className="text-xs text-muted-foreground">{t('checkout.pay_physical_cash', 'Pay cash to the partner')}</Text>
                {discount > 0 ? <Text className="text-xs text-success font-bold mt-1">Discount already applied</Text> : null}
              </View>
              <View className="w-6 h-6 rounded-full border-2 border-primary items-center justify-center">
                <View className="w-3 h-3 rounded-full bg-primary" />
              </View>
            </View>
          </View>

          <View className="flex-row items-center gap-2 mt-8 justify-center opacity-60">
            <ShieldCheck size={16} color="#6d7a71" />
            <Text className="text-xs text-center">{t('checkout.secure_payment', 'All payments are encrypted and secure.')}</Text>
          </View>

          <TouchableOpacity
            onPress={processPayment}
            disabled={loading}
            className="bg-primary h-14 rounded-xl items-center justify-center mt-8 mb-6 shadow-md shadow-primary/20"
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-lg font-bold">{t('checkout.pay', 'Confirm Cash Payment')}</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
    </SafeAreaView>
  );
}

export default withSessionGuard(CheckoutScreen);
