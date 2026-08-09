import type { Paginated, Role } from '@idu/types';

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface ApiClientOptions {
  baseUrl: string;
  getAccessToken?: () => string | null;
  onTokenRefreshed?: (token: string) => void;
  onUnauthorized?: () => void;
}

type LoginResponse = { accessToken: string; expiresIn: number };

export interface AuthUser {
  id: string;
  login: string;
  role: Role;
  permissions: Array<{ action: string; subject: string }>;
}

/**
 * Type-safe API klient — token biriktirish + 401'da avtomatik refresh.
 * Cookie (refresh) uchun credentials: 'include'. Web va mobil ulashadi.
 */
export class ApiClient {
  private token: string | null = null;

  constructor(private readonly opts: ApiClientOptions) {}

  setAccessToken(token: string | null): void {
    this.token = token;
  }

  private currentToken(): string | null {
    return this.opts.getAccessToken?.() ?? this.token;
  }

  private async request<T>(
    method: string,
    path: string,
    init: { body?: unknown; auth?: boolean; retry?: boolean } = {},
  ): Promise<T> {
    const { body, auth = true, retry = true } = init;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const token = this.currentToken();
    if (auth && token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${this.opts.baseUrl}${path}`, {
      method,
      headers,
      credentials: 'include',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (res.status === 401 && auth && retry) {
      const refreshed = await this.tryRefresh();
      if (refreshed) return this.request<T>(method, path, { ...init, retry: false });
      this.opts.onUnauthorized?.();
    }

    const text = await res.text();
    const data = text ? JSON.parse(text) : null;

    if (!res.ok) {
      const err = data?.error ?? {};
      throw new ApiError(err.code ?? 'ERROR', err.message ?? res.statusText, res.status, err.details);
    }
    return data as T;
  }

  private async tryRefresh(): Promise<boolean> {
    try {
      const res = await fetch(`${this.opts.baseUrl}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) return false;
      const data = (await res.json()) as LoginResponse;
      this.token = data.accessToken;
      this.opts.onTokenRefreshed?.(data.accessToken);
      return true;
    } catch {
      return false;
    }
  }

  // ── Auth ──
  auth = {
    login: (dto: { login: string; password: string; otp?: string }) =>
      this.request<LoginResponse>('POST', '/auth/login', { body: dto, auth: false }),
    refresh: () => this.tryRefresh(),
    logout: () => this.request<{ success: boolean }>('POST', '/auth/logout'),
    me: () => this.request<AuthUser>('GET', '/auth/me'),
  };

  // ── Domains ──
  grades = {
    mine: () => this.request<GradesResult>('GET', '/grades/me'),
    forStudent: (id: string) => this.request<GradesResult>('GET', `/grades/student/${id}`),
    roster: (courseId: string) =>
      this.request<GradeRoster>('GET', `/grades/course/${courseId}/roster`),
    bulk: (dto: BulkGradeInput) =>
      this.request<{ count: number }>('POST', '/grades/bulk', { body: dto }),
  };

  schedule = {
    mine: () => this.request<WeeklySchedule>('GET', '/schedule/me'),
    byGroup: (groupId: string) => this.request<WeeklySchedule>('GET', `/schedule/group/${groupId}`),
  };

  courses = {
    mine: () => this.request<TeacherCourse[]>('GET', '/courses/mine'),
  };

  gamification = {
    me: () => this.request<GameProfile>('GET', '/gamification/me'),
    leaderboard: (limit = 20) =>
      this.request<LeaderboardRow[]>('GET', `/gamification/leaderboard?limit=${limit}`),
  };

  payments = {
    mine: () => this.request<{ payments: Payment[]; balance: number }>('GET', '/payments/me'),
  };

  notifications = {
    list: () => this.request<Notification[]>('GET', '/notifications'),
    unreadCount: () => this.request<{ count: number }>('GET', '/notifications/unread-count'),
    markRead: (id: string) => this.request('POST', `/notifications/${id}/read`),
  };

  announcements = {
    list: () => this.request<Announcement[]>('GET', '/announcements'),
  };

  students = {
    list: (params = '') => this.request<Paginated<StudentRow>>('GET', `/students${params}`),
  };

  reports = {
    kpi: () => this.request<Kpi>('GET', '/reports/kpi'),
    performance: () => this.request<FacultyPerf[]>('GET', '/reports/performance'),
  };

  exams = {
    myAttempts: () => this.request<ExamAttempt[]>('GET', '/exams/attempts/me'),
  };
}

// ── Response shapes (client-side view) ──
export interface GradesResult {
  gpa: number;
  grades: Array<{
    id: string;
    total: number;
    letter: string | null;
    course: { name: string; code: string; credits: number };
  }>;
}
export type WeeklySchedule = Record<string, Array<Record<string, unknown>>>;
export interface TeacherCourse {
  id: string;
  name: string;
  code: string;
  credits: number;
}
export interface RosterStudent {
  studentId: string;
  studentNumber: string;
  fullName: string;
  jn: number | null;
  on: number | null;
  yn: number | null;
  mi: number | null;
  total: number | null;
  letter: string | null;
}
export interface GradeRoster {
  course: TeacherCourse;
  students: RosterStudent[];
}
export interface BulkGradeInput {
  courseId: string;
  grades: Array<{ studentId: string; jn: number; on: number; yn: number; mi: number }>;
}
export interface GameProfile {
  xp: number;
  level: number;
  streak: number;
  xpToNext: number;
  rank: number | null;
  badges: Array<{ code: string; name: string; icon: string | null }>;
}
export interface LeaderboardRow {
  rank: number;
  name: string;
  xp: number;
  level: number;
  streak: number;
}
export interface Payment {
  id: string;
  amount: string;
  paidAmount: string;
  status: string;
  gateway: string;
  dueDate: string | null;
}
export interface Notification {
  id: string;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
}
export interface Announcement {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  author: { fullName: string };
}
export interface StudentRow {
  id: string;
  studentNumber: string;
  gpa: number;
  status: string;
  user: { fullName: string };
  group: { name: string } | null;
}
export interface Kpi {
  students: { total: number; byStatus: Record<string, number> };
  performance: { avgGpa: number };
  attendance: { total: number; rate: number };
  payments: { totalAmount: number; paidAmount: number; pendingAmount: number; collectionRate: number };
}
export interface FacultyPerf {
  faculty: string;
  avgScore: number;
  gradedCount: number;
}
export interface ExamAttempt {
  id: string;
  score: number | null;
  submittedAt: string | null;
  exam: { title: string; type: string };
}
