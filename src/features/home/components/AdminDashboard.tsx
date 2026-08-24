import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Case, CaseStatus, Investigator } from '../../../shared/types/case.types';
import { Complaint, ComplaintStatus } from '../../../shared/types/complaint.types';
import { CaseService } from '../../../shared/services/case.service';
import { ComplaintService } from '../../../shared/services/complaint.service';
import { UserService, InvestigatorApplicant } from '../../../shared/services/user.service';

const { width } = Dimensions.get('window');

interface Props {
  user: any;
  navigation: any;
}

export const AdminDashboard: React.FC<Props> = ({ user, navigation }) => {
  const [cases, setCases] = useState<Case[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [investigators, setInvestigators] = useState<Investigator[]>([]);
  const [pendingApplicants, setPendingApplicants] = useState<InvestigatorApplicant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [casesData, complaintsData, investigatorsData, pendingData] = await Promise.all([
        CaseService.getAllCases(),
        ComplaintService.getAllComplaints(),
        CaseService.getAvailableInvestigators(),
        UserService.getPendingInvestigators(),
      ]);
      setCases(casesData);
      setComplaints(complaintsData);
      setInvestigators(investigatorsData);
      setPendingApplicants(pendingData);
    } catch (err) {
      console.log('Error loading admin dashboard data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });
    return unsubscribe;
  }, [navigation, loadData]);

  const onRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  const adminName = user?.firstName
    ? `${user.firstName} ${user.lastName || ''}`.trim()
    : 'System Administrator';

  const pendingComplaints = complaints.filter(
    (c) => c.status === ComplaintStatus.SUBMITTED || c.status === ComplaintStatus.UNDER_REVIEW
  );

  const unassignedCases = cases.filter(
    (c) => !c.assignedInvestigatorId || c.assignedInvestigatorId === 'unassigned'
  );

  const activeFieldCases = cases.filter(
    (c) => c.status === CaseStatus.UNDER_INVESTIGATION || c.status === CaseStatus.EVIDENCE_COLLECTION
  );

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={['#0D4722']}
            tintColor="#0D4722"
          />
        }
      >
        {/* ── SLEEK ADMIN COMMAND HEADER ── */}
        <View style={styles.adminHeaderCard}>
          <View style={styles.headerTopRow}>
            <View style={styles.adminRolePill}>
              <Ionicons name="shield-checkmark" size={14} color="#A7F3D0" />
              <Text style={styles.adminRolePillText}>ADMIN COMMAND CONSOLE</Text>
            </View>
            <Text style={styles.headerDate}>{currentDate}</Text>
          </View>

          <View style={styles.adminProfileRow}>
            <View style={styles.adminAvatar}>
              <Text style={styles.adminAvatarText}>
                {user?.firstName?.[0] || 'A'}
                {user?.lastName?.[0] || 'D'}
              </Text>
            </View>
            <View style={styles.adminProfileTexts}>
              <Text style={styles.adminGreeting}>Welcome Back,</Text>
              <Text style={styles.adminNameText} numberOfLines={1}>
                {adminName}
              </Text>
              <Text style={styles.adminSubText}>Chief Oversight & Case Governance</Text>
            </View>
            <TouchableOpacity
              style={styles.profileBtn}
              onPress={() => navigation.navigate('Profile')}
              activeOpacity={0.8}
            >
              <Ionicons name="settings-outline" size={20} color="#D1FAE5" />
            </TouchableOpacity>
          </View>

          {/* Quick Metrics Ticker */}
          <View style={styles.headerTicker}>
            <View style={styles.tickerCol}>
              <Text style={styles.tickerNumber}>{complaints.length}</Text>
              <Text style={styles.tickerLabel}>Complaints</Text>
            </View>
            <View style={styles.tickerDivider} />
            <View style={styles.tickerCol}>
              <Text style={[styles.tickerNumber, pendingComplaints.length > 0 && { color: '#FCD34D' }]}>
                {pendingComplaints.length}
              </Text>
              <Text style={styles.tickerLabel}>Pending Review</Text>
            </View>
            <View style={styles.tickerDivider} />
            <View style={styles.tickerCol}>
              <Text style={[styles.tickerNumber, unassignedCases.length > 0 && { color: '#F87171' }]}>
                {unassignedCases.length}
              </Text>
              <Text style={styles.tickerLabel}>Unassigned</Text>
            </View>
            <View style={styles.tickerDivider} />
            <View style={styles.tickerCol}>
              <Text style={styles.tickerNumber}>{cases.length}</Text>
              <Text style={styles.tickerLabel}>Total Cases</Text>
            </View>
          </View>
        </View>

        {/* ── SYSTEM OPERATIONS TILES (PRIMARY ACTIONS) ── */}
        <View style={styles.sectionWrapper}>
          <Text style={styles.sectionHeading}>Administrative Operations</Text>

          {/* 1. Review Complaints */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('AdminComplaintsList')}
            activeOpacity={0.85}
          >
            <View style={[styles.actionIconWrapper, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="checkmark-done-circle" size={26} color="#D97706" />
            </View>
            <View style={styles.actionCardTexts}>
              <View style={styles.actionTitleRow}>
                <Text style={styles.actionCardTitle}>Review Complaints</Text>
                {pendingComplaints.length > 0 && (
                  <View style={styles.actionBadgeWarning}>
                    <Text style={styles.actionBadgeWarningText}>
                      {pendingComplaints.length} PENDING
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.actionCardDesc}>
                Evaluate submitted citizen complaints, verify validity, approve or reject
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </TouchableOpacity>

          {/* 2. Approve Investigators */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('AdminInvestigatorApproval')}
            activeOpacity={0.85}
          >
            <View style={[styles.actionIconWrapper, { backgroundColor: '#FDF2F8' }]}>
              <Ionicons name="person-add" size={26} color="#BE185D" />
            </View>
            <View style={styles.actionCardTexts}>
              <View style={styles.actionTitleRow}>
                <Text style={styles.actionCardTitle}>Approve Investigators</Text>
                {pendingApplicants.length > 0 ? (
                  <View style={[styles.actionBadgeWarning, { backgroundColor: '#FCE7F3', borderColor: '#FBCFE8' }]}>
                    <Text style={[styles.actionBadgeWarningText, { color: '#9D174D' }]}>
                      {pendingApplicants.length} PENDING APPROVAL
                    </Text>
                  </View>
                ) : (
                  <View style={[styles.actionBadgeWarning, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
                    <Text style={[styles.actionBadgeWarningText, { color: '#047857' }]}>
                      ALL VERIFIED
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.actionCardDesc}>
                Review new investigator registrations, verify authority, and grant ACTIVE duty access
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </TouchableOpacity>

          {/* 3. Assign Investigators */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('AdminAssignInvestigator')}
            activeOpacity={0.85}
          >
            <View style={[styles.actionIconWrapper, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="people" size={26} color="#0D4722" />
            </View>
            <View style={styles.actionCardTexts}>
              <View style={styles.actionTitleRow}>
                <Text style={styles.actionCardTitle}>Assign Investigators</Text>
                {unassignedCases.length > 0 ? (
                  <View style={[styles.actionBadgeWarning, { backgroundColor: '#FEE2E2', borderColor: '#FECACA' }]}>
                    <Text style={[styles.actionBadgeWarningText, { color: '#B91C1C' }]}>
                      {unassignedCases.length} UNASSIGNED
                    </Text>
                  </View>
                ) : (
                  <View style={[styles.actionBadgeWarning, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
                    <Text style={[styles.actionBadgeWarningText, { color: '#047857' }]}>
                      ROSTER ACTIVE
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.actionCardDesc}>
                Allocate approved cases to investigators, balance workloads, and track progress
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </TouchableOpacity>

          {/* 4. Categorize Complaints */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('AdminCategorizationList')}
            activeOpacity={0.85}
          >
            <View style={[styles.actionIconWrapper, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="layers" size={26} color="#2563EB" />
            </View>
            <View style={styles.actionCardTexts}>
              <View style={styles.actionTitleRow}>
                <Text style={styles.actionCardTitle}>Categorize & Prioritize</Text>
              </View>
              <Text style={styles.actionCardDesc}>
                Update legal categories, tag sensitivity levels, and set investigation priorities
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* ── INVESTIGATOR TEAM ROSTER & WORKLOAD ── */}
        <View style={styles.sectionWrapper}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>Investigator Workload Roster</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('AdminAssignInvestigator')}
              style={styles.headerActionLink}
            >
              <Text style={styles.headerActionLinkText}>Manage ({investigators.length})</Text>
              <Ionicons name="arrow-forward" size={13} color="#0D4722" />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color="#0D4722" />
              <Text style={styles.loadingText}>Fetching investigator workloads...</Text>
            </View>
          ) : investigators.length === 0 ? (
            <View style={styles.emptyRoster}>
              <Ionicons name="people-outline" size={32} color="#94A3B8" />
              <Text style={styles.emptyRosterTitle}>No Registered Investigators</Text>
              <Text style={styles.emptyRosterSubtitle}>
                Approve investigator account registrations to start assigning cases.
              </Text>
            </View>
          ) : (
            <View style={styles.rosterCard}>
              {investigators.map((inv, index) => {
                const activeCount = inv.activeCasesCount || 0;
                const isAvailable = activeCount === 0;

                return (
                  <View
                    key={inv._id || inv.email}
                    style={[
                      styles.rosterRow,
                      index === investigators.length - 1 && { borderBottomWidth: 0 },
                    ]}
                  >
                    <View style={styles.rosterAvatar}>
                      <Text style={styles.rosterAvatarText}>
                        {inv.firstName?.[0] || 'I'}
                        {inv.lastName?.[0] || 'N'}
                      </Text>
                    </View>
                    <View style={styles.rosterInfo}>
                      <Text style={styles.rosterName}>{inv.name}</Text>
                      <Text style={styles.rosterEmail}>{inv.email}</Text>
                      {inv.specialization ? (
                        <Text style={styles.rosterSpecialization} numberOfLines={1}>
                          ⭐ {inv.specialization}
                        </Text>
                      ) : null}
                    </View>
                    <View
                      style={[
                        styles.rosterLoadBadge,
                        isAvailable
                          ? { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }
                          : activeCount > 2
                          ? { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }
                          : { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.rosterLoadText,
                          isAvailable
                            ? { color: '#047857' }
                            : activeCount > 2
                            ? { color: '#B45309' }
                            : { color: '#1D4ED8' },
                        ]}
                      >
                        {isAvailable ? 'Available' : `${activeCount} Cases`}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* ── RECENT COMPLAINT QUEUE ── */}
        {pendingComplaints.length > 0 && (
          <View style={styles.sectionWrapper}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeading}>Awaiting Initial Review</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('AdminComplaintsList')}
                style={styles.headerActionLink}
              >
                <Text style={styles.headerActionLinkText}>Review Queue</Text>
              </TouchableOpacity>
            </View>

            {pendingComplaints.slice(0, 3).map((item) => (
              <TouchableOpacity
                key={item._id || item.trackingNumber}
                style={styles.complaintQueueCard}
                onPress={() =>
                  navigation.navigate('AdminComplaintReview', {
                    complaintId: item._id || item.trackingNumber,
                    complaint: item,
                  })
                }
                activeOpacity={0.85}
              >
                <View style={styles.queueHeader}>
                  <Text style={styles.queueTrackingNumber}>{item.trackingNumber}</Text>
                  <View style={styles.queueStatusBadge}>
                    <Text style={styles.queueStatusText}>{item.status}</Text>
                  </View>
                </View>
                <Text style={styles.queueTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                <View style={styles.queueFooter}>
                  <Text style={styles.queueCitizen}>
                    By {item.isAnonymous ? 'Anonymous Citizen' : item.citizenName}
                  </Text>
                  <View style={styles.queueAction}>
                    <Text style={styles.queueActionText}>Review Now</Text>
                    <Ionicons name="arrow-forward" size={13} color="#0D4722" />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  /* ── Sleek Admin Header ── */
  adminHeaderCard: {
    backgroundColor: '#022C22',
    paddingTop: 18,
    paddingHorizontal: 20,
    paddingBottom: 22,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    shadowColor: '#022C22',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 10,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  adminRolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 78, 59, 0.8)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: '#059669',
  },
  adminRolePillText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#A7F3D0',
    letterSpacing: 0.6,
  },
  headerDate: {
    fontSize: 12,
    color: '#D1FAE5',
    fontWeight: '600',
  },
  adminProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 14,
  },
  adminAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#0D9488',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#6EE7B7',
  },
  adminAvatarText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  adminProfileTexts: {
    flex: 1,
  },
  adminGreeting: {
    fontSize: 12,
    fontWeight: '700',
    color: '#A7F3D0',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  adminNameText: {
    fontSize: 21,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 1,
  },
  adminSubText: {
    fontSize: 11,
    color: '#D1FAE5',
    marginTop: 2,
  },
  profileBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(6, 78, 59, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#059669',
  },

  /* ── Header Ticker ── */
  headerTicker: {
    flexDirection: 'row',
    backgroundColor: 'rgba(6, 78, 59, 0.6)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.35)',
    alignItems: 'center',
  },
  tickerCol: {
    flex: 1,
    alignItems: 'center',
  },
  tickerNumber: {
    fontSize: 17,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  tickerLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#A7F3D0',
    marginTop: 2,
    textAlign: 'center',
  },
  tickerDivider: {
    width: 1,
    height: 22,
    backgroundColor: 'rgba(167, 243, 208, 0.2)',
  },

  /* ── Section Wrapper ── */
  sectionWrapper: {
    marginTop: 22,
    paddingHorizontal: 16,
  },
  sectionHeading: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerActionLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerActionLinkText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0D4722',
  },

  /* ── Operation Action Cards ── */
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 3,
    gap: 14,
  },
  actionIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionCardTexts: {
    flex: 1,
  },
  actionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    flexWrap: 'wrap',
    gap: 6,
  },
  actionCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  actionBadgeWarning: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  actionBadgeWarningText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#B45309',
  },
  actionCardDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },

  /* ── Investigator Roster Card ── */
  rosterCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  rosterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 10,
  },
  rosterAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0D4722',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rosterAvatarText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  rosterInfo: {
    flex: 1,
  },
  rosterName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  rosterEmail: {
    fontSize: 11,
    color: '#64748B',
  },
  rosterSpecialization: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0D4722',
    marginTop: 2,
  },
  rosterLoadBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  rosterLoadText: {
    fontSize: 10,
    fontWeight: '800',
  },
  loadingBox: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 8,
  },
  emptyRoster: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyRosterTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 8,
  },
  emptyRosterSubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },

  /* ── Complaint Queue Card ── */
  complaintQueueCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  queueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  queueTrackingNumber: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0D4722',
  },
  queueStatusBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  queueStatusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
  },
  queueTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  queueFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  queueCitizen: {
    fontSize: 11,
    color: '#64748B',
  },
  queueAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  queueActionText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0D4722',
  },
});
