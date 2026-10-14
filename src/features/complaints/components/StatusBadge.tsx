import React from 'react';
import { View, Text } from 'react-native';
import { ComplaintStatus } from '../../../shared/types/complaint.types';

interface StatusBadgeProps {
  status: ComplaintStatus | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const getStatusConfig = () => {
    switch (status) {
      case ComplaintStatus.SUBMITTED:
        return {
          label: 'Submitted',
          bgColor: '#F3F4F6',
          textColor: '#4B5563',
          borderColor: '#E5E7EB',
        };
      case ComplaintStatus.UNDER_REVIEW:
        return {
          label: 'Under Review',
          bgColor: '#FEF3C7',
          textColor: '#92400E',
          borderColor: '#FDE68A',
        };
      case ComplaintStatus.APPROVED:
        return {
          label: 'Approved',
          bgColor: '#DCFCE7',
          textColor: '#15803D',
          borderColor: '#BBF7D0',
        };
      case ComplaintStatus.CONVERTED_TO_CASE:
      case 'UNDER_INVESTIGATION':
        return {
          label: 'Under Investigation',
          bgColor: '#D1FAE5',
          textColor: '#065F46',
          borderColor: '#A7F3D0',
        };
      case 'PENDING':
        return {
          label: 'Pending Start',
          bgColor: '#FEF3C7',
          textColor: '#92400E',
          borderColor: '#FDE68A',
        };
      case 'RESOLVED':
        return {
          label: 'Resolved',
          bgColor: '#ECFDF5',
          textColor: '#047857',
          borderColor: '#6EE7B7',
        };
      case 'CLOSED':
        return {
          label: 'Closed',
          bgColor: '#F3F4F6',
          textColor: '#4B5563',
          borderColor: '#D1D5DB',
        };
      case 'NEW':
        return {
          label: 'New Case',
          bgColor: '#EFF6FF',
          textColor: '#1D4ED8',
          borderColor: '#BFDBFE',
        };
      case ComplaintStatus.REJECTED:
        return {
          label: 'Rejected',
          bgColor: '#FEE2E2',
          textColor: '#991B1B',
          borderColor: '#FECACA',
        };
      default:
        return {
          label: status,
          bgColor: '#F3F4F6',
          textColor: '#374151',
          borderColor: '#E5E7EB',
        };
    }
  };

  const config = getStatusConfig();
  const isSmall = size === 'sm';

  return (
    <View
      style={{
        backgroundColor: config.bgColor,
        borderColor: config.borderColor,
        borderWidth: 1,
        paddingHorizontal: isSmall ? 8 : 12,
        paddingVertical: isSmall ? 3 : 5,
        borderRadius: 8,
        alignSelf: 'flex-start',
      }}
    >
      <Text
        style={{
          color: config.textColor,
          fontSize: isSmall ? 10 : 11,
          fontWeight: '700',
          letterSpacing: 0.3,
        }}
      >
        {config.label}
      </Text>
    </View>
  );
};

