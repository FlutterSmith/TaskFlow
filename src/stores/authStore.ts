import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Organization, OrgRole } from '@/types';

interface AuthState {
  user: User | null;
  currentOrg: Organization | null;
  currentOrgRole: OrgRole | null;
  organizations: Organization[];
  setUser: (user: User | null) => void;
  setCurrentOrg: (org: Organization | null, role: OrgRole | null) => void;
  setOrganizations: (orgs: Organization[]) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      currentOrg: null,
      currentOrgRole: null,
      organizations: [],
      setUser: (user) => set({ user }),
      setCurrentOrg: (org, role) => set({ currentOrg: org, currentOrgRole: role }),
      setOrganizations: (orgs) => set({ organizations: orgs }),
      clearAuth: () =>
        set({ user: null, currentOrg: null, currentOrgRole: null, organizations: [] }),
    }),
    {
      name: 'taskflow-auth',
    }
  )
);
