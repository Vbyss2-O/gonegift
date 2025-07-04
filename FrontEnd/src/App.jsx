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
import BeneficiaryList from "./Layout/Death/BeneficiaryList";
import FileList from "./Layout/Death/FileList";
import LifeBuddyDashboard from "./Layout/LifeBuddyDashboard";
import DecryptFile from "./Layout/Death/DecryptFile";
import ErrorPage from "./Layout/Death/ErrorPage";
import UploadPage from "./Layout/Death/UploadPage";
import SharedSpace from "./Layout/Death/SharedSpace";
import SharedFileUpload from "./Layout/Death/SharedFileUpload";
import LifeBuddyAbout from "./Layout/Death/LifebuddyAbout";
import GoneGiftFeatures from "./Layout/feather";
import AboutGoneGift from "./Layout/About";
import UpdateAndPlans from "./Layout/UpdatesAndPlans";
import PrivacyPolicy from "./Layout/PrivacyPolicy";
import UserGuides from "./Layout/HelpCenter";


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

      <Route
        path="/beneficiary-claim"
        element={
          <ProtectedRoute redirectTo="/login">
            <DeathReportForm />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute redirectTo="/login">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/primaryinfo"
        element={
          <ProtectedRoute redirectTo="/login">
            <UserDetailsForm />
          </ProtectedRoute>
        }
      />

      <Route
        path="/allBenificiarys"
        element={
          <ProtectedRoute redirectTo="/login">
            <BeneficiaryList />
          </ProtectedRoute>
        }
      />

      <Route
        path="/allFiles"
        element={
          <ProtectedRoute redirectTo="/login">
            <FileList />
          </ProtectedRoute>
        }
      />

      <Route
        path="/lifebuddy"
        element={
          <ProtectedRoute redirectTo="/login">
            <LifeBuddyDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/buddyAbout"
        element={
          <ProtectedRoute redirectTo="/login">
            <LifeBuddyAbout />
          </ProtectedRoute>
        }
      />
      <Route
        path="/voice"
        element={
          <ProtectedRoute redirectTo="/login">
            <UploadPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/sharedSpace"
        element={
          <ProtectedRoute redirectTo="/login">
            <SharedSpace />
          </ProtectedRoute>
        }
      />

      <Route
        path="/sharedSpace/upload/:token"
        element={
          <ProtectedRoute redirectTo="/login">
          <SharedFileUpload />
          </ProtectedRoute>
        }
      />
      <Route
        path="/feathers"
        element={
          <GoneGiftFeatures />
        }
      />
      <Route
        path="/about"
        element={
          <AboutGoneGift />
        }
      />
      <Route
        path="/updateAndPlans"
        element={
          <UpdateAndPlans />
        }
      />
      <Route
        path="/privacy"
        element={
          <PrivacyPolicy />
        }
      />
      <Route
        path="/userGuides"
        element={
          <UserGuides />
        }
      />

      <Route path="/ClaimAssets" element={<DecryptFile />}></Route>
      <Route path="/ErrorPage" element={<ErrorPage />}></Route>

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
