import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ActivityIndicator,
  ImageBackground,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../../shared/store/authStore';

interface Props {
  navigation: any;
}

const { height } = Dimensions.get('window');

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const { login, isLoading, error } = useAuthStore();

  const handleLogin = async () => {
    if (!email || !password) return;
    try {
      const user = await login(email, password);
      if (user.status === 'PENDING') {
        navigation.replace('PendingApproval');
      } else {
        navigation.replace('Home');
      }
    } catch (err) {
      // Error is handled by the store
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
          {/* ─── IMAGE SECTION (top ~50% of screen) ─── */}
          <View style={styles.imageWrapper}>
            <ImageBackground
              source={require('../../../../assets/login-bg.jpg')}
              style={styles.bgImage}
              resizeMode="cover"
            >
              {/* Overlay text on top of image */}
              <View style={styles.heroText}>
                <Text style={styles.brandName}>Justice Now</Text>
                <Text style={styles.brandTagline}>
                  Speak Up Today,{'\n'}Create a Better Tomorrow.
                </Text>
              </View>
            </ImageBackground>
          </View>

          {/* ─── CARD (slides up and overlaps image) ─── */}
          <View style={styles.cardContainer}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Welcome Back</Text>
              <Text style={styles.cardSubtitle}>Login to continue your journey.</Text>

              {/* Email Field */}
              <View style={[styles.inputWrap, focusedField === 'email' && styles.inputFocused]}>
                <Ionicons name="mail-outline" size={20} color={focusedField === 'email' ? '#0D4722' : '#9CA3AF'} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email or Phone Number"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>

              {/* Password Field */}
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

              {/* Forgot Password */}
              <TouchableOpacity
                style={styles.forgotContainer}
                onPress={() => navigation.navigate('ForgotPassword')}
              >
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>

              {/* Error */}
              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              {/* Login Button */}
              <TouchableOpacity
                style={[styles.primaryBtn, isLoading && { opacity: 0.7 }]}
                activeOpacity={0.85}
                onPress={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.primaryBtnText}>Log In</Text>
                )}
              </TouchableOpacity>



              {/* Sign Up Link */}
              <View style={styles.switchRow}>
                <Text style={styles.switchText}>Don't have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                  <Text style={styles.switchLink}>Sign Up</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const IMAGE_HEIGHT = height * 0.5;   // image takes top 50%
const CARD_OVERLAP = 36;             // how much card slides over the image

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  /* ── Image ── */
  imageWrapper: {
    height: IMAGE_HEIGHT,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',          // clips the image to the rounded corners
  },
  bgImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-start',
  },
  heroText: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 80 : 60, // Increased to bring text down
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
    marginTop: -CARD_OVERLAP,   // pulls card up to overlap the image bottom
    paddingHorizontal: 16,      // padding so card doesn't touch edges
    paddingBottom: 40,
  },

  scroll: {
    flexGrow: 1,
    backgroundColor: '#FFFFFF', // Ensures safe area background blends smoothly
  },

  /* ── Card ── */
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,           // Rounded all corners instead of just top
    borderWidth: 1,
    borderColor: '#F3F4F6',     // Added subtle border
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 40,
    marginBottom: 20,           // Margin at the bottom
    // subtle shadow so card appears "above" the image
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
    fontSize: 16,
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

  /* ── Forgot Password ── */
  forgotContainer: {
    alignItems: 'flex-end',
    marginTop: 10,
    marginBottom: 22,
  },
  forgotText: {
    fontSize: 13,
    color: '#0D4722',
    fontWeight: '700',
  },

  /* ── Error ── */
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 10,
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

  /* ── Switch to Register ── */
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 28,
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
