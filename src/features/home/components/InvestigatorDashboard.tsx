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
import { Case, CaseStatus, CasePriority } from '../../../shared/types/case.types';
import { CaseService } from '../../../shared/services/case.service';
import { CaseStatusBadge } from '../../cases/components/CaseStatusBadge';

const { width } = Dimensions.get('window');

interface Props {
  user: any;
  navigation: any;
}

export const InvestigatorDashboard: React.FC<Props> = ({ user, navigation }) => {
  const [cases, setCases] = useState<Case[]>([]);
  const [metrics, setMetrics] = useState<any>({
    total: 0,
    active: 0,
    underInvestigation: 0,
    evidenceCollection: 0,
    reportSubmitted: 0,
    resolved: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [casesData, metricsData] = await Promise.all([
        CaseService.getAssignedCases(),
        CaseService.getMetrics(),
      ]);
      setCases(casesData);
      setMetrics(metricsData);
    } catch (err) {
      console.log('Error loading investigator dashboard data:', err);
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

  const investigatorName = user?.firstName
    ? `${user.firstName} ${user.lastName || ''}`.trim()
    : 'Lead Investigator';

  const activeCasesList = cases.filter(
    (c) => c.status !== CaseStatus.RESOLVED && c.status !== CaseStatus.CLOSED
  );

  const urgentCases = activeCasesList.filter(
    (c) => c.priority === CasePriority.URGENT || c.priority === CasePriority.HIGH
  );

  // Extract recent events across assigned cases for activity feed
  const recentActivities = cases
    .flatMap((c) =>
      (c.statusTimeline || []).map((t) => ({
        ...t,
        caseNumber: c.caseNumber,
        caseTitle: c.title,
        caseItem: c,
      }))
    )
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 4);

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
        {/* ── SLEEK COMMAND HEADER CARD ── */}
        <View style={styles.commandHeader}>
          <View style={styles.headerTopRow}>
            <View style={styles.dutyBadge}>
              <View style={styles.dutyDot} />
              <Text style={styles.dutyBadgeText}>ACTIVE ON DUTY</Text>
            </View>
            <Text style={styles.dateText}>{currentDate}</Text>
          </View>

          <View style={styles.profileRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitials}>
                {user?.firstName?.[0] || 'I'}
                {user?.lastName?.[0] || 'N'}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.greetingText}>Officer Workspace</Text>
              <Text style={styles.investigatorNameText} numberOfLines={1}>
                {investigatorName}
              </Text>
              <Text style={styles.badgeIdText}>Special Investigation Unit • Badged</Text>
            </View>
          </View>

          {/* QUICK SUMMARY PILL */}
          <View style={styles.headerQuickStats}>
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatNumber}>{activeCasesList.length}</Text>
              <Text style={styles.quickStatLabel}>Active Cases</Text>
            </View>
            <View style={styles.quickStatDivider} />
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatNumber}>{urgentCases.length}</Text>
              <Text style={[styles.quickStatNumber, urgentCases.length > 0 && { color: '#FCD34D' }]}>
                {urgentCases.length}
              </Text>
              <Text style={styles.quickStatLabel}>High Priority</Text>
            </View>
            <View style={styles.quickStatDivider} />
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatNumber}>{metrics.resolved || 0}</Text>
              <Text style={styles.quickStatLabel}>Concluded</Text>
            </View>
          </View>
        </View>

        {/* ── RESPONSIVE CASELOAD METRICS GRID ── */}
        <View style={styles.sectionWrapper}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>Caseload Analytics</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('AssignedCases')}
              style={styles.viewAllBtn}
            >
              <Text style={styles.viewAllBtnText}>View All</Text>
              <Ionicons name="arrow-forward" size={12} color="#0D4722" />
            </TouchableOpacity>
          </View>

          <View style={styles.metricsGrid}>
            {/* Active Cases Card */}
            <TouchableOpacity
              style={[styles.metricCard, { borderLeftColor: '#059669' }]}
              onPress={() => navigation.navigate('AssignedCases', { statusFilter: 'ALL' })}
              activeOpacity={0.8}
            >
              <View style={[styles.metricIconWrap, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="folder-open" size={20} color="#059669" />
              </View>
              <Text style={styles.metricCardValue}>{activeCasesList.length}</Text>
              <Text style={styles.metricCardLabel}>Assigned Total</Text>
            </TouchableOpacity>

            {/* Fieldwork Card */}
            <TouchableOpacity
              style={[styles.metricCard, { borderLeftColor: '#2563EB' }]}
              onPress={() =>
                navigation.navigate('AssignedCases', {
                  statusFilter: CaseStatus.UNDER_INVESTIGATION,
                })
              }
              activeOpacity={0.8}
            >
              <View style={[styles.metricIconWrap, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="search" size={20} color="#2563EB" />
              </View>
              <Text style={[styles.metricCardValue, { color: '#1E40AF' }]}>
                {metrics.underInvestigation || 0}
              </Text>
              <Text style={styles.metricCardLabel}>In Fieldwork</Text>
            </TouchableOpacity>

            {/* Evidence Card */}
            <TouchableOpacity
              style={[styles.metricCard, { borderLeftColor: '#7C3AED' }]}
              onPress={() =>
                navigation.navigate('AssignedCases', {
                  statusFilter: CaseStatus.EVIDENCE_COLLECTION,
                })
              }
              activeOpacity={0.8}
            >
              <View style={[styles.metricIconWrap, { backgroundColor: '#F5F3FF' }]}>
                <Ionicons name="images" size={20} color="#7C3AED" />
              </View>
              <Text style={[styles.metricCardValue, { color: '#6D28D9' }]}>
                {metrics.evidenceCollection || 0}
              </Text>
              <Text style={styles.metricCardLabel}>Evidence Vault</Text>
            </TouchableOpacity>

            {/* Reports Card */}
            <TouchableOpacity
              style={[styles.metricCard, { borderLeftColor: '#D97706' }]}
              onPress={() =>
                navigation.navigate('AssignedCases', {
                  statusFilter: CaseStatus.REPORT_SUBMITTED,
                })
              }
              activeOpacity={0.8}
            >
              <View style={[styles.metricIconWrap, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="document-text" size={20} color="#D97706" />
              </View>
              <Text style={[styles.metricCardValue, { color: '#B45309' }]}>
                {metrics.reportSubmitted || 0}
              </Text>
              <Text style={styles.metricCardLabel}>Reports Ready</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── FAST COMMAND LAUNCHER ── */}
        <View style={styles.sectionWrapper}>
          <TouchableOpacity
            style={styles.primaryActionPill}
            onPress={() => navigation.navigate('AssignedCases')}
            activeOpacity={0.85}
          >
            <View style={styles.primaryActionLeft}>
              <View style={styles.primaryActionIconBg}>
                <Ionicons name="briefcase" size={20} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.primaryActionTitle}>Launch Case Dossiers</Text>
                <Text style={styles.primaryActionSubtitle}>
                  Inspect evidence, record witness notes, advance phases
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward-circle" size={26} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* ── PRIORITY / ACTIVE CASES SPOTLIGHT ── */}
        <View style={styles.sectionWrapper}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.titleWithBadge}>
              <Text style={styles.sectionHeading}>Priority Investigations</Text>
              {urgentCases.length > 0 && (
                <View style={styles.urgentBadge}>
                  <Text style={styles.urgentBadgeText}>{urgentCases.length} URGENT</Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('AssignedCases')}
              style={styles.viewAllBtn}
            >
              <Text style={styles.viewAllBtnText}>Manage ({cases.length})</Text>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.centerLoading}>
              <ActivityIndicator size="small" color="#0D4722" />
              <Text style={styles.loadingText}>Loading assigned cases...</Text>
            </View>
          ) : activeCasesList.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="shield-checkmark" size={36} color="#10B981" />
              <Text style={styles.emptyCardTitle}>No Pending Caseload</Text>
              <Text style={styles.emptyCardSubtitle}>
                All assigned cases have been concluded. New case allocations from administration will appear here.
              </Text>
            </View>
          ) : (
            activeCasesList.slice(0, 3).map((item) => {
              const formattedCat = (item.category || '')
                .replace(/_/g, ' ')
                .toLowerCase()
                .replace(/\b\w/g, (c) => c.toUpperCase());

              const isHigh =
                item.priority === CasePriority.URGENT || item.priority === CasePriority.HIGH;

              return (
                <TouchableOpacity
                  key={item._id || item.caseNumber}
                  style={[styles.spotlightCard, isHigh && styles.spotlightCardUrgent]}
                  onPress={() =>
                    navigation.navigate('CaseDetail', {
                      caseId: item._id || item.caseNumber,
                      caseItem: item,
                    })
                  }
                  activeOpacity={0.85}
                >
                  <View style={styles.spotlightHeader}>
                    <View style={styles.spotlightCaseNumberWrap}>
                      <Text style={styles.spotlightCaseNumber}>{item.caseNumber}</Text>
                      <Text style={styles.spotlightCategory}>{formattedCat}</Text>
                    </View>
                    <CaseStatusBadge status={item.status} size="small" />
                  </View>

                  <Text style={styles.spotlightTitle} numberOfLines={2}>
                    {item.title}
                  </Text>

                  <View style={styles.spotlightMetaRow}>
                    <View style={styles.spotlightMetaItem}>
                      <Ionicons name="person-outline" size={13} color="#6B7280" />
                      <Text style={styles.spotlightMetaText} numberOfLines={1}>
                        {item.complaintDetails?.isAnonymous
                          ? 'Anonymous'
                          : item.complaintDetails?.citizenName || 'Citizen'}
                      </Text>
                    </View>
                    <View style={styles.spotlightMetaItem}>
                      <Ionicons name="location-outline" size={13} color="#6B7280" />
                      <Text style={styles.spotlightMetaText} numberOfLines={1}>
                        {item.complaintDetails?.incidentLocation?.city || 'Location'}
                      </Text>
                    </View>
                    <View style={styles.spotlightMetaItem}>
                      <Ionicons name="attach-outline" size={13} color="#6B7280" />
                      <Text style={styles.spotlightMetaText}>
                        {item.evidence?.length || 0} items
                      </Text>
                    </View>
                  </View>

                  <View style={styles.spotlightFooter}>
                    <Text style={styles.spotlightFooterAction}>Open Investigation Dossier</Text>
                    <Ionicons name="arrow-forward" size={14} color="#0D4722" />
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* ── LIVE INVESTIGATION ACTIVITY STREAM ── */}
        {recentActivities.length > 0 && (
          <View style={styles.sectionWrapper}>
            <Text style={styles.sectionHeading}>Recent Case Activity</Text>
            <View style={styles.activityFeedCard}>
              {recentActivities.map((act, index) => (
                <TouchableOpacity
                  key={`${act.caseNumber}-${index}`}
                  style={[
                    styles.activityRow,
                    index === recentActivities.length - 1 && { borderBottomWidth: 0 },
                  ]}
                  onPress={() =>
                    navigation.navigate('CaseDetail', {
                      caseId: act.caseItem._id || act.caseNumber,
                      caseItem: act.caseItem,
                    })
                  }
                  activeOpacity={0.7}
                >
                  <View style={styles.activityIconWrap}>
                    <Ionicons name="pulse" size={16} color="#0D4722" />
                  </View>
                  <View style={styles.activityInfo}>
                    <Text style={styles.activityTitle}>{act.title}</Text>
                    <Text style={styles.activityNote} numberOfLines={1}>
                      {act.note || act.caseTitle}
                    </Text>
                    <View style={styles.activityMetaRow}>
                      <Text style={styles.activityCaseRef}>{act.caseNumber}</Text>
                      <Text style={styles.activityTime}>
                        {new Date(act.timestamp).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={14} color="#9CA3AF" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* ── SLEEK INVESTIGATOR BOTTOM NAV BAR ── */}
      <View style={styles.investigatorBottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="grid" size={22} color="#0D4722" />
          <Text style={[styles.navText, { color: '#0D4722', fontWeight: '800' }]}>
            Workspace
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('AssignedCases')}
        >
          <View style={styles.navIconContainer}>
            <Ionicons name="briefcase-outline" size={22} color="#6B7280" />
            {activeCasesList.length > 0 && (
              <View style={styles.navBadge}>
                <Text style={styles.navBadgeText}>{activeCasesList.length}</Text>
              </View>
            )}
          </View>
          <Text style={styles.navText}>Assigned</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('Profile')}
        >
          <Ionicons name="person-circle-outline" size={22} color="#6B7280" />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
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
    paddingBottom: 20,
  },
  /* ── Command Header ── */
  commandHeader: {
    backgroundColor: '#064E3B',
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 22,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    shadowColor: '#064E3B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  dutyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#022C22',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: '#059669',
  },
  dutyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  dutyBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#A7F3D0',
    letterSpacing: 0.5,
  },
  dateText: {
    fontSize: 12,
    color: '#D1FAE5',
    fontWeight: '600',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    gap: 14,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#0D9488',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#6EE7B7',
  },
  avatarInitials: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  greetingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#A7F3D0',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  investigatorNameText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 1,
  },
  badgeIdText: {
    fontSize: 11,
    color: '#D1FAE5',
    marginTop: 2,
  },
  headerQuickStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(2, 44, 34, 0.75)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.4)',
    alignItems: 'center',
  },
  quickStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  quickStatNumber: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  quickStatLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#A7F3D0',
    marginTop: 2,
  },
  quickStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(167, 243, 208, 0.2)',
  },

  /* ── Section Structure ── */
  sectionWrapper: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionHeading: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0D4722',
  },
  urgentBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  urgentBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B91C1C',
  },

  /* ── Responsive Metrics Grid ── */
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricCard: {
    width: (width - 42) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  metricIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricCardValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
  },
  metricCardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 2,
  },

  /* ── Primary Action Pill ── */
  primaryActionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0D4722',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: '#0D4722',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryActionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  primaryActionIconBg: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryActionTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  primaryActionSubtitle: {
    fontSize: 11,
    color: '#D1FAE5',
    marginTop: 2,
  },

  /* ── Spotlight Case Cards ── */
  spotlightCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  spotlightCardUrgent: {
    borderColor: '#FDE68A',
    backgroundColor: '#FFFEF5',
  },
  spotlightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  spotlightCaseNumberWrap: {
    flex: 1,
  },
  spotlightCaseNumber: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0D4722',
  },
  spotlightCategory: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 1,
  },
  spotlightTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 20,
    marginBottom: 10,
  },
  spotlightMetaRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 8,
    gap: 12,
    marginBottom: 12,
  },
  spotlightMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  spotlightMetaText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  spotlightFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  spotlightFooterAction: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0D4722',
  },
  centerLoading: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 8,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 10,
  },
  emptyCardSubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },

  /* ── Activity Feed ── */
  activityFeedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 10,
  },
  activityIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  activityNote: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  activityMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  activityCaseRef: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0D4722',
  },
  activityTime: {
    fontSize: 10,
    color: '#94A3B8',
  },

  /* ── Sleek Investigator Bottom Nav ── */
  investigatorBottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 10,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  navIconContainer: {
    position: 'relative',
  },
  navBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#0D4722',
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  navBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  navText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 4,
  },
});
