import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  ImageBackground,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../../shared/store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { InvestigatorDashboard } from '../components/InvestigatorDashboard';
import { AdminDashboard } from '../components/AdminDashboard';
import { NotificationBell } from '../../notifications/components/NotificationBell';
import { Complaint, ComplaintStatus } from '../../../shared/types/complaint.types';
import { ComplaintService } from '../../../shared/services/complaint.service';
import { StatusBadge } from '../../complaints/components/StatusBadge';

interface Props {
  navigation: any;
}

const { width } = Dimensions.get('window');

function formatTimeAgo(timestamp: string): string {
  if (!timestamp) return 'Recently';
  const now = new Date().getTime();
  const past = new Date(timestamp).getTime();
  const diffSec = Math.floor((now - past) / 1000);

  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDays = Math.floor(diffHour / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getStepStatus(stepIndex: number, complaintStatus: string) {
  // 0: Received, 1: Under Review, 2: Under Investigation, 3: Discussed, 4: Closed
  let currentStepIndex = 0;
  if (complaintStatus === ComplaintStatus.UNDER_REVIEW) {
    currentStepIndex = 1;
  } else if (
    complaintStatus === ComplaintStatus.APPROVED ||
    complaintStatus === ComplaintStatus.CONVERTED_TO_CASE ||
    complaintStatus === 'UNDER_INVESTIGATION' ||
    complaintStatus === 'PENDING'
  ) {
    currentStepIndex = 2;
  } else if (complaintStatus === 'RESOLVED' || complaintStatus === 'DISCUSSED') {
    currentStepIndex = 3;
  } else if (complaintStatus === 'CLOSED') {
    currentStepIndex = 4;
  }

  if (stepIndex < currentStepIndex) return 'COMPLETED';
  if (stepIndex === currentStepIndex) return 'CURRENT';
  return 'PENDING';
}

function getCurrentStepIndex(complaintStatus: string): number {
  if (complaintStatus === ComplaintStatus.UNDER_REVIEW) return 1;
  if (
    complaintStatus === ComplaintStatus.APPROVED ||
    complaintStatus === ComplaintStatus.CONVERTED_TO_CASE ||
    complaintStatus === 'UNDER_INVESTIGATION' ||
    complaintStatus === 'PENDING'
  ) return 2;
  if (complaintStatus === 'RESOLVED' || complaintStatus === 'DISCUSSED') return 3;
  if (complaintStatus === 'CLOSED') return 4;
  return 0; // SUBMITTED / Received
}

const TIMELINE_STEPS = [
  { label: 'Received', key: 'SUBMITTED' },
  { label: 'Under\nReview', key: 'UNDER_REVIEW' },
  { label: 'Under\nInvestigation', key: 'UNDER_INVESTIGATION' },
  { label: 'Discussed', key: 'DISCUSSED' },
  { label: 'Closed', key: 'CLOSED' },
];

const DEFAULT_SAMPLE_CASE: Complaint = {
  _id: 'sample-case-1',
  trackingNumber: 'JN-2024-0156',
  title: 'Police Investigation and abuse of power',
  description: 'Official inquiry regarding misconduct and administrative review.',
  status: ComplaintStatus.CONVERTED_TO_CASE,
  createdAt: '2024-05-11T09:30:00.000Z',
  updatedAt: '2024-05-11T14:30:00.000Z',
  isAnonymous: false,
} as unknown as Complaint;

export default function HomeScreen({ navigation }: Props) {
  const { user } = useAuthStore();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoadingComplaints, setIsLoadingComplaints] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const isAdmin = user?.role === 'ADMIN';
  const isInvestigator = user?.role === 'INVESTIGATOR';

  const loadCitizenComplaints = useCallback(async () => {
    if (isAdmin || isInvestigator) return;
    try {
      const data = await ComplaintService.getMyComplaints();
      setComplaints(data || []);
    } catch (err) {
      console.log('Error loading citizen complaints for home screen:', err);
    } finally {
      setIsLoadingComplaints(false);
      setIsRefreshing(false);
    }
  }, [isAdmin, isInvestigator]);

  useEffect(() => {
    loadCitizenComplaints();
    const unsubscribe = navigation.addListener('focus', () => {
      loadCitizenComplaints();
    });
    return unsubscribe;
  }, [navigation, loadCitizenComplaints]);

  const onRefresh = () => {
    setIsRefreshing(true);
    loadCitizenComplaints();
  };

  if (isAdmin) {
    return (
      <SafeAreaView style={styles.safe}>
        <AdminDashboard user={user} navigation={navigation} />
      </SafeAreaView>
    );
  }

  if (isInvestigator) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.headerIconBtn} 
            onPress={() => navigation.navigate('Profile')}
          >
            <Ionicons name="shield-checkmark" size={24} color="#1E4334" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Justice Now</Text>
          <TouchableOpacity 
            style={styles.headerIconBtn}
            onPress={() => navigation.navigate('AssignedCases')}
          >
            <Ionicons name="briefcase-outline" size={24} color="#1E4334" />
            <View style={[styles.roleBadge, { backgroundColor: '#1E4334' }]}>
              <Text style={styles.roleBadgeText}>INV</Text>
            </View>
          </TouchableOpacity>
        </View>
        <InvestigatorDashboard user={user} navigation={navigation} />
      </SafeAreaView>
    );
  }

  // Active complaint to display in the main tracker card
  const primaryCase = complaints.length > 0 ? complaints[0] : DEFAULT_SAMPLE_CASE;
  const isRealCase = complaints.length > 0;
  const primaryStepIndex = getCurrentStepIndex(primaryCase.status);

  const formattedDate = primaryCase.createdAt
    ? new Date(primaryCase.createdAt).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '11 May 2024';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerIconBtn} 
          onPress={() => navigation.navigate('Profile')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="menu-outline" size={26} color="#183D2D" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Justice Now</Text>

        <View style={styles.headerRightRow}>
          <TouchableOpacity 
            style={styles.headerIconBtn}
            onPress={() => navigation.navigate('Notifications')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <NotificationBell color="#183D2D" size={24} onPress={() => navigation.navigate('Notifications')} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={['#1E4334']}
            tintColor="#1E4334"
          />
        }
      >
        {/* HERO SECTION */}
        <View style={styles.heroOuterContainer}>
          <View style={styles.heroCard}>
            <ImageBackground 
              source={require('../../../../assets/hero_bg.png')} 
              style={styles.heroBgImage}
              resizeMode="cover"
            >
              <View style={styles.heroTextContainer}>
                <Text style={styles.heroTitle}>Speak Up Today,</Text>
                <Text style={styles.heroTitle}>Create a Better Tomorrow.</Text>
                <Text style={styles.heroSubtitle}>We're here to help.</Text>
              </View>
            </ImageBackground>
          </View>

          {/* FLOATING ACTION CARD ("Submit a Complaint") */}
          <TouchableOpacity 
            style={styles.floatingActionCard}
            activeOpacity={0.92}
            onPress={() => navigation.navigate('SubmitComplaint')}
          >
            <View style={styles.floatingActionLeft}>
              <View style={styles.floatingActionIconWrapper}>
                <Ionicons name="chatbox-ellipses-outline" size={21} color="#D2E8DB" />
              </View>
              <View style={styles.floatingActionTexts}>
                <Text style={styles.floatingActionTitle}>Submit a Complaint</Text>
                <Text style={styles.floatingActionDesc}>Your voice can bring change</Text>
              </View>
            </View>
            <View style={styles.floatingActionArrowWrapper}>
              <Ionicons name="chevron-forward" size={17} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        </View>

        {/* TRACK YOUR CASE */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Track Your Case</Text>
            <TouchableOpacity onPress={() => navigation.navigate('MyComplaints')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {isLoadingComplaints && complaints.length === 0 ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color="#1E4334" />
              <Text style={styles.loadingBoxText}>Loading your complaint details...</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.caseCard}
              onPress={() => {
                if (isRealCase) {
                  navigation.navigate('ComplaintDetail', {
                    complaintId: primaryCase._id || primaryCase.trackingNumber,
                    complaint: primaryCase,
                  });
                } else {
                  navigation.navigate('SubmitComplaint');
                }
              }}
              activeOpacity={0.9}
            >
              {/* Card Header */}
              <View style={styles.caseCardHeader}>
                <Text style={styles.caseId}>Case #{primaryCase.trackingNumber}</Text>
                <StatusBadge status={primaryCase.status} size="sm" />
              </View>

              {/* Subtitle */}
              <Text style={styles.caseDesc} numberOfLines={2}>
                Filed on {formattedDate} – {primaryCase.title}
              </Text>

              {/* 5-Step Stepper */}
              <View style={styles.stepperContainer}>
                {/* Connecting Line Segments */}
                <View style={styles.stepperLineTrack}>
                  {TIMELINE_STEPS.slice(0, -1).map((_, i) => {
                    const isCompleted = i < primaryStepIndex;
                    return (
                      <View 
                        key={`seg-${i}`} 
                        style={[
                          styles.lineSegment, 
                          isCompleted ? styles.lineSegmentActive : styles.lineSegmentInactive
                        ]} 
                      />
                    );
                  })}
                </View>

                {/* Stepper Nodes */}
                {TIMELINE_STEPS.map((st, idx) => {
                  const state = getStepStatus(idx, primaryCase.status);
                  const isCurrent = state === 'CURRENT';
                  const isCompleted = state === 'COMPLETED';

                  return (
                    <View key={st.label} style={styles.stepperNodeContainer}>
                      <View style={styles.nodeCircleWrapper}>
                        {isCompleted ? (
                          <View style={styles.nodeCompleted}>
                            <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                          </View>
                        ) : isCurrent ? (
                          <View style={styles.nodeCurrentOuter}>
                            <View style={styles.nodeCurrentInner}>
                              <View style={styles.nodeCurrentDot} />
                            </View>
                          </View>
                        ) : (
                          <View style={styles.nodePending} />
                        )}
                      </View>
                      <Text
                        style={[
                          styles.stepperLabel,
                          isCurrent && styles.stepperLabelCurrent,
                        ]}
                      >
                        {st.label}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* RECENT YOUR CASE */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Your Case</Text>
            <TouchableOpacity onPress={() => navigation.navigate('MyComplaints')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {(() => {
            const recentList = complaints.slice(0, 3);

            if (recentList.length === 0) {
              return (
                <TouchableOpacity
                  style={styles.recentPreviewCard}
                  activeOpacity={0.9}
                  onPress={() => navigation.navigate('SubmitComplaint')}
                >
                  <View style={styles.recentCardHeader}>
                    <Text style={styles.recentCaseId}>Case #{DEFAULT_SAMPLE_CASE.trackingNumber}</Text>
                    <StatusBadge status={DEFAULT_SAMPLE_CASE.status} size="sm" />
                  </View>
                  <Text style={styles.recentCaseTitle} numberOfLines={1}>
                    {DEFAULT_SAMPLE_CASE.title}
                  </Text>
                  <View style={styles.recentCaseFooter}>
                    <Text style={styles.recentCaseDate}>Filed on {formattedDate}</Text>
                    <Ionicons name="chevron-forward" size={16} color="#7D9387" />
                  </View>
                </TouchableOpacity>
              );
            }

            return recentList.map((c) => {
              const cDate = c.createdAt
                ? new Date(c.createdAt).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : 'Recently';

              return (
                <TouchableOpacity
                  key={c._id || c.trackingNumber}
                  style={styles.recentPreviewCard}
                  activeOpacity={0.9}
                  onPress={() =>
                    navigation.navigate('ComplaintDetail', {
                      complaintId: c._id || c.trackingNumber,
                      complaint: c,
                    })
                  }
                >
                  <View style={styles.recentCardHeader}>
                    <Text style={styles.recentCaseId}>Case #{c.trackingNumber}</Text>
                    <StatusBadge status={c.status} size="sm" />
                  </View>
                  <Text style={styles.recentCaseTitle} numberOfLines={1}>
                    {c.title}
                  </Text>
                  <View style={styles.recentCaseFooter}>
                    <Text style={styles.recentCaseDate}>Filed on {cDate}</Text>
                    <Ionicons name="chevron-forward" size={16} color="#7D9387" />
                  </View>
                </TouchableOpacity>
              );
            });
          })()}
        </View>

        {/* Extra bottom padding so content doesn't get hidden behind bottom nav */}
        <View style={{ height: 110 }} />
      </ScrollView>

      {/* BOTTOM NAVIGATION BAR */}
      <View style={styles.bottomNavContainer}>
        <TouchableOpacity style={styles.navItem} activeOpacity={0.8}>
          <Ionicons name="home" size={23} color="#1E4334" />
          <Text style={[styles.navText, styles.navTextActive]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('MyComplaints')}
        >
          <Ionicons name="folder-outline" size={23} color="#7D9387" />
          <Text style={styles.navText}>My Case</Text>
        </TouchableOpacity>

        {/* Center Floating Action Button (+) */}
        <View style={styles.centerFabAnchor}>
          <TouchableOpacity 
            style={styles.centerFab}
            activeOpacity={0.92}
            onPress={() => navigation.navigate('SubmitComplaint')}
          >
            <Ionicons name="add" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.navItem} 
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Notifications')}
        >
          <Ionicons name="chatbubble-outline" size={23} color="#7D9387" />
          <Text style={styles.navText}>Messages</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem} 
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Profile')}
        >
          <Ionicons name="person-outline" size={23} color="#7D9387" />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F3F6F2',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 12,
    backgroundColor: '#F3F6F2',
  },
  headerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconBtn: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    fontWeight: '700',
    color: '#16382B',
    letterSpacing: -0.2,
  },
  roleBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#F3F6F2',
  },
  roleBadgeText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },

  /* ── Hero Section ── */
  heroOuterContainer: {
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 38,
    position: 'relative',
  },
  heroCard: {
    borderRadius: 28,
    overflow: 'hidden',
    height: 275,
    backgroundColor: '#DCE8E0',
  },
  heroBgImage: {
    width: '100%',
    height: '100%',
  },
  heroTextContainer: {
    paddingTop: 24,
    paddingHorizontal: 22,
  },
  heroTitle: {
    fontSize: 24,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    fontWeight: '700',
    color: '#133526',
    lineHeight: 31,
    letterSpacing: -0.4,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#425F50',
    marginTop: 6,
    fontWeight: '500',
  },

  /* ── Floating Action Card ── */
  floatingActionCard: {
    position: 'absolute',
    bottom: -22,
    left: 14,
    right: 14,
    backgroundColor: '#1E4334',
    borderRadius: 22,
    paddingVertical: 13,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    shadowColor: '#102A1E',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.32,
    shadowRadius: 18,
    elevation: 10,
  },
  floatingActionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  floatingActionIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  floatingActionTexts: {
    justifyContent: 'center',
    flex: 1,
  },
  floatingActionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  floatingActionDesc: {
    color: '#A7C7B5',
    fontSize: 12,
    marginTop: 2,
    fontWeight: '400',
  },
  floatingActionArrowWrapper: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },

  /* ── Sections ── */
  sectionContainer: {
    paddingHorizontal: 18,
    marginBottom: 26,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    fontWeight: '600',
    color: '#162E22',
    letterSpacing: -0.3,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#264E3A',
  },

  /* ── Track Your Case Card ── */
  caseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#143122',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#EDF3EE',
  },
  caseCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  caseId: {
    fontSize: 16,
    fontWeight: '700',
    color: '#152C21',
    letterSpacing: -0.2,
  },
  caseDesc: {
    fontSize: 13,
    color: '#5C7164',
    lineHeight: 18,
    marginBottom: 24,
  },

  /* ── 5-Step Horizontal Stepper ── */
  stepperContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    position: 'relative',
    marginTop: 4,
  },
  stepperLineTrack: {
    position: 'absolute',
    top: 14,
    left: 20,
    right: 20,
    flexDirection: 'row',
    zIndex: 0,
  },
  lineSegment: {
    flex: 1,
    height: 2.5,
  },
  lineSegmentActive: {
    backgroundColor: '#1E4334',
  },
  lineSegmentInactive: {
    backgroundColor: '#DFE7E1',
    height: 2,
  },
  stepperNodeContainer: {
    alignItems: 'center',
    width: 58,
    zIndex: 1,
  },
  nodeCircleWrapper: {
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nodeCompleted: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1E4334',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nodeCurrentOuter: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#D0E4D7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nodeCurrentInner: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#1E4334',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nodeCurrentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  nodePending: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CAD7D0',
  },
  stepperLabel: {
    fontSize: 10,
    color: '#7B8F84',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 13,
    fontWeight: '500',
  },
  stepperLabelCurrent: {
    color: '#152C21',
    fontWeight: '700',
  },

  /* ── Recent Cases Cards ── */
  recentPreviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EDF3EE',
    shadowColor: '#143122',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  recentCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recentCaseId: {
    fontSize: 15,
    fontWeight: '700',
    color: '#152C21',
  },
  recentCaseTitle: {
    fontSize: 13,
    color: '#4B6255',
    fontWeight: '500',
    marginBottom: 10,
  },
  recentCaseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recentCaseDate: {
    fontSize: 12,
    color: '#82958B',
  },

  /* ── Loading State ── */
  loadingBox: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EDF3EE',
  },
  loadingBoxText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
  },

  /* ── Bottom Navigation ── */
  bottomNavContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 76,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 22,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(26, 59, 41, 0.06)',
    shadowColor: '#102A1E',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 12,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 48,
  },
  navText: {
    fontSize: 10,
    color: '#7D9387',
    marginTop: 4,
    fontWeight: '500',
  },
  navTextActive: {
    color: '#1E4334',
    fontWeight: '700',
  },
  centerFabAnchor: {
    marginTop: -30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerFab: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#1E4334',
    borderWidth: 3.5,
    borderColor: '#F3F6F2',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1E4334',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.38,
    shadowRadius: 12,
    elevation: 10,
  },
});
