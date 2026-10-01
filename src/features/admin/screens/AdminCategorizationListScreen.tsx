import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Dimensions,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useAuthStore } from '../../../shared/store/authStore';
import { CaseService } from '../../../shared/services/case.service';
import { Case, CaseStatus } from '../../../shared/types/case.types';
import { ComplaintCategory } from '../../../shared/types/complaint.types';

const { width } = Dimensions.get('window');

// Category metadata based on the design
const CATEGORY_META: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  [ComplaintCategory.POLICE_MISCONDUCT]: { label: 'Police Misconduct', color: '#9F1239', bg: '#FFE4E6', icon: 'shield-alt' },
  [ComplaintCategory.ARBITRARY_DETENTION]: { label: 'Arbitrary Detention', color: '#B45309', bg: '#FEF3C7', icon: 'lock' },
  [ComplaintCategory.DISCRIMINATION]: { label: 'Discrimination & Hate', color: '#047857', bg: '#D1FAE5', icon: 'balance-scale' },
  [ComplaintCategory.LABOR_RIGHTS]: { label: 'Labor & Workplace', color: '#4338CA', bg: '#E0E7FF', icon: 'briefcase' },
  [ComplaintCategory.FREEDOM_OF_EXPRESSION]: { label: 'Speech & Assembly', color: '#15803D', bg: '#DCFCE7', icon: 'bullhorn' },
  [ComplaintCategory.GENDER_BASED_VIOLENCE]: { label: 'Gender Violence', color: '#BE185D', bg: '#FDF2F8', icon: 'venus-mars' },
  [ComplaintCategory.CHILD_RIGHTS]: { label: 'Child Rights', color: '#0F766E', bg: '#CCFBF1', icon: 'child' },
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
      Alert.alert('Access Denied', 'Only administrators can access this section.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    }
  }, [user, navigation]);

  const loadData = useCallback(async () => {
    try {
      const data = await CaseService.getCategoryMetrics();
      setMetrics(data);
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
    let processed = metrics.map(g => {
      // 1. Time Filter
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

      // Re-calculate totals based on filtered cases
      const total = filteredCases.length;
      const active = filteredCases.filter((c: any) => c.status !== CaseStatus.RESOLVED && c.status !== CaseStatus.CLOSED).length;
      const resolved = filteredCases.filter((c: any) => c.status === CaseStatus.RESOLVED || c.status === CaseStatus.CLOSED).length;

      return {
        ...g,
        cases: filteredCases,
        total,
        active,
        resolved,
        meta: CATEGORY_META[g.category] || CATEGORY_META[ComplaintCategory.OTHER],
      };
    }).filter(g => g.total > 0);

    // 2. Search Query (Table View)
    if (viewMode === 'TABLE' && searchQuery.trim()) {
      processed = processed.filter(g => g.meta.label.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    // 3. Sorting (Table View)
    if (viewMode === 'TABLE') {
       if (sortMode === 'TOTAL_CASES') {
          processed = processed.sort((a, b) => b.total - a.total);
       } else if (sortMode === 'ACTIVE_CASES') {
          processed = processed.sort((a, b) => b.active - a.active);
       }
    } else {
       // Chart view default sort
       processed = processed.sort((a, b) => b.total - a.total);
    }

    return processed;
  }, [metrics, timeFilter, searchQuery, sortMode, viewMode]);

  const totalCases = groupedCases.reduce((acc, g) => acc + g.total, 0);
  const topViolation = groupedCases.length > 0 ? groupedCases[0] : null;

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Violations By Category</Text>
        <TouchableOpacity style={styles.headerAvatar}>
          <Ionicons name="person-circle" size={32} color="#022C22" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* CONTEXT BAR */}
        <View style={styles.contextBar}>
          <View style={styles.contextLeft}>
            <View style={styles.totalPill}>
              <Text style={styles.totalPillText}>Total Cases: {totalCases}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.exportBtn}>
            <Ionicons name="download-outline" size={16} color="#0F172A" />
            <Text style={styles.exportBtnText}>Export View</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.contextDesc}>
          Overview of reported human rights cases grouped by legal classification.
        </Text>

        {/* TIME FILTERS */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContainer}>
          <TouchableOpacity 
            style={[styles.filterPill, timeFilter === 'ALL' && styles.filterPillActive]}
            onPress={() => setTimeFilter('ALL')}
          >
            <Text style={[styles.filterPillText, timeFilter === 'ALL' && styles.filterPillTextActive]}>All Time</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterPill, timeFilter === 'LAST_30' && styles.filterPillActive]}
            onPress={() => setTimeFilter('LAST_30')}
          >
            <Text style={[styles.filterPillText, timeFilter === 'LAST_30' && styles.filterPillTextActive]}>Last 30 Days</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterPill, timeFilter === 'THIS_QUARTER' && styles.filterPillActive]}
            onPress={() => setTimeFilter('THIS_QUARTER')}
          >
            <Text style={[styles.filterPillText, timeFilter === 'THIS_QUARTER' && styles.filterPillTextActive]}>This Quarter</Text>
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
            <Ionicons name="bar-chart" size={16} color={viewMode === 'CHART' ? '#FFF' : '#0F172A'} />
            <Text style={[styles.switcherTabText, viewMode === 'CHART' && styles.switcherTabTextActive]}>Chart View</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.switcherTab, viewMode === 'TABLE' && styles.switcherTabActive]}
            onPress={() => setViewMode('TABLE')}
            activeOpacity={0.8}
          >
            <Ionicons name="list" size={16} color={viewMode === 'TABLE' ? '#FFF' : '#0F172A'} />
            <Text style={[styles.switcherTabText, viewMode === 'TABLE' && styles.switcherTabTextActive]}>Table View</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color="#0D4722" style={{ marginTop: 40 }} />
        ) : (
          <>
            {viewMode === 'CHART' && (
              <>
                {/* METRIC CARDS */}
                <View style={styles.metricsRow}>
                  <View style={styles.metricCard}>
                    <View style={styles.metricHeader}>
                      <Text style={styles.metricTitle}>TOP VIOLATION TYPE</Text>
                      <View style={styles.metricIconBox}>
                        <Ionicons name="warning-outline" size={12} color="#9F1239" />
                      </View>
                    </View>
                    <Text style={styles.metricValueName} numberOfLines={2}>
                      {topViolation?.meta.label || 'N/A'}
                    </Text>
                    <View style={styles.metricBottom}>
                      <Text style={styles.metricValueNum}>{topViolation?.total || 0}</Text>
                      <Text style={styles.metricValueSub}>
                        {totalCases > 0 ? Math.round(((topViolation?.total || 0) / totalCases) * 100) : 0}% of total
                      </Text>
                    </View>
                    <View style={[styles.metricBar, { backgroundColor: topViolation?.meta.bg }]}>
                      <View style={[styles.metricBarFill, { width: '80%', backgroundColor: topViolation?.meta.color }]} />
                    </View>
                  </View>

                  <View style={styles.metricCard}>
                    <View style={styles.metricHeader}>
                      <Text style={styles.metricTitle}>FASTEST GROWING</Text>
                      <View style={[styles.metricIconBox, { backgroundColor: '#FEE2E2' }]}>
                        <Ionicons name="trending-up" size={12} color="#B91C1C" />
                      </View>
                    </View>
                    <Text style={styles.metricValueName} numberOfLines={2}>
                      Arbitrary Detention
                    </Text>
                    <View style={styles.metricBottom}>
                      <Text style={styles.metricValueNum}>35</Text>
                      <Text style={[styles.metricValueSub, { color: '#047857' }]}>+14% MoM</Text>
                    </View>
                    <View style={[styles.metricBar, { backgroundColor: '#ECFDF5' }]}>
                      <View style={[styles.metricBarFill, { width: '40%', backgroundColor: '#059669' }]} />
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

                  {/* Horizontal Bar Chart */}
                  <View style={styles.stackedBar}>
                    {groupedCases.map((g, i) => (
                      <View
                        key={g.category}
                        style={{
                          flex: g.total,
                          backgroundColor: g.meta.color,
                          borderTopLeftRadius: i === 0 ? 8 : 0,
                          borderBottomLeftRadius: i === 0 ? 8 : 0,
                          borderTopRightRadius: i === groupedCases.length - 1 ? 8 : 0,
                          borderBottomRightRadius: i === groupedCases.length - 1 ? 8 : 0,
                          borderRightWidth: i !== groupedCases.length - 1 ? 2 : 0,
                          borderColor: '#FFF',
                        }}
                      />
                    ))}
                  </View>

                  {/* Category List */}
                  <View style={styles.categoryList}>
                    {groupedCases.map((g, index) => {
                      const pct = Math.round((g.total / totalCases) * 100);
                      return (
                        <View key={g.category} style={styles.catListItem}>
                          <View style={styles.catListLeft}>
                            <Text style={styles.catListNum}>{index + 1}.</Text>
                            <Text style={styles.catListName}>{g.meta.label}</Text>
                          </View>
                          <View style={styles.catListRight}>
                            <Text style={styles.catListTotal}>{g.total}</Text>
                            <View style={[styles.pctBadge, { backgroundColor: g.meta.bg }]}>
                              <Text style={[styles.pctBadgeText, { color: g.meta.color }]}>{pct}%</Text>
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
                    <View style={[styles.legendDot, { backgroundColor: '#022C22' }]} />
                    <Text style={styles.legendText}>Active</Text>
                    <View style={[styles.legendDot, { backgroundColor: '#CBD5E1' }]} />
                    <Text style={styles.legendText}>Closed</Text>
                  </View>
                </View>

                {groupedCases.map(g => {
                  const isExpanded = expandedCategory === g.category;
                  return (
                    <View key={g.category} style={styles.accordionCard}>
                      <TouchableOpacity
                        style={styles.accordionHeader}
                        activeOpacity={0.7}
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
                            size={20}
                            color="#0F172A"
                          />
                        </View>
                      </TouchableOpacity>

                      {isExpanded && (
                        <View style={styles.accContent}>
                          {g.cases.slice(0, 3).map((c: any, idx: number) => (
                            <View key={c._id || idx.toString()} style={styles.innerCaseCard}>
                              <View style={styles.innerHeader}>
                                <Text style={styles.innerCaseId}>Case #{c.caseNumber}</Text>
                                <View style={styles.innerStatusBadge}>
                                  <Text style={styles.innerStatusText}>{c.status}</Text>
                                </View>
                              </View>
                              <Text style={styles.innerCaseSub}>
                                {c.complaintDetails?.citizenName || 'Unknown'} • Filed {new Date(c.createdAt || Date.now()).toLocaleDateString()}
                              </Text>
                              <View style={styles.innerFooter}>
                                <Text style={styles.innerLoc} numberOfLines={1}>
                                  {c.complaintDetails?.incidentLocation?.city || 'Unknown Location'} • {c.title}
                                </Text>
                                <TouchableOpacity style={styles.reviewBtn}>
                                  <Text style={styles.reviewBtnText}>Review</Text>
                                  <Ionicons name="arrow-forward" size={14} color="#0F172A" />
                                </TouchableOpacity>
                              </View>
                            </View>
                          ))}
                          {g.cases.length > 3 && (
                            <TouchableOpacity style={styles.viewMoreBtn}>
                              <Text style={styles.viewMoreText}>View All {g.cases.length} Cases</Text>
                            </TouchableOpacity>
                          )}
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
                    <Ionicons name="search" size={18} color="#64748B" />
                    <TextInput 
                      placeholder="Search category..." 
                      style={styles.searchInput} 
                      placeholderTextColor="#94A3B8" 
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                    />
                  </View>
                </View>
                <View style={styles.tableControls}>
                  <TouchableOpacity 
                    style={styles.controlBtn} 
                    onPress={() => setSortMode(sortMode === 'TOTAL_CASES' ? 'ACTIVE_CASES' : 'TOTAL_CASES')}
                  >
                    <Ionicons name="filter" size={16} color="#0F172A" />
                    <Text style={styles.controlBtnText}>
                      Sort: {sortMode === 'TOTAL_CASES' ? 'Total Cases' : 'Active Cases'}
                    </Text>
                    <Ionicons name="chevron-down" size={14} color="#64748B" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.controlBtn, showColumnsFilter && { borderColor: '#0D4722', backgroundColor: '#F0FDF4' }]} 
                    onPress={() => setShowColumnsFilter(!showColumnsFilter)}
                  >
                    <Ionicons name="options" size={16} color={showColumnsFilter ? '#0D4722' : '#0F172A'} />
                    <Text style={[styles.controlBtnText, showColumnsFilter && { color: '#0D4722' }]}>Columns</Text>
                  </TouchableOpacity>
                </View>

                {showColumnsFilter && (
                  <View style={styles.columnFiltersRow}>
                    <TouchableOpacity 
                      style={[styles.colToggleBtn, columns.active && styles.colToggleBtnActive]} 
                      onPress={() => setColumns(p => ({...p, active: !p.active}))}
                    >
                      <Text style={[styles.colToggleText, columns.active && styles.colToggleTextActive]}>Active Cases</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.colToggleBtn, columns.resolved && styles.colToggleBtnActive]} 
                      onPress={() => setColumns(p => ({...p, resolved: !p.resolved}))}
                    >
                      <Text style={[styles.colToggleText, columns.resolved && styles.colToggleTextActive]}>Resolved</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.colToggleBtn, columns.rate && styles.colToggleBtnActive]} 
                      onPress={() => setColumns(p => ({...p, rate: !p.rate}))}
                    >
                      <Text style={[styles.colToggleText, columns.rate && styles.colToggleTextActive]}>Res. Rate</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <View style={styles.matrixHeader}>
                  <View style={styles.matrixTitleRow}>
                    <View style={[styles.legendDot, { backgroundColor: '#022C22' }]} />
                    <Text style={styles.matrixTitle}>Category Matrix</Text>
                  </View>
                  <View style={styles.classificationsBadge}>
                    <Text style={styles.classificationsText}>{groupedCases.length} Classifications</Text>
                  </View>
                </View>

                {groupedCases.map((g) => {
                  const pct = Math.round((g.total / totalCases) * 100);
                  const resRate = Math.round((g.resolved / Math.max(g.total, 1)) * 100);
                  return (
                    <View key={g.category} style={styles.matrixRow}>
                      <View style={styles.matrixTop}>
                        <View style={[styles.accIconBox, { backgroundColor: g.meta.bg }]}>
                          <FontAwesome5 name={g.meta.icon} size={16} color={g.meta.color} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.matrixRowTitle} numberOfLines={1}>{g.meta.label}</Text>
                          <Text style={styles.matrixRowSub} numberOfLines={1}>Detailed tracking reports</Text>
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

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* FIXED BOTTOM ACTIONS */}
      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.exportPrimaryBtn}>
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
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginLeft: 8,
  },
  headerAvatar: {
    padding: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 160,
  },
  contextBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  contextLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  totalPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#022C22',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  totalPillText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  exportBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  contextDesc: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 20,
    lineHeight: 18,
  },
  filterScroll: {
    marginBottom: 20,
  },
  filterContainer: {
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 20,
  },
  filterPillActive: {
    backgroundColor: '#022C22',
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  filterPillTextActive: {
    color: '#FFF',
  },
  switcherContainer: {
    flexDirection: 'row',
    backgroundColor: '#EAEFFF',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  switcherTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
  },
  switcherTabActive: {
    backgroundColor: '#0D4722',
  },
  switcherTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  switcherTabTextActive: {
    color: '#FFF',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  metricIconBox: {
    backgroundColor: '#FFE4E6',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValueName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
    height: 40,
  },
  metricBottom: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 12,
  },
  metricValueNum: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
  },
  metricValueSub: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E11D48',
    marginBottom: 4,
  },
  metricBar: {
    height: 4,
    backgroundColor: '#F1F5F9',
    borderRadius: 2,
    overflow: 'hidden',
  },
  metricBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  breakdownCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 32,
  },
  breakdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  breakdownSub: {
    fontSize: 12,
    color: '#64748B',
  },
  totalBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignItems: 'center',
  },
  totalBadgeText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#065F46',
  },
  totalBadgeSub: {
    fontSize: 10,
    color: '#065F46',
    fontWeight: '600',
  },
  stackedBar: {
    flexDirection: 'row',
    height: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  categoryList: {
    gap: 16,
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
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  catListName: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
  },
  catListRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  catListTotal: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
  pctBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 46,
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
    marginBottom: 16,
  },
  registryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  registrySub: {
    fontSize: 12,
    color: '#64748B',
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
    fontSize: 10,
    color: '#475569',
    fontWeight: '500',
    marginRight: 4,
  },
  accordionCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
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
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  accSub: {
    fontSize: 12,
    color: '#64748B',
  },
  accRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  accTotalBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  accTotalText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  accContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 16,
    gap: 12,
  },
  innerCaseCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
  },
  innerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  innerCaseId: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  innerStatusBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  innerStatusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#065F46',
  },
  innerCaseSub: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 12,
  },
  innerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  innerLoc: {
    flex: 1,
    fontSize: 12,
    color: '#94A3B8',
    marginRight: 12,
  },
  reviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reviewBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  viewMoreBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  viewMoreText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0D4722',
  },
  tableCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  tableSearchRow: {
    marginBottom: 16,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  tableControls: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  controlBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    height: 40,
    gap: 8,
  },
  controlBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  columnFiltersRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  colToggleBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFF',
  },
  colToggleBtnActive: {
    borderColor: '#0D4722',
    backgroundColor: '#0D4722',
  },
  colToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  colToggleTextActive: {
    color: '#FFF',
  },
  matrixHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  matrixTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  matrixTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  classificationsBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  classificationsText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#166534',
  },
  matrixRow: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingVertical: 16,
  },
  matrixTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  matrixRowTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  matrixRowSub: {
    fontSize: 12,
    color: '#64748B',
  },
  matrixRowRight: {
    alignItems: 'flex-end',
  },
  matrixRowTotal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  matrixRowPct: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9F1239',
  },
  matrixStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
  },
  statBox: {
    flex: 1,
  },
  statLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 4,
  },
  statValueActive: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E11D48',
  },
  statValueClosed: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  statValueNormal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  resBarBg: {
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    width: '80%',
  },
  resBarFill: {
    height: '100%',
    backgroundColor: '#0F172A',
    borderRadius: 2,
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 12,
  },
  exportPrimaryBtn: {
    backgroundColor: '#022C22',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 12,
    gap: 8,
  },
  exportPrimaryText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  scheduleBtn: {
    backgroundColor: '#EFF6FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 12,
    gap: 8,
  },
  scheduleText: {
    color: '#1E40AF',
    fontSize: 15,
    fontWeight: '700',
  },
});
