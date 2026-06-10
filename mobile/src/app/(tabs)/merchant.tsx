import React from 'react';
import { ActivityIndicator, Alert, SafeAreaView, ScrollView, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Plus, Store, UtensilsCrossed } from 'lucide-react-native';
import {
  addRestaurantMenuItem,
  createPromotion,
  createSupportTicket,
  createRestaurant,
  deleteRestaurantMenuItem,
  getRestaurantMenu,
  getRestaurants,
  getStoredUser,
  isMerchantUser,
  MenuItem,
  Restaurant,
  updateRestaurantMenuItem,
} from '../../lib/api';
import { PatternOverlay } from '../../components/PatternOverlay';

export default function MerchantScreen() {
  const [restaurant, setRestaurant] = React.useState<Restaurant | null>(null);
  const [menu, setMenu] = React.useState<MenuItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [savingRestaurant, setSavingRestaurant] = React.useState(false);
  const [savingItem, setSavingItem] = React.useState(false);
  const [editingItemId, setEditingItemId] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState('');

  const [restaurantName, setRestaurantName] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [cuisines, setCuisines] = React.useState('');

  const [itemName, setItemName] = React.useState('');
  const [itemPrice, setItemPrice] = React.useState('');
  const [itemCategory, setItemCategory] = React.useState('');
  const [itemPrep, setItemPrep] = React.useState('20');
  const [itemImageUrl, setItemImageUrl] = React.useState('');
  const [itemDescription, setItemDescription] = React.useState('');
  const [itemAvailable, setItemAvailable] = React.useState(true);
  const [licenseUrl, setLicenseUrl] = React.useState('');
  const [ownerIdUrl, setOwnerIdUrl] = React.useState('');
  const [payoutPhone, setPayoutPhone] = React.useState('');
  const [submittingOnboarding, setSubmittingOnboarding] = React.useState(false);
  const [promoCode, setPromoCode] = React.useState('');
  const [promoTitle, setPromoTitle] = React.useState('');
  const [promoValue, setPromoValue] = React.useState('10');
  const [savingPromo, setSavingPromo] = React.useState(false);

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
      if (licenseUrl.trim() || ownerIdUrl.trim() || payoutPhone.trim()) {
        await createSupportTicket({
          requesterId: user.id,
          category: 'MERCHANT_ONBOARDING',
          subject: `Merchant onboarding: ${restaurantName.trim()}`,
          description: 'Merchant submitted restaurant onboarding details for admin review.',
          priority: 'NORMAL',
          metadata: {
            restaurantId: created.id,
            businessLicenseUrl: licenseUrl.trim() || null,
            ownerIdUrl: ownerIdUrl.trim() || null,
            payoutPhone: payoutPhone.trim() || null,
          },
        }).catch(() => undefined);
      }
      setRestaurantName('');
      setAddress('');
      setPhone('');
      setCuisines('');
      setLicenseUrl('');
      setOwnerIdUrl('');
      setPayoutPhone('');
    } catch (err) {
      Alert.alert('Unable to create restaurant', (err as Error).message);
    } finally {
      setSavingRestaurant(false);
    }
  }

  async function submitOnboardingReview() {
    const user = await getStoredUser();
    if (!user || !restaurant) return;

    try {
      setSubmittingOnboarding(true);
      await createSupportTicket({
        requesterId: user.id,
        category: 'MERCHANT_ONBOARDING',
        subject: `Merchant verification: ${restaurant.name}`,
        description: 'Merchant submitted business verification details for admin approval.',
        priority: 'NORMAL',
        metadata: {
          restaurantId: restaurant.id,
          businessLicenseUrl: licenseUrl.trim() || null,
          ownerIdUrl: ownerIdUrl.trim() || null,
          payoutPhone: payoutPhone.trim() || null,
        },
      });
      Alert.alert('Submitted', 'Your merchant verification request was sent for admin review.');
      setLicenseUrl('');
      setOwnerIdUrl('');
      setPayoutPhone('');
    } catch (err) {
      Alert.alert('Unable to submit request', (err as Error).message);
    } finally {
      setSubmittingOnboarding(false);
    }
  }

  async function handleCreatePromotion() {
    const value = Number(promoValue);
    if (!promoCode.trim() || !promoTitle.trim() || !Number.isFinite(value) || value <= 0) {
      Alert.alert('Missing details', 'Promo code, title, and discount value are required.');
      return;
    }

    try {
      setSavingPromo(true);
      const now = new Date();
      const endsAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
      await createPromotion({
        code: promoCode.trim().toUpperCase(),
        title: promoTitle.trim(),
        description: `${value}% off food orders`,
        type: 'PERCENTAGE',
        scope: 'FOOD',
        value,
        startsAt: now.toISOString(),
        endsAt: endsAt.toISOString(),
      });
      Alert.alert('Promotion created', 'Customers can now see this promotion.');
      setPromoCode('');
      setPromoTitle('');
      setPromoValue('10');
    } catch (err) {
      Alert.alert('Unable to create promotion', (err as Error).message);
    } finally {
      setSavingPromo(false);
    }
  }

  function resetItemForm() {
    setEditingItemId(null);
    setItemName('');
    setItemPrice('');
    setItemCategory('');
    setItemPrep('20');
    setItemImageUrl('');
    setItemDescription('');
    setItemAvailable(true);
  }

  function startEditItem(item: MenuItem) {
    setEditingItemId(item.id);
    setItemName(item.name);
    setItemPrice(String(item.price));
    setItemCategory(item.category ?? '');
    setItemPrep(String(item.preparationMin ?? 20));
    setItemImageUrl(item.imageUrl ?? '');
    setItemDescription(item.description ?? '');
    setItemAvailable(item.isAvailable !== false);
  }

  async function handleSaveItem() {
    if (!restaurant) return;

    const price = Number(itemPrice);
    if (!itemName.trim() || !Number.isFinite(price) || price <= 0) {
      Alert.alert('Missing details', 'Menu item name and a valid price are required.');
      return;
    }

    try {
      setSavingItem(true);
      const payload = {
        name: itemName.trim(),
        description: itemDescription.trim() || undefined,
        price,
        imageUrl: itemImageUrl.trim() || undefined,
        category: itemCategory.trim() || undefined,
        preparationMin: Number(itemPrep) || undefined,
        isAvailable: itemAvailable,
      };

      if (editingItemId) {
        await updateRestaurantMenuItem(restaurant.id, editingItemId, payload);
      } else {
        await addRestaurantMenuItem(restaurant.id, payload);
      }
      setMenu(await getRestaurantMenu(restaurant.id));
      resetItemForm();
    } catch (err) {
      Alert.alert('Unable to save menu item', (err as Error).message);
    } finally {
      setSavingItem(false);
    }
  }

  async function toggleAvailability(item: MenuItem) {
    if (!restaurant) return;
    try {
      await updateRestaurantMenuItem(restaurant.id, item.id, {
        isAvailable: item.isAvailable === false,
      });
      setMenu(await getRestaurantMenu(restaurant.id));
    } catch (err) {
      Alert.alert('Unable to update availability', (err as Error).message);
    }
  }

  function removeItem(item: MenuItem) {
    if (!restaurant) return;
    Alert.alert(
      `Remove ${item.name}?`,
      'The item will be hidden from customers but kept for order history.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteRestaurantMenuItem(restaurant.id, item.id);
              setMenu((current) => current.filter((entry) => entry.id !== item.id));
              if (editingItemId === item.id) resetItemForm();
            } catch (err) {
              Alert.alert('Unable to remove item', (err as Error).message);
            }
          },
        },
      ],
    );
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
              <MerchantInput label="Business license URL" value={licenseUrl} onChangeText={setLicenseUrl} placeholder="https://..." />
              <MerchantInput label="Owner ID URL" value={ownerIdUrl} onChangeText={setOwnerIdUrl} placeholder="https://..." />
              <MerchantInput label="Payout phone" value={payoutPhone} onChangeText={setPayoutPhone} placeholder="+93 7xx xxx xxx" keyboardType="phone-pad" />
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
                <Text className="text-lg font-bold text-foreground mb-2">Verification</Text>
                <Text className="text-xs text-muted-foreground mb-4">
                  Submit business license, owner ID, and payout contact for admin approval.
                </Text>
                <MerchantInput label="Business license URL" value={licenseUrl} onChangeText={setLicenseUrl} placeholder="https://..." />
                <MerchantInput label="Owner ID URL" value={ownerIdUrl} onChangeText={setOwnerIdUrl} placeholder="https://..." />
                <MerchantInput label="Payout phone" value={payoutPhone} onChangeText={setPayoutPhone} placeholder="+93 7xx xxx xxx" keyboardType="phone-pad" />
                <TouchableOpacity
                  onPress={submitOnboardingReview}
                  disabled={submittingOnboarding}
                  className={`h-14 rounded-2xl items-center justify-center ${submittingOnboarding ? 'bg-muted' : 'bg-secondary/60 border border-accent/20'}`}
                >
                  <Text className="text-foreground font-black uppercase tracking-widest">
                    {submittingOnboarding ? 'Submitting...' : 'Submit For Review'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View className="bg-card rounded-3xl border border-muted/10 p-5 shadow-sm mb-8">
                <Text className="text-lg font-bold text-foreground mb-2">Merchant discount</Text>
                <Text className="text-xs text-muted-foreground mb-4">
                  Create a two-week food promotion for customers.
                </Text>
                <MerchantInput label="Promo code" value={promoCode} onChangeText={setPromoCode} placeholder="KABUL10" />
                <MerchantInput label="Title" value={promoTitle} onChangeText={setPromoTitle} placeholder="Lunch special" />
                <MerchantInput label="Percent off" value={promoValue} onChangeText={setPromoValue} placeholder="10" keyboardType="numeric" />
                <TouchableOpacity
                  onPress={handleCreatePromotion}
                  disabled={savingPromo}
                  className={`h-14 rounded-2xl items-center justify-center ${savingPromo ? 'bg-muted' : 'bg-primary'}`}
                >
                  <Text className="text-white font-black uppercase tracking-widest">
                    {savingPromo ? 'Creating...' : 'Create Promotion'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View className="bg-card rounded-3xl border border-muted/10 p-5 shadow-sm mb-8">
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-lg font-bold text-foreground">{editingItemId ? 'Edit menu item' : 'Add menu item'}</Text>
                  {editingItemId ? (
                    <TouchableOpacity onPress={resetItemForm}>
                      <Text className="text-xs font-black uppercase tracking-widest text-primary">Cancel</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
                <MerchantInput label="Item name" value={itemName} onChangeText={setItemName} placeholder="Chicken Kabuli Pulao" />
                <MerchantInput label="Price (AFN)" value={itemPrice} onChangeText={setItemPrice} placeholder="350" keyboardType="numeric" />
                <MerchantInput label="Category" value={itemCategory} onChangeText={setItemCategory} placeholder="Main, Drinks, Sides" />
                <MerchantInput label="Prep minutes" value={itemPrep} onChangeText={setItemPrep} placeholder="20" keyboardType="numeric" />
                <MerchantInput label="Photo URL" value={itemImageUrl} onChangeText={setItemImageUrl} placeholder="https://..." />
                <MerchantInput label="Description" value={itemDescription} onChangeText={setItemDescription} placeholder="Short dish description" />
                <View className="mb-4 flex-row items-center justify-between rounded-2xl border border-muted/20 bg-muted/10 px-4 py-3">
                  <View>
                    <Text className="text-xs font-black text-muted-foreground uppercase tracking-widest">Available</Text>
                    <Text className="text-xs text-muted-foreground mt-1">Turn off to mark out of stock.</Text>
                  </View>
                  <Switch value={itemAvailable} onValueChange={setItemAvailable} />
                </View>
                <TouchableOpacity
                  onPress={handleSaveItem}
                  disabled={savingItem}
                  className={`h-14 rounded-2xl items-center justify-center flex-row gap-2 mt-2 ${savingItem ? 'bg-muted' : 'bg-primary'}`}
                >
                  <Plus size={18} color="#fff" />
                  <Text className="text-white font-black uppercase tracking-widest">
                    {savingItem ? 'Saving...' : editingItemId ? 'Save Item' : 'Add Item'}
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
                  <View key={item.id} className="bg-card rounded-2xl border border-muted/10 p-4 mb-3">
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1 pr-4">
                      <Text className="font-bold text-foreground">{item.name}</Text>
                      <Text className="text-xs text-muted-foreground mt-1">{item.category ?? 'Menu item'}</Text>
                        <Text className={`text-[10px] font-black uppercase tracking-widest mt-2 ${item.isAvailable === false ? 'text-destructive' : 'text-success'}`}>
                          {item.isAvailable === false ? 'Out of stock' : 'Available'}
                        </Text>
                      </View>
                      <Text className="font-black text-primary">AFN {Number(item.price).toLocaleString()}</Text>
                    </View>
                    <View className="flex-row gap-2 mt-4">
                      <TouchableOpacity
                        onPress={() => startEditItem(item)}
                        className="flex-1 rounded-xl border border-muted/20 bg-muted/10 py-2 items-center"
                      >
                        <Text className="text-xs font-bold text-foreground">Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => toggleAvailability(item)}
                        className="flex-1 rounded-xl border border-primary/15 bg-primary/5 py-2 items-center"
                      >
                        <Text className="text-xs font-bold text-primary">
                          {item.isAvailable === false ? 'Restock' : 'Out of stock'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => removeItem(item)}
                        className="rounded-xl border border-destructive/15 bg-destructive/5 px-4 py-2 items-center"
                      >
                        <Text className="text-xs font-bold text-destructive">Remove</Text>
                      </TouchableOpacity>
                    </View>
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
