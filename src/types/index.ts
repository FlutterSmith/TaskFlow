/**
 * Core type definitions for TaskFlow
 */

export type OrgRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'GUEST';

export type SubscriptionTier = 'FREE' | 'STARTER' | 'BUSINESS' | 'ENTERPRISE';

export type SubscriptionStatus = 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'TRIALING';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'BLOCKED' | 'DONE' | 'ARCHIVED';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type ViewType = 'LIST' | 'BOARD' | 'TIMELINE' | 'CALENDAR' | 'TABLE';

export type FieldType =
  | 'TEXT'
  | 'NUMBER'
  | 'DATE'
  | 'SELECT'
  | 'MULTI_SELECT'
  | 'CHECKBOX'
  | 'URL'
  | 'EMAIL';

export interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  subscriptionTier: SubscriptionTier;
  subscriptionStatus: SubscriptionStatus;
  maxUsers: number;
  maxProjects: number;
  maxStorage: number;
  currentUsers: number;
  currentProjects: number;
  currentStorage: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  role: OrgRole;
  user: User;
  createdAt: string;
  updatedAt: string;
}

export interface Team {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  memberCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  organizationId: string;
  teamId: string | null;
  name: string;
  description: string | null;
  key: string;
  color: string;
  icon: string | null;
  isArchived: boolean;
  taskCount?: number;
  team?: Team;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  organizationId: string;
  projectId: string;
  sectionId: string | null;
  createdById: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  taskNumber: number;
  dueDate: string | null;
  startDate: string | null;
  estimatedHours: number | null;
  actualHours: number | null;
  position: number;
  createdAt: string;
  updatedAt: string;
  project?: Project;
  section?: Section;
  createdBy?: User;
  assignees?: TaskAssignee[];
  comments?: Comment[];
  attachments?: Attachment[];
  subtasks?: Task[];
  parentTask?: Task;
}

export interface Section {
  id: string;
  projectId: string;
  name: string;
  position: number;
  tasks?: Task[];
}

export interface TaskAssignee {
  id: string;
  taskId: string;
  userId: string;
  user: User;
}

export interface Comment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  user: User;
  createdAt: string;
  updatedAt: string;
}

export interface Attachment {
  id: string;
  taskId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  fileUrl: string;
  uploadedAt: string;
}

export interface CustomField {
  id: string;
  organizationId: string;
  projectId: string | null;
  name: string;
  fieldType: FieldType;
  options: any;
  isRequired: boolean;
}

export interface ProjectView {
  id: string;
  projectId: string;
  name: string;
  viewType: ViewType;
  filters: any;
  sorting: any;
  groupBy: string | null;
  isDefault: boolean;
}

export interface ActivityLog {
  id: string;
  userId: string;
  taskId: string | null;
  action: string;
  metadata: any;
  user: User;
  createdAt: string;
}

/**
 * API Request/Response types
 */

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateTaskInput {
  projectId: string;
  sectionId?: string;
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: Priority;
  assigneeIds?: string[];
  dueDate?: string;
  startDate?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: Priority;
  assigneeIds?: string[];
  dueDate?: string;
  startDate?: string;
  sectionId?: string;
}

export interface TaskFilters {
  status?: TaskStatus[];
  priority?: Priority[];
  assigneeIds?: string[];
  search?: string;
  dueDate?: {
    from?: string;
    to?: string;
  };
}
