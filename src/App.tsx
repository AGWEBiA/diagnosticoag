import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminLayout } from "@/layouts/AdminLayout";
import Diagnostico from "./pages/Diagnostico";
import Resultado from "./pages/Resultado";
import Login from "./pages/Login.tsx";
import Signup from "./pages/Signup.tsx";
import ForgotPassword from "./pages/ForgotPassword.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import NotFound from "./pages/NotFound.tsx";
import AdminHome from "./pages/admin/AdminHome";
import KnowledgeAdmin from "./pages/admin/KnowledgeAdmin";
import AdminPlaceholder from "./pages/admin/AdminPlaceholder";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            <Route
              path="/"
              element={<Navigate to="/diagnostico" replace />}
            />
            <Route
              path="/diagnostico"
              element={
                <ProtectedRoute>
                  <Diagnostico />
                </ProtectedRoute>
              }
            />
            <Route
              path="/resultado/:id"
              element={
                <ProtectedRoute>
                  <Resultado />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminHome />} />
              <Route path="knowledge" element={<KnowledgeAdmin />} />
              <Route
                path="diagnosticos"
                element={
                  <AdminPlaceholder
                    title="Diagnósticos"
                    description="Lista de diagnósticos dos usuários (em breve)."
                  />
                }
              />
              <Route
                path="usuarios"
                element={
                  <AdminPlaceholder
                    title="Usuários"
                    description="Gestão de usuários e roles (em breve)."
                  />
                }
              />
              <Route
                path="logs"
                element={
                  <AdminPlaceholder
                    title="Logs de IA"
                    description="Auditoria de operações de IA (em breve)."
                  />
                }
              />
            </Route>

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
