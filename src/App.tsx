import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { useAuth } from "./hooks/useAuth";
import { Auth } from "./components/Auth";

const queryClient = new QueryClient();


// Create an auth wrapper component
function AuthRoute({ children }: { children: JSX.Element }) {
  const { session, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  
  // If session exists and user is verified, show protected content
  if (session) {
    // Additional check for phone verification if needed
    return children;
  }
  
  // Otherwise redirect to auth page
  return <Navigate to="/auth" replace />;
}



function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/auth" element={<Auth />} />
            
            {/* Protected routes */}
            <Route
              path="/"
              element={
                <AuthRoute>
                  <Index />
                </AuthRoute>
              }
            />
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;