import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Image,
  Linking,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Complaint, ComplaintStatus } from '../../../shared/types/complaint.types';
import { ComplaintService } from '../../../shared/services/complaint.service';
import { CaseService } from '../../../shared/services/case.service';
import { AssignInvestigatorInput } from '../../../shared/types/case.types';
import { StatusBadge } from '../../complaints/components/StatusBadge';
import { CATEGORIES } from '../../complaints/components/CategorySelector';
import { TimelineView } from '../../complaints/components/TimelineView';
import { ReviewDecisionCard } from '../components/ReviewDecisionCard';
import { InvestigatorSelectorModal } from '../components/InvestigatorSelectorModal';

interface Props {
  route: any;
  navigation: any;
}

export const AdminComplaintReviewScreen: React.FC<Props> = ({ route, navigation }) => {
  const { complaintId, complaint: initialComplaint } = route.params || {};
  const [complaint, setComplaint] = useState<Complaint | null>(initialComplaint || null);
  const [isLoading, setIsLoading] = useState(!initialComplaint);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [assignModalVisible, setAssignModalVisible] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      if (complaintId && !initialComplaint) {
        try {
          const data = await ComplaintService.getComplaintById(complaintId);
          if (data) {
            setComplaint(data);
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

  const handleApprove = async (note: string) => {
    if (!complaint) return;
    try {
      await ComplaintService.reviewComplaint(
        complaint._id || complaint.trackingNumber,
        'APPROVED',
        note
      );
      setReviewSubmitted(true);
      setComplaint((prev) =>
        prev
          ? {
              ...prev,
              status: ComplaintStatus.APPROVED,
            }
          : null
      );

      Alert.alert(
        'Complaint Approved',
        'The complaint has been approved. Would you like to assign an investigator to this case now?',
        [
          {
            text: 'Assign Investigator Now',
            onPress: () => setAssignModalVisible(true),
          },
          {
            text: 'Done / Back to List',
            onPress: () => navigation.navigate('AdminComplaintsList'),
            style: 'cancel',
          },
        ]
      );
    } catch (err) {
      throw err;
    }
  };

  const handleAssignInvestigator = async (input: AssignInvestigatorInput) => {
    if (!complaint) return;
    const identifier = complaint.trackingNumber || complaint._id || '';
    const newCase = await CaseService.assignComplaintToInvestigator(
      identifier,
      input
    );

    setComplaint((prev) =>
      prev
        ? {
            ...prev,
            status: ComplaintStatus.CONVERTED_TO_CASE,
            caseId: newCase.caseNumber,
            assignedInvestigatorId: input.investigatorId,
          }
        : null
    );
  };

  const handleReject = async (note: string) => {
    if (!complaint) return;
    try {
      await ComplaintService.reviewComplaint(
        complaint._id || complaint.trackingNumber,
        'REJECTED',
        note
      );
      setReviewSubmitted(true);
      Alert.alert('Success', 'Complaint rejected successfully!', [
        {
          text: 'Back to List',
          onPress: () => navigation.navigate('AdminComplaintsList'),
        },
      ]);
    } catch (err) {
      throw err;
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
  const formattedIncidentDate = new Date(complaint.incidentDate).toLocaleDateString(
    'en-US',
    {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }
  );
  const formattedSubmittedDate = new Date(complaint.createdAt).toLocaleDateString(
    'en-US',
    {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }
  );

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
        <Text style={styles.headerTitle}>Review Complaint</Text>
        <View style={styles.backButtonSmall} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Overview Card */}
        <View style={styles.overviewCard}>
          <View style={styles.overviewHeader}>
            <View>
              <Text style={styles.overviewLabel}>TRACKING REFERENCE</Text>
              <Text style={styles.overviewValue}>{complaint.trackingNumber}</Text>
            </View>
            <StatusBadge status={complaint.status} />
          </View>
        </View>

        {/* Complaint Title & Category */}
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

        {/* Citizen Information */}
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

            {!complaint.isAnonymous && (
              <>
                <View style={styles.infoDivider} />
                <View style={styles.infoRow}>
                  <View style={styles.infoIcon}>
                    <Ionicons name="mail-outline" size={18} color="#3B82F6" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Email</Text>
                    <TouchableOpacity
                      onPress={() => Linking.openURL(`mailto:${complaint.citizenEmail}`)}
                    >
                      <Text style={styles.infoValueLink}>{complaint.citizenEmail}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}

            {complaint.citizenPhone && !complaint.isAnonymous && (
              <>
                <View style={styles.infoDivider} />
                <View style={styles.infoRow}>
                  <View style={styles.infoIcon}>
                    <Ionicons name="call-outline" size={18} color="#3B82F6" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Phone</Text>
                    <TouchableOpacity
                      onPress={() => Linking.openURL(`tel:${complaint.citizenPhone}`)}
                    >
                      <Text style={styles.infoValueLink}>{complaint.citizenPhone}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}

            {complaint.isAnonymous && (
              <>
                <View style={styles.infoDivider} />
                <View style={styles.anonNotice}>
                  <Ionicons name="eye-off-outline" size={16} color="#7E22CE" />
                  <Text style={styles.anonNoticeText}>
                    This is an anonymous complaint. Citizen contact information is not available.
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Incident Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Incident Details</Text>

          <View style={styles.detailCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Incident Date</Text>
              <Text style={styles.detailValue}>{formattedIncidentDate}</Text>
            </View>

            <View style={styles.detailDivider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Location</Text>
              <View style={styles.locationValue}>
                <Text style={styles.detailValue}>{complaint.incidentLocation?.city}</Text>
                {complaint.incidentLocation?.address && (
                  <Text style={styles.detailValueSmall}>
                    {complaint.incidentLocation.address}
                  </Text>
                )}
                {complaint.incidentLocation?.details && (
                  <Text style={styles.detailValueSmall}>
                    {complaint.incidentLocation.details}
                  </Text>
                )}
              </View>
            </View>

            {complaint.witnessInfo && (
              <>
                <View style={styles.detailDivider} />
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Witness Information</Text>
                  <Text style={styles.detailValue}>{complaint.witnessInfo}</Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Complaint Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <View style={styles.descriptionCard}>
            <Text style={styles.descriptionText}>{complaint.description}</Text>
          </View>
        </View>

        {/* Evidence Section */}
        {complaint.evidence && complaint.evidence.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Evidence ({complaint.evidence.length})</Text>
            {complaint.evidence.map((evidence, index) => (
              <View key={evidence.id} style={styles.evidenceItem}>
                <View style={styles.evidenceIcon}>
                  <Ionicons
                    name={
                      evidence.type === 'image'
                        ? 'image-outline'
                        : evidence.type === 'video'
                        ? 'play-circle-outline'
                        : 'document-outline'
                    }
                    size={20}
                    color="#3B82F6"
                  />
                </View>
                <View style={styles.evidenceInfo}>
                  <Text style={styles.evidenceName}>{evidence.name}</Text>
                  {evidence.size && (
                    <Text style={styles.evidenceSize}>
                      {(evidence.size / 1024).toFixed(1)} KB
                    </Text>
                  )}
                </View>
                <TouchableOpacity
                  onPress={() => {
                    if (evidence.url) {
                      Linking.openURL(evidence.url);
                    }
                  }}
                >
                  <Ionicons name="download-outline" size={20} color="#3B82F6" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Status Timeline</Text>
          <TimelineView timeline={complaint.statusTimeline} />
        </View>

        {/* Review Section */}
        {complaint.status === ComplaintStatus.SUBMITTED && !reviewSubmitted && (
          <View style={styles.section}>
            {!isReviewMode ? (
              <TouchableOpacity
                style={styles.beginReviewButton}
                onPress={() => setIsReviewMode(true)}
              >
                <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
                <Text style={styles.beginReviewButtonText}>
                  Begin Review & Make Decision
                </Text>
              </TouchableOpacity>
            ) : (
              <ReviewDecisionCard
                onApprove={handleApprove}
                onReject={handleReject}
              />
            )}
          </View>
        )}

        {reviewSubmitted && (
          <View style={styles.successMessage}>
            <Ionicons name="checkmark-done-circle" size={32} color="#10B981" />
            <Text style={styles.successTitle}>Review Submitted</Text>
            <Text style={styles.successSubtitle}>
              Your decision has been recorded and the citizen has been notified.
            </Text>
          </View>
        )}

        {/* Approved / Converted to Case Investigator Assignment Card */}
        {(complaint.status === ComplaintStatus.APPROVED ||
          complaint.status === ComplaintStatus.CONVERTED_TO_CASE) && (
          <View style={styles.section}>
            <View style={styles.assignCard}>
              <View style={styles.assignCardHeader}>
                <View style={styles.assignIconWrapper}>
                  <Ionicons
                    name={
                      complaint.status === ComplaintStatus.CONVERTED_TO_CASE
                        ? 'shield-checkmark'
                        : 'person-add'
                    }
                    size={22}
                    color="#0D4722"
                  />
                </View>
                <View style={styles.assignCardTexts}>
                  <Text style={styles.assignCardTitle}>
                    {complaint.status === ComplaintStatus.CONVERTED_TO_CASE
                      ? 'Investigation Active'
                      : 'Ready for Investigator Assignment'}
                  </Text>
                  <Text style={styles.assignCardDesc}>
                    {complaint.status === ComplaintStatus.CONVERTED_TO_CASE
                      ? `Converted to formal case ref #${complaint.caseId || 'ACTIVE'}.`
                      : 'Complaint is approved. Assign an investigator to initiate fieldwork.'}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.assignActionBtn}
                onPress={() => setAssignModalVisible(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="person-add" size={16} color="#FFFFFF" />
                <Text style={styles.assignActionBtnText}>
                  {complaint.status === ComplaintStatus.CONVERTED_TO_CASE
                    ? 'Reassign Investigator'
                    : 'Assign Investigator to Case'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Existing already reviewed info banner if rejected */}
        {complaint.status === ComplaintStatus.REJECTED && (
          <View style={styles.alreadyReviewedMessage}>
            <Ionicons name="information-circle-outline" size={20} color="#EF4444" />
            <Text style={[styles.alreadyReviewedText, { color: '#B91C1C' }]}>
              This complaint was rejected during review.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Investigator Selector Modal */}
      {complaint && (
        <InvestigatorSelectorModal
          visible={assignModalVisible}
          caseIdOrNumber={complaint.trackingNumber}
          caseTitle={complaint.title}
          currentInvestigatorId={complaint.assignedInvestigatorId}
          onClose={() => setAssignModalVisible(false)}
          onAssigned={handleAssignInvestigator}
        />
      )}
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
  categoryEmoji: {
    fontSize: 32,
    marginTop: 4,
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
  infoValueLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
    textDecorationLine: 'underline',
  },
  infoDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  anonNotice: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F3E8FF',
  },
  anonNoticeText: {
    fontSize: 12,
    color: '#6B21A8',
    flex: 1,
    lineHeight: 16,
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
    lineHeight: 16,
  },
  locationValue: {
    gap: 4,
  },
  detailDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
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
  evidenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  evidenceIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  evidenceInfo: {
    flex: 1,
  },
  evidenceName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  evidenceSize: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  beginReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
  },
  beginReviewButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
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
    marginTop: 10,
  },
  successSubtitle: {
    fontSize: 12,
    color: '#4B5563',
    marginTop: 4,
    textAlign: 'center',
  },
  alreadyReviewedMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  alreadyReviewedText: {
    fontSize: 12,
    color: '#1E40AF',
    flex: 1,
    lineHeight: 16,
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
  /* Assignment Card Styles */
  assignCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  assignCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  assignIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  assignCardTexts: {
    flex: 1,
  },
  assignCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0D4722',
    marginBottom: 2,
  },
  assignCardDesc: {
    fontSize: 12,
    color: '#374151',
    lineHeight: 17,
  },
  assignActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0D4722',
    paddingVertical: 12,
    borderRadius: 10,
  },
  assignActionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
