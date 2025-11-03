import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Outlet, useLocation, Link, useNavigate } from "react-router-dom";
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, History, ArrowRight, Calendar, Clock } from "lucide-react";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { useButtonColor } from "@/hooks/use-button-color";
import { useEffect, useState } from "react";
import { getSession, listRuns, getUser, listDrafts } from "@/lib/storage";
import { format } from "date-fns";

const Dashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === "/dashboard";
  const { getTextClass, getBgLightClass, getButtonClasses } = useButtonColor();
  const [userName, setUserName] = useState<string>("");
  const [recentSearches, setRecentSearches] = useState<any[]>([]);
  const [drafts, setDrafts] = useState<any[]>([]);

  // Helper function to extract and format user name from email
  const formatUserName = (email: string): string => {
    const emailPart = email.split("@")[0];
    
    // Remove numbers
    let nameWithoutNumbers = emailPart.replace(/\d+/g, "");
    
    // Split by common punctuation (., -, _)
    const parts = nameWithoutNumbers.split(/[.\-_]/);
    
    // Take the first part and capitalize it
    if (parts.length > 0 && parts[0].length > 0) {
      const firstPart = parts[0];
      return firstPart.charAt(0).toUpperCase() + firstPart.slice(1).toLowerCase();
    }
    
    // Fallback: capitalize first letter of the whole string
    return nameWithoutNumbers.charAt(0).toUpperCase() + nameWithoutNumbers.slice(1).toLowerCase();
  };

  useEffect(() => {
    if (isHome) {
      // Get user info
      const session = getSession();
      if (session) {
        getUser(session.username).then((user) => {
          if (user?.email) {
            // Format name from email
            const formattedName = formatUserName(user.email);
            setUserName(formattedName);
          }
        });

        // Get last 3 searches
        listRuns(session.username, 3).then((runs) => {
          setRecentSearches(runs);
        });

        // Get drafts
        listDrafts(session.username, 3).then((draftsList) => {
          setDrafts(draftsList);
        });
      }
    }
  }, [isHome]);

  const handleNewForm = () => {
    // Always clear draft before creating new form
    localStorage.removeItem("xrl:intake:draft");
    navigate("/dashboard/new-form");
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <DashboardSidebar />
        <main className="flex-1 flex flex-col min-h-screen">
          <Header />
          <div className="flex-1 p-8">
          {isHome ? (
            <div className="max-w-6xl mx-auto space-y-8">
              {/* Welcome Section */}
              <div className="space-y-4">
                {userName && (
                  <h1 className="text-4xl font-bold text-foreground">
                    Hey {userName}! 👋
                  </h1>
                )}
                <div className="space-y-2">
                  <p className="text-lg text-foreground">
                    Welcome to XRL Platform - Your comprehensive sector analysis tool
                  </p>
                  <p className="text-muted-foreground">
                    Create detailed assessments, analyze market trends, and track your research across multiple sectors and domains.
                  </p>
                </div>
              </div>

              {/* New Form Button */}
              <Button
                onClick={handleNewForm}
                size="lg"
                className={`${getButtonClasses()} text-lg px-8 py-6 h-auto`}
              >
                <FileText className="mr-2 h-5 w-5" />
                Create New Assessment
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>

              {/* Drafts Section */}
              {drafts.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">Drafts</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {drafts.map((draft) => (
                      <Card 
                        key={draft.id} 
                        className="cursor-pointer hover:shadow-lg transition-shadow h-full"
                        onClick={() => {
                          window.location.href = "/dashboard/new-form?resume=true";
                        }}
                      >
                        <CardHeader>
                          <CardTitle className="text-lg line-clamp-1 flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            {draft.state?.domains?.join(", ") || draft.state?.sector || "Untitled Draft"}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-2">
                            <Calendar className="h-4 w-4" />
                            Updated {format(new Date(draft.updatedAt), "MMM dd, yyyy")}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.location.href = "/dashboard/new-form?resume=true";
                            }}
                          >
                            Resume Draft
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">Recent Searches</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {recentSearches.map((search) => (
                      <Link key={search.id} to={`/dashboard/history`}>
                        <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full">
                          <CardHeader>
                            <CardTitle className="text-lg line-clamp-1">
                              {search.domains?.[0] || search.sector || "Untitled"}
                            </CardTitle>
                            <CardDescription className="flex items-center gap-2 mt-2">
                              <Calendar className="h-4 w-4" />
                              {format(new Date(search.createdAt), "MMM dd, yyyy")}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <div className="text-sm">
                                <span className="font-medium">Sector:</span>{" "}
                                <span className="text-muted-foreground">{search.sector}</span>
                              </div>
                              {search.domains && search.domains.length > 0 && (
                                <div className="text-sm">
                                  <span className="font-medium">Domains:</span>{" "}
                                  <span className="text-muted-foreground">
                                    {search.domains.length} {search.domains.length === 1 ? "domain" : "domains"}
                                  </span>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                  <div className="flex justify-end">
                    <Link to="/dashboard/history">
                      <Button variant="outline">
                        View All History
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              )}

              {/* Empty State */}
              {recentSearches.length === 0 && drafts.length === 0 && (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-muted-foreground mb-4">No recent searches or drafts yet.</p>
                    <Button onClick={handleNewForm} className={getButtonClasses()}>
                      Create Your First Assessment
                    </Button>
                  </CardContent>
                </Card>
              )}
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
