import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Database,
  LayoutDashboard,
  Server,
  Calendar,
  History,
  Settings,
  Bell,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Terminal
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

// Organized into categories
const groups = [
  {
    label: 'Main',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
      { icon: History, label: 'Backup History', path: '/history' },
    ]
  },
  {
    label: 'PostgreSQL',
    items: [
      { icon: Server, label: 'Postgres Connections', path: '/connections/postgresql' },
      { icon: Calendar, label: 'Postgres Schedules', path: '/schedules/postgresql' },
    ]
  },
  {
    label: 'SQL Server',
    items: [
      { icon: Terminal, label: 'SqlServer Connections', path: '/connections/sqlserver' },
      { icon: Calendar, label: 'SqlServer Schedules', path: '/schedules/sqlserver' },
    ]
  },
  {
    label: 'System',
    items: [
      { icon: Bell, label: 'Notifications', path: '/notifications' },
      { icon: Settings, label: 'Settings', path: '/settings' },
    ]
  }
];

export default function Sidebar() {
  const location = useLocation();
  const { signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.aside
      initial={{ width: 256 }}
      animate={{ width: collapsed ? 80 : 256 }}
      transition={{ duration: 0.2 }}
      className="h-screen sticky top-0 flex flex-col bg-sidebar border-r border-sidebar-border"
    >
      <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/20 shadow-glow shrink-0">
            <Database className="h-5 w-5 text-primary" />
          </div>
          {!collapsed && (
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-bold text-gradient text-lg">
              DB Backup Pro
            </motion.span>
          )}
        </Link>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-6 overflow-y-auto">
        {groups.map((group) => (
          <div key={group.label} className="space-y-1">
            {!collapsed && (
              <h3 className="px-3 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                {group.label}
              </h3>
            )}
            {group.items.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-sidebar-accent text-primary shadow-glow'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  )}
                >
                  <item.icon className={cn('h-4 w-4 shrink-0', isActive && 'text-primary')} />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <Button
          variant="ghost"
          className={cn('w-full justify-start gap-3 text-muted-foreground hover:text-destructive', collapsed && 'justify-center')}
          onClick={() => signOut()}
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span>Sign Out</span>}
        </Button>
      </div>
    </motion.aside>
  );
}