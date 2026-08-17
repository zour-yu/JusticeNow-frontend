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
} from 'react-native';
import { CategorySelector } from '../components/CategorySelector';
import {
  ComplaintCategory,
  CreateComplaintInput,
  EvidenceItem,
  Complaint,
} from '../../../shared/types/complaint.types';
import { ComplaintService } from '../../../shared/services/complaint.service';

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

  const handleAddSampleEvidence = (type: 'photo' | 'document' | 'video') => {
    const defaultNames: Record<string, string> = {
      photo: 'Incident_Photo_Evidence.jpg',
      document: 'Medical_Legal_Report.pdf',
      video: 'Video_Recording.mp4',
    };

    const name = newEvidenceName.trim() || defaultNames[type];
    const newEvidence: EvidenceItem = {
      id: `ev-${Date.now()}`,
      name,
      type,
      url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80',
      size: 1540000,
      uploadedAt: new Date().toISOString(),
    };

    setEvidenceList([...evidenceList, newEvidence]);
    setNewEvidenceName('');
    setShowEvidenceModal(false);
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
    <View style={styles.screenContainer}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Banner */}
        <View style={styles.headerBanner}>
          <Text style={styles.headerTag}>HUMAN RIGHTS COMPLAINT</Text>
          <Text style={styles.headerTitle}>Report a Violation</Text>
          <Text style={styles.headerSubtitle}>
            Your complaint will be securely registered, reviewed by human rights officers, and tracked transparently.
          </Text>
        </View>

        {/* Section 1: Category Selector */}
        <View style={styles.sectionCard}>
          <CategorySelector
            selectedCategory={category}
            onSelectCategory={setCategory}
          />
        </View>

        {/* Section 2: Incident Details */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Incident Details</Text>
          
          {/* Title */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Incident Title / Summary <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Unlawful detention at central police station"
              placeholderTextColor="#94A3B8"
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
              placeholderTextColor="#94A3B8"
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
              placeholderTextColor="#94A3B8"
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
              placeholderTextColor="#94A3B8"
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
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            value={description}
            onChangeText={setDescription}
          />

          {/* Witness Info */}
          <View style={[styles.inputGroup, { marginTop: 14 }]}>
            <Text style={styles.label}>Witnesses or Bystanders (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Names, contact details, or notes about witnesses"
              placeholderTextColor="#94A3B8"
              value={witnessInfo}
              onChangeText={setWitnessInfo}
            />
          </View>
        </View>

        {/* Section 4: Evidence Attachments */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>Supporting Evidence</Text>
              <Text style={styles.sectionSubtitle}>Attach photos, documents, or video links</Text>
            </View>
            <TouchableOpacity
              style={styles.addEvidenceButton}
              onPress={() => setShowEvidenceModal(true)}
            >
              <Text style={styles.addEvidenceText}>+ Attach</Text>
            </TouchableOpacity>
          </View>

          {evidenceList.length === 0 ? (
            <View style={styles.emptyEvidenceBox}>
              <Text style={styles.emptyEvidenceIcon}>📎</Text>
              <Text style={styles.emptyEvidenceText}>No evidence files attached yet.</Text>
              <TouchableOpacity
                style={styles.attachOutlineBtn}
                onPress={() => setShowEvidenceModal(true)}
              >
                <Text style={styles.attachOutlineBtnText}>Add Document / Photo</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.evidenceListContainer}>
              {evidenceList.map((item) => (
                <View key={item.id} style={styles.evidenceItem}>
                  <Text style={styles.evidenceItemIcon}>
                    {item.type === 'photo' ? '🖼️' : item.type === 'video' ? '🎥' : '📄'}
                  </Text>
                  <View style={styles.evidenceItemInfo}>
                    <Text style={styles.evidenceItemName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.evidenceItemType}>
                      {item.type.toUpperCase()} • 1.5 MB
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleRemoveEvidence(item.id)}
                    style={styles.removeEvidenceBtn}
                  >
                    <Text style={styles.removeEvidenceText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Section 5: Anonymous Toggle & Privacy */}
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
              trackColor={{ false: '#CBD5E1', true: '#93C5FD' }}
              thumbColor={isAnonymous ? '#2563EB' : '#F8FAFC'}
            />
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
          activeOpacity={0.8}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
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
            <Text style={styles.modalTitle}>Attach Evidence File</Text>
            <Text style={styles.modalSubtitle}>
              Select the file format or enter a custom label
            </Text>

            <TextInput
              style={[styles.input, { marginBottom: 16 }]}
              placeholder="File title / description (Optional)"
              placeholderTextColor="#94A3B8"
              value={newEvidenceName}
              onChangeText={setNewEvidenceName}
            />

            <View style={styles.evidenceOptionRow}>
              <TouchableOpacity
                style={styles.evidenceOptionBtn}
                onPress={() => handleAddSampleEvidence('photo')}
              >
                <Text style={styles.evidenceOptionIcon}>📸</Text>
                <Text style={styles.evidenceOptionLabel}>Photo / Image</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.evidenceOptionBtn}
                onPress={() => handleAddSampleEvidence('document')}
              >
                <Text style={styles.evidenceOptionIcon}>📄</Text>
                <Text style={styles.evidenceOptionLabel}>PDF Document</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.evidenceOptionBtn}
                onPress={() => handleAddSampleEvidence('video')}
              >
                <Text style={styles.evidenceOptionIcon}>📹</Text>
                <Text style={styles.evidenceOptionLabel}>Video Clip</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.cancelModalBtn}
              onPress={() => setShowEvidenceModal(false)}
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
              <Text style={styles.successCheckIcon}>✓</Text>
            </View>

            <Text style={styles.successTitle}>Complaint Submitted!</Text>
            <Text style={styles.successSubtitle}>
              Your complaint has been successfully registered in the Justice Now system.
            </Text>

            {/* Tracking ID Box */}
            <View style={styles.trackingBox}>
              <Text style={styles.trackingBoxLabel}>YOUR TRACKING NUMBER</Text>
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
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#0B132B',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  headerBanner: {
    backgroundColor: '#1C2541',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#3A506B',
  },
  headerTag: {
    color: '#60A5FA',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 18,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 14,
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  required: {
    color: '#EF4444',
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  textArea: {
    minHeight: 110,
    paddingTop: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  addEvidenceButton: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  addEvidenceText: {
    color: '#2563EB',
    fontWeight: '700',
    fontSize: 13,
  },
  emptyEvidenceBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  emptyEvidenceIcon: {
    fontSize: 28,
    marginBottom: 6,
  },
  emptyEvidenceText: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 10,
  },
  attachOutlineBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  attachOutlineBtnText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
  },
  evidenceListContainer: {
    gap: 8,
  },
  evidenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  evidenceItemIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  evidenceItemInfo: {
    flex: 1,
  },
  evidenceItemName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  evidenceItemType: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  removeEvidenceBtn: {
    padding: 6,
  },
  removeEvidenceText: {
    fontSize: 16,
    color: '#EF4444',
    fontWeight: 'bold',
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
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  switchSubtitle: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  submitButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
    marginTop: 8,
    marginBottom: 12,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  disclaimerText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
  },
  evidenceOptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 8,
  },
  evidenceOptionBtn: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  evidenceOptionIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  evidenceOptionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center',
  },
  cancelModalBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  cancelModalBtnText: {
    color: '#64748B',
    fontWeight: '600',
    fontSize: 14,
  },
  successModalContent: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successCheckIcon: {
    fontSize: 32,
    color: '#059669',
    fontWeight: 'bold',
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  trackingBox: {
    backgroundColor: '#F1F5F9',
    padding: 16,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  trackingBoxLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1,
    marginBottom: 4,
  },
  trackingBoxNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E3A8A',
    letterSpacing: 1,
    marginBottom: 6,
  },
  trackingBoxHint: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
  },
  viewDetailsBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  viewDetailsBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  submitAnotherBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  submitAnotherBtnText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
  },
});
