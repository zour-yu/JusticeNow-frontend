import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Complaint, ComplaintPriority } from '../../../shared/types/complaint.types';
import { StatusBadge } from '../../complaints/components/StatusBadge';
import { CATEGORIES } from '../../complaints/components/CategorySelector';

interface PendingComplaintCardProps {
  complaint: Complaint;
  onPress: (complaint: Complaint) => void;
}

export const PendingComplaintCard: React.FC<PendingComplaintCardProps> = ({
  complaint,
  onPress,
}) => {
  const categoryInfo = CATEGORIES.find((c) => c.key === complaint.category);
  const formattedDate = new Date(complaint.createdAt).toLocaleDateString(
    'en-US',
    {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }
  );

  const getPriorityColor = () => {
    switch (complaint.priority) {
      case ComplaintPriority.URGENT:
        return '#EF4444';
      case ComplaintPriority.HIGH:
        return '#F97316';
      case ComplaintPriority.MEDIUM:
        return '#F59E0B';
      case ComplaintPriority.LOW:
        return '#3B82F6';
      default:
        return '#64748B';
    }
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(complaint)}
      activeOpacity={0.8}
    >
      {/* Top row: Tracking ID & Priority */}
      <View style={styles.topRow}>
        <View style={styles.trackingContainer}>
          <Text style={styles.trackingLabel}>REF</Text>
          <Text style={styles.trackingNumber}>{complaint.trackingNumber}</Text>
        </View>
        <View
          style={[
            styles.priorityBadge,
            { backgroundColor: getPriorityColor() + '20' },
          ]}
        >
          <Text
            style={[
              styles.priorityText,
              { color: getPriorityColor() },
            ]}
          >
            {complaint.priority}
          </Text>
        </View>
      </View>

      {/* Category and Title */}
      <View style={styles.categoryRow}>
        <Text style={styles.categoryIcon}>{categoryInfo?.icon || '⚖️'}</Text>
        <Text style={styles.categoryName} numberOfLines={1}>
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

      {/* Citizen Info */}
      <View style={styles.citizenInfo}>
        <Text style={styles.citizenLabel}>Submitted by:</Text>
        <Text style={styles.citizenName}>
          {complaint.isAnonymous ? 'Anonymous' : complaint.citizenName}
        </Text>
        {!complaint.isAnonymous && complaint.citizenEmail && (
          <Text style={styles.citizenEmail} numberOfLines={1}>
            {complaint.citizenEmail}
          </Text>
        )}
      </View>

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
              📎 {complaint.evidence.length}
            </Text>
          </View>
        )}
      </View>

      {/* Action Indicator */}
      <View style={styles.actionIndicator}>
        <Text style={styles.actionText}>Review Needed</Text>
        <Text style={styles.actionArrow}>→</Text>
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
    gap: 4,
  },
  trackingLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  trackingNumber: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  categoryIcon: {
    fontSize: 18,
  },
  categoryName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    flex: 1,
  },
  anonymousBadge: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  anonymousText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#7E22CE',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
    lineHeight: 20,
  },
  citizenInfo: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  citizenLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  citizenName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  citizenEmail: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  footerIcon: {
    fontSize: 14,
  },
  footerText: {
    fontSize: 12,
    color: '#64748B',
  },
  evidenceBadge: {
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  evidenceBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3730A3',
  },
  actionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  actionArrow: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '700',
  },
});
