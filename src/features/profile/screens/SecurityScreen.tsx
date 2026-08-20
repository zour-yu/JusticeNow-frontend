import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../../shared/store/authStore';
import { reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { auth } from '../../../shared/config/firebase';
import api from '../../../shared/services/api';

interface Props {
  navigation: any;
}

export default function SecurityScreen({ navigation }: Props) {
  const { logout } = useAuthStore();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const handleResetPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  const handleDeleteAccount = () => {
    setPassword('');
    setPasswordError('');
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    if (!password.trim()) {
      setPasswordError('Please enter your password to confirm.');
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.email) {
      setPasswordError('Unable to verify user session. Please log in again.');
      return;
    }

    setIsDeleting(true);
    setPasswordError('');

    try {
      // Re-authenticate the user with their password first
      const credential = EmailAuthProvider.credential(currentUser.email, password);
      await reauthenticateWithCredential(currentUser, credential);

      // Now call backend to delete from MongoDB + Firebase Auth
      await api.delete('/auth/account');
      await logout();

      setShowConfirmModal(false);
      navigation.replace('Login');
    } catch (err: any) {
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setPasswordError('Incorrect password. Please try again.');
      } else {
        setPasswordError(err.response?.data?.message || err.message || 'Failed to delete account.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#0D4722" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Security</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Password Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Password</Text>
          <Text style={styles.sectionDescription}>
            Manage your account password. A strong password helps keep your account secure.
          </Text>

          <TouchableOpacity style={styles.actionBtn} onPress={handleResetPassword} activeOpacity={0.8}>
            <View style={styles.actionBtnLeft}>
              <View style={[styles.iconWrapper, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="key-outline" size={20} color="#0D4722" />
              </View>
              <View>
                <Text style={styles.actionBtnTitle}>Reset Password</Text>
                <Text style={styles.actionBtnSub}>Send a password reset email</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <View style={styles.sectionCard}>
          <View style={styles.dangerHeader}>
            <Ionicons name="warning-outline" size={20} color="#DC2626" />
            <Text style={styles.dangerTitle}>Danger Zone</Text>
          </View>
          <Text style={styles.sectionDescription}>
            Once you delete your account, there is no going back. All your data including complaints, messages, and profile information will be permanently removed.
          </Text>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handleDeleteAccount}
            activeOpacity={0.8}
            disabled={isDeleting}
          >
            <View style={styles.actionBtnLeft}>
              <View style={[styles.iconWrapper, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="trash-outline" size={20} color="#0D4722" />
              </View>
              <View>
                <Text style={styles.actionBtnTitle}>Delete Account</Text>
                <Text style={styles.actionBtnSub}>Permanently remove your account</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Password Confirmation Modal */}
      <Modal
        visible={showConfirmModal}
        animationType="slide"
        transparent
        onRequestClose={() => !isDeleting && setShowConfirmModal(false)}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalIconWrapper}>
                <Ionicons name="trash-outline" size={28} color="#DC2626" />
              </View>
              <Text style={styles.modalTitle}>Confirm Deletion</Text>
              <Text style={styles.modalSubtitle}>
                Enter your password to permanently delete your account. This action{' '}
                <Text style={{ fontWeight: '800' }}>cannot be undone</Text>.
              </Text>
            </View>

            {/* Password Field */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Your Password</Text>
              <View style={[styles.inputRow, passwordError ? styles.inputRowError : null]}>
                <Ionicons name="lock-closed-outline" size={18} color="#9CA3AF" style={{ marginRight: 10 }} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter your password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={(t) => { setPassword(t); setPasswordError(''); }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isDeleting}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
              {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
            </View>

            {/* Buttons */}
            <TouchableOpacity
              style={[styles.confirmDeleteBtn, isDeleting && { opacity: 0.7 }]}
              onPress={confirmDelete}
              disabled={isDeleting}
              activeOpacity={0.8}
            >
              {isDeleting ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Ionicons name="trash-outline" size={18} color="#FFF" />
                  <Text style={styles.confirmDeleteText}>Yes, Delete My Account</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setShowConfirmModal(false)}
              disabled={isDeleting}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },

  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 60 },

  sectionCard: {
    backgroundColor: '#FFF', borderRadius: 20, padding: 20,
    marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  dangerCard: { borderWidth: 1.5, borderColor: '#FEE2E2' },

  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 6 },
  sectionDescription: { fontSize: 13, color: '#6B7280', lineHeight: 19, marginBottom: 20 },

  dangerHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 8 },
  dangerTitle: { fontSize: 16, fontWeight: '800', color: '#DC2626' },

  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#F9FAFB', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  deleteBtn: { backgroundColor: '#FFF5F5', borderColor: '#FECACA' },
  actionBtnLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrapper: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  actionBtnTitle: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 2 },
  actionBtnSub: { fontSize: 12, color: '#9CA3AF' },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 28, paddingBottom: 40,
  },
  modalHeader: { alignItems: 'center', marginBottom: 24 },
  modalIconWrapper: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 8 },
  modalSubtitle: { fontSize: 13, color: '#6B7280', textAlign: 'center', lineHeight: 19 },

  inputWrapper: { marginBottom: 20 },
  inputLabel: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 8 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#E5E7EB',
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
    backgroundColor: '#F9FAFB',
  },
  inputRowError: { borderColor: '#FCA5A5' },
  textInput: { flex: 1, fontSize: 15, color: '#111827' },
  errorText: { color: '#DC2626', fontSize: 12, marginTop: 6, marginLeft: 4 },

  confirmDeleteBtn: {
    backgroundColor: '#DC2626', borderRadius: 16,
    paddingVertical: 16, flexDirection: 'row',
    justifyContent: 'center', alignItems: 'center', gap: 8,
    marginBottom: 12,
  },
  confirmDeleteText: { color: '#FFF', fontSize: 15, fontWeight: '800' },

  cancelBtn: {
    backgroundColor: '#F3F4F6', borderRadius: 16,
    paddingVertical: 16, alignItems: 'center',
  },
  cancelBtnText: { fontSize: 15, fontWeight: '700', color: '#374151' },
});
