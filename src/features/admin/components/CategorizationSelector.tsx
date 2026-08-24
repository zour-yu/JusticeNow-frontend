import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ComplaintCategory } from '../../../shared/types/complaint.types';
import { CATEGORIES } from '../../complaints/components/CategorySelector';

interface CategorySelectorProps {
  selectedCategory?: ComplaintCategory;
  onSelectCategory: (category: ComplaintCategory) => void;
  disabled?: boolean;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  selectedCategory,
  onSelectCategory,
  disabled = false,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Category</Text>
      <Text style={styles.subtitle}>
        Choose the most appropriate category for this complaint
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.key;
          return (
            <TouchableOpacity
              key={cat.key}
              style={[
                styles.categoryButton,
                isSelected && styles.categoryButtonSelected,
              ]}
              onPress={() => onSelectCategory(cat.key)}
              disabled={disabled}
              activeOpacity={0.7}
            >
              <Text style={styles.categoryEmoji}>{cat.icon}</Text>
              <Text
                style={[
                  styles.categoryName,
                  isSelected && styles.categoryNameSelected,
                ]}
                numberOfLines={2}
              >
                {cat.label}
              </Text>
              {isSelected && (
                <View style={styles.selectedCheckmark}>
                  <Ionicons
                    name="checkmark-circle-sharp"
                    size={16}
                    color="#FFFFFF"
                  />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {selectedCategory && (
        <View style={styles.selectedInfo}>
          <Ionicons name="information-circle-outline" size={16} color="#3B82F6" />
          <Text style={styles.selectedInfoText}>
            {
              CATEGORIES.find((c) => c.key === selectedCategory)
                ?.description
            }
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 12,
  },
  scrollContent: {
    paddingHorizontal: 0,
    gap: 10,
  },
  categoryButton: {
    width: 100,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 110,
    position: 'relative',
  },
  categoryButtonSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  categoryEmoji: {
    fontSize: 32,
    marginBottom: 6,
  },
  categoryName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center',
    lineHeight: 14,
  },
  categoryNameSelected: {
    color: '#FFFFFF',
  },
  selectedCheckmark: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  selectedInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    marginTop: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  selectedInfoText: {
    fontSize: 12,
    color: '#1E40AF',
    flex: 1,
    lineHeight: 16,
  },
});
