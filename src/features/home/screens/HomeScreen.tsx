import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useAuthStore } from '../../../shared/store/authStore';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  navigation: any;
}

export default function HomeScreen({ navigation }: Props) {
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    navigation.replace('Login');
  };

  if (!user) {
    return null;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Home</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={24} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <View style={styles.container}>
        <Text style={styles.welcomeText}>Welcome back,</Text>
        <Text style={styles.nameText}>{user.firstName} {user.lastName}</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your Details</Text>
          
          <View style={styles.detailRow}>
            <Ionicons name="mail-outline" size={20} color="#6B7280" />
            <Text style={styles.detailText}>{user.email}</Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="call-outline" size={20} color="#6B7280" />
            <Text style={styles.detailText}>{user.phone || 'Not provided'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#6B7280" />
            <Text style={styles.detailText}>Role: {user.role}</Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="information-circle-outline" size={20} color="#6B7280" />
            <Text style={styles.detailText}>Status: {user.status}</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F4F8F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  logoutBtn: {
    padding: 8,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  welcomeText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 4,
  },
  nameText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0D4722',
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailText: {
    fontSize: 15,
    color: '#374151',
    marginLeft: 12,
  },
});
