import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Outlet, useLocation, Link } from "react-router-dom";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, History } from "lucide-react";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { useButtonColor } from "@/hooks/use-button-color";

const Dashboard = () => {
  const location = useLocation();
  const isHome = location.pathname === "/dashboard";
  const { getTextClass, getBgLightClass } = useButtonColor();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <DashboardSidebar />
        <main className="flex-1 flex flex-col min-h-screen">
          <Header />
          <div className="flex-1 p-8">
            {isHome ? (
              <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold text-foreground mb-2">Welcome to XRL</h1>
                <p className="text-muted-foreground mb-8">Choose an action to get started</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Link to="/dashboard/new-form">
                    <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full">
                      <CardHeader>
                        <div className={`w-12 h-12 rounded-lg ${getBgLightClass()} flex items-center justify-center mb-4`}>
                          <FileText className={`h-6 w-6 ${getTextClass()}`} />
                        </div>
                        <CardTitle>Start New Form</CardTitle>
                        <CardDescription>
                          Begin a new 10-step analysis workflow
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  </Link>

                  <Link to="/dashboard/history">
                    <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full">
                      <CardHeader>
                        <div className={`w-12 h-12 rounded-lg ${getBgLightClass()} flex items-center justify-center mb-4`}>
                          <History className={`h-6 w-6 ${getTextClass()}`} />
                        </div>
                        <CardTitle>View History</CardTitle>
                        <CardDescription>
                          Review past submissions and results
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  </Link>
                </div>
              </div>
            ) : (
              <Outlet />
            )}
          </div>
          <Footer />
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
