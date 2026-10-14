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
          <Text style={styles.trackingLabel}>CASE</Text>
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
            <Ionicons name="attach-outline" size={13} color="#065F46" style={{ marginRight: 2 }} />
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
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
    marginBottom: 10,
  },
  trackingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FBF4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  trackingLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0D4722',
    marginRight: 4,
  },
  trackingNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: 0.5,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryIcon: {
    fontSize: 15,
    marginRight: 6,
  },
  categoryName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0D4722',
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
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
    lineHeight: 21,
  },
  description: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 12,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  evidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  evidenceBadgeText: {
    fontSize: 11,
    color: '#065F46',
    fontWeight: '600',
  },
});

