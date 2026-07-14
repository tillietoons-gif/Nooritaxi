import React from 'react';
import { View, Text } from 'react-native';
import { Tabs } from 'expo-router';
import { BriefcaseBusiness, Home, Car, UtensilsCrossed, User, Store, ReceiptText } from 'lucide-react-native';
import SessionGuard from '../../lib/SessionGuard';
import { type AuthUser, getStoredUser, isDriverUser, isMerchantUser } from '../../lib/api';
import { useTranslation } from 'react-i18next';

export default function TabsLayout() {
  const { t } = useTranslation();
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
  const isMerchant = isMerchantUser(user);

  return (
    <SessionGuard>
      {user === undefined ? (
        <View className="flex-1 items-center justify-center bg-background px-6">
          <Text className="text-sm font-bold text-accent">{t('common.loading')}</Text>
        </View>
      ) : (
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: '#D4AF37', // Luxurious Glowing Gold for active state
            tabBarInactiveTintColor: '#7C8E84', // Muted deep-emerald gray for inactive state
            tabBarStyle: {
              backgroundColor: '#040806', // Velvet Obsidian deep dark background
              borderTopWidth: 1,
              borderTopColor: 'rgba(212, 175, 55, 0.15)', // Delicate gold borders
              paddingBottom: 6,
              height: 64,
            },
            tabBarLabelStyle: {
              fontSize: 10,
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: 1,
            },
          }}
        >
          <Tabs.Screen
            name="home"
            options={{
              title: isDriver ? t('home.driver') : isMerchant ? t('home.merchant') : t('home.home'),
              tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
            }}
          />
          <Tabs.Screen
            name="work"
            options={isDriver
              ? {
                  title: t('home.work'),
                  tabBarIcon: ({ color, size }) => <BriefcaseBusiness size={size} color={color} />,
                }
              : {
                  href: null,
                }}
          />
          <Tabs.Screen
            name="trips"
            options={isDriver || isMerchant
              ? {
                  href: null,
                }
              : {
                  title: t('trips.title'),
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
            options={isDriver || isMerchant
              ? {
                  href: null,
                }
              : {
                  title: t('food.title'),
                  tabBarIcon: ({ color, size }) => <UtensilsCrossed size={size} color={color} />,
                }}
          />
          <Tabs.Screen
            name="merchant"
            options={isMerchant
              ? {
                  title: t('home.business'),
                  tabBarIcon: ({ color, size }) => <Store size={size} color={color} />,
                }
              : {
                  href: null,
                }}
          />
          <Tabs.Screen
            name="orders"
            options={isMerchant
              ? {
                  title: t('profile.orders', 'Orders'),
                  tabBarIcon: ({ color, size }) => <ReceiptText size={size} color={color} />,
                }
              : {
                  href: null,
                }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: t('home.profile'),
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
