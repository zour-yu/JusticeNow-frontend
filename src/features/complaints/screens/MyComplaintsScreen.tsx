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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
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
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />

      {/* Top Header Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#0D4722" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>My Cases</Text>
        <TouchableOpacity
          style={styles.headerActionBtn}
          onPress={() => navigation.navigate('SubmitComplaint')}
        >
          <Ionicons name="add-circle-outline" size={26} color="#0D4722" />
        </TouchableOpacity>
      </View>

      <View style={styles.container}>
        {/* Search and Filter Section */}
        <View style={styles.headerArea}>
          <Text style={styles.headerTitle}>Filed Complaints & Cases</Text>
          <Text style={styles.headerSubtitle}>
            Track your submitted cases, review status updates, and view investigation progress.
          </Text>

          {/* Search Input */}
          <View style={styles.searchBarContainer}>
            <Ionicons name="search-outline" size={18} color="#0D4722" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by Tracking Ref # or Title..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
                <Ionicons name="close-circle" size={18} color="#9CA3AF" />
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
                  activeOpacity={0.7}
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
            <ActivityIndicator size="large" color="#0D4722" />
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
                tintColor="#0D4722"
                colors={['#0D4722']}
              />
            }
            renderItem={({ item }) => (
              <ComplaintCard complaint={item} onPress={handleCardPress} />
            )}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <View style={styles.emptyIconCircle}>
                  <Ionicons name="document-text-outline" size={36} color="#0D4722" />
                </View>
                <Text style={styles.emptyStateTitle}>No Complaints Found</Text>
                <Text style={styles.emptyStateSubtitle}>
                  {searchQuery || activeFilter !== 'ALL'
                    ? 'Try changing your search query or status filter.'
                    : 'You have not submitted any complaints yet.'}
                </Text>
                <TouchableOpacity
                  style={styles.emptyStateBtn}
                  onPress={() => navigation.navigate('SubmitComplaint')}
                  activeOpacity={0.85}
                >
                  <Ionicons name="add" size={18} color="#FFF" style={{ marginRight: 6 }} />
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
          <Ionicons name="add" size={20} color="#FFFFFF" style={styles.fabIcon} />
          <Text style={styles.fabText}>New Complaint</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: '#FAFAFA',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backBtn: {
    padding: 4,
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0D4722',
  },
  headerActionBtn: {
    padding: 4,
  },
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  headerArea: {
    backgroundColor: '#FFFFFF',
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 14,
    lineHeight: 18,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 14,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#111827',
    fontSize: 14,
    padding: 0,
  },
  clearBtn: {
    padding: 2,
  },
  filterList: {
    paddingVertical: 2,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#0D4722',
    borderColor: '#0D4722',
  },
  filterChipText: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listContent: {
    padding: 20,
    paddingBottom: 95,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#6B7280',
    fontSize: 14,
    marginTop: 12,
  },
  emptyState: {
    paddingVertical: 50,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
  },
  emptyStateSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 22,
    lineHeight: 18,
  },
  emptyStateBtn: {
    backgroundColor: '#0D4722',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#0D4722',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
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
    backgroundColor: '#0D4722',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 30,
    shadowColor: '#0D4722',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  fabIcon: {
    marginRight: 6,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

