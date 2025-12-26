import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Header from '@/components/layout/Header';
import { Card, CardContent, CardTitle, StatCard } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Calendar, Plus, Trash2, Play, Pause, Loader2, Clock, Database, Terminal } from 'lucide-react';
import { useSchedules } from '@/hooks/useSchedules';
import { useConnections } from '@/hooks/useConnections';
import { format } from 'date-fns';

// Defining types locally to remove Supabase dependency
type ScheduleFrequency = 'manual' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'custom';
type BackupType = 'full' | 'schema' | 'tables';
type BackupFormat = 'sql' | 'dump' | 'backup';

export default function Schedules({ type }: { type: 'postgresql' | 'sqlserver' }) {
  // Use the database type to filter both the schedules and the available connections
  const { schedules, loading, saving, saveSchedule, deleteSchedule, toggleSchedule, runBackupNow } = useSchedules(type);
  const { connections } = useConnections(type);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [runningId, setRunningId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    connection_id: '',
    frequency: 'daily' as ScheduleFrequency,
    backup_type: 'full' as BackupType,
    backup_format: (type === 'postgresql' ? 'sql' : 'backup') as BackupFormat,
    compression_enabled: true,
    encryption_enabled: false,
    retention_days: 30,
    max_backups: 10,
  });

  // Reset form when the page type changes
  useEffect(() => {
    setFormData({
      name: '',
      connection_id: '',
      frequency: 'daily',
      backup_type: 'full',
      backup_format: type === 'postgresql' ? 'sql' : 'backup',
      compression_enabled: true,
      encryption_enabled: false,
      retention_days: 30,
      max_backups: 10,
    });
  }, [type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await saveSchedule({ ...formData, db_type: type });
    if (success) {
      setIsDialogOpen(false);
      setFormData({ 
        name: '', 
        connection_id: '', 
        frequency: 'daily', 
        backup_type: 'full', 
        backup_format: type === 'postgresql' ? 'sql' : 'backup', 
        compression_enabled: true, 
        encryption_enabled: false, 
        retention_days: 30, 
        max_backups: 10 
      });
    }
  };

  const handleRunNow = async (schedule: any) => {
    setRunningId(schedule.id);
    await runBackupNow(schedule.id);
    setRunningId(null);
  };

  if (loading) {
    return <div className="flex-1 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const dbLabel = type === 'postgresql' ? 'Postgres' : 'SQL Server';
  const pageTitle = `${dbLabel} Schedules`;
  const MainIcon = type === 'postgresql' ? Database : Terminal;

  return (
    <div className="flex-1">
      <Header title={pageTitle} description={`Configure and manage automated ${dbLabel} backups`} />
      
      <div className="p-6 space-y-6">
        <div className="flex justify-end">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={connections.length === 0}>
                <Plus className="h-4 w-4 mr-2" />
                Create {dbLabel} Schedule
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create {dbLabel} Backup Schedule</DialogTitle>
                <DialogDescription>Configure automated backups for your {dbLabel} instance.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Schedule Name</Label>
                  <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder={`Daily ${dbLabel} Backup`} required />
                </div>
                <div className="space-y-2">
                  <Label>Database Connection</Label>
                  <Select value={formData.connection_id} onValueChange={v => setFormData({...formData, connection_id: v})}>
                    <SelectTrigger><SelectValue placeholder={`Select ${dbLabel} connection`} /></SelectTrigger>
                    <SelectContent>
                      {connections.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Frequency</Label>
                    <Select value={formData.frequency} onValueChange={v => setFormData({...formData, frequency: v as ScheduleFrequency})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manual Only</SelectItem>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Backup Type</Label>
                    <Select value={formData.backup_type} onValueChange={v => setFormData({...formData, backup_type: v as BackupType})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full">Full Backup</SelectItem>
                        <SelectItem value="schema">Schema Only</SelectItem>
                        <SelectItem value="tables">Selected Tables</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Format</Label>
                    <Select value={formData.backup_format} onValueChange={v => setFormData({...formData, backup_format: v as BackupFormat})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {type === 'postgresql' ? (
                          <>
                            <SelectItem value="sql">.sql (Plain)</SelectItem>
                            <SelectItem value="dump">.dump (Custom)</SelectItem>
                          </>
                        ) : (
                          <SelectItem value="backup">.bak (Standard)</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Retention (days)</Label>
                    <Input type="number" value={formData.retention_days} onChange={e => setFormData({...formData, retention_days: parseInt(e.target.value)})} />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Label>Enable Compression</Label>
                  <Switch checked={formData.compression_enabled} onCheckedChange={v => setFormData({...formData, compression_enabled: v})} />
                </div>
                <Button type="submit" className="w-full" disabled={saving || !formData.connection_id}>
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}Create Schedule
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {connections.length === 0 ? (
          <Card className="border-dashed border-2 border-border">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MainIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <CardTitle className="mb-2">Add a {dbLabel} connection first</CardTitle>
              <p className="text-muted-foreground text-center">You need to add a {dbLabel} connection before creating schedules.</p>
            </CardContent>
          </Card>
        ) : schedules.length === 0 ? (
          <Card className="border-dashed border-2 border-border">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <CardTitle className="mb-2">No {dbLabel} schedules configured</CardTitle>
              <p className="text-muted-foreground text-center">Create backup schedules to automate your {dbLabel} backups.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {schedules.map((schedule, i) => (
              <motion.div key={schedule.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <StatCard className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${schedule.is_active ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'}`}>
                        <Clock className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{schedule.name}</h3>
                        <p className="text-sm text-muted-foreground capitalize">{schedule.frequency} • {schedule.backup_type} • .{schedule.backup_format}</p>
                        {schedule.next_run_at && schedule.is_active && (
                          <p className="text-xs text-muted-foreground mt-1">Next run: {format(new Date(schedule.next_run_at), 'PPp')}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleRunNow(schedule)} disabled={runningId === schedule.id}>
                        {runningId === schedule.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => toggleSchedule(schedule.id, !schedule.is_active)}>
                        {schedule.is_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Schedule?</AlertDialogTitle>
                            <AlertDialogDescription>This will permanently delete the {dbLabel} schedule.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteSchedule(schedule.id)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </StatCard>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}