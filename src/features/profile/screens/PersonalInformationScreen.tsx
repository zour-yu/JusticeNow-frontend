import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Dimensions,
  TextInput,
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../../shared/store/authStore';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';

interface Props {
  navigation: any;
}

const { width } = Dimensions.get('window');

const InfoRow = ({
  icon,
  label,
  value,
  isEditing,
  onChangeText,
  keyboardType = 'default'
}: {
  icon: any;
  label: string;
  value: string;
  isEditing?: boolean;
  onChangeText?: (text: string) => void;
  keyboardType?: any;
}) => (
  <View style={styles.infoRow}>
    <View style={styles.infoRowLeft}>
      <Ionicons name={icon} size={20} color="#0D4722" style={styles.infoIcon} />
      <Text style={styles.infoLabel}>{label}</Text>
    </View>
    <View style={styles.infoRowRight}>
      {isEditing ? (
        <TextInput
          style={styles.inputField}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
        />
      ) : (
        <Text style={styles.infoValue} numberOfLines={1}>{value}</Text>
      )}
      {!isEditing && <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />}
    </View>
  </View>
);

export default function PersonalInformationScreen({ navigation }: Props) {
  const { user, updateProfile } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [editFirstName, setEditFirstName] = useState(user?.firstName || '');
  const [editLastName, setEditLastName] = useState(user?.lastName || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel edit mode
      setIsEditing(false);
      setEditFirstName(user?.firstName || '');
      setEditLastName(user?.lastName || '');
      setEditPhone(user?.phone || '');
    } else {
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    if (!editFirstName.trim() || !editLastName.trim() || !editPhone.trim()) {
      Alert.alert('Error', 'Fields cannot be empty.');
      return;
    }
    setIsLoading(true);
    try {
      await updateProfile({
        firstName: editFirstName,
        lastName: editLastName,
        phone: editPhone,
      });
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIconBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#0D4722" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Personal Information</Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} bounces={false}>
        
        <View style={{ backgroundColor: '#FAFAFA', zIndex: 10 }}>
          <Svg height="50" width={width} style={{ transform: [{ translateY: 5 }] }}>
            <Path
              d={`M 0 50 L 0 25 C ${width * 0.25} -10, ${width * 0.75} 60, ${width} 25 L ${width} 50 Z`}
              fill="#0D4722"
            />
          </Svg>
        </View>

        <View style={[styles.heroSection, { marginTop: -5 }]}>
          <View style={styles.profileBannerContent}>
            <View style={styles.avatarContainer}>
              <View style={[styles.avatarImage, styles.avatarPlaceholder]}>
                <Ionicons name="person" size={40} color="#9CA3AF" />
              </View>
              <TouchableOpacity style={styles.cameraIconBadge}>
                <Ionicons name="camera-outline" size={16} color="#111827" />
              </TouchableOpacity>
            </View>

            <View style={styles.userDetails}>
              <Text style={styles.userName}>{`${user?.firstName || ''} ${user?.lastName || ''}`}</Text>
              <Text style={styles.userSubtext}>Status: {user?.status}</Text>
              <Text style={styles.userSubtext}>Keep your details up to date.</Text>
            </View>
          </View>
        </View>

        <View style={styles.mainContent}>
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Contact Information</Text>
              {isEditing && (
                <TouchableOpacity onPress={handleEditToggle} style={styles.cancelBtn}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              )}
            </View>
            
            <InfoRow 
              icon="person-outline" 
              label="First Name" 
              value={isEditing ? editFirstName : (user?.firstName || 'N/A')} 
              isEditing={isEditing}
              onChangeText={setEditFirstName}
            />
            <InfoRow 
              icon="person-outline" 
              label="Last Name" 
              value={isEditing ? editLastName : (user?.lastName || 'N/A')} 
              isEditing={isEditing}
              onChangeText={setEditLastName}
            />
            <InfoRow 
              icon="mail-outline" 
              label="Email Address" 
              value={user?.email || 'N/A'} 
              isEditing={false} // Email cannot be edited here
            />
            <InfoRow 
              icon="call-outline" 
              label="Phone Number" 
              value={isEditing ? editPhone : (user?.phone || 'N/A')} 
              isEditing={isEditing}
              onChangeText={setEditPhone}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Account Details</Text>
            
            <InfoRow 
              icon="shield-checkmark-outline" 
              label="Role" 
              value={user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'N/A'} 
            />
            <InfoRow 
              icon="information-circle-outline" 
              label="Status" 
              value={user?.status ? user.status.charAt(0).toUpperCase() + user.status.slice(1) : 'N/A'} 
            />
            <InfoRow 
              icon="checkmark-circle-outline" 
              label="Profile Complete" 
              value={user?.isProfileComplete ? 'Yes' : 'No'} 
            />
          </View>

          <TouchableOpacity 
            style={styles.editBtn} 
            activeOpacity={0.8} 
            onPress={isEditing ? handleSave : handleEditToggle}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.editBtnText}>{isEditing ? 'Save Changes' : 'Edit Information'}</Text>
            )}
          </TouchableOpacity>
          
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* BOTTOM NAV */}
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
          <TouchableOpacity style={styles.fabBtn} activeOpacity={0.9} onPress={() => navigation.navigate('SubmitComplaint')}>
            <Ionicons name="add" size={32} color="#FFF" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="chatbubble-outline" size={24} color="#9CA3AF" />
          <Text style={styles.navText}>Messages</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Profile')}>
          <Ionicons name="person" size={24} color="#0D4722" />
          <Text style={[styles.navText, { color: '#0D4722' }]}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const HERO_H = 140;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAFAFA' },
  scrollView: { flex: 1, backgroundColor: '#FAFAFA' },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
    backgroundColor: '#FAFAFA',
    zIndex: 10,
  },
  headerIconBtn: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0D4722' },

  heroSection: {
    height: HERO_H,
    backgroundColor: '#0D4722',
    borderBottomLeftRadius: 30, // bottom corners of green banner
    borderBottomRightRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 15, // Push content down so the top of the avatar isn't sliced by the SVG overlap
  },
  profileBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: { position: 'relative', marginRight: 16 },
  avatarImage: {
    width: 76, height: 76, borderRadius: 38,
    borderWidth: 3, borderColor: '#FFF',
  },
  avatarPlaceholder: {
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIconBadge: {
    position: 'absolute', bottom: 0, right: -4,
    backgroundColor: '#FFF',
    width: 26, height: 26, borderRadius: 13,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 4, elevation: 3,
  },
  userDetails: { flex: 1 },
  userName: { color: '#FFF', fontSize: 18, fontWeight: '700', marginBottom: 4 },
  userSubtext: { color: '#D1FAE5', fontSize: 12, marginBottom: 2 },

  mainContent: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    marginTop: -40, // Pull up to overlap green banner
    marginHorizontal: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 20,
  },
  
  sectionContainer: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  cancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  infoIcon: {
    width: 24,
  },
  infoLabel: {
    fontSize: 13,
    color: '#4B5563',
    marginLeft: 10,
  },
  infoRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  infoValue: {
    fontSize: 12,
    color: '#111827',
    fontWeight: '500',
    marginRight: 10,
    flexShrink: 1,
  },
  inputField: {
    flex: 1,
    textAlign: 'right',
    fontSize: 12,
    color: '#111827',
    fontWeight: '500',
    paddingVertical: 0,
    marginRight: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#0D4722',
  },

  editBtn: {
    backgroundColor: '#0D4722',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  editBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },

  bottomNav: {
    position: 'absolute', bottom: 0, width: '100%', height: 80,
    backgroundColor: '#FFF',
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20, paddingTop: 15,
    borderTopWidth: 1, borderTopColor: '#F3F4F6',
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
