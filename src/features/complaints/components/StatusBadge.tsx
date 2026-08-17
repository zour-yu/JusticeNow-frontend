import React from 'react';
import { View, Text } from 'react-native';
import { ComplaintStatus } from '../../../shared/types/complaint.types';

interface StatusBadgeProps {
  status: ComplaintStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const getStatusConfig = () => {
    switch (status) {
      case ComplaintStatus.SUBMITTED:
        return {
          label: 'Submitted',
          bgColor: '#FEF3C7',
          textColor: '#92400E',
          borderColor: '#FDE68A',
        };
      case ComplaintStatus.UNDER_REVIEW:
        return {
          label: 'Under Review',
          bgColor: '#E0E7FF',
          textColor: '#3730A3',
          borderColor: '#C7D2FE',
        };
      case ComplaintStatus.APPROVED:
        return {
          label: 'Approved',
          bgColor: '#D1FAE5',
          textColor: '#065F46',
          borderColor: '#A7F3D0',
        };
      case ComplaintStatus.CONVERTED_TO_CASE:
        return {
          label: 'In Investigation',
          bgColor: '#DBEAFE',
          textColor: '#1E40AF',
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
        borderRadius: 20,
        alignSelf: 'flex-start',
      }}
    >
      <Text
        style={{
          color: config.textColor,
          fontSize: isSmall ? 11 : 12,
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}
      >
        {config.label}
      </Text>
    </View>
  );
};
