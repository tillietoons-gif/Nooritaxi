import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert, Image } from 'react-native';
import { router } from 'expo-router';
import { UploadCloud, CheckCircle, ShieldAlert, ArrowLeft } from 'lucide-react-native';
import { uploadKycDocument, getStoredUser } from '../lib/api';
import * as ImagePicker from 'expo-image-picker';

export default function DriverKycScreen() {
  const [loading, setLoading] = React.useState(false);
  const [status, setStatus] = React.useState<'PENDING' | 'SUCCESS' | 'ERROR'>('PENDING');
  const [message, setMessage] = React.useState('');

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
        setMessage('Permission to access media library is required.');
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

      // In a real app, upload the file to your storage and get a public URL
      // For demo, use the local uri as a placeholder
      const fileUri = result.assets[0].uri;
      // TODO: Replace with real upload logic to get a public URL
      // For now, just show a warning
      Alert.alert('Demo', 'In production, upload the file to your backend or cloud storage and use the returned URL.');

      await uploadKycDocument(user.id, type, fileUri);
      setStatus('SUCCESS');
      setMessage(`${type.replace('_', ' ')} uploaded successfully and is pending verification.`);
    } catch (err) {
      setStatus('ERROR');
      setMessage((err as Error).message || 'Failed to upload document.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-4 py-6">
        <View className="flex-row items-center mb-8">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <ArrowLeft size={24} color="#1b1b1b" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-foreground">Driver Verification</Text>
        </View>

        <View className="bg-primary/5 p-6 rounded-3xl mb-8 flex-row items-start gap-4 border border-primary/10">
          <ShieldAlert size={28} color="#006947" />
          <View className="flex-1">
            <Text className="font-bold text-lg mb-1">Required Documents</Text>
            <Text className="text-muted-foreground text-sm">
              To activate your driver account, please upload clear photos of your official documents.
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
          <DocumentUploadCard 
            title="National ID Card (Tazkira)"
            type="ID_CARD"
            onUpload={() => handleUpload('ID_CARD')}
            loading={loading}
          />
          <DocumentUploadCard 
            title="Driver's License"
            type="DRIVERS_LICENSE"
            onUpload={() => handleUpload('DRIVERS_LICENSE')}
            loading={loading}
          />
          <DocumentUploadCard 
            title="Vehicle Registration (Jawaz Sair)"
            type="VEHICLE_REGISTRATION"
            onUpload={() => handleUpload('VEHICLE_REGISTRATION')}
            loading={loading}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

function DocumentUploadCard({ title, type, onUpload, loading }: { title: string, type: string, onUpload: () => void, loading: boolean }) {
  return (
    <TouchableOpacity 
      disabled={loading}
      onPress={onUpload}
      className="bg-card p-5 rounded-2xl border border-muted/10 flex-row items-center justify-between shadow-sm"
    >
      <View>
        <Text className="font-bold text-base mb-1">{title}</Text>
        <Text className="text-muted-foreground text-xs">Tap to upload document</Text>
      </View>
      <View className="w-12 h-12 bg-primary/10 rounded-full items-center justify-center">
        {loading ? <ActivityIndicator color="#006947" /> : <UploadCloud size={24} color="#006947" />}
      </View>
    </TouchableOpacity>
  );
}
