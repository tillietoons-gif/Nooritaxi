import React from 'react';
import { View, Text, ScrollView, SafeAreaView } from 'react-native';
import { Car, Clock, MapPin, CheckCircle2 } from 'lucide-react-native';

export default function TripsScreen() {
  const trips = [
    { id: '1', date: 'Oct 24, 2024', route: 'Kabul Airport to Shahr-e Naw', status: 'Completed', amount: '450 AFN' },
    { id: '2', date: 'Oct 22, 2024', route: 'Karte Sakhi to Wazir Akbar Khan', status: 'Completed', amount: '320 AFN' },
    { id: '3', date: 'Oct 20, 2024', route: 'Macroyan 3 to Taimani', status: 'Completed', amount: '280 AFN' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-4 py-6 border-b border-muted/20">
        <Text className="text-2xl font-bold text-primary">Your Trips</Text>
      </View>
      <ScrollView className="flex-1 px-4 py-4">
        {trips.map((trip) => (
          <View key={trip.id} className="bg-card p-5 rounded-2xl border border-muted/10 mb-4 shadow-sm">
            <View className="flex-row justify-between items-start mb-4">
              <View className="bg-primary/10 p-2 rounded-lg">
                <Car size={20} color="#006947" />
              </View>
              <View className="items-end">
                <Text className="font-bold text-base">{trip.amount}</Text>
                <View className="flex-row items-center gap-1">
                  <CheckCircle2 size={12} color="#0e9f6e" />
                  <Text className="text-[10px] text-success font-bold uppercase">{trip.status}</Text>
                </View>
              </View>
            </View>

            <View className="space-y-3">
              <View className="flex-row items-center gap-2">
                <Clock size={14} color="#6d7a71" />
                <Text className="text-xs text-muted-foreground">{trip.date}</Text>
              </View>
              <View className="flex-row items-start gap-2">
                <MapPin size={14} color="#006947" className="mt-1" />
                <Text className="text-sm font-medium flex-1">{trip.route}</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
