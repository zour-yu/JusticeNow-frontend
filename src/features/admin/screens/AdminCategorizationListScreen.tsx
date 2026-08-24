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
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Complaint, ComplaintStatus, ComplaintCategory } from '../../../shared/types/complaint.types';
import { ComplaintService } from '../../../shared/services/complaint.service';
import { useAuthStore } from '../../../shared/store/authStore';
import { PendingComplaintCard } from '../components/PendingComplaintCard';
import { CATEGORIES } from '../../complaints/components/CategorySelector';

interface Props {
  navigation: any;
}

type FilterType = 'ALL' | ComplaintCategory;

export const AdminCategorizationListScreen: React.FC<Props> = ({
  navigation,
}) => {
  const { user } = useAuthStore();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [filteredComplaints, setFilteredComplaints] = useState<Complaint[]>([]);
  const [metrics, setMetrics] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('ALL');
  const [sortBy, setSortBy] = useState<'NEWEST' | 'PRIORITY'>('NEWEST');

  // Check admin access
  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      Alert.alert(
        'Access Denied',
        'Only administrators can access this section.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }
  }, [user, navigation]);

  const loadComplaints = useCallback(async () => {
    try {
      // Get complaints with SUBMITTED status
      const data = await ComplaintService.getComplaintsByStatus(
        ComplaintStatus.SUBMITTED
      );
      setComplaints(data);

      // Get metrics
      const metricsData = await ComplaintService.getComplaintMetrics();
      if (metricsData.byCategory) {
        setMetrics(metricsData.byCategory);
      }
    } catch (err) {
      console.log('Error loading complaints:', err);
      Alert.alert('Error', 'Failed to load complaints. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadComplaints();
    const unsubscribe = navigation.addListener('focus', () => {
      loadComplaints();
    });
    return unsubscribe;
  }, [navigation, loadComplaints]);

  // Filter and sort complaints
  useEffect(() => {
    let result = [...complaints];

    // Filter by category
    if (selectedFilter !== 'ALL') {
      result = result.filter((item) => item.category === selectedFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.trackingNumber.toLowerCase().includes(query) ||
          item.citizenName.toLowerCase().includes(query) ||
          item.incidentLocation?.city.toLowerCase().includes(query)
      );
    }

    // Sort
    if (sortBy === 'PRIORITY') {
      const priorityOrder = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      result.sort(
        (a, b) =>
          (priorityOrder[a.priority as keyof typeof priorityOrder] || 4) -
          (priorityOrder[b.priority as keyof typeof priorityOrder] || 4)
      );
    } else {
      result.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    setFilteredComplaints(result);
  }, [complaints, selectedFilter, searchQuery, sortBy]);

  const onRefresh = () => {
    setIsRefreshing(true);
    loadComplaints();
  };

  const handleCardPress = (complaint: Complaint) => {
    navigation.navigate('AdminCategorizationDetail', {
      complaintId: complaint._id || complaint.trackingNumber,
      complaint,
    });
  };

  const getCategoryCount = (category: ComplaintCategory): number => {
    return metrics[category] || 0;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerIconBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#0D4722" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Categorize Complaints</Text>
        <View style={styles.headerIconBtn} />
      </View>

      {/* Stats Banner */}
      <View style={styles.statsBanner}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Total</Text>
          <Text style={styles.statNumber}>{complaints.length}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Pending</Text>
          <Text style={styles.statNumber}>{filteredComplaints.length}</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBarContainer}>
        <Ionicons name="search-outline" size={18} color="#94A3B8" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by title, ref, citizen, or location..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-outline" size={18} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      {/* Category Filter */}
      <View style={styles.filterSection}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[
            { key: 'ALL', label: 'All', icon: undefined, count: complaints.length },
            ...CATEGORIES.map((cat) => ({
              key: cat.key,
              label: cat.label,
              icon: cat.icon,
              count: getCategoryCount(cat.key),
            })),
          ]}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => {
            const isActive = selectedFilter === item.key;
            return (
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  isActive && styles.filterChipActive,
                ]}
                onPress={() => setSelectedFilter(item.key as FilterType)}
              >
                {item.icon && (
                  <Text style={styles.filterChipIcon}>{item.icon}</Text>
                )}
                <Text
                  style={[
                    styles.filterChipText,
                    isActive && styles.filterChipTextActive,
                  ]}
                >
                  {item.label}
                </Text>
                {item.count > 0 && (
                  <View
                    style={[
                      styles.filterChipBadge,
                      isActive && styles.filterChipBadgeActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterChipBadgeText,
                        isActive && styles.filterChipBadgeTextActive,
                      ]}
                    >
                      {item.count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
          scrollEventThrottle={16}
        />
      </View>

      {/* Sort Options */}
      <View style={styles.sortContainer}>
        <TouchableOpacity
          style={[
            styles.sortButton,
            sortBy === 'PRIORITY' && styles.sortButtonActive,
          ]}
          onPress={() => setSortBy('PRIORITY')}
        >
          <Ionicons
            name="flame-outline"
            size={16}
            color={sortBy === 'PRIORITY' ? '#FFFFFF' : '#64748B'}
          />
          <Text
            style={[
              styles.sortButtonText,
              sortBy === 'PRIORITY' && styles.sortButtonTextActive,
            ]}
          >
            Priority
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.sortButton,
            sortBy === 'NEWEST' && styles.sortButtonActive,
          ]}
          onPress={() => setSortBy('NEWEST')}
        >
          <Ionicons
            name="time-outline"
            size={16}
            color={sortBy === 'NEWEST' ? '#FFFFFF' : '#64748B'}
          />
          <Text
            style={[
              styles.sortButtonText,
              sortBy === 'NEWEST' && styles.sortButtonTextActive,
            ]}
          >
            Newest
          </Text>
        </TouchableOpacity>
      </View>

      {/* Complaints List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading complaints...</Text>
        </View>
      ) : filteredComplaints.length === 0 ? (
        <View style={styles.emptyStateContainer}>
          <Ionicons name="layers-outline" size={56} color="#CBD5E1" />
          <Text style={styles.emptyStateTitle}>
            {searchQuery ? 'No Results' : 'No Complaints'}
          </Text>
          <Text style={styles.emptyStateSubtitle}>
            {searchQuery
              ? 'Try a different search term'
              : selectedFilter !== 'ALL'
              ? `No complaints in ${CATEGORIES.find((c) => c.key === selectedFilter)?.label}`
              : 'No complaints awaiting categorization'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredComplaints}
          keyExtractor={(item) => item._id || item.trackingNumber}
          renderItem={({ item }) => (
            <PendingComplaintCard complaint={item} onPress={handleCardPress} />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  statsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: '#94A3B8',
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: 4,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3B82F6',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 8,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    paddingVertical: 0,
  },
  filterSection: {
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  filterList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  filterChipIcon: {
    fontSize: 14,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  filterChipBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 4,
  },
  filterChipBadgeActive: {
    backgroundColor: '#FFFFFF',
  },
  filterChipBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  filterChipBadgeTextActive: {
    color: '#3B82F6',
  },
  sortContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  sortButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sortButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  sortButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  sortButtonTextActive: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 16,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 8,
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 20,
  },
});
