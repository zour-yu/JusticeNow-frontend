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
import { Complaint, ComplaintStatus } from '../../../shared/types/complaint.types';
import { ComplaintService } from '../../../shared/services/complaint.service';
import { useAuthStore } from '../../../shared/store/authStore';
import { PendingComplaintCard } from '../components/PendingComplaintCard';

interface Props {
  navigation: any;
}

export const AdminComplaintsListScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuthStore();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [filteredComplaints, setFilteredComplaints] = useState<Complaint[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState<'NEWEST' | 'PRIORITY'>('NEWEST');

  // Check if user is admin
  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      Alert.alert(
        'Access Denied',
        'Only administrators can access this section.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }
  }, [user, navigation]);

  const loadPendingComplaints = useCallback(async () => {
    try {
      const data = await ComplaintService.getPendingComplaints();
      setComplaints(data);
    } catch (err) {
      console.log('Error loading pending complaints:', err);
      Alert.alert('Error', 'Failed to load complaints. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadPendingComplaints();
    const unsubscribe = navigation.addListener('focus', () => {
      loadPendingComplaints();
    });
    return unsubscribe;
  }, [navigation, loadPendingComplaints]);

  useEffect(() => {
    let result = [...complaints];

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
  }, [complaints, searchQuery, sortBy]);

  const onRefresh = () => {
    setIsRefreshing(true);
    loadPendingComplaints();
  };

  const handleCardPress = (complaint: Complaint) => {
    navigation.navigate('AdminComplaintReview', {
      complaintId: complaint._id || complaint.trackingNumber,
      complaint,
    });
  };

  const handleLogout = async () => {
    const { logout } = useAuthStore.getState();
    await logout();
    navigation.replace('Login');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerIconBtn}
          onPress={() => {
            Alert.alert('Menu', 'More options coming soon', [
              { text: 'Cancel', onPress: () => {} },
              { text: 'Logout', onPress: handleLogout, style: 'destructive' },
            ]);
          }}
        >
          <Ionicons name="menu-outline" size={28} color="#0D4722" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Panel</Text>
        <TouchableOpacity style={styles.headerIconBtn}>
          <Ionicons name="shield-checkmark-outline" size={26} color="#0D4722" />
        </TouchableOpacity>
      </View>

      {/* Hero Section */}
      <View style={styles.heroSection}>
        <View style={styles.heroBadge}>
          <Ionicons name="alert-circle-outline" size={20} color="#EF4444" />
          <View style={styles.heroBadgeContent}>
            <Text style={styles.heroBadgeTitle}>
              {complaints.length} Pending Complaint{complaints.length !== 1 ? 's' : ''}
            </Text>
            <Text style={styles.heroBadgeSubtitle}>Awaiting admin review</Text>
          </View>
        </View>
      </View>

      {/* Search and Filter Bar */}
      <View style={styles.controlsArea}>
        {/* Search Input */}
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
      </View>

      {/* Complaints List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading pending complaints...</Text>
        </View>
      ) : filteredComplaints.length === 0 ? (
        <View style={styles.emptyStateContainer}>
          <Ionicons name="checkmark-done-outline" size={56} color="#10B981" />
          <Text style={styles.emptyStateTitle}>All Caught Up!</Text>
          <Text style={styles.emptyStateSubtitle}>
            {searchQuery
              ? 'No complaints match your search.'
              : 'No pending complaints awaiting review.'}
          </Text>
          {searchQuery && (
            <TouchableOpacity
              style={styles.clearSearchButton}
              onPress={() => setSearchQuery('')}
            >
              <Text style={styles.clearSearchButtonText}>Clear Search</Text>
            </TouchableOpacity>
          )}
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

      {/* Footer Stats */}
      {!isLoading && complaints.length > 0 && (
        <View style={styles.footerStats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{complaints.length}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {complaints.filter((c) => c.priority === 'URGENT' || c.priority === 'HIGH').length}
            </Text>
            <Text style={styles.statLabel}>High Priority</Text>
          </View>
        </View>
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
    paddingTop: 20,
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
    backgroundColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  heroSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#EF4444',
  },
  heroBadgeContent: {
    flex: 1,
  },
  heroBadgeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  heroBadgeSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  controlsArea: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 12,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    paddingVertical: 0,
  },
  sortContainer: {
    flexDirection: 'row',
    gap: 8,
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
  clearSearchButton: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#3B82F6',
    borderRadius: 10,
  },
  clearSearchButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 20,
  },
  footerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3B82F6',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 8,
  },
});
