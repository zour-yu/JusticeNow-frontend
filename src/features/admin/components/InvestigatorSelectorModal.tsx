import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Investigator, AssignInvestigatorInput, CasePriority } from '../../../shared/types/case.types';
import { CaseService } from '../../../shared/services/case.service';

interface Props {
  visible: boolean;
  caseIdOrNumber: string;
  caseTitle: string;
  currentInvestigatorId?: string;
  onClose: () => void;
  onAssigned: (input: AssignInvestigatorInput) => Promise<void>;
}

export const InvestigatorSelectorModal: React.FC<Props> = ({
  visible,
  caseIdOrNumber,
  caseTitle,
  currentInvestigatorId,
  onClose,
  onAssigned,
}) => {
  const [investigators, setInvestigators] = useState<Investigator[]>([]);
  const [filteredInvestigators, setFilteredInvestigators] = useState<Investigator[]>([]);
  const [selectedInvestigator, setSelectedInvestigator] = useState<Investigator | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [note, setNote] = useState('');
  const [priorityOverride, setPriorityOverride] = useState<CasePriority | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadInvestigators = useCallback(async () => {
    try {
      setIsLoading(true);
      const list = await CaseService.getAvailableInvestigators();
      setInvestigators(list);
      setFilteredInvestigators(list);

      // Pre-select current if exists
      if (currentInvestigatorId) {
        const found = list.find((i) => i._id === currentInvestigatorId || i.firebaseUid === currentInvestigatorId);
        if (found) setSelectedInvestigator(found);
      }
    } catch (err) {
      console.log('Error loading investigators:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentInvestigatorId]);

  useEffect(() => {
    if (visible) {
      loadInvestigators();
    }
  }, [visible, loadInvestigators]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      setFilteredInvestigators(
        investigators.filter(
          (inv) =>
            inv.name.toLowerCase().includes(q) ||
            inv.email.toLowerCase().includes(q) ||
            (inv.specialization && inv.specialization.toLowerCase().includes(q))
        )
      );
    } else {
      setFilteredInvestigators(investigators);
    }
  }, [searchQuery, investigators]);

  const handleConfirm = async () => {
    if (!selectedInvestigator) {
      Alert.alert('No Selection', 'Please select an investigator from the list.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onAssigned({
        investigatorId: selectedInvestigator.firebaseUid || selectedInvestigator._id,
        investigatorName: selectedInvestigator.name,
        investigatorEmail: selectedInvestigator.email,
        note: note.trim() || undefined,
        priority: priorityOverride,
      });

      setNote('');
      onClose();
      Alert.alert('Case Assigned', `Successfully assigned to ${selectedInvestigator.name}.`);
    } catch (err: any) {
      Alert.alert('Assignment Failed', err.message || 'Could not assign investigator.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getWorkloadBadge = (activeCases: number) => {
    if (activeCases === 0) {
      return {
        label: 'Available (0 Cases)',
        bg: '#ECFDF5',
        text: '#047857',
        border: '#A7F3D0',
      };
    } else if (activeCases <= 2) {
      return {
        label: `${activeCases} Active Cases`,
        bg: '#EFF6FF',
        text: '#1D4ED8',
        border: '#BFDBFE',
      };
    } else {
      return {
        label: `${activeCases} Cases (High Load)`,
        bg: '#FEF3C7',
        text: '#B45309',
        border: '#FDE68A',
      };
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleCol}>
              <Text style={styles.headerTitle}>Assign Investigator</Text>
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {caseIdOrNumber}: {caseTitle}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={24} color="#4B5563" />
            </TouchableOpacity>
          </View>

          {/* Search Input */}
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={16} color="#6B7280" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search investigator by name, email, specialization..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={16} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>

          {/* Investigators List */}
          {isLoading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="small" color="#0D4722" />
              <Text style={styles.loadingText}>Fetching available investigators...</Text>
            </View>
          ) : (
            <FlatList
              data={filteredInvestigators}
              keyExtractor={(item) => item._id || item.email}
              style={styles.investigatorsList}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isSelected =
                  selectedInvestigator?._id === item._id ||
                  selectedInvestigator?.email === item.email;
                const workload = getWorkloadBadge(item.activeCasesCount);

                return (
                  <TouchableOpacity
                    style={[
                      styles.investigatorCard,
                      isSelected && styles.investigatorCardSelected,
                    ]}
                    onPress={() => setSelectedInvestigator(item)}
                    activeOpacity={0.8}
                  >
                    {/* Avatar Initials */}
                    <View
                      style={[
                        styles.avatarCircle,
                        isSelected && { backgroundColor: '#0D4722' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.avatarInitials,
                          isSelected && { color: '#FFFFFF' },
                        ]}
                      >
                        {item.firstName?.[0] || 'I'}
                        {item.lastName?.[0] || 'N'}
                      </Text>
                    </View>

                    {/* Details */}
                    <View style={styles.investigatorInfo}>
                      <View style={styles.nameRow}>
                        <Text
                          style={[
                            styles.investigatorName,
                            isSelected && { color: '#0D4722' },
                          ]}
                        >
                          {item.name}
                        </Text>
                        <View
                          style={[
                            styles.workloadBadge,
                            {
                              backgroundColor: workload.bg,
                              borderColor: workload.border,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.workloadBadgeText,
                              { color: workload.text },
                            ]}
                          >
                            {workload.label}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.investigatorEmail}>{item.email}</Text>
                      {item.specialization ? (
                        <Text style={styles.specializationText} numberOfLines={1}>
                          ⭐ {item.specialization}
                        </Text>
                      ) : null}
                    </View>

                    {/* Radio Button */}
                    <View
                      style={[
                        styles.radioCircle,
                        isSelected && styles.radioCircleSelected,
                      ]}
                    >
                      {isSelected && <View style={styles.radioInner} />}
                    </View>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={styles.emptyBox}>
                  <Ionicons name="people-outline" size={32} color="#9CA3AF" />
                  <Text style={styles.emptyText}>No matching investigators found.</Text>
                </View>
              }
            />
          )}

          {/* Optional Assignment Note */}
          <View style={styles.noteSection}>
            <Text style={styles.noteLabel}>Assignment Instructions / Notes (Optional)</Text>
            <TextInput
              style={styles.noteInput}
              placeholder="e.g. Please interview eyewitnesses first, high sensitivity case..."
              placeholderTextColor="#9CA3AF"
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={2}
            />
          </View>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.confirmBtn,
                (!selectedInvestigator || isSubmitting) && styles.confirmBtnDisabled,
              ]}
              onPress={handleConfirm}
              disabled={!selectedInvestigator || isSubmitting}
            >
              <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
              <Text style={styles.confirmBtnText}>
                {isSubmitting ? 'Linking Investigator...' : 'Confirm Assignment'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxHeight: '90%',
    padding: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitleCol: {
    flex: 1,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0D4722',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#111827',
  },
  centerBox: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
  },
  investigatorsList: {
    maxHeight: 250,
    marginBottom: 12,
  },
  investigatorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 8,
  },
  investigatorCardSelected: {
    backgroundColor: '#E8F5E9',
    borderColor: '#0D4722',
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarInitials: {
    fontSize: 13,
    fontWeight: '800',
    color: '#374151',
  },
  investigatorInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
    flexWrap: 'wrap',
    gap: 4,
  },
  investigatorName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  workloadBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  workloadBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  investigatorEmail: {
    fontSize: 12,
    color: '#6B7280',
  },
  specializationText: {
    fontSize: 11,
    color: '#0D4722',
    fontWeight: '600',
    marginTop: 2,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#9CA3AF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  radioCircleSelected: {
    borderColor: '#0D4722',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0D4722',
  },
  emptyBox: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 6,
  },
  noteSection: {
    marginBottom: 14,
  },
  noteLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 6,
  },
  noteInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    color: '#111827',
    height: 60,
    textAlignVertical: 'top',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4B5563',
  },
  confirmBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0D4722',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  confirmBtnDisabled: {
    opacity: 0.5,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
