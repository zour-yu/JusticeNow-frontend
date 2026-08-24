import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Case,
  CaseStatus,
  CasePriority,
  AddEvidenceInput,
  AssignInvestigatorInput,
} from '../../../shared/types/case.types';
import { CaseService } from '../../../shared/services/case.service';
import { useAuthStore } from '../../../shared/store/authStore';
import { CaseStatusBadge } from '../components/CaseStatusBadge';
import { EvidenceSection } from '../components/EvidenceSection';
import { InvestigationNotesSection } from '../components/InvestigationNotesSection';
import { InvestigatorSelectorModal } from '../../admin/components/InvestigatorSelectorModal';

const STATUS_OPTIONS = [
  { value: CaseStatus.ASSIGNED, label: 'Assigned', desc: 'Case received and queued' },
  { value: CaseStatus.UNDER_INVESTIGATION, label: 'Under Investigation', desc: 'Active fieldwork and interviews underway' },
  { value: CaseStatus.EVIDENCE_COLLECTION, label: 'Evidence Collection', desc: 'Gathering physical/digital evidence and documents' },
  { value: CaseStatus.REPORT_SUBMITTED, label: 'Report Submitted', desc: 'Final investigation dossier prepared' },
  { value: CaseStatus.RESOLVED, label: 'Resolved', desc: 'Remedy achieved or mediation concluded' },
  { value: CaseStatus.CLOSED, label: 'Closed', desc: 'Investigation formally concluded' },
];

export const CaseDetailScreen = ({ route, navigation }: any) => {
  const { caseId, caseItem: initialCase } = route.params || {};
  const { user } = useAuthStore();

  const [caseData, setCaseData] = useState<Case | null>(initialCase || null);
  const [isLoading, setIsLoading] = useState(!initialCase);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [selectedNewStatus, setSelectedNewStatus] = useState<CaseStatus>(
    initialCase?.status || CaseStatus.UNDER_INVESTIGATION
  );
  const [statusNote, setStatusNote] = useState('');
  const [findingsText, setFindingsText] = useState(initialCase?.findings || '');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const userIdentifier = user?.firebaseUid || user?._id || '';
  const isAdmin = user?.role === 'ADMIN';
  
  // Authorization check: User can modify if Admin OR if investigator matches assignedInvestigatorId (or default demo inv-101)
  const isAssignedToMe: boolean = Boolean(
    isAdmin ||
    (caseData?.assignedInvestigatorId && userIdentifier && caseData.assignedInvestigatorId === userIdentifier) ||
    caseData?.assignedInvestigatorId === 'inv-101' ||
    (user?.email && caseData?.assignedInvestigatorEmail && caseData.assignedInvestigatorEmail.toLowerCase() === user.email.toLowerCase())
  );

  const fetchCaseDetail = useCallback(async () => {
    if (!caseId) return;
    try {
      const data = await CaseService.getCaseById(caseId);
      if (data) {
        setCaseData(data);
        setSelectedNewStatus(data.status);
        setFindingsText(data.findings || '');
      }
    } catch (err) {
      console.log('Error fetching case detail:', err);
    } finally {
      setIsLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    fetchCaseDetail();
  }, [fetchCaseDetail]);

  const handleUpdateStatus = async () => {
    if (!caseData) return;
    if (!isAssignedToMe) {
      Alert.alert('Unauthorized', 'You cannot modify a case not assigned to you.');
      return;
    }

    try {
      setIsUpdatingStatus(true);
      const updated = await CaseService.updateCaseStatus(
        caseData._id || caseData.caseNumber,
        {
          status: selectedNewStatus,
          note: statusNote.trim() || undefined,
          findings: findingsText.trim() || undefined,
        },
        userIdentifier,
        user?.role
      );

      setCaseData(updated);
      setStatusModalVisible(false);
      setStatusNote('');
      Alert.alert('Success', 'Case investigation status has been updated.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update case status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAddEvidence = async (input: AddEvidenceInput) => {
    if (!caseData) return;
    if (!isAssignedToMe) {
      throw new Error('You cannot attach evidence to an unassigned case.');
    }

    const updated = await CaseService.addEvidence(
      caseData._id || caseData.caseNumber,
      input,
      userIdentifier,
      user?.role
    );
    setCaseData(updated);
  };

  const handleAddNote = async (noteText: string) => {
    if (!caseData) return;
    if (!isAssignedToMe) {
      throw new Error('You cannot add notes to an unassigned case.');
    }

    const updated = await CaseService.addInvestigationNote(
      caseData._id || caseData.caseNumber,
      { note: noteText },
      userIdentifier,
      user?.role
    );
    setCaseData(updated);
  };

  const handleAssignInvestigator = async (input: AssignInvestigatorInput) => {
    if (!caseData) return;
    const updated = await CaseService.assignInvestigator(
      caseData._id || caseData.caseNumber,
      input
    );
    setCaseData(updated);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0D4722" />
          <Text style={styles.loadingText}>Loading case details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!caseData) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.errorTitle}>Case Not Found</Text>
          <Text style={styles.errorSubtitle}>
            The requested investigation case could not be retrieved.
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

  const formattedIncidentDate = caseData.complaintDetails?.incidentDate
    ? new Date(caseData.complaintDetails.incidentDate).toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'N/A';

  const formattedAssignedDate = caseData.assignedAt
    ? new Date(caseData.assignedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'N/A';

  const formattedCategory = (caseData.category || '')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />
      <View style={styles.container}>
        {/* Top Navigation Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.navBtn}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color="#0D4722" />
          </TouchableOpacity>
          <View style={styles.topBarTitleCol}>
            <Text style={styles.topBarCaseNumber}>{caseData.caseNumber}</Text>
            <Text style={styles.topBarSub}>Ref: {caseData.complaintDetails?.trackingNumber}</Text>
          </View>
          <CaseStatusBadge status={caseData.status} size="small" />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Authorization Notice Banner if NOT assigned */}
          {!isAssignedToMe && (
            <View style={styles.readOnlyBanner}>
              <Ionicons name="shield-outline" size={20} color="#92400E" />
              <View style={styles.readOnlyBannerTexts}>
                <Text style={styles.readOnlyBannerTitle}>Read-Only Access</Text>
                <Text style={styles.readOnlyBannerDesc}>
                  This case is assigned to {caseData.assignedInvestigatorName}. You can review case details, but modification actions are restricted to the assigned investigator.
                </Text>
              </View>
            </View>
          )}

          {/* Hero Overview Card */}
          <View style={styles.overviewCard}>
            <View style={styles.badgeRow}>
              <View style={styles.categoryBadge}>
                <Ionicons name="folder-outline" size={13} color="#0D4722" />
                <Text style={styles.categoryBadgeText}>{formattedCategory}</Text>
              </View>
              <View style={[styles.priorityBadge, caseData.priority === CasePriority.URGENT && styles.priorityUrgent]}>
                <Text style={styles.priorityBadgeText}>PRIORITY: {caseData.priority}</Text>
              </View>
            </View>

            <Text style={styles.caseTitle}>{caseData.title}</Text>

            {/* Assignment Meta */}
            <View style={styles.assignMetaRow}>
              <Ionicons name="person-circle" size={24} color="#0D4722" />
              <View style={styles.assignMetaTexts}>
                <Text style={styles.assignInvestigatorName}>
                  {caseData.assignedInvestigatorName}
                </Text>
                <Text style={styles.assignDate}>
                  Assigned on {formattedAssignedDate} by {caseData.assignedBy || 'Admin'}
                </Text>
              </View>
              {isAdmin && (
                <TouchableOpacity
                  style={styles.reassignBtn}
                  onPress={() => setAssignModalVisible(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="swap-horizontal" size={14} color="#0D4722" />
                  <Text style={styles.reassignBtnText}>Reassign</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Investigation Status & Phase Controller */}
          <View style={styles.statusSectionCard}>
            <View style={styles.statusHeaderRow}>
              <View>
                <Text style={styles.sectionHeading}>Investigation Phase</Text>
                <Text style={styles.sectionSubheading}>Current active status of this case</Text>
              </View>
              {isAssignedToMe && (
                <TouchableOpacity
                  style={styles.changeStatusBtn}
                  onPress={() => setStatusModalVisible(true)}
                >
                  <Ionicons name="sync" size={14} color="#0D4722" />
                  <Text style={styles.changeStatusBtnText}>Update Phase</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.currentStatusDisplay}>
              <CaseStatusBadge status={caseData.status} size="large" />
            </View>

            {caseData.findings ? (
              <View style={styles.findingsBox}>
                <Text style={styles.findingsHeading}>Investigator Findings Summary:</Text>
                <Text style={styles.findingsText}>{caseData.findings}</Text>
              </View>
            ) : null}
          </View>

          {/* Complaint Details Section */}
          <View style={styles.complaintCard}>
            <View style={styles.cardHeaderRow}>
              <Ionicons name="document-text" size={20} color="#0D4722" />
              <Text style={styles.cardSectionTitle}>Complaint Information</Text>
            </View>

            {/* Complainant Identity */}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Complainant:</Text>
              {caseData.complaintDetails?.isAnonymous ? (
                <View style={styles.anonBadge}>
                  <Ionicons name="eye-off-outline" size={12} color="#4B5563" />
                  <Text style={styles.anonText}>Anonymous (Identity Protected)</Text>
                </View>
              ) : (
                <Text style={styles.infoValue}>{caseData.complaintDetails?.citizenName || 'Citizen'}</Text>
              )}
            </View>

            {!caseData.complaintDetails?.isAnonymous && caseData.complaintDetails?.citizenEmail ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email:</Text>
                <Text style={styles.infoValue}>{caseData.complaintDetails.citizenEmail}</Text>
              </View>
            ) : null}

            {!caseData.complaintDetails?.isAnonymous && caseData.complaintDetails?.citizenPhone ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Phone:</Text>
                <Text style={styles.infoValue}>{caseData.complaintDetails.citizenPhone}</Text>
              </View>
            ) : null}

            {/* Incident Date & Location */}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Incident Date:</Text>
              <Text style={styles.infoValue}>{formattedIncidentDate}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Location:</Text>
              <Text style={styles.infoValue}>
                {caseData.complaintDetails?.incidentLocation?.address
                  ? `${caseData.complaintDetails.incidentLocation.address}, ${caseData.complaintDetails.incidentLocation.city}`
                  : caseData.complaintDetails?.incidentLocation?.city || 'Not specified'}
              </Text>
            </View>

            {caseData.complaintDetails?.incidentLocation?.details ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Location Notes:</Text>
                <Text style={styles.infoValue}>{caseData.complaintDetails.incidentLocation.details}</Text>
              </View>
            ) : null}

            {/* Narrative */}
            <View style={styles.narrativeBox}>
              <Text style={styles.narrativeLabel}>Complaint Narrative:</Text>
              <Text style={styles.narrativeBody}>
                {caseData.complaintDetails?.description || caseData.description}
              </Text>
            </View>

            {caseData.complaintDetails?.witnessInfo ? (
              <View style={styles.witnessBox}>
                <Text style={styles.witnessLabel}>Witness Details:</Text>
                <Text style={styles.witnessBody}>{caseData.complaintDetails.witnessInfo}</Text>
              </View>
            ) : null}
          </View>

          {/* Evidence Section */}
          <EvidenceSection
            evidence={caseData.evidence || []}
            isAuthorized={isAssignedToMe}
            onAddEvidence={handleAddEvidence}
          />

          {/* Investigation Notes Section */}
          <InvestigationNotesSection
            notes={caseData.investigationNotes || []}
            isAuthorized={isAssignedToMe}
            onAddNote={handleAddNote}
          />

          {/* Status History & Action Timeline */}
          <View style={styles.timelineCard}>
            <View style={styles.cardHeaderRow}>
              <Ionicons name="time-outline" size={20} color="#0D4722" />
              <Text style={styles.cardSectionTitle}>Investigation Audit Timeline</Text>
            </View>

            {caseData.statusTimeline && caseData.statusTimeline.length > 0 ? (
              <View style={styles.timelineList}>
                {caseData.statusTimeline.map((item, idx) => (
                  <View key={idx} style={styles.timelineItem}>
                    <View style={styles.timelineLeftCol}>
                      <View style={styles.timelineDot} />
                      {idx < caseData.statusTimeline.length - 1 && (
                        <View style={styles.timelineConnector} />
                      )}
                    </View>
                    <View style={styles.timelineContent}>
                      <View style={styles.timelineHeaderRow}>
                        <Text style={styles.timelineTitle}>{item.title}</Text>
                        <Text style={styles.timelineTimestamp}>
                          {new Date(item.timestamp).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </Text>
                      </View>
                      <Text style={styles.timelineNote}>{item.note}</Text>
                      <Text style={styles.timelineUpdatedBy}>By: {item.updatedBy}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyTimelineText}>No timeline events logged.</Text>
            )}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>

        {/* Update Status Modal */}
        <Modal
          visible={statusModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setStatusModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Update Investigation Phase</Text>
                <TouchableOpacity onPress={() => setStatusModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#374151" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScroll}>
                <Text style={styles.modalInputLabel}>Select New Phase</Text>
                <View style={styles.statusOptionsList}>
                  {STATUS_OPTIONS.map((opt) => {
                    const isSelected = selectedNewStatus === opt.value;
                    return (
                      <TouchableOpacity
                        key={opt.value}
                        style={[
                          styles.statusOptionCard,
                          isSelected && styles.statusOptionCardSelected,
                        ]}
                        onPress={() => setSelectedNewStatus(opt.value)}
                      >
                        <View style={styles.statusOptionRadio}>
                          {isSelected && <View style={styles.statusOptionRadioInner} />}
                        </View>
                        <View style={styles.statusOptionTexts}>
                          <Text
                            style={[
                              styles.statusOptionTitle,
                              isSelected && styles.statusOptionTitleSelected,
                            ]}
                          >
                            {opt.label}
                          </Text>
                          <Text style={styles.statusOptionDesc}>{opt.desc}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={styles.modalInputLabel}>Status Update Note</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Explain why status is changing..."
                  placeholderTextColor="#9CA3AF"
                  value={statusNote}
                  onChangeText={setStatusNote}
                />

                <Text style={styles.modalInputLabel}>Findings & Progress Summary</Text>
                <TextInput
                  style={[styles.modalInput, styles.modalTextArea]}
                  placeholder="Document current findings, witness credibility, legal recommendations..."
                  placeholderTextColor="#9CA3AF"
                  value={findingsText}
                  onChangeText={setFindingsText}
                  multiline
                  numberOfLines={4}
                />

                <TouchableOpacity
                  style={[styles.modalSubmitBtn, isUpdatingStatus && styles.modalSubmitBtnDisabled]}
                  onPress={handleUpdateStatus}
                  disabled={isUpdatingStatus}
                >
                  <Text style={styles.modalSubmitBtnText}>
                    {isUpdatingStatus ? 'Updating Phase...' : 'Confirm Status Update'}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Admin Investigator Assignment Modal */}
        {isAdmin && caseData && (
          <InvestigatorSelectorModal
            visible={assignModalVisible}
            caseIdOrNumber={caseData.caseNumber}
            caseTitle={caseData.title}
            currentInvestigatorId={caseData.assignedInvestigatorId}
            onClose={() => setAssignModalVisible(false)}
            onAssigned={handleAssignInvestigator}
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FAFAFA',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  navBtn: {
    padding: 4,
    marginRight: 10,
  },
  topBarTitleCol: {
    flex: 1,
  },
  topBarCaseNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0D4722',
  },
  topBarSub: {
    fontSize: 11,
    color: '#6B7280',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
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
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginTop: 12,
  },
  errorSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0D4722',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  /* Read-Only Warning Banner */
  readOnlyBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    gap: 10,
  },
  readOnlyBannerTexts: {
    flex: 1,
  },
  readOnlyBannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#92400E',
    marginBottom: 2,
  },
  readOnlyBannerDesc: {
    fontSize: 11,
    color: '#B45309',
    lineHeight: 16,
  },
  /* Overview Card */
  overviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0D4722',
  },
  priorityBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priorityUrgent: {
    backgroundColor: '#FEE2E2',
  },
  priorityBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
  },
  caseTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    lineHeight: 24,
    marginBottom: 12,
  },
  assignMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 10,
    borderRadius: 10,
    gap: 8,
  },
  assignMetaTexts: {
    flex: 1,
  },
  assignInvestigatorName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  assignDate: {
    fontSize: 11,
    color: '#6B7280',
  },
  reassignBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  reassignBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0D4722',
  },
  /* Status Card */
  statusSectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statusHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  sectionSubheading: {
    fontSize: 11,
    color: '#6B7280',
  },
  changeStatusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  changeStatusBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0D4722',
  },
  currentStatusDisplay: {
    marginBottom: 10,
  },
  findingsBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#0D4722',
    marginTop: 6,
  },
  findingsHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0D4722',
    marginBottom: 4,
  },
  findingsText: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
  },
  /* Complaint Details Card */
  complaintCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  cardSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  infoLabel: {
    width: 110,
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  infoValue: {
    flex: 1,
    fontSize: 13,
    color: '#111827',
    fontWeight: '500',
  },
  anonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  anonText: {
    fontSize: 11,
    color: '#4B5563',
    fontWeight: '600',
  },
  narrativeBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
    marginTop: 6,
    marginBottom: 8,
  },
  narrativeLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
    marginBottom: 4,
  },
  narrativeBody: {
    fontSize: 13,
    color: '#1F2937',
    lineHeight: 19,
  },
  witnessBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
  },
  witnessLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
    marginBottom: 4,
  },
  witnessBody: {
    fontSize: 13,
    color: '#1F2937',
    lineHeight: 19,
  },
  /* Timeline Card */
  timelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  timelineList: {
    marginTop: 6,
  },
  timelineItem: {
    flexDirection: 'row',
  },
  timelineLeftCol: {
    width: 24,
    alignItems: 'center',
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0D4722',
    marginTop: 4,
  },
  timelineConnector: {
    width: 2,
    flex: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 2,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 14,
    paddingLeft: 6,
  },
  timelineHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  timelineTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  timelineTimestamp: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  timelineNote: {
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 16,
    marginTop: 2,
  },
  timelineUpdatedBy: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 3,
    fontStyle: 'italic',
  },
  emptyTimelineText: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingVertical: 10,
  },
  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxHeight: '90%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },
  modalScroll: {
    paddingBottom: 10,
  },
  modalInputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
    marginTop: 8,
  },
  statusOptionsList: {
    gap: 8,
    marginBottom: 12,
  },
  statusOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    gap: 10,
  },
  statusOptionCardSelected: {
    borderColor: '#0D4722',
    backgroundColor: '#E8F5E9',
  },
  statusOptionRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#0D4722',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusOptionRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0D4722',
  },
  statusOptionTexts: {
    flex: 1,
  },
  statusOptionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  statusOptionTitleSelected: {
    color: '#0D4722',
  },
  statusOptionDesc: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1,
  },
  modalInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    color: '#111827',
    marginBottom: 10,
  },
  modalTextArea: {
    height: 90,
    textAlignVertical: 'top',
  },
  modalSubmitBtn: {
    backgroundColor: '#0D4722',
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 14,
  },
  modalSubmitBtnDisabled: {
    opacity: 0.6,
  },
  modalSubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
