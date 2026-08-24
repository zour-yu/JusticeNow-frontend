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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Case, CaseStatus } from '../../../shared/types/case.types';
import { CaseService } from '../../../shared/services/case.service';
import { useAuthStore } from '../../../shared/store/authStore';
import { CaseCard } from '../components/CaseCard';

const FILTER_TABS = [
  { key: 'ALL', label: 'All Cases' },
  { key: CaseStatus.ASSIGNED, label: 'Assigned' },
  { key: CaseStatus.UNDER_INVESTIGATION, label: 'In Investigation' },
  { key: CaseStatus.EVIDENCE_COLLECTION, label: 'Evidence Collection' },
  { key: CaseStatus.REPORT_SUBMITTED, label: 'Report Submitted' },
  { key: CaseStatus.RESOLVED, label: 'Resolved' },
];

export const AssignedCasesScreen = ({ navigation }: any) => {
  const { user } = useAuthStore();
  const [cases, setCases] = useState<Case[]>([]);
  const [filteredCases, setFilteredCases] = useState<Case[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [metrics, setMetrics] = useState({
    total: 0,
    active: 0,
    underInvestigation: 0,
    evidenceCollection: 0,
    resolved: 0,
  });

  const loadCases = useCallback(async () => {
    try {
      const data = await CaseService.getAssignedCases();
      setCases(data);
      const metricsData = await CaseService.getMetrics();
      setMetrics(metricsData);
    } catch (err) {
      console.log('Error loading assigned cases:', err);
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

    // Filter by status tab
    if (activeFilter !== 'ALL') {
      result = result.filter((item) => item.status === activeFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.caseNumber.toLowerCase().includes(query) ||
          item.title.toLowerCase().includes(query) ||
          (item.complaintDetails?.citizenName && item.complaintDetails.citizenName.toLowerCase().includes(query)) ||
          item.category.toLowerCase().includes(query) ||
          (item.complaintDetails?.incidentLocation?.city &&
            item.complaintDetails.incidentLocation.city.toLowerCase().includes(query))
      );
    }

    setFilteredCases(result);
  }, [cases, activeFilter, searchQuery]);

  const onRefresh = () => {
    setIsRefreshing(true);
    loadCases();
  };

  const handleCardPress = (caseItem: Case) => {
    navigation.navigate('CaseDetail', {
      caseId: caseItem._id || caseItem.caseNumber,
      caseItem,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />
      <View style={styles.container}>
        {/* Header Area */}
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
              <Text style={styles.headerTitle}>Assigned Cases</Text>
              <Text style={styles.headerSubtitle}>
                Review evidence, update status, and manage active investigations
              </Text>
            </View>
          </View>

          {/* Quick Metrics Bar */}
          <View style={styles.metricsRow}>
            <View style={styles.metricCard}>
              <Text style={styles.metricVal}>{metrics.total}</Text>
              <Text style={styles.metricLabel}>Total Assigned</Text>
            </View>
            <View style={[styles.metricCard, { backgroundColor: '#FEF3C7' }]}>
              <Text style={[styles.metricVal, { color: '#B45309' }]}>{metrics.active}</Text>
              <Text style={[styles.metricLabel, { color: '#92400E' }]}>Active Fieldwork</Text>
            </View>
            <View style={[styles.metricCard, { backgroundColor: '#ECFDF5' }]}>
              <Text style={[styles.metricVal, { color: '#047857' }]}>{metrics.resolved}</Text>
              <Text style={[styles.metricLabel, { color: '#065F46' }]}>Resolved</Text>
            </View>
          </View>

          {/* Search Input */}
          <View style={styles.searchBarContainer}>
            <Ionicons name="search-outline" size={18} color="#6B7280" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by Case #, complainant, category, city..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>

          {/* Filter Tabs Horizontal Scroll */}
          <View style={styles.filterScrollWrapper}>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={FILTER_TABS}
              keyExtractor={(item) => item.key}
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
              contentContainerStyle={styles.filterContainer}
            />
          </View>
        </View>

        {/* Content List */}
        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#0D4722" />
            <Text style={styles.loadingText}>Loading assigned cases...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredCases}
            keyExtractor={(item) => item._id || item.caseNumber}
            renderItem={({ item }) => (
              <CaseCard caseItem={item} onPress={() => handleCardPress(item)} />
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
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="folder-open-outline" size={56} color="#9CA3AF" />
                <Text style={styles.emptyTitle}>No Cases Found</Text>
                <Text style={styles.emptySubtitle}>
                  {searchQuery || activeFilter !== 'ALL'
                    ? 'No assigned cases matched your search filters.'
                    : 'You currently have no cases assigned to your investigator profile.'}
                </Text>
                {(searchQuery || activeFilter !== 'ALL') && (
                  <TouchableOpacity
                    style={styles.resetFiltersBtn}
                    onPress={() => {
                      setSearchQuery('');
                      setActiveFilter('ALL');
                    }}
                  >
                    <Text style={styles.resetFiltersBtnText}>Reset Filters</Text>
                  </TouchableOpacity>
                )}
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
    lineHeight: 16,
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
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#111827',
    paddingVertical: 2,
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
    padding: 20,
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
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
    marginTop: 14,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  resetFiltersBtn: {
    marginTop: 18,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  resetFiltersBtnText: {
    color: '#0D4722',
    fontSize: 13,
    fontWeight: '700',
  },
});
