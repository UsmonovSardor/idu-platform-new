'use client';
import { useAuth } from '@/lib/auth-store';
import { StudentDashboard } from '@/components/dashboards/student-dashboard';
import { AdminDashboard } from '@/components/dashboards/admin-dashboard';
import { TeacherDashboard } from '@/components/dashboards/teacher-dashboard';

export default function DashboardPage() {
  const { user } = useAuth();
  if (!user) return null;
  if (user.role === 'STUDENT') return <StudentDashboard />;
  if (user.role === 'TEACHER') return <TeacherDashboard />;
  return <AdminDashboard />;
}
