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
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Case, CaseStatus, CasePriority } from '../../../shared/types/case.types';
import { ComplaintCategory } from '../../../shared/types/complaint.types';
import { CaseService } from '../../../shared/services/case.service';
import { useAuthStore } from '../../../shared/store/authStore';
import { CaseCard } from '../../cases/components/CaseCard';

const STATUS_FILTERS = [
  { key: 'ALL', label: 'All Statuses' },
  { key: CaseStatus.NEW, label: 'New / Unassigned' },
  { key: CaseStatus.PENDING, label: 'Pending Start' },
  { key: CaseStatus.UNDER_INVESTIGATION, label: 'Under Investigation' },
  { key: CaseStatus.RESOLVED, label: 'Resolved' },
  { key: CaseStatus.CLOSED, label: 'Closed' },
];

const CATEGORY_FILTERS: Array<{ key: string; label: string; icon: string }> = [
  { key: 'ALL', label: 'All Categories', icon: 'apps-outline' },
  { key: ComplaintCategory.POLICE_MISCONDUCT, label: 'Police Misconduct', icon: 'shield-outline' },
  { key: ComplaintCategory.DISCRIMINATION, label: 'Discrimination', icon: 'scale-outline' },
  { key: ComplaintCategory.ARBITRARY_DETENTION, label: 'Arbitrary Detention', icon: 'lock-closed-outline' },
  { key: ComplaintCategory.FREEDOM_OF_EXPRESSION, label: 'Free Speech', icon: 'megaphone-outline' },
  { key: ComplaintCategory.LABOR_RIGHTS, label: 'Labor Rights', icon: 'briefcase-outline' },
  { key: ComplaintCategory.GENDER_BASED_VIOLENCE, label: 'Gender-Based', icon: 'heart-outline' },
  { key: ComplaintCategory.CHILD_RIGHTS, label: 'Child Rights', icon: 'people-outline' },
  { key: ComplaintCategory.OTHER, label: 'Other', icon: 'document-text-outline' },
];

export const AdminCaseListScreen = ({ navigation }: any) => {
  const { user } = useAuthStore();
  const [cases, setCases] = useState<Case[]>([]);
  const [filteredCases, setFilteredCases] = useState<Case[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Security guard for admin role
  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      Alert.alert('Access Denied', 'Only administrators can monitor all cases.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    }
  }, [user, navigation]);

  const loadAllCases = useCallback(async () => {
    try {
      const data = await CaseService.getAllCases();
      setCases(data);
    } catch (err) {
      console.log('Error loading all cases for admin:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAllCases();
    const unsubscribe = navigation.addListener('focus', () => {
      loadAllCases();
    });
    return unsubscribe;
  }, [navigation, loadAllCases]);

  // Multi-dimensional filtering by Status, Category, and Search term
  useEffect(() => {
    let result = [...cases];

    // Filter by Status
    if (selectedStatus !== 'ALL') {
      result = result.filter((c) => c.status === selectedStatus);
    }

    // Filter by Category
    if (selectedCategory !== 'ALL') {
      result = result.filter((c) => c.category === selectedCategory);
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.caseNumber?.toLowerCase().includes(q) ||
          c.title?.toLowerCase().includes(q) ||
          c.category?.toLowerCase().includes(q) ||
          c.assignedInvestigatorName?.toLowerCase().includes(q) ||
          c.complaintDetails?.citizenName?.toLowerCase().includes(q) ||
          (c.complaintDetails?.incidentLocation?.city &&
            c.complaintDetails.incidentLocation.city.toLowerCase().includes(q))
      );
    }

    setFilteredCases(result);
  }, [cases, selectedStatus, selectedCategory, searchQuery]);

  const onRefresh = () => {
    setIsRefreshing(true);
    loadAllCases();
  };

  const handleOpenCaseDetail = (caseItem: Case) => {
    navigation.navigate('CaseDetail', {
      caseId: caseItem._id || caseItem.caseNumber,
      caseItem,
    });
  };

  // Metrics
  const totalCases = cases.length;
  const activeCases = cases.filter((c) => c.status === CaseStatus.UNDER_INVESTIGATION).length;
  const pendingCases = cases.filter((c) => c.status === CaseStatus.PENDING).length;
  const unassignedCases = cases.filter(
    (c) => !c.assignedInvestigatorId || c.assignedInvestigatorId === 'unassigned' || c.status === CaseStatus.NEW
  ).length;
  const resolvedCases = cases.filter(
    (c) => c.status === CaseStatus.RESOLVED || c.status === CaseStatus.CLOSED
  ).length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />
      <View style={styles.container}>
        {/* ── TOP HEADER ── */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={22} color="#0F172A" />
          </TouchableOpacity>
          <View style={styles.headerTitleGroup}>
            <Text style={styles.headerTitle}>All System Cases</Text>
            <Text style={styles.headerSubtitle}>Monitor investigations & identify cases needing attention</Text>
          </View>
          <View style={styles.totalBadge}>
            <Text style={styles.totalBadgeText}>{filteredCases.length}</Text>
          </View>
        </View>

        {/* ── QUICK METRICS TICKER ── */}
        <View style={styles.metricsCard}>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{totalCases}</Text>
            <Text style={styles.metricLabel}>Total</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={[styles.metricValue, { color: '#0284C7' }]}>{activeCases}</Text>
            <Text style={styles.metricLabel}>In Field</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={[styles.metricValue, { color: '#D97706' }]}>{pendingCases}</Text>
            <Text style={styles.metricLabel}>Pending</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={[styles.metricValue, unassignedCases > 0 && { color: '#DC2626' }]}>
              {unassignedCases}
            </Text>
            <Text style={styles.metricLabel}>Needs Assign</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={[styles.metricValue, { color: '#059669' }]}>{resolvedCases}</Text>
            <Text style={styles.metricLabel}>Resolved</Text>
          </View>
        </View>

        {/* ── SEARCH INPUT ── */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color="#64748B" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by case #, title, citizen, investigator..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {/* ── STATUS FILTER TABS (HORIZONTAL SCROLL) ── */}
        <View style={styles.statusTabsWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.statusTabsContent}
          >
            {STATUS_FILTERS.map((tab) => {
              const isSelected = selectedStatus === tab.key;
              const count =
                tab.key === 'ALL'
                  ? totalCases
                  : cases.filter((c) => c.status === tab.key).length;

              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.statusTab, isSelected && styles.statusTabSelected]}
                  onPress={() => setSelectedStatus(tab.key)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.statusTabText, isSelected && styles.statusTabTextSelected]}>
                    {tab.label} ({count})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── CATEGORY FILTER CHIPS (HORIZONTAL SCROLL) ── */}
        <View style={styles.categoryChipsWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryChipsContent}
          >
            {CATEGORY_FILTERS.map((cat) => {
              const isSelected = selectedCategory === cat.key;
              return (
                <TouchableOpacity
                  key={cat.key}
                  style={[styles.categoryChip, isSelected && styles.categoryChipSelected]}
                  onPress={() => setSelectedCategory(cat.key)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={cat.icon as any}
                    size={14}
                    color={isSelected ? '#FFFFFF' : '#475569'}
                  />
                  <Text
                    style={[
                      styles.categoryChipText,
                      isSelected && styles.categoryChipTextSelected,
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── MAIN CASES LIST ── */}
        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#0D4722" />
            <Text style={styles.loadingText}>Fetching cases across all jurisdictions...</Text>
          </View>
        ) : filteredCases.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-open-outline" size={48} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No matching cases found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery.trim()
                ? `No cases match "${searchQuery}". Try modifying your search or filters.`
                : 'No cases match the selected status and category filters.'}
            </Text>
            {(searchQuery.trim() || selectedStatus !== 'ALL' || selectedCategory !== 'ALL') && (
              <TouchableOpacity
                style={styles.resetBtn}
                onPress={() => {
                  setSearchQuery('');
                  setSelectedStatus('ALL');
                  setSelectedCategory('ALL');
                }}
              >
                <Text style={styles.resetBtnText}>Clear All Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <FlatList
            data={filteredCases}
            keyExtractor={(item) => item._id || item.caseNumber}
            renderItem={({ item }) => (
              <CaseCard
                caseItem={item}
                onPress={() => handleOpenCaseDetail(item)}
              />
            )}
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
  totalBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  totalBadgeText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0D4722',
  },

  /* ── Metrics Card ── */
  metricsCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  metricLabel: {
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 10,
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
  clearBtn: {
    padding: 4,
  },

  /* ── Status Tabs ── */
  statusTabsWrapper: {
    marginTop: 10,
  },
  statusTabsContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  statusTab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statusTabSelected: {
    backgroundColor: '#0D4722',
    borderColor: '#0D4722',
  },
  statusTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  statusTabTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  /* ── Category Chips ── */
  categoryChipsWrapper: {
    marginTop: 8,
  },
  categoryChipsContent: {
    paddingHorizontal: 16,
    gap: 6,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 5,
  },
  categoryChipSelected: {
    backgroundColor: '#1E293B',
    borderColor: '#1E293B',
  },
  categoryChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  categoryChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  /* ── List Content ── */
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },

  /* ── Loading & Empty ── */
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
  resetBtn: {
    marginTop: 16,
    backgroundColor: '#0D4722',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12,
  },
  resetBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
