import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { ShieldCheck, Phone, Lock, Eye, EyeOff } from 'lucide-react-native';
import { Link, router } from 'expo-router';
import { login } from '../../lib/api';

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
      <ScrollView className="flex-1 px-8 py-10">
        <View className="items-center mb-10">
          <ShieldCheck size={48} color="#006947" />
          <Text className="text-2xl font-bold text-primary mt-4">Log In</Text>
          <Text className="text-muted-foreground text-center mt-2 px-4">Access your Noori account.</Text>
        </View>

        <View className="space-y-5">
          <View>
            <Text className="text-xs font-bold text-muted-foreground uppercase mb-2 ml-1">Phone Number</Text>
            <View className="flex-row items-center bg-muted/30 h-14 px-4 rounded-xl">
              <Phone size={20} color="#6d7a71" />
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="+93 7xx xxx xxx"
                className="flex-1 ml-3 text-base"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View>
            <Text className="text-xs font-bold text-muted-foreground uppercase mb-2 ml-1">Password</Text>
            <View className="flex-row items-center bg-muted/30 h-14 px-4 rounded-xl">
              <Lock size={20} color="#6d7a71" />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                secureTextEntry={!showPassword}
                className="flex-1 ml-3 text-base"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="p-2">
                {showPassword ? <EyeOff size={20} color="#6d7a71" /> : <Eye size={20} color="#6d7a71" />}
              </TouchableOpacity>
            </View>
          </View>

          {message ? <Text className="text-center text-sm text-muted-foreground">{message}</Text> : null}

          <TouchableOpacity onPress={submit} disabled={loading} className="bg-primary h-14 rounded-xl items-center justify-center shadow-lg shadow-primary/20 mt-6">
            <Text className="text-white text-lg font-bold">{loading ? 'Logging in...' : 'Log In'}</Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row justify-center mt-8 gap-1 mb-10">
          <Text className="text-muted-foreground">New to Noori?</Text>
          <Link href="/(auth)/register">
            <Text className="text-primary font-bold">Create Account</Text>
          </Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
