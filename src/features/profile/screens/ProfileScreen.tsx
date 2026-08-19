import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  ScrollView,
  Image,
  Dimensions
} from 'react-native';
import { useAuthStore } from '../../../shared/store/authStore';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  navigation: any;
}

const { width } = Dimensions.get('window');

// Reusable Settings Row Component
const SettingItem = ({ icon, label, rightText, hideBorder, onPress }: { 
  icon: any; label: string; rightText?: string; hideBorder?: boolean; onPress?: () => void;
}) => (
  <TouchableOpacity style={[styles.settingItem, !hideBorder && styles.settingItemBorder]} onPress={onPress}>
    <View style={styles.settingItemLeft}>
      <Ionicons name={icon} size={20} color="#4B5563" style={{ width: 28 }} />
      <Text style={styles.settingItemLabel}>{label}</Text>
    </View>
    <View style={styles.settingItemRight}>
      {rightText && <Text style={styles.settingItemRightText}>{rightText}</Text>}
      <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
    </View>
  </TouchableOpacity>
);

export const ProfileScreen = ({ navigation }: Props) => {
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    navigation.replace('Login');
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIconBtn}>
          <Ionicons name="menu-outline" size={28} color="#0D4722" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Justice Now</Text>
        <TouchableOpacity style={styles.headerIconBtn}>
          <Ionicons name="notifications-outline" size={26} color="#0D4722" />
          <View style={styles.notificationBadge}>
            <Text style={styles.notificationBadgeText}>3</Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* City Background */}
        <View style={styles.heroSection}>
          <Image 
            source={require('../../../../assets/hero_bg.png')} 
            style={styles.skylineImage}
            resizeMode="cover"
          />
        </View>

        {/* Profile Content */}
        <View style={styles.mainContent}>
          
          <View style={styles.profileInfoRow}>
            {/* Avatar Placeholder */}
            <View style={styles.avatarContainer}>
              <View style={[styles.avatarImage, styles.avatarPlaceholder]}>
                <Ionicons name="person" size={40} color="#9CA3AF" />
              </View>
              <TouchableOpacity style={styles.cameraIconBadge}>
                <Ionicons name="camera-outline" size={16} color="#111827" />
              </TouchableOpacity>
            </View>

            {/* User Details */}
            <View style={styles.userDetails}>
              <Text style={styles.userName}>
                {user?.firstName} {user?.lastName}
              </Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
              <View style={styles.phoneRow}>
                <Ionicons name="call-outline" size={12} color="#6B7280" />
                <Text style={styles.userPhone}> {user?.phone || 'No phone added'}</Text>
              </View>
            </View>

            <TouchableOpacity style={{ padding: 5 }}>
              <Ionicons name="chevron-forward" size={22} color="#4B5563" />
            </TouchableOpacity>
          </View>

          {/* Overview Stats */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>My Overview</Text>
            <View style={styles.statsRow}>
              {[
                { icon: 'document-text-outline', value: '04', label: 'My Cases',  bg: '#E8F5E9', color: '#0D4722' },
                { icon: 'chatbubble-ellipses-outline', value: '06', label: 'Messages', bg: '#E8F5E9', color: '#0D4722' },
                { icon: 'receipt-outline', value: '12', label: 'Updates', bg: '#FFF3E0', color: '#E65100' },
                { icon: 'bookmark-outline', value: '03', label: 'Saved', bg: '#E8F5E9', color: '#0D4722' },
              ].map((s, i) => (
                <View key={i} style={styles.statItem}>
                  <View style={[styles.statIconWrapper, { backgroundColor: s.bg }]}>
                    <Ionicons name={s.icon as any} size={20} color={s.color} />
                  </View>
                  <Text style={styles.statValue}>{s.value}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Settings Links */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Account & Settings</Text>
            <SettingItem 
              icon="person-outline" 
              label="Personal Information" 
              onPress={() => navigation.navigate('PersonalInformation')} 
            />
            <SettingItem icon="shield-checkmark-outline"   label="Security" />
            <SettingItem icon="notifications-outline"      label="Notification Preferences" />
            <SettingItem icon="globe-outline"              label="Language" rightText="English" />
            <SettingItem icon="help-circle-outline"        label="Help & Support" />
            <SettingItem icon="information-circle-outline" label="About Justice Now" hideBorder />
          </View>

          {/* Logout Action */}
          <TouchableOpacity style={styles.logoutBtn} activeOpacity={0.7} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Home')}>
          <Ionicons name="home-outline" size={24} color="#9CA3AF" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('MyComplaints')}>
          <Ionicons name="folder-outline" size={24} color="#9CA3AF" />
          <Text style={styles.navText}>My Cases</Text>
        </TouchableOpacity>

        <View style={styles.fabContainer}>
          <TouchableOpacity style={styles.fabBtn} activeOpacity={0.9}
            onPress={() => navigation.navigate('SubmitComplaint')}>
            <Ionicons name="add" size={32} color="#FFF" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="chatbubble-outline" size={24} color="#9CA3AF" />
          <Text style={styles.navText}>Messages</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="person" size={24} color="#0D4722" />
          <Text style={[styles.navText, { color: '#0D4722' }]}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const SKYLINE_H  = 180;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF' },
  scrollView: { flex: 1, backgroundColor: '#FFF' },
  scrollContent: { paddingBottom: 20 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 15,
    backgroundColor: '#FFF',
    zIndex: 10,
  },
  headerIconBtn: { padding: 5, position: 'relative' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#0D4722' },
  notificationBadge: {
    position: 'absolute', top: 5, right: 5,
    backgroundColor: '#EF4444',
    width: 14, height: 14, borderRadius: 7,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#FFF',
  },
  notificationBadgeText: { color: '#FFF', fontSize: 8, fontWeight: 'bold' },

  heroSection: {
    height: SKYLINE_H,
    position: 'relative',
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 20,
    overflow: 'hidden',
  },
  skylineImage: {
    width: '100%',
    height: '100%',
  },

  mainContent: {
    backgroundColor: '#FAFAFA',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30, 
    marginHorizontal: 20,
    paddingHorizontal: 20,
    paddingTop: 25,
  },
  
  profileInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },
  avatarContainer: { position: 'relative', marginRight: 15 },
  avatarImage: {
    width: 76, height: 76, borderRadius: 38,
    borderWidth: 4, borderColor: '#FAFAFA',
  },
  avatarPlaceholder: {
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIconBadge: {
    position: 'absolute', bottom: 0, right: -4,
    backgroundColor: '#FFF',
    width: 28, height: 28, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 4, elevation: 3,
  },
  userDetails: { flex: 1 },
  userName:   { color: '#111827', fontSize: 18, fontWeight: '700', marginBottom: 2 },
  userEmail:  { color: '#4B5563', fontSize: 12, marginBottom: 4 },
  phoneRow:   { flexDirection: 'row', alignItems: 'center' },
  userPhone:  { color: '#4B5563', fontSize: 12, fontWeight: '500' },

  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  cardTitle: { fontSize: 15, fontWeight: '800', color: '#111827', marginBottom: 16 },

  statsRow:  { flexDirection: 'row', justifyContent: 'space-between' },
  statItem:  { alignItems: 'center', flex: 1 },
  statIconWrapper: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  statValue: { fontSize: 16, fontWeight: '800', color: '#111827' },
  statLabel: { fontSize: 10, color: '#6B7280', marginTop: 2, textAlign: 'center' },

  settingItem: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingVertical: 13,
  },
  settingItemBorder: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  settingItemLeft: { flexDirection: 'row', alignItems: 'center' },
  settingItemLabel: { fontSize: 14, color: '#374151', fontWeight: '500', marginLeft: 8 },
  settingItemRight: { flexDirection: 'row', alignItems: 'center' },
  settingItemRightText: { fontSize: 13, color: '#0D4722', fontWeight: '600', marginRight: 8 },

  logoutBtn: {
    backgroundColor: '#FFF',
    borderRadius: 16, paddingVertical: 16,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
    marginBottom: 10,
  },
  logoutText: { color: '#EF4444', fontSize: 16, fontWeight: '700', marginLeft: 8 },

  bottomNav: {
    position: 'absolute', bottom: 0, width: '100%', height: 80,
    backgroundColor: '#FFF',
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20, paddingTop: 15,
    shadowColor: '#000', shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.05, shadowRadius: 10, elevation: 10,
  },
  navItem: { alignItems: 'center', justifyContent: 'center' },
  navText: { fontSize: 10, color: '#9CA3AF', marginTop: 4, fontWeight: '600' },
  fabContainer: { alignItems: 'center', justifyContent: 'center', marginTop: -35 },
  fabBtn: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#0D4722',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#0D4722', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
  },
});
