import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import Connections from "./pages/Connections";
import Schedules from "./pages/Schedules";
import History from "./pages/History";
import Restore from "./pages/Restore";
import Storage from "./pages/Storage";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      
      {/* Connections split by type */}
      <Route path="/connections/postgresql" element={<ProtectedRoute><Connections type="postgresql" /></ProtectedRoute>} />
      <Route path="/connections/sqlserver" element={<ProtectedRoute><Connections type="sqlserver" /></ProtectedRoute>} />
      
      {/* Schedules split by type */}
      <Route path="/schedules/postgresql" element={<ProtectedRoute><Schedules type="postgresql" /></ProtectedRoute>} />
      <Route path="/schedules/sqlserver" element={<ProtectedRoute><Schedules type="sqlserver" /></ProtectedRoute>} />
      
      <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
