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
        return '#6B7280'; // Grey
      case ComplaintStatus.UNDER_REVIEW:
        return '#F59E0B'; // Amber
      case ComplaintStatus.APPROVED:
        return '#10B981'; // Emerald
      case ComplaintStatus.CONVERTED_TO_CASE:
        return '#0D4722'; // Forest Green
      case ComplaintStatus.REJECTED:
        return '#EF4444'; // Red
      default:
        return '#6B7280';
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
    color: '#6B7280',
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
    backgroundColor: '#E5E7EB',
    marginTop: 4,
  },
  contentCard: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  latestCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D1FAE5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
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
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  date: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  note: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
    marginBottom: 6,
  },
  author: {
    fontSize: 11,
    color: '#6B7280',
  },
  authorBold: {
    fontWeight: '600',
    color: '#111827',
  },
});
