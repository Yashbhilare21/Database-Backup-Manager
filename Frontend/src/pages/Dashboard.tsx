import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Header from '@/components/layout/Header';
import { StatCard } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Database,
  Calendar,
  CheckCircle,
  AlertCircle,
  HardDrive,
  Clock,
  Plus,
  Play,
  ArrowUpRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    connections: 0,
    schedules: 0,
    completedBackups: 0,
    failedBackups: 0,
  });

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    const [connections, schedules, completed, failed] = await Promise.all([
      supabase.from('database_connections').select('id', { count: 'exact', head: true }),
      supabase.from('backup_schedules').select('id', { count: 'exact', head: true }),
      supabase.from('backup_history').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
      supabase.from('backup_history').select('id', { count: 'exact', head: true }).eq('status', 'failed'),
    ]);

    setStats({
      connections: connections.count || 0,
      schedules: schedules.count || 0,
      completedBackups: completed.count || 0,
      failedBackups: failed.count || 0,
    });
  };

  const statCards = [
    { icon: Database, label: 'Connections', value: stats.connections, color: 'text-primary' },
    { icon: Calendar, label: 'Schedules', value: stats.schedules, color: 'text-chart-4' },
    { icon: CheckCircle, label: 'Successful Backups', value: stats.completedBackups, color: 'text-success' },
    { icon: AlertCircle, label: 'Failed Backups', value: stats.failedBackups, color: 'text-destructive' },
  ];

  return (
    <div className="flex-1">
      <Header title="Dashboard" description="Overview of your backup operations" />
      
      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <StatCard className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-3xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl bg-secondary ${stat.color}`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                </div>
              </StatCard>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <Link to="/connections">
            <StatCard className="p-6 cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/20 text-primary">
                  <Plus className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Add Connection</h3>
                  <p className="text-sm text-muted-foreground">Connect a PostgreSQL database</p>
                </div>
                <ArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </StatCard>
          </Link>

          <Link to="/schedules">
            <StatCard className="p-6 cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-success/20 text-success">
                  <Clock className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Create Schedule</h3>
                  <p className="text-sm text-muted-foreground">Set up automated backups</p>
                </div>
                <ArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </StatCard>
          </Link>

          <StatCard className="p-6 cursor-pointer group">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-warning/20 text-warning">
                <Play className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Run Backup Now</h3>
                <p className="text-sm text-muted-foreground">Trigger a manual backup</p>
              </div>
              <ArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </StatCard>
        </motion.div>

        {/* Welcome Card for new users */}
        {stats.connections === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="border border-primary/30 rounded-xl p-8 bg-gradient-card text-center"
          >
            <div className="p-4 rounded-full bg-primary/20 w-fit mx-auto mb-4">
              <Database className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Welcome to PG Backup Pro</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Get started by adding your first PostgreSQL database connection. 
              Then set up automated backup schedules to protect your data.
            </p>
            <Button asChild size="lg">
              <Link to="/connections">
                <Plus className="h-5 w-5 mr-2" />
                Add Your First Connection
              </Link>
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
