import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useFiles } from "@/contexts/FileContext";
import { useTheme } from "@/contexts/ThemeContext";
import {
  LayoutDashboard,
  Upload,
  History,
  BarChart3,
  User,
  Settings,
  LogOut,
  Folders,
  ChevronLeft,
  ChevronRight,
  Tag,
  Search,
  Sun,
  Moon,
} from "lucide-react";
import { motion } from "framer-motion";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/upload", label: "Upload", icon: Upload },
  { to: "/search", label: "AI Search", icon: Search },
  { to: "/categories", label: "Categories", icon: Tag },
  { to: "/history", label: "History", icon: History },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/profile", label: "Profile", icon: User },
  { to: "/settings", label: "Settings", icon: Settings },
];

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export const AppSidebar = ({ collapsed, onToggle }: AppSidebarProps) => {
  const { profile, signOut } = useAuth();
  const { files } = useFiles();
  const { theme, toggle } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ duration: 0.2 }}
      className="h-screen border-r border-border bg-card/30 backdrop-blur-sm flex flex-col flex-shrink-0 overflow-hidden"
    >
      <div className="p-3 border-b border-border flex items-center gap-2">
        <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
          <Folders size={18} className="text-primary-foreground" />
        </div>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="font-display text-sm font-bold text-gradient-primary whitespace-nowrap"
          >
            SFO
          </motion.span>
        )}
      </div>

      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200 group
                ${isActive
                  ? "bg-primary/10 text-primary border border-primary/20 glow-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
            >
              <item.icon size={18} className="flex-shrink-0" />
              {!collapsed && (
                <span className={`whitespace-nowrap ${isActive ? "font-semibold" : "font-medium"}`}>
                  {item.label}
                </span>
              )}
              {!collapsed && item.to === "/upload" && files.length > 0 && (
                <span className="ml-auto text-xs bg-secondary rounded-full px-2 py-0.5">{files.length}</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-2 border-t border-border space-y-1">
        {!collapsed && profile && (
          <div className="px-3 py-2 rounded-lg bg-secondary/50">
            <p className="text-sm font-medium text-foreground truncate">{profile.name || "User"}</p>
            <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
          </div>
        )}
        <button
          onClick={toggle}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm w-full text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          title="Toggle theme"
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          {!collapsed && <span>{theme === "dark" ? "Light" : "Dark"} mode</span>}
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm w-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <LogOut size={18} className="flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
        <button
          onClick={onToggle}
          className="flex items-center justify-center rounded-lg px-3 py-2 text-sm w-full text-muted-foreground hover:bg-secondary transition-colors"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </motion.aside>
  );
};
