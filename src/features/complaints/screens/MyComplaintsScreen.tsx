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
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Complaint, ComplaintStatus } from '../../../shared/types/complaint.types';
import { ComplaintService } from '../../../shared/services/complaint.service';
import { ComplaintCard } from '../components/ComplaintCard';

const SERIF_FONT = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'serif',
});

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
          item.incidentLocation?.city.toLowerCase().includes(query) ||
          (item.caseId && item.caseId.toLowerCase().includes(query))
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
      <StatusBar barStyle="dark-content" backgroundColor="#F2F5F2" />

      {/* Top Header Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#163820" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>My Cases</Text>
        <TouchableOpacity
          style={styles.headerActionBtn}
          onPress={() => navigation.navigate('SubmitComplaint')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.7}
        >
          <Ionicons name="add-circle-outline" size={28} color="#163820" />
        </TouchableOpacity>
      </View>

      <View style={styles.container}>
        {/* Header Title & Subtitle */}
        <View style={styles.headerArea}>
          <Text style={styles.headerTitle}>Filed Complaints & Cases</Text>
          <Text style={styles.headerSubtitle}>
            Track your submitted cases, review status updates, and view investigation progress.
          </Text>

          {/* Search Input */}
          <View style={styles.searchBarContainer}>
            <Ionicons name="search-outline" size={20} color="#9CA3AF" style={styles.searchIcon} />
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
                  activeOpacity={0.75}
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
            <ActivityIndicator size="large" color="#163820" />
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
                tintColor="#163820"
                colors={['#163820']}
              />
            }
            renderItem={({ item }) => (
              <ComplaintCard complaint={item} onPress={handleCardPress} />
            )}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <View style={styles.emptyIconCircle}>
                  <Ionicons name="document-text-outline" size={36} color="#163820" />
                </View>
                <Text style={styles.emptyStateTitle}>No Cases Found</Text>
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
    backgroundColor: '#F2F5F2',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: '#F2F5F2',
  },
  backBtn: {
    padding: 6,
    marginLeft: -6,
  },
  topBarTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#163820',
    fontFamily: SERIF_FONT,
  },
  headerActionBtn: {
    padding: 4,
    marginRight: -4,
  },
  container: {
    flex: 1,
    backgroundColor: '#F2F5F2',
  },
  headerArea: {
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    fontFamily: SERIF_FONT,
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 13.5,
    color: '#556358',
    marginBottom: 16,
    lineHeight: 19,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#DFE7E1',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#111827',
    fontSize: 14.5,
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
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#1E4A2E',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#1E4A2E',
    borderColor: '#1E4A2E',
  },
  filterChipText: {
    color: '#1E4A2E',
    fontSize: 13,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 6,
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
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
    fontFamily: SERIF_FONT,
  },
  emptyStateSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 22,
    lineHeight: 18,
  },
  emptyStateBtn: {
    backgroundColor: '#1E4A2E',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#1E4A2E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
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
    backgroundColor: '#1E4A2E',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 30,
    shadowColor: '#1E4A2E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  fabIcon: {
    marginRight: 6,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
  },
});
