import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
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
          <Text style={styles.trackingLabel}>REF</Text>
          <Text style={styles.trackingNumber}>{complaint.trackingNumber}</Text>
        </View>
        <StatusBadge status={complaint.status} size="sm" />
      </View>

      {/* Category and Title */}
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
          <Text style={styles.footerIcon}>📍</Text>
          <Text style={styles.footerText} numberOfLines={1}>
            {complaint.incidentLocation?.city || 'Not specified'}
          </Text>
        </View>
        <View style={styles.footerItem}>
          <Text style={styles.footerIcon}>📅</Text>
          <Text style={styles.footerText}>{formattedDate}</Text>
        </View>
        {complaint.evidence && complaint.evidence.length > 0 && (
          <View style={styles.evidenceBadge}>
            <Text style={styles.evidenceBadgeText}>
              📎 {complaint.evidence.length} file{complaint.evidence.length > 1 ? 's' : ''}
            </Text>
          </View>
        )}
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
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  trackingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  trackingLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    marginRight: 4,
  },
  trackingNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    letterSpacing: 0.5,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
  },
  anonymousBadge: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  anonymousText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7E22CE',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
    lineHeight: 22,
  },
  description: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 12,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  footerText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  evidenceBadge: {
    marginLeft: 'auto',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  evidenceBadgeText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
  },
});
