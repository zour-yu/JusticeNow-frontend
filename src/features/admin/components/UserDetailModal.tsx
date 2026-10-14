import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ManagedUser, UserService } from '../../../shared/services/user.service';

const { width } = Dimensions.get('window');

interface Props {
  visible: boolean;
  user: ManagedUser | null;
  currentAdminUid?: string;
  onClose: () => void;
  onUserUpdated: (updatedUser: ManagedUser) => void;
}

const ROLES: Array<{ key: 'CITIZEN' | 'INVESTIGATOR' | 'ADMIN'; label: string; desc: string; icon: any; color: string }> = [
  {
    key: 'CITIZEN',
    label: 'Citizen',
    desc: 'Can file complaints, track investigation progress, and upload evidence.',
    icon: 'person-outline',
    color: '#0284C7',
  },
  {
    key: 'INVESTIGATOR',
    label: 'Investigator',
    desc: 'Assigned to investigate cases, collect evidence, and log findings.',
    icon: 'search-outline',
    color: '#059669',
  },
  {
    key: 'ADMIN',
    label: 'Administrator',
    desc: 'Full administrative access, user account governance, and complaint oversight.',
    icon: 'shield-checkmark-outline',
    color: '#7C3AED',
  },
];

const STATUSES: Array<{ key: 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'INACTIVE'; label: string; color: string; bg: string }> = [
  { key: 'ACTIVE', label: 'Active', color: '#047857', bg: '#D1FAE5' },
  { key: 'PENDING', label: 'Pending', color: '#B45309', bg: '#FEF3C7' },
  { key: 'SUSPENDED', label: 'Suspended', color: '#DC2626', bg: '#FEE2E2' },
  { key: 'INACTIVE', label: 'Inactive / Deactivated', color: '#4B5563', bg: '#F3F4F6' },
];

export const UserDetailModal: React.FC<Props> = ({
  visible,
  user,
  currentAdminUid,
  onClose,
  onUserUpdated,
}) => {
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [selectedRole, setSelectedRole] = useState<'CITIZEN' | 'INVESTIGATOR' | 'ADMIN'>(
    user?.role || 'CITIZEN'
  );
  const [selectedStatus, setSelectedStatus] = useState<'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'INACTIVE'>(
    user?.status || 'ACTIVE'
  );

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setPhone(user.phone || '');
      setSelectedRole(user.role || 'CITIZEN');
      setSelectedStatus(user.status || 'ACTIVE');
      setIsEditing(false);
    }
  }, [user]);

  if (!user) return null;

  const isSelf = user.firebaseUid === currentAdminUid;
  const isDeactivated = user.status === 'INACTIVE' || user.status === 'SUSPENDED';


  const handleSavePermittedInfo = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Validation Error', 'First name and last name are required.');
      return;
    }

    try {
      setIsSaving(true);
      const targetId = user._id || user.firebaseUid;
      const updated = await UserService.updateUser(targetId, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        role: selectedRole,
        status: selectedStatus,
      });

      Alert.alert('Success', 'User information updated successfully.');
      setIsEditing(false);
      onUserUpdated(updated);
    } catch (err: any) {
      Alert.alert('Update Failed', err.message || 'Could not update user information.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleDeactivation = () => {
    if (isSelf) {
      Alert.alert('Restricted Action', 'You cannot deactivate your own administrative account.');
      return;
    }

    const willDeactivate = !isDeactivated;
    const actionTitle = willDeactivate ? 'Deactivate Account' : 'Reactivate Account';
    const actionMsg = willDeactivate
      ? `Are you sure you want to deactivate ${user.name || `${firstName} ${lastName}`}?\n\nThey will be unable to access the system until reactivated.`
      : `Reactivate ${user.name || `${firstName} ${lastName}`}'s account?\n\nThey will regain system access based on their assigned role.`;

    Alert.alert(actionTitle, actionMsg, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: willDeactivate ? 'Deactivate' : 'Reactivate',
        style: willDeactivate ? 'destructive' : 'default',
        onPress: async () => {
          try {
            setIsTogglingStatus(true);
            const targetId = user._id || user.firebaseUid;
            let updated: ManagedUser;
            if (willDeactivate) {
              updated = await UserService.deactivateUser(targetId);
            } else {
              updated = await UserService.reactivateUser(targetId);
            }
            setSelectedStatus(updated.status);
            Alert.alert(
              'Status Changed',
              `Account has been ${willDeactivate ? 'deactivated (INACTIVE)' : 'reactivated (ACTIVE)'}.`
            );
            onUserUpdated(updated);
          } catch (err: any) {
            Alert.alert('Action Failed', err.message || 'Could not change account status.');
          } finally {
            setIsTogglingStatus(false);
          }
        },
      },
    ]);
  };

  const currentRoleConfig = ROLES.find((r) => r.key === user.role) || ROLES[0];
  const currentStatusConfig = STATUSES.find((s) => s.key === user.status) || STATUSES[0];

  const formattedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Unknown date';

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        {/* MODAL HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
            <Ionicons name="close" size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>User Account Details</Text>
          <TouchableOpacity
            onPress={() => setIsEditing(!isEditing)}
            style={styles.editToggleBtn}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isEditing ? 'eye-outline' : 'create-outline'}
              size={20}
              color="#0D4722"
            />
            <Text style={styles.editToggleText}>{isEditing ? 'View' : 'Edit'}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* USER HERO IDENTITY CARD */}
          <View style={styles.identityCard}>
            <View
              style={[
                styles.avatarCircle,
                { borderColor: currentRoleConfig.color, backgroundColor: currentRoleConfig.color + '15' },
              ]}
            >
              <Text style={[styles.avatarText, { color: currentRoleConfig.color }]}>
                {(firstName?.[0] || 'U').toUpperCase()}
                {(lastName?.[0] || '').toUpperCase()}
              </Text>
            </View>

            <Text style={styles.identityName}>
              {firstName} {lastName}
            </Text>
            <Text style={styles.identityEmail}>{user.email}</Text>

            <View style={styles.badgeRow}>
              {/* Role badge */}
              <View
                style={[
                  styles.badge,
                  { backgroundColor: currentRoleConfig.color + '20', borderColor: currentRoleConfig.color },
                ]}
              >
                <Ionicons name={currentRoleConfig.icon} size={13} color={currentRoleConfig.color} />
                <Text style={[styles.badgeText, { color: currentRoleConfig.color }]}>
                  {user.role}
                </Text>
              </View>

              {/* Status badge */}
              <View
                style={[
                  styles.badge,
                  { backgroundColor: currentStatusConfig.bg, borderColor: currentStatusConfig.color },
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: currentStatusConfig.color },
                  ]}
                />
                <Text style={[styles.badgeText, { color: currentStatusConfig.color }]}>
                  {user.status}
                </Text>
              </View>
            </View>
          </View>

          {/* QUICK ACCOUNT ACTION BANNER (DEACTIVATE / REACTIVATE) */}
          <View style={styles.accountActionSection}>
            <View style={styles.actionBanner}>
              <View style={styles.actionBannerInfo}>
                <Ionicons
                  name={isDeactivated ? 'lock-closed-outline' : 'shield-checkmark-outline'}
                  size={24}
                  color={isDeactivated ? '#DC2626' : '#059669'}
                />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.actionBannerTitle}>
                    {isDeactivated ? 'Account Deactivated' : 'Account Active & Authorized'}
                  </Text>
                  <Text style={styles.actionBannerDesc}>
                    {isDeactivated
                      ? 'This user is deactivated and cannot log in.'
                      : 'Account is active and permitted to use the system.'}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.toggleStatusBtn,
                  isDeactivated ? styles.reactivateBtn : styles.deactivateBtn,
                ]}
                onPress={handleToggleDeactivation}
                disabled={isTogglingStatus}
                activeOpacity={0.8}
              >
                {isTogglingStatus ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons
                      name={isDeactivated ? 'checkmark-circle-outline' : 'ban-outline'}
                      size={16}
                      color="#FFFFFF"
                    />
                    <Text style={styles.toggleStatusBtnText}>
                      {isDeactivated ? 'Reactivate' : 'Deactivate Account'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* SYSTEM METADATA SECTION */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>System Metadata</Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>User ID (MongoDB):</Text>
              <Text style={styles.metaValue} numberOfLines={1}>
                {user._id || 'N/A'}
              </Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Firebase UID:</Text>
              <Text style={styles.metaValue} numberOfLines={1}>
                {user.firebaseUid || 'N/A'}
              </Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Registered Date:</Text>
              <Text style={styles.metaValue}>{formattedDate}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Profile Status:</Text>
              <Text
                style={[
                  styles.metaValue,
                  { color: user.isProfileComplete ? '#059669' : '#D97706', fontWeight: '700' },
                ]}
              >
                {user.isProfileComplete ? '✓ Profile Completed' : '⚠ Incomplete'}
              </Text>
            </View>
          </View>

          {/* PERMITTED USER INFORMATION SECTION */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeader}>Permitted User Information</Text>
              {!isEditing && (
                <TouchableOpacity onPress={() => setIsEditing(true)}>
                  <Text style={styles.editLink}>Edit Fields</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.sectionSubtitle}>
              Administrators can update user profile credentials and authorization levels.
            </Text>

            {/* FIRST NAME */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>First Name</Text>
              {isEditing ? (
                <TextInput
                  style={styles.textInput}
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="First Name"
                  placeholderTextColor="#94A3B8"
                />
              ) : (
                <View style={styles.fieldDisplayBox}>
                  <Text style={styles.fieldDisplayText}>{firstName || 'Not provided'}</Text>
                </View>
              )}
            </View>

            {/* LAST NAME */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Last Name</Text>
              {isEditing ? (
                <TextInput
                  style={styles.textInput}
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Last Name"
                  placeholderTextColor="#94A3B8"
                />
              ) : (
                <View style={styles.fieldDisplayBox}>
                  <Text style={styles.fieldDisplayText}>{lastName || 'Not provided'}</Text>
                </View>
              )}
            </View>

            {/* EMAIL (READ-ONLY) */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelWithHint}>
                <Text style={styles.fieldLabel}>Email Address</Text>
                <Text style={styles.readOnlyHint}>Immutable login credential</Text>
              </View>
              <View style={[styles.fieldDisplayBox, { backgroundColor: '#F1F5F9' }]}>
                <Text style={[styles.fieldDisplayText, { color: '#64748B' }]}>{user.email}</Text>
              </View>
            </View>

            {/* PHONE NUMBER */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Phone Number</Text>
              {isEditing ? (
                <TextInput
                  style={styles.textInput}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+94 7X XXX XXXX"
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                />
              ) : (
                <View style={styles.fieldDisplayBox}>
                  <Text style={styles.fieldDisplayText}>{phone || 'Not provided'}</Text>
                </View>
              )}
            </View>

            {/* ROLE SELECTOR */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Assigned Role</Text>
              {isEditing ? (
                <View style={styles.roleOptionsContainer}>
                  {ROLES.map((roleOpt) => {
                    const isSelected = selectedRole === roleOpt.key;
                    return (
                      <TouchableOpacity
                        key={roleOpt.key}
                        style={[
                          styles.roleOptionCard,
                          isSelected && {
                            borderColor: roleOpt.color,
                            backgroundColor: roleOpt.color + '10',
                          },
                        ]}
                        onPress={() => setSelectedRole(roleOpt.key)}
                        activeOpacity={0.8}
                      >
                        <View style={styles.roleOptionHeader}>
                          <Ionicons
                            name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                            size={18}
                            color={isSelected ? roleOpt.color : '#94A3B8'}
                          />
                          <Text
                            style={[
                              styles.roleOptionLabel,
                              isSelected && { color: roleOpt.color, fontWeight: '800' },
                            ]}
                          >
                            {roleOpt.label}
                          </Text>
                        </View>
                        <Text style={styles.roleOptionDesc}>{roleOpt.desc}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : (
                <View
                  style={[
                    styles.fieldDisplayBox,
                    { flexDirection: 'row', alignItems: 'center', gap: 8 },
                  ]}
                >
                  <Ionicons name={currentRoleConfig.icon} size={18} color={currentRoleConfig.color} />
                  <Text style={[styles.fieldDisplayText, { fontWeight: '700', color: currentRoleConfig.color }]}>
                    {user.role} — {currentRoleConfig.desc}
                  </Text>
                </View>
              )}
            </View>

            {/* STATUS SELECTOR (When Editing) */}
            {isEditing && (
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Account Status</Text>
                <View style={styles.statusOptionsRow}>
                  {STATUSES.map((statusOpt) => {
                    const isSelected = selectedStatus === statusOpt.key;
                    return (
                      <TouchableOpacity
                        key={statusOpt.key}
                        style={[
                          styles.statusPill,
                          isSelected
                            ? { backgroundColor: statusOpt.color, borderColor: statusOpt.color }
                            : { backgroundColor: '#F8FAFC', borderColor: '#CBD5E1' },
                        ]}
                        onPress={() => setSelectedStatus(statusOpt.key)}
                      >
                        <Text
                          style={[
                            styles.statusPillText,
                            isSelected ? { color: '#FFFFFF' } : { color: '#475569' },
                          ]}
                        >
                          {statusOpt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* SAVE BUTTON */}
            {isEditing && (
              <View style={styles.saveActionsRow}>
                <TouchableOpacity
                  style={styles.cancelEditBtn}
                  onPress={() => {
                    setFirstName(user.firstName || '');
                    setLastName(user.lastName || '');
                    setPhone(user.phone || '');
                    setSelectedRole(user.role || 'CITIZEN');
                    setSelectedStatus(user.status || 'ACTIVE');
                    setIsEditing(false);
                  }}
                  disabled={isSaving}
                >
                  <Text style={styles.cancelEditBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={handleSavePermittedInfo}
                  disabled={isSaving}
                  activeOpacity={0.8}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-sharp" size={18} color="#FFFFFF" />
                      <Text style={styles.saveBtnText}>Save Updates</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  editToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#E8F5E9',
    gap: 4,
  },
  editToggleText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0D4722',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },

  /* ── Identity Hero Card ── */
  identityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 22,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 26,
    fontWeight: '900',
  },
  identityName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
  },
  identityEmail: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },

  /* ── Account Action Banner ── */
  accountActionSection: {
    marginBottom: 16,
  },
  actionBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionBannerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  actionBannerDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  toggleStatusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  deactivateBtn: {
    backgroundColor: '#DC2626',
  },
  reactivateBtn: {
    backgroundColor: '#059669',
  },
  toggleStatusBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  /* ── Section Cards ── */
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 16,
  },
  editLink: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0D4722',
  },

  /* ── Metadata ── */
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  metaLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  metaValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    maxWidth: width * 0.5,
  },

  /* ── Field Inputs ── */
  fieldGroup: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  labelWithHint: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  readOnlyHint: {
    fontSize: 10,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
  },
  fieldDisplayBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  fieldDisplayText: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
  },

  /* ── Role Options ── */
  roleOptionsContainer: {
    gap: 10,
    marginTop: 4,
  },
  roleOptionCard: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  roleOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  roleOptionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  roleOptionDesc: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
    paddingLeft: 26,
  },

  /* ── Status Options ── */
  statusOptionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '700',
  },

  /* ── Save Actions Row ── */
  saveActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  cancelEditBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelEditBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  saveBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: '#0D4722',
    gap: 6,
    shadowColor: '#0D4722',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
