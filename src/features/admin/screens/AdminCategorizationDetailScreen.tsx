import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Complaint, ComplaintCategory } from '../../../shared/types/complaint.types';
import { ComplaintService } from '../../../shared/services/complaint.service';
import { StatusBadge } from '../../complaints/components/StatusBadge';
import { CATEGORIES } from '../../complaints/components/CategorySelector';
import { TimelineView } from '../../complaints/components/TimelineView';
import { CategorySelector } from '../components/CategorizationSelector';

interface Props {
  route: any;
  navigation: any;
}

export const AdminCategorizationDetailScreen: React.FC<Props> = ({
  route,
  navigation,
}) => {
  const { complaintId, complaint: initialComplaint } = route.params || {};
  const [complaint, setComplaint] = useState<Complaint | null>(
    initialComplaint || null
  );
  const [selectedCategory, setSelectedCategory] = useState<
    ComplaintCategory | undefined
  >(initialComplaint?.category);
  const [isLoading, setIsLoading] = useState(!initialComplaint);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      if (complaintId && !initialComplaint) {
        try {
          const data = await ComplaintService.getComplaintById(complaintId);
          if (data) {
            setComplaint(data);
            setSelectedCategory(data.category);
          }
        } catch (err) {
          console.log('Error fetching complaint details:', err);
          Alert.alert('Error', 'Failed to load complaint details');
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchDetail();
  }, [complaintId, initialComplaint]);

  const handleSaveCategory = async () => {
    if (!complaint || !selectedCategory) {
      Alert.alert('Error', 'Please select a category');
      return;
    }

    if (selectedCategory === complaint.category) {
      Alert.alert('Info', 'Category is already set to this value');
      return;
    }

    setIsSaving(true);
    try {
      const updated = await ComplaintService.updateComplaintCategory(
        complaint._id || complaint.trackingNumber,
        selectedCategory
      );
      setComplaint(updated);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        navigation.navigate('AdminCategorizationList');
      }, 1500);
    } catch (err) {
      Alert.alert('Error', 'Failed to save category. Please try again.');
      console.log('Error saving category:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading complaint details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!complaint) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.errorTitle}>Complaint Not Found</Text>
          <Text style={styles.errorSubtitle}>
            The requested complaint could not be retrieved.
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={18} color="#FFFFFF" />
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const categoryInfo = CATEGORIES.find((c) => c.key === complaint.category);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButtonSmall}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#0D4722" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Categorize Complaint</Text>
        <View style={styles.backButtonSmall} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Overview Card */}
        <View style={styles.overviewCard}>
          <View style={styles.overviewHeader}>
            <View>
              <Text style={styles.overviewLabel}>TRACKING REFERENCE</Text>
              <Text style={styles.overviewValue}>{complaint.trackingNumber}</Text>
            </View>
            <StatusBadge status={complaint.status} />
          </View>
        </View>

        {/* Current Category Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Category</Text>
          <View style={styles.currentCategoryCard}>
            <Text style={styles.categoryEmoji}>{categoryInfo?.icon || '⚖️'}</Text>
            <View style={styles.currentCategoryInfo}>
              <Text style={styles.currentCategoryLabel}>
                {categoryInfo?.label || complaint.category.replace(/_/g, ' ')}
              </Text>
              <Text style={styles.currentCategoryDesc}>
                {categoryInfo?.description}
              </Text>
            </View>
          </View>
        </View>

        {/* Complaint Title & Details */}
        <View style={styles.section}>
          <View style={styles.categoryHeader}>
            <Text style={styles.categoryEmoji}>{categoryInfo?.icon || '⚖️'}</Text>
            <View style={styles.categoryInfo}>
              <Text style={styles.categoryLabel}>
                {categoryInfo?.label || complaint.category.replace(/_/g, ' ')}
              </Text>
              <Text style={styles.title}>{complaint.title}</Text>
            </View>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <View style={styles.descriptionCard}>
            <Text style={styles.descriptionText}>{complaint.description}</Text>
          </View>
        </View>

        {/* Citizen Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Citizen Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="person-outline" size={18} color="#3B82F6" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Name</Text>
                <Text style={styles.infoValue}>
                  {complaint.isAnonymous ? '(Anonymous)' : complaint.citizenName}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Incident Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Incident Details</Text>
          <View style={styles.detailCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Incident Date</Text>
              <Text style={styles.detailValue}>
                {new Date(complaint.incidentDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </View>

            <View style={styles.detailDivider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Location</Text>
              <View style={styles.locationValue}>
                <Text style={styles.detailValue}>
                  {complaint.incidentLocation?.city}
                </Text>
                {complaint.incidentLocation?.address && (
                  <Text style={styles.detailValueSmall}>
                    {complaint.incidentLocation.address}
                  </Text>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Status Timeline</Text>
          <TimelineView timeline={complaint.statusTimeline} />
        </View>

        {/* Category Selection */}
        {!showSuccess && (
          <View style={styles.section}>
            <CategorySelector
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              disabled={isSaving}
            />
          </View>
        )}

        {/* Success Message */}
        {showSuccess && (
          <View style={styles.successMessage}>
            <Ionicons name="checkmark-circle" size={40} color="#10B981" />
            <Text style={styles.successTitle}>Category Updated!</Text>
            <Text style={styles.successSubtitle}>
              The complaint has been categorized successfully.
            </Text>
          </View>
        )}

        {/* Save Button */}
        {!showSuccess && (
          <TouchableOpacity
            style={[
              styles.saveButton,
              (isSaving || selectedCategory === complaint.category) &&
                styles.saveButtonDisabled,
            ]}
            onPress={handleSaveCategory}
            disabled={isSaving || selectedCategory === complaint.category}
          >
            {isSaving ? (
              <>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.saveButtonText}>Saving...</Text>
              </>
            ) : (
              <>
                <Ionicons name="checkmark-outline" size={18} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>Save Category</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
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
  backButtonSmall: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 32,
  },
  overviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  overviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  overviewLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  overviewValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  currentCategoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  categoryEmoji: {
    fontSize: 32,
  },
  currentCategoryInfo: {
    flex: 1,
  },
  currentCategoryLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  currentCategoryDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryInfo: {
    flex: 1,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 24,
  },
  descriptionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  descriptionText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  detailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  detailRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  detailValueSmall: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  locationValue: {
    gap: 4,
  },
  detailDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  successMessage: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#15803D',
    marginTop: 12,
  },
  successSubtitle: {
    fontSize: 12,
    color: '#4B5563',
    marginTop: 4,
    textAlign: 'center',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    marginBottom: 16,
  },
  saveButtonDisabled: {
    backgroundColor: '#CBD5E1',
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 16,
  },
  errorSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 8,
    textAlign: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#3B82F6',
    borderRadius: 10,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
