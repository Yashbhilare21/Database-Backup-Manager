import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export function useBackupHistory() {
  const { user } = useAuth();
  const [backups, setBackups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<any>({});
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);

  const loadBackups = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const response = await api.get('/history/', { params: filters });
      setBackups(response.data);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadBackups(true);
    }
  }, [user, filters]);

  useEffect(() => {
    const hasActiveTasks = backups.some(
      (b) => b.status === 'running' || b.status === 'pending'
    );

    if (hasActiveTasks && !pollingInterval.current) {
      pollingInterval.current = setInterval(() => {
        loadBackups(false); 
      }, 5000);
    } else if (!hasActiveTasks && pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    }

    return () => {
      if (pollingInterval.current) clearInterval(pollingInterval.current);
    };
  }, [backups]);

  // FIXED: Authenticated Download Logic
  const downloadBackup = async (backupId: string, fileName: string): Promise<void> => {
    try {
      toast({ title: 'Downloading', description: 'Fetching backup file...' });
      
      // Fetch file as blob using the stored JWT token
      const response = await api.get(`/history/download/${backupId}`, {
        responseType: 'blob', 
      });

      // Create a local URL for the downloaded blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Use the filename provided by the database record
      link.setAttribute('download', fileName || `backup_${backupId}.sql`);
      
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({ title: 'Success', description: 'Download started' });
    } catch (error) {
      console.error('Download failed:', error);
      toast({ title: 'Error', description: 'Download failed. Please check server logs.', variant: 'destructive' });
    }
  };

  const deleteBackup = async (backupId: string): Promise<boolean> => {
    try {
      await api.delete(`/history/${backupId}`);
      toast({ title: 'Success', description: 'Backup record deleted' });
      await loadBackups(false);
      return true;
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' });
      return false;
    }
  };

  return { 
    backups, 
    loading, 
    filters, 
    setFilters, 
    loadBackups, 
    downloadBackup, 
    deleteBackup 
  };
}