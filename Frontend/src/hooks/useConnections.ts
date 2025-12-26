import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface Connection {
  id: string;
  name: string;
  host: string;
  port: number;
  database_name: string;
  username: string;
  ssl_mode: string;
  is_active: boolean;
  db_type: 'postgresql' | 'sqlserver'; // Added to track type
  last_connected_at: string | null;
  created_at: string;
}

interface ConnectionFormData {
  name: string;
  host: string;
  port: number;
  database_name: string;
  username: string;
  password: string;
  ssl_mode: string;
  db_type?: 'postgresql' | 'sqlserver'; // Optional for the form
}

export function useConnections(dbType?: 'postgresql' | 'sqlserver') {
  const { user } = useAuth();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      loadConnections();
    }
  }, [user, dbType]); // Reload if the type changes

  const loadConnections = async () => {
    setLoading(true);
    try {
      // Pass db_type as a query parameter to the Python backend
      const response = await api.get('/connections/', {
        params: dbType ? { db_type: dbType } : {}
      });
      setConnections(response.data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load connections from Python API',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async (data: ConnectionFormData): Promise<boolean> => {
    setTesting(true);
    try {
      const response = await api.post('/connections/test', {
        ...data,
        db_type: dbType || data.db_type // Ensure the engine type is sent to the test runner
      });

      if (response.data.success) {
        toast({
          title: 'Connection Successful',
          description: `Connected to ${data.database_name} via Python backend`,
        });
        return true;
      } else {
        throw new Error(response.data.message);
      }
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || 'Connection test failed';
      toast({
        title: 'Connection Failed',
        description: message,
        variant: 'destructive',
      });
      return false;
    } finally {
      setTesting(false);
    }
  };

  const saveConnection = async (data: ConnectionFormData): Promise<boolean> => {
    if (!user) return false;
    
    setSaving(true);
    try {
      // Automatically attach the dbType from the page context
      await api.post('/connections/', {
        ...data,
        db_type: dbType || data.db_type
      });

      toast({
        title: 'Connection Saved',
        description: `${data.name} has been added successfully`,
      });

      await loadConnections();
      return true;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to save connection',
        variant: 'destructive',
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const deleteConnection = async (id: string): Promise<boolean> => {
    try {
      await api.delete(`/connections/${id}`);
      toast({
        title: 'Connection Deleted',
        description: 'Connection has been removed',
      });
      await loadConnections();
      return true;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to delete connection',
        variant: 'destructive',
      });
      return false;
    }
  };

  const updateConnection = async (id: string, data: Partial<ConnectionFormData>): Promise<boolean> => {
    try {
      await api.patch(`/connections/${id}`, data);
      toast({
        title: 'Connection Updated',
        description: 'Connection has been updated successfully',
      });
      await loadConnections();
      return true;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to update connection',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    connections,
    loading,
    testing,
    saving,
    loadConnections,
    testConnection,
    saveConnection,
    deleteConnection,
    updateConnection,
  };
}