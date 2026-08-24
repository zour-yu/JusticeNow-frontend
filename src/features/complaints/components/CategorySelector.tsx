import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { ComplaintCategory, CategoryInfo } from '../../../shared/types/complaint.types';

export const CATEGORIES: CategoryInfo[] = [
  {
    key: ComplaintCategory.POLICE_MISCONDUCT,
    label: 'Police Misconduct',
    icon: '🛡️',
    description: 'Excessive force, unlawful arrest, harassment',
    color: '#EF4444',
  },
  {
    key: ComplaintCategory.DISCRIMINATION,
    label: 'Discrimination',
    icon: '⚖️',
    description: 'Racial, religious, gender, or disability bias',
    color: '#F59E0B',
  },
  {
    key: ComplaintCategory.ARBITRARY_DETENTION,
    label: 'Arbitrary Detention',
    icon: '🔒',
    description: 'Detention without charge, illegal custody',
    color: '#6366F1',
  },
  {
    key: ComplaintCategory.FREEDOM_OF_EXPRESSION,
    label: 'Freedom of Speech',
    icon: '📢',
    description: 'Censorship, journalist intimidation, protest bans',
    color: '#3B82F6',
  },
  {
    key: ComplaintCategory.LABOR_RIGHTS,
    label: 'Labor & Worker Rights',
    icon: '👷',
    description: 'Forced labor, wage theft, hazardous conditions',
    color: '#10B981',
  },
  {
    key: ComplaintCategory.GENDER_BASED_VIOLENCE,
    label: 'Gender-Based Violence',
    icon: '🤝',
    description: 'Harassment, domestic violence, abuse of power',
    color: '#EC4899',
  },
  {
    key: ComplaintCategory.CHILD_RIGHTS,
    label: 'Child Rights & Welfare',
    icon: '🧒',
    description: 'Child exploitation, neglect, denial of schooling',
    color: '#8B5CF6',
  },
  {
    key: ComplaintCategory.OTHER,
    label: 'Other Rights Violation',
    icon: '📋',
    description: 'General fundamental rights violation',
    color: '#64748B',
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
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Violation Category <Text style={styles.required}>*</Text></Text>
      <Text style={styles.subtitle}>Choose the category that best describes the incident</Text>
      
      <View style={styles.grid}>
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.key;
          return (
            <TouchableOpacity
              key={cat.key}
              style={[
                styles.card,
                isSelected && styles.cardSelected,
                isSelected && { borderColor: '#0D4722', backgroundColor: '#F0FBF4' },
              ]}
              onPress={() => onSelectCategory(cat.key)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, isSelected && { backgroundColor: '#E8F5E9' }]}>
                <Text style={styles.icon}>{cat.icon}</Text>
              </View>
              <View style={styles.textContainer}>
                <Text style={[styles.label, isSelected && styles.labelSelected]}>
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
    marginVertical: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  required: {
    color: '#EF4444',
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 14,
  },
  grid: {
    gap: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardSelected: {
    borderWidth: 1.5,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FAFAFA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 22,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  labelSelected: {
    color: '#0D4722',
    fontWeight: '800',
  },
  description: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  radioCircleActive: {
    borderColor: '#0D4722',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0D4722',
  },
});
