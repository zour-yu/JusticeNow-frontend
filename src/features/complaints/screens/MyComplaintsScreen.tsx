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
} from 'react-native';
import { Complaint, ComplaintStatus } from '../../../shared/types/complaint.types';
import { ComplaintService } from '../../../shared/services/complaint.service';
import { ComplaintCard } from '../components/ComplaintCard';

const FILTER_TABS = [
  { key: 'ALL', label: 'All Cases' },
  { key: ComplaintStatus.SUBMITTED, label: 'Submitted' },
  { key: ComplaintStatus.UNDER_REVIEW, label: 'Under Review' },
  { key: ComplaintStatus.APPROVED, label: 'Approved' },
  { key: ComplaintStatus.CONVERTED_TO_CASE, label: 'In Investigation' },
  { key: ComplaintStatus.REJECTED, label: 'Rejected' },
];

export const MyComplaintsScreen = ({ navigation }: any) => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [filteredComplaints, setFilteredComplaints] = useState<Complaint[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadComplaints = useCallback(async () => {
    try {
      const data = await ComplaintService.getMyComplaints();
      setComplaints(data);
    } catch (err) {
      console.log('Error loading complaints:', err);
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

  useEffect(() => {
    let result = [...complaints];

    // Filter by status tab
    if (activeFilter !== 'ALL') {
      result = result.filter((item) => item.status === activeFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.trackingNumber.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query) ||
          item.incidentLocation?.city.toLowerCase().includes(query)
      );
    }

    setFilteredComplaints(result);
  }, [complaints, activeFilter, searchQuery]);

  const onRefresh = () => {
    setIsRefreshing(true);
    loadComplaints();
  };

  const handleCardPress = (complaint: Complaint) => {
    navigation.navigate('ComplaintDetail', {
      complaintId: complaint._id || complaint.trackingNumber,
      complaint,
    });
  };

  return (
    <View style={styles.container}>
      {/* Search and Header */}
      <View style={styles.headerArea}>
        <Text style={styles.headerTitle}>My Filed Complaints</Text>
        <Text style={styles.headerSubtitle}>
          Track your submitted cases, review status updates, and view investigation progress.
        </Text>

        {/* Search Input */}
        <View style={styles.searchBarContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by Tracking Ref # or Title..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearSearchText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Pills */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={FILTER_TABS}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.filterList}
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

      {/* Complaints List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading complaints...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredComplaints}
          keyExtractor={(item) => item._id || item.trackingNumber}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor="#60A5FA"
            />
          }
          renderItem={({ item }) => (
            <ComplaintCard complaint={item} onPress={handleCardPress} />
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>📋</Text>
              <Text style={styles.emptyStateTitle}>No Complaints Found</Text>
              <Text style={styles.emptyStateSubtitle}>
                {searchQuery || activeFilter !== 'ALL'
                  ? 'Try changing your search query or status filter.'
                  : 'You have not submitted any complaints yet.'}
              </Text>
              <TouchableOpacity
                style={styles.emptyStateBtn}
                onPress={() => navigation.navigate('SubmitComplaint')}
              >
                <Text style={styles.emptyStateBtnText}>File a New Complaint</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('SubmitComplaint')}
        activeOpacity={0.85}
      >
        <Text style={styles.fabIcon}>＋</Text>
        <Text style={styles.fabText}>New Complaint</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B132B',
  },
  headerArea: {
    backgroundColor: '#1C2541',
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#3A506B',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 12,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0B132B',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#3A506B',
    marginBottom: 12,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    padding: 0,
  },
  clearSearchText: {
    color: '#94A3B8',
    fontSize: 14,
    paddingHorizontal: 4,
  },
  filterList: {
    paddingVertical: 4,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#0B132B',
    borderWidth: 1,
    borderColor: '#3A506B',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#3B82F6',
  },
  filterChipText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingBottom: 90,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 12,
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  emptyStateSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  emptyStateBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  emptyStateBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 30,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  fabIcon: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 6,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
