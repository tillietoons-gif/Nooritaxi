import React from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { ShieldCheck, User, Phone, Lock, Eye, EyeOff } from 'lucide-react-native';
import { router } from 'expo-router';
import { AuthResponse, AuthRole, getSignedInRoute, refreshCurrentUser, register, sendOtp, verifyPhone } from '../../lib/api';
import { PatternOverlay } from '../../components/PatternOverlay';
import { useTranslation } from 'react-i18next';

export default function RegisterScreen() {
  const { t } = useTranslation();
  const [name, setName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [role, setRole] = React.useState<AuthRole>('RIDER');
  const [otpCode, setOtpCode] = React.useState('');
  const [pendingSession, setPendingSession] = React.useState<AuthResponse | null>(null);
  const [message, setMessage] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  async function submit() {
    setMessage('');
    setLoading(true);
    try {
      const session = await register(name, phone, password, role);
      await sendOtp(phone);
      setPendingSession(session);
      setMessage(t('auth.verification_code_sent', 'Account created. Enter the verification code sent to your phone.'));
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function verifyAndContinue() {
    if (!pendingSession) return;
    setMessage('');
    setLoading(true);
    try {
      await verifyPhone(phone, otpCode);
      const user = await refreshCurrentUser();
      router.replace(getSignedInRoute(user));
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
            <Text className="text-4xl font-extrabold text-accent uppercase tracking-widest text-center">{t('auth.get_started')}</Text>
            <Text className="text-muted-foreground text-center mt-3 px-6 font-medium text-sm tracking-wide leading-5">
              {role === 'DRIVER'
                ? t('auth.driver_subtitle')
                : role === 'MERCHANT'
                  ? t('auth.merchant_subtitle')
                  : t('auth.rider_subtitle')}
            </Text>
          </View>

          <View className="space-y-6">
            <View className="mb-4">
              <Text className="text-[10px] font-black text-accent uppercase mb-3 ml-1 tracking-widest">{t('auth.account_type')}</Text>
              <View className="flex-row rounded-3xl bg-card border border-border p-1">
                {([
                  { id: 'RIDER', label: t('auth.rider') },
                  { id: 'DRIVER', label: t('auth.driver') },
                  { id: 'MERCHANT', label: t('auth.merchant') },
                ] as const).map((option) => {
                  const active = role === option.id;
                  return (
                    <TouchableOpacity
                      key={option.id}
                      onPress={() => setRole(option.id)}
                      className={`flex-1 rounded-[20px] py-3.5 items-center justify-center ${active ? 'bg-primary border border-accent/20' : 'bg-transparent'}`}
                    >
                      <Text className={`font-black uppercase tracking-widest text-[10px] ${active ? 'text-white' : 'text-muted-foreground'}`}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {pendingSession ? (
              <View className="mb-4">
                <Text className="text-[10px] font-black text-accent uppercase mb-2 ml-1 tracking-widest">
                  {t('auth.phone_verification', 'Phone verification')}
                </Text>
                <View className="flex-row items-center bg-card h-16 px-5 rounded-2xl border border-border focus:border-accent">
                  <ShieldCheck size={20} color="#D4AF37" />
                  <TextInput
                    value={otpCode}
                    onChangeText={setOtpCode}
                    placeholder="000000"
                    placeholderTextColor="#7C8E84"
                    className="flex-1 ml-4 text-base font-bold text-foreground tracking-widest"
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                </View>
              </View>
            ) : null}

            <View className="mb-4">
              <Text className="text-[10px] font-black text-accent uppercase mb-2 ml-1 tracking-widest">{t('auth.full_name')}</Text>
              <View className="flex-row items-center bg-card h-16 px-5 rounded-2xl border border-border focus:border-accent">
                <User size={20} color="#D4AF37" />
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder={t('auth.your_name')}
                  placeholderTextColor="#7C8E84"
                  className="flex-1 ml-4 text-base font-bold text-foreground"
                />
              </View>
            </View>

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
              disabled={loading || Boolean(pendingSession)}
              className={`h-16 rounded-3xl items-center justify-center shadow-premium mt-6 ${loading || Boolean(pendingSession) ? 'bg-muted' : 'bg-primary'}`}
            >
              <Text className="text-white text-base font-black uppercase tracking-widest">
                {loading ? t('auth.creating') : role === 'DRIVER' ? t('auth.create_driver_account') : role === 'MERCHANT' ? t('auth.create_merchant_account') : t('auth.sign_up')}
              </Text>
            </TouchableOpacity>

            {pendingSession ? (
              <TouchableOpacity
                onPress={verifyAndContinue}
                disabled={loading || otpCode.length < 6}
                className={`h-16 rounded-3xl items-center justify-center shadow-premium mt-4 ${loading || otpCode.length < 6 ? 'bg-muted' : 'bg-primary'}`}
              >
                <Text className="text-white text-base font-black uppercase tracking-widest">
                  {loading ? t('auth.verifying', 'Verifying...') : t('auth.verify_continue', 'Verify & Continue')}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <View className="flex-row justify-center mt-12 gap-2 mb-10 items-center">
            <Text className="text-muted-foreground font-semibold text-sm">{t('auth.already_registered')}</Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login' as any)}>
              <Text className="text-accent font-black uppercase text-xs tracking-widest border-b border-accent/40 pb-0.5">{t('auth.log_in')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
