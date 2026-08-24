import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, SafeAreaView, KeyboardAvoidingView, Platform, StatusBar } from 'react-native';
import { useAuthStore } from '../../../shared/store/authStore';

export default function CompleteProfileScreen({ navigation }: any) {
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'CITIZEN' | 'INVESTIGATOR'>('CITIZEN');
  const { completeGoogleRegistration, isLoading, error } = useAuthStore();

  const handleComplete = async () => {
    if (!phone) return;
    try {
      const user = await completeGoogleRegistration(phone, role);
      if (user.status === 'PENDING') {
        navigation.replace('PendingApproval');
      } else {
        navigation.replace('Home');
      }
    } catch (e) {
      // Error handled by the store
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Text style={styles.title}>Complete Your Profile</Text>
        <Text style={styles.subtitle}>Please provide your phone number and role to finish setup.</Text>

        {/* Role Selection */}
        <Text style={styles.label}>Select Role</Text>
        <View style={styles.roleContainer}>
          <TouchableOpacity
            style={[styles.roleBtn, role === 'CITIZEN' && styles.roleBtnActive]}
            onPress={() => setRole('CITIZEN')}
          >
            <Text style={[styles.roleText, role === 'CITIZEN' && styles.roleTextActive]}>Citizen</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.roleBtn, role === 'INVESTIGATOR' && styles.roleBtnActive]}
            onPress={() => setRole('INVESTIGATOR')}
          >
            <Text style={[styles.roleText, role === 'INVESTIGATOR' && styles.roleTextActive]}>Investigator</Text>
          </TouchableOpacity>
        </View>

        {/* Phone Input */}
        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. +1 234 567 8900"
          placeholderTextColor="#9CA3AF"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity 
          style={[styles.submitBtn, (isLoading || !phone) && { opacity: 0.7 }]} 
          onPress={handleComplete} 
          disabled={isLoading || !phone}
          activeOpacity={0.85}
        >
          {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Finish Registration</Text>}
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#FFFFFF' },
  title: { fontSize: 26, fontWeight: '800', marginBottom: 8, color: '#111827' },
  subtitle: { fontSize: 15, color: '#6B7280', marginBottom: 32, lineHeight: 22 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  roleContainer: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  roleBtn: { flex: 1, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center' },
  roleBtnActive: { borderColor: '#0D4722', backgroundColor: '#F0FBF4' },
  roleText: { color: '#4B5563', fontWeight: '600', fontSize: 15 },
  roleTextActive: { color: '#0D4722' },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 16, marginBottom: 24, fontSize: 16, color: '#111827', backgroundColor: '#FAFAFA' },
  error: { color: '#EF4444', marginBottom: 16, textAlign: 'center', fontSize: 14 },
  submitBtn: { backgroundColor: '#0D4722', padding: 16, borderRadius: 12, alignItems: 'center', shadowColor: '#0D4722', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 16, letterSpacing: 0.3 },
});
