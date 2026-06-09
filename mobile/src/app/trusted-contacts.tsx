import React from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  SafeAreaView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Trash2, UserPlus } from 'lucide-react-native';
import {
  addTrustedContact,
  listTrustedContacts,
  removeTrustedContact,
  type TrustedContact,
} from '../lib/api';
import { withSessionGuard } from '../lib/SessionGuard';

function TrustedContactsScreen() {
  const router = useRouter();
  const [contacts, setContacts] = React.useState<TrustedContact[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [name, setName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [relation, setRelation] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await listTrustedContacts();
      setContacts(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load contacts');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const handleAdd = React.useCallback(async () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert('Missing info', 'Both name and phone are required.');
      return;
    }
    setSubmitting(true);
    try {
      await addTrustedContact({
        name: name.trim(),
        phone: phone.trim(),
        relation: relation.trim() || undefined,
      });
      setName('');
      setPhone('');
      setRelation('');
      await load();
    } catch (err) {
      Alert.alert('Could not save', err instanceof Error ? err.message : 'Please try again');
    } finally {
      setSubmitting(false);
    }
  }, [name, phone, relation, load]);

  const handleRemove = React.useCallback(
    (contact: TrustedContact) => {
      Alert.alert(
        `Remove ${contact.name}?`,
        'They will no longer be notified if you trigger SOS.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: async () => {
              try {
                await removeTrustedContact(contact.id);
                setContacts((current) => current.filter((c) => c.id !== contact.id));
              } catch (err) {
                Alert.alert(
                  'Could not remove',
                  err instanceof Error ? err.message : 'Please try again',
                );
              }
            },
          },
        ],
      );
    },
    [],
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
        <Stack.Screen options={{ title: 'Trusted Contacts' }} />
        <View className="px-4 py-5">
          <Text className="text-2xl font-bold text-primary">Trusted Contacts</Text>
          <Text className="text-muted-foreground text-sm">
            We will notify these people if you trigger SOS during a trip.
          </Text>
        </View>

        <View className="mx-4 mb-4 rounded-2xl border border-muted/20 bg-card p-4">
          <Text className="font-bold mb-3">Add a contact</Text>
          <TextInput
            placeholder="Name"
            value={name}
            onChangeText={setName}
            className="border-b border-muted/20 py-2"
          />
          <TextInput
            placeholder="Phone (+93…)"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            className="border-b border-muted/20 py-2"
          />
          <TextInput
            placeholder="Relation (optional, e.g. brother)"
            value={relation}
            onChangeText={setRelation}
            className="border-b border-muted/20 py-2"
          />
          <Pressable
            onPress={handleAdd}
            disabled={submitting}
            className={`mt-3 flex-row items-center justify-center gap-2 rounded-md bg-primary py-3 ${
              submitting ? 'opacity-60' : ''
            }`}
          >
            <UserPlus size={18} color="#fff" />
            <Text className="text-white font-bold">{submitting ? 'Saving…' : 'Add contact'}</Text>
          </Pressable>
        </View>

        {loading ? (
          <ActivityIndicator className="mt-6" />
        ) : error ? (
          <Text className="px-4 text-destructive">{error}</Text>
        ) : (
          <FlatList
            data={contacts}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
            ListEmptyComponent={
              <Text className="text-muted-foreground text-sm">
                No contacts yet. Add at least one trusted person before your next trip.
              </Text>
            }
            renderItem={({ item }) => (
              <View className="flex-row items-center justify-between rounded-xl border border-muted/20 bg-card p-4 mb-2">
                <View className="flex-1 pr-3">
                  <Text className="font-bold">{item.name}</Text>
                  <Text className="text-xs text-muted-foreground">
                    {item.phone}
                    {item.relation ? ` · ${item.relation}` : ''}
                  </Text>
                </View>
                <Pressable
                  onPress={() => handleRemove(item)}
                  accessibilityLabel={`Remove ${item.name}`}
                  className="p-2"
                >
                  <Trash2 size={18} color="#b91c1c" />
                </Pressable>
              </View>
            )}
          />
        )}
    </SafeAreaView>
  );
}

export default withSessionGuard(TrustedContactsScreen);
