import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CaseStatus } from '../../../shared/types/case.types';

interface Props {
  status: CaseStatus;
  size?: 'small' | 'medium' | 'large';
}

export const CaseStatusBadge: React.FC<Props> = ({ status, size = 'medium' }) => {
  const getBadgeConfig = () => {
    switch (status) {
      case CaseStatus.ASSIGNED:
        return {
          label: 'Assigned',
          icon: 'person-add-outline' as const,
          bgColor: '#EFF6FF',
          textColor: '#1D4ED8',
          borderColor: '#BFDBFE',
        };
      case CaseStatus.UNDER_INVESTIGATION:
        return {
          label: 'Under Investigation',
          icon: 'search-outline' as const,
          bgColor: '#FEF3C7',
          textColor: '#B45309',
          borderColor: '#FDE68A',
        };
      case CaseStatus.EVIDENCE_COLLECTION:
        return {
          label: 'Evidence Collection',
          icon: 'folder-open-outline' as const,
          bgColor: '#F3E8FF',
          textColor: '#7E22CE',
          borderColor: '#E9D5FF',
        };
      case CaseStatus.REPORT_SUBMITTED:
        return {
          label: 'Report Submitted',
          icon: 'document-text-outline' as const,
          bgColor: '#E0E7FF',
          textColor: '#4338CA',
          borderColor: '#C7D2FE',
        };
      case CaseStatus.RESOLVED:
        return {
          label: 'Resolved',
          icon: 'checkmark-circle-outline' as const,
          bgColor: '#ECFDF5',
          textColor: '#047857',
          borderColor: '#A7F3D0',
        };
      case CaseStatus.CLOSED:
        return {
          label: 'Closed',
          icon: 'archive-outline' as const,
          bgColor: '#F3F4F6',
          textColor: '#4B5563',
          borderColor: '#E5E7EB',
        };
      default:
        return {
          label: status,
          icon: 'ellipse-outline' as const,
          bgColor: '#F3F4F6',
          textColor: '#374151',
          borderColor: '#E5E7EB',
        };
    }
  };

  const config = getBadgeConfig();
  const isSmall = size === 'small';
  const isLarge = size === 'large';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: config.bgColor,
          borderColor: config.borderColor,
          paddingVertical: isSmall ? 3 : isLarge ? 6 : 4,
          paddingHorizontal: isSmall ? 8 : isLarge ? 12 : 10,
        },
      ]}
    >
      <Ionicons
        name={config.icon}
        size={isSmall ? 11 : isLarge ? 15 : 13}
        color={config.textColor}
        style={{ marginRight: 4 }}
      />
      <Text
        style={[
          styles.text,
          {
            color: config.textColor,
            fontSize: isSmall ? 10 : isLarge ? 13 : 11,
          },
        ]}
      >
        {config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '700',
  },
});
