import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../api';
import { AppLayout } from '../components/layout/AppLayout';
import { LoginPage } from '../features/auth/LoginPage';
import { DashboardPage } from '../features/admin/DashboardPage';
import { UsersPage } from '../features/admin/UsersPage';
import { DepartmentsPage } from '../features/admin/DepartmentsPage';
import { DoctorsPage } from '../features/doctors/DoctorsPage';
import { PatientsPage } from '../features/patients/PatientsPage';
import { PatientDetailPage } from '../features/patients/PatientDetailPage';
import { AppointmentsPage } from '../features/appointments/AppointmentsPage';
import { ConsultationsPage } from '../features/consultations/ConsultationsPage';
import { InvoicesPage } from '../features/billing/InvoicesPage';
import { AuditLogsPage } from '../features/admin/AuditLogsPage';
import { ProfilePage } from '../features/auth/ProfilePage';
import { ServicesPage } from '../features/services/ServicesPage';
import { PharmacyPage } from '../features/pharmacy/PharmacyPage';
import { WardBedsPage } from '../features/wards/WardBedsPage';
import { PageLoader } from '../components/shared/LoadingSpinner';
import type { UserRole } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: UserRole[];
}

const getDefaultRouteForRole = (role?: UserRole): string => {
  switch (role) {
    case 'ADMIN':
      return '/dashboard';
    case 'DOCTOR':
      return '/appointments';
    case 'RECEPTIONIST':
      return '/patients';
    case 'BILLING_STAFF':
      return '/invoices';
    default:
      return '/login';
  }
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, roles }) => {
  const { isAuthenticated, isLoading, user } = useAuthStore();

  if (isLoading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && user && !roles.includes(user.role as UserRole)) {
    return <Navigate to={getDefaultRouteForRole(user.role as UserRole)} replace />;
  }

  return <>{children}</>;
};

const RoleIndexRedirect: React.FC = () => {
  const { user } = useAuthStore();
  return <Navigate to={getDefaultRouteForRole(user?.role as UserRole)} replace />;
};

const AppRoutes: React.FC = () => {
  const { setUser } = useAuthStore();

  useEffect(() => {
    authApi
      .getMe()
      .then((res) => setUser(res.data.data))
      .catch(() => setUser(null));
  }, [setUser]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<RoleIndexRedirect />} />
          <Route
            path="dashboard"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="users"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <UsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="departments"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <DepartmentsPage />
              </ProtectedRoute>
            }
          />
          <Route path="doctors" element={<DoctorsPage />} />
          <Route
            path="patients"
            element={
              <ProtectedRoute roles={['ADMIN', 'RECEPTIONIST']}>
                <PatientsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="patients/:id"
            element={
              <ProtectedRoute roles={['ADMIN', 'RECEPTIONIST', 'DOCTOR']}>
                <PatientDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="appointments"
            element={
              <ProtectedRoute roles={['ADMIN', 'RECEPTIONIST', 'DOCTOR']}>
                <AppointmentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="consultations"
            element={
              <ProtectedRoute roles={['DOCTOR']}>
                <ConsultationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="wards"
            element={
              <ProtectedRoute roles={['ADMIN', 'RECEPTIONIST', 'DOCTOR']}>
                <WardBedsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="services"
            element={
              <ProtectedRoute roles={['ADMIN', 'DOCTOR', 'BILLING_STAFF']}>
                <ServicesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="pharmacy"
            element={
              <ProtectedRoute roles={['ADMIN', 'DOCTOR', 'BILLING_STAFF']}>
                <PharmacyPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="invoices"
            element={
              <ProtectedRoute roles={['ADMIN', 'BILLING_STAFF']}>
                <InvoicesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="audit-logs"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <AuditLogsPage />
              </ProtectedRoute>
            }
          />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
        <Route path="*" element={<RoleIndexRedirect />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
