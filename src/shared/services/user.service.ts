import api from './api';

export interface InvestigatorApplicant {
  _id: string;
  firebaseUid: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  isProfileComplete?: boolean;
  createdAt: string;
  specialization?: string;
}

const INITIAL_MOCK_APPLICANTS: InvestigatorApplicant[] = [
  {
    _id: 'app-001',
    firebaseUid: 'inv-uid-alex',
    firstName: 'Alex',
    lastName: 'Murphy',
    name: 'Alex Murphy',
    email: 'alex.murphy@justicenow.org',
    phone: '+94 77 987 6543',
    role: 'INVESTIGATOR',
    status: 'PENDING',
    isProfileComplete: true,
    createdAt: '2026-08-23T10:00:00.000Z',
    specialization: 'Civil Liberties & Public Oversight',
  },
  {
    _id: 'app-002',
    firebaseUid: 'inv-uid-chamari',
    firstName: 'Chamari',
    lastName: 'Perera',
    name: 'Chamari Perera',
    email: 'chamari.p@justicenow.org',
    phone: '+94 71 888 4321',
    role: 'INVESTIGATOR',
    status: 'PENDING',
    isProfileComplete: true,
    createdAt: '2026-08-24T08:30:00.000Z',
    specialization: 'Gender-Based Rights & Family Justice',
  },
  {
    _id: 'app-003',
    firebaseUid: 'IdtZ4a3gbENFMZyijPWt8627KNJ3',
    firstName: 'Kusa',
    lastName: 'Paba',
    name: 'Kusa Paba',
    email: 'kusapaba20@gmail.com',
    phone: '+94 70 555 1234',
    role: 'INVESTIGATOR',
    status: 'ACTIVE',
    isProfileComplete: true,
    createdAt: '2026-08-24T15:00:00.000Z',
    specialization: 'General Field Investigations',
  },
  {
    _id: 'app-004',
    firebaseUid: 'inv-101',
    firstName: 'Sarah',
    lastName: 'Connor',
    name: 'Sarah Connor',
    email: 'sarah.connor@justicenow.org',
    phone: '+94 77 112 2334',
    role: 'INVESTIGATOR',
    status: 'ACTIVE',
    isProfileComplete: true,
    createdAt: '2026-08-15T09:00:00.000Z',
    specialization: 'Civil Rights & Police Accountability',
  },
];

let localApplicantsStore: InvestigatorApplicant[] = [...INITIAL_MOCK_APPLICANTS];

export const UserService = {
  async getPendingInvestigators(): Promise<InvestigatorApplicant[]> {
    try {
      const response = await api.get('/users/investigators/pending');
      if (response.data && response.data.data) {
        return response.data.data.map((u: any) => ({
          ...u,
          name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Investigator',
        }));
      }
    } catch (err) {
      console.log('Loading local mock pending investigators:', err);
    }

    return localApplicantsStore.filter((u) => u.status === 'PENDING');
  },

  async getAllInvestigators(): Promise<InvestigatorApplicant[]> {
    try {
      const response = await api.get('/users/investigators/all');
      if (response.data && response.data.data) {
        return response.data.data.map((u: any) => ({
          ...u,
          name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Investigator',
        }));
      }
    } catch (err) {
      console.log('Loading local mock all investigators:', err);
    }

    return [...localApplicantsStore];
  },

  async approveInvestigator(idOrUid: string): Promise<InvestigatorApplicant> {
    try {
      const response = await api.patch(`/users/investigators/${idOrUid}/approve`);
      if (response.data && response.data.data) {
        const updated = response.data.data;
        localApplicantsStore = localApplicantsStore.map((u) =>
          u._id === updated._id || u.firebaseUid === updated.firebaseUid
            ? { ...u, status: 'ACTIVE' }
            : u
        );
        return {
          ...updated,
          name: `${updated.firstName || ''} ${updated.lastName || ''}`.trim() || 'Investigator',
        };
      }
    } catch (err) {
      console.log('Approving investigator locally in mock store:', err);
    }

    const index = localApplicantsStore.findIndex(
      (u) => u._id === idOrUid || u.firebaseUid === idOrUid
    );

    if (index !== -1) {
      localApplicantsStore[index] = {
        ...localApplicantsStore[index],
        status: 'ACTIVE',
      };
      return localApplicantsStore[index];
    }

    throw new Error('Investigator application not found');
  },

  async rejectInvestigator(idOrUid: string): Promise<InvestigatorApplicant> {
    try {
      const response = await api.patch(`/users/investigators/${idOrUid}/reject`);
      if (response.data && response.data.data) {
        const updated = response.data.data;
        localApplicantsStore = localApplicantsStore.map((u) =>
          u._id === updated._id || u.firebaseUid === updated.firebaseUid
            ? { ...u, status: 'INACTIVE' }
            : u
        );
        return {
          ...updated,
          name: `${updated.firstName || ''} ${updated.lastName || ''}`.trim() || 'Investigator',
        };
      }
    } catch (err) {
      console.log('Rejecting investigator locally in mock store:', err);
    }

    const index = localApplicantsStore.findIndex(
      (u) => u._id === idOrUid || u.firebaseUid === idOrUid
    );

    if (index !== -1) {
      localApplicantsStore[index] = {
        ...localApplicantsStore[index],
        status: 'INACTIVE',
      };
      return localApplicantsStore[index];
    }

    throw new Error('Investigator application not found');
  },
};
