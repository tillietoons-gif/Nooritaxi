import React from 'react';
import { Alert, Platform, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as Location from 'expo-location';
import { LocateFixed, MapPin, Plus, Search, Trash2 } from 'lucide-react-native';
import { addSavedPlace, getSavedPlaces, PlaceSuggestion, removeSavedPlace, SavedPlace, searchPlaces } from '../lib/api';
import { withSessionGuard } from '../lib/SessionGuard';

function SavedPlacesScreen() {
  const nativeMaps = React.useMemo(
    () => (Platform.OS === 'web' ? null : require('react-native-maps')),
    [],
  );
  const MapView = nativeMaps?.default;
  const Marker = nativeMaps?.Marker;
  const [places, setPlaces] = React.useState<SavedPlace[]>([]);
  const [suggestions, setSuggestions] = React.useState<PlaceSuggestion[]>([]);
  const [label, setLabel] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [coords, setCoords] = React.useState<{ lat: number; lng: number } | null>(null);

  const load = React.useCallback(() => {
    getSavedPlaces().then(setPlaces);
  }, []);

  React.useEffect(load, [load]);

  async function save() {
    if (!label.trim() || !address.trim()) {
      Alert.alert('Missing details', 'Add a label and address.');
      return;
    }
    await addSavedPlace({
      label: label.trim(),
      address: address.trim(),
      lat: coords?.lat,
      lng: coords?.lng,
    });
    setLabel('');
    setAddress('');
    setCoords(null);
    setSuggestions([]);
    load();
  }

  React.useEffect(() => {
    if (address.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(() => {
      searchPlaces(address.trim()).then(setSuggestions).catch(() => setSuggestions([]));
    }, 250);
    return () => clearTimeout(timer);
  }, [address]);

  async function useCurrentLocation() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Location required', 'Allow location to save this place from the map.');
      return;
    }
    const current = await Location.getCurrentPositionAsync({});
    setCoords({ lat: current.coords.latitude, lng: current.coords.longitude });
    if (!address.trim()) setAddress('Current location');
  }

  function selectSuggestion(place: PlaceSuggestion) {
    setAddress(place.address);
    setCoords({ lat: Number(place.lat), lng: Number(place.lng) });
    if (!label.trim()) setLabel(place.name);
    setSuggestions([]);
  }

  async function remove(id: string) {
    await removeSavedPlace(id);
    load();
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 py-6">
          <Text className="text-2xl font-bold text-foreground mb-6">Saved places</Text>
          <View className="bg-card rounded-3xl border border-muted/10 p-5 mb-6">
            <TextInput value={label} onChangeText={setLabel} placeholder="Home, Work, University" className="h-12 border-b border-muted/20 font-bold text-foreground" />
            <View className="flex-row items-center border-b border-muted/20 mt-3">
              <Search size={18} color="#6d7a71" />
              <TextInput value={address} onChangeText={setAddress} placeholder="Search address" className="h-12 flex-1 font-bold text-foreground ml-2" />
              <TouchableOpacity onPress={useCurrentLocation} className="p-2">
                <LocateFixed size={18} color="#006947" />
              </TouchableOpacity>
            </View>
            {suggestions.length ? (
              <View className="mt-3 rounded-2xl border border-muted/10 overflow-hidden">
                {suggestions.map((place) => (
                  <TouchableOpacity key={place.id} onPress={() => selectSuggestion(place)} className="p-3 border-b border-muted/10">
                    <Text className="font-bold text-foreground">{place.name}</Text>
                    <Text className="text-xs text-muted-foreground mt-1">{place.address}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}
            {MapView && coords ? (
              <View className="h-40 rounded-3xl overflow-hidden border border-muted/10 mt-4">
                <MapView
                  style={{ flex: 1 }}
                  region={{
                    latitude: coords.lat,
                    longitude: coords.lng,
                    latitudeDelta: 0.02,
                    longitudeDelta: 0.02,
                  }}
                  onPress={(event: any) => setCoords({
                    lat: event.nativeEvent.coordinate.latitude,
                    lng: event.nativeEvent.coordinate.longitude,
                  })}
                >
                  {Marker ? <Marker coordinate={{ latitude: coords.lat, longitude: coords.lng }} /> : null}
                </MapView>
              </View>
            ) : null}
            <TouchableOpacity onPress={save} className="bg-primary rounded-2xl h-12 items-center justify-center flex-row gap-2 mt-5">
              <Plus size={18} color="#fff" />
              <Text className="text-white font-bold">Save place</Text>
            </TouchableOpacity>
          </View>

          {places.map((place) => (
            <View key={place.id} className="bg-card rounded-2xl border border-muted/10 p-4 mb-3 flex-row items-center justify-between">
              <View className="flex-row items-center gap-3 flex-1 pr-3">
                <MapPin size={20} color="#006947" />
                <View className="flex-1">
                  <Text className="font-bold text-foreground">{place.label}</Text>
                  <Text className="text-xs text-muted-foreground mt-1">{place.address}</Text>
                  {place.lat && place.lng ? (
                    <Text className="text-[10px] text-primary font-bold mt-1">{place.lat.toFixed(4)}, {place.lng.toFixed(4)}</Text>
                  ) : null}
                </View>
              </View>
              <TouchableOpacity onPress={() => remove(place.id)} className="p-2">
                <Trash2 size={18} color="#ba1a1a" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default withSessionGuard(SavedPlacesScreen);
