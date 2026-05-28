import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { Wallet, Plus, ArrowUpRight, ArrowDownRight, CreditCard } from 'lucide-react-native';

export default function WalletScreen() {
  const transactions = [
    { id: '1', title: 'Funds Added', date: 'Oct 24', amount: '+1,000 AFN', type: 'in' },
    { id: '2', title: 'Trip Payment', date: 'Oct 24', amount: '-450 AFN', type: 'out' },
    { id: '3', title: 'Trip Payment', date: 'Oct 22', amount: '-320 AFN', type: 'out' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-4 py-6">
        <Text className="text-2xl font-bold text-primary mb-6">Wallet</Text>

        <View className="bg-primary p-8 rounded-[32px] shadow-xl shadow-primary/30 mb-8 overflow-hidden relative">
          <View className="relative z-10">
            <Text className="text-white/70 text-sm font-medium mb-1">Available Balance</Text>
            <Text className="text-white text-4xl font-bold">2,450 AFN</Text>

            <View className="flex-row gap-4 mt-8">
              <TouchableOpacity className="bg-white/20 px-6 py-3 rounded-xl flex-row items-center gap-2">
                <Plus size={20} color="white" />
                <Text className="text-white font-bold">Top Up</Text>
              </TouchableOpacity>
              <TouchableOpacity className="bg-white/20 p-3 rounded-xl">
                <CreditCard size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Abstract Decorations */}
          <View className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full" />
          <View className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full" />
        </View>

        <Text className="text-lg font-bold mb-4">Recent Transactions</Text>
        <ScrollView className="space-y-4">
          {transactions.map((tx) => (
            <View key={tx.id} className="flex-row items-center justify-between p-4 bg-card rounded-2xl border border-muted/10">
              <View className="flex-row items-center gap-4">
                <View className={`p-3 rounded-xl ${tx.type === 'in' ? 'bg-success/10' : 'bg-muted/30'}`}>
                  {tx.type === 'in' ? <ArrowDownRight size={20} color="#0e9f6e" /> : <ArrowUpRight size={20} color="#6d7a71" />}
                </View>
                <View>
                  <Text className="font-bold text-sm">{tx.title}</Text>
                  <Text className="text-muted-foreground text-xs">{tx.date}</Text>
                </View>
              </View>
              <Text className={`font-bold ${tx.type === 'in' ? 'text-success' : 'text-foreground'}`}>
                {tx.amount}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
