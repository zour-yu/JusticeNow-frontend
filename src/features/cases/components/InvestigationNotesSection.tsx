import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { InvestigationNote } from '../../../shared/types/case.types';

interface Props {
  notes: InvestigationNote[];
  isAuthorized: boolean;
  onAddNote: (note: string) => Promise<void>;
}

export const InvestigationNotesSection: React.FC<Props> = ({
  notes,
  isAuthorized,
  onAddNote,
}) => {
  const [newNote, setNewNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = async () => {
    if (!newNote.trim()) {
      Alert.alert('Empty Note', 'Please enter your note text.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onAddNote(newNote.trim());
      setNewNote('');
      setIsExpanded(false);
      Alert.alert('Success', 'Investigation note logged successfully.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add note.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Ionicons name="chatbubbles" size={20} color="#0D4722" />
          <Text style={styles.title}>Investigation Notes ({notes?.length || 0})</Text>
        </View>
        {isAuthorized ? (
          <TouchableOpacity
            style={styles.toggleBtn}
            onPress={() => setIsExpanded(!isExpanded)}
          >
            <Ionicons
              name={isExpanded ? 'close-circle-outline' : 'create-outline'}
              size={16}
              color="#0D4722"
            />
            <Text style={styles.toggleBtnText}>
              {isExpanded ? 'Cancel' : 'Add Note'}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.readOnlyBadge}>
            <Ionicons name="lock-closed" size={12} color="#6B7280" />
            <Text style={styles.readOnlyBadgeText}>Read-Only</Text>
          </View>
        )}
      </View>

      {/* Note Composer */}
      {isAuthorized && isExpanded && (
        <View style={styles.composerCard}>
          <Text style={styles.composerLabel}>New Investigation Note</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Record witness statements, evidence findings, case progress..."
            placeholderTextColor="#9CA3AF"
            value={newNote}
            onChangeText={setNewNote}
            multiline
            numberOfLines={4}
          />
          <TouchableOpacity
            style={[styles.saveBtn, isSubmitting && styles.saveBtnDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Text style={styles.saveBtnText}>
              {isSubmitting ? 'Logging Note...' : 'Log Investigation Note'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Notes List */}
      {!notes || notes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={32} color="#9CA3AF" />
          <Text style={styles.emptyText}>No investigation notes recorded yet.</Text>
        </View>
      ) : (
        <View style={styles.notesList}>
          {notes.map((item, index) => {
            const dateStr = item.createdAt
              ? new Date(item.createdAt).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '';

            return (
              <View key={item.id || index} style={styles.noteItem}>
                <View style={styles.noteHeader}>
                  <View style={styles.authorBadge}>
                    <Ionicons name="person-circle-outline" size={16} color="#0D4722" />
                    <Text style={styles.authorName}>{item.authorName || 'Investigator'}</Text>
                  </View>
                  <Text style={styles.noteDate}>{dateStr}</Text>
                </View>
                <Text style={styles.noteBody}>{item.note}</Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  toggleBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0D4722',
  },
  readOnlyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  readOnlyBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  composerCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 14,
  },
  composerLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    color: '#111827',
    height: 80,
    textAlignVertical: 'top',
    marginBottom: 10,
  },
  saveBtn: {
    backgroundColor: '#0D4722',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 6,
  },
  notesList: {
    gap: 10,
  },
  noteItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  authorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  authorName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0D4722',
  },
  noteDate: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  noteBody: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 19,
  },
});
