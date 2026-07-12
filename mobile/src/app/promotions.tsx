import React from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, Text, View } from 'react-native';
import { BadgePercent } from 'lucide-react-native';
import { getPromotions, Promotion } from '../lib/api';
import { withSessionGuard } from '../lib/SessionGuard';

function PromotionsScreen() {
  const [promotions, setPromotions] = React.useState<Promotion[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    getPromotions()
      .then(setPromotions)
      .finally(() => setLoading(false));
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 py-6">
          <Text className="text-2xl font-black text-foreground uppercase tracking-wider mb-6">Promotions</Text>
          {loading ? (
            <ActivityIndicator color="#D4AF37" />
          ) : promotions.length === 0 ? (
            <View className="bg-card rounded-3xl border border-border border-dashed p-10 items-center shadow-premium">
              <BadgePercent size={42} color="#7C8E84" />
              <Text className="font-bold text-muted-foreground mt-4 text-xs uppercase tracking-widest">No active promotions</Text>
            </View>
          ) : (
            promotions.map((promo) => (
              <View key={promo.id} className="bg-card rounded-3xl border border-accent/20 p-5 mb-5 shadow-premium">
                <View className="flex-row items-start gap-4">
                  <View className="bg-primary/10 p-3 rounded-2xl border border-primary/20 shadow-premium">
                    <BadgePercent size={24} color="#D4AF37" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg font-black text-foreground uppercase tracking-wide">{promo.title}</Text>
                    <Text className="text-muted-foreground mt-1.5 text-xs font-semibold leading-5">{promo.description ?? 'Use this offer before it expires.'}</Text>
                    <Text className="text-accent font-black uppercase tracking-widest text-xs mt-4">{promo.code}</Text>
                    <Text className="text-[10px] text-muted-foreground mt-1 font-bold uppercase">Expires {new Date(promo.endsAt).toLocaleDateString()}</Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default withSessionGuard(PromotionsScreen);
