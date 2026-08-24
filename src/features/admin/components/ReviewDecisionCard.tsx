import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ReviewDecisionCardProps {
  onApprove: (note: string) => Promise<void>;
  onReject: (note: string) => Promise<void>;
  isLoading?: boolean;
}

export const ReviewDecisionCard: React.FC<ReviewDecisionCardProps> = ({
  onApprove,
  onReject,
  isLoading = false,
}) => {
  const [reviewNote, setReviewNote] = useState('');
  const [selectedDecision, setSelectedDecision] = useState<'APPROVED' | 'REJECTED' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedDecision) {
      Alert.alert('Error', 'Please select a decision (Approve or Reject)');
      return;
    }

    setIsSubmitting(true);
    try {
      if (selectedDecision === 'APPROVED') {
        await onApprove(reviewNote);
      } else {
        await onReject(reviewNote);
      }
      setReviewNote('');
      setSelectedDecision(null);
    } catch (err) {
      Alert.alert('Error', 'Failed to submit review. Please try again.');
      console.log('Review submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isProcessing = isLoading || isSubmitting;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="shield-checkmark-outline" size={24} color="#3B82F6" />
        <Text style={styles.headerTitle}>Admin Review</Text>
      </View>

      <Text style={styles.subtitle}>Make a decision on this complaint</Text>

      {/* Decision Buttons */}
      <View style={styles.decisionRow}>
        <TouchableOpacity
          style={[
            styles.decisionButton,
            styles.approveButton,
            selectedDecision === 'APPROVED' && styles.decisionButtonSelected,
          ]}
          onPress={() => setSelectedDecision('APPROVED')}
          disabled={isProcessing}
        >
          <Ionicons
            name="checkmark-circle-outline"
            size={20}
            color={selectedDecision === 'APPROVED' ? '#FFFFFF' : '#10B981'}
          />
          <Text
            style={[
              styles.decisionButtonText,
              selectedDecision === 'APPROVED' && styles.decisionButtonTextSelected,
            ]}
          >
            Approve
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.decisionButton,
            styles.rejectButton,
            selectedDecision === 'REJECTED' && styles.decisionButtonSelected,
          ]}
          onPress={() => setSelectedDecision('REJECTED')}
          disabled={isProcessing}
        >
          <Ionicons
            name="close-circle-outline"
            size={20}
            color={selectedDecision === 'REJECTED' ? '#FFFFFF' : '#EF4444'}
          />
          <Text
            style={[
              styles.decisionButtonText,
              selectedDecision === 'REJECTED' && styles.decisionButtonTextSelected,
            ]}
          >
            Reject
          </Text>
        </TouchableOpacity>
      </View>

      {/* Notes Section */}
      <View style={styles.notesSection}>
        <View style={styles.notesHeader}>
          <Text style={styles.notesLabel}>Review Notes (Optional)</Text>
          <Text style={styles.noteCount}>
            {reviewNote.length}/500
          </Text>
        </View>

        <TextInput
          style={styles.notesInput}
          placeholder="Add any additional notes or findings from your review..."
          placeholderTextColor="#CBD5E1"
          value={reviewNote}
          onChangeText={setReviewNote}
          maxLength={500}
          multiline
          editable={!isProcessing}
          textAlignVertical="top"
        />

        {selectedDecision && (
          <View
            style={[
              styles.decisionPreview,
              selectedDecision === 'APPROVED'
                ? styles.approvePreview
                : styles.rejectPreview,
            ]}
          >
            <Ionicons
              name={selectedDecision === 'APPROVED' ? 'checkmark-circle' : 'close-circle'}
              size={18}
              color={selectedDecision === 'APPROVED' ? '#10B981' : '#EF4444'}
            />
            <Text style={styles.decisionPreviewText}>
              This complaint will be marked as{' '}
              <Text style={{ fontWeight: '700' }}>
                {selectedDecision}
              </Text>
            </Text>
          </View>
        )}
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[
          styles.submitButton,
          (!selectedDecision || isProcessing) && styles.submitButtonDisabled,
        ]}
        onPress={handleSubmit}
        disabled={!selectedDecision || isProcessing}
      >
        {isProcessing ? (
          <>
            <ActivityIndicator size="small" color="#FFFFFF" />
            <Text style={styles.submitButtonText}>Submitting...</Text>
          </>
        ) : (
          <>
            <Ionicons name="send-outline" size={18} color="#FFFFFF" />
            <Text style={styles.submitButtonText}>Submit Review</Text>
          </>
        )}
      </TouchableOpacity>

      <Text style={styles.disclaimer}>
        This decision cannot be undone immediately. Ensure all details are carefully reviewed.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
  },
  decisionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  decisionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 2,
  },
  approveButton: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  rejectButton: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  decisionButtonSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  decisionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  decisionButtonTextSelected: {
    color: '#FFFFFF',
  },
  notesSection: {
    marginBottom: 16,
  },
  notesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  noteCount: {
    fontSize: 12,
    color: '#94A3B8',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    minHeight: 100,
    fontSize: 13,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
    fontFamily: 'System',
  },
  decisionPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 12,
  },
  approvePreview: {
    backgroundColor: '#ECFDF5',
    borderLeftWidth: 3,
    borderLeftColor: '#10B981',
  },
  rejectPreview: {
    backgroundColor: '#FEF2F2',
    borderLeftWidth: 3,
    borderLeftColor: '#EF4444',
  },
  decisionPreviewText: {
    fontSize: 12,
    color: '#334155',
    flex: 1,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    marginBottom: 10,
  },
  submitButtonDisabled: {
    backgroundColor: '#CBD5E1',
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  disclaimer: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
