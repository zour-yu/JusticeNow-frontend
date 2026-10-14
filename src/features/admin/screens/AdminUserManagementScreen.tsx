import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ManagedUser, UserService } from '../../../shared/services/user.service';
import { useAuthStore } from '../../../shared/store/authStore';
import { UserDetailModal } from '../components/UserDetailModal';

export const AdminUserManagementScreen = ({ navigation }: any) => {
  const { user: currentAdmin } = useAuthStore();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<ManagedUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<'ALL' | 'CITIZEN' | 'INVESTIGATOR' | 'ADMIN'>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING'>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedUserForDetail, setSelectedUserForDetail] = useState<ManagedUser | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [actionProcessingId, setActionProcessingId] = useState<string | null>(null);

  // Security guard for admin role
  useEffect(() => {
    if (currentAdmin && currentAdmin.role !== 'ADMIN') {
      Alert.alert('Access Denied', 'Only administrators can manage user accounts.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    }
  }, [currentAdmin, navigation]);

  const loadUsers = useCallback(async () => {
    try {
      const data = await UserService.getAllUsers();
      setUsers(data);
    } catch (err) {
      console.log('Error loading users:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
    const unsubscribe = navigation.addListener('focus', () => {
      loadUsers();
    });
    return unsubscribe;
  }, [navigation, loadUsers]);

  // Filter users based on search query, role, and status
  useEffect(() => {
    let result = [...users];

    if (selectedRoleFilter !== 'ALL') {
      result = result.filter((u) => u.role === selectedRoleFilter);
    }

    if (selectedStatusFilter !== 'ALL') {
      result = result.filter((u) => u.status === selectedStatusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (u) =>
          u.name?.toLowerCase().includes(q) ||
          u.firstName?.toLowerCase().includes(q) ||
          u.lastName?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          (u.phone && u.phone.toLowerCase().includes(q))
      );
    }

    setFilteredUsers(result);
  }, [users, selectedRoleFilter, selectedStatusFilter, searchQuery]);

  const onRefresh = () => {
    setIsRefreshing(true);
    loadUsers();
  };

  const handleOpenDetail = (user: ManagedUser) => {
    setSelectedUserForDetail(user);
    setDetailModalVisible(true);
  };

  const handleUserUpdated = (updatedUser: ManagedUser) => {
    setUsers((prev) =>
      prev.map((u) =>
        u._id === updatedUser._id || u.firebaseUid === updatedUser.firebaseUid ? updatedUser : u
      )
    );
    setSelectedUserForDetail(updatedUser);
  };

  const handleQuickToggleDeactivation = (user: ManagedUser) => {
    if (user.firebaseUid === currentAdmin?.firebaseUid) {
      Alert.alert('Restricted Action', 'You cannot deactivate your own administrative account.');
      return;
    }

    const isDeactivated = user.status === 'INACTIVE' || user.status === 'SUSPENDED';
    const actionTitle = isDeactivated ? 'Reactivate Account' : 'Deactivate Account';
    const actionMsg = isDeactivated
      ? `Reactivate ${user.name || `${user.firstName} ${user.lastName}`}?\n\nThey will regain system access.`
      : `Deactivate ${user.name || `${user.firstName} ${user.lastName}`}?\n\nThey will be unable to log in until reactivated.`;

    Alert.alert(actionTitle, actionMsg, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: isDeactivated ? 'Reactivate' : 'Deactivate',
        style: isDeactivated ? 'default' : 'destructive',
        onPress: async () => {
          const targetId = user._id || user.firebaseUid;
          try {
            setActionProcessingId(targetId);
            let updated: ManagedUser;
            if (isDeactivated) {
              updated = await UserService.reactivateUser(targetId);
            } else {
              updated = await UserService.deactivateUser(targetId);
            }
            handleUserUpdated(updated);
            Alert.alert(
              'Status Changed',
              `Account ${isDeactivated ? 'reactivated' : 'deactivated'} successfully.`
            );
          } catch (err: any) {
            Alert.alert('Action Failed', err.message || 'Could not change account status.');
          } finally {
            setActionProcessingId(null);
          }
        },
      },
    ]);
  };

  // Metrics
  const totalCount = users.length;
  const citizenCount = users.filter((u) => u.role === 'CITIZEN').length;
  const investigatorCount = users.filter((u) => u.role === 'INVESTIGATOR').length;
  const adminCount = users.filter((u) => u.role === 'ADMIN').length;
  const deactivatedCount = users.filter((u) => u.status === 'INACTIVE' || u.status === 'SUSPENDED').length;

  const roleTabs: Array<{ key: 'ALL' | 'CITIZEN' | 'INVESTIGATOR' | 'ADMIN'; label: string; count: number }> = [
    { key: 'ALL', label: 'All Users', count: totalCount },
    { key: 'CITIZEN', label: 'Citizens', count: citizenCount },
    { key: 'INVESTIGATOR', label: 'Investigators', count: investigatorCount },
    { key: 'ADMIN', label: 'Admins', count: adminCount },
  ];

  const statusChips: Array<{ key: 'ALL' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING'; label: string }> = [
    { key: 'ALL', label: 'All Statuses' },
    { key: 'ACTIVE', label: 'Active' },
    { key: 'INACTIVE', label: 'Inactive' },
    { key: 'SUSPENDED', label: 'Suspended' },
    { key: 'PENDING', label: 'Pending' },
  ];

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return { bg: '#F3E8FF', text: '#7C3AED', border: '#DDD6FE' };
      case 'INVESTIGATOR':
        return { bg: '#D1FAE5', text: '#059669', border: '#A7F3D0' };
      default:
        return { bg: '#E0F2FE', text: '#0284C7', border: '#BAE6FD' };
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return { bg: '#D1FAE5', text: '#047857' };
      case 'PENDING':
        return { bg: '#FEF3C7', text: '#B45309' };
      case 'SUSPENDED':
        return { bg: '#FEE2E2', text: '#DC2626' };
      case 'INACTIVE':
      default:
        return { bg: '#F1F5F9', text: '#475569' };
    }
  };

  const renderUserItem = ({ item }: { item: ManagedUser }) => {
    const roleStyle = getRoleBadgeStyle(item.role);
    const statusStyle = getStatusBadgeStyle(item.status);
    const isDeactivated = item.status === 'INACTIVE' || item.status === 'SUSPENDED';
    const isProcessing = actionProcessingId === (item._id || item.firebaseUid);
    const isCurrentAdmin = item.firebaseUid === currentAdmin?.firebaseUid;

    const formattedDate = item.createdAt
      ? new Date(item.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : '';

    return (
      <TouchableOpacity
        style={styles.userCard}
        onPress={() => handleOpenDetail(item)}
        activeOpacity={0.85}
      >
        <View style={styles.cardMainRow}>
          {/* Avatar */}
          <View style={[styles.avatarCircle, { backgroundColor: roleStyle.bg, borderColor: roleStyle.border }]}>
            <Text style={[styles.avatarText, { color: roleStyle.text }]}>
              {(item.firstName?.[0] || 'U').toUpperCase()}
              {(item.lastName?.[0] || '').toUpperCase()}
            </Text>
          </View>

          {/* User Details */}
          <View style={styles.cardInfo}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.userName} numberOfLines={1}>
                {item.firstName} {item.lastName}
                {isCurrentAdmin && <Text style={styles.youTag}> (You)</Text>}
              </Text>
            </View>

            <Text style={styles.userEmail} numberOfLines={1}>
              {item.email}
            </Text>

            {item.phone ? (
              <Text style={styles.userPhone} numberOfLines={1}>
                📞 {item.phone}
              </Text>
            ) : null}

            {/* Badges Row */}
            <View style={styles.cardBadgesRow}>
              <View
                style={[
                  styles.pillBadge,
                  { backgroundColor: roleStyle.bg, borderColor: roleStyle.border },
                ]}
              >
                <Text style={[styles.pillBadgeText, { color: roleStyle.text }]}>{item.role}</Text>
              </View>

              <View style={[styles.pillBadge, { backgroundColor: statusStyle.bg }]}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: statusStyle.text },
                  ]}
                />
                <Text style={[styles.pillBadgeText, { color: statusStyle.text }]}>
                  {item.status}
                </Text>
              </View>

              {formattedDate ? (
                <Text style={styles.dateText}>Joined {formattedDate}</Text>
              ) : null}
            </View>
          </View>

          {/* Right Action: Chevron */}
          <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
        </View>

        {/* Quick Card Action Footer */}
        <View style={styles.cardFooter}>
          <TouchableOpacity
            style={styles.viewDetailsBtn}
            onPress={() => handleOpenDetail(item)}
            activeOpacity={0.7}
          >
            <Ionicons name="information-circle-outline" size={15} color="#0D4722" />
            <Text style={styles.viewDetailsBtnText}>View Details & Edit</Text>
          </TouchableOpacity>

          {!isCurrentAdmin && (
            <TouchableOpacity
              style={[
                styles.quickDeactivateBtn,
                isDeactivated ? styles.quickReactivateBg : styles.quickDeactivateBg,
              ]}
              onPress={() => handleQuickToggleDeactivation(item)}
              disabled={isProcessing}
              activeOpacity={0.7}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons
                    name={isDeactivated ? 'checkmark-circle' : 'ban'}
                    size={13}
                    color="#FFFFFF"
                  />
                  <Text style={styles.quickDeactivateBtnText}>
                    {isDeactivated ? 'Reactivate' : 'Deactivate'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />
      <View style={styles.container}>
        {/* ── TOP APP BAR ── */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={22} color="#0F172A" />
          </TouchableOpacity>
          <View style={styles.headerTitleGroup}>
            <Text style={styles.headerTitle}>User Accounts</Text>
            <Text style={styles.headerSubtitle}>System Governance & Access Control</Text>
          </View>
          <View style={styles.counterBadge}>
            <Text style={styles.counterBadgeText}>{filteredUsers.length}</Text>
          </View>
        </View>

        {/* ── QUICK METRICS BANNER ── */}
        <View style={styles.metricsCard}>
          <View style={styles.metricItem}>
            <Text style={styles.metricVal}>{totalCount}</Text>
            <Text style={styles.metricLbl}>Total Users</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={[styles.metricVal, { color: '#0284C7' }]}>{citizenCount}</Text>
            <Text style={styles.metricLbl}>Citizens</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={[styles.metricVal, { color: '#059669' }]}>{investigatorCount}</Text>
            <Text style={styles.metricLbl}>Investigators</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={[styles.metricVal, { color: '#7C3AED' }]}>{adminCount}</Text>
            <Text style={styles.metricLbl}>Admins</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={[styles.metricVal, { color: deactivatedCount > 0 ? '#DC2626' : '#64748B' }]}>
              {deactivatedCount}
            </Text>
            <Text style={styles.metricLbl}>Inactive</Text>
          </View>
        </View>

        {/* ── SEARCH BAR ── */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={18} color="#64748B" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, email, or phone..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {/* ── ROLE FILTER TABS ── */}
        <View style={styles.roleTabsContainer}>
          {roleTabs.map((tab) => {
            const isSelected = selectedRoleFilter === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.roleTab, isSelected && styles.roleTabSelected]}
                onPress={() => setSelectedRoleFilter(tab.key)}
                activeOpacity={0.8}
              >
                <Text style={[styles.roleTabText, isSelected && styles.roleTabTextSelected]}>
                  {tab.label} ({tab.count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── STATUS FILTER CHIPS ── */}
        <View style={styles.statusChipsContainer}>
          {statusChips.map((chip) => {
            const isSelected = selectedStatusFilter === chip.key;
            return (
              <TouchableOpacity
                key={chip.key}
                style={[styles.statusChip, isSelected && styles.statusChipSelected]}
                onPress={() => setSelectedStatusFilter(chip.key)}
              >
                <Text style={[styles.statusChipText, isSelected && styles.statusChipTextSelected]}>
                  {chip.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── MAIN USERS LIST ── */}
        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#0D4722" />
            <Text style={styles.loadingText}>Fetching system user accounts...</Text>
          </View>
        ) : filteredUsers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No matching users found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery.trim()
                ? `No results match "${searchQuery}". Try a different search term or clear filters.`
                : 'No user accounts match the selected role and status filters.'}
            </Text>
            {(searchQuery.trim() || selectedRoleFilter !== 'ALL' || selectedStatusFilter !== 'ALL') && (
              <TouchableOpacity
                style={styles.resetFiltersBtn}
                onPress={() => {
                  setSearchQuery('');
                  setSelectedRoleFilter('ALL');
                  setSelectedStatusFilter('ALL');
                }}
              >
                <Text style={styles.resetFiltersBtnText}>Reset All Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <FlatList
            data={filteredUsers}
            keyExtractor={(item) => item._id || item.firebaseUid || item.email}
            renderItem={renderUserItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={onRefresh}
                colors={['#0D4722']}
                tintColor="#0D4722"
              />
            }
          />
        )}

        {/* ── USER DETAIL MODAL ── */}
        {selectedUserForDetail ? (
          <UserDetailModal
            visible={detailModalVisible}
            user={selectedUserForDetail}
            currentAdminUid={currentAdmin?.firebaseUid}
            onClose={() => setDetailModalVisible(false)}
            onUserUpdated={handleUserUpdated}
          />
        ) : null}
      </View>
    </SafeAreaView>

  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  /* ── Header ── */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitleGroup: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  counterBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  counterBadgeText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0D4722',
  },

  /* ── Quick Metrics Card ── */
  metricsCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  metricLbl: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 22,
    backgroundColor: '#E2E8F0',
  },

  /* ── Search Bar ── */
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '500',
  },
  clearSearchBtn: {
    padding: 4,
  },

  /* ── Role Filter Tabs ── */
  roleTabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 3,
  },
  roleTab: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },
  roleTabSelected: {
    backgroundColor: '#0D4722',
  },
  roleTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  roleTabTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  /* ── Status Filter Chips ── */
  statusChipsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 8,
    gap: 6,
    flexWrap: 'wrap',
  },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statusChipSelected: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  statusChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  statusChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  /* ── User List ── */
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '900',
  },
  cardInfo: {
    flex: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  youTag: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0D4722',
  },
  userEmail: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  userPhone: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
  },
  cardBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  pillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 4,
  },
  pillBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  dateText: {
    fontSize: 10,
    color: '#94A3B8',
    marginLeft: 4,
  },

  /* ── Card Footer ── */
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  viewDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewDetailsBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0D4722',
  },
  quickDeactivateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  quickDeactivateBg: {
    backgroundColor: '#DC2626',
  },
  quickReactivateBg: {
    backgroundColor: '#059669',
  },
  quickDeactivateBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  /* ── Loading & Empty States ── */
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 10,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  resetFiltersBtn: {
    marginTop: 16,
    backgroundColor: '#0D4722',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12,
  },
  resetFiltersBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
