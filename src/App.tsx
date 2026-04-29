import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminLayout } from "@/layouts/AdminLayout";
import Landing from "./pages/Landing";
import ComoFunciona from "./pages/ComoFunciona";
import Inicio from "./pages/Inicio";
import Perfil from "./pages/Perfil";
import Diagnostico from "./pages/Diagnostico";
import DiagnosticoPremium from "./pages/DiagnosticoPremium";
import Agendar from "./pages/Agendar";
import Comprar from "./pages/Comprar";
import Login from "./pages/Login.tsx";
import Signup from "./pages/Signup.tsx";
import ForgotPassword from "./pages/ForgotPassword.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import NotFound from "./pages/NotFound.tsx";
import AdminHome from "./pages/admin/AdminHome";
import KnowledgeAdmin from "./pages/admin/KnowledgeAdmin";
import DiagnosticosAdmin from "./pages/admin/DiagnosticosAdmin";
import UsuariosAdmin from "./pages/admin/UsuariosAdmin";
import LogsIaAdmin from "./pages/admin/LogsIaAdmin";
import ConfiguracoesAdmin from "./pages/admin/ConfiguracoesAdmin";
import MetricasAdmin from "./pages/admin/MetricasAdmin";
import ProdutosAdmin from "./pages/admin/ProdutosAdmin";
import CreditosAdmin from "./pages/admin/CreditosAdmin";
import FinanceiroAdmin from "./pages/admin/FinanceiroAdmin";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Navigate to="/login" replace />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              <Route path="/" element={<Landing />} />
              <Route path="/como-funciona" element={<ComoFunciona />} />
              <Route
                path="/inicio"
                element={
                  <ProtectedRoute>
                    <Inicio />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/perfil"
                element={
                  <ProtectedRoute>
                    <Perfil />
                  </ProtectedRoute>
                }
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
                path="/diagnostico/:id"
                element={
                  <ProtectedRoute>
                    <DiagnosticoPremium />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/comprar"
                element={
                  <ProtectedRoute>
                    <Comprar />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/agendar/:id"
                element={
                  <ProtectedRoute>
                    <Agendar />
                  </ProtectedRoute>
                }
              />
              {/* Compat: /resultado/:id agora redireciona para agendar */}
              <Route path="/resultado/:id" element={<Navigate to="/diagnostico" replace />} />

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
                <Route path="diagnosticos" element={<DiagnosticosAdmin />} />
                <Route path="usuarios" element={<UsuariosAdmin />} />
                <Route path="produtos" element={<ProdutosAdmin />} />
                <Route path="creditos" element={<CreditosAdmin />} />
                <Route path="financeiro" element={<FinanceiroAdmin />} />
                <Route path="logs" element={<LogsIaAdmin />} />
                <Route path="metricas" element={<MetricasAdmin />} />
                <Route path="configuracoes" element={<ConfiguracoesAdmin />} />
              </Route>

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
