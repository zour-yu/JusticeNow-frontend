import api from './api';
import {
  Complaint,
  CreateComplaintInput,
  ComplaintStatus,
  ComplaintCategory,
  ComplaintPriority,
} from '../types/complaint.types';

// Sample seed complaints for instant testing/demo in Expo Go
const INITIAL_MOCK_COMPLAINTS: Complaint[] = [
  {
    _id: 'mock-1',
    trackingNumber: 'JN-2026-482910',
    citizenId: 'cit-001',
    citizenName: 'Dev Citizen',
    citizenEmail: 'citizen@example.com',
    citizenPhone: '+94 77 123 4567',
    isAnonymous: false,
    category: ComplaintCategory.POLICE_MISCONDUCT,
    title: 'Unlawful Search and Seizure at Checkpoint',
    description: 'Officers at the central checkpoint searched my vehicle without a warrant and confiscated legal documents without issuing any receipt or justification.',
    incidentDate: '2026-08-14T14:30:00.000Z',
    incidentLocation: {
      city: 'Colombo',
      address: 'Galle Road, Near Main Junction',
      details: 'Happened around 2:30 PM in broad daylight',
    },
    witnessInfo: 'Two bystanders and a nearby store manager',
    evidence: [
      {
        id: 'ev-1',
        name: 'checkpoint_photo.jpg',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80',
        size: 1024000,
        uploadedAt: '2026-08-14T15:00:00.000Z',
      },
    ],
    status: ComplaintStatus.UNDER_REVIEW,
    priority: ComplaintPriority.HIGH,
    statusTimeline: [
      {
        status: ComplaintStatus.SUBMITTED,
        title: 'Complaint Submitted',
        note: 'Complaint successfully filed by Citizen.',
        updatedBy: 'Citizen',
        timestamp: '2026-08-14T15:00:00.000Z',
      },
      {
        status: ComplaintStatus.UNDER_REVIEW,
        title: 'Under Review by Admin',
        note: 'Assigned to Human Rights Intake Officer for preliminary review.',
        updatedBy: 'Admin (Sarah)',
        timestamp: '2026-08-15T09:30:00.000Z',
      },
    ],
    createdAt: '2026-08-14T15:00:00.000Z',
    updatedAt: '2026-08-15T09:30:00.000Z',
  },
  {
    _id: 'mock-2',
    trackingNumber: 'JN-2026-319402',
    citizenId: 'cit-001',
    citizenName: 'Anonymous Citizen',
    citizenEmail: 'anonymous@justicenow.org',
    isAnonymous: true,
    category: ComplaintCategory.LABOR_RIGHTS,
    title: 'Forced Overtime and Unsafe Workplace Conditions',
    description: 'Factory management enforces 14-hour daily shifts without safety equipment or overtime compensation, threatening termination for complaints.',
    incidentDate: '2026-08-10T08:00:00.000Z',
    incidentLocation: {
      city: 'Kandy',
      address: 'Industrial Zone, Building 4',
    },
    witnessInfo: 'Multiple co-workers willing to give confidential statements',
    evidence: [],
    status: ComplaintStatus.CONVERTED_TO_CASE,
    priority: ComplaintPriority.URGENT,
    statusTimeline: [
      {
        status: ComplaintStatus.SUBMITTED,
        title: 'Complaint Submitted',
        note: 'Anonymous complaint filed.',
        updatedBy: 'Citizen',
        timestamp: '2026-08-10T09:00:00.000Z',
      },
      {
        status: ComplaintStatus.UNDER_REVIEW,
        title: 'Preliminary Review Completed',
        note: 'Verified evidence and severity.',
        updatedBy: 'Admin (Sarah)',
        timestamp: '2026-08-11T11:00:00.000Z',
      },
      {
        status: ComplaintStatus.APPROVED,
        title: 'Complaint Approved',
        note: 'Formal case initiated.',
        updatedBy: 'Chief Human Rights Officer',
        timestamp: '2026-08-12T14:00:00.000Z',
      },
      {
        status: ComplaintStatus.CONVERTED_TO_CASE,
        title: 'Assigned to Investigation Unit',
        note: 'Assigned to Lead Investigator Roberts (Case Ref #CASE-2026-084).',
        updatedBy: 'Investigation Board',
        timestamp: '2026-08-13T10:00:00.000Z',
      },
    ],
    caseId: 'CASE-2026-084',
    assignedInvestigatorId: 'inv-101',
    createdAt: '2026-08-10T09:00:00.000Z',
    updatedAt: '2026-08-13T10:00:00.000Z',
  },
];

let localComplaintsStore: Complaint[] = [...INITIAL_MOCK_COMPLAINTS];

export const ComplaintService = {
  async submitComplaint(input: CreateComplaintInput): Promise<Complaint> {
    try {
      // Attempt backend API call first
      const response = await api.post('/complaints', input);
      if (response.data && response.data.data) {
        localComplaintsStore.unshift(response.data.data);
        return response.data.data;
      }
    } catch (err) {
      console.log('Backend not reachable or not authenticated, saving locally in mock store:', err);
    }

    // Fallback: create mock complaint locally
    const trackingNumber = `JN-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const newComplaint: Complaint = {
      _id: `mock-${Date.now()}`,
      trackingNumber,
      citizenId: 'cit-001',
      citizenName: input.isAnonymous ? 'Anonymous Citizen' : 'Dev Citizen',
      citizenEmail: input.isAnonymous ? 'anonymous@justicenow.org' : 'citizen@example.com',
      isAnonymous: !!input.isAnonymous,
      category: input.category,
      title: input.title,
      description: input.description,
      incidentDate: input.incidentDate,
      incidentLocation: input.incidentLocation,
      witnessInfo: input.witnessInfo,
      evidence: input.evidence || [],
      status: ComplaintStatus.SUBMITTED,
      priority: ComplaintPriority.MEDIUM,
      statusTimeline: [
        {
          status: ComplaintStatus.SUBMITTED,
          title: 'Complaint Submitted',
          note: 'Your human rights complaint was officially logged in Justice Now.',
          updatedBy: 'Citizen',
          timestamp: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    localComplaintsStore.unshift(newComplaint);
    return newComplaint;
  },

  async getMyComplaints(): Promise<Complaint[]> {
    try {
      const response = await api.get('/complaints/my');
      if (response.data && response.data.data) {
        return response.data.data;
      }
    } catch (err) {
      console.log('Loading local mock complaints:', err);
    }
    return [...localComplaintsStore];
  },

  async getComplaintById(idOrTracking: string): Promise<Complaint | null> {
    try {
      const response = await api.get(`/complaints/${idOrTracking}`);
      if (response.data && response.data.data) {
        return response.data.data;
      }
    } catch (err) {
      console.log('Searching in local store:', err);
    }

    const found = localComplaintsStore.find(
      (c) => c._id === idOrTracking || c.trackingNumber === idOrTracking
    );
    return found || null;
  },
};
