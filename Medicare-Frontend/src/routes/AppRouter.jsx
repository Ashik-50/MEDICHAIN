import {Routes, Route, Navigate } from "react-router-dom";
import Home from "../pages/Home";
import Login from "../pages/Login";
import Register from "../pages/Register";
import PatientDashboard from "../pages/Patient/PatientDashboard";
import DoctorDashboard from "../pages/Doctor/DoctorDashboard";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { KeyProvider } from "../context/KeyContext";
import PatientRecords from "../pages/Patient/Records";
import AccessControl from "../pages/Patient/AccessControl";
import DoctorAccessPage from "../pages/Doctor/DoctorAccessPage";
import Patients from "../pages/Doctor/Patients";
import DoctorUploadPage from "../pages/Doctor/UploadRecord";
import FindDoctor from "../pages/Patient/FindDoctor";
import PatientLogs from "../pages/Patient/PatientLogs";
import DoctorLogs from "../pages/Doctor/DoctorLogs";
import HospitalDashboard from "../pages/Hospital/HospitalDashboard";
import HospitalDoctors from "../pages/Hospital/HospitalDoctors";
import HospitalUsers from "../pages/Hospital/HospitalUsers";
import BlockchainLedger from "../pages/Hospital/Blockchain";
import HospitalAudit from "../pages/Hospital/HospitalAudit";
import ResetPassword from "../pages/Hospital/ResetPassword";

function ProtectedRoute({ children, role }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role) return <Navigate to="/" />;
  return children;
}

export default function AppRouter() {
  return (
    <AuthProvider>
      <KeyProvider>
        <div className="min-h-screen">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Patient Routes */}
            <Route
              path="/patient/dashboard"
              element={
                <ProtectedRoute role="patient">
                  <PatientDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/records"
              element={
                <ProtectedRoute role="patient">
                  <PatientRecords />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/access-control"
              element={
                <ProtectedRoute role="patient">
                  <AccessControl />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/logs"
              element={
                <ProtectedRoute role="patient">
                  <PatientLogs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/finddoctors"
              element={
                <ProtectedRoute role="patient">
                  <FindDoctor/>
                </ProtectedRoute>
              }
            />

            {/* Doctor Routes */}
            <Route
              path="/doctor/dashboard"
              element={
                <ProtectedRoute role="doctor">
                  <DoctorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/logs"
              element={
                <ProtectedRoute role="doctor">
                  <DoctorLogs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/access"
              element={
                <ProtectedRoute role="doctor">
                  <DoctorAccessPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/patients"
              element={
                <ProtectedRoute role="doctor">
                  <Patients />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/upload"
              element={
                <ProtectedRoute role="doctor">
                  <DoctorUploadPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/hospital/dashboard"
              element={
                <ProtectedRoute role="hospital">
                  <HospitalDashboard />
                </ProtectedRoute>
              }
            />
          <Route
            path="/hospital/manage-patients"
            element={
              <ProtectedRoute role="hospital">
                <HospitalUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hospital/manage-doctors"
            element={
              <ProtectedRoute role="hospital">
                <HospitalDoctors />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hospital/blockchain"
            element={
              <ProtectedRoute role="hospital">
                <BlockchainLedger />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hospital/audit"
            element={
              <ProtectedRoute role="hospital">
                <HospitalAudit />
              </ProtectedRoute>
            }
          />
          <Route path="/reset-password" element={<ResetPassword />} />
          </Routes>
        </div>
      </KeyProvider>
    </AuthProvider>
  );
}
