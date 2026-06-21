import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Fish } from "lucide-react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { PageLoader } from "./components/ui";
import Layout from "./components/layout/Layout";

import { LoginPage, RegisterPage } from "./pages/auth/AuthPages";
import FarmerDashboard from "./pages/farmer/FarmerDashboard";
import FarmsPage from "./pages/farmer/FarmsPage";
import RecommendationsPage from "./pages/farmer/RecommendationsPage";
import SpeciesPage from "./pages/farmer/SpeciesPage";
import { FarmerFeedsPage } from "./pages/farmer/FarmerFeedsPage";
import FeedingHistoryPage from "./pages/farmer/FeedingHistoryPage";
import {
  SupplierDashboard,
  SupplierFeedsPage,
  InventoryPage,
} from "./pages/supplier/SupplierPages";
import {
  AdminDashboard,
  AdminUsersPage,
  AdminSpeciesPage,
} from "./pages/admin/AdminPages";
import {
  AdminFeedsPage,
  AdminRecommendationsPage,
} from "./pages/admin/AdminSubPages";
import { NotificationsPage, ProfilePage } from "./pages/shared/SharedPages";

function RequireAuth({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role))
    return <Navigate to={`/${user.role}`} replace />;
  return children;
}

function RedirectIfAuth() {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (user) return <Navigate to={`/${user.role}`} replace />;
  return null;
}

function W({ children }) {
  return <Layout>{children}</Layout>;
}

function RedirectHome() {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (user) return <Navigate to={`/${user.role}`} replace />;
  return <Navigate to="/login" replace />;
}

function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F8FA]">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#E3F1F7] flex items-center justify-center mx-auto mb-5">
          <Fish size={28} className="text-[#0E4561]" strokeWidth={1.75} />
        </div>
        <h1 className="text-2xl font-bold text-[#14202B] font-display">
          Page not found
        </h1>
        <p className="text-[#5C7384] mt-2 mb-6 text-sm">This page swam away.</p>
        <a
          href="/"
          className="inline-flex items-center gap-2 bg-[#0E4561] text-white font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-[#0A3247] transition-colors"
        >
          Go home
        </a>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                fontFamily: "'Inter', sans-serif",
                borderRadius: "14px",
                fontSize: "13.5px",
                fontWeight: "600",
                boxShadow: "0 8px 28px rgba(20,32,43,0.14)",
                border: "1px solid #E6EDF1",
                padding: "12px 16px",
              },
              success: { iconTheme: { primary: "#1F9D6E", secondary: "#fff" } },
              error: { iconTheme: { primary: "#DC4848", secondary: "#fff" } },
            }}
          />
          <Routes>
            <Route path="/" element={<RedirectHome />} />
            <Route
              path="/login"
              element={
                <>
                  <RedirectIfAuth />
                  <LoginPage />
                </>
              }
            />
            <Route
              path="/register"
              element={
                <>
                  <RedirectIfAuth />
                  <RegisterPage />
                </>
              }
            />

            <Route
              path="/farmer"
              element={
                <RequireAuth allowedRoles={["farmer"]}>
                  <W>
                    <FarmerDashboard />
                  </W>
                </RequireAuth>
              }
            />
            <Route
              path="/farmer/farms"
              element={
                <RequireAuth allowedRoles={["farmer"]}>
                  <W>
                    <FarmsPage />
                  </W>
                </RequireAuth>
              }
            />
            <Route
              path="/farmer/recommend"
              element={
                <RequireAuth allowedRoles={["farmer"]}>
                  <W>
                    <RecommendationsPage />
                  </W>
                </RequireAuth>
              }
            />
            <Route
              path="/farmer/species"
              element={
                <RequireAuth allowedRoles={["farmer"]}>
                  <W>
                    <SpeciesPage />
                  </W>
                </RequireAuth>
              }
            />
            <Route
              path="/farmer/feeds"
              element={
                <RequireAuth allowedRoles={["farmer"]}>
                  <W>
                    <FarmerFeedsPage />
                  </W>
                </RequireAuth>
              }
            />
            <Route
              path="/farmer/history"
              element={
                <RequireAuth allowedRoles={["farmer"]}>
                  <W>
                    <FeedingHistoryPage />
                  </W>
                </RequireAuth>
              }
            />
            <Route
              path="/farmer/notifications"
              element={
                <RequireAuth allowedRoles={["farmer"]}>
                  <W>
                    <NotificationsPage />
                  </W>
                </RequireAuth>
              }
            />
            <Route
              path="/farmer/profile"
              element={
                <RequireAuth allowedRoles={["farmer"]}>
                  <W>
                    <ProfilePage />
                  </W>
                </RequireAuth>
              }
            />

            <Route
              path="/supplier"
              element={
                <RequireAuth allowedRoles={["supplier"]}>
                  <W>
                    <SupplierDashboard />
                  </W>
                </RequireAuth>
              }
            />
            <Route
              path="/supplier/feeds"
              element={
                <RequireAuth allowedRoles={["supplier"]}>
                  <W>
                    <SupplierFeedsPage />
                  </W>
                </RequireAuth>
              }
            />
            <Route
              path="/supplier/inventory"
              element={
                <RequireAuth allowedRoles={["supplier"]}>
                  <W>
                    <InventoryPage />
                  </W>
                </RequireAuth>
              }
            />
            <Route
              path="/supplier/notifications"
              element={
                <RequireAuth allowedRoles={["supplier"]}>
                  <W>
                    <NotificationsPage />
                  </W>
                </RequireAuth>
              }
            />
            <Route
              path="/supplier/profile"
              element={
                <RequireAuth allowedRoles={["supplier"]}>
                  <W>
                    <ProfilePage />
                  </W>
                </RequireAuth>
              }
            />

            <Route
              path="/admin"
              element={
                <RequireAuth allowedRoles={["admin"]}>
                  <W>
                    <AdminDashboard />
                  </W>
                </RequireAuth>
              }
            />
            <Route
              path="/admin/users"
              element={
                <RequireAuth allowedRoles={["admin"]}>
                  <W>
                    <AdminUsersPage />
                  </W>
                </RequireAuth>
              }
            />
            <Route
              path="/admin/species"
              element={
                <RequireAuth allowedRoles={["admin"]}>
                  <W>
                    <AdminSpeciesPage />
                  </W>
                </RequireAuth>
              }
            />
            <Route
              path="/admin/feeds"
              element={
                <RequireAuth allowedRoles={["admin"]}>
                  <W>
                    <AdminFeedsPage />
                  </W>
                </RequireAuth>
              }
            />
            <Route
              path="/admin/recommendations"
              element={
                <RequireAuth allowedRoles={["admin"]}>
                  <W>
                    <AdminRecommendationsPage />
                  </W>
                </RequireAuth>
              }
            />
            <Route
              path="/admin/notifications"
              element={
                <RequireAuth allowedRoles={["admin"]}>
                  <W>
                    <NotificationsPage />
                  </W>
                </RequireAuth>
              }
            />
            <Route
              path="/admin/profile"
              element={
                <RequireAuth allowedRoles={["admin"]}>
                  <W>
                    <ProfilePage />
                  </W>
                </RequireAuth>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
