import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  ImageBackground,
  Image,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../../shared/store/authStore';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
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
  // 0: Submitted, 1: Under Review, 2: Under Investigation, 3: Resolved, 4: Closed
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
  } else if (complaintStatus === 'RESOLVED') {
    currentStepIndex = 3;
  } else if (complaintStatus === 'CLOSED') {
    currentStepIndex = 4;
  }

  if (stepIndex < currentStepIndex) return 'COMPLETED';
  if (stepIndex === currentStepIndex) return 'CURRENT';
  return 'PENDING';
}

const TIMELINE_STEPS = [
  { label: 'Submitted', key: 'SUBMITTED' },
  { label: 'Under Review', key: 'UNDER_REVIEW' },
  { label: 'Under\nInvestigation', key: 'UNDER_INVESTIGATION' },
  { label: 'Resolved', key: 'RESOLVED' },
  { label: 'Closed', key: 'CLOSED' },
];

export default function HomeScreen({ navigation }: Props) {
  const { user, logout } = useAuthStore();
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

  const handleLogout = async () => {
    await logout();
    navigation.replace('Login');
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
            <Ionicons name="shield-checkmark" size={26} color="#0D4722" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Justice Now</Text>
          <TouchableOpacity 
            style={styles.headerIconBtn}
            onPress={() => navigation.navigate('AssignedCases')}
          >
            <Ionicons name="briefcase-outline" size={26} color="#0D4722" />
            <View style={[styles.adminBadge, { backgroundColor: '#0D4722' }]}>
              <Text style={styles.adminBadgeText}>INV</Text>
            </View>
          </TouchableOpacity>
        </View>
        <InvestigatorDashboard user={user} navigation={navigation} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerIconBtn} 
          onPress={() => {
            // Menu options
          }}
        >
          <Ionicons name="menu-outline" size={28} color="#0D4722" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Justice Now</Text>
        <View style={styles.headerRightRow}>
          {isAdmin && (
            <TouchableOpacity 
              style={styles.headerIconBtn}
              onPress={() => navigation.navigate('AdminComplaintsList')}
            >
              <Ionicons name="shield-checkmark-outline" size={26} color="#0D4722" />
              <View style={styles.adminBadge}>
                <Text style={styles.adminBadgeText}>A</Text>
              </View>
            </TouchableOpacity>
          )}

          {isInvestigator && (
            <TouchableOpacity 
              style={styles.headerIconBtn}
              onPress={() => navigation.navigate('AssignedCases')}
            >
              <Ionicons name="briefcase-outline" size={26} color="#0D4722" />
              <View style={[styles.adminBadge, { backgroundColor: '#0D4722' }]}>
                <Text style={styles.adminBadgeText}>INV</Text>
              </View>
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={styles.headerIconBtn}
            onPress={() => navigation.navigate('Notifications')}
          >
            <NotificationBell onPress={() => navigation.navigate('Notifications')} />
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
            colors={['#0D4722']}
            tintColor="#0D4722"
          />
        }
      >
        {/* HERO SECTION */}
        <View style={styles.heroContainer}>
          <ImageBackground 
            source={require('../../../../assets/hero_bg.png')} 
            style={styles.heroBg}
            imageStyle={{ borderRadius: 20 }}
            resizeMode="cover"
          >
            <View style={styles.heroTextContainer}>
              <Text style={styles.heroTitle}>
                {isInvestigator ? 'Investigate Cases,' : isAdmin ? 'Review Complaints,' : 'Speak Up Today,'}
              </Text>
              <Text style={styles.heroTitle}>
                {isInvestigator ? 'Uphold Justice.' : isAdmin ? 'Ensure Justice.' : 'Create a Better Tomorrow.'}
              </Text>
              <Text style={styles.heroSubtitle}>
                {isInvestigator ? 'Investigator Workspace.' : isAdmin ? 'Admin Dashboard.' : 'We\'re here to help.'}
              </Text>
            </View>
          </ImageBackground>

          {/* FLOATING ACTION CARD */}
          <TouchableOpacity 
            style={styles.floatingActionCard}
            activeOpacity={0.8}
            onPress={() => navigation.navigate(isInvestigator ? 'AssignedCases' : isAdmin ? 'AdminComplaintsList' : 'SubmitComplaint')}
          >
            <View style={styles.floatingActionLeft}>
              <View style={styles.pencilIconWrapper}>
                <Ionicons 
                  name={isInvestigator ? 'briefcase-outline' : isAdmin ? 'shield-checkmark-outline' : 'create-outline'} 
                  size={20} 
                  color="#0D4722" 
                />
              </View>
              <View style={styles.floatingActionTexts}>
                <Text style={styles.floatingActionTitle}>
                  {isInvestigator ? 'Assigned Cases' : isAdmin ? 'Pending Complaints' : 'Submit a Complaint'}
                </Text>
                <Text style={styles.floatingActionDesc}>
                  {isInvestigator ? 'Manage and investigate active cases.' : isAdmin ? 'Review awaiting decisions.' : 'Your voice can bring change.'}
                </Text>
              </View>
            </View>
            <View style={styles.arrowIconWrapper}>
              <Ionicons name="arrow-forward" size={18} color="#0D4722" />
            </View>
          </TouchableOpacity>
        </View>

        {/* INVESTIGATOR TOOLS */}
        {isInvestigator && (
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Investigator Workspace</Text>
          
          {/* Assigned Cases Card */}
          <TouchableOpacity 
            style={styles.adminToolCard}
            onPress={() => navigation.navigate('AssignedCases')}
          >
            <View style={[styles.adminToolIcon, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="folder-open-outline" size={24} color="#0D4722" />
            </View>
            <View style={styles.adminToolContent}>
              <Text style={styles.adminToolTitle}>My Assigned Cases</Text>
              <Text style={styles.adminToolDesc}>
                Review complaint details, evidence, and update investigation progress
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </TouchableOpacity>
        </View>
        )}

        {/* TRACK YOUR CASE */}
        {!isAdmin && !isInvestigator && (
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Track Your Case</Text>
            {complaints.length > 0 && (
              <TouchableOpacity onPress={() => navigation.navigate('MyComplaints')}>
                <Text style={styles.viewAllText}>View All ({complaints.length})</Text>
              </TouchableOpacity>
            )}
          </View>

          {isLoadingComplaints ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color="#0D4722" />
              <Text style={styles.loadingBoxText}>Loading your complaint progress...</Text>
            </View>
          ) : complaints.length > 0 ? (
            (() => {
              const primaryComplaint = complaints[0];
              const formattedDate = primaryComplaint.createdAt
                ? new Date(primaryComplaint.createdAt).toLocaleDateString('en-US', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : 'Recently';

              return (
                <TouchableOpacity
                  style={styles.caseCard}
                  onPress={() =>
                    navigation.navigate('ComplaintDetail', {
                      complaintId: primaryComplaint._id || primaryComplaint.trackingNumber,
                      complaint: primaryComplaint,
                    })
                  }
                  activeOpacity={0.88}
                >
                  <View style={styles.caseCardHeader}>
                    <Text style={styles.caseId}>Complaint #{primaryComplaint.trackingNumber}</Text>
                    <StatusBadge status={primaryComplaint.status} size="sm" />
                  </View>
                  <Text style={styles.caseDesc} numberOfLines={2}>
                    Filed on {formattedDate}  •  {primaryComplaint.title}
                  </Text>

                  {/* DYNAMIC TIMELINE */}
                  <View style={styles.timelineContainer}>
                    <View style={styles.timelineLine} />

                    {TIMELINE_STEPS.map((st, idx) => {
                      const state = getStepStatus(idx, primaryComplaint.status);
                      return (
                        <View key={st.label} style={styles.timelineStep}>
                          {state === 'COMPLETED' ? (
                            <View style={styles.timelineCircleCompleted}>
                              <Ionicons name="checkmark" size={12} color="#FFF" />
                            </View>
                          ) : state === 'CURRENT' ? (
                            <View style={styles.timelineCircleCurrent}>
                              <Ionicons name="search" size={14} color="#FFF" />
                            </View>
                          ) : (
                            <View style={styles.timelineCirclePending} />
                          )}
                          <Text
                            style={[
                              styles.timelineLabel,
                              state === 'CURRENT' && styles.timelineLabelCurrent,
                            ]}
                          >
                            {st.label}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </TouchableOpacity>
              );
            })()
          ) : (
            <View style={styles.emptyCaseCard}>
              <View style={styles.emptyCaseIconWrapper}>
                <Ionicons name="document-text-outline" size={28} color="#0D4722" />
              </View>
              <Text style={styles.emptyCaseTitle}>No Complaints Filed Yet</Text>
              <Text style={styles.emptyCaseSubtitle}>
                If your human rights have been violated, submit a complaint to initiate an official investigation.
              </Text>
              <TouchableOpacity
                style={styles.emptySubmitBtn}
                onPress={() => navigation.navigate('SubmitComplaint')}
                activeOpacity={0.85}
              >
                <Text style={styles.emptySubmitBtnText}>Submit a Complaint</Text>
                <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}
        </View>
        )}

        {/* RECENT UPDATES */}
        {!isAdmin && !isInvestigator && (
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Updates</Text>
            {complaints.length > 0 && (
              <TouchableOpacity onPress={() => navigation.navigate('MyComplaints')}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            )}
          </View>

          {(() => {
            const recentUpdates = complaints
              .flatMap((c) =>
                (c.statusTimeline || []).map((t) => ({
                  ...t,
                  trackingNumber: c.trackingNumber,
                  complaintTitle: c.title,
                  complaint: c,
                }))
              )
              .sort(
                (a, b) =>
                  new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
              )
              .slice(0, 3);

            if (recentUpdates.length === 0) {
              return (
                <View style={styles.emptyUpdatesCard}>
                  <Ionicons name="notifications-outline" size={24} color="#94A3B8" />
                  <Text style={styles.emptyUpdatesText}>
                    No updates yet. Investigation milestones and status updates will appear here.
                  </Text>
                </View>
              );
            }

            return recentUpdates.map((item, index) => (
              <TouchableOpacity
                key={`${item.trackingNumber}-${index}-${item.timestamp}`}
                style={styles.updateCard}
                onPress={() =>
                  navigation.navigate('ComplaintDetail', {
                    complaintId: item.complaint._id || item.trackingNumber,
                    complaint: item.complaint,
                  })
                }
                activeOpacity={0.85}
              >
                <View style={[styles.updateIconWrapper, { backgroundColor: '#E8F5E9' }]}>
                  <Ionicons name="document-text-outline" size={20} color="#0D4722" />
                </View>
                <View style={styles.updateTexts}>
                  <Text style={styles.updateDesc} numberOfLines={2}>
                    {item.title}
                    {item.note ? ` — ${item.note}` : ''}
                  </Text>
                  <View style={styles.updateMetaRow}>
                    <Text style={styles.updateCaseId}>Complaint #{item.trackingNumber}</Text>
                    <Text style={styles.updateTime}>{formatTimeAgo(item.timestamp)}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ));
          })()}
        </View>
        )}
        
        {/* ADMIN TOOLS */}
        {isAdmin && (
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Admin Tools</Text>
          
          {/* Review Complaints */}
          <TouchableOpacity 
            style={styles.adminToolCard}
            onPress={() => navigation.navigate('AdminComplaintsList')}
          >
            <View style={[styles.adminToolIcon, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="checkmark-circle-outline" size={24} color="#D97706" />
            </View>
            <View style={styles.adminToolContent}>
              <Text style={styles.adminToolTitle}>Review Complaints</Text>
              <Text style={styles.adminToolDesc}>
                Approve or reject pending complaints
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </TouchableOpacity>

          {/* Categorize Complaints */}
          <TouchableOpacity 
            style={styles.adminToolCard}
            onPress={() => navigation.navigate('AdminCategorizationList')}
          >
            <View style={[styles.adminToolIcon, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="layers-outline" size={24} color="#0284C7" />
            </View>
            <View style={styles.adminToolContent}>
              <Text style={styles.adminToolTitle}>Categorize Complaints</Text>
              <Text style={styles.adminToolDesc}>
                Assign or update complaint categories
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </TouchableOpacity>

          {/* Assign Investigators */}
          <TouchableOpacity 
            style={styles.adminToolCard}
            onPress={() => navigation.navigate('AdminAssignInvestigator')}
          >
            <View style={[styles.adminToolIcon, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="person-add-outline" size={24} color="#0D4722" />
            </View>
            <View style={styles.adminToolContent}>
              <Text style={styles.adminToolTitle}>Assign Investigators</Text>
              <Text style={styles.adminToolDesc}>
                Allocate cases and monitor investigator workloads
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </TouchableOpacity>
        </View>
        )}
        
        {/* Extra padding for bottom navigation */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* BOTTOM NAVIGATION BAR */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="home" size={24} color="#0D4722" />
          <Text style={[styles.navText, { color: '#0D4722' }]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate(isInvestigator ? 'AssignedCases' : 'MyComplaints')}
        >
          <Ionicons name="folder-outline" size={24} color="#9CA3AF" />
          <Text style={styles.navText}>{isInvestigator ? 'Assigned' : 'My Cases'}</Text>
        </TouchableOpacity>

        <View style={styles.fabContainer}>
          <TouchableOpacity 
            style={styles.fabBtn}
            activeOpacity={0.9}
            onPress={() => navigation.navigate(isInvestigator ? 'AssignedCases' : isAdmin ? 'AdminComplaintsList' : 'SubmitComplaint')}
          >
            <Ionicons name={isInvestigator ? 'briefcase' : 'add'} size={30} color="#FFF" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="chatbubble-outline" size={24} color="#9CA3AF" />
          <Text style={styles.navText}>Messages</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Profile')}>
          <Ionicons name="person-outline" size={24} color="#9CA3AF" />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
    backgroundColor: '#FAFAFA',
  },
  headerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
    padding: 5,
    position: 'relative',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0D4722',
  },
  notificationBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: '#EF4444',
    width: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FAFAFA',
  },
  notificationBadgeText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: 'bold',
  },
  adminBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: '#3B82F6',
    width: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FAFAFA',
  },
  adminBadgeText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  /* ── Hero Section ── */
  heroContainer: {
    marginHorizontal: 20, // Make it full-width
    marginTop: 10,
    marginBottom: 30,
    position: 'relative',
  },
  heroBg: {
    width: '100%',
    height: 220,
    borderRadius: 20, // Remove rounded corners for full-bleed look
    overflow: 'hidden',
  },
  heroTextContainer: {
    paddingTop: 25,
    paddingHorizontal: 20,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0D4722',
    lineHeight: 28,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#374151',
    marginTop: 6,
    fontWeight: '600',
  },
  floatingActionCard: {
    position: 'absolute',
    bottom: -25,
    left: '5%',
    width: '90%',
    backgroundColor: '#0D4722',
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  floatingActionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pencilIconWrapper: {
    width: 38,
    height: 38,
    backgroundColor: '#FFF',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  floatingActionTexts: {
    justifyContent: 'center',
  },
  floatingActionTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  floatingActionDesc: {
    color: '#A7F3D0',
    fontSize: 12,
  },
  arrowIconWrapper: {
    width: 28,
    height: 28,
    backgroundColor: '#FFF',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  /* ── Sections ── */
  sectionContainer: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0D4722',
  },
  /* ── Case Card ── */
  caseCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  caseCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  caseId: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  statusBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    color: '#065F46',
    fontSize: 10,
    fontWeight: '700',
  },
  caseDesc: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 25,
  },
  timelineContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    position: 'relative',
    marginTop: 10,
    paddingHorizontal: 10,
  },
  timelineLine: {
    position: 'absolute',
    top: 10,
    left: 20,
    right: 20,
    height: 2,
    backgroundColor: '#E5E7EB',
    zIndex: 0,
  },
  timelineStep: {
    alignItems: 'center',
    width: 50,
    zIndex: 1,
  },
  timelineCircleCompleted: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#0D4722',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  timelineCircleCurrent: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0D4722',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -5,
    marginBottom: 4,
    borderWidth: 3,
    borderColor: '#E8F5E9',
  },
  timelineCirclePending: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginBottom: 8,
  },
  timelineLabel: {
    fontSize: 9,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 2,
  },
  timelineLabelCurrent: {
    color: '#111827',
    fontWeight: '700',
  },
  /* ── Recent Updates ── */
  updateCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  updateIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  updateTexts: {
    flex: 1,
  },
  updateDesc: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
  },
  updateMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  updateCaseId: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '700',
  },
  updateTime: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  /* ── Admin Tools ── */
  adminToolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#FFF',
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  adminToolIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adminToolContent: {
    flex: 1,
  },
  adminToolTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  adminToolDesc: {
    fontSize: 12,
    color: '#6B7280',
  },
  /* ── Bottom Nav ── */
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 80,
    backgroundColor: '#FFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 10,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  navText: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 4,
    fontWeight: '600',
  },
  fabContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -35,
  },
  fabBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0D4722',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0D4722',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  /* ── Loading and Empty states for Citizen ── */
  loadingBox: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  loadingBoxText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
  },
  emptyCaseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  emptyCaseIconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  emptyCaseTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  emptyCaseSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 17,
    marginBottom: 14,
  },
  emptySubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0D4722',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  emptySubmitBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  emptyUpdatesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyUpdatesText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 16,
  },
});

