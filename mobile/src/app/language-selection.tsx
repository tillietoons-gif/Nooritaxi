import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Globe, Check, ArrowLeft } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { saveLanguage, SUPPORTED_LANGUAGES, LanguageCode } from '../lib/i18n';

export default function LanguageSelectionScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [saving, setSaving] = React.useState(false);
  const currentLanguage = i18n.language || 'en';

  const handleLanguageSelect = async (code: LanguageCode) => {
    setSaving(true);
    try {
      await saveLanguage(code);
    } catch (err) {
      console.error('Failed to change language:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Stack.Screen options={{
        title: t('profile.language', 'Language'),
        headerShown: true,
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} className="ml-2">
            <ArrowLeft size={24} color="#1b1b1b" />
          </TouchableOpacity>
        ),
      }} />
      <ScrollView className="flex-1 px-4 py-6">
        <View className="mb-8">
          <View className="bg-primary/10 w-16 h-16 rounded-3xl items-center justify-center mb-4">
            <Globe size={32} color="#006947" />
          </View>
          <Text className="text-2xl font-bold text-foreground">Select Language</Text>
          <Text className="text-muted-foreground mt-2">
            Choose your preferred language for the Noori app.
          </Text>
        </View>

        <View className="space-y-3">
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isSelected = currentLanguage.startsWith(lang.code);
            return (
              <TouchableOpacity
                key={lang.code}
                onPress={() => handleLanguageSelect(lang.code as LanguageCode)}
                disabled={saving}
                className={`flex-row items-center justify-between p-5 rounded-2xl border ${
                  isSelected ? 'bg-primary/5 border-primary' : 'bg-card border-muted/10'
                }`}
              >
                <View>
                  <Text className={`text-lg font-bold ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                    {lang.label}
                  </Text>
                  <Text className="text-muted-foreground text-sm">{lang.nativeLabel}</Text>
                </View>
                {isSelected && (
                  <View className="bg-primary rounded-full p-1">
                    {saving ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Check size={16} color="white" />
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-primary h-14 rounded-xl items-center justify-center mt-10"
        >
          <Text className="text-white text-lg font-bold">Done</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
