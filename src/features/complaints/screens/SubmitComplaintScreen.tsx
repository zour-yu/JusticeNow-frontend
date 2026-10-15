import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
  Modal,
  StyleSheet,
  StatusBar,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { CategorySelector } from '../components/CategorySelector';
import {
  ComplaintCategory,
  CreateComplaintInput,
  EvidenceItem,
  Complaint,
} from '../../../shared/types/complaint.types';
import { ComplaintService } from '../../../shared/services/complaint.service';
import { UploadService } from '../../../shared/services/upload.service';

const SERIF_FONT = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'serif',
});

export const SubmitComplaintScreen = ({ navigation }: any) => {
  const [category, setCategory] = useState<ComplaintCategory>(
    ComplaintCategory.POLICE_MISCONDUCT
  );
  const [title, setTitle] = useState('');
  const [incidentDate, setIncidentDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [witnessInfo, setWitnessInfo] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>([]);
  const [newEvidenceName, setNewEvidenceName] = useState('');
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedComplaint, setSubmittedComplaint] = useState<Complaint | null>(
    null
  );
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isUploadingEvidence, setIsUploadingEvidence] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const formatFileSize = (bytes?: number) => {
    if (!bytes || bytes <= 0) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const processAndUploadAsset = async (asset: ImagePicker.ImagePickerAsset) => {
    setIsUploadingEvidence(true);
    setUploadProgress(0);
    const isVideo = asset.type === 'video';
    const defaultName = `Incident_${Date.now()}.${isVideo ? 'mp4' : 'jpg'}`;
    const cleanName = newEvidenceName.trim() || asset.fileName || defaultName;

    const uploadRes = await UploadService.uploadFile(
      asset.uri,
      cleanName,
      isVideo ? 'video' : 'image',
      asset.mimeType,
      (pct) => setUploadProgress(pct)
    );

    const newEvidence: EvidenceItem = {
      id: `ev-${Date.now()}`,
      name: cleanName,
      type: uploadRes.type,
      url: uploadRes.url,
      size: uploadRes.size || asset.fileSize || 1024 * 500,
      uploadedAt: new Date().toISOString(),
    };

    setEvidenceList((prev) => [...prev, newEvidence]);
    setNewEvidenceName('');
    setShowEvidenceModal(false);
  };

  const handlePickMedia = async (source: 'camera' | 'gallery' | 'document') => {
    try {
      if (source === 'camera') {
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
          await processAndUploadAsset(result.assets[0]);
        }
      } else if (source === 'gallery') {
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
          await processAndUploadAsset(result.assets[0]);
        }
      } else if (source === 'document') {
        const result = await DocumentPicker.getDocumentAsync({
          type: '*/*',
          copyToCacheDirectory: true,
        });
        if (!result.canceled && result.assets && result.assets[0]) {
          const doc = result.assets[0];
          let detectedType: 'image' | 'document' | 'audio' | 'video' = 'document';
          if (doc.mimeType?.startsWith('image/') || /\.(jpg|jpeg|png|webp)$/i.test(doc.name)) {
            detectedType = 'image';
          } else if (doc.mimeType?.startsWith('video/') || /\.(mp4|mov|avi|mkv)$/i.test(doc.name)) {
            detectedType = 'video';
          } else if (doc.mimeType?.startsWith('audio/') || /\.(mp3|wav|m4a|aac)$/i.test(doc.name)) {
            detectedType = 'audio';
          }

          setIsUploadingEvidence(true);
          setUploadProgress(0);
          const uploadRes = await UploadService.uploadFile(
            doc.uri,
            newEvidenceName.trim() || doc.name,
            detectedType,
            doc.mimeType,
            (pct) => setUploadProgress(pct)
          );

          const newEvidence: EvidenceItem = {
            id: `ev-${Date.now()}`,
            name: newEvidenceName.trim() || uploadRes.name,
            type: uploadRes.type,
            url: uploadRes.url,
            size: uploadRes.size || doc.size,
            uploadedAt: new Date().toISOString(),
          };

          setEvidenceList((prev) => [...prev, newEvidence]);
          setNewEvidenceName('');
          setShowEvidenceModal(false);
        }
      }
    } catch (err: any) {
      Alert.alert('Attachment Error', err.message || 'Failed to select and attach evidence file.');
    } finally {
      setIsUploadingEvidence(false);
      setUploadProgress(null);
    }
  };

  const handleRemoveEvidence = (id: string) => {
    setEvidenceList(evidenceList.filter((item) => item.id !== id));
  };

  const validateForm = () => {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Please enter a title or summary for the incident.');
      return false;
    }
    if (!city.trim()) {
      Alert.alert('Validation Error', 'Please enter the city or region where the incident occurred.');
      return false;
    }
    if (!address.trim()) {
      Alert.alert('Validation Error', 'Please enter the specific location or street address.');
      return false;
    }
    if (!description.trim() || description.trim().length < 20) {
      Alert.alert('Validation Error', 'Please provide a detailed description (minimum 20 characters).');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const payload: CreateComplaintInput = {
        category,
        title: title.trim(),
        description: description.trim(),
        incidentDate: new Date(incidentDate).toISOString(),
        incidentLocation: {
          city: city.trim(),
          address: address.trim(),
        },
        witnessInfo: witnessInfo.trim() || undefined,
        isAnonymous,
        evidence: evidenceList,
      };

      const result = await ComplaintService.submitComplaint(payload);
      setSubmittedComplaint(result);
      setShowSuccessModal(true);
    } catch (err: any) {
      Alert.alert('Submission Failed', err?.message || 'Could not submit complaint.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setCity('');
    setAddress('');
    setDescription('');
    setWitnessInfo('');
    setIsAnonymous(false);
    setEvidenceList([]);
    setShowSuccessModal(false);
    setSubmittedComplaint(null);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4F6F4" />

      {/* Top Header Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.navBackBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#163820" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>File a Complaint</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Banner */}
        <View style={styles.headerBanner}>
          <Text style={styles.headerTag}>HUMAN RIGHTS PROTECTION</Text>
          <Text style={styles.headerTitle}>Report an Incident</Text>
          <Text style={styles.headerSubtitle}>
            Your complaint will be securely registered, reviewed by human rights officers, and tracked transparently.
          </Text>
        </View>

        {/* Section 1: Category Selector (rendered directly without extra box) */}
        <CategorySelector
          selectedCategory={category}
          onSelectCategory={setCategory}
        />

        {/* Section 2: Incident Details */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Incident Details</Text>
          <Text style={styles.sectionSubtitle}>
            Provide key facts about where and when the incident took place
          </Text>

          {/* Title */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Incident Title / Summary <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Unlawful detention at central police station"
              placeholderTextColor="#9CA3AF"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          {/* Date */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Date of Incident <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#9CA3AF"
              value={incidentDate}
              onChangeText={setIncidentDate}
            />
          </View>

          {/* City */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              City / District <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Colombo, Kandy, Galle"
              placeholderTextColor="#9CA3AF"
              value={city}
              onChangeText={setCity}
            />
          </View>

          {/* Address */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Specific Location / Address <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Near Station Road, Building #12"
              placeholderTextColor="#9CA3AF"
              value={address}
              onChangeText={setAddress}
            />
          </View>
        </View>

        {/* Section 3: Detailed Narrative */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Incident Description</Text>
          <Text style={styles.sectionSubtitle}>
            Describe what happened in detail. Include individuals involved, badges/names (if known), and sequence of events.
          </Text>

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Provide as much detailed information as possible..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            value={description}
            onChangeText={setDescription}
          />

          {/* Witness Info */}
          <View style={[styles.inputGroup, { marginTop: 16 }]}>
            <Text style={styles.label}>Witnesses or Bystanders (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Names, contact details, or notes about..."
              placeholderTextColor="#9CA3AF"
              value={witnessInfo}
              onChangeText={setWitnessInfo}
            />
          </View>
        </View>

        {/* Section 4: Supporting Evidence (Image 2 style) */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={styles.sectionTitle}>Supporting Evidence</Text>
              <Text style={styles.sectionSubtitle}>Attach photos, documents, or video links</Text>
            </View>
            <TouchableOpacity
              style={styles.addEvidencePill}
              onPress={() => setShowEvidenceModal(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.addEvidencePillText}>+ Attach</Text>
            </TouchableOpacity>
          </View>

          {evidenceList.length === 0 ? (
            <View style={styles.emptyEvidenceDashedBox}>
              <Ionicons name="cloud-upload-outline" size={38} color="#163820" style={{ marginBottom: 6 }} />
              <Text style={styles.emptyEvidenceText}>No evidence files attached yet.</Text>
              <TouchableOpacity
                style={styles.addDocButton}
                onPress={() => setShowEvidenceModal(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.addDocButtonText}>Add Document / Photo</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.evidenceListContainer}>
              {evidenceList.map((item) => (
                <View key={item.id} style={styles.evidenceItem}>
                  {item.type === 'image' || item.type === 'photo' ? (
                    <Image source={{ uri: item.url }} style={styles.evidenceThumb} resizeMode="cover" />
                  ) : (
                    <View style={styles.evidenceThumbPlaceholder}>
                      <Ionicons
                        name={item.type === 'video' ? 'videocam-outline' : item.type === 'audio' ? 'musical-notes-outline' : 'document-outline'}
                        size={22}
                        color="#163820"
                      />
                    </View>
                  )}
                  <View style={styles.evidenceItemInfo}>
                    <Text style={styles.evidenceItemName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.evidenceItemType}>
                      {item.type.toUpperCase()}{item.size ? ` • ${formatFileSize(item.size)}` : ''}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleRemoveEvidence(item.id)}
                    style={styles.removeEvidenceBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="close-circle" size={22} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Section 5: Anonymous Toggle & Privacy (Image 2 style) */}
        <View style={styles.sectionCard}>
          <View style={styles.switchRow}>
            <View style={styles.switchTextContainer}>
              <Text style={styles.switchTitle}>Submit Anonymously</Text>
              <Text style={styles.switchSubtitle}>
                Your identity will be hidden from investigators. You can still track case updates with your Tracking Reference Number.
              </Text>
            </View>
            <Switch
              value={isAnonymous}
              onValueChange={setIsAnonymous}
              trackColor={{ false: '#E2E8E4', true: '#25633C' }}
              thumbColor={'#FFFFFF'}
            />
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
          activeOpacity={0.85}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Complaint Officially</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.disclaimerText}>
          🔒 Submitted securely under Human Rights Protection Protocols.
        </Text>
      </ScrollView>

      {/* Attach Evidence Modal */}
      <Modal
        visible={showEvidenceModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEvidenceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Attach Supporting Evidence</Text>
              <TouchableOpacity
                onPress={() => setShowEvidenceModal(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>
              Select media or documents that support your complaint
            </Text>

            <TextInput
              style={[styles.input, { marginBottom: 16 }]}
              placeholder="File title / description (Optional)"
              placeholderTextColor="#9CA3AF"
              value={newEvidenceName}
              onChangeText={setNewEvidenceName}
            />

            <View style={styles.evidenceOptionRow}>
              <TouchableOpacity
                style={styles.evidenceOptionBtn}
                onPress={() => handlePickMedia('camera')}
                disabled={isUploadingEvidence}
                activeOpacity={0.8}
              >
                <View style={[styles.modalOptionIconCircle, { backgroundColor: '#CFE4D4' }]}>
                  <Ionicons name="camera-outline" size={24} color="#163820" />
                </View>
                <Text style={styles.evidenceOptionLabel}>Camera</Text>
                <Text style={styles.evidenceOptionSub}>Photo / Video</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.evidenceOptionBtn}
                onPress={() => handlePickMedia('gallery')}
                disabled={isUploadingEvidence}
                activeOpacity={0.8}
              >
                <View style={[styles.modalOptionIconCircle, { backgroundColor: '#D4E5EC' }]}>
                  <Ionicons name="images-outline" size={24} color="#2F5B73" />
                </View>
                <Text style={styles.evidenceOptionLabel}>Gallery</Text>
                <Text style={styles.evidenceOptionSub}>Choose media</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.evidenceOptionBtn}
                onPress={() => handlePickMedia('document')}
                disabled={isUploadingEvidence}
                activeOpacity={0.8}
              >
                <View style={[styles.modalOptionIconCircle, { backgroundColor: '#EDE9FE' }]}>
                  <Ionicons name="document-text-outline" size={24} color="#6D28D9" />
                </View>
                <Text style={styles.evidenceOptionLabel}>Files / PDF</Text>
                <Text style={styles.evidenceOptionSub}>Documents</Text>
              </TouchableOpacity>
            </View>

            {isUploadingEvidence && (
              <View style={styles.uploadProgressBox}>
                <ActivityIndicator size="small" color="#163820" />
                <Text style={styles.uploadProgressText}>
                  {uploadProgress !== null && uploadProgress > 0
                    ? `Uploading file (${uploadProgress}%)...`
                    : 'Processing and securing file...'}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.cancelModalBtn}
              onPress={() => {
                if (!isUploadingEvidence) setShowEvidenceModal(false);
              }}
              disabled={isUploadingEvidence}
            >
              <Text style={styles.cancelModalBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Success Confirmation Modal */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.successModalContent]}>
            <View style={styles.successIconCircle}>
              <Ionicons name="checkmark-circle" size={48} color="#163820" />
            </View>

            <Text style={styles.successTitle}>Complaint Submitted!</Text>
            <Text style={styles.successSubtitle}>
              Your complaint has been successfully registered in the Justice Now system.
            </Text>

            {/* Tracking ID Box */}
            <View style={styles.trackingBox}>
              <Text style={styles.trackingBoxLabel}>YOUR CASE TRACKING NUMBER</Text>
              <Text style={styles.trackingBoxNumber}>
                {submittedComplaint?.trackingNumber}
              </Text>
              <Text style={styles.trackingBoxHint}>
                Save this number to track investigation progress and status updates.
              </Text>
            </View>

            {/* Action Buttons */}
            <TouchableOpacity
              style={styles.viewDetailsBtn}
              onPress={() => {
                setShowSuccessModal(false);
                if (submittedComplaint) {
                  navigation.navigate('ComplaintDetail', {
                    complaintId: submittedComplaint._id,
                    complaint: submittedComplaint,
                  });
                }
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.viewDetailsBtnText}>Track Complaint Progress</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.submitAnotherBtn}
              onPress={resetForm}
            >
              <Text style={styles.submitAnotherBtnText}>Submit Another Complaint</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F4F6F4',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F4F6F4',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  navBackBtn: {
    padding: 6,
    marginLeft: -6,
  },
  topBarTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#163820',
    fontFamily: SERIF_FONT,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  headerBanner: {
    backgroundColor: '#183E28',
    padding: 22,
    borderRadius: 24,
    marginBottom: 20,
    shadowColor: '#183E28',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4,
  },
  headerTag: {
    color: '#8ED6A5',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: SERIF_FONT,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 13.5,
    color: '#D0E6D8',
    lineHeight: 20,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    marginTop: 14,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#E5ECE6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 17.5,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 14,
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#163820',
    marginBottom: 7,
  },
  required: {
    color: '#DC2626',
  },
  input: {
    backgroundColor: '#F9FBF9',
    borderWidth: 1,
    borderColor: '#DFE7E1',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14.5,
    color: '#111827',
  },
  textArea: {
    minHeight: 115,
    paddingTop: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  addEvidencePill: {
    backgroundColor: '#D7E8DC',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  addEvidencePillText: {
    color: '#163820',
    fontWeight: '700',
    fontSize: 13,
  },
  emptyEvidenceDashedBox: {
    borderWidth: 1.5,
    borderColor: '#A8BBAE',
    borderStyle: 'dashed',
    borderRadius: 18,
    paddingVertical: 26,
    paddingHorizontal: 16,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  emptyEvidenceText: {
    fontSize: 13.5,
    color: '#4B5563',
    marginVertical: 10,
  },
  addDocButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#111827',
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 22,
  },
  addDocButtonText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#111827',
  },
  evidenceListContainer: {
    gap: 10,
  },
  evidenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FBF9',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DFE7E1',
  },
  evidenceThumb: {
    width: 46,
    height: 46,
    borderRadius: 10,
    marginRight: 12,
  },
  evidenceThumbPlaceholder: {
    width: 46,
    height: 46,
    borderRadius: 10,
    backgroundColor: '#EAEFEA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  evidenceItemInfo: {
    flex: 1,
  },
  evidenceItemName: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#111827',
  },
  evidenceItemType: {
    fontSize: 11.5,
    color: '#6B7280',
    marginTop: 2,
  },
  removeEvidenceBtn: {
    padding: 4,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchTextContainer: {
    flex: 1,
    marginRight: 14,
  },
  switchTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  switchSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  submitButton: {
    backgroundColor: '#1E4A2E',
    paddingVertical: 18,
    borderRadius: 32,
    alignItems: 'center',
    shadowColor: '#1E4A2E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
    marginTop: 16,
    marginBottom: 12,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16.5,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  disclaimerText: {
    textAlign: 'center',
    fontSize: 12.5,
    color: '#6B7280',
    marginBottom: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 420,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 6,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 18,
  },
  evidenceOptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 10,
  },
  evidenceOptionBtn: {
    flex: 1,
    backgroundColor: '#F9FBF9',
    borderWidth: 1,
    borderColor: '#DFE7E1',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalOptionIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  evidenceOptionLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  evidenceOptionSub: {
    fontSize: 10.5,
    color: '#6B7280',
    marginTop: 2,
    textAlign: 'center',
  },
  uploadProgressBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
  },
  uploadProgressText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#163820',
  },
  cancelModalBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelModalBtnText: {
    color: '#6B7280',
    fontWeight: '600',
    fontSize: 14,
  },
  successModalContent: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  successIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
    textAlign: 'center',
    fontFamily: SERIF_FONT,
  },
  successSubtitle: {
    fontSize: 13.5,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 22,
    paddingHorizontal: 12,
    lineHeight: 19,
  },
  trackingBox: {
    backgroundColor: '#F0F8F2',
    padding: 18,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
    marginBottom: 22,
    borderWidth: 1,
    borderColor: '#CFE4D4',
  },
  trackingBoxLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#163820',
    letterSpacing: 1.1,
    marginBottom: 6,
  },
  trackingBoxNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#163820',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  trackingBoxHint: {
    fontSize: 11.5,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 16,
  },
  viewDetailsBtn: {
    backgroundColor: '#1E4A2E',
    paddingVertical: 16,
    borderRadius: 28,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#1E4A2E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  viewDetailsBtnText: {
    color: '#FFFFFF',
    fontSize: 15.5,
    fontWeight: '700',
  },
  submitAnotherBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  submitAnotherBtnText: {
    color: '#163820',
    fontSize: 14,
    fontWeight: '700',
  },
});
