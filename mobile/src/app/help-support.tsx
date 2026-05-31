import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, Linking } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { HelpCircle, Phone, Mail, MessageSquare, ChevronRight, ArrowLeft } from 'lucide-react-native';

const FAQS = [
  { question: 'How do I book a ride?', answer: 'Go to the Trips tab and tap the "Book" button at the top right.' },
  { question: 'How can I top up my wallet?', answer: 'Navigate to the Wallet tab and tap the "Top Up" button.' },
  { question: 'Is Noori available 24/7?', answer: 'Yes, our platform and support team are available around the clock.' },
];

export default function HelpSupportScreen() {
  const router = useRouter();

  const handleContact = (type: 'phone' | 'email') => {
    if (type === 'phone') {
      Linking.openURL('tel:+93700000000');
    } else {
      Linking.openURL('mailto:support@noori.com');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Stack.Screen options={{
        title: 'Help & Support',
        headerShown: true,
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} className="ml-2">
            <ArrowLeft size={24} color="#1b1b1b" />
          </TouchableOpacity>
        ),
      }} />
      <ScrollView className="flex-1 px-4 py-6">
        <View className="mb-10">
          <View className="bg-primary/10 w-16 h-16 rounded-3xl items-center justify-center mb-4">
            <HelpCircle size={32} color="#006947" />
          </View>
          <Text className="text-2xl font-bold text-foreground">How can we help?</Text>
          <Text className="text-muted-foreground mt-2">
            Our support team is available 24/7 to assist you with any issues.
          </Text>
        </View>

        <Text className="text-lg font-bold mb-4">Contact Us</Text>
        <View className="flex-row gap-3 mb-10">
          <TouchableOpacity
            onPress={() => handleContact('phone')}
            className="flex-1 bg-card p-5 rounded-2xl border border-muted/10 items-center"
          >
            <View className="bg-primary/5 p-3 rounded-full mb-3">
              <Phone size={24} color="#006947" />
            </View>
            <Text className="font-bold">Call Us</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleContact('email')}
            className="flex-1 bg-card p-5 rounded-2xl border border-muted/10 items-center"
          >
            <View className="bg-primary/5 p-3 rounded-full mb-3">
              <Mail size={24} color="#006947" />
            </View>
            <Text className="font-bold">Email Us</Text>
          </TouchableOpacity>
        </View>

        <Text className="text-lg font-bold mb-4">Frequently Asked Questions</Text>
        <View className="space-y-3 mb-10">
          {FAQS.map((faq, index) => (
            <View key={index} className="bg-card p-5 rounded-2xl border border-muted/10">
              <Text className="font-bold mb-2">{faq.question}</Text>
              <Text className="text-muted-foreground text-sm">{faq.answer}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity className="flex-row items-center justify-between p-5 bg-primary/5 rounded-2xl border border-primary/20 mb-10">
          <View className="flex-row items-center gap-4">
            <MessageSquare size={22} color="#006947" />
            <Text className="font-bold text-primary">Live Chat Support</Text>
          </View>
          <ChevronRight size={20} color="#006947" />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
