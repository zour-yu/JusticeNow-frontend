import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Case, CasePriority } from '../../../shared/types/case.types';
import { CaseStatusBadge } from './CaseStatusBadge';

interface Props {
  caseItem: Case;
  onPress: () => void;
}

export const CaseCard: React.FC<Props> = ({ caseItem, onPress }) => {
  const getPriorityStyle = (priority: CasePriority) => {
    switch (priority) {
      case CasePriority.URGENT:
        return { bg: '#FEE2E2', text: '#DC2626', border: '#FECACA' };
      case CasePriority.HIGH:
        return { bg: '#FFEDD5', text: '#C2410C', border: '#FED7AA' };
      case CasePriority.MEDIUM:
        return { bg: '#FEF3C7', text: '#B45309', border: '#FDE68A' };
      case CasePriority.LOW:
        return { bg: '#E0E7FF', text: '#3730A3', border: '#C7D2FE' };
      default:
        return { bg: '#F3F4F6', text: '#4B5563', border: '#E5E7EB' };
    }
  };

  const priorityStyle = getPriorityStyle(caseItem.priority);
  const formattedAssignedDate = new Date(caseItem.assignedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const formattedCategory = (caseItem.category || '')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.88}
    >
      {/* Header: Case #, Priority & Status */}
      <View style={styles.headerRow}>
        <View style={styles.caseIdRow}>
          <Text style={styles.caseNumber}>{caseItem.caseNumber}</Text>
          <View
            style={[
              styles.priorityBadge,
              { backgroundColor: priorityStyle.bg, borderColor: priorityStyle.border },
            ]}
          >
            <Text style={[styles.priorityText, { color: priorityStyle.text }]}>
              {caseItem.priority}
            </Text>
          </View>
        </View>
        <CaseStatusBadge status={caseItem.status} size="small" />
      </View>

      {/* Case Title */}
      <Text style={styles.title} numberOfLines={2}>
        {caseItem.title}
      </Text>

      {/* Category & Location */}
      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Ionicons name="folder-outline" size={13} color="#6B7280" />
          <Text style={styles.metaText}>{formattedCategory}</Text>
        </View>
        <Text style={styles.bullet}>•</Text>
        <View style={styles.metaItem}>
          <Ionicons name="location-outline" size={13} color="#6B7280" />
          <Text style={styles.metaText}>{caseItem.complaintDetails?.incidentLocation?.city || 'Unknown'}</Text>
        </View>
      </View>

      {/* Complainant Info */}
      <View style={styles.complainantRow}>
        <Ionicons
          name={caseItem.complaintDetails?.isAnonymous ? 'eye-off-outline' : 'person-outline'}
          size={14}
          color="#4B5563"
        />
        <Text style={styles.complainantText}>
          {caseItem.complaintDetails?.isAnonymous
            ? 'Anonymous Citizen'
            : caseItem.complaintDetails?.citizenName || 'Citizen'}
        </Text>
        <Text style={styles.assignedDateText}>Assigned: {formattedAssignedDate}</Text>
      </View>

      {/* Footer: Evidence & Notes Stats */}
      <View style={styles.footerRow}>
        <View style={styles.statsContainer}>
          <View style={styles.statBadge}>
            <Ionicons name="attach-outline" size={14} color="#0D4722" />
            <Text style={styles.statText}>
              {caseItem.evidence?.length || 0} Evidence
            </Text>
          </View>
          <View style={styles.statBadge}>
            <Ionicons name="chatbubbles-outline" size={14} color="#0D4722" />
            <Text style={styles.statText}>
              {caseItem.investigationNotes?.length || 0} Notes
            </Text>
          </View>
        </View>
        <View style={styles.actionBtn}>
          <Text style={styles.actionBtnText}>Investigate</Text>
          <Ionicons name="arrow-forward" size={14} color="#0D4722" />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  caseIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  caseNumber: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0D4722',
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  priorityText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    lineHeight: 21,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '500',
  },
  bullet: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  complainantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    marginBottom: 12,
    gap: 6,
  },
  complainantText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '600',
    flex: 1,
  },
  assignedDateText: {
    fontSize: 11,
    color: '#6B7280',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#065F46',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0D4722',
  },
});
