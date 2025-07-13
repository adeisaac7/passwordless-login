import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { useAuth } from "./hooks/useAuth";
import { Auth } from "./components/Auth";
import { useEffect } from "react";
import { supabase } from "./integrations/supabase/client";

const queryClient = new QueryClient();


function AuthRoute({ children }: { children: JSX.Element }) {
  const { session, loading, checkFullVerification } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && session) {
      const checkVerification = async () => {
        const isVerified = await checkFullVerification(session.user.id);
        if (!isVerified) {
          navigate('/auth', { replace: true });
        }
      };
      checkVerification();
    }
  }, [session, loading, navigate]);

  if (loading) return <div>Loading...</div>;
  if (!session) return <Navigate to="/auth" replace />;

  return children;
}


function PublicRoute({ children }: { children: JSX.Element }) {
  const { session, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (session) {
    return <Navigate to="/" replace />;
  }

  return children;
}


function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/"
              element={
                <AuthRoute>
                  <Index />
                </AuthRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;