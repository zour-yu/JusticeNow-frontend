import { ComplaintCategory } from './complaint.types';

export enum CaseStatus {
  ASSIGNED = 'ASSIGNED',
  UNDER_INVESTIGATION = 'UNDER_INVESTIGATION',
  EVIDENCE_COLLECTION = 'EVIDENCE_COLLECTION',
  REPORT_SUBMITTED = 'REPORT_SUBMITTED',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export enum CasePriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export interface CaseEvidence {
  id: string;
  name: string;
  type: 'image' | 'document' | 'audio' | 'video' | string;
  url: string;
  size?: number;
  uploadedAt: string;
  uploadedBy?: string;
  description?: string;
}

export interface InvestigationNote {
  id: string;
  note: string;
  authorName: string;
  authorId: string;
  createdAt: string;
}

export interface CaseTimelineEvent {
  status: CaseStatus;
  title: string;
  note: string;
  updatedBy: string;
  timestamp: string;
}

export interface ComplaintSnapshot {
  trackingNumber: string;
  citizenName: string;
  citizenEmail?: string;
  citizenPhone?: string;
  isAnonymous: boolean;
  incidentDate: string;
  incidentLocation: {
    city: string;
    address: string;
    details?: string;
  };
  description: string;
  witnessInfo?: string;
}

export interface Case {
  _id: string;
  caseNumber: string;
  complaintId: string;
  title: string;
  description: string;
  category: ComplaintCategory;
  priority: CasePriority;
  status: CaseStatus;
  assignedInvestigatorId: string;
  assignedInvestigatorName: string;
  assignedInvestigatorEmail?: string;
  assignedBy: string;
  assignedAt: string;
  complaintDetails: ComplaintSnapshot;
  evidence: CaseEvidence[];
  investigationNotes: InvestigationNote[];
  statusTimeline: CaseTimelineEvent[];
  findings?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AddEvidenceInput {
  name: string;
  type: 'image' | 'document' | 'audio' | 'video' | string;
  url: string;
  size?: number;
  description?: string;
}

export interface AddNoteInput {
  note: string;
}

export interface UpdateCaseStatusInput {
  status: CaseStatus;
  note?: string;
  findings?: string;
}

export interface Investigator {
  _id: string;
  firebaseUid?: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone?: string;
  status: string;
  activeCasesCount: number;
  specialization?: string;
}

export interface AssignInvestigatorInput {
  investigatorId: string;
  investigatorName: string;
  investigatorEmail?: string;
  note?: string;
  priority?: CasePriority;
}
