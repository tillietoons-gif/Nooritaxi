import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { ShieldCheck, Phone, Lock, Eye, EyeOff, ChevronLeft } from 'lucide-react-native';
import { Link, router } from 'expo-router';
import { login } from '../../lib/api';
import { PatternOverlay } from '../../components/PatternOverlay';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function submit() {
    setMessage('');
    setLoading(true);
    try {
      await login(phone, password);
      router.replace('/(tabs)/home');
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-8 py-12 relative overflow-hidden">
          <PatternOverlay color="#006947" opacity={0.03} />

          <View className="items-center mb-12">
            <View className="bg-primary/10 p-6 rounded-4xl mb-6 shadow-sm border border-primary/5">
              <ShieldCheck size={48} color="#006947" />
            </View>
            <Text className="text-3xl font-black text-primary uppercase tracking-tighter">Welcome Back</Text>
            <Text className="text-muted-foreground text-center mt-2 px-6 font-medium">Securely access your Noori account.</Text>
          </View>

          <View className="space-y-6">
            <View>
              <Text className="text-xs font-black text-muted-foreground uppercase mb-2 ml-1 tracking-widest">Phone Number</Text>
              <View className="flex-row items-center bg-card h-16 px-5 rounded-2xl border border-muted/20 shadow-sm">
                <Phone size={20} color="#006947" />
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+93 7xx xxx xxx"
                  className="flex-1 ml-4 text-base font-bold text-foreground"
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <View>
              <Text className="text-xs font-black text-muted-foreground uppercase mb-2 ml-1 tracking-widest">Password</Text>
              <View className="flex-row items-center bg-card h-16 px-5 rounded-2xl border border-muted/20 shadow-sm">
                <Lock size={20} color="#006947" />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  secureTextEntry={!showPassword}
                  className="flex-1 ml-4 text-base font-bold text-foreground"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="p-2">
                  {showPassword ? <EyeOff size={20} color="#6d7a71" /> : <Eye size={20} color="#6d7a71" />}
                </TouchableOpacity>
              </View>
            </View>

            {message ? (
              <View className="bg-destructive/5 p-4 rounded-2xl border border-destructive/10">
                <Text className="text-center text-xs text-destructive font-bold uppercase tracking-widest">{message}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              onPress={submit}
              disabled={loading}
              className={`h-16 rounded-3xl items-center justify-center shadow-lg mt-4 ${loading ? 'bg-muted' : 'bg-primary shadow-primary/30'}`}
            >
              <Text className="text-white text-lg font-black uppercase tracking-widest">
                {loading ? 'Processing...' : 'Secure Login'}
              </Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row justify-center mt-10 gap-1 mb-10 items-center">
            <Text className="text-muted-foreground font-medium">New to Noori?</Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register' as any)}>
              <Text className="text-primary font-black uppercase text-xs tracking-widest border-b border-primary/30 pb-0.5">Create Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
