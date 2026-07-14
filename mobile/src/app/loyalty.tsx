import React from 'react';
import { ActivityIndicator, Alert, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Gift, Trophy } from 'lucide-react-native';
import { getMyLoyalty, LoyaltyAccount, LoyaltyTransaction, redeemLoyaltyPoints } from '../lib/api';
import { withSessionGuard } from '../lib/SessionGuard';
import { PatternOverlay } from '../components/PatternOverlay';

function LoyaltyScreen() {
  const [account, setAccount] = React.useState<LoyaltyAccount | null>(null);
  const [transactions, setTransactions] = React.useState<LoyaltyTransaction[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [redeeming, setRedeeming] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMyLoyalty();
      setAccount(data.account);
      setTransactions(data.recentTransactions);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  async function redeem(points: number) {
    try {
      setRedeeming(true);
      await redeemLoyaltyPoints(points, `Mobile redemption: ${points} points`);
      await load();
      Alert.alert('Redeemed', `${points} points were redeemed.`);
    } catch (err) {
      Alert.alert('Unable to redeem', (err as Error).message);
    } finally {
      setRedeeming(false);
    }
  }

  const rewards = [
    { points: 100, title: 'AFN 50 ride credit', detail: 'Best for short city rides and daily commuting.' },
    { points: 250, title: 'Free delivery reward', detail: 'Use toward restaurant delivery fees.' },
    { points: 500, title: 'AFN 350 food discount', detail: 'Save more on larger family orders.' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 py-6">
          {loading ? (
            <View className="py-20"><ActivityIndicator color="#D4AF37" /></View>
          ) : (
            <>
              {/* Ultra-Premium Loyalty Header Card */}
              <View className="bg-card p-8 rounded-4xl shadow-premium mb-8 overflow-hidden relative border border-accent/30">
                <PatternOverlay color="#D4AF37" opacity={0.04} />
                <View className="relative z-10 flex-row items-center justify-between">
                  <View>
                    <Text className="text-accent text-[10px] font-black uppercase tracking-widest">Noori Rewards</Text>
                    <Text className="text-foreground text-4xl font-black mt-2 tracking-wider">{account?.points ?? 0}</Text>
                    <Text className="text-muted-foreground text-xs font-semibold uppercase tracking-wide mt-2">Available points · {account?.tier ?? 'NOORI'} tier</Text>
                  </View>
                  <Trophy size={42} color="#D4AF37" />
                </View>
              </View>

              <View className="bg-card rounded-3xl border border-border p-5 mb-8 shadow-premium">
                <Text className="font-extrabold text-foreground uppercase tracking-widest text-sm mb-4">Redeem rewards</Text>
                {rewards.map((reward) => (
                  <TouchableOpacity
                    key={reward.points}
                    onPress={() => redeem(reward.points)}
                    disabled={redeeming || (account?.points ?? 0) < reward.points}
                    className={`rounded-2xl p-4 mb-4 border ${
                      (account?.points ?? 0) < reward.points
                        ? 'bg-secondary/40 border-border opacity-50'
                        : 'bg-primary/10 border-accent/20 shadow-premium'
                    }`}
                  >
                    <View className="flex-row items-center justify-between gap-3">
                      <View className="flex-row items-center gap-4 flex-1">
                        <Gift size={20} color="#D4AF37" />
                        <View className="flex-1">
                          <Text className="font-bold text-foreground text-sm uppercase tracking-wide">{reward.title}</Text>
                          <Text className="text-xs text-muted-foreground mt-1.5 font-semibold leading-4">{reward.detail}</Text>
                        </View>
                      </View>
                      <Text className="font-black text-accent text-sm tracking-wider">{reward.points} pts</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              <Text className="text-base font-black text-foreground uppercase tracking-widest mb-4">Recent activity</Text>
              {transactions.length === 0 ? (
                <View className="bg-card rounded-3xl p-10 items-center border border-border border-dashed shadow-premium">
                  <Text className="font-bold text-muted-foreground text-xs uppercase tracking-widest">No rewards activity yet</Text>
                </View>
              ) : (
                transactions.map((tx) => (
                  <View key={tx.id} className="bg-card rounded-2xl border border-border p-4 mb-4 flex-row justify-between shadow-premium">
                    <View className="flex-1 pr-4">
                      <Text className="font-extrabold text-foreground text-sm uppercase tracking-wider">{tx.description ?? tx.type}</Text>
                      <Text className="text-xs text-muted-foreground mt-1.5 font-semibold">{new Date(tx.createdAt).toLocaleDateString()}</Text>
                    </View>
                    <Text className={`font-black text-sm ${tx.type === 'CREDIT' ? 'text-accent' : 'text-foreground'}`}>
                      {tx.type === 'CREDIT' ? '+' : ''}{tx.amount}
                    </Text>
                  </View>
                ))
              )}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default withSessionGuard(LoyaltyScreen);
