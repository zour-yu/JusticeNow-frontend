import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Complaint } from '../../../shared/types/complaint.types';
import { StatusBadge } from './StatusBadge';
import { CATEGORIES } from './CategorySelector';

interface ComplaintCardProps {
  complaint: Complaint;
  onPress: (complaint: Complaint) => void;
}

export const ComplaintCard: React.FC<ComplaintCardProps> = ({ complaint, onPress }) => {
  const categoryInfo = CATEGORIES.find((c) => c.key === complaint.category);
  const formattedDate = new Date(complaint.incidentDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(complaint)}
      activeOpacity={0.8}
    >
      {/* Top row: Tracking ID & Status Badge */}
      <View style={styles.topRow}>
        <View style={styles.trackingContainer}>
          <Text style={styles.trackingLabel}>
            {complaint.caseId ? 'FORMAL CASE' : 'COMPLAINT'}
          </Text>
          <Text style={styles.trackingNumber}>{complaint.trackingNumber}</Text>
        </View>
        <StatusBadge status={complaint.caseStatus || complaint.status} size="sm" />
      </View>

      {/* Case Ref Tag if converted/assigned */}
      {complaint.caseId ? (
        <View style={styles.caseRefTag}>
          <Ionicons name="shield-checkmark" size={14} color="#163820" style={{ marginRight: 6 }} />
          <Text style={styles.caseRefText}>Assigned Investigation #{complaint.caseId}</Text>
        </View>
      ) : null}

      {/* Category */}
      <View style={styles.categoryRow}>
        <Text style={styles.categoryIcon}>{categoryInfo?.icon || '⚖️'}</Text>
        <Text style={styles.categoryName}>
          {categoryInfo?.label || complaint.category.replace(/_/g, ' ')}
        </Text>
        {complaint.isAnonymous && (
          <View style={styles.anonymousBadge}>
            <Text style={styles.anonymousText}>Anonymous</Text>
          </View>
        )}
      </View>

      {/* Title */}
      <Text style={styles.title} numberOfLines={2}>
        {complaint.title}
      </Text>

      {/* Description Snippet */}
      <Text style={styles.description} numberOfLines={2}>
        {complaint.description}
      </Text>

      {/* Footer Info */}
      <View style={styles.footer}>
        <View style={styles.footerItem}>
          <Ionicons name="location-outline" size={14} color="#6B7280" style={{ marginRight: 4 }} />
          <Text style={styles.footerText} numberOfLines={1}>
            {complaint.incidentLocation?.city || 'Not specified'}
          </Text>
        </View>
        <View style={styles.footerItem}>
          <Ionicons name="calendar-outline" size={14} color="#6B7280" style={{ marginRight: 4 }} />
          <Text style={styles.footerText}>{formattedDate}</Text>
        </View>
        {complaint.evidence && complaint.evidence.length > 0 && (
          <View style={styles.evidenceBadge}>
            <Ionicons name="attach-outline" size={13} color="#163820" style={{ marginRight: 2 }} />
            <Text style={styles.evidenceBadgeText}>
              {complaint.evidence.length} file{complaint.evidence.length > 1 ? 's' : ''}
            </Text>
          </View>
        )}
        <Ionicons name="chevron-forward" size={16} color="#9CA3AF" style={{ marginLeft: 'auto' }} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2EAE4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  trackingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1E5D7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  trackingLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2C4A36',
    marginRight: 5,
    letterSpacing: 0.4,
  },
  trackingNumber: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111827',
  },
  caseRefTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D5EBDC',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#C2DFCB',
    alignSelf: 'flex-start',
    marginTop: 4,
    marginBottom: 8,
  },
  caseRefText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#163820',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 6,
  },
  categoryIcon: {
    fontSize: 15,
    marginRight: 6,
  },
  categoryName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#111827',
  },
  anonymousBadge: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
  },
  anonymousText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#7E22CE',
  },
  title: {
    fontSize: 16.5,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
    lineHeight: 22,
  },
  description: {
    fontSize: 13.5,
    color: '#4B5563',
    lineHeight: 18,
    marginBottom: 14,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F2F5F2',
    gap: 12,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '500',
  },
  evidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1E5D7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  evidenceBadgeText: {
    fontSize: 11.5,
    color: '#163820',
    fontWeight: '600',
  },
});
