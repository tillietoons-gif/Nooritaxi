import React from 'react';
import { Alert, SafeAreaView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Star } from 'lucide-react-native';
import { createReview, getStoredUser } from '../lib/api';
import { withSessionGuard } from '../lib/SessionGuard';

function ReviewScreen() {
  const params = useLocalSearchParams<{
    targetType: 'DRIVER' | 'RIDER' | 'RESTAURANT';
    tripId?: string;
    orderId?: string;
    deliveryId?: string;
    targetUserId?: string;
    restaurantId?: string;
  }>();
  const [rating, setRating] = React.useState(5);
  const [comment, setComment] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  async function submit() {
    const user = await getStoredUser();
    if (!user || !params.targetType) return;

    try {
      setSaving(true);
      await createReview({
        authorId: user.id,
        targetType: params.targetType,
        rating,
        comment: comment.trim() || undefined,
        tripId: params.tripId || undefined,
        orderId: params.orderId || undefined,
        deliveryId: params.deliveryId || undefined,
        targetUserId: params.targetUserId || undefined,
        restaurantId: params.restaurantId || undefined,
      });
      Alert.alert('Thanks', 'Your review was submitted.', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (err) {
      Alert.alert('Unable to submit review', (err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-6 py-6">
        <Text className="text-2xl font-bold text-foreground mb-6">How was it?</Text>
        <View className="flex-row gap-2 mb-8">
          {[1, 2, 3, 4, 5].map((value) => (
            <TouchableOpacity key={value} onPress={() => setRating(value)} className="p-2">
              <Star size={34} color="#D4AF37" fill={value <= rating ? '#D4AF37' : 'transparent'} />
            </TouchableOpacity>
          ))}
        </View>
        <TextInput
          value={comment}
          onChangeText={setComment}
          placeholder="Add a comment"
          multiline
          className="min-h-32 rounded-3xl border border-muted/20 bg-card p-4 text-base text-foreground"
        />
        <TouchableOpacity
          onPress={submit}
          disabled={saving}
          className={`h-14 rounded-2xl items-center justify-center mt-6 ${saving ? 'bg-muted' : 'bg-primary'}`}
        >
          <Text className="text-white font-black uppercase tracking-widest">{saving ? 'Submitting...' : 'Submit Review'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

export default withSessionGuard(ReviewScreen);
