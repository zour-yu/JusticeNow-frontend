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
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserService, InvestigatorApplicant } from '../../../shared/services/user.service';
import { useAuthStore } from '../../../shared/store/authStore';

export const AdminInvestigatorApprovalScreen = ({ navigation }: any) => {
  const { user } = useAuthStore();
  const [applicants, setApplicants] = useState<InvestigatorApplicant[]>([]);
  const [filteredApplicants, setFilteredApplicants] = useState<InvestigatorApplicant[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'PENDING' | 'ACTIVE' | 'ALL'>('PENDING');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Security guard for admin role
  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      Alert.alert('Access Denied', 'Only administrators can approve investigator applications.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    }
  }, [user, navigation]);

  const loadApplicants = useCallback(async () => {
    try {
      const data = await UserService.getAllInvestigators();
      setApplicants(data);
    } catch (err) {
      console.log('Error loading investigator applicants:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadApplicants();
    const unsubscribe = navigation.addListener('focus', () => {
      loadApplicants();
    });
    return unsubscribe;
  }, [navigation, loadApplicants]);

  useEffect(() => {
    let result = [...applicants];

    if (activeFilter === 'PENDING') {
      result = result.filter((a) => a.status === 'PENDING');
    } else if (activeFilter === 'ACTIVE') {
      result = result.filter((a) => a.status === 'ACTIVE');
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.email.toLowerCase().includes(q) ||
          (a.phone && a.phone.toLowerCase().includes(q)) ||
          (a.specialization && a.specialization.toLowerCase().includes(q))
      );
    }

    setFilteredApplicants(result);
  }, [applicants, activeFilter, searchQuery]);

  const onRefresh = () => {
    setIsRefreshing(true);
    loadApplicants();
  };

  const handleApprove = (applicant: InvestigatorApplicant) => {
    Alert.alert(
      'Approve Investigator',
      `Are you sure you want to approve ${applicant.name} as an active investigator? Their status will be set to ACTIVE in the database and they will be able to investigate cases.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve Investigator',
          style: 'default',
          onPress: async () => {
            try {
              setProcessingId(applicant._id || applicant.firebaseUid);
              await UserService.approveInvestigator(applicant._id || applicant.firebaseUid);
              Alert.alert('Approved', `${applicant.name} is now an ACTIVE investigator.`);
              await loadApplicants();
            } catch (err: any) {
              Alert.alert('Approval Failed', err.message || 'Could not approve applicant.');
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]
    );
  };

  const handleReject = (applicant: InvestigatorApplicant) => {
    Alert.alert(
      'Decline Application',
      `Are you sure you want to decline the investigator application for ${applicant.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline Application',
          style: 'destructive',
          onPress: async () => {
            try {
              setProcessingId(applicant._id || applicant.firebaseUid);
              await UserService.rejectInvestigator(applicant._id || applicant.firebaseUid);
              Alert.alert('Application Declined', `${applicant.name}'s registration has been declined.`);
              await loadApplicants();
            } catch (err: any) {
              Alert.alert('Action Failed', err.message || 'Could not decline application.');
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]
    );
  };

  const totalPending = applicants.filter((a) => a.status === 'PENDING').length;
  const totalActive = applicants.filter((a) => a.status === 'ACTIVE').length;

  const filterTabs = [
    { key: 'PENDING', label: `Pending Approval (${totalPending})` },
    { key: 'ACTIVE', label: `Active (${totalActive})` },
    { key: 'ALL', label: `All (${applicants.length})` },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerArea}>
          <View style={styles.topNavRow}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={24} color="#0D4722" />
            </TouchableOpacity>
            <View style={styles.headerTitleCol}>
              <Text style={styles.headerTitle}>Investigator Approvals</Text>
              <Text style={styles.headerSubtitle}>
                Verify credentials and grant active investigator access
              </Text>
            </View>
          </View>

          {/* Metrics summary */}
          <View style={styles.metricsRow}>
            <View style={[styles.metricCard, totalPending > 0 && { backgroundColor: '#FEF3C7' }]}>
              <Text style={[styles.metricVal, totalPending > 0 ? { color: '#B45309' } : { color: '#047857' }]}>
                {totalPending}
              </Text>
              <Text style={styles.metricLabel}>Awaiting Approval</Text>
            </View>
            <View style={[styles.metricCard, { backgroundColor: '#E8F5E9' }]}>
              <Text style={[styles.metricVal, { color: '#0D4722' }]}>{totalActive}</Text>
              <Text style={[styles.metricLabel, { color: '#065F46' }]}>Active On Duty</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricVal}>{applicants.length}</Text>
              <Text style={styles.metricLabel}>Total Registrations</Text>
            </View>
          </View>

          {/* Search Bar */}
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={18} color="#6B7280" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name, email, phone, specialization..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>

          {/* Filter Chips */}
          <View style={styles.filterRow}>
            {filterTabs.map((tab) => {
              const isActive = activeFilter === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.filterChip, isActive && styles.filterChipActive]}
                  onPress={() => setActiveFilter(tab.key as any)}
                >
                  <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Applicants List */}
        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#0D4722" />
            <Text style={styles.loadingText}>Loading investigator applications...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredApplicants}
            keyExtractor={(item) => item._id || item.email}
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
            renderItem={({ item }) => {
              const isPending = item.status === 'PENDING';
              const isActive = item.status === 'ACTIVE';
              const isBusy = processingId === item._id || processingId === item.firebaseUid;

              const formattedDate = item.createdAt
                ? new Date(item.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'Recent';

              return (
                <View style={[styles.applicantCard, isPending && styles.applicantCardPending]}>
                  {/* Top: Avatar & Meta */}
                  <View style={styles.cardTopRow}>
                    <View style={[styles.avatarCircle, isPending && { backgroundColor: '#F59E0B' }]}>
                      <Text style={styles.avatarInitials}>
                        {item.firstName?.[0] || 'I'}
                        {item.lastName?.[0] || 'N'}
                      </Text>
                    </View>

                    <View style={styles.applicantInfo}>
                      <View style={styles.nameBadgeRow}>
                        <Text style={styles.applicantName}>{item.name}</Text>
                        <View
                          style={[
                            styles.statusBadge,
                            isPending
                              ? { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }
                              : isActive
                              ? { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }
                              : { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' },
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusBadgeText,
                              isPending
                                ? { color: '#B45309' }
                                : isActive
                                ? { color: '#047857' }
                                : { color: '#6B7280' },
                            ]}
                          >
                            {isPending ? 'PENDING APPROVAL' : isActive ? 'ACTIVE' : item.status}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.applicantEmail}>{item.email}</Text>
                      {item.phone ? <Text style={styles.applicantPhone}>📞 {item.phone}</Text> : null}
                    </View>
                  </View>

                  {/* Specialization & Application Date */}
                  <View style={styles.metaRow}>
                    <Text style={styles.appliedDateText}>Applied on {formattedDate}</Text>
                    {item.specialization ? (
                      <Text style={styles.specializationBadge} numberOfLines={1}>
                        ⭐ {item.specialization}
                      </Text>
                    ) : null}
                  </View>

                  {/* Actions for Pending Applicants */}
                  {isPending && (
                    <View style={styles.cardActions}>
                      <TouchableOpacity
                        style={[styles.rejectBtn, isBusy && styles.btnDisabled]}
                        onPress={() => handleReject(item)}
                        disabled={isBusy}
                      >
                        <Ionicons name="close-circle-outline" size={16} color="#DC2626" />
                        <Text style={styles.rejectBtnText}>Decline</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.approveBtn, isBusy && styles.btnDisabled]}
                        onPress={() => handleApprove(item)}
                        disabled={isBusy}
                        activeOpacity={0.85}
                      >
                        {isBusy ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <>
                            <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                            <Text style={styles.approveBtnText}>Approve as Investigator</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Status Note for Active Applicants */}
                  {isActive && (
                    <View style={styles.activeNoteRow}>
                      <Ionicons name="shield-checkmark" size={16} color="#059669" />
                      <Text style={styles.activeNoteText}>
                        Verified on-duty investigator. Eligible for case allocations.
                      </Text>
                    </View>
                  )}
                </View>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={48} color="#9CA3AF" />
                <Text style={styles.emptyTitle}>No Applications Found</Text>
                <Text style={styles.emptySubtitle}>
                  {activeFilter === 'PENDING'
                    ? 'There are currently no pending investigator registration requests.'
                    : 'No matching investigator profiles found.'}
                </Text>
              </View>
            }
          />
        )}
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
    backgroundColor: '#FAFAFA',
  },
  headerArea: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#FAFAFA',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  backBtn: {
    paddingTop: 2,
  },
  headerTitleCol: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0D4722',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#4B5563',
    marginTop: 2,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  metricVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#4B5563',
    marginTop: 2,
    textAlign: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#111827',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterChipActive: {
    backgroundColor: '#0D4722',
    borderColor: '#0D4722',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  applicantCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  applicantCardPending: {
    borderColor: '#FDE68A',
    backgroundColor: '#FFFDF5',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#0D4722',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  applicantInfo: {
    flex: 1,
  },
  nameBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
    flexWrap: 'wrap',
    gap: 6,
  },
  applicantName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  applicantEmail: {
    fontSize: 12,
    color: '#6B7280',
  },
  applicantPhone: {
    fontSize: 12,
    color: '#374151',
    marginTop: 2,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
  },
  appliedDateText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
  },
  specializationBadge: {
    fontSize: 11,
    color: '#0D4722',
    fontWeight: '700',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  rejectBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },
  approveBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#0D4722',
  },
  approveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  activeNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  activeNoteText: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 18,
  },
});
