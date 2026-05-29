
import React from 'react';
import { Tabs } from 'expo-router';
import { Car, Wallet, UtensilsCrossed, User, Bell } from 'lucide-react-native';
import SessionGuard from '../../lib/SessionGuard';

export default function TabsLayout() {
  return (
    <SessionGuard>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#006947',
          tabBarInactiveTintColor: '#6d7a71',
          tabBarStyle: {
            backgroundColor: '#ffffff',
            borderTopColor: '#e0e7e3',
            paddingBottom: 4,
            height: 60,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
          },
        }}
      >
        <Tabs.Screen
          name="trips"
          options={{
            title: 'Trips',
            tabBarIcon: ({ color, size }) => <Car size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="wallet"
          options={{
            title: 'Wallet',
            tabBarIcon: ({ color, size }) => <Wallet size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="food"
          options={{
            title: 'Food',
            tabBarIcon: ({ color, size }) => <UtensilsCrossed size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="notifications"
          options={{
            title: 'Alerts',
            tabBarIcon: ({ color, size }) => <Bell size={size} color={color} />,
          }}
        />
      </Tabs>
    </SessionGuard>
  );
}
