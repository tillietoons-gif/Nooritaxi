import React from 'react';
import { View, Text } from 'react-native';
import { Tabs } from 'expo-router';
import { BriefcaseBusiness, Home, Car, UtensilsCrossed, User } from 'lucide-react-native';
import SessionGuard from '../../lib/SessionGuard';
import { type AuthUser, getStoredUser, isDriverUser } from '../../lib/api';

export default function TabsLayout() {
  const [user, setUser] = React.useState<AuthUser | null | undefined>(undefined);

  React.useEffect(() => {
    let mounted = true;

    getStoredUser()
      .then((storedUser) => {
        if (mounted) {
          setUser(storedUser);
        }
      })
      .catch(() => {
        if (mounted) {
          setUser(null);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const isDriver = isDriverUser(user);

  return (
    <SessionGuard>
      {user === undefined ? (
        <View className="flex-1 items-center justify-center bg-background px-6">
          <Text className="text-sm font-bold text-muted-foreground">Loading workspace...</Text>
        </View>
      ) : (
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
            name="home"
            options={{
              title: isDriver ? 'Driver' : 'Home',
              tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
            }}
          />
          <Tabs.Screen
            name="work"
            options={isDriver
              ? {
                  title: 'Work',
                  tabBarIcon: ({ color, size }) => <BriefcaseBusiness size={size} color={color} />,
                }
              : {
                  href: null,
                }}
          />
          <Tabs.Screen
            name="trips"
            options={isDriver
              ? {
                  href: null,
                }
              : {
                  title: 'Trips',
                  tabBarIcon: ({ color, size }) => <Car size={size} color={color} />,
                }}
          />
          <Tabs.Screen
            name="wallet"
            options={{
              href: null,
            }}
          />
          <Tabs.Screen
            name="food"
            options={isDriver
              ? {
                  href: null,
                }
              : {
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
              href: null,
            }}
          />
        </Tabs>
      )}
    </SessionGuard>
  );
}
