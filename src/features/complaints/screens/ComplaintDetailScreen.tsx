import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Complaint, ComplaintStatus } from '../../../shared/types/complaint.types';
import { ComplaintService } from '../../../shared/services/complaint.service';
import { StatusBadge } from '../components/StatusBadge';
import { CATEGORIES } from '../components/CategorySelector';
import { TimelineView } from '../components/TimelineView';

export const ComplaintDetailScreen = ({ route, navigation }: any) => {
  const { complaintId, complaint: initialComplaint } = route.params || {};
  const [complaint, setComplaint] = useState<Complaint | null>(
    initialComplaint || null
  );
  const [isLoading, setIsLoading] = useState(!initialComplaint);

  useEffect(() => {
    const fetchDetail = async () => {
      if (complaintId) {
        try {
          const data = await ComplaintService.getComplaintById(complaintId);
          if (data) {
            setComplaint(data);
          }
        } catch (err) {
          console.log('Error fetching complaint details:', err);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchDetail();
  }, [complaintId]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0D4722" />
          <Text style={styles.loadingText}>Loading case details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!complaint) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" style={{ marginBottom: 12 }} />
          <Text style={styles.errorTitle}>Case Not Found</Text>
          <Text style={styles.errorSubtitle}>
            The requested case details could not be retrieved.
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const categoryInfo = CATEGORIES.find((c) => c.key === complaint.category);
  const formattedDate = new Date(complaint.incidentDate).toLocaleDateString(
    'en-US',
    {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }
  );

  const getStageIndex = (status: ComplaintStatus) => {
    switch (status) {
      case ComplaintStatus.SUBMITTED:
        return 1;
      case ComplaintStatus.UNDER_REVIEW:
        return 2;
      case ComplaintStatus.APPROVED:
        return 3;
      case ComplaintStatus.CONVERTED_TO_CASE:
        return 4;
      default:
        return 1;
    }
  };

  const currentStage = getStageIndex(complaint.status);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />

      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.navBackBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#0D4722" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Case Tracking</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Tracking Header Banner (Rich Forest Green Card) */}
        <View style={styles.trackingBanner}>
          <View style={styles.trackingHeaderTop}>
            <View>
              <Text style={styles.trackingTag}>CASE REFERENCE</Text>
              <Text style={styles.trackingIdText}>{complaint.trackingNumber}</Text>
            </View>
            <StatusBadge status={complaint.status} />
          </View>

          {/* Stepper Progress Bar */}
          <View style={styles.stepperContainer}>
            <View style={styles.stepperRow}>
              {[
                { label: 'Submitted', stage: 1 },
                { label: 'Review', stage: 2 },
                { label: 'Approved', stage: 3 },
                { label: 'Investigation', stage: 4 },
              ].map((step, index) => {
                const isCompleted = currentStage >= step.stage;
                const isCurrent = currentStage === step.stage;

                return (
                  <View key={index} style={styles.stepItem}>
                    <View
                      style={[
                        styles.stepCircle,
                        isCompleted && styles.stepCircleCompleted,
                        isCurrent && styles.stepCircleCurrent,
                      ]}
                    >
                      {isCompleted && currentStage > step.stage ? (
                        <Ionicons name="checkmark" size={14} color="#0D4722" />
                      ) : isCurrent ? (
                        <Ionicons name="search" size={12} color="#0D4722" />
                      ) : (
                        <Text style={styles.stepNumber}>{step.stage}</Text>
                      )}
                    </View>
                    <Text
                      style={[
                        styles.stepLabel,
                        isCompleted && styles.stepLabelCompleted,
                      ]}
                      numberOfLines={1}
                    >
                      {step.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* Section 1: Overview & Category */}
        <View style={styles.card}>
          <View style={styles.categoryRow}>
            <Text style={styles.categoryIcon}>{categoryInfo?.icon || '⚖️'}</Text>
            <Text style={styles.categoryName}>
              {categoryInfo?.label || complaint.category}
            </Text>
            {complaint.isAnonymous && (
              <View style={styles.anonBadge}>
                <Text style={styles.anonText}>Anonymous</Text>
              </View>
            )}
          </View>

          <Text style={styles.complaintTitle}>{complaint.title}</Text>

          {/* Metadata Grid */}
          <View style={styles.metaGrid}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Date of Incident</Text>
              <Text style={styles.metaValue}>{formattedDate}</Text>
            </View>

            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>City / Location</Text>
              <Text style={styles.metaValue}>
                {complaint.incidentLocation?.city || 'Not specified'}
              </Text>
            </View>

            <View style={[styles.metaItem, { width: '100%' }]}>
              <Text style={styles.metaLabel}>Specific Address</Text>
              <Text style={styles.metaValue}>
                {complaint.incidentLocation?.address || 'Not specified'}
              </Text>
            </View>
          </View>
        </View>

        {/* Section 2: Narrative */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Incident Description</Text>
          <Text style={styles.descriptionText}>{complaint.description}</Text>

          {complaint.witnessInfo ? (
            <View style={styles.witnessBox}>
              <Text style={styles.witnessTitle}>Witness Information:</Text>
              <Text style={styles.witnessText}>{complaint.witnessInfo}</Text>
            </View>
          ) : null}
        </View>

        {/* Section 3: Evidence Files */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Supporting Evidence</Text>
          {complaint.evidence && complaint.evidence.length > 0 ? (
            <View style={styles.evidenceList}>
              {complaint.evidence.map((item, idx) => (
                <View key={idx} style={styles.evidenceItem}>
                  <Text style={styles.evidenceIcon}>
                    {item.type === 'photo' ? '🖼️' : item.type === 'video' ? '🎥' : '📄'}
                  </Text>
                  <View style={styles.evidenceDetails}>
                    <Text style={styles.evidenceName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.evidenceSub}>
                      {item.type.toUpperCase()} • Attached with case
                    </Text>
                  </View>
                  <Ionicons name="checkmark-circle" size={18} color="#0D4722" />
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.noEvidenceText}>
              No evidence attachments provided.
            </Text>
          )}
        </View>

        {/* Section 4: Status Timeline & Audit Trail */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Status Timeline & Updates</Text>
          <Text style={styles.cardSectionSubtitle}>
            Official log of actions taken by administrators and investigators.
          </Text>

          <TimelineView timeline={complaint.statusTimeline || []} />
        </View>
      </ScrollView>
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
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  navBackBtn: {
    padding: 4,
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0D4722',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#6B7280',
    fontSize: 14,
    marginTop: 12,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
  },
  errorSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 18,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#0D4722',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 10,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  trackingBanner: {
    backgroundColor: '#0D4722',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#0D4722',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  trackingHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  trackingTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#A7F3D0',
    letterSpacing: 1,
    marginBottom: 4,
  },
  trackingIdText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  stepperContainer: {
    marginTop: 6,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
  },
  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stepCircleCompleted: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  stepCircleCurrent: {
    backgroundColor: '#A7F3D0',
    borderColor: '#A7F3D0',
  },
  stepNumber: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  stepLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.65)',
    fontWeight: '600',
    textAlign: 'center',
  },
  stepLabelCompleted: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0D4722',
  },
  anonBadge: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
  },
  anonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7E22CE',
  },
  complaintTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 14,
    lineHeight: 24,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    backgroundColor: '#FAFAFA',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  metaItem: {
    width: '47%',
  },
  metaLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  cardSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
  },
  cardSectionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
  },
  witnessBox: {
    marginTop: 14,
    backgroundColor: '#F0FBF4',
    padding: 14,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#0D4722',
  },
  witnessTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0D4722',
    marginBottom: 4,
  },
  witnessText: {
    fontSize: 13,
    color: '#374151',
  },
  evidenceList: {
    gap: 8,
    marginTop: 4,
  },
  evidenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  evidenceIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  evidenceDetails: {
    flex: 1,
  },
  evidenceName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  evidenceSub: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  noEvidenceText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginTop: 4,
  },
});

