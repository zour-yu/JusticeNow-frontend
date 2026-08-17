export enum ComplaintCategory {
  POLICE_MISCONDUCT = 'POLICE_MISCONDUCT',
  DISCRIMINATION = 'DISCRIMINATION',
  ARBITRARY_DETENTION = 'ARBITRARY_DETENTION',
  FREEDOM_OF_EXPRESSION = 'FREEDOM_OF_EXPRESSION',
  LABOR_RIGHTS = 'LABOR_RIGHTS',
  GENDER_BASED_VIOLENCE = 'GENDER_BASED_VIOLENCE',
  CHILD_RIGHTS = 'CHILD_RIGHTS',
  OTHER = 'OTHER',
}

export enum ComplaintStatus {
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CONVERTED_TO_CASE = 'CONVERTED_TO_CASE',
}

export enum ComplaintPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export interface LocationDetails {
  city: string;
  address: string;
  details?: string;
}

export interface EvidenceItem {
  id: string;
  name: string;
  type: 'image' | 'document' | 'audio' | 'video' | string;
  url: string;
  size?: number;
  uploadedAt?: string;
}

export interface TimelineEvent {
  status: ComplaintStatus;
  title: string;
  note: string;
  updatedBy?: string;
  timestamp: string;
}

export interface Complaint {
  _id?: string;
  trackingNumber: string;
  citizenId: string;
  citizenName: string;
  citizenEmail: string;
  citizenPhone?: string;
  isAnonymous: boolean;
  category: ComplaintCategory;
  title: string;
  description: string;
  incidentDate: string;
  incidentLocation: LocationDetails;
  witnessInfo?: string;
  evidence: EvidenceItem[];
  status: ComplaintStatus;
  priority: ComplaintPriority;
  statusTimeline: TimelineEvent[];
  assignedInvestigatorId?: string;
  caseId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateComplaintInput {
  category: ComplaintCategory;
  title: string;
  description: string;
  incidentDate: string;
  incidentLocation: LocationDetails;
  witnessInfo?: string;
  isAnonymous?: boolean;
  evidence?: EvidenceItem[];
}

export interface CategoryInfo {
  key: ComplaintCategory;
  label: string;
  icon: string;
  description: string;
  color: string;
}
