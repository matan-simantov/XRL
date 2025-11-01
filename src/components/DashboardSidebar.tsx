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

  return (
    <Sidebar className="border-r border-border">
      <SidebarContent>
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">XRL Platform</h2>
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
                        onClick={() => {
                          // Clear draft before navigating to new form
                          localStorage.removeItem("xrl:intake:draft");
                          // Force reload by navigating with state
                          if (location.pathname === item.url) {
                            // Already on the page, trigger a custom event to reset form
                            window.dispatchEvent(new Event("resetNewForm"));
                          } else {
                            navigate(item.url);
                          }
                        }}
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
