import React from 'react';
import { View, Text, ScrollView, SafeAreaView } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { getStoredUser, getTransactions, getWalletBalance, WalletTransaction } from '../../lib/api';
import { PatternOverlay } from '../../components/PatternOverlay';

export default function WalletScreen() {
  const { t } = useTranslation();
  const [balance, setBalance] = React.useState('0');
  const [transactions, setTransactions] = React.useState<WalletTransaction[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [message, setMessage] = React.useState('');

  const loadWallet = React.useCallback(async () => {
    setLoading(true);
    setMessage('');
    try {
      const user = await getStoredUser();
      if (!user) {
        router.replace('/(auth)/login');
        return;
      }
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

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 py-6">
          <Text className="text-2xl font-black text-foreground uppercase tracking-wider mb-6">{t('wallet.title')}</Text>

          {/* Premium Metal Card Layout */}
          <View className="bg-card p-8 rounded-4xl shadow-premium mb-8 overflow-hidden relative border border-accent/30">
            <PatternOverlay color="#D4AF37" opacity={0.04} />

            <View className="relative z-10">
              <Text className="text-accent text-[10px] font-black uppercase tracking-widest mb-1.5">{t('wallet.available_balance')}</Text>
              <Text className="text-foreground text-4xl font-black tracking-wider">{loading ? '...' : `${balance} AFN`}</Text>

              <View className="mt-6 rounded-2xl border border-border bg-[#040806] p-4">
                <Text className="text-muted-foreground text-xs leading-5 font-semibold uppercase">{t('wallet.cash_only_notice')}</Text>
              </View>
            </View>
          </View>

          {message ? (
            <View className="mb-6 p-4 bg-primary/10 rounded-2xl border border-primary/20">
              <Text className="text-accent font-bold text-sm text-center">{message}</Text>
            </View>
          ) : null}

          <Text className="text-base font-black text-foreground uppercase tracking-widest mb-4">{t('wallet.recent_transactions')}</Text>

          <View className="space-y-4">
            {loading ? (
              [1, 2, 3].map((item) => <View key={item} className="h-20 bg-card border border-border rounded-2xl mb-4 opacity-50" />)
            ) : transactions.length === 0 ? (
              <View className="items-center py-12 bg-card rounded-3xl border border-border border-dashed shadow-premium">
                <Wallet size={34} color="#7C8E84" />
                <Text className="mt-3 font-black text-muted-foreground text-xs uppercase tracking-widest">{t('wallet.no_activity')}</Text>
              </View>
            ) : (
              transactions.map((tx) => {
                const amount = Number(tx.amount);
                const isIn = amount >= 0;
                return (
                  <View key={tx.id} className="flex-row items-center justify-between p-4 bg-card rounded-2xl border border-border shadow-premium mb-4">
                    <View className="flex-row items-center gap-4">
                      <View className={`p-3 rounded-2xl ${isIn ? 'bg-success/10 border border-success/20' : 'bg-secondary border border-border'}`}>
                        {isIn ? <ArrowDownRight size={20} color="#00C853" /> : <ArrowUpRight size={20} color="#7C8E84" />}
                      </View>
                      <View>
                        <Text className="font-extrabold text-sm text-foreground uppercase tracking-wider">{tx.description ?? tx.type}</Text>
                        <Text className="text-muted-foreground text-[10px] uppercase font-bold tracking-widest mt-1">{new Date(tx.createdAt).toLocaleDateString()}</Text>
                      </View>
                    </View>
                    <Text className={`font-black text-sm ${isIn ? 'text-success' : 'text-foreground'}`}>
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
