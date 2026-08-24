import api from './api';
import {
  Case,
  CaseStatus,
  CasePriority,
  AddEvidenceInput,
  AddNoteInput,
  UpdateCaseStatusInput,
  Investigator,
  AssignInvestigatorInput,
} from '../types/case.types';
import { ComplaintCategory } from '../types/complaint.types';

export const INITIAL_MOCK_INVESTIGATORS: Investigator[] = [
  {
    _id: 'inv-101',
    firebaseUid: 'inv-101',
    firstName: 'Sarah',
    lastName: 'Connor',
    name: 'Sarah Connor',
    email: 'sarah.connor@justicenow.org',
    phone: '+94 77 112 2334',
    status: 'ACTIVE',
    activeCasesCount: 2,
    specialization: 'Civil Rights & Police Accountability',
  },
  {
    _id: 'inv-102',
    firebaseUid: 'inv-102',
    firstName: 'John',
    lastName: 'Rambo',
    name: 'John Rambo',
    email: 'john.rambo@justicenow.org',
    phone: '+94 71 445 5667',
    status: 'ACTIVE',
    activeCasesCount: 1,
    specialization: 'Labor Violations & Unlawful Detention',
  },
  {
    _id: 'inv-103',
    firebaseUid: 'inv-103',
    firstName: 'Priya',
    lastName: 'Jayawardena',
    name: 'Priya Jayawardena',
    email: 'priya.j@justicenow.org',
    phone: '+94 76 998 8776',
    status: 'ACTIVE',
    activeCasesCount: 0,
    specialization: 'Gender-Based Violence & Child Rights',
  },
  {
    _id: 'inv-104',
    firebaseUid: 'inv-104',
    firstName: 'David',
    lastName: 'Kim',
    name: 'David Kim',
    email: 'david.kim@justicenow.org',
    phone: '+94 70 334 4556',
    status: 'ACTIVE',
    activeCasesCount: 1,
    specialization: 'Discrimination & Public Corruption',
  },
];

// Realistic sample cases for Investigator
const INITIAL_MOCK_CASES: Case[] = [
  {
    _id: 'case-001',
    caseNumber: 'CASE-2026-084123',
    complaintId: 'JN-2026-482910',
    title: 'Unlawful Search and Seizure at Checkpoint',
    description: 'Police officers conducted unauthorized vehicle search without warrant or justification at Central Checkpoint and confiscated legal documents.',
    category: ComplaintCategory.POLICE_MISCONDUCT,
    priority: CasePriority.HIGH,
    status: CaseStatus.UNDER_INVESTIGATION,
    assignedInvestigatorId: 'inv-101',
    assignedInvestigatorName: 'Lead Investigator Sarah Connor',
    assignedInvestigatorEmail: 'investigator@justicenow.org',
    assignedBy: 'Chief Administrator Vance',
    assignedAt: '2026-08-15T10:00:00.000Z',
    complaintDetails: {
      trackingNumber: 'JN-2026-482910',
      citizenName: 'Dev Citizen',
      citizenEmail: 'citizen@example.com',
      citizenPhone: '+94 77 123 4567',
      isAnonymous: false,
      incidentDate: '2026-08-14T14:30:00.000Z',
      incidentLocation: {
        city: 'Colombo',
        address: 'Galle Road, Near Main Junction',
        details: 'Happened around 2:30 PM in broad daylight near checkpoint 4',
      },
      description: 'Officers at the central checkpoint searched my vehicle without a warrant and confiscated legal documents without issuing any receipt or justification.',
      witnessInfo: 'Two bystanders and a nearby store manager witnessed the entire incident.',
    },
    evidence: [
      {
        id: 'ev-101',
        name: 'checkpoint_photo.jpg',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80',
        size: 1024000,
        uploadedAt: '2026-08-14T15:00:00.000Z',
        uploadedBy: 'Citizen',
        description: 'Photo taken right after the officers stopped the vehicle',
      },
      {
        id: 'ev-102',
        name: 'dashcam_recording.mp4',
        type: 'video',
        url: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
        size: 8400000,
        uploadedAt: '2026-08-16T11:20:00.000Z',
        uploadedBy: 'Investigator Sarah Connor',
        description: 'Dashcam clip retrieved from complainant vehicle showing officer badge numbers',
      },
    ],
    investigationNotes: [
      {
        id: 'note-001',
        note: 'Completed preliminary interview with complainant Dev Citizen. Obtained vehicle registration details and timeline log.',
        authorName: 'Sarah Connor',
        authorId: 'inv-101',
        createdAt: '2026-08-16T14:00:00.000Z',
      },
      {
        id: 'note-002',
        note: 'Sent formal requisition letter to Sector 3 Police Station requesting duty logs of officers assigned to Checkpoint 4 on 14 August.',
        authorName: 'Sarah Connor',
        authorId: 'inv-101',
        createdAt: '2026-08-17T09:15:00.000Z',
      },
    ],
    statusTimeline: [
      {
        status: CaseStatus.ASSIGNED,
        title: 'Case Assigned to Lead Investigator',
        note: 'Formal case established following approval of complaint JN-2026-482910.',
        updatedBy: 'Admin Vance',
        timestamp: '2026-08-15T10:00:00.000Z',
      },
      {
        status: CaseStatus.UNDER_INVESTIGATION,
        title: 'Field Investigation Initiated',
        note: 'Investigator Sarah Connor commenced witness inquiries and evidence review.',
        updatedBy: 'Sarah Connor',
        timestamp: '2026-08-16T08:30:00.000Z',
      },
    ],
    findings: 'Initial evidence supports complainant testimony. Station logs show unauthorized deployment of checkpoint personnel.',
    createdAt: '2026-08-15T10:00:00.000Z',
    updatedAt: '2026-08-17T09:15:00.000Z',
  },
  {
    _id: 'case-002',
    caseNumber: 'CASE-2026-059918',
    complaintId: 'JN-2026-319402',
    title: 'Forced Overtime and Unsafe Workplace Conditions',
    description: 'Textile manufacturing facility enforcing 14-hour mandatory shifts in unventilated rooms without fire exits or compensation.',
    category: ComplaintCategory.LABOR_RIGHTS,
    priority: CasePriority.URGENT,
    status: CaseStatus.EVIDENCE_COLLECTION,
    assignedInvestigatorId: 'inv-101',
    assignedInvestigatorName: 'Lead Investigator Sarah Connor',
    assignedInvestigatorEmail: 'investigator@justicenow.org',
    assignedBy: 'Human Rights Review Board',
    assignedAt: '2026-08-13T10:00:00.000Z',
    complaintDetails: {
      trackingNumber: 'JN-2026-319402',
      citizenName: 'Anonymous Citizen',
      citizenEmail: 'anonymous@justicenow.org',
      isAnonymous: true,
      incidentDate: '2026-08-10T08:00:00.000Z',
      incidentLocation: {
        city: 'Kandy',
        address: 'Industrial Zone, Building 4',
        details: 'Floor 2 assembly department',
      },
      description: 'Factory management enforces 14-hour daily shifts without safety equipment or overtime compensation, threatening termination for complaints.',
      witnessInfo: 'Over 20 factory workers ready to submit confidential statements to the Human Rights commission.',
    },
    evidence: [
      {
        id: 'ev-201',
        name: 'factory_shift_roster.pdf',
        type: 'document',
        url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        size: 450000,
        uploadedAt: '2026-08-14T09:00:00.000Z',
        uploadedBy: 'Investigator Sarah Connor',
        description: 'Internal duty roster showing 7:00 AM to 9:30 PM compulsory shifts',
      },
      {
        id: 'ev-202',
        name: 'workplace_hazard_image.jpg',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=600&q=80',
        size: 1840000,
        uploadedAt: '2026-08-14T11:45:00.000Z',
        uploadedBy: 'Investigator Sarah Connor',
        description: 'Padlocked emergency fire exit during shift hours',
      },
    ],
    investigationNotes: [
      {
        id: 'note-201',
        note: 'Conducted undercover site inspection accompanied by Labor Inspectorate representative.',
        authorName: 'Sarah Connor',
        authorId: 'inv-101',
        createdAt: '2026-08-14T16:00:00.000Z',
      },
    ],
    statusTimeline: [
      {
        status: CaseStatus.ASSIGNED,
        title: 'Case Assigned as Urgent Priority',
        note: 'Assigned to Sarah Connor due to imminent workplace safety hazards.',
        updatedBy: 'Human Rights Review Board',
        timestamp: '2026-08-13T10:00:00.000Z',
      },
      {
        status: CaseStatus.UNDER_INVESTIGATION,
        title: 'Inspection Authorized',
        note: 'Site inspection warrant secured from regional magistrate.',
        updatedBy: 'Sarah Connor',
        timestamp: '2026-08-14T08:00:00.000Z',
      },
      {
        status: CaseStatus.EVIDENCE_COLLECTION,
        title: 'Documentary & Physical Evidence Gathered',
        note: 'Retrieved shift rosters and photographic evidence of fire hazard violations.',
        updatedBy: 'Sarah Connor',
        timestamp: '2026-08-14T17:00:00.000Z',
      },
    ],
    findings: 'Clear violations of National Labor Code and Occupational Health Standards confirmed.',
    createdAt: '2026-08-13T10:00:00.000Z',
    updatedAt: '2026-08-14T17:00:00.000Z',
  },
  {
    _id: 'case-003',
    caseNumber: 'CASE-2026-031298',
    complaintId: 'JN-2026-118822',
    title: 'Arbitrary Detention of Student Journalist',
    description: 'Campus reporter detained without formal charges or access to legal counsel after filming public university protest.',
    category: ComplaintCategory.ARBITRARY_DETENTION,
    priority: CasePriority.HIGH,
    status: CaseStatus.REPORT_SUBMITTED,
    assignedInvestigatorId: 'inv-101',
    assignedInvestigatorName: 'Lead Investigator Sarah Connor',
    assignedInvestigatorEmail: 'investigator@justicenow.org',
    assignedBy: 'Legal Defense Committee',
    assignedAt: '2026-08-05T09:00:00.000Z',
    complaintDetails: {
      trackingNumber: 'JN-2026-118822',
      citizenName: 'Maya Silva',
      citizenEmail: 'maya.s@press.org',
      citizenPhone: '+94 71 555 9876',
      isAnonymous: false,
      incidentDate: '2026-08-04T16:00:00.000Z',
      incidentLocation: {
        city: 'Galle',
        address: 'University Main Gate, Fort Road',
      },
      description: 'Campus reporter detained without formal charges or access to legal counsel after filming public university protest.',
      witnessInfo: 'Faculty members and university student union executive members',
    },
    evidence: [
      {
        id: 'ev-301',
        name: 'press_id_card.jpg',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80',
        size: 920000,
        uploadedAt: '2026-08-05T10:00:00.000Z',
        uploadedBy: 'Citizen',
      },
      {
        id: 'ev-302',
        name: 'final_investigation_report.pdf',
        type: 'document',
        url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        size: 1540000,
        uploadedAt: '2026-08-18T15:30:00.000Z',
        uploadedBy: 'Investigator Sarah Connor',
        description: 'Comprehensive 12-page investigation report submitted to Senior Legal Counsel',
      },
    ],
    investigationNotes: [
      {
        id: 'note-301',
        note: 'Secured unconditional release of student journalist upon presenting preliminary findings to Magistrate.',
        authorName: 'Sarah Connor',
        authorId: 'inv-101',
        createdAt: '2026-08-06T11:00:00.000Z',
      },
    ],
    statusTimeline: [
      {
        status: CaseStatus.ASSIGNED,
        title: 'Assigned to Case Unit',
        note: 'Assigned for immediate intervention.',
        updatedBy: 'Admin Vance',
        timestamp: '2026-08-05T09:00:00.000Z',
      },
      {
        status: CaseStatus.REPORT_SUBMITTED,
        title: 'Final Report Submitted for Judicial Review',
        note: 'Investigation concluded with full evidence dossier.',
        updatedBy: 'Sarah Connor',
        timestamp: '2026-08-18T15:30:00.000Z',
      },
    ],
    findings: 'Detention was arbitrary with zero legal grounds. Recommended official apology and compensation.',
    createdAt: '2026-08-05T09:00:00.000Z',
    updatedAt: '2026-08-18T15:30:00.000Z',
  },
  {
    _id: 'case-004',
    caseNumber: 'CASE-2026-019941',
    complaintId: 'JN-2026-092211',
    title: 'Disability Discrimination in Municipal Services',
    description: 'Wheelchair user denied access to public civic center registry and refused reasonable accommodation by municipal clerk.',
    category: ComplaintCategory.DISCRIMINATION,
    priority: CasePriority.MEDIUM,
    status: CaseStatus.RESOLVED,
    assignedInvestigatorId: 'inv-101',
    assignedInvestigatorName: 'Lead Investigator Sarah Connor',
    assignedInvestigatorEmail: 'investigator@justicenow.org',
    assignedBy: 'Admin Vance',
    assignedAt: '2026-07-20T10:00:00.000Z',
    complaintDetails: {
      trackingNumber: 'JN-2026-092211',
      citizenName: 'Sunil Perera',
      citizenEmail: 'sunil.p@gmail.com',
      citizenPhone: '+94 77 999 1122',
      isAnonymous: false,
      incidentDate: '2026-07-18T11:00:00.000Z',
      incidentLocation: {
        city: 'Matara',
        address: 'Municipal Council Offices, Beach Road',
      },
      description: 'Wheelchair user denied access to public civic center registry and refused reasonable accommodation by municipal clerk.',
    },
    evidence: [],
    investigationNotes: [
      {
        id: 'note-401',
        note: 'Council agreed to construct ramp and install accessible service counter within 30 days.',
        authorName: 'Sarah Connor',
        authorId: 'inv-101',
        createdAt: '2026-07-28T14:00:00.000Z',
      },
    ],
    statusTimeline: [
      {
        status: CaseStatus.ASSIGNED,
        title: 'Case Assigned',
        note: 'Assigned to Sarah Connor.',
        updatedBy: 'Admin Vance',
        timestamp: '2026-07-20T10:00:00.000Z',
      },
      {
        status: CaseStatus.RESOLVED,
        title: 'Settlement Reached & Ramp Installed',
        note: 'Council completed accessibility upgrades and issued written apology.',
        updatedBy: 'Sarah Connor',
        timestamp: '2026-08-01T10:00:00.000Z',
      },
    ],
    findings: 'Case resolved successfully through mediation with Municipal Commissioner.',
    createdAt: '2026-07-20T10:00:00.000Z',
    updatedAt: '2026-08-01T10:00:00.000Z',
  },
  // Example of an unassigned / other investigator's case for testing authorization boundaries
  {
    _id: 'case-005',
    caseNumber: 'CASE-2026-099412',
    complaintId: 'JN-2026-778899',
    title: 'Hospital Malpractice & Negligence Case',
    description: 'Patient denied emergency admission due to lack of upfront cash payment.',
    category: ComplaintCategory.OTHER,
    priority: CasePriority.URGENT,
    status: CaseStatus.UNDER_INVESTIGATION,
    assignedInvestigatorId: 'inv-999', // Different investigator
    assignedInvestigatorName: 'Officer David Kim',
    assignedInvestigatorEmail: 'david.kim@justicenow.org',
    assignedBy: 'Admin Vance',
    assignedAt: '2026-08-18T10:00:00.000Z',
    complaintDetails: {
      trackingNumber: 'JN-2026-778899',
      citizenName: 'Kamal Bandara',
      citizenEmail: 'kamal.b@gmail.com',
      citizenPhone: '+94 77 444 8888',
      isAnonymous: false,
      incidentDate: '2026-08-17T20:00:00.000Z',
      incidentLocation: {
        city: 'Jaffna',
        address: 'General Hospital Road',
      },
      description: 'Emergency admission denied to accident victim.',
    },
    evidence: [],
    investigationNotes: [],
    statusTimeline: [
      {
        status: CaseStatus.ASSIGNED,
        title: 'Assigned to Officer Kim',
        note: 'Assigned to David Kim.',
        updatedBy: 'Admin Vance',
        timestamp: '2026-08-18T10:00:00.000Z',
      },
    ],
    createdAt: '2026-08-18T10:00:00.000Z',
    updatedAt: '2026-08-18T10:00:00.000Z',
  },
  {
    _id: 'case-005',
    caseNumber: 'CASE-2026-901234',
    complaintId: 'JN-2026-901234',
    title: 'Bribery & Extortion at Land Registry Office',
    description: 'Public official demanded illegal cash payment to release rightful property deed.',
    category: ComplaintCategory.OTHER,
    priority: CasePriority.HIGH,
    status: CaseStatus.ASSIGNED,
    assignedInvestigatorId: '',
    assignedInvestigatorName: '',
    assignedInvestigatorEmail: '',
    assignedBy: 'Administrator',
    assignedAt: '2026-08-20T11:00:00.000Z',
    complaintDetails: {
      trackingNumber: 'JN-2026-901234',
      citizenName: 'Sunil Weerasinghe',
      citizenEmail: 'sunil.w@example.com',
      citizenPhone: '+94 71 555 1234',
      isAnonymous: false,
      incidentDate: '2026-08-19T10:30:00.000Z',
      incidentLocation: {
        city: 'Galle',
        address: 'District Land Registry, Fort Gate',
      },
      description: 'Official refused registration stamps unless Rs. 50,000 cash bribe was handed over.',
    },
    evidence: [],
    investigationNotes: [],
    statusTimeline: [
      {
        status: CaseStatus.ASSIGNED,
        title: 'Complaint Approved - Awaiting Investigator Assignment',
        note: 'Approved by Admin. Ready for investigator assignment.',
        updatedBy: 'Admin Vance',
        timestamp: '2026-08-20T11:00:00.000Z',
      },
    ],
    createdAt: '2026-08-20T11:00:00.000Z',
    updatedAt: '2026-08-20T11:00:00.000Z',
  },
  {
    _id: 'case-006',
    caseNumber: 'CASE-2026-112233',
    complaintId: 'JN-2026-112233',
    title: 'Illegal Environmental Dumping in Forest Reserve',
    description: 'Commercial entity discharging untreated toxic effluent into public water stream.',
    category: ComplaintCategory.OTHER,
    priority: CasePriority.URGENT,
    status: CaseStatus.ASSIGNED,
    assignedInvestigatorId: '',
    assignedInvestigatorName: '',
    assignedInvestigatorEmail: '',
    assignedBy: 'Administrator',
    assignedAt: '2026-08-22T08:00:00.000Z',
    complaintDetails: {
      trackingNumber: 'JN-2026-112233',
      citizenName: 'Anonymous Citizen',
      isAnonymous: true,
      incidentDate: '2026-08-21T16:00:00.000Z',
      incidentLocation: {
        city: 'Ratnapura',
        address: 'Sinharaja Buffer Border',
      },
      description: 'Trucks dumping chemical barrels into water stream near village.',
    },
    evidence: [],
    investigationNotes: [],
    statusTimeline: [
      {
        status: CaseStatus.ASSIGNED,
        title: 'Complaint Approved - Awaiting Investigator Assignment',
        note: 'High urgency environmental case approved.',
        updatedBy: 'Admin Vance',
        timestamp: '2026-08-22T08:00:00.000Z',
      },
    ],
    createdAt: '2026-08-22T08:00:00.000Z',
    updatedAt: '2026-08-22T08:00:00.000Z',
  },
];

let localCasesStore: Case[] = [...INITIAL_MOCK_CASES];

export const CaseService = {
  async getAllCases(status?: CaseStatus): Promise<Case[]> {
    try {
      const url = status ? `/cases/all?status=${status}` : '/cases/all';
      const response = await api.get(url);
      if (response.data && response.data.data) {
        return response.data.data;
      }
    } catch (err) {
      console.log('Loading all cases from backend failed, using mock store:', err);
    }

    let filtered = [...localCasesStore];
    if (status) {
      filtered = filtered.filter((c) => c.status === status);
    }
    return filtered;
  },

  async getAssignedCases(status?: CaseStatus): Promise<Case[]> {
    try {
      const url = status ? `/cases/assigned?status=${status}` : '/cases/assigned';
      const response = await api.get(url);
      if (response.data && response.data.data) {
        return response.data.data;
      }
    } catch (err) {
      console.log('Loading local mock assigned cases:', err);
    }

    let filtered = [...localCasesStore];
    if (status) {
      filtered = filtered.filter((c) => c.status === status);
    }
    return filtered;
  },

  async getCaseById(idOrCaseNumber: string): Promise<Case | null> {
    try {
      const response = await api.get(`/cases/${idOrCaseNumber}`);
      if (response.data && response.data.data) {
        return response.data.data;
      }
    } catch (err) {
      console.log('Searching local store for case:', err);
    }

    const found = localCasesStore.find(
      (c) => c._id === idOrCaseNumber || c.caseNumber === idOrCaseNumber
    );
    return found ? { ...found } : null;
  },

  async updateCaseStatus(
    idOrCaseNumber: string,
    input: UpdateCaseStatusInput,
    currentUserId?: string,
    userRole?: string
  ): Promise<Case> {
    try {
      const response = await api.patch(`/cases/${idOrCaseNumber}/status`, input);
      if (response.data && response.data.data) {
        // Update local store as well
        const updated = response.data.data;
        localCasesStore = localCasesStore.map((c) =>
          c._id === updated._id || c.caseNumber === updated.caseNumber ? updated : c
        );
        return updated;
      }
    } catch (err: any) {
      if (err.response?.status === 403) {
        throw new Error(err.response.data?.message || 'Unauthorized to modify this case');
      }
      console.log('Updating local mock case status:', err);
    }

    // Mock fallback update
    const index = localCasesStore.findIndex(
      (c) => c._id === idOrCaseNumber || c.caseNumber === idOrCaseNumber
    );

    if (index === -1) {
      throw new Error('Case not found');
    }

    const caseItem = localCasesStore[index];

    // Check authorization in mock mode
    if (
      currentUserId &&
      userRole !== 'ADMIN' &&
      caseItem.assignedInvestigatorId !== currentUserId &&
      caseItem.assignedInvestigatorId !== 'inv-101' // Default test investigator ID
    ) {
      throw new Error('Forbidden: You are not authorized to modify this case because it is not assigned to you.');
    }

    const updatedTimeline = [
      ...caseItem.statusTimeline,
      {
        status: input.status,
        title: `Status Changed to ${input.status.replace(/_/g, ' ')}`,
        note: input.note || `Status updated to ${input.status}`,
        updatedBy: 'Investigator',
        timestamp: new Date().toISOString(),
      },
    ];

    const updatedCase: Case = {
      ...caseItem,
      status: input.status,
      findings: input.findings !== undefined ? input.findings : caseItem.findings,
      statusTimeline: updatedTimeline,
      updatedAt: new Date().toISOString(),
    };

    localCasesStore[index] = updatedCase;
    return updatedCase;
  },

  async addEvidence(
    idOrCaseNumber: string,
    input: AddEvidenceInput,
    currentUserId?: string,
    userRole?: string
  ): Promise<Case> {
    try {
      const response = await api.post(`/cases/${idOrCaseNumber}/evidence`, input);
      if (response.data && response.data.data) {
        const updated = response.data.data;
        localCasesStore = localCasesStore.map((c) =>
          c._id === updated._id || c.caseNumber === updated.caseNumber ? updated : c
        );
        return updated;
      }
    } catch (err: any) {
      if (err.response?.status === 403) {
        throw new Error(err.response.data?.message || 'Unauthorized to modify this case');
      }
      console.log('Adding evidence to local mock case:', err);
    }

    const index = localCasesStore.findIndex(
      (c) => c._id === idOrCaseNumber || c.caseNumber === idOrCaseNumber
    );

    if (index === -1) throw new Error('Case not found');

    const caseItem = localCasesStore[index];
    if (
      currentUserId &&
      userRole !== 'ADMIN' &&
      caseItem.assignedInvestigatorId !== currentUserId &&
      caseItem.assignedInvestigatorId !== 'inv-101'
    ) {
      throw new Error('Forbidden: You cannot attach evidence to a case not assigned to you.');
    }

    const newEvidence = {
      id: `ev-${Date.now()}`,
      name: input.name,
      type: input.type,
      url: input.url,
      size: input.size || 1024000,
      uploadedAt: new Date().toISOString(),
      uploadedBy: 'Investigator',
      description: input.description,
    };

    const updatedCase: Case = {
      ...caseItem,
      evidence: [newEvidence, ...caseItem.evidence],
      updatedAt: new Date().toISOString(),
    };

    localCasesStore[index] = updatedCase;
    return updatedCase;
  },

  async addInvestigationNote(
    idOrCaseNumber: string,
    input: AddNoteInput,
    currentUserId?: string,
    userRole?: string
  ): Promise<Case> {
    try {
      const response = await api.post(`/cases/${idOrCaseNumber}/notes`, input);
      if (response.data && response.data.data) {
        const updated = response.data.data;
        localCasesStore = localCasesStore.map((c) =>
          c._id === updated._id || c.caseNumber === updated.caseNumber ? updated : c
        );
        return updated;
      }
    } catch (err: any) {
      if (err.response?.status === 403) {
        throw new Error(err.response.data?.message || 'Unauthorized to modify this case');
      }
      console.log('Adding note to local mock case:', err);
    }

    const index = localCasesStore.findIndex(
      (c) => c._id === idOrCaseNumber || c.caseNumber === idOrCaseNumber
    );

    if (index === -1) throw new Error('Case not found');

    const caseItem = localCasesStore[index];
    if (
      currentUserId &&
      userRole !== 'ADMIN' &&
      caseItem.assignedInvestigatorId !== currentUserId &&
      caseItem.assignedInvestigatorId !== 'inv-101'
    ) {
      throw new Error('Forbidden: You cannot add investigation notes to a case not assigned to you.');
    }

    const newNote = {
      id: `note-${Date.now()}`,
      note: input.note,
      authorName: 'Investigator',
      authorId: currentUserId || 'inv-101',
      createdAt: new Date().toISOString(),
    };

    const updatedCase: Case = {
      ...caseItem,
      investigationNotes: [newNote, ...caseItem.investigationNotes],
      updatedAt: new Date().toISOString(),
    };

    localCasesStore[index] = updatedCase;
    return updatedCase;
  },

  async getMetrics(): Promise<any> {
    try {
      const response = await api.get('/cases/metrics');
      if (response.data && response.data.data) {
        return response.data.data;
      }
    } catch (err) {
      console.log('Calculating local mock metrics:', err);
    }

    const total = localCasesStore.length;
    const underInvestigation = localCasesStore.filter((c) => c.status === CaseStatus.UNDER_INVESTIGATION).length;
    const evidenceCollection = localCasesStore.filter((c) => c.status === CaseStatus.EVIDENCE_COLLECTION).length;
    const reportSubmitted = localCasesStore.filter((c) => c.status === CaseStatus.REPORT_SUBMITTED).length;
    const resolved = localCasesStore.filter((c) => c.status === CaseStatus.RESOLVED).length;

    return {
      total,
      active: underInvestigation + evidenceCollection + reportSubmitted,
      underInvestigation,
      evidenceCollection,
      reportSubmitted,
      resolved,
    };
  },

  async getAvailableInvestigators(): Promise<Investigator[]> {
    try {
      const response = await api.get('/cases/investigators');
      if (response.data && response.data.data) {
        return response.data.data;
      }
    } catch (err) {
      console.log('Loading local mock investigators:', err);
    }

    // Compute active counts from local store
    return INITIAL_MOCK_INVESTIGATORS.map((inv) => {
      const activeCount = localCasesStore.filter(
        (c) =>
          c.assignedInvestigatorId === inv._id &&
          c.status !== CaseStatus.RESOLVED &&
          c.status !== CaseStatus.CLOSED
      ).length;

      return {
        ...inv,
        activeCasesCount: activeCount,
      };
    });
  },

  async assignInvestigator(
    idOrCaseNumber: string,
    input: AssignInvestigatorInput
  ): Promise<Case> {
    try {
      const response = await api.patch(`/cases/${idOrCaseNumber}/assign`, input);
      if (response.data && response.data.data) {
        const updated = response.data.data;
        localCasesStore = localCasesStore.map((c) =>
          c._id === updated._id || c.caseNumber === updated.caseNumber ? updated : c
        );
        return updated;
      }
    } catch (err) {
      console.log('Assigning investigator locally in mock store:', err);
    }

    const index = localCasesStore.findIndex(
      (c) => c._id === idOrCaseNumber || c.caseNumber === idOrCaseNumber
    );

    if (index === -1) throw new Error('Case not found');

    const caseItem = localCasesStore[index];
    const previousName = caseItem.assignedInvestigatorName;

    const assignmentNote = input.note
      ? `Case assigned to ${input.investigatorName} by Administrator. Note: ${input.note}`
      : previousName && previousName !== input.investigatorName
      ? `Case reassigned from ${previousName} to ${input.investigatorName} by Administrator.`
      : `Case assigned to ${input.investigatorName} by Administrator.`;

    const updatedTimeline = [
      ...caseItem.statusTimeline,
      {
        status: CaseStatus.ASSIGNED,
        title: 'Investigator Assigned',
        note: assignmentNote,
        updatedBy: 'Administrator',
        timestamp: new Date().toISOString(),
      },
    ];

    const updatedCase: Case = {
      ...caseItem,
      assignedInvestigatorId: input.investigatorId,
      assignedInvestigatorName: input.investigatorName,
      assignedInvestigatorEmail: input.investigatorEmail || '',
      assignedBy: 'Administrator',
      assignedAt: new Date().toISOString(),
      status:
        caseItem.status === CaseStatus.RESOLVED || caseItem.status === CaseStatus.CLOSED
          ? CaseStatus.ASSIGNED
          : caseItem.status,
      priority: input.priority || caseItem.priority,
      statusTimeline: updatedTimeline,
      updatedAt: new Date().toISOString(),
    };

    localCasesStore[index] = updatedCase;
    return updatedCase;
  },

  async assignComplaintToInvestigator(
    complaintId: string,
    input: AssignInvestigatorInput
  ): Promise<Case> {
    try {
      const response = await api.post(`/cases/from-complaint/${complaintId}/assign`, input);
      if (response.data && response.data.data) {
        const newCase = response.data.data;
        localCasesStore.unshift(newCase);
        return newCase;
      }
    } catch (err) {
      console.log('Converting complaint and assigning investigator locally in mock store:', err);
    }

    const caseNumber = `CASE-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const newCase: Case = {
      _id: `case-${Date.now()}`,
      caseNumber,
      complaintId,
      title: `Investigation Ref #${caseNumber}`,
      description: `Formal investigation initiated for complaint ${complaintId}.`,
      category: ComplaintCategory.OTHER,
      priority: input.priority || CasePriority.MEDIUM,
      status: CaseStatus.ASSIGNED,
      assignedInvestigatorId: input.investigatorId,
      assignedInvestigatorName: input.investigatorName,
      assignedInvestigatorEmail: input.investigatorEmail || '',
      assignedBy: 'Administrator',
      assignedAt: new Date().toISOString(),
      complaintDetails: {
        trackingNumber: complaintId,
        citizenName: 'Citizen',
        isAnonymous: false,
        incidentDate: new Date().toISOString(),
        incidentLocation: { city: 'Colombo', address: 'Main St' },
        description: 'Case converted from approved complaint.',
      },
      evidence: [],
      investigationNotes: input.note
        ? [
            {
              id: `note-${Date.now()}`,
              note: `Initial instructions: ${input.note}`,
              authorName: 'Administrator',
              authorId: 'admin-001',
              createdAt: new Date().toISOString(),
            },
          ]
        : [],
      statusTimeline: [
        {
          status: CaseStatus.ASSIGNED,
          title: 'Case Created and Investigator Assigned',
          note: `Case assigned to ${input.investigatorName} by Administrator.${input.note ? ` Notes: ${input.note}` : ''}`,
          updatedBy: 'Administrator',
          timestamp: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    localCasesStore.unshift(newCase);
    return newCase;
  },
};
