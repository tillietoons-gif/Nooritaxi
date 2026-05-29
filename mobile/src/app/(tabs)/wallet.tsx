import React from 'react';
// Trivial edit to trigger scanner re-run for internationalization
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, TextInput } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Wallet, Plus, ArrowUpRight, ArrowDownRight, CreditCard } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { getStoredUser, getTransactions, getWalletBalance, topUpWallet, WalletTransaction } from '../../lib/api';

export default function WalletScreen() {
  const { t } = useTranslation();
  const [balance, setBalance] = React.useState('0');
  const [transactions, setTransactions] = React.useState<WalletTransaction[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [message, setMessage] = React.useState('');
  const [userId, setUserId] = React.useState('');
  const [topUpAmount, setTopUpAmount] = React.useState('');
  const [inputError, setInputError] = React.useState('');

  const loadWallet = React.useCallback(async () => {
    setLoading(true);
    setMessage('');
    try {
      const user = await getStoredUser();
      if (!user) {
        router.replace('/(auth)/login');
        return;
      }
      setUserId(user.id);
      const [wallet, txs] = await Promise.all([
        getWalletBalance(user.id),
        getTransactions(user.id),
      ]);
      setBalance(wallet?.balance ? Number(wallet.balance).toLocaleString() : '0');
      setTransactions(txs);
    } catch (err) {
      setMessage((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadWallet();
    }, [loadWallet]),
  );

  async function topUp() {
    setInputError('');
    setMessage('');
    if (!userId) return;
    const amount = Number(topUpAmount);
    if (!topUpAmount || isNaN(amount) || amount <= 0) {
      setInputError(t('wallet.invalid_amount'));
      return;
    }
    try {
      await topUpWallet(userId, amount);
      await loadWallet();
      setMessage(t('wallet.added', { amount }));
      setTopUpAmount('');
    } catch (err) {
      setMessage((err as Error).message);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-4 py-6">
        <Text className="text-2xl font-bold text-primary mb-6">{t('wallet.title')}</Text>

        <View className="bg-primary p-8 rounded-[32px] shadow-xl shadow-primary/30 mb-8 overflow-hidden relative">
          <View className="relative z-10">
            <Text className="text-white/70 text-sm font-medium mb-1">{t('wallet.available_balance')}</Text>
            <Text className="text-white text-4xl font-bold">{loading ? '...' : `${balance} AFN`}</Text>

            <View className="flex-row gap-4 mt-8 items-center">
              <TextInput
                value={topUpAmount}
                onChangeText={setTopUpAmount}
                placeholder={t('wallet.amount_placeholder')}
                keyboardType="numeric"
                className="bg-white/20 text-white px-4 py-3 rounded-xl w-32 text-base font-bold mr-2"
                placeholderTextColor="#e0e7e3"
                maxLength={8}
              />
              <TouchableOpacity onPress={topUp} className="bg-white/20 px-6 py-3 rounded-xl flex-row items-center gap-2">
                <Plus size={20} color="white" />
                <Text className="text-white font-bold">{t('wallet.top_up')}</Text>
              </TouchableOpacity>
              <TouchableOpacity className="bg-white/20 p-3 rounded-xl">
                <CreditCard size={20} color="white" />
              </TouchableOpacity>
            </View>
            {inputError ? <Text className="text-warning mt-2">{inputError}</Text> : null}
          </View>

          <View className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full" />
          <View className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full" />
        </View>

        {message ? <Text className="mb-4 text-sm text-muted-foreground">{message}</Text> : null}
        <Text className="text-lg font-bold mb-4">{t('wallet.recent_transactions')}</Text>
        <ScrollView className="space-y-4">
          {loading ? (
            [1, 2, 3].map((item) => <View key={item} className="h-20 bg-muted/30 rounded-2xl" />)
          ) : transactions.length === 0 ? (
            <View className="items-center py-10">
              <Wallet size={34} color="#6d7a71" />
              <Text className="mt-3 font-bold">{t('wallet.no_activity')}</Text>
            </View>
          ) : (
            transactions.map((tx) => {
              const amount = Number(tx.amount);
              const isIn = amount >= 0;
              return (
                <View key={tx.id} className="flex-row items-center justify-between p-4 bg-card rounded-2xl border border-muted/10">
                  <View className="flex-row items-center gap-4">
                    <View className={`p-3 rounded-xl ${isIn ? 'bg-success/10' : 'bg-muted/30'}`}>
                      {isIn ? <ArrowDownRight size={20} color="#0e9f6e" /> : <ArrowUpRight size={20} color="#6d7a71" />}
                    </View>
                    <View>
                      <Text className="font-bold text-sm">{tx.description ?? tx.type}</Text>
                      <Text className="text-muted-foreground text-xs">{new Date(tx.createdAt).toLocaleDateString()}</Text>
                    </View>
                  </View>
                  <Text className={`font-bold ${isIn ? 'text-success' : 'text-foreground'}`}>
                    {isIn ? '+' : ''}{amount.toLocaleString()} AFN
                  </Text>
                </View>
              );
            })
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
