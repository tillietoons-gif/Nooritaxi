import React from 'react';
import { ActivityIndicator, Alert, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Plus, Store, UtensilsCrossed } from 'lucide-react-native';
import {
  addRestaurantMenuItem,
  createRestaurant,
  getRestaurantMenu,
  getRestaurants,
  getStoredUser,
  isMerchantUser,
  MenuItem,
  Restaurant,
} from '../../lib/api';
import { PatternOverlay } from '../../components/PatternOverlay';

export default function MerchantScreen() {
  const [restaurant, setRestaurant] = React.useState<Restaurant | null>(null);
  const [menu, setMenu] = React.useState<MenuItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [savingRestaurant, setSavingRestaurant] = React.useState(false);
  const [savingItem, setSavingItem] = React.useState(false);
  const [message, setMessage] = React.useState('');

  const [restaurantName, setRestaurantName] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [cuisines, setCuisines] = React.useState('');

  const [itemName, setItemName] = React.useState('');
  const [itemPrice, setItemPrice] = React.useState('');
  const [itemCategory, setItemCategory] = React.useState('');
  const [itemPrep, setItemPrep] = React.useState('20');
  const [itemDescription, setItemDescription] = React.useState('');

  const loadMerchantRestaurant = React.useCallback(async () => {
    setLoading(true);
    setMessage('');

    try {
      const user = await getStoredUser();
      if (!user) {
        router.replace('/(auth)/login');
        return;
      }

      if (!isMerchantUser(user)) {
        router.replace('/(tabs)/home');
        return;
      }

      const restaurants = await getRestaurants();
      const owned = restaurants.find((item) => item.ownerId === user.id) ?? null;
      setRestaurant(owned);
      setMenu(owned ? await getRestaurantMenu(owned.id) : []);
    } catch (err) {
      setMessage((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadMerchantRestaurant();
    }, [loadMerchantRestaurant]),
  );

  async function handleCreateRestaurant() {
    const user = await getStoredUser();
    if (!user) return;

    const parsedCuisines = cuisines
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);

    if (!restaurantName.trim() || !address.trim() || parsedCuisines.length === 0) {
      Alert.alert('Missing details', 'Restaurant name, address, and at least one cuisine are required.');
      return;
    }

    try {
      setSavingRestaurant(true);
      const created = await createRestaurant({
        ownerId: user.id,
        name: restaurantName.trim(),
        address: address.trim(),
        phone: phone.trim() || undefined,
        cuisineTypes: parsedCuisines,
        avgPrepMinutes: 25,
        deliveryRadius: 5,
      });
      setRestaurant(created);
      setMenu([]);
      setRestaurantName('');
      setAddress('');
      setPhone('');
      setCuisines('');
    } catch (err) {
      Alert.alert('Unable to create restaurant', (err as Error).message);
    } finally {
      setSavingRestaurant(false);
    }
  }

  async function handleAddItem() {
    if (!restaurant) return;

    const price = Number(itemPrice);
    if (!itemName.trim() || !Number.isFinite(price) || price <= 0) {
      Alert.alert('Missing details', 'Menu item name and a valid price are required.');
      return;
    }

    try {
      setSavingItem(true);
      await addRestaurantMenuItem(restaurant.id, {
        name: itemName.trim(),
        description: itemDescription.trim() || undefined,
        price,
        category: itemCategory.trim() || undefined,
        preparationMin: Number(itemPrep) || undefined,
        isAvailable: true,
      });
      setMenu(await getRestaurantMenu(restaurant.id));
      setItemName('');
      setItemPrice('');
      setItemCategory('');
      setItemDescription('');
    } catch (err) {
      Alert.alert('Unable to add menu item', (err as Error).message);
    } finally {
      setSavingItem(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#006947" />
        <Text className="mt-3 text-muted-foreground font-bold">Loading business...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 py-6">
          <View className="bg-primary rounded-3xl p-6 overflow-hidden relative shadow-high-tech mb-6">
            <PatternOverlay color="#ffffff" opacity={0.08} />
            <View className="relative z-10 flex-row items-center justify-between">
              <View className="flex-1 pr-4">
                <Text className="text-white/70 text-[10px] font-bold uppercase tracking-widest mb-2">Merchant workspace</Text>
                <Text className="text-white text-2xl font-black mb-2">{restaurant?.name ?? 'Set up your restaurant'}</Text>
                <Text className="text-white/80 leading-6">
                  {restaurant
                    ? `${menu.length} menu items listed. New orders appear in the Orders tab.`
                    : 'Create your restaurant profile, then add dishes customers can order.'}
                </Text>
              </View>
              <View className="bg-white/15 p-3 rounded-2xl">
                <Store size={24} color="#ffffff" />
              </View>
            </View>
          </View>

          {message ? (
            <View className="bg-destructive/5 p-4 rounded-2xl border border-destructive/10 mb-6">
              <Text className="text-center text-xs text-destructive font-bold uppercase tracking-widest">{message}</Text>
            </View>
          ) : null}

          {!restaurant ? (
            <View className="bg-card rounded-3xl border border-muted/10 p-5 shadow-sm mb-8">
              <Text className="text-lg font-bold text-foreground mb-4">Restaurant details</Text>
              <MerchantInput label="Restaurant name" value={restaurantName} onChangeText={setRestaurantName} placeholder="Kabul Grill" />
              <MerchantInput label="Address" value={address} onChangeText={setAddress} placeholder="Street, district, city" />
              <MerchantInput label="Phone" value={phone} onChangeText={setPhone} placeholder="+93 7xx xxx xxx" keyboardType="phone-pad" />
              <MerchantInput label="Cuisines" value={cuisines} onChangeText={setCuisines} placeholder="Afghan, Grill, Rice" />
              <TouchableOpacity
                onPress={handleCreateRestaurant}
                disabled={savingRestaurant}
                className={`h-14 rounded-2xl items-center justify-center mt-2 ${savingRestaurant ? 'bg-muted' : 'bg-primary'}`}
              >
                <Text className="text-white font-black uppercase tracking-widest">
                  {savingRestaurant ? 'Saving...' : 'Create Restaurant'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View className="bg-card rounded-3xl border border-muted/10 p-5 shadow-sm mb-8">
                <Text className="text-lg font-bold text-foreground mb-4">Add menu item</Text>
                <MerchantInput label="Item name" value={itemName} onChangeText={setItemName} placeholder="Chicken Kabuli Pulao" />
                <MerchantInput label="Price (AFN)" value={itemPrice} onChangeText={setItemPrice} placeholder="350" keyboardType="numeric" />
                <MerchantInput label="Category" value={itemCategory} onChangeText={setItemCategory} placeholder="Main, Drinks, Sides" />
                <MerchantInput label="Prep minutes" value={itemPrep} onChangeText={setItemPrep} placeholder="20" keyboardType="numeric" />
                <MerchantInput label="Description" value={itemDescription} onChangeText={setItemDescription} placeholder="Short dish description" />
                <TouchableOpacity
                  onPress={handleAddItem}
                  disabled={savingItem}
                  className={`h-14 rounded-2xl items-center justify-center flex-row gap-2 mt-2 ${savingItem ? 'bg-muted' : 'bg-primary'}`}
                >
                  <Plus size={18} color="#fff" />
                  <Text className="text-white font-black uppercase tracking-widest">
                    {savingItem ? 'Adding...' : 'Add Item'}
                  </Text>
                </TouchableOpacity>
              </View>

              <Text className="text-lg font-bold text-foreground mb-4">Current menu</Text>
              {menu.length === 0 ? (
                <View className="items-center justify-center py-14 bg-card rounded-3xl border border-muted/10 border-dashed">
                  <UtensilsCrossed size={40} color="#6d7a71" />
                  <Text className="mt-4 font-bold text-muted-foreground">No menu items yet</Text>
                </View>
              ) : (
                menu.map((item) => (
                  <View key={item.id} className="bg-card rounded-2xl border border-muted/10 p-4 mb-3 flex-row items-center justify-between">
                    <View className="flex-1 pr-4">
                      <Text className="font-bold text-foreground">{item.name}</Text>
                      <Text className="text-xs text-muted-foreground mt-1">{item.category ?? 'Menu item'}</Text>
                    </View>
                    <Text className="font-black text-primary">AFN {Number(item.price).toLocaleString()}</Text>
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

function MerchantInput({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'numeric' | 'phone-pad';
}) {
  return (
    <View className="mb-4">
      <Text className="text-xs font-black text-muted-foreground uppercase mb-2 ml-1 tracking-widest">{label}</Text>
      <View className="bg-muted/10 h-14 px-4 rounded-2xl border border-muted/20 justify-center">
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          keyboardType={keyboardType}
          className="text-base font-bold text-foreground"
        />
      </View>
    </View>
  );
}
