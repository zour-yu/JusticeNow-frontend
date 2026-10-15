import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ComplaintStatus } from '../../../shared/types/complaint.types';

interface StatusBadgeProps {
  status: ComplaintStatus | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  const getStatusConfig = () => {
    switch (status) {
      case ComplaintStatus.SUBMITTED:
        return {
          label: 'Submitted',
          bgColor: '#D1E5D7',
          textColor: '#1B442B',
        };
      case ComplaintStatus.UNDER_REVIEW:
        return {
          label: 'Under Review',
          bgColor: '#FDEFC7',
          textColor: '#92400E',
        };
      case ComplaintStatus.APPROVED:
      case ComplaintStatus.CONVERTED_TO_CASE:
      case 'UNDER_INVESTIGATION':
      case 'PENDING':
        return {
          label: 'Under\nInvestigation',
          bgColor: '#C8E0D0',
          textColor: '#1B442B',
        };
      case 'CLOSED':
      case 'Closed':
        return {
          label: 'Closed',
          bgColor: '#D5DDE4',
          textColor: '#475569',
        };
      case 'RESOLVED':
      case 'DISCUSSED':
        return {
          label: 'Resolved',
          bgColor: '#D1E5D7',
          textColor: '#1B442B',
        };
      case 'NEW':
        return {
          label: 'New Case',
          bgColor: '#D5EBDC',
          textColor: '#163820',
        };
      case ComplaintStatus.REJECTED:
        return {
          label: 'Rejected',
          bgColor: '#FCE8E6',
          textColor: '#991B1B',
        };
      default:
        return {
          label: typeof status === 'string' ? status.replace(/_/g, ' ') : status,
          bgColor: '#D1E5D7',
          textColor: '#1B442B',
        };
    }
  };

  const config = getStatusConfig();
  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: config.bgColor },
        isSmall ? styles.badgeSm : styles.badgeMd,
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: config.textColor },
          isSmall ? styles.textSm : styles.textMd,
        ]}
      >
        {config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  badgeSm: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeMd: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  textSm: {
    fontSize: 11,
    lineHeight: 14,
  },
  textMd: {
    fontSize: 12.5,
    lineHeight: 16,
  },
});
