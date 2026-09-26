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
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { CaseEvidence, AddEvidenceInput } from '../../../shared/types/case.types';
import { UploadService } from '../../../shared/services/upload.service';

interface Props {
  caseId?: string;
  evidence: CaseEvidence[];
  isAuthorized: boolean;
  onAddEvidence: (input: AddEvidenceInput) => Promise<void>;
}

export const EvidenceSection: React.FC<Props> = ({
  caseId = 'general',
  evidence,
  isAuthorized,
  onAddEvidence,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CaseEvidence | null>(null);

  // Form & File upload state
  const [name, setName] = useState('');
  const [type, setType] = useState<'image' | 'document' | 'audio' | 'video'>('image');
  const [selectedFileUri, setSelectedFileUri] = useState<string | null>(null);
  const [selectedFileSize, setSelectedFileSize] = useState<number>(0);
  const [useManualUrl, setUseManualUrl] = useState(false);
  const [manualUrl, setManualUrl] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

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

  const formatFileSize = (bytes?: number) => {
    if (!bytes || bytes <= 0) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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

  // Launch Camera to capture photo/video directly
  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera permission is required to capture evidence.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images', 'videos'],
        quality: 0.8,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        setSelectedFileUri(asset.uri);
        const isVideo = asset.type === 'video';
        const defaultName = `Incident_${Date.now()}.${isVideo ? 'mp4' : 'jpg'}`;
        const finalName = asset.fileName || defaultName;
        setName((prev) => (prev.trim() ? prev : finalName));
        setType(isVideo ? 'video' : 'image');
        setSelectedFileSize(asset.fileSize || 0);
        setUseManualUrl(false);
      }
    } catch (err: any) {
      Alert.alert('Camera Error', err.message || 'Could not open camera.');
    }
  };

  // Pick photo or video from Device Gallery
  const handlePickFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Gallery access is required to select photos or videos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        quality: 0.8,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        setSelectedFileUri(asset.uri);
        const isVideo = asset.type === 'video';
        const defaultName = `Evidence_${Date.now()}.${isVideo ? 'mp4' : 'jpg'}`;
        const finalName = asset.fileName || defaultName;
        setName((prev) => (prev.trim() ? prev : finalName));
        setType(isVideo ? 'video' : 'image');
        setSelectedFileSize(asset.fileSize || 0);
        setUseManualUrl(false);
      }
    } catch (err: any) {
      Alert.alert('Gallery Error', err.message || 'Could not open gallery.');
    }
  };

  // Pick Document (PDF, doc, audio, etc.) from Files
  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        setSelectedFileUri(asset.uri);
        const docName = asset.name || `Document_${Date.now()}`;
        setName((prev) => (prev.trim() ? prev : docName));

        // Auto-detect type
        let detectedType: 'image' | 'document' | 'audio' | 'video' = 'document';
        if (asset.mimeType?.startsWith('image/') || /\.(jpg|jpeg|png|webp)$/i.test(docName)) {
          detectedType = 'image';
        } else if (asset.mimeType?.startsWith('video/') || /\.(mp4|mov|avi|mkv)$/i.test(docName)) {
          detectedType = 'video';
        } else if (asset.mimeType?.startsWith('audio/') || /\.(mp3|wav|m4a|aac)$/i.test(docName)) {
          detectedType = 'audio';
        }

        setType(detectedType);
        setSelectedFileSize(asset.size || 0);
        setUseManualUrl(false);
      }
    } catch (err: any) {
      Alert.alert('Document Error', err.message || 'Could not select document.');
    }
  };

  const handleClearSelectedFile = () => {
    setSelectedFileUri(null);
    setSelectedFileSize(0);
  };

  const handleSubmit = async () => {
    if (!selectedFileUri && (!useManualUrl || !manualUrl.trim())) {
      Alert.alert('File Required', 'Please select or snap a file, or provide an external URL.');
      return;
    }
    if (!name.trim()) {
      Alert.alert('Missing Name', 'Please enter a title or filename for this evidence.');
      return;
    }

    try {
      setIsSubmitting(true);
      setUploadProgress(0);

      let finalUrl = manualUrl.trim();
      let finalSize = selectedFileSize;

      if (selectedFileUri) {
        // Upload to Firebase Storage
        const uploadResult = await UploadService.uploadCaseEvidence(
          selectedFileUri,
          caseId,
          name.trim(),
          type,
          (progress) => setUploadProgress(progress)
        );

        finalUrl = uploadResult.url;
        finalSize = uploadResult.size || selectedFileSize;
      }

      await onAddEvidence({
        name: name.trim(),
        type,
        url: finalUrl,
        size: finalSize,
        description: description.trim(),
      });

      // Reset and close
      setName('');
      setSelectedFileUri(null);
      setSelectedFileSize(0);
      setManualUrl('');
      setDescription('');
      setUseManualUrl(false);
      setUploadProgress(null);
      setModalVisible(false);
      Alert.alert('Evidence Saved', 'Evidence has been uploaded and attached to the case.');
    } catch (err: any) {
      Alert.alert('Upload Error', err.message || 'Failed to attach evidence.');
    } finally {
      setIsSubmitting(false);
      setUploadProgress(null);
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
            <Ionicons name="cloud-upload" size={16} color="#0D4722" />
            <Text style={styles.addBtnText}>Upload Evidence</Text>
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
          <Ionicons name="document-attach-outline" size={38} color="#9CA3AF" />
          <Text style={styles.emptyText}>No evidence files attached yet.</Text>
          {isAuthorized && (
            <Text style={styles.emptySubtext}>
              Tap "Upload Evidence" above to capture photos, attach files, or link records.
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
                    {item.size ? (
                      <>
                        <Text style={styles.dot}>•</Text>
                        <Text style={styles.evidenceMeta}>{formatFileSize(item.size)}</Text>
                      </>
                    ) : null}
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

              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
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
                      {selectedItem.type.toUpperCase()} EVIDENCE
                    </Text>
                    {selectedItem.size ? (
                      <Text style={styles.docPreviewSize}>
                        {formatFileSize(selectedItem.size)}
                      </Text>
                    ) : null}
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
                    <Text style={styles.modalFieldLabel}>Investigator Notes:</Text>
                    <Text style={styles.modalFieldValue}>{selectedItem.description}</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.openUrlBtn}
                  onPress={() => handleOpenUrl(selectedItem.url)}
                >
                  <Ionicons name="open-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.openUrlBtnText}>Open File / URL</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* Add / Upload Evidence Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!isSubmitting) setModalVisible(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="cloud-upload" size={20} color="#0D4722" />
                <Text style={styles.modalTitle}>Upload Case Evidence</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  if (!isSubmitting) setModalVisible(false);
                }}
                disabled={isSubmitting}
              >
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Media Selection Action Buttons */}
              <Text style={styles.inputLabel}>Choose Evidence Source *</Text>
              <View style={styles.actionGrid}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleTakePhoto}
                  disabled={isSubmitting}
                >
                  <View style={[styles.actionIconWrap, { backgroundColor: '#E0F2FE' }]}>
                    <Ionicons name="camera" size={22} color="#0284C7" />
                  </View>
                  <Text style={styles.actionButtonLabel}>Camera</Text>
                  <Text style={styles.actionButtonSub}>Take photo</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handlePickFromGallery}
                  disabled={isSubmitting}
                >
                  <View style={[styles.actionIconWrap, { backgroundColor: '#EDE9FE' }]}>
                    <Ionicons name="images" size={22} color="#7C3AED" />
                  </View>
                  <Text style={styles.actionButtonLabel}>Gallery</Text>
                  <Text style={styles.actionButtonSub}>Photo/Video</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handlePickDocument}
                  disabled={isSubmitting}
                >
                  <View style={[styles.actionIconWrap, { backgroundColor: '#D1FAE5' }]}>
                    <Ionicons name="document-attach" size={22} color="#059669" />
                  </View>
                  <Text style={styles.actionButtonLabel}>Files</Text>
                  <Text style={styles.actionButtonSub}>PDF / Docs</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    useManualUrl && { borderColor: '#0D4722', backgroundColor: '#F0FDF4' },
                  ]}
                  onPress={() => {
                    setUseManualUrl(!useManualUrl);
                    if (!useManualUrl) setSelectedFileUri(null);
                  }}
                  disabled={isSubmitting}
                >
                  <View style={[styles.actionIconWrap, { backgroundColor: '#FEF3C7' }]}>
                    <Ionicons name="link" size={22} color="#D97706" />
                  </View>
                  <Text style={styles.actionButtonLabel}>URL</Text>
                  <Text style={styles.actionButtonSub}>Web link</Text>
                </TouchableOpacity>
              </View>

              {/* Selected File Card / Thumbnail Preview */}
              {selectedFileUri ? (
                <View style={styles.selectedFileBox}>
                  <View style={styles.selectedFileTopRow}>
                    <View style={styles.selectedFileIndicator}>
                      <Ionicons
                        name={type === 'image' ? 'image' : 'document-text'}
                        size={16}
                        color="#0D4722"
                      />
                      <Text style={styles.selectedFileStatusText}>Ready to upload</Text>
                    </View>
                    <TouchableOpacity
                      onPress={handleClearSelectedFile}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                  </View>

                  {type === 'image' ? (
                    <Image source={{ uri: selectedFileUri }} style={styles.selectedThumbnail} />
                  ) : (
                    <View style={styles.selectedDocPlaceholder}>
                      <Ionicons name={getTypeIcon(type).name} size={32} color="#0D4722" />
                      <Text style={styles.selectedDocName} numberOfLines={1}>
                        {name || 'Selected Document'}
                      </Text>
                    </View>
                  )}

                  <View style={styles.selectedFileInfoRow}>
                    <Text style={styles.selectedFileTypeTag}>{type.toUpperCase()}</Text>
                    {selectedFileSize > 0 ? (
                      <Text style={styles.selectedFileSizeTag}>
                        {formatFileSize(selectedFileSize)}
                      </Text>
                    ) : null}
                  </View>
                </View>
              ) : null}

              {/* Manual URL Input (if toggled) */}
              {useManualUrl && (
                <View style={{ marginTop: 10 }}>
                  <Text style={styles.inputLabel}>External Storage / Web URL *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="https://cloud.storage.justicenow/file.mp4"
                    placeholderTextColor="#9CA3AF"
                    value={manualUrl}
                    onChangeText={setManualUrl}
                    autoCapitalize="none"
                  />
                </View>
              )}

              {/* Evidence Title */}
              <Text style={styles.inputLabel}>Evidence Name / Title *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Broken_Window_NorthWing.jpg"
                placeholderTextColor="#9CA3AF"
                value={name}
                onChangeText={setName}
              />

              {/* Evidence Type */}
              <Text style={styles.inputLabel}>Evidence Classification *</Text>
              <View style={styles.typeSelectorRow}>
                {(['image', 'document', 'audio', 'video'] as const).map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.typeOption, type === t && styles.typeOptionActive]}
                    onPress={() => setType(t)}
                  >
                    <Text
                      style={[styles.typeOptionText, type === t && styles.typeOptionTextActive]}
                    >
                      {t.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Investigator Notes */}
              <Text style={styles.inputLabel}>Field Notes / Context</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Context regarding chain of custody, who retrieved it, forensic notes..."
                placeholderTextColor="#9CA3AF"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
              />

              {/* Progress Indicator */}
              {isSubmitting && (
                <View style={styles.progressContainer}>
                  <ActivityIndicator size="small" color="#0D4722" />
                  <Text style={styles.progressText}>
                    {uploadProgress !== null && uploadProgress > 0
                      ? `Uploading file to Cloud Storage (${uploadProgress}%)...`
                      : 'Saving and securing evidence...'}
                  </Text>
                </View>
              )}

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                <Text style={styles.submitBtnText}>
                  {isSubmitting ? 'Uploading & Attaching...' : 'Save & Attach Evidence'}
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
    gap: 6,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 6,
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
    lineHeight: 18,
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
    flexWrap: 'wrap',
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
    padding: 18,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxHeight: '90%',
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
  docPreviewSize: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 2,
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
  /* Upload Source Buttons Grid */
  actionGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  actionButtonLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1F2937',
  },
  actionButtonSub: {
    fontSize: 9,
    color: '#6B7280',
  },
  /* Selected File Card */
  selectedFileBox: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  selectedFileTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  selectedFileIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  selectedFileStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0D4722',
  },
  selectedThumbnail: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedDocPlaceholder: {
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    marginBottom: 8,
  },
  selectedDocName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginTop: 4,
    paddingHorizontal: 8,
  },
  selectedFileInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectedFileTypeTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0D4722',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  selectedFileSizeTag: {
    fontSize: 10,
    fontWeight: '600',
    color: '#4B5563',
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
    height: 70,
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
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#E8F5E9',
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0D4722',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0D4722',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 18,
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
