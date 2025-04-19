
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Database,
  Home,
  Menu,
  User,
  Users,
  MessageSquare,
  LogIn,
  UserPlus,
  ShieldAlert,
  X,
  LogOut,
  Building,
  Briefcase
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const sidebarLinks = [
  {
    title: "Dashboard",
    href: "/",
    icon: Home,
  },
  {
    title: "Worker Registration",
    href: "/worker-registration",
    icon: UserPlus,
  },
  {
    title: "Worker Login",
    href: "/worker-login",
    icon: LogIn,
  },
  {
    title: "Admin Login",
    href: "/login?tab=admin",
    icon: ShieldAlert,
  },
  {
    title: "Business Login",
    href: "/login?tab=business",
    icon: Building,
  },
];

// Admin-only links
const adminLinks = [
  {
    title: "Admin Dashboard",
    href: "/admin-dashboard",
    icon: ShieldAlert,
  },
];

export function Sidebar() {
  const [expanded, setExpanded] = useState(true);
  const location = useLocation();
  const { currentUser, logout } = useAuth();

  return (
    <div className="relative">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-20 flex flex-col border-r bg-sidebar transition-all duration-300",
          expanded ? "w-64" : "w-16"
        )}
      >
        <div className="flex items-center justify-between p-4">
          {expanded && (
            <Link
              to="/"
              className="flex items-center gap-2 font-semibold text-xl text-sidebar-foreground"
            >
              <img src="/migii-icon.svg" alt="Migii Logo" className="h-8 w-8" />
              <span>Dashboard</span>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setExpanded(!expanded)}
            className="text-sidebar-foreground"
          >
            {expanded ? <X size={20} /> : <Menu size={20} />}
          </Button>
        </div>

        <nav className="flex-1 space-y-1 p-2">
          {sidebarLinks.map((link) => {
            const isActive = location.pathname === link.href;
            return (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                  expanded ? "" : "justify-center",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                )}
              >
                <link.icon size={20} />
                {expanded && <span>{link.title}</span>}
              </Link>
            );
          })}

          {currentUser && (
            <>
              {adminLinks.map((link) => {
                const isActive = location.pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                      expanded ? "" : "justify-center",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <link.icon size={20} />
                    {expanded && <span>{link.title}</span>}
                  </Link>
                );
              })}
            </>
          )}

          {currentUser ? (
            <div className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all cursor-pointer",
              expanded ? "" : "justify-center",
              "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground mt-4"
            )}>
              {expanded ? (
                <div className="flex w-full justify-between items-center">
                  <div className="flex items-center gap-2">
                    <User size={20} />
                    {expanded && <span>{currentUser.name || "User"}</span>}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => logout()} 
                    className="text-sidebar-foreground"
                  >
                    <LogOut size={16} />
                  </Button>
                </div>
              ) : (
                <User size={20} />
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all mt-4",
                expanded ? "" : "justify-center",
                location.pathname === "/login"
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              )}
            >
              <LogIn size={20} />
              {expanded && <span>Sign In</span>}
            </Link>
          )}
        </nav>

        <div className="border-t border-sidebar-border p-4">
          {expanded ? (
            <div className="flex flex-col gap-1">
              <p className="text-xs text-sidebar-foreground/60">
                Worker Management System
              </p>
              <p className="text-xs font-medium text-sidebar-foreground">
                migii v1.0.0
              </p>
            </div>
          ) : (
            <div className="flex justify-center">
              <span className="text-sidebar-foreground/60 text-xs">migii</span>
            </div>
          )}
        </div>
      </aside>
      <div
        className={cn(
          "transition-all duration-300",
          expanded ? "ml-64" : "ml-16"
        )}
      ></div>
    </div>
  );
}
