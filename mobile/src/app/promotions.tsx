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
          <Text className="text-2xl font-bold text-foreground mb-6">Promotions</Text>
          {loading ? (
            <ActivityIndicator color="#006947" />
          ) : promotions.length === 0 ? (
            <View className="bg-card rounded-3xl border border-muted/10 border-dashed p-10 items-center">
              <BadgePercent size={42} color="#6d7a71" />
              <Text className="font-bold text-muted-foreground mt-4">No active promotions</Text>
            </View>
          ) : (
            promotions.map((promo) => (
              <View key={promo.id} className="bg-card rounded-3xl border border-muted/10 p-5 mb-4">
                <View className="flex-row items-start gap-4">
                  <View className="bg-accent/10 p-3 rounded-2xl">
                    <BadgePercent size={24} color="#D4AF37" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg font-black text-foreground">{promo.title}</Text>
                    <Text className="text-muted-foreground mt-1">{promo.description ?? 'Use this offer before it expires.'}</Text>
                    <Text className="text-primary font-black uppercase tracking-widest text-xs mt-3">{promo.code}</Text>
                    <Text className="text-xs text-muted-foreground mt-1">Expires {new Date(promo.endsAt).toLocaleDateString()}</Text>
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
