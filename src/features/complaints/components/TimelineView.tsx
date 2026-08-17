import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TimelineEvent, ComplaintStatus } from '../../../shared/types/complaint.types';

interface TimelineViewProps {
  timeline: TimelineEvent[];
}

export const TimelineView: React.FC<TimelineViewProps> = ({ timeline }) => {
  if (!timeline || timeline.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No timeline history available yet.</Text>
      </View>
    );
  }

  const getStatusColor = (status: ComplaintStatus) => {
    switch (status) {
      case ComplaintStatus.SUBMITTED:
        return '#F59E0B'; // Amber
      case ComplaintStatus.UNDER_REVIEW:
        return '#6366F1'; // Indigo
      case ComplaintStatus.APPROVED:
        return '#10B981'; // Emerald
      case ComplaintStatus.CONVERTED_TO_CASE:
        return '#3B82F6'; // Blue
      case ComplaintStatus.REJECTED:
        return '#EF4444'; // Red
      default:
        return '#64748B';
    }
  };

  return (
    <View style={styles.container}>
      {timeline.map((event, index) => {
        const isLast = index === timeline.length - 1;
        const color = getStatusColor(event.status);
        const formattedDate = new Date(event.timestamp).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });

        return (
          <View key={index} style={styles.timelineItem}>
            {/* Timeline Line & Dot */}
            <View style={styles.leftColumn}>
              <View style={[styles.dot, { backgroundColor: color }]} />
              {!isLast && <View style={styles.line} />}
            </View>

            {/* Timeline Content */}
            <View style={[styles.contentCard, isLast && styles.latestCard]}>
              <View style={styles.headerRow}>
                <Text style={styles.title}>{event.title}</Text>
                <Text style={styles.date}>{formattedDate}</Text>
              </View>
              
              <Text style={styles.note}>{event.note}</Text>
              
              {event.updatedBy && (
                <Text style={styles.author}>
                  Logged by: <Text style={styles.authorBold}>{event.updatedBy}</Text>
                </Text>
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
    paddingVertical: 8,
  },
  emptyContainer: {
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  leftColumn: {
    width: 24,
    alignItems: 'center',
    marginRight: 12,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginTop: 4,
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: '#E2E8F0',
    marginTop: 4,
  },
  contentCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  latestCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#CBD5E1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
    flexWrap: 'wrap',
    gap: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  date: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  note: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
    marginBottom: 6,
  },
  author: {
    fontSize: 11,
    color: '#64748B',
  },
  authorBold: {
    fontWeight: '600',
    color: '#475569',
  },
});
