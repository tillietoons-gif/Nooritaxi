import React from 'react';
import { ActivityIndicator, Alert, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Gift, Trophy } from 'lucide-react-native';
import { getMyLoyalty, LoyaltyAccount, LoyaltyTransaction, redeemLoyaltyPoints } from '../lib/api';
import { withSessionGuard } from '../lib/SessionGuard';

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

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 py-6">
          {loading ? (
            <View className="py-20"><ActivityIndicator color="#006947" /></View>
          ) : (
            <>
              <View className="bg-primary rounded-3xl p-7 mb-6">
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-white/70 text-[10px] font-black uppercase tracking-widest">Noori Rewards</Text>
                    <Text className="text-white text-4xl font-black mt-2">{account?.points ?? 0}</Text>
                    <Text className="text-white/80 mt-1">Available points · {account?.tier ?? 'NOORI'} tier</Text>
                  </View>
                  <Trophy size={42} color="#D4AF37" />
                </View>
              </View>

              <View className="bg-card rounded-3xl border border-muted/10 p-5 mb-6">
                <Text className="font-bold text-foreground mb-4">Redeem rewards</Text>
                {[100, 250, 500].map((points) => (
                  <TouchableOpacity
                    key={points}
                    onPress={() => redeem(points)}
                    disabled={redeeming || (account?.points ?? 0) < points}
                    className={`flex-row items-center justify-between rounded-2xl p-4 mb-3 ${(account?.points ?? 0) < points ? 'bg-muted/20' : 'bg-primary/5 border border-primary/10'}`}
                  >
                    <View className="flex-row items-center gap-3">
                      <Gift size={20} color="#006947" />
                      <Text className="font-bold text-foreground">{points} point reward</Text>
                    </View>
                    <Text className="font-black text-primary">Redeem</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text className="text-lg font-bold text-foreground mb-4">Recent activity</Text>
              {transactions.length === 0 ? (
                <View className="bg-card rounded-3xl p-8 items-center border border-muted/10">
                  <Text className="font-bold text-muted-foreground">No rewards activity yet</Text>
                </View>
              ) : (
                transactions.map((tx) => (
                  <View key={tx.id} className="bg-card rounded-2xl border border-muted/10 p-4 mb-3 flex-row justify-between">
                    <View className="flex-1 pr-4">
                      <Text className="font-bold text-foreground">{tx.description ?? tx.type}</Text>
                      <Text className="text-xs text-muted-foreground mt-1">{new Date(tx.createdAt).toLocaleDateString()}</Text>
                    </View>
                    <Text className={`font-black ${tx.type === 'CREDIT' ? 'text-primary' : 'text-foreground'}`}>
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
