import React from 'react';
import { Alert, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MapPin, Plus, Trash2 } from 'lucide-react-native';
import { addSavedPlace, getSavedPlaces, removeSavedPlace, SavedPlace } from '../lib/api';
import { withSessionGuard } from '../lib/SessionGuard';

function SavedPlacesScreen() {
  const [places, setPlaces] = React.useState<SavedPlace[]>([]);
  const [label, setLabel] = React.useState('');
  const [address, setAddress] = React.useState('');

  const load = React.useCallback(() => {
    getSavedPlaces().then(setPlaces);
  }, []);

  React.useEffect(load, [load]);

  async function save() {
    if (!label.trim() || !address.trim()) {
      Alert.alert('Missing details', 'Add a label and address.');
      return;
    }
    await addSavedPlace({ label: label.trim(), address: address.trim() });
    setLabel('');
    setAddress('');
    load();
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
            <TextInput value={address} onChangeText={setAddress} placeholder="Address" className="h-12 border-b border-muted/20 font-bold text-foreground mt-3" />
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
