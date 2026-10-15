import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Case, CaseStatus, Investigator } from '../../../shared/types/case.types';
import { Complaint, ComplaintStatus } from '../../../shared/types/complaint.types';
import { CaseService } from '../../../shared/services/case.service';
import { ComplaintService } from '../../../shared/services/complaint.service';
import { UserService, InvestigatorApplicant } from '../../../shared/services/user.service';

const SERIF_FONT = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'serif',
});

interface Props {
  user: any;
  navigation: any;
}

export const AdminDashboard: React.FC<Props> = ({ user, navigation }) => {
  const [cases, setCases] = useState<Case[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [investigators, setInvestigators] = useState<Investigator[]>([]);
  const [pendingApplicants, setPendingApplicants] = useState<InvestigatorApplicant[]>([]);
  const [usersCount, setUsersCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [casesData, complaintsData, investigatorsData, pendingData, usersData] = await Promise.all([
        CaseService.getAllCases(),
        ComplaintService.getAllComplaints(),
        CaseService.getAvailableInvestigators(),
        UserService.getPendingInvestigators(),
        UserService.getAllUsers(),
      ]);
      setCases(casesData || []);
      setComplaints(complaintsData || []);
      setInvestigators(investigatorsData || []);
      setPendingApplicants(pendingData || []);
      setUsersCount(usersData ? usersData.length : 0);
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
    : 'Admin 1';

  const pendingComplaints = complaints.filter(
    (c) => c.status === ComplaintStatus.SUBMITTED || c.status === ComplaintStatus.UNDER_REVIEW
  );

  const unassignedCases = cases.filter(
    (c) => !c.assignedInvestigatorId || c.assignedInvestigatorId === 'unassigned'
  );

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.[0] || '';
    const last = lastName?.[0] || '';
    return (first + last).toUpperCase() || 'AD';
  };

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
            colors={['#163820']}
            tintColor="#163820"
          />
        }
      >
        {/* ── SLEEK ADMIN COMMAND CONSOLE HEADER ── */}
        <View style={styles.adminHeaderCard}>
          <View style={styles.headerTopRow}>
            <View style={styles.adminRolePill}>
              <Ionicons name="shield-checkmark-outline" size={14} color="#8CD4A4" />
              <Text style={styles.adminRolePillText}>ADMIN COMMAND CONSOLE</Text>
            </View>
            <Text style={styles.headerDate}>{currentDate}</Text>
          </View>

          <View style={styles.adminProfileRow}>
            <View style={styles.adminAvatarGlow}>
              <Text style={styles.adminAvatarText}>
                {getInitials(user?.firstName, user?.lastName)}
              </Text>
            </View>
            <View style={styles.adminProfileTexts}>
              <Text style={styles.adminGreeting}>WELCOME BACK,</Text>
              <Text style={styles.adminNameText} numberOfLines={1}>
                {adminName}
              </Text>
              <Text style={styles.adminSubText}>Chief Oversight & Case Governance</Text>
            </View>
            <TouchableOpacity
              style={styles.settingsBtn}
              onPress={() => navigation.navigate('Profile')}
              activeOpacity={0.8}
            >
              <Ionicons name="settings-outline" size={20} color="#FFFFFF" />
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
              <Text style={[styles.tickerNumber, { color: pendingComplaints.length > 0 ? '#FACC15' : '#FFFFFF' }]}>
                {pendingComplaints.length}
              </Text>
              <Text style={styles.tickerLabel}>Pending Review</Text>
            </View>
            <View style={styles.tickerDivider} />
            <View style={styles.tickerCol}>
              <Text style={[styles.tickerNumber, { color: unassignedCases.length > 0 ? '#F87171' : '#FFFFFF' }]}>
                {unassignedCases.length}
              </Text>
              <Text style={styles.tickerLabel}>Unassigned</Text>
            </View>
            <View style={styles.tickerDivider} />
            <TouchableOpacity
              style={styles.tickerCol}
              onPress={() => navigation.navigate('AdminCaseList')}
              activeOpacity={0.7}
            >
              <Text style={styles.tickerNumber}>{cases.length}</Text>
              <Text style={styles.tickerLabel}>Total Cases</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── ADMINISTRATIVE OPERATIONS ── */}
        <View style={styles.sectionWrapper}>
          <Text style={styles.sectionHeading}>Administrative Operations</Text>

          {/* 1. Review Complaints */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('AdminComplaintsList')}
            activeOpacity={0.85}
          >
            <View style={[styles.actionIconWrapper, { backgroundColor: '#FDECD8' }]}>
              <Ionicons name="checkmark-circle" size={28} color="#D97706" />
            </View>
            <View style={styles.actionCardTexts}>
              <View style={styles.actionTitleRow}>
                <Text style={styles.actionCardTitle}>Review Complaints</Text>
                {pendingComplaints.length > 0 && (
                  <View style={[styles.actionBadge, { backgroundColor: '#FEF3C7' }]}>
                    <Text style={[styles.actionBadgeText, { color: '#B45309' }]}>
                      {pendingComplaints.length} PENDING
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.actionCardDesc}>
                Evaluate submitted citizen complaints, verify validity, approve or reject
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>

          {/* 2. Approve Investigators */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('AdminInvestigatorApproval')}
            activeOpacity={0.85}
          >
            <View style={[styles.actionIconWrapper, { backgroundColor: '#FCE7F3' }]}>
              <Ionicons name="person-add" size={24} color="#BE185D" />
            </View>
            <View style={styles.actionCardTexts}>
              <View style={styles.actionTitleRow}>
                <Text style={styles.actionCardTitle}>Approve Investigators</Text>
                {pendingApplicants.length > 0 ? (
                  <View style={[styles.actionBadge, { backgroundColor: '#FCE7F3' }]}>
                    <Text style={[styles.actionBadgeText, { color: '#BE185D' }]}>
                      {pendingApplicants.length} PENDING
                    </Text>
                  </View>
                ) : (
                  <View style={[styles.actionBadge, { backgroundColor: '#D1FAE5' }]}>
                    <Text style={[styles.actionBadgeText, { color: '#065F46' }]}>
                      ALL VERIFIED
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.actionCardDesc}>
                Review new investigator registrations, verify authority, and grant ACTIVE duty access
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>

          {/* 3. Assign Investigators */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('AdminAssignInvestigator')}
            activeOpacity={0.85}
          >
            <View style={[styles.actionIconWrapper, { backgroundColor: '#D1E5D7' }]}>
              <Ionicons name="people" size={24} color="#163820" />
            </View>
            <View style={styles.actionCardTexts}>
              <View style={styles.actionTitleRow}>
                <Text style={styles.actionCardTitle}>Assign Investigators</Text>
                {unassignedCases.length > 0 ? (
                  <View style={[styles.actionBadge, { backgroundColor: '#FFE4E6' }]}>
                    <Text style={[styles.actionBadgeText, { color: '#9F1239' }]}>
                      {unassignedCases.length} UNASSIGNED
                    </Text>
                  </View>
                ) : (
                  <View style={[styles.actionBadge, { backgroundColor: '#D1FAE5' }]}>
                    <Text style={[styles.actionBadgeText, { color: '#065F46' }]}>
                      ROSTER ACTIVE
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.actionCardDesc}>
                Allocate approved cases to investigators, balance workloads, and track progress
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>

          {/* 4. Categorize & Prioritize */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('AdminCategorizationList')}
            activeOpacity={0.85}
          >
            <View style={[styles.actionIconWrapper, { backgroundColor: '#E0E7FF' }]}>
              <Ionicons name="layers" size={24} color="#4338CA" />
            </View>
            <View style={styles.actionCardTexts}>
              <View style={styles.actionTitleRow}>
                <Text style={styles.actionCardTitle}>Categorize & Prioritize</Text>
              </View>
              <Text style={styles.actionCardDesc}>
                Update legal categories, tag sensitivity levels, and set investigation priorities
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>

          {/* 5. Manage User Accounts */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('AdminUserManagement')}
            activeOpacity={0.85}
          >
            <View style={[styles.actionIconWrapper, { backgroundColor: '#F3E8FF' }]}>
              <Ionicons name="people-circle" size={26} color="#7C3AED" />
            </View>
            <View style={styles.actionCardTexts}>
              <View style={styles.actionTitleRow}>
                <Text style={styles.actionCardTitle}>Manage User Accounts</Text>
                <View style={[styles.actionBadge, { backgroundColor: '#F5F3FF' }]}>
                  <Text style={[styles.actionBadgeText, { color: '#6D28D9' }]}>
                    {usersCount > 0 ? `${usersCount} ACCOUNTS` : 'SECURITY'}
                  </Text>
                </View>
              </View>
              <Text style={styles.actionCardDesc}>
                View user profiles, update roles & credentials, and deactivate or reactivate accounts
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>

          {/* 6. Monitor All Cases */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('AdminCaseList')}
            activeOpacity={0.85}
          >
            <View style={[styles.actionIconWrapper, { backgroundColor: '#CFE4D4' }]}>
              <Ionicons name="folder" size={24} color="#163820" />
            </View>
            <View style={styles.actionCardTexts}>
              <View style={styles.actionTitleRow}>
                <Text style={styles.actionCardTitle}>Monitor All Cases</Text>
                <View style={[styles.actionBadge, { backgroundColor: '#D1FAE5' }]}>
                  <Text style={[styles.actionBadgeText, { color: '#065F46' }]}>
                    {cases.length} TOTAL CASES
                  </Text>
                </View>
              </View>
              <Text style={styles.actionCardDesc}>
                View all cases across all jurisdictions, track status & category, and inspect investigation details
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* ── INVESTIGATOR WORKLOAD ROSTER ── */}
        <View style={styles.sectionWrapper}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>Investigator Workload Roster</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('AdminAssignInvestigator')}
              style={styles.headerActionLink}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.headerActionLinkText}>Manage ({investigators.length})</Text>
              <Ionicons name="arrow-forward" size={14} color="#163820" />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color="#163820" />
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
                const initials = getInitials(inv.firstName, inv.lastName);

                return (
                  <View
                    key={inv._id || inv.email}
                    style={[
                      styles.rosterRow,
                      index === investigators.length - 1 && { borderBottomWidth: 0 },
                    ]}
                  >
                    <View style={styles.rosterAvatar}>
                      <Text style={styles.rosterAvatarText}>{initials}</Text>
                    </View>
                    <View style={styles.rosterInfo}>
                      <Text style={styles.rosterName}>{inv.name}</Text>
                      <Text style={styles.rosterEmail}>{inv.email}</Text>
                    </View>
                    <View
                      style={[
                        styles.rosterLoadBadge,
                        isAvailable
                          ? { backgroundColor: '#D1FAE5' }
                          : { backgroundColor: '#E0E7FF' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.rosterLoadText,
                          isAvailable
                            ? { color: '#065F46' }
                            : { color: '#3730A3' },
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

        {/* ── AWAITING INITIAL REVIEW QUEUE ── */}
        {pendingComplaints.length > 0 && (
          <View style={styles.sectionWrapper}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeading}>Awaiting Initial Review</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('AdminComplaintsList')}
                style={styles.headerActionLink}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
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
                    <Text style={styles.queueStatusText}>
                      {item.status === 'SUBMITTED' ? 'SUBMITTED' : item.status.replace(/_/g, ' ')}
                    </Text>
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
                    <Ionicons name="arrow-forward" size={13} color="#163820" />
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
    backgroundColor: '#F2F5F2',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  /* ── Sleek Admin Header Card ── */
  adminHeaderCard: {
    backgroundColor: '#153C26',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 28,
    paddingTop: 18,
    paddingHorizontal: 18,
    paddingBottom: 20,
    shadowColor: '#153C26',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 8,
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
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
  },
  adminRolePillText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#8CD4A4',
    letterSpacing: 0.8,
  },
  headerDate: {
    fontSize: 12.5,
    color: '#C2DEC9',
    fontWeight: '600',
  },
  adminProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    gap: 14,
  },
  adminAvatarGlow: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#0F3822',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#00E676',
    shadowColor: '#00E676',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 8,
  },
  adminAvatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  adminProfileTexts: {
    flex: 1,
  },
  adminGreeting: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8CD4A4',
    letterSpacing: 0.8,
  },
  adminNameText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
  },
  adminSubText: {
    fontSize: 12,
    color: '#C2DEC9',
    marginTop: 2,
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* ── Header Ticker ── */
  headerTicker: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
  },
  tickerCol: {
    flex: 1,
    alignItems: 'center',
  },
  tickerNumber: {
    fontSize: 19,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  tickerLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#8CD4A4',
    marginTop: 3,
    textAlign: 'center',
  },
  tickerDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },

  /* ── Section Wrapper ── */
  sectionWrapper: {
    marginTop: 22,
    paddingHorizontal: 16,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
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
    fontSize: 13,
    fontWeight: '700',
    color: '#163820',
  },

  /* ── Operation Action Cards ── */
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2EAE4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  actionIconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  actionCardTexts: {
    flex: 1,
    paddingRight: 6,
  },
  actionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
    flexWrap: 'wrap',
    gap: 8,
  },
  actionCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  actionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  actionBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  actionCardDesc: {
    fontSize: 12.5,
    color: '#4B5563',
    lineHeight: 17,
  },

  /* ── Investigator Roster Card ── */
  rosterCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E2EAE4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  rosterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F5F2',
  },
  rosterAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#163820',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rosterAvatarText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  rosterInfo: {
    flex: 1,
  },
  rosterName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#111827',
  },
  rosterEmail: {
    fontSize: 12.5,
    color: '#4B5563',
    marginTop: 1,
  },
  rosterLoadBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  rosterLoadText: {
    fontSize: 12,
    fontWeight: '600',
  },
  loadingBox: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 12.5,
    color: '#6B7280',
    marginTop: 8,
  },
  emptyRoster: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2EAE4',
  },
  emptyRosterTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginTop: 8,
  },
  emptyRosterSubtitle: {
    fontSize: 12.5,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },

  /* ── Complaint Queue Card ── */
  complaintQueueCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2EAE4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  queueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  queueTrackingNumber: {
    fontSize: 14,
    fontWeight: '800',
    color: '#163820',
  },
  queueStatusBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  queueStatusText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#B45309',
  },
  queueTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    fontFamily: SERIF_FONT,
    marginVertical: 6,
  },
  queueFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F2F5F2',
  },
  queueCitizen: {
    fontSize: 12.5,
    color: '#4B5563',
  },
  queueAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  queueActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#163820',
  },
});
