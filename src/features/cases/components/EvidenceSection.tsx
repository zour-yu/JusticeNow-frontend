import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Image,
  Alert,
  Linking,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CaseEvidence, AddEvidenceInput } from '../../../shared/types/case.types';

interface Props {
  evidence: CaseEvidence[];
  isAuthorized: boolean;
  onAddEvidence: (input: AddEvidenceInput) => Promise<void>;
}

export const EvidenceSection: React.FC<Props> = ({
  evidence,
  isAuthorized,
  onAddEvidence,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CaseEvidence | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState<'image' | 'document' | 'audio' | 'video'>('image');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getTypeIcon = (evType: string) => {
    switch (evType) {
      case 'image':
        return { name: 'image-outline' as const, color: '#0284C7', bg: '#E0F2FE' };
      case 'video':
        return { name: 'videocam-outline' as const, color: '#7C3AED', bg: '#EDE9FE' };
      case 'audio':
        return { name: 'mic-outline' as const, color: '#D97706', bg: '#FEF3C7' };
      case 'document':
      default:
        return { name: 'document-text-outline' as const, color: '#059669', bg: '#D1FAE5' };
    }
  };

  const handleOpenUrl = async (fileUrl: string) => {
    if (!fileUrl) return;
    try {
      const supported = await Linking.canOpenURL(fileUrl);
      if (supported) {
        await Linking.openURL(fileUrl);
      } else {
        Alert.alert('Evidence Preview', `Viewing evidence link: ${fileUrl}`);
      }
    } catch {
      Alert.alert('Evidence URL', fileUrl);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Missing Name', 'Please enter a title or filename for this evidence.');
      return;
    }
    if (!url.trim()) {
      Alert.alert('Missing URL', 'Please enter a URL or file link for this evidence.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onAddEvidence({
        name: name.trim(),
        type,
        url: url.trim(),
        description: description.trim(),
      });
      setName('');
      setUrl('');
      setDescription('');
      setModalVisible(false);
      Alert.alert('Success', 'Evidence has been attached to the case.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to attach evidence.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Ionicons name="folder-open" size={20} color="#0D4722" />
          <Text style={styles.title}>Available Evidence ({evidence?.length || 0})</Text>
        </View>
        {isAuthorized ? (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setModalVisible(true)}
          >
            <Ionicons name="add-circle" size={16} color="#0D4722" />
            <Text style={styles.addBtnText}>Add Evidence</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.readOnlyBadge}>
            <Ionicons name="lock-closed" size={12} color="#6B7280" />
            <Text style={styles.readOnlyBadgeText}>Read-Only</Text>
          </View>
        )}
      </View>

      {/* Evidence List */}
      {!evidence || evidence.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-attach-outline" size={36} color="#9CA3AF" />
          <Text style={styles.emptyText}>No evidence files attached yet.</Text>
          {isAuthorized && (
            <Text style={styles.emptySubtext}>
              Tap "Add Evidence" above to upload or link case files.
            </Text>
          )}
        </View>
      ) : (
        <View style={styles.list}>
          {evidence.map((item) => {
            const iconConfig = getTypeIcon(item.type);
            const dateStr = item.uploadedAt
              ? new Date(item.uploadedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : '';

            return (
              <TouchableOpacity
                key={item.id}
                style={styles.evidenceCard}
                onPress={() => setSelectedItem(item)}
                activeOpacity={0.8}
              >
                <View style={[styles.iconWrapper, { backgroundColor: iconConfig.bg }]}>
                  <Ionicons name={iconConfig.name} size={22} color={iconConfig.color} />
                </View>
                <View style={styles.detailsCol}>
                  <Text style={styles.evidenceName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <View style={styles.metaRow}>
                    <Text style={styles.evidenceType}>{item.type.toUpperCase()}</Text>
                    {dateStr ? (
                      <>
                        <Text style={styles.dot}>•</Text>
                        <Text style={styles.evidenceMeta}>{dateStr}</Text>
                      </>
                    ) : null}
                    {item.uploadedBy ? (
                      <>
                        <Text style={styles.dot}>•</Text>
                        <Text style={styles.evidenceMeta}>By {item.uploadedBy}</Text>
                      </>
                    ) : null}
                  </View>
                  {item.description ? (
                    <Text style={styles.evidenceDesc} numberOfLines={2}>
                      {item.description}
                    </Text>
                  ) : null}
                </View>
                <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Item Detail / Preview Modal */}
      {selectedItem && (
        <Modal
          visible={!!selectedItem}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedItem(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle} numberOfLines={1}>
                  {selectedItem.name}
                </Text>
                <TouchableOpacity onPress={() => setSelectedItem(null)}>
                  <Ionicons name="close" size={24} color="#374151" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                {selectedItem.type === 'image' && selectedItem.url ? (
                  <Image
                    source={{ uri: selectedItem.url }}
                    style={styles.previewImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.docPreviewPlaceholder}>
                    <Ionicons
                      name={getTypeIcon(selectedItem.type).name}
                      size={48}
                      color="#0D4722"
                    />
                    <Text style={styles.docPreviewType}>
                      {selectedItem.type.toUpperCase()} FILE
                    </Text>
                  </View>
                )}

                <View style={styles.modalField}>
                  <Text style={styles.modalFieldLabel}>Type:</Text>
                  <Text style={styles.modalFieldValue}>{selectedItem.type.toUpperCase()}</Text>
                </View>

                {selectedItem.uploadedBy && (
                  <View style={styles.modalField}>
                    <Text style={styles.modalFieldLabel}>Uploaded By:</Text>
                    <Text style={styles.modalFieldValue}>{selectedItem.uploadedBy}</Text>
                  </View>
                )}

                {selectedItem.uploadedAt && (
                  <View style={styles.modalField}>
                    <Text style={styles.modalFieldLabel}>Uploaded Date:</Text>
                    <Text style={styles.modalFieldValue}>
                      {new Date(selectedItem.uploadedAt).toLocaleString()}
                    </Text>
                  </View>
                )}

                {selectedItem.description && (
                  <View style={styles.modalField}>
                    <Text style={styles.modalFieldLabel}>Description / Notes:</Text>
                    <Text style={styles.modalFieldValue}>{selectedItem.description}</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.openUrlBtn}
                  onPress={() => handleOpenUrl(selectedItem.url)}
                >
                  <Ionicons name="open-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.openUrlBtnText}>Open File / Link</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* Add Evidence Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Attach Case Evidence</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Evidence Name / Title *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. CCTV_Footage_FrontGate.mp4"
                placeholderTextColor="#9CA3AF"
                value={name}
                onChangeText={setName}
              />

              <Text style={styles.inputLabel}>Evidence Type *</Text>
              <View style={styles.typeSelectorRow}>
                {(['image', 'document', 'audio', 'video'] as const).map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[
                      styles.typeOption,
                      type === t && styles.typeOptionActive,
                    ]}
                    onPress={() => setType(t)}
                  >
                    <Text
                      style={[
                        styles.typeOptionText,
                        type === t && styles.typeOptionTextActive,
                      ]}
                    >
                      {t.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>URL / Storage Link *</Text>
              <TextInput
                style={styles.input}
                placeholder="https://cloud-storage.justicenow.org/files/..."
                placeholderTextColor="#9CA3AF"
                value={url}
                onChangeText={setUrl}
                autoCapitalize="none"
              />

              <Text style={styles.inputLabel}>Investigator Note / Details</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Context regarding this evidence piece, who retrieved it, authenticity..."
                placeholderTextColor="#9CA3AF"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
              />

              <TouchableOpacity
                style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                <Text style={styles.submitBtnText}>
                  {isSubmitting ? 'Attaching...' : 'Save & Attach Evidence'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  addBtnText: {
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
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
    marginTop: 8,
  },
  emptySubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
  },
  list: {
    gap: 10,
  },
  evidenceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailsCol: {
    flex: 1,
  },
  evidenceName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  evidenceType: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0D4722',
  },
  dot: {
    color: '#9CA3AF',
    fontSize: 10,
  },
  evidenceMeta: {
    fontSize: 11,
    color: '#6B7280',
  },
  evidenceDesc: {
    fontSize: 11,
    color: '#4B5563',
    marginTop: 4,
  },
  /* Modals */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxHeight: '85%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
    flex: 1,
    marginRight: 10,
  },
  modalBody: {
    paddingBottom: 10,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  docPreviewPlaceholder: {
    width: '100%',
    height: 140,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  docPreviewType: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    marginTop: 8,
  },
  modalField: {
    marginBottom: 10,
  },
  modalFieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
    marginBottom: 2,
  },
  modalFieldValue: {
    fontSize: 14,
    color: '#111827',
  },
  openUrlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0D4722',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 16,
  },
  openUrlBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginTop: 10,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  typeOption: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  typeOptionActive: {
    backgroundColor: '#0D4722',
  },
  typeOptionText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#4B5563',
  },
  typeOptionTextActive: {
    color: '#FFFFFF',
  },
  submitBtn: {
    backgroundColor: '#0D4722',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
