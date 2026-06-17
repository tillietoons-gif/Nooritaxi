import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { UploadCloud, CheckCircle, ShieldAlert, ArrowLeft } from 'lucide-react-native';
import { DriverKycDocument, getMyKycDocuments, uploadKycDocumentFile, getStoredUser } from '../lib/api';
import * as ImagePicker from 'expo-image-picker';
import { withSessionGuard } from '../lib/SessionGuard';
import { safeBack } from '../lib/navigation';
import { useTranslation } from 'react-i18next';

function DriverKycScreen() {
  const { t } = useTranslation();
  const [loading, setLoading] = React.useState(false);
  const [status, setStatus] = React.useState<'PENDING' | 'SUCCESS' | 'ERROR'>('PENDING');
  const [message, setMessage] = React.useState('');
  const [documents, setDocuments] = React.useState<DriverKycDocument[]>([]);

  const requiredDocuments = ['ID_CARD', 'DRIVERS_LICENSE', 'VEHICLE_REGISTRATION', 'INSURANCE'] as const;

  const loadDocuments = React.useCallback(async () => {
    try {
      setDocuments(await getMyKycDocuments());
    } catch {
      setDocuments([]);
    }
  }, []);

  React.useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  async function handleUpload(type: string) {
    setLoading(true);
    setStatus('PENDING');
    setMessage('');
    try {
      const user = await getStoredUser();
      if (!user) {
        router.replace('/(auth)/login');
        return;
      }

      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        setStatus('ERROR');
        setMessage(t('kyc.media_permission_required'));
        setLoading(false);
        return;
      }

      // Pick image or document
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (result.canceled || !result.assets || !result.assets[0]?.uri) {
        setLoading(false);
        return;
      }

      const fileUri = result.assets[0].uri;
      await uploadKycDocumentFile(type, fileUri);
      await loadDocuments();
      setStatus('SUCCESS');
      setMessage(t('kyc.upload_success', { document: t(`kyc.${type}`) }));
    } catch (err) {
      setStatus('ERROR');
      setMessage((err as Error).message || t('kyc.upload_failed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
        <View className="px-4 py-6">
          <View className="flex-row items-center mb-8">
            <TouchableOpacity onPress={() => safeBack(router, '/(tabs)/profile')} className="mr-4">
              <ArrowLeft size={24} color="#1b1b1b" />
            </TouchableOpacity>
            <Text className="text-2xl font-bold text-foreground">{t('kyc.title')}</Text>
          </View>

          <View className="bg-primary/5 p-6 rounded-3xl mb-8 flex-row items-start gap-4 border border-primary/10">
            <ShieldAlert size={28} color="#006947" />
            <View className="flex-1">
              <Text className="font-bold text-lg mb-1">{t('kyc.required_documents')}</Text>
              <Text className="text-muted-foreground text-sm">
                {t('kyc.required_documents_subtitle')}
              </Text>
            </View>
          </View>

          {status === 'SUCCESS' && (
            <View className="bg-success/10 p-4 rounded-xl mb-6 flex-row items-center gap-3">
              <CheckCircle size={20} color="#0e9f6e" />
              <Text className="text-success font-medium flex-1">{message}</Text>
            </View>
          )}

          {status === 'ERROR' && (
            <View className="bg-destructive/10 p-4 rounded-xl mb-6">
              <Text className="text-destructive font-medium">{message}</Text>
            </View>
          )}

          <View className="space-y-4">
            {requiredDocuments.map((type) => {
              const latest = documents.find((doc) => doc.type === type);
              return (
                <DocumentUploadCard
                  key={type}
                  title={t(`kyc.${type}`)}
                  type={type}
                  status={latest?.status ?? 'MISSING'}
                  onUpload={() => handleUpload(type)}
                  loading={loading}
                  uploadLabel={latest?.status === 'VERIFIED' ? t('kyc.verified', 'Verified') : t('kyc.tap_upload')}
                />
              );
            })}
          </View>
        </View>
    </SafeAreaView>
  );
}

export default withSessionGuard(DriverKycScreen);

function DocumentUploadCard({
  title,
  onUpload,
  loading,
  uploadLabel,
  status,
}: {
  title: string,
  type: string,
  onUpload: () => void,
  loading: boolean,
  uploadLabel: string,
  status: 'MISSING' | DriverKycDocument['status'],
}) {
  const statusClass =
    status === 'VERIFIED'
      ? 'text-success'
      : status === 'REJECTED'
        ? 'text-destructive'
        : 'text-muted-foreground';

  return (
    <TouchableOpacity 
      disabled={loading}
      onPress={onUpload}
      className="bg-card p-5 rounded-2xl border border-muted/10 flex-row items-center justify-between shadow-sm"
    >
      <View>
        <Text className="font-bold text-base mb-1">{title}</Text>
        <Text className="text-muted-foreground text-xs">{uploadLabel}</Text>
        <Text className={`text-[10px] font-black uppercase tracking-widest mt-2 ${statusClass}`}>{status}</Text>
      </View>
      <View className="w-12 h-12 bg-primary/10 rounded-full items-center justify-center">
        {loading ? <ActivityIndicator color="#006947" /> : <UploadCloud size={24} color="#006947" />}
      </View>
    </TouchableOpacity>
  );
}
