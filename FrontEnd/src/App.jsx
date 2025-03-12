import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import GoogleLoginPage from "./Layout/Auth/GoogleLoginPage";
import Dashboard from "./Layout/Death/DeathDashboard";
import FileUpload from "./Layout/Death/FileUpload";
import BeneficiaryForm from "./Layout/Death/BeneficiaryForm";
import LetterEditor from "./Layout/Death/LetterEditor";
import ProtectedRoute from "./Layout/Auth/ProtectedRoute";
import AdminDashboard from "./Layout/Death/AdminDashboard";
import DeathReportForm from "./Layout/Death/DeathReportForm";
import UserDetailsForm from "./Layout/Death/DeathUserDetail";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<GoogleLoginPage />} />
      <Route
        path="/death-dashboard"
        element={
          <ProtectedRoute redirectTo="/login">
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/upload-file"
        element={
          <ProtectedRoute redirectTo="/login">
            <FileUpload />
          </ProtectedRoute>
        }
      />
      <Route
        path="/beneficiaries"
        element={
          <ProtectedRoute redirectTo="/login">
            <BeneficiaryForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/letter"
        element={
          <ProtectedRoute redirectTo="/login">
            <LetterEditor />
          </ProtectedRoute>
        }
      />
      <Route path="/beneficiary-claim" element={<DeathReportForm />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/primaryinfo" element={<UserDetailsForm/>} />


      
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;