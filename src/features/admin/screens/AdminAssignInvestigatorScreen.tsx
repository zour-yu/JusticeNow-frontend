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
import { Case, CaseStatus, AssignInvestigatorInput } from '../../../shared/types/case.types';
import { CaseService } from '../../../shared/services/case.service';
import { useAuthStore } from '../../../shared/store/authStore';
import { CaseStatusBadge } from '../../cases/components/CaseStatusBadge';
import { InvestigatorSelectorModal } from '../components/InvestigatorSelectorModal';

const FILTER_TABS = [
  { key: 'ALL', label: 'All Cases' },
  { key: 'UNASSIGNED', label: 'Needs Assignment' },
  { key: CaseStatus.ASSIGNED, label: 'Assigned' },
  { key: CaseStatus.UNDER_INVESTIGATION, label: 'Under Investigation' },
  { key: CaseStatus.EVIDENCE_COLLECTION, label: 'Evidence Collection' },
  { key: CaseStatus.RESOLVED, label: 'Resolved' },
];

export const AdminAssignInvestigatorScreen = ({ navigation }: any) => {
  const { user } = useAuthStore();
  const [cases, setCases] = useState<Case[]>([]);
  const [filteredCases, setFilteredCases] = useState<Case[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCaseForAssignment, setSelectedCaseForAssignment] = useState<Case | null>(null);
  const [investigatorModalVisible, setInvestigatorModalVisible] = useState(false);

  // Security guard for admin role
  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      Alert.alert('Access Denied', 'Only administrators can manage investigator assignments.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    }
  }, [user, navigation]);

  const loadCases = useCallback(async () => {
    try {
      const data = await CaseService.getAssignedCases();
      setCases(data);
    } catch (err) {
      console.log('Error loading cases for assignment:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadCases();
    const unsubscribe = navigation.addListener('focus', () => {
      loadCases();
    });
    return unsubscribe;
  }, [navigation, loadCases]);

  useEffect(() => {
    let result = [...cases];

    // Filter by tab
    if (activeFilter === 'UNASSIGNED') {
      result = result.filter(
        (c) => !c.assignedInvestigatorId || c.assignedInvestigatorId === 'unassigned'
      );
    } else if (activeFilter !== 'ALL') {
      result = result.filter((c) => c.status === activeFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.caseNumber.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q) ||
          c.assignedInvestigatorName?.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q) ||
          (c.complaintDetails?.citizenName &&
            c.complaintDetails.citizenName.toLowerCase().includes(q)) ||
          (c.complaintDetails?.incidentLocation?.city &&
            c.complaintDetails.incidentLocation.city.toLowerCase().includes(q))
      );
    }

    setFilteredCases(result);
  }, [cases, activeFilter, searchQuery]);

  const onRefresh = () => {
    setIsRefreshing(true);
    loadCases();
  };

  const handleOpenAssignModal = (caseItem: Case) => {
    setSelectedCaseForAssignment(caseItem);
    setInvestigatorModalVisible(true);
  };

  const handleAssignConfirm = async (input: AssignInvestigatorInput) => {
    if (!selectedCaseForAssignment) return;

    await CaseService.assignInvestigator(
      selectedCaseForAssignment._id || selectedCaseForAssignment.caseNumber,
      input
    );

    // Refresh case list
    await loadCases();
  };

  const totalUnassigned = cases.filter(
    (c) => !c.assignedInvestigatorId || c.assignedInvestigatorId === 'unassigned'
  ).length;

  const totalActive = cases.filter(
    (c) => c.status !== CaseStatus.RESOLVED && c.status !== CaseStatus.CLOSED
  ).length;

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
              <Text style={styles.headerTitle}>Case Assignment Hub</Text>
              <Text style={styles.headerSubtitle}>
                Allocate appropriate investigators and manage team caseloads
              </Text>
            </View>
          </View>

          {/* Metric Overview Row */}
          <View style={styles.metricsRow}>
            <View style={styles.metricCard}>
              <Text style={styles.metricVal}>{cases.length}</Text>
              <Text style={styles.metricLabel}>Total Cases</Text>
            </View>
            <View style={[styles.metricCard, totalUnassigned > 0 && { backgroundColor: '#FEF3C7' }]}>
              <Text
                style={[
                  styles.metricVal,
                  totalUnassigned > 0 ? { color: '#B45309' } : { color: '#047857' },
                ]}
              >
                {totalUnassigned}
              </Text>
              <Text style={styles.metricLabel}>Unassigned</Text>
            </View>
            <View style={[styles.metricCard, { backgroundColor: '#E8F5E9' }]}>
              <Text style={[styles.metricVal, { color: '#0D4722' }]}>{totalActive}</Text>
              <Text style={[styles.metricLabel, { color: '#065F46' }]}>Active Fieldwork</Text>
            </View>
          </View>

          {/* Search Bar */}
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={18} color="#6B7280" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by case #, title, complainant, investigator..."
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

          {/* Filter Chips Scroll */}
          <View style={styles.filterScrollWrapper}>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={FILTER_TABS}
              keyExtractor={(item) => item.key}
              contentContainerStyle={styles.filterContainer}
              renderItem={({ item }) => {
                const isActive = activeFilter === item.key;
                return (
                  <TouchableOpacity
                    style={[styles.filterChip, isActive && styles.filterChipActive]}
                    onPress={() => setActiveFilter(item.key)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        isActive && styles.filterChipTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>

        {/* Cases List */}
        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#0D4722" />
            <Text style={styles.loadingText}>Loading cases & investigator status...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredCases}
            keyExtractor={(item) => item._id || item.caseNumber}
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
              const formattedCategory = (item.category || '')
                .replace(/_/g, ' ')
                .toLowerCase()
                .replace(/\b\w/g, (c) => c.toUpperCase());

              const isUnassigned =
                !item.assignedInvestigatorId || item.assignedInvestigatorId === 'unassigned';

              return (
                <View style={styles.card}>
                  {/* Header: Case #, Category & Status */}
                  <View style={styles.cardHeader}>
                    <View style={styles.caseNumberCol}>
                      <Text style={styles.caseNumberText}>{item.caseNumber}</Text>
                      <Text style={styles.caseCategoryText}>{formattedCategory}</Text>
                    </View>
                    <CaseStatusBadge status={item.status} size="small" />
                  </View>

                  {/* Title */}
                  <Text style={styles.caseTitle}>{item.title}</Text>

                  {/* Complainant & Location */}
                  <View style={styles.caseMetaRow}>
                    <View style={styles.metaCol}>
                      <Text style={styles.metaLabel}>Complainant:</Text>
                      <Text style={styles.metaVal}>
                        {item.complaintDetails?.isAnonymous
                          ? 'Anonymous Citizen'
                          : item.complaintDetails?.citizenName || 'Citizen'}
                      </Text>
                    </View>
                    <View style={styles.metaCol}>
                      <Text style={styles.metaLabel}>Location:</Text>
                      <Text style={styles.metaVal}>
                        {item.complaintDetails?.incidentLocation?.city || 'N/A'}
                      </Text>
                    </View>
                  </View>

                  {/* Current Investigator Assignment Section */}
                  <View
                    style={[
                      styles.investigatorRow,
                      isUnassigned && styles.investigatorRowUnassigned,
                    ]}
                  >
                    <Ionicons
                      name={isUnassigned ? 'alert-circle-outline' : 'person-circle'}
                      size={24}
                      color={isUnassigned ? '#D97706' : '#0D4722'}
                    />
                    <View style={styles.investigatorTexts}>
                      <Text style={styles.investigatorSectionLabel}>
                        {isUnassigned ? 'Assignment Status' : 'Assigned Investigator'}
                      </Text>
                      <Text
                        style={[
                          styles.investigatorNameVal,
                          isUnassigned && { color: '#B45309', fontWeight: '800' },
                        ]}
                      >
                        {isUnassigned
                          ? 'Unassigned (Action Required)'
                          : item.assignedInvestigatorName}
                      </Text>
                      {!isUnassigned && item.assignedInvestigatorEmail ? (
                        <Text style={styles.investigatorEmailVal}>
                          {item.assignedInvestigatorEmail}
                        </Text>
                      ) : null}
                    </View>

                    {/* Action Button */}
                    <TouchableOpacity
                      style={[
                        styles.assignBtn,
                        isUnassigned && styles.assignBtnPrimary,
                      ]}
                      onPress={() => handleOpenAssignModal(item)}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={isUnassigned ? 'person-add' : 'swap-horizontal'}
                        size={14}
                        color={isUnassigned ? '#FFFFFF' : '#0D4722'}
                      />
                      <Text
                        style={[
                          styles.assignBtnText,
                          isUnassigned && styles.assignBtnTextPrimary,
                        ]}
                      >
                        {isUnassigned ? 'Assign' : 'Reassign'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Footer links */}
                  <View style={styles.cardFooter}>
                    <TouchableOpacity
                      style={styles.detailLink}
                      onPress={() =>
                        navigation.navigate('CaseDetail', {
                          caseId: item._id || item.caseNumber,
                          caseItem: item,
                        })
                      }
                    >
                      <Text style={styles.detailLinkText}>View Full Case Details</Text>
                      <Ionicons name="chevron-forward" size={14} color="#0D4722" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="folder-open-outline" size={52} color="#9CA3AF" />
                <Text style={styles.emptyTitle}>No Cases Found</Text>
                <Text style={styles.emptySubtitle}>
                  No cases matched your current search or filter criteria.
                </Text>
              </View>
            }
          />
        )}

        {/* Investigator Selector Modal */}
        {selectedCaseForAssignment && (
          <InvestigatorSelectorModal
            visible={investigatorModalVisible}
            caseIdOrNumber={selectedCaseForAssignment.caseNumber}
            caseTitle={selectedCaseForAssignment.title}
            currentInvestigatorId={selectedCaseForAssignment.assignedInvestigatorId}
            onClose={() => {
              setInvestigatorModalVisible(false);
              setSelectedCaseForAssignment(null);
            }}
            onAssigned={handleAssignConfirm}
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
    paddingBottom: 10,
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
  filterScrollWrapper: {
    marginHorizontal: -20,
  },
  filterContainer: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
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
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  caseNumberCol: {
    flex: 1,
  },
  caseNumberText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0D4722',
  },
  caseCategoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 2,
  },
  caseTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
    lineHeight: 22,
  },
  caseMetaRow: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    gap: 16,
  },
  metaCol: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  metaVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
    marginTop: 2,
  },
  investigatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    marginBottom: 10,
    gap: 10,
  },
  investigatorRowUnassigned: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  investigatorTexts: {
    flex: 1,
  },
  investigatorSectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
  },
  investigatorNameVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  investigatorEmailVal: {
    fontSize: 11,
    color: '#6B7280',
  },
  assignBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#0D4722',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 4,
  },
  assignBtnPrimary: {
    backgroundColor: '#0D4722',
    borderColor: '#0D4722',
  },
  assignBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0D4722',
  },
  assignBtnTextPrimary: {
    color: '#FFFFFF',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  detailLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0D4722',
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
  },
});
