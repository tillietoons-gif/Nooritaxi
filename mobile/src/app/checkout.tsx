import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, Alert, ActivityIndicator, TextInput } from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { Banknote, ShieldCheck, ChevronLeft } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { getStoredUser, redeemPromotion } from '../lib/api';
import { withSessionGuard } from '../lib/SessionGuard';
import { safeBack } from '../lib/navigation';

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
        { text: 'OK', onPress: () => safeBack(router) }
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
            <TouchableOpacity onPress={() => safeBack(router)} className="p-3 bg-card rounded-2xl border border-border shadow-premium ml-4">
              <ChevronLeft size={20} color="#D4AF37" />
            </TouchableOpacity>
          ),
        }} />
        <ScrollView className="px-6 py-6" showsVerticalScrollIndicator={false}>
          <View className="items-center mb-10 mt-6 bg-card p-6 rounded-4xl border border-accent/20 shadow-premium">
            <Text className="text-accent text-xs font-black uppercase tracking-widest mb-2">{t('checkout.total_amount', 'Total Amount')}</Text>
            <Text className="text-4xl font-black text-foreground tracking-wider">{amountDue.toLocaleString()} {currency}</Text>
            {discount > 0 ? (
              <Text className="text-success font-black mt-2 text-xs uppercase tracking-widest">Saved {discount.toLocaleString()} {currency}</Text>
            ) : null}
          </View>

          <View className="bg-card rounded-3xl border border-border p-5 mb-6 shadow-premium">
            <Text className="font-extrabold text-foreground uppercase tracking-widest text-xs mb-3">Promotion</Text>
            <View className="flex-row gap-2">
              <TextInput
                value={promoCode}
                onChangeText={setPromoCode}
                autoCapitalize="characters"
                placeholder="Promo code"
                placeholderTextColor="#7C8E84"
                className="flex-1 h-12 rounded-xl border border-border px-3 font-bold text-foreground bg-[#040806]"
              />
              <TouchableOpacity
                onPress={applyPromo}
                disabled={applyingPromo || !promoCode.trim() || discount > 0}
                className={`h-12 px-5 rounded-xl items-center justify-center border border-accent/20 ${applyingPromo || discount > 0 ? 'bg-muted' : 'bg-primary'}`}
              >
                <Text className="text-white font-extrabold uppercase tracking-wider text-xs">{applyingPromo ? '...' : 'Apply'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text className="font-black text-foreground uppercase tracking-widest text-base mb-4">{t('checkout.payment_method', 'Payment Method')}</Text>

          <View className="space-y-3">
            <View className="flex-row items-center p-5 rounded-3xl border border-accent/30 bg-primary/10 shadow-premium">
              <View className="w-12 h-12 bg-primary/15 rounded-2xl items-center justify-center mr-4 border border-primary/20 shadow-premium">
                <Banknote size={24} color="#D4AF37" />
              </View>
              <View className="flex-1">
                <Text className="font-black text-base text-foreground uppercase tracking-wide">{t('checkout.cash', 'Cash')}</Text>
                <Text className="text-xs text-muted-foreground mt-1 font-semibold leading-4">{t('checkout.pay_physical_cash', 'Pay cash to the partner')}</Text>
                {discount > 0 ? <Text className="text-xs text-accent font-black uppercase tracking-wider mt-1.5">Discount already applied</Text> : null}
              </View>
              <View className="w-6 h-6 rounded-full border-2 border-accent items-center justify-center">
                <View className="w-3 h-3 rounded-full bg-accent" />
              </View>
            </View>
          </View>

          <View className="flex-row items-center gap-2 mt-8 justify-center opacity-70 mb-4">
            <ShieldCheck size={16} color="#D4AF37" />
            <Text className="text-[10px] text-center font-bold text-muted-foreground uppercase tracking-widest">{t('checkout.secure_payment', 'All payments are encrypted and secure.')}</Text>
          </View>

          <TouchableOpacity
            onPress={processPayment}
            disabled={loading}
            className="bg-primary h-16 rounded-3xl items-center justify-center mt-6 mb-12 border border-accent/20 shadow-premium"
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-base font-black uppercase tracking-widest">{t('checkout.pay', 'Confirm Cash Payment')}</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
    </SafeAreaView>
  );
}

export default withSessionGuard(CheckoutScreen);
