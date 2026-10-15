import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { ComplaintCategory, CategoryInfo } from '../../../shared/types/complaint.types';

export interface ExtendedCategoryInfo extends CategoryInfo {
  iconName: string;
  iconFamily: 'Ionicons' | 'MaterialCommunityIcons' | 'MaterialIcons';
  iconColor: string;
  bgColor: string;
}

export const CATEGORIES: ExtendedCategoryInfo[] = [
  {
    key: ComplaintCategory.POLICE_MISCONDUCT,
    label: 'Police Misconduct',
    icon: '🛡️',
    description: 'Excessive force, unlawful arrest, harassment',
    color: '#1C4D31',
    iconName: 'shield-outline',
    iconFamily: 'Ionicons',
    iconColor: '#1C4D31',
    bgColor: '#CFE4D4',
  },
  {
    key: ComplaintCategory.DISCRIMINATION,
    label: 'Discrimination',
    icon: '⚖️',
    description: 'Racial, religious, gender, or disability bias',
    color: '#4C768D',
    iconName: 'scale-balance',
    iconFamily: 'MaterialCommunityIcons',
    iconColor: '#4C768D',
    bgColor: '#D4E5EC',
  },
  {
    key: ComplaintCategory.ARBITRARY_DETENTION,
    label: 'Arbitrary Detention',
    icon: '🔒',
    description: 'Detention without charge, illegal custody',
    color: '#D97706',
    iconName: 'lock-closed',
    iconFamily: 'Ionicons',
    iconColor: '#D97706',
    bgColor: '#FDEFC7',
  },
  {
    key: ComplaintCategory.FREEDOM_OF_EXPRESSION,
    label: 'Freedom of Speech',
    icon: '📢',
    description: 'Censorship, journalist intimidation, protest bans',
    color: '#DC2626',
    iconName: 'megaphone',
    iconFamily: 'Ionicons',
    iconColor: '#DC2626',
    bgColor: '#E2E8F0',
  },
  {
    key: ComplaintCategory.LABOR_RIGHTS,
    label: 'Labor & Worker Rights',
    icon: '👷',
    description: 'Forced labor, wage theft, hazardous conditions',
    color: '#D97706',
    iconName: 'hard-hat',
    iconFamily: 'MaterialCommunityIcons',
    iconColor: '#D97706',
    bgColor: '#FEF3C7',
  },
  {
    key: ComplaintCategory.GENDER_BASED_VIOLENCE,
    label: 'Gender-Based Violence',
    icon: '🤝',
    description: 'Harassment, domestic violence, abuse of power',
    color: '#DB2777',
    iconName: 'hand-heart',
    iconFamily: 'MaterialCommunityIcons',
    iconColor: '#DB2777',
    bgColor: '#FCE7F3',
  },
  {
    key: ComplaintCategory.CHILD_RIGHTS,
    label: 'Child Rights & Welfare',
    icon: '🧒',
    description: 'Child exploitation, neglect, denial of schooling',
    color: '#7C3AED',
    iconName: 'child-care',
    iconFamily: 'MaterialIcons',
    iconColor: '#7C3AED',
    bgColor: '#EDE9FE',
  },
  {
    key: ComplaintCategory.OTHER,
    label: 'Other Rights Violation',
    icon: '📋',
    description: 'General fundamental rights violation',
    color: '#64748B',
    iconName: 'document-text-outline',
    iconFamily: 'Ionicons',
    iconColor: '#64748B',
    bgColor: '#F1F5F9',
  },
];

interface CategorySelectorProps {
  selectedCategory: ComplaintCategory;
  onSelectCategory: (category: ComplaintCategory) => void;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  selectedCategory,
  onSelectCategory,
}) => {
  const renderIcon = (cat: ExtendedCategoryInfo) => {
    switch (cat.iconFamily) {
      case 'MaterialCommunityIcons':
        return <MaterialCommunityIcons name={cat.iconName as any} size={25} color={cat.iconColor} />;
      case 'MaterialIcons':
        return <MaterialIcons name={cat.iconName as any} size={25} color={cat.iconColor} />;
      case 'Ionicons':
      default:
        return <Ionicons name={cat.iconName as any} size={25} color={cat.iconColor} />;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Select Violation Category <Text style={styles.required}>*</Text>
      </Text>
      <Text style={styles.subtitle}>
        Choose the category that best describes the incident
      </Text>

      <View style={styles.grid}>
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.key;
          return (
            <TouchableOpacity
              key={cat.key}
              style={[
                styles.card,
                isSelected && styles.cardSelected,
              ]}
              onPress={() => onSelectCategory(cat.key)}
              activeOpacity={0.75}
            >
              <View style={[styles.iconContainer, { backgroundColor: cat.bgColor }]}>
                {renderIcon(cat)}
              </View>

              <View style={styles.textContainer}>
                <Text style={styles.label}>
                  {cat.label}
                </Text>
                <Text style={styles.description} numberOfLines={2}>
                  {cat.description}
                </Text>
              </View>

              <View style={[styles.radioCircle, isSelected && styles.radioCircleActive]}>
                {isSelected && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  required: {
    color: '#DC2626',
  },
  subtitle: {
    fontSize: 13.5,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 18,
  },
  grid: {
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5ECE6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  cardSelected: {
    backgroundColor: '#EFF7F1',
    borderColor: '#1C4D31',
    borderWidth: 1.5,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  textContainer: {
    flex: 1,
    paddingRight: 8,
  },
  label: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 3,
  },
  description: {
    fontSize: 12.5,
    color: '#4B5563',
    lineHeight: 17,
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.8,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  radioCircleActive: {
    borderColor: '#1C4D31',
    borderWidth: 2,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#1C4D31',
  },
});
