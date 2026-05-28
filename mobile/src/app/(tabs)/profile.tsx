import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, Switch } from 'react-native';
import { User, Shield, Bell, HelpCircle, LogOut, ChevronRight, Globe } from 'lucide-react-native';

export default function ProfileScreen() {
  const menuItems = [
    { icon: <Shield size={22} color="#006947" />, title: 'Safety Center', subtitle: 'Manage your emergency contacts' },
    { icon: <Bell size={22} color="#006947" />, title: 'Notifications', subtitle: 'Trip alerts and promotions' },
    { icon: <Globe size={22} color="#006947" />, title: 'Language', subtitle: 'English, Dari, Pashto' },
    { icon: <HelpCircle size={22} color="#006947" />, title: 'Help & Support', subtitle: '24/7 Assistance' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-4 py-8">
        <View className="flex-row items-center gap-4 mb-10">
          <View className="w-20 h-20 bg-primary/10 rounded-full items-center justify-center border-4 border-white shadow-sm">
            <User size={40} color="#006947" />
          </View>
          <View>
            <Text className="text-2xl font-bold">Ahmad Khan</Text>
            <Text className="text-muted-foreground">+93 7xx xxx xxx</Text>
          </View>
        </View>

        <View className="space-y-3">
          {menuItems.map((item) => (
            <TouchableOpacity key={item.title} className="flex-row items-center justify-between p-4 bg-card rounded-2xl border border-muted/10">
              <View className="flex-row items-center gap-4">
                <View className="p-2 bg-primary/5 rounded-lg">
                  {item.icon}
                </View>
                <View>
                  <Text className="font-bold text-sm">{item.title}</Text>
                  <Text className="text-muted-foreground text-xs">{item.subtitle}</Text>
                </View>
              </View>
              <ChevronRight size={18} color="#bccac0" />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity className="flex-row items-center gap-3 p-5 mt-10 bg-destructive/5 rounded-2xl border border-destructive/10">
          <LogOut size={20} color="#ba1a1a" />
          <Text className="text-destructive font-bold">Log Out</Text>
        </TouchableOpacity>

        <Text className="text-center text-muted-foreground text-xs mt-10 italic">
          Noori Mobility System v1.0.0
        </Text>
      </View>
    </SafeAreaView>
  );
}
