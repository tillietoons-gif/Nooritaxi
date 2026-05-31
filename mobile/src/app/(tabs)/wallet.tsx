import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, TextInput } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Wallet, Plus, ArrowUpRight, ArrowDownRight, CreditCard } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { getStoredUser, getTransactions, getWalletBalance, topUpWallet, WalletTransaction } from '../../lib/api';
import { PatternOverlay } from '../../components/PatternOverlay';

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
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 py-6">
          <Text className="text-2xl font-bold text-foreground mb-6">{t('wallet.title')}</Text>

          {/* High-Tech Wallet Card */}
          <View className="bg-primary p-8 rounded-3xl shadow-high-tech mb-8 overflow-hidden relative">
            <PatternOverlay color="#ffffff" opacity={0.1} />

            <View className="relative z-10">
              <Text className="text-white/70 text-xs font-bold uppercase tracking-widest mb-1">{t('wallet.available_balance')}</Text>
              <Text className="text-white text-4xl font-bold">{loading ? '...' : `${balance} AFN`}</Text>

              <View className="flex-row gap-3 mt-8 items-center">
                <View className="bg-white/10 backdrop-blur-lg rounded-2xl flex-1 border border-white/20 h-14 justify-center px-4">
                  <TextInput
                    value={topUpAmount}
                    onChangeText={setTopUpAmount}
                    placeholder={t('wallet.amount_placeholder')}
                    keyboardType="numeric"
                    className="text-white text-base font-bold"
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    maxLength={8}
                  />
                </View>
                <TouchableOpacity
                  onPress={topUp}
                  className="bg-accent h-14 px-6 rounded-2xl flex-row items-center justify-center shadow-sm"
                >
                  <Plus size={20} color="#002113" />
                  <Text className="text-primary-dark font-bold ml-2">{t('wallet.top_up')}</Text>
                </TouchableOpacity>
              </View>
              {inputError ? <Text className="text-destructive font-bold mt-2 text-xs">{inputError}</Text> : null}
            </View>
          </View>

          {message ? (
            <View className="mb-6 p-4 bg-primary/10 rounded-2xl border border-primary/20">
              <Text className="text-primary font-bold text-sm text-center">{message}</Text>
            </View>
          ) : null}

          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold text-foreground">{t('wallet.recent_transactions')}</Text>
            <TouchableOpacity>
              <Text className="text-primary font-bold text-xs">View All</Text>
            </TouchableOpacity>
          </View>

          <View className="space-y-4">
            {loading ? (
              [1, 2, 3].map((item) => <View key={item} className="h-20 bg-muted/30 rounded-2xl" />)
            ) : transactions.length === 0 ? (
              <View className="items-center py-10 bg-card rounded-3xl border border-muted/20">
                <Wallet size={34} color="#6d7a71" />
                <Text className="mt-3 font-bold text-muted-foreground">{t('wallet.no_activity')}</Text>
              </View>
            ) : (
              transactions.map((tx) => {
                const amount = Number(tx.amount);
                const isIn = amount >= 0;
                return (
                  <View key={tx.id} className="flex-row items-center justify-between p-4 bg-card rounded-2xl border border-muted/10 shadow-sm mb-4">
                    <View className="flex-row items-center gap-4">
                      <View className={`p-3 rounded-2xl ${isIn ? 'bg-success/10' : 'bg-muted/10'}`}>
                        {isIn ? <ArrowDownRight size={20} color="#15803D" /> : <ArrowUpRight size={20} color="#6d7a71" />}
                      </View>
                      <View>
                        <Text className="font-bold text-sm text-foreground">{tx.description ?? tx.type}</Text>
                        <Text className="text-muted-foreground text-[10px] uppercase font-bold">{new Date(tx.createdAt).toLocaleDateString()}</Text>
                      </View>
                    </View>
                    <Text className={`font-bold ${isIn ? 'text-success' : 'text-foreground'}`}>
                      {isIn ? '+' : ''}{amount.toLocaleString()} AFN
                    </Text>
                  </View>
                );
              })
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
