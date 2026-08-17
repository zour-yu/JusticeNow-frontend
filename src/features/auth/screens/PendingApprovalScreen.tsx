import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Image } from 'react-native';
import { useAuthStore } from '../../../shared/store/authStore';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  navigation: any;
}

export default function PendingApprovalScreen({ navigation }: Props) {
  const { logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    navigation.replace('Login');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.iconContainer}>
          <Ionicons name="time-outline" size={80} color="#0D4722" />
        </View>
        
        <Text style={styles.title}>Request Under Review</Text>
        
        <Text style={styles.message}>
          Thank you for signing up as an Investigator! Your account is currently pending approval from our administration team.
        </Text>
        
        <Text style={styles.subMessage}>
          You will be notified once your account is activated and you can access the platform.
        </Text>

        <TouchableOpacity 
          style={styles.primaryBtn} 
          activeOpacity={0.85}
          onPress={handleLogout}
        >
          <Text style={styles.primaryBtnText}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F4F8F5',
  },
  container: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E6F4EA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0D4722',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
  },
  subMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
  },
  primaryBtn: {
    backgroundColor: '#0D4722',
    borderRadius: 12,
    height: 56,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0D4722',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
