import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export function useSchedules(dbType?: 'postgresql' | 'sqlserver') {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      loadSchedules();
    }
  }, [user, dbType]);

  const loadSchedules = async () => {
    setLoading(true);
    try {
      // Filter schedules by the database type (Postgres vs SQL Server)
      const response = await api.get('/schedules/', {
        params: dbType ? { db_type: dbType } : {}
      });
      setSchedules(response.data);
    } catch (error) {
      console.error('Error loading schedules:', error);
      toast({
        title: 'Error',
        description: 'Failed to load schedules from Python API',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSchedule = async (data: any): Promise<boolean> => {
    if (!user) return false;
    setSaving(true);
    try {
      await api.post('/schedules/', data);
      toast({
        title: 'Schedule Created',
        description: `${data.name} has been created successfully`,
      });
      await loadSchedules();
      return true;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to create schedule',
        variant: 'destructive',
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const deleteSchedule = async (id: string): Promise<boolean> => {
    try {
      await api.delete(`/schedules/${id}`);
      toast({ 
        title: 'Schedule Deleted', 
        description: 'Schedule has been removed' 
      });
      await loadSchedules();
      return true;
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: 'Failed to delete schedule', 
        variant: 'destructive' 
      });
      return false;
    }
  };

  const toggleSchedule = async (id: string, isActive: boolean): Promise<boolean> => {
    try {
      // Logic maintained for Python PATCH endpoint
      await api.patch(`/schedules/${id}/toggle`, null, { 
        params: { is_active: isActive } 
      });
      toast({ 
        title: isActive ? 'Schedule Activated' : 'Schedule Paused' 
      });
      await loadSchedules();
      return true;
    } catch (error) {
      return false;
    }
  };

  const runBackupNow = async (scheduleId: string): Promise<boolean> => {
    try {
      toast({ 
        title: 'Backup Started', 
        description: 'Task queued in background...' 
      });
      // Logic maintained to trigger the Python Celery task
      await api.post(`/history/run/${scheduleId}`);
      return true;
    } catch (error: any) {
      toast({
        title: 'Backup Failed',
        description: error.response?.data?.detail || 'Execution failed',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    schedules,
    loading,
    saving,
    loadSchedules,
    saveSchedule,
    deleteSchedule,
    toggleSchedule,
    runBackupNow,
  };
}