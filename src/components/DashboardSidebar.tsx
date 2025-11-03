import { FileText, History, Settings, LogOut } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "📝 New Assessment", url: "/dashboard/new-form", icon: FileText },
  { title: "🕓 History", url: "/dashboard/history", icon: History },
  { title: "⚙️ Settings", url: "/dashboard/settings", icon: Settings },
];

export const DashboardSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleNewForm = () => {
    // Always clear draft before creating new form
    localStorage.removeItem("xrl:intake:draft");
    // Force reload by navigating with state
    if (location.pathname === "/dashboard/new-form") {
      // Already on the page, trigger a custom event to reset form
      window.dispatchEvent(new Event("resetNewForm"));
      // Remove resume parameter from URL if present
      window.history.replaceState({}, '', '/dashboard/new-form');
    } else {
      navigate("/dashboard/new-form");
    }
  };

  return (
    <Sidebar className="border-r border-border">
      <SidebarContent>
        <div className="p-6 border-b border-border">
          <Link to="/dashboard">
            <h2 className="text-xl font-semibold text-foreground cursor-pointer hover:opacity-80 transition-opacity">XRL Platform</h2>
          </Link>
        </div>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild={item.url !== "/dashboard/new-form"} 
                    isActive={location.pathname === item.url}
                  >
                    {item.url === "/dashboard/new-form" ? (
                      <button
                        onClick={handleNewForm}
                        className="text-[#111111] hover:bg-accent w-full text-left"
                      >
                        <span>{item.title}</span>
                      </button>
                    ) : (
                    <Link to={item.url} className="text-[#111111] hover:bg-accent">
                      <span>{item.title}</span>
                    </Link>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <button
                onClick={() => {
                  try {
                    localStorage.removeItem("xrl:intake:draft");
                  } catch {}
                  try {
                    localStorage.removeItem("xrl_user");
                  } catch {}
                  try {
                    localStorage.removeItem("xrl:session");
                  } catch {}
                  navigate("/auth");
                }}
                className="text-[#111111] hover:bg-accent w-full text-left"
              >
                <span>🚪 Logout</span>
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};
