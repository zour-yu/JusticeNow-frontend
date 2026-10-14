import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TimelineEvent, ComplaintStatus } from '../../../shared/types/complaint.types';

interface TimelineViewProps {
  timeline: TimelineEvent[];
}

export const TimelineView: React.FC<TimelineViewProps> = ({ timeline }) => {
  if (!timeline || timeline.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="time-outline" size={32} color="#9CA3AF" style={{ marginBottom: 6 }} />
        <Text style={styles.emptyText}>No timeline history available yet.</Text>
      </View>
    );
  }

  // Ensure strict chronological ordering (oldest event first, leading to latest event)
  const sortedTimeline = [...timeline].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const getEventConfig = (event: TimelineEvent) => {
    const titleLower = (event.title || '').toLowerCase();
    const status = event.status;

    if (titleLower.includes('resolved') || status === ('RESOLVED' as any)) {
      return {
        color: '#047857',
        bgColor: '#ECFDF5',
        borderColor: '#A7F3D0',
        icon: 'shield-checkmark',
        badge: 'RESOLVED',
      };
    }
    if (titleLower.includes('closed') || status === ('CLOSED' as any)) {
      return {
        color: '#374151',
        bgColor: '#F3F4F6',
        borderColor: '#D1D5DB',
        icon: 'lock-closed',
        badge: 'CLOSED',
      };
    }
    if (
      titleLower.includes('investigation') ||
      titleLower.includes('commenced') ||
      status === ComplaintStatus.CONVERTED_TO_CASE ||
      status === ('UNDER_INVESTIGATION' as any)
    ) {
      return {
        color: '#0D4722',
        bgColor: '#DCFCE7',
        borderColor: '#6EE7B7',
        icon: 'search',
        badge: 'INVESTIGATION',
      };
    }
    if (titleLower.includes('assigned') || status === ('PENDING' as any)) {
      return {
        color: '#0D4722',
        bgColor: '#E0F2FE',
        borderColor: '#BAE6FD',
        icon: 'person',
        badge: 'ASSIGNED',
      };
    }
    if (titleLower.includes('approved') || status === ComplaintStatus.APPROVED) {
      return {
        color: '#059669',
        bgColor: '#ECFDF5',
        borderColor: '#A7F3D0',
        icon: 'checkmark-circle',
        badge: 'APPROVED',
      };
    }
    if (
      titleLower.includes('review') ||
      titleLower.includes('categorized') ||
      status === ComplaintStatus.UNDER_REVIEW
    ) {
      return {
        color: '#D97706',
        bgColor: '#FEF3C7',
        borderColor: '#FDE68A',
        icon: 'eye',
        badge: 'REVIEW',
      };
    }
    if (titleLower.includes('rejected') || status === ComplaintStatus.REJECTED) {
      return {
        color: '#DC2626',
        bgColor: '#FEE2E2',
        borderColor: '#FECACA',
        icon: 'close-circle',
        badge: 'REJECTED',
      };
    }
    if (titleLower.includes('submitted') || status === ComplaintStatus.SUBMITTED) {
      return {
        color: '#4B5563',
        bgColor: '#F3F4F6',
        borderColor: '#E5E7EB',
        icon: 'document-text',
        badge: 'SUBMITTED',
      };
    }
    return {
      color: '#0D4722',
      bgColor: '#F0FDF4',
      borderColor: '#E5E7EB',
      icon: 'information-circle',
      badge: 'UPDATE',
    };
  };

  return (
    <View style={styles.container}>
      {sortedTimeline.map((event, index) => {
        const isLatest = index === sortedTimeline.length - 1;
        const isLastItem = index === sortedTimeline.length - 1;
        const config = getEventConfig(event);
        const formattedDate = new Date(event.timestamp).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });

        return (
          <View key={index} style={styles.timelineItem}>
            {/* Left Column: Line & Milestone Node */}
            <View style={styles.leftColumn}>
              <View
                style={[
                  styles.nodeCircle,
                  { backgroundColor: config.bgColor, borderColor: config.color },
                  isLatest && styles.nodeCircleActive,
                ]}
              >
                <Ionicons name={config.icon as any} size={13} color={config.color} />
              </View>
              {!isLastItem && <View style={styles.connectingLine} />}
            </View>

            {/* Right Column: Event Content Card */}
            <View style={[styles.contentCard, isLatest && styles.latestContentCard]}>
              <View style={styles.cardTopRow}>
                <View style={styles.badgeRow}>
                  <View style={[styles.phaseBadge, { backgroundColor: config.bgColor, borderColor: config.borderColor }]}>
                    <Text style={[styles.phaseBadgeText, { color: config.color }]}>
                      {config.badge}
                    </Text>
                  </View>
                  <Text style={styles.stepIndexText}>Step {index + 1}</Text>
                </View>

                {isLatest && (
                  <View style={styles.latestIndicator}>
                    <View style={styles.pulsingDot} />
                    <Text style={styles.latestIndicatorText}>LATEST STATUS</Text>
                  </View>
                )}
              </View>

              <Text style={styles.title}>{event.title}</Text>

              <View style={styles.dateRow}>
                <Ionicons name="calendar-outline" size={12} color="#6B7280" style={{ marginRight: 4 }} />
                <Text style={styles.date}>{formattedDate}</Text>
              </View>

              <Text style={styles.note}>{event.note}</Text>

              {event.updatedBy && (
                <View style={styles.authorRow}>
                  <Ionicons name="shield-outline" size={12} color="#6B7280" style={{ marginRight: 4 }} />
                  <Text style={styles.author}>
                    Authorized Log by: <Text style={styles.authorBold}>{event.updatedBy}</Text>
                  </Text>
                </View>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  leftColumn: {
    width: 32,
    alignItems: 'center',
    marginRight: 12,
  },
  nodeCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  nodeCircleActive: {
    shadowColor: '#0D4722',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  connectingLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#D1D5DB',
    marginTop: 2,
    marginBottom: -4,
  },
  contentCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  latestContentCard: {
    borderColor: '#6EE7B7',
    borderWidth: 1.5,
    backgroundColor: '#F0FDF4',
    shadowColor: '#0D4722',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
    gap: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  phaseBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  phaseBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  stepIndexText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  latestIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D4722',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  pulsingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34D399',
  },
  latestIndicatorText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
    lineHeight: 20,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  date: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  note: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 19,
    marginBottom: 8,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  author: {
    fontSize: 11,
    color: '#6B7280',
  },
  authorBold: {
    fontWeight: '700',
    color: '#111827',
  },
});
