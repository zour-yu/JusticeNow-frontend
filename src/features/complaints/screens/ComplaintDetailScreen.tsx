import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
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
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading complaint details...</Text>
      </View>
    );
  }

  if (!complaint) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorTitle}>Complaint Not Found</Text>
        <Text style={styles.errorSubtitle}>
          The requested complaint could not be retrieved.
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const categoryInfo = CATEGORIES.find((c) => c.key === complaint.category);
  const formattedDate = new Date(complaint.incidentDate).toLocaleDateString(
    'en-US',
    {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
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
    <View style={styles.screenContainer}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.navBackBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.navBackIcon}>←</Text>
          <Text style={styles.navBackText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Complaint Tracking</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Tracking Header Banner */}
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
                { label: 'Case Inv.', stage: 4 },
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
                      <Text
                        style={[
                          styles.stepNumber,
                          isCompleted && styles.stepNumberCompleted,
                        ]}
                      >
                        {isCompleted && currentStage > step.stage ? '✓' : step.stage}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.stepLabel,
                        isCompleted && styles.stepLabelCompleted,
                      ]}
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
                <Text style={styles.anonText}>Anonymous Report</Text>
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
                {complaint.incidentLocation?.city}
              </Text>
            </View>

            <View style={[styles.metaItem, { width: '100%' }]}>
              <Text style={styles.metaLabel}>Specific Address</Text>
              <Text style={styles.metaValue}>
                {complaint.incidentLocation?.address}
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
                      {item.type.toUpperCase()} • Attached with complaint
                    </Text>
                  </View>
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
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#0B132B',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1C2541',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#3A506B',
  },
  navBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
  },
  navBackIcon: {
    fontSize: 20,
    color: '#60A5FA',
    marginRight: 4,
  },
  navBackText: {
    fontSize: 14,
    color: '#60A5FA',
    fontWeight: '700',
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#0B132B',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 12,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  errorSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  trackingBanner: {
    backgroundColor: '#1C2541',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#3A506B',
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
    color: '#60A5FA',
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
    marginTop: 8,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#3A506B',
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
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#0B132B',
    borderWidth: 2,
    borderColor: '#3A506B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stepCircleCompleted: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  stepCircleCurrent: {
    backgroundColor: '#2563EB',
    borderColor: '#60A5FA',
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  stepNumberCompleted: {
    color: '#FFFFFF',
  },
  stepLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
    textAlign: 'center',
  },
  stepLabelCompleted: {
    color: '#E2E8F0',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2563EB',
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
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 14,
    lineHeight: 26,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
  },
  metaItem: {
    width: '47%',
  },
  metaLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  cardSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  cardSectionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 22,
  },
  witnessBox: {
    marginTop: 14,
    backgroundColor: '#F1F5F9',
    padding: 12,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  witnessTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  witnessText: {
    fontSize: 13,
    color: '#475569',
  },
  evidenceList: {
    gap: 8,
    marginTop: 4,
  },
  evidenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  evidenceIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  evidenceDetails: {
    flex: 1,
  },
  evidenceName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  evidenceSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  noEvidenceText: {
    fontSize: 13,
    color: '#94A3B8',
    fontStyle: 'italic',
    marginTop: 4,
  },
});
