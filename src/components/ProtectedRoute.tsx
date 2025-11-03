import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { getSession } from "@/lib/storage";

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const session = getSession();
  
  if (!session) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
};

