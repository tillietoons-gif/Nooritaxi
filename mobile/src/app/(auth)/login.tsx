import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { ShieldCheck, Phone, Lock, Eye, EyeOff } from 'lucide-react-native';
import { router } from 'expo-router';
import { getSignedInRoute, login } from '../../lib/api';
import { PatternOverlay } from '../../components/PatternOverlay';
import { useTranslation } from 'react-i18next';

export default function LoginScreen() {
  const { t } = useTranslation();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function submit() {
    setMessage('');
    setLoading(true);
    try {
      const session = await login(phone, password);
      router.replace(getSignedInRoute(session.user));
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-8 py-14 relative overflow-hidden">
          <PatternOverlay color="#D4AF37" opacity={0.02} />

          <View className="items-center mb-14 mt-6">
            <View className="bg-card p-6 rounded-4xl mb-6 border border-accent/20 shadow-premium">
              <ShieldCheck size={48} color="#D4AF37" />
            </View>
            <Text className="text-4xl font-extrabold text-accent uppercase tracking-widest text-center">{t('auth.welcome_back')}</Text>
            <Text className="text-muted-foreground text-center mt-3 px-6 font-medium text-sm tracking-wide">{t('auth.login_subtitle')}</Text>
          </View>

          <View className="space-y-6">
            <View className="mb-4">
              <Text className="text-[10px] font-black text-accent uppercase mb-2 ml-1 tracking-widest">{t('auth.phone_number')}</Text>
              <View className="flex-row items-center bg-card h-16 px-5 rounded-2xl border border-border focus:border-accent">
                <Phone size={20} color="#D4AF37" />
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+93 7xx xxx xxx"
                  placeholderTextColor="#7C8E84"
                  className="flex-1 ml-4 text-base font-bold text-foreground"
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <View className="mb-6">
              <Text className="text-[10px] font-black text-accent uppercase mb-2 ml-1 tracking-widest">{t('auth.password')}</Text>
              <View className="flex-row items-center bg-card h-16 px-5 rounded-2xl border border-border focus:border-accent">
                <Lock size={20} color="#D4AF37" />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor="#7C8E84"
                  secureTextEntry={!showPassword}
                  className="flex-1 ml-4 text-base font-bold text-foreground"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="p-2">
                  {showPassword ? <EyeOff size={20} color="#7C8E84" /> : <Eye size={20} color="#7C8E84" />}
                </TouchableOpacity>
              </View>
            </View>

            {message ? (
              <View className="bg-destructive/10 p-4 rounded-2xl border border-destructive/20 mb-4">
                <Text className="text-center text-xs text-destructive font-bold uppercase tracking-widest">{message}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              onPress={submit}
              disabled={loading}
              className={`h-16 rounded-3xl items-center justify-center shadow-premium mt-6 ${loading ? 'bg-muted' : 'bg-primary'}`}
            >
              <Text className="text-white text-base font-black uppercase tracking-widest">
                {loading ? t('auth.processing') : t('auth.secure_login')}
              </Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row justify-center mt-12 gap-2 mb-10 items-center">
            <Text className="text-muted-foreground font-semibold text-sm">{t('auth.new_to_noori')}</Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register' as any)}>
              <Text className="text-accent font-black uppercase text-xs tracking-widest border-b border-accent/40 pb-0.5">{t('auth.create_account')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
