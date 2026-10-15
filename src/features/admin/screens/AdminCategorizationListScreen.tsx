import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  TextInput,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useAuthStore } from '../../../shared/store/authStore';
import { CaseService } from '../../../shared/services/case.service';
import { CaseStatus } from '../../../shared/types/case.types';
import { ComplaintCategory } from '../../../shared/types/complaint.types';

const SERIF_FONT = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'serif',
});

// Category metadata based on design
const CATEGORY_META: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  [ComplaintCategory.LABOR_RIGHTS]: { label: 'Labor & Workplace', color: '#4338CA', bg: '#E0E7FF', icon: 'briefcase' },
  [ComplaintCategory.DISCRIMINATION]: { label: 'Discrimination & Hate', color: '#047857', bg: '#D1FAE5', icon: 'balance-scale' },
  [ComplaintCategory.POLICE_MISCONDUCT]: { label: 'Police Misconduct', color: '#163820', bg: '#D1E5D7', icon: 'shield-alt' },
  [ComplaintCategory.ARBITRARY_DETENTION]: { label: 'Arbitrary Detention', color: '#B45309', bg: '#FEF3C7', icon: 'lock' },
  [ComplaintCategory.FREEDOM_OF_EXPRESSION]: { label: 'Freedom of Speech', color: '#DC2626', bg: '#FEE2E2', icon: 'bullhorn' },
  [ComplaintCategory.GENDER_BASED_VIOLENCE]: { label: 'Gender-Based Violence', color: '#BE185D', bg: '#FDF2F8', icon: 'venus-mars' },
  [ComplaintCategory.CHILD_RIGHTS]: { label: 'Child Rights & Welfare', color: '#7C3AED', bg: '#EDE9FE', icon: 'child' },
  [ComplaintCategory.OTHER]: { label: 'Other Classifications', color: '#334155', bg: '#F1F5F9', icon: 'folder' },
};

export const AdminCategorizationListScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user } = useAuthStore();
  const [metrics, setMetrics] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'CHART' | 'TABLE'>('CHART');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // Filter states
  const [timeFilter, setTimeFilter] = useState<'ALL' | 'LAST_30' | 'THIS_QUARTER'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<'TOTAL_CASES' | 'ACTIVE_CASES'>('TOTAL_CASES');
  const [showColumnsFilter, setShowColumnsFilter] = useState(false);
  const [columns, setColumns] = useState({ active: true, resolved: true, rate: true });

  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      Alert.alert('Access Denied', 'Only administrators can access this section.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    }
  }, [user, navigation]);

  const loadData = useCallback(async () => {
    try {
      const data = await CaseService.getCategoryMetrics();
      setMetrics(data || []);
    } catch (err) {
      console.error('Error loading category metrics:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const unsubscribe = navigation.addListener('focus', loadData);
    return unsubscribe;
  }, [navigation, loadData]);

  // Compute filtered statistics
  const groupedCases = React.useMemo(() => {
    let processed = metrics.map((g) => {
      let filteredCases = g.cases || [];
      if (timeFilter === 'LAST_30') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        filteredCases = filteredCases.filter((c: any) => new Date(c.createdAt) >= thirtyDaysAgo);
      } else if (timeFilter === 'THIS_QUARTER') {
        const now = new Date();
        const currentQuarter = Math.floor(now.getMonth() / 3);
        filteredCases = filteredCases.filter((c: any) => {
          const d = new Date(c.createdAt);
          return d.getFullYear() === now.getFullYear() && Math.floor(d.getMonth() / 3) === currentQuarter;
        });
      }

      const total = filteredCases.length;
      const active = filteredCases.filter(
        (c: any) => c.status !== CaseStatus.RESOLVED && c.status !== CaseStatus.CLOSED
      ).length;
      const resolved = filteredCases.filter(
        (c: any) => c.status === CaseStatus.RESOLVED || c.status === CaseStatus.CLOSED
      ).length;

      return {
        ...g,
        cases: filteredCases,
        total,
        active,
        resolved,
        meta: CATEGORY_META[g.category] || CATEGORY_META[ComplaintCategory.OTHER],
      };
    }).filter((g) => g.total > 0);

    if (viewMode === 'TABLE' && searchQuery.trim()) {
      processed = processed.filter((g) =>
        g.meta.label.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (viewMode === 'TABLE') {
      if (sortMode === 'TOTAL_CASES') {
        processed = processed.sort((a, b) => b.total - a.total);
      } else if (sortMode === 'ACTIVE_CASES') {
        processed = processed.sort((a, b) => b.active - a.active);
      }
    } else {
      processed = processed.sort((a, b) => b.total - a.total);
    }

    return processed;
  }, [metrics, timeFilter, searchQuery, sortMode, viewMode]);

  const totalCases = groupedCases.reduce((acc, g) => acc + g.total, 0);
  const topViolation = groupedCases.length > 0 ? groupedCases[0] : null;
  const secondViolation = groupedCases.length > 1 ? groupedCases[1] : null;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F2F5F2" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#163820" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Violations By Category</Text>
        <TouchableOpacity
          style={styles.headerAvatar}
          onPress={() => navigation.navigate('Profile')}
          activeOpacity={0.7}
        >
          <Ionicons name="person-circle" size={32} color="#163820" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* CONTEXT BAR */}
        <View style={styles.contextBar}>
          <View style={styles.totalPill}>
            <Text style={styles.totalPillText}>Total Cases: {totalCases}</Text>
          </View>
          <TouchableOpacity
            style={styles.exportBtn}
            onPress={() => Alert.alert('Export View', 'Generating category distribution view...')}
            activeOpacity={0.7}
          >
            <Ionicons name="download-outline" size={16} color="#163820" />
            <Text style={styles.exportBtnText}>Export View</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.contextDesc}>
          Overview of reported human rights cases grouped by legal classification.
        </Text>

        {/* TIME FILTERS */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContainer}
        >
          <TouchableOpacity
            style={[styles.filterPill, timeFilter === 'ALL' && styles.filterPillActive]}
            onPress={() => setTimeFilter('ALL')}
            activeOpacity={0.75}
          >
            <Text style={[styles.filterPillText, timeFilter === 'ALL' && styles.filterPillTextActive]}>
              All Time
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterPill, timeFilter === 'LAST_30' && styles.filterPillActive]}
            onPress={() => setTimeFilter('LAST_30')}
            activeOpacity={0.75}
          >
            <Text style={[styles.filterPillText, timeFilter === 'LAST_30' && styles.filterPillTextActive]}>
              Last 30 Days
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterPill, timeFilter === 'THIS_QUARTER' && styles.filterPillActive]}
            onPress={() => setTimeFilter('THIS_QUARTER')}
            activeOpacity={0.75}
          >
            <Text
              style={[
                styles.filterPillText,
                timeFilter === 'THIS_QUARTER' && styles.filterPillTextActive,
              ]}
            >
              This Quarter
            </Text>
          </TouchableOpacity>
          <View style={styles.filterPill}>
            <Text style={styles.filterPillText}>By Region</Text>
          </View>
        </ScrollView>

        {/* VIEW SWITCHER */}
        <View style={styles.switcherContainer}>
          <TouchableOpacity
            style={[styles.switcherTab, viewMode === 'CHART' && styles.switcherTabActive]}
            onPress={() => setViewMode('CHART')}
            activeOpacity={0.8}
          >
            <Ionicons name="bar-chart" size={16} color={viewMode === 'CHART' ? '#FFF' : '#4B5563'} />
            <Text style={[styles.switcherTabText, viewMode === 'CHART' && styles.switcherTabTextActive]}>
              Chart View
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.switcherTab, viewMode === 'TABLE' && styles.switcherTabActive]}
            onPress={() => setViewMode('TABLE')}
            activeOpacity={0.8}
          >
            <Ionicons name="list" size={16} color={viewMode === 'TABLE' ? '#FFF' : '#4B5563'} />
            <Text style={[styles.switcherTabText, viewMode === 'TABLE' && styles.switcherTabTextActive]}>
              Table View
            </Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color="#163820" style={{ marginTop: 40 }} />
        ) : (
          <>
            {viewMode === 'CHART' && (
              <>
                {/* METRIC CARDS ROW */}
                <View style={styles.metricsRow}>
                  {/* Card 1: TOP VIOLATION TYPE */}
                  <View style={styles.metricCard}>
                    <View style={styles.metricHeader}>
                      <Text style={styles.metricTitle}>TOP VIOLATION TYPE</Text>
                      <View style={styles.metricIconBox}>
                        <Ionicons name="warning-outline" size={12} color="#DC2626" />
                      </View>
                    </View>
                    <Text style={styles.metricValueName} numberOfLines={2}>
                      {topViolation?.meta.label || 'Labor &\nWorkplace'}
                    </Text>
                    <View style={styles.metricBottom}>
                      <Text style={styles.metricValueNum}>{topViolation?.total || 2}</Text>
                      <Text style={styles.metricValueSub}>
                        +{totalCases > 0 ? Math.round(((topViolation?.total || 2) / totalCases) * 100) : 33}% of total
                      </Text>
                    </View>
                    <View style={styles.metricBar}>
                      <View
                        style={[
                          styles.metricBarFill,
                          {
                            width: `${totalCases > 0 ? Math.min(100, Math.round(((topViolation?.total || 2) / totalCases) * 100) * 2) : 66}%`,
                            backgroundColor: '#4338CA',
                          },
                        ]}
                      />
                    </View>
                  </View>

                  {/* Card 2: FASTEST GROWING */}
                  <View style={styles.metricCard}>
                    <View style={styles.metricHeader}>
                      <Text style={styles.metricTitle}>FASTEST GROWING</Text>
                      <View style={styles.metricIconBox}>
                        <Ionicons name="trending-up" size={12} color="#DC2626" />
                      </View>
                    </View>
                    <Text style={styles.metricValueName} numberOfLines={2}>
                      {secondViolation?.meta.label || 'Arbitrary\nDetention'}
                    </Text>
                    <View style={styles.metricBottom}>
                      <Text style={styles.metricValueNum}>35</Text>
                      <Text style={[styles.metricValueSub, { color: '#059669' }]}>+14% MoM</Text>
                    </View>
                    <View style={[styles.metricBar, { backgroundColor: '#D1FAE5' }]}>
                      <View style={[styles.metricBarFill, { width: '45%', backgroundColor: '#059669' }]} />
                    </View>
                  </View>
                </View>

                {/* DISTRIBUTION BREAKDOWN */}
                <View style={styles.breakdownCard}>
                  <View style={styles.breakdownHeader}>
                    <View>
                      <Text style={styles.breakdownTitle}>Distribution Breakdown</Text>
                      <Text style={styles.breakdownSub}>Validated civil & institutional complaints</Text>
                    </View>
                    <View style={styles.totalBadge}>
                      <Text style={styles.totalBadgeText}>{totalCases}</Text>
                      <Text style={styles.totalBadgeSub}>Reports</Text>
                    </View>
                  </View>

                  {/* Horizontal Multi-Color Stacked Bar */}
                  <View style={styles.stackedBar}>
                    {groupedCases.map((g, i) => (
                      <View
                        key={g.category}
                        style={{
                          flex: Math.max(g.total, 1),
                          backgroundColor: g.meta.color,
                          borderRadius: 4,
                          marginRight: i !== groupedCases.length - 1 ? 3 : 0,
                        }}
                      />
                    ))}
                  </View>

                  {/* Category List */}
                  <View style={styles.categoryList}>
                    {groupedCases.map((g, index) => {
                      const pct = totalCases > 0 ? Math.round((g.total / totalCases) * 100) : 0;
                      return (
                        <View key={g.category} style={styles.catListItem}>
                          <View style={styles.catListLeft}>
                            <Text style={styles.catListNum}>{index + 1}.</Text>
                            <Text style={styles.catListName}>{g.meta.label}</Text>
                          </View>
                          <View style={styles.catListRight}>
                            <Text style={styles.catListTotal}>{g.total}</Text>
                            <View style={[styles.pctBadge, { backgroundColor: g.meta.bg }]}>
                              <Text style={[styles.pctBadgeText, { color: g.meta.color }]}>
                                {pct}%
                              </Text>
                            </View>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>

                {/* CATEGORY ACCORDION */}
                <View style={styles.registryHeader}>
                  <View>
                    <Text style={styles.registryTitle}>Category Case Registry</Text>
                    <Text style={styles.registrySub}>Status overview and linked records</Text>
                  </View>
                  <View style={styles.registryLegend}>
                    <View style={[styles.legendDot, { backgroundColor: '#163820' }]} />
                    <Text style={styles.legendText}>Active</Text>
                    <View style={[styles.legendDot, { backgroundColor: '#CBD5E1' }]} />
                    <Text style={styles.legendText}>Closed</Text>
                  </View>
                </View>

                {groupedCases.map((g) => {
                  const isExpanded = expandedCategory === g.category;
                  return (
                    <View key={g.category} style={styles.accordionCard}>
                      <TouchableOpacity
                        style={styles.accordionHeader}
                        activeOpacity={0.75}
                        onPress={() => setExpandedCategory(isExpanded ? null : g.category)}
                      >
                        <View style={styles.accLeft}>
                          <View style={[styles.accIconBox, { backgroundColor: g.meta.bg }]}>
                            <FontAwesome5 name={g.meta.icon} size={16} color={g.meta.color} />
                          </View>
                          <View>
                            <Text style={styles.accTitle}>{g.meta.label}</Text>
                            <Text style={styles.accSub}>
                              {g.active} Active • {g.resolved} Resolved
                            </Text>
                          </View>
                        </View>
                        <View style={styles.accRight}>
                          <View style={styles.accTotalBadge}>
                            <Text style={styles.accTotalText}>{g.total} Total</Text>
                          </View>
                          <Ionicons
                            name={isExpanded ? 'chevron-up' : 'chevron-down'}
                            size={18}
                            color="#163820"
                          />
                        </View>
                      </TouchableOpacity>

                      {isExpanded && (
                        <View style={styles.accContent}>
                          {g.cases.slice(0, 3).map((c: any, idx: number) => (
                            <View key={c._id || idx.toString()} style={styles.innerCaseCard}>
                              <View style={styles.innerHeader}>
                                <Text style={styles.innerCaseId}>
                                  Case #{c.caseNumber || c.trackingNumber}
                                </Text>
                                <View style={styles.innerStatusBadge}>
                                  <Text style={styles.innerStatusText}>{c.status}</Text>
                                </View>
                              </View>
                              <Text style={styles.innerCaseSub}>
                                {c.complaintDetails?.citizenName || 'Unknown'} • Filed{' '}
                                {new Date(c.createdAt || Date.now()).toLocaleDateString()}
                              </Text>
                              <View style={styles.innerFooter}>
                                <Text style={styles.innerLoc} numberOfLines={1}>
                                  {c.complaintDetails?.incidentLocation?.city || 'Unknown Location'} •{' '}
                                  {c.title}
                                </Text>
                                <TouchableOpacity
                                  style={styles.reviewBtn}
                                  onPress={() =>
                                    navigation.navigate('AdminCategorizationDetail', {
                                      complaintId: c._id,
                                      complaint: c,
                                    })
                                  }
                                >
                                  <Text style={styles.reviewBtnText}>Review</Text>
                                  <Ionicons name="arrow-forward" size={13} color="#163820" />
                                </TouchableOpacity>
                              </View>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  );
                })}
              </>
            )}

            {viewMode === 'TABLE' && (
              <View style={styles.tableCard}>
                <View style={styles.tableSearchRow}>
                  <View style={styles.searchBox}>
                    <Ionicons name="search" size={18} color="#9CA3AF" />
                    <TextInput
                      placeholder="Search category..."
                      style={styles.searchInput}
                      placeholderTextColor="#9CA3AF"
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                    />
                  </View>
                </View>
                <View style={styles.tableControls}>
                  <TouchableOpacity
                    style={styles.controlBtn}
                    onPress={() =>
                      setSortMode(sortMode === 'TOTAL_CASES' ? 'ACTIVE_CASES' : 'TOTAL_CASES')
                    }
                  >
                    <Ionicons name="filter" size={15} color="#163820" />
                    <Text style={styles.controlBtnText}>
                      Sort: {sortMode === 'TOTAL_CASES' ? 'Total Cases' : 'Active Cases'}
                    </Text>
                    <Ionicons name="chevron-down" size={14} color="#6B7280" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.controlBtn,
                      showColumnsFilter && { borderColor: '#163820', backgroundColor: '#E8F5E9' },
                    ]}
                    onPress={() => setShowColumnsFilter(!showColumnsFilter)}
                  >
                    <Ionicons name="options" size={15} color={showColumnsFilter ? '#163820' : '#4B5563'} />
                    <Text style={[styles.controlBtnText, showColumnsFilter && { color: '#163820' }]}>
                      Columns
                    </Text>
                  </TouchableOpacity>
                </View>

                {showColumnsFilter && (
                  <View style={styles.columnFiltersRow}>
                    <TouchableOpacity
                      style={[styles.colToggleBtn, columns.active && styles.colToggleBtnActive]}
                      onPress={() => setColumns((p) => ({ ...p, active: !p.active }))}
                    >
                      <Text style={[styles.colToggleText, columns.active && styles.colToggleTextActive]}>
                        Active Cases
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.colToggleBtn, columns.resolved && styles.colToggleBtnActive]}
                      onPress={() => setColumns((p) => ({ ...p, resolved: !p.resolved }))}
                    >
                      <Text style={[styles.colToggleText, columns.resolved && styles.colToggleTextActive]}>
                        Resolved
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.colToggleBtn, columns.rate && styles.colToggleBtnActive]}
                      onPress={() => setColumns((p) => ({ ...p, rate: !p.rate }))}
                    >
                      <Text style={[styles.colToggleText, columns.rate && styles.colToggleTextActive]}>
                        Res. Rate
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {groupedCases.map((g) => {
                  const pct = totalCases > 0 ? Math.round((g.total / totalCases) * 100) : 0;
                  const resRate = Math.round((g.resolved / Math.max(g.total, 1)) * 100);
                  return (
                    <View key={g.category} style={styles.matrixRow}>
                      <View style={styles.matrixTop}>
                        <View style={[styles.accIconBox, { backgroundColor: g.meta.bg }]}>
                          <FontAwesome5 name={g.meta.icon} size={15} color={g.meta.color} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.matrixRowTitle} numberOfLines={1}>
                            {g.meta.label}
                          </Text>
                          <Text style={styles.matrixRowSub} numberOfLines={1}>
                            Detailed tracking reports
                          </Text>
                        </View>
                        <View style={styles.matrixRowRight}>
                          <Text style={styles.matrixRowTotal}>{g.total}</Text>
                          <Text style={styles.matrixRowPct}>{pct}% Share</Text>
                        </View>
                      </View>
                      <View style={styles.matrixStats}>
                        {columns.active && (
                          <View style={styles.statBox}>
                            <Text style={styles.statLabel}>Active Cases</Text>
                            <Text style={styles.statValueActive}>• {g.active} Active</Text>
                          </View>
                        )}
                        {columns.resolved && (
                          <View style={styles.statBox}>
                            <Text style={styles.statLabel}>Resolved</Text>
                            <Text style={styles.statValueClosed}>• {g.resolved} Closed</Text>
                          </View>
                        )}
                        {columns.rate && (
                          <View style={styles.statBox}>
                            <Text style={styles.statLabel}>Res. Rate</Text>
                            <Text style={styles.statValueNormal}>{resRate}%</Text>
                            <View style={styles.resBarBg}>
                              <View style={[styles.resBarFill, { width: `${resRate}%` }]} />
                            </View>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* FIXED BOTTOM ACTION (EXPORT BUTTON MATCHING SCREENSHOT) */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={styles.exportPrimaryBtn}
          onPress={() => Alert.alert('Export Report', 'Generating consolidated PDF and CSV reports...')}
          activeOpacity={0.85}
        >
          <Ionicons name="document-text-outline" size={18} color="#FFF" />
          <Text style={styles.exportPrimaryText}>Export Report (PDF / CSV)</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F5F2',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: '#F2F5F2',
  },
  backBtn: {
    padding: 6,
    marginLeft: -6,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#163820',
    fontFamily: SERIF_FONT,
  },
  headerAvatar: {
    padding: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 20,
  },
  contextBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  totalPill: {
    backgroundColor: '#D1E5D7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  totalPillText: {
    color: '#163820',
    fontSize: 12.5,
    fontWeight: '700',
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  exportBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#163820',
  },
  contextDesc: {
    fontSize: 13.5,
    color: '#556358',
    marginBottom: 16,
    lineHeight: 19,
  },
  filterScroll: {
    marginBottom: 16,
  },
  filterContainer: {
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#1E4A2E',
    borderRadius: 20,
    marginRight: 8,
  },
  filterPillActive: {
    backgroundColor: '#1E4A2E',
    borderColor: '#1E4A2E',
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E4A2E',
  },
  filterPillTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  switcherContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8E3',
    borderRadius: 16,
    padding: 4,
    marginBottom: 20,
  },
  switcherTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  switcherTabActive: {
    backgroundColor: '#1E4A2E',
  },
  switcherTabText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#4B5563',
  },
  switcherTabTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2EAE4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 0.5,
  },
  metricIconBox: {
    backgroundColor: '#FEE2E2',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValueName: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    minHeight: 40,
    lineHeight: 20,
  },
  metricBottom: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    marginBottom: 8,
  },
  metricValueNum: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  metricValueSub: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4338CA',
    marginBottom: 2,
  },
  metricBar: {
    height: 4,
    backgroundColor: '#E0E7FF',
    borderRadius: 2,
    overflow: 'hidden',
  },
  metricBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  breakdownCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2EAE4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
    marginBottom: 20,
  },
  breakdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  breakdownTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  breakdownSub: {
    fontSize: 12.5,
    color: '#6B7280',
    marginTop: 2,
  },
  totalBadge: {
    backgroundColor: '#D1E5D7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignItems: 'center',
  },
  totalBadgeText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#163820',
  },
  totalBadgeSub: {
    fontSize: 10.5,
    color: '#163820',
    fontWeight: '600',
  },
  stackedBar: {
    flexDirection: 'row',
    height: 10,
    borderRadius: 6,
    marginBottom: 20,
    overflow: 'hidden',
  },
  categoryList: {
    gap: 14,
  },
  catListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  catListLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  catListNum: {
    fontSize: 13.5,
    color: '#6B7280',
    fontWeight: '500',
  },
  catListName: {
    fontSize: 13.5,
    color: '#111827',
    fontWeight: '600',
  },
  catListRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  catListTotal: {
    fontSize: 13.5,
    color: '#111827',
    fontWeight: '600',
  },
  pctBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    minWidth: 44,
    alignItems: 'center',
  },
  pctBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  registryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 14,
  },
  registryTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  registrySub: {
    fontSize: 12.5,
    color: '#6B7280',
    marginTop: 2,
  },
  registryLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 11,
    color: '#4B5563',
    fontWeight: '500',
    marginRight: 4,
  },
  accordionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2EAE4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
    overflow: 'hidden',
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  accLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  accIconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#111827',
  },
  accSub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  accRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  accTotalBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  accTotalText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  accContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F6F3',
    paddingTop: 14,
    gap: 10,
  },
  innerCaseCard: {
    backgroundColor: '#F9FBF9',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2EAE4',
  },
  innerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  innerCaseId: {
    fontSize: 13,
    fontWeight: '700',
    color: '#163820',
  },
  innerStatusBadge: {
    backgroundColor: '#D1E5D7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  innerStatusText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#163820',
  },
  innerCaseSub: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  innerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  innerLoc: {
    flex: 1,
    fontSize: 12,
    color: '#6B7280',
    marginRight: 10,
  },
  reviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reviewBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#163820',
  },
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2EAE4',
  },
  tableSearchRow: {
    marginBottom: 14,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FBF9',
    borderWidth: 1,
    borderColor: '#DFE7E1',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  tableControls: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  controlBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DFE7E1',
    borderRadius: 14,
    height: 40,
    gap: 6,
  },
  controlBtnText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#111827',
  },
  columnFiltersRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    backgroundColor: '#F9FBF9',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DFE7E1',
  },
  colToggleBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DFE7E1',
    backgroundColor: '#FFFFFF',
  },
  colToggleBtnActive: {
    borderColor: '#163820',
    backgroundColor: '#163820',
  },
  colToggleText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#6B7280',
  },
  colToggleTextActive: {
    color: '#FFF',
  },
  matrixRow: {
    borderTopWidth: 1,
    borderTopColor: '#F3F6F3',
    paddingVertical: 14,
  },
  matrixTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  matrixRowTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  matrixRowSub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 1,
  },
  matrixRowRight: {
    alignItems: 'flex-end',
  },
  matrixRowTotal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  matrixRowPct: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#163820',
    marginTop: 1,
  },
  matrixStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F9FBF9',
    borderRadius: 12,
    padding: 12,
  },
  statBox: {
    flex: 1,
  },
  statLabel: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 4,
  },
  statValueActive: {
    fontSize: 12,
    fontWeight: '700',
    color: '#BE185D',
  },
  statValueClosed: {
    fontSize: 12,
    fontWeight: '700',
    color: '#163820',
  },
  statValueNormal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  resBarBg: {
    height: 4,
    backgroundColor: '#DFE7E1',
    borderRadius: 2,
    width: '80%',
  },
  resBarFill: {
    height: '100%',
    backgroundColor: '#163820',
    borderRadius: 2,
  },
  bottomActions: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 24,
    backgroundColor: '#F2F5F2',
  },
  exportPrimaryBtn: {
    backgroundColor: '#1E4A2E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 32,
    gap: 8,
    shadowColor: '#1E4A2E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  exportPrimaryText: {
    color: '#FFF',
    fontSize: 15.5,
    fontWeight: '700',
  },
});
