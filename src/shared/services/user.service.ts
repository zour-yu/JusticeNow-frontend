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

export interface ManagedUser {
  _id: string;
  firebaseUid: string;
  firstName: string;
  lastName: string;
  name?: string;
  email: string;
  phone: string;
  role: 'CITIZEN' | 'INVESTIGATOR' | 'ADMIN';
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'INACTIVE';
  isProfileComplete?: boolean;
  createdAt?: string;
  updatedAt?: string;
  specialization?: string;
}

const INITIAL_MOCK_USERS: ManagedUser[] = [
  {
    _id: 'usr-001',
    firebaseUid: 'admin-uid-001',
    firstName: 'System',
    lastName: 'Admin',
    name: 'System Admin',
    email: 'admin@justicenow.org',
    phone: '+94 77 100 0001',
    role: 'ADMIN',
    status: 'ACTIVE',
    isProfileComplete: true,
    createdAt: '2026-01-10T08:00:00.000Z',
  },
  {
    _id: 'usr-002',
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
  {
    _id: 'usr-003',
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
    _id: 'usr-004',
    firebaseUid: 'cit-uid-kasun',
    firstName: 'Kasun',
    lastName: 'Perera',
    name: 'Kasun Perera',
    email: 'kasun.perera@gmail.com',
    phone: '+94 71 234 5678',
    role: 'CITIZEN',
    status: 'ACTIVE',
    isProfileComplete: true,
    createdAt: '2026-07-12T14:20:00.000Z',
  },
  {
    _id: 'usr-005',
    firebaseUid: 'cit-uid-chamari',
    firstName: 'Chamari',
    lastName: 'Silva',
    name: 'Chamari Silva',
    email: 'chamari.silva@outlook.com',
    phone: '+94 70 876 5432',
    role: 'CITIZEN',
    status: 'ACTIVE',
    isProfileComplete: true,
    createdAt: '2026-07-28T11:45:00.000Z',
  },
  {
    _id: 'usr-006',
    firebaseUid: 'cit-uid-dinesh',
    firstName: 'Dinesh',
    lastName: 'Jayawardena',
    name: 'Dinesh Jayawardena',
    email: 'dinesh.j@gmail.com',
    phone: '+94 72 345 6789',
    role: 'CITIZEN',
    status: 'INACTIVE',
    isProfileComplete: false,
    createdAt: '2026-06-04T16:10:00.000Z',
  },
  {
    _id: 'usr-007',
    firebaseUid: 'inv-uid-marcus',
    firstName: 'Marcus',
    lastName: 'Vance',
    name: 'Marcus Vance',
    email: 'marcus.v@justicenow.org',
    phone: '+94 77 444 5555',
    role: 'INVESTIGATOR',
    status: 'SUSPENDED',
    isProfileComplete: true,
    createdAt: '2026-05-18T09:30:00.000Z',
    specialization: 'Financial Fraud & Corruption',
  },
];

let localUsersStore: ManagedUser[] = [...INITIAL_MOCK_USERS];

export const UserService = {
  // ── USER MANAGEMENT ENDPOINTS FOR ADMIN ──

  async getAllUsers(filters?: {
    role?: string;
    status?: string;
    search?: string;
  }): Promise<ManagedUser[]> {
    try {
      const params: any = {};
      if (filters?.role && filters.role !== 'ALL') params.role = filters.role;
      if (filters?.status && filters.status !== 'ALL') params.status = filters.status;
      if (filters?.search && filters.search.trim()) params.search = filters.search.trim();

      const response = await api.get('/users', { params });
      if (response.data && response.data.data) {
        return response.data.data.map((u: any) => ({
          ...u,
          name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'User',
        }));
      }
    } catch (err) {
      console.log('Loading local mock users (API fallback):', err);
    }

    // Fallback to local store with filtering
    let results = [...localUsersStore];
    if (filters?.role && filters.role !== 'ALL') {
      results = results.filter((u) => u.role === filters.role);
    }
    if (filters?.status && filters.status !== 'ALL') {
      results = results.filter((u) => u.status === filters.status);
    }
    if (filters?.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      results = results.filter(
        (u) =>
          u.name?.toLowerCase().includes(q) ||
          u.firstName?.toLowerCase().includes(q) ||
          u.lastName?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          u.phone?.toLowerCase().includes(q)
      );
    }
    return results;
  },

  async getUserById(id: string): Promise<ManagedUser> {
    try {
      const response = await api.get(`/users/${id}`);
      if (response.data && response.data.data) {
        const u = response.data.data;
        return {
          ...u,
          name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'User',
        };
      }
    } catch (err) {
      console.log('Loading user by id locally (API fallback):', err);
    }

    const found = localUsersStore.find((u) => u._id === id || u.firebaseUid === id);
    if (found) return found;
    throw new Error(`User not found with id: ${id}`);
  },

  async updateUser(
    id: string,
    updates: Partial<Pick<ManagedUser, 'firstName' | 'lastName' | 'phone' | 'role' | 'status'>>
  ): Promise<ManagedUser> {
    try {
      const response = await api.patch(`/users/${id}`, updates);
      if (response.data && response.data.data) {
        const updated = response.data.data;
        const mapped: ManagedUser = {
          ...updated,
          name: `${updated.firstName || ''} ${updated.lastName || ''}`.trim() || 'User',
        };
        localUsersStore = localUsersStore.map((u) =>
          u._id === mapped._id || u.firebaseUid === mapped.firebaseUid ? mapped : u
        );
        return mapped;
      }
    } catch (err) {
      console.log('Updating user locally in mock store:', err);
    }

    const index = localUsersStore.findIndex((u) => u._id === id || u.firebaseUid === id);
    if (index !== -1) {
      const existing = localUsersStore[index];
      const firstName = updates.firstName !== undefined ? updates.firstName : existing.firstName;
      const lastName = updates.lastName !== undefined ? updates.lastName : existing.lastName;
      const updated: ManagedUser = {
        ...existing,
        ...updates,
        firstName,
        lastName,
        name: `${firstName} ${lastName}`.trim(),
        updatedAt: new Date().toISOString(),
      };
      localUsersStore[index] = updated;
      return updated;
    }

    throw new Error('User not found');
  },

  async deactivateUser(id: string): Promise<ManagedUser> {
    try {
      const response = await api.patch(`/users/${id}/deactivate`);
      if (response.data && response.data.data) {
        const updated = response.data.data;
        const mapped: ManagedUser = {
          ...updated,
          name: `${updated.firstName || ''} ${updated.lastName || ''}`.trim() || 'User',
        };
        localUsersStore = localUsersStore.map((u) =>
          u._id === mapped._id || u.firebaseUid === mapped.firebaseUid ? mapped : u
        );
        return mapped;
      }
    } catch (err) {
      console.log('Deactivating user locally in mock store:', err);
    }

    return this.updateUser(id, { status: 'INACTIVE' });
  },

  async reactivateUser(id: string): Promise<ManagedUser> {
    try {
      const response = await api.patch(`/users/${id}/reactivate`);
      if (response.data && response.data.data) {
        const updated = response.data.data;
        const mapped: ManagedUser = {
          ...updated,
          name: `${updated.firstName || ''} ${updated.lastName || ''}`.trim() || 'User',
        };
        localUsersStore = localUsersStore.map((u) =>
          u._id === mapped._id || u.firebaseUid === mapped.firebaseUid ? mapped : u
        );
        return mapped;
      }
    } catch (err) {
      console.log('Reactivating user locally in mock store:', err);
    }

    return this.updateUser(id, { status: 'ACTIVE' });
  },

  // ── INVESTIGATOR APPLICATION ENDPOINTS ──

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

    return localUsersStore
      .filter((u) => u.role === 'INVESTIGATOR' && u.status === 'PENDING')
      .map((u) => ({
        ...u,
        name: u.name || `${u.firstName} ${u.lastName}`,
        createdAt: u.createdAt || new Date().toISOString(),
      }));
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

    return localUsersStore
      .filter((u) => u.role === 'INVESTIGATOR')
      .map((u) => ({
        ...u,
        name: u.name || `${u.firstName} ${u.lastName}`,
        createdAt: u.createdAt || new Date().toISOString(),
      }));
  },

  async approveInvestigator(idOrUid: string): Promise<InvestigatorApplicant> {
    try {
      const response = await api.patch(`/users/investigators/${idOrUid}/approve`);
      if (response.data && response.data.data) {
        const updated = response.data.data;
        localUsersStore = localUsersStore.map((u) =>
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

    const index = localUsersStore.findIndex(
      (u) => u._id === idOrUid || u.firebaseUid === idOrUid
    );

    if (index !== -1) {
      localUsersStore[index] = {
        ...localUsersStore[index],
        status: 'ACTIVE',
      };
      const user = localUsersStore[index];
      return {
        ...user,
        name: user.name || `${user.firstName} ${user.lastName}`,
        createdAt: user.createdAt || new Date().toISOString(),
      };
    }

    throw new Error('Investigator application not found');
  },

  async rejectInvestigator(idOrUid: string): Promise<InvestigatorApplicant> {
    try {
      const response = await api.patch(`/users/investigators/${idOrUid}/reject`);
      if (response.data && response.data.data) {
        const updated = response.data.data;
        localUsersStore = localUsersStore.map((u) =>
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

    const index = localUsersStore.findIndex(
      (u) => u._id === idOrUid || u.firebaseUid === idOrUid
    );

    if (index !== -1) {
      localUsersStore[index] = {
        ...localUsersStore[index],
        status: 'INACTIVE',
      };
      const user = localUsersStore[index];
      return {
        ...user,
        name: user.name || `${user.firstName} ${user.lastName}`,
        createdAt: user.createdAt || new Date().toISOString(),
      };
    }

    throw new Error('Investigator application not found');
  },
};
