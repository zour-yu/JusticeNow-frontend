import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ActivityIndicator,
  Alert,
  ImageBackground,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../../shared/store/authStore';

interface Props {
  navigation: any;
}

const { height } = Dimensions.get('window');

export default function RegisterScreen({ navigation }: Props) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<'CITIZEN' | 'INVESTIGATOR'>('CITIZEN');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const { register, logout, isLoading, error } = useAuthStore();

  const handleRegister = async () => {
    if (!firstName || !lastName || !email || !password || !phone) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    // Name Validation (at least 2 characters)
    if (firstName.trim().length < 2 || lastName.trim().length < 2) {
      Alert.alert('Error', 'First and Last name must be at least 2 characters long');
      return;
    }

    // Email Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    // Phone Validation (digits only, max 10)
    const phoneRegex = /^[0-9]{1,10}$/;
    if (!phoneRegex.test(phone)) {
      Alert.alert('Error', 'Phone number should only contain digits and be up to 10 characters long');
      return;
    }

    // Password Validation (min 6 characters)
    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (!agreeTerms) {
      Alert.alert('Agreement Required', 'Please accept the Terms and Conditions to proceed.');
      return;
    }
    
    try {
      await register({
        firstName,
        lastName,
        email,
        password,
        phone,
        role: selectedRole,
      });
      
      // Force user to log in after registration per user request
      await logout();
      
      Alert.alert('Success', 'Account created successfully! Please log in.');
      navigation.replace('Login');
    } catch (err) {
      // Error is handled by the store and displayed in UI
    }
  };



  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#EEF4EE" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          {/* ─── IMAGE SECTION ─── */}
          <View style={styles.imageWrapper}>
            <ImageBackground
              source={require('../../../../assets/login-bg.jpg')}
              style={styles.bgImage}
              resizeMode="cover"
            >
              <View style={styles.heroText}>
                <Text style={styles.brandName}>Justice Now</Text>
                <Text style={styles.brandTagline}>
                  Join us today,{'\n'}Make a difference tomorrow.
                </Text>
              </View>
            </ImageBackground>
          </View>

          {/* ─── CARD ─── */}
          <View style={styles.cardContainer}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Create Account</Text>
              <Text style={styles.cardSubtitle}>Sign up to start your journey.</Text>

              {/* Name Fields Row */}
              <View style={styles.nameRow}>
                <View style={[styles.inputWrap, styles.flex1, focusedField === 'firstName' && styles.inputFocused]}>
                  <Ionicons name="person-outline" size={20} color={focusedField === 'firstName' ? '#0D4722' : '#9CA3AF'} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="First Name"
                    placeholderTextColor="#9CA3AF"
                    value={firstName}
                    onChangeText={setFirstName}
                    onFocus={() => setFocusedField('firstName')}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
                <View style={{ width: 12 }} />
                <View style={[styles.inputWrap, styles.flex1, focusedField === 'lastName' && styles.inputFocused]}>
                  <TextInput
                    style={styles.input}
                    placeholder="Last Name"
                    placeholderTextColor="#9CA3AF"
                    value={lastName}
                    onChangeText={setLastName}
                    onFocus={() => setFocusedField('lastName')}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
              </View>

              {/* Email */}
              <View style={[styles.inputWrap, styles.inputWrapMt, focusedField === 'email' && styles.inputFocused]}>
                <Ionicons name="mail-outline" size={20} color={focusedField === 'email' ? '#0D4722' : '#9CA3AF'} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email Address"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>

              {/* Phone */}
              <View style={[styles.inputWrap, styles.inputWrapMt, focusedField === 'phone' && styles.inputFocused]}>
                <Ionicons name="call-outline" size={20} color={focusedField === 'phone' ? '#0D4722' : '#9CA3AF'} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Phone Number"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                  onFocus={() => setFocusedField('phone')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>

              {/* Password */}
              <View style={[styles.inputWrap, styles.inputWrapMt, focusedField === 'password' && styles.inputFocused]}>
                <Ionicons name="lock-closed-outline" size={20} color={focusedField === 'password' ? '#0D4722' : '#9CA3AF'} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#9CA3AF" style={styles.eyeIcon} />
                </TouchableOpacity>
              </View>

              {/* Confirm Password */}
              <View style={[styles.inputWrap, styles.inputWrapMt, focusedField === 'confirmPassword' && styles.inputFocused]}>
                <Ionicons name="lock-closed-outline" size={20} color={focusedField === 'confirmPassword' ? '#0D4722' : '#9CA3AF'} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm Password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  onFocus={() => setFocusedField('confirmPassword')}
                  onBlur={() => setFocusedField(null)}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeBtn}>
                  <Ionicons name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#9CA3AF" style={styles.eyeIcon} />
                </TouchableOpacity>
              </View>

              {/* Role Selection */}
              <View style={styles.roleContainer}>
                <Text style={styles.roleLabel}>I am signing up as:</Text>
                <View style={styles.roleTabs}>
                  <TouchableOpacity 
                    style={[styles.roleTab, selectedRole === 'CITIZEN' && styles.roleTabActive]}
                    onPress={() => setSelectedRole('CITIZEN')}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.roleTabText, selectedRole === 'CITIZEN' && styles.roleTabTextActive]}>Citizen</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.roleTab, selectedRole === 'INVESTIGATOR' && styles.roleTabActive]}
                    onPress={() => setSelectedRole('INVESTIGATOR')}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.roleTabText, selectedRole === 'INVESTIGATOR' && styles.roleTabTextActive]}>Investigator</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Error */}
              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              {/* Terms and Conditions Checkbox */}
              <TouchableOpacity 
                style={styles.checkboxContainer} 
                onPress={() => setAgreeTerms(!agreeTerms)}
                activeOpacity={0.8}
              >
                <View style={[styles.checkbox, agreeTerms && styles.checkboxChecked]}>
                  {agreeTerms && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                </View>
                <Text style={styles.checkboxText}>
                  I agree to the <Text style={styles.checkboxLink}>Terms and Conditions</Text>
                </Text>
              </TouchableOpacity>

              {/* Register Button */}
              <TouchableOpacity
                style={[styles.primaryBtn, isLoading && { opacity: 0.7 }]}
                activeOpacity={0.85}
                onPress={handleRegister}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.primaryBtnText}>
                    {selectedRole === 'INVESTIGATOR' ? 'Send Request' : 'Create Account'}
                  </Text>
                )}
              </TouchableOpacity>



              {/* Switch Link */}
              <View style={styles.switchRow}>
                <Text style={styles.switchText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.switchLink}>Log In</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const IMAGE_HEIGHT = height * 0.45; // slightly smaller than login to fit more fields
const CARD_OVERLAP = 36;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scroll: {
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
  },

  /* ── Image ── */
  imageWrapper: {
    height: IMAGE_HEIGHT,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  bgImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-start',
  },
  heroText: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 70 : 50,
  },
  brandName: {
    fontSize: 30,
    fontWeight: '800',
    color: '#0D4722',
    letterSpacing: 0.3,
  },
  brandTagline: {
    fontSize: 14,
    color: '#0D4722',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 6,
    fontWeight: '500',
  },

  /* ── Card Container ── */
  cardContainer: {
    marginTop: -CARD_OVERLAP,
    paddingHorizontal: 16,
    paddingBottom: 40,
  },

  /* ── Card ── */
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 32,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 28,
  },

  /* ── Inputs ── */
  nameRow: {
    flexDirection: 'row',
  },
  flex1: {
    flex: 1,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 54,
    backgroundColor: '#FAFAFA',
  },
  inputWrapMt: {
    marginTop: 14,
  },
  inputFocused: {
    borderColor: '#0D4722',
    backgroundColor: '#F0FBF4',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
  },
  eyeBtn: {
    padding: 6,
  },
  eyeIcon: {
    fontSize: 16,
  },

  /* ── Role Selection ── */
  roleContainer: {
    marginTop: 20,
    marginBottom: 24,
  },
  roleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 10,
  },
  roleTabs: {
    flexDirection: 'row',
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 4,
  },
  roleTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  roleTabActive: {
    backgroundColor: '#0D4722',
  },
  roleTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  roleTabTextActive: {
    color: '#FFFFFF',
  },

  /* ── Error ── */
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 12,
  },

  /* ── Primary Button ── */
  primaryBtn: {
    backgroundColor: '#0D4722',
    borderRadius: 12,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0D4722',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  /* ── Divider ── */
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 22,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginHorizontal: 12,
  },

  /* ── Social ── */
  socialRow: {
    flexDirection: 'row',
    gap: 14,
  },
  socialBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  socialIcon: {
    marginRight: 8,
  },
  socialBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },

  /* ── Checkbox ── */
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: -4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#9CA3AF',
    borderRadius: 4,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#0D4722',
    borderColor: '#0D4722',
  },
  checkboxText: {
    fontSize: 14,
    color: '#4B5563',
  },
  checkboxLink: {
    color: '#0D4722',
    fontWeight: '600',
  },

  /* ── Switch to Login ── */
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  switchText: {
    fontSize: 14,
    color: '#6B7280',
  },
  switchLink: {
    fontSize: 14,
    color: '#0D4722',
    fontWeight: '700',
  },
});
