import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Header from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle, StatCard } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Server, Plus, Trash2, TestTube, Loader2, CheckCircle, XCircle, Database, Terminal, ShieldCheck } from 'lucide-react';
import { useConnections } from '@/hooks/useConnections';
import { formatDistanceToNow } from 'date-fns';

export default function Connections({ type }: { type: 'postgresql' | 'sqlserver' }) {
  const { connections, loading, testing, saving, testConnection, saveConnection, deleteConnection } = useConnections(type);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Initialize form with dynamic defaults based on DB type
  const [formData, setFormData] = useState({
    name: '',
    host: '',
    port: type === 'postgresql' ? 5432 : 1433,
    database_name: '',
    username: '',
    password: '',
    ssl_mode: type === 'postgresql' ? 'require' : 'true', // SQL Server uses 'true' for encryption
  });

  // Effect to reset form and update defaults when the 'type' prop changes
  useEffect(() => {
    setFormData({
      name: '',
      host: '',
      port: type === 'postgresql' ? 5432 : 1433,
      database_name: '',
      username: '',
      password: '',
      ssl_mode: type === 'postgresql' ? 'require' : 'true',
    });
  }, [type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Logic preserved: save the connection with the explicit db_type
    const success = await saveConnection({ ...formData, db_type: type });
    if (success) {
      setIsDialogOpen(false);
      // Reset form to defaults
      setFormData({ 
        name: '', 
        host: '', 
        port: type === 'postgresql' ? 5432 : 1433, 
        database_name: '', 
        username: '', 
        password: '', 
        ssl_mode: type === 'postgresql' ? 'require' : 'true' 
      });
    }
  };

  const handleTest = async () => {
    await testConnection({ ...formData, db_type: type });
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Dynamic Content based on type
  const pageTitle = type === 'postgresql' ? 'Postgres Connections' : 'SQL Server Connections';
  const dbNameLabel = type === 'postgresql' ? 'PostgreSQL' : 'SQL Server';
  const MainIcon = type === 'postgresql' ? Database : Terminal;

  return (
    <div className="flex-1">
      <Header 
        title={pageTitle} 
        description={`Manage your ${dbNameLabel} database instances and credentials`} 
      />
      
      <div className="p-6 space-y-6">
        <div className="flex justify-end">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add {type === 'postgresql' ? 'Postgres' : 'SQL Server'}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add {dbNameLabel} Connection</DialogTitle>
                <DialogDescription>
                  Enter your {dbNameLabel} connection details. Credentials are encrypted before storage on the Python server.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Connection Name</Label>
                  <Input id="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Production DB" required />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="host">Host</Label>
                    <Input id="host" value={formData.host} onChange={e => setFormData({...formData, host: e.target.value})} placeholder="db.example.com" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="port">Port</Label>
                    <Input id="port" type="number" value={formData.port} onChange={e => setFormData({...formData, port: parseInt(e.target.value)})} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="database_name">Database Name</Label>
                  <Input 
                    id="database_name" 
                    value={formData.database_name} 
                    onChange={e => setFormData({...formData, database_name: e.target.value})} 
                    placeholder={type === 'postgresql' ? 'postgres' : 'master'} 
                    required 
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input id="username" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />
                  </div>
                </div>
                
                {/* Conditional Security Options based on DB Type */}
                <div className="space-y-2">
                  <Label htmlFor="ssl_mode">
                    {type === 'postgresql' ? 'SSL Mode' : 'Encryption Policy'}
                  </Label>
                  <Select value={formData.ssl_mode} onValueChange={v => setFormData({...formData, ssl_mode: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {type === 'postgresql' ? (
                        <>
                          <SelectItem value="require">Require</SelectItem>
                          <SelectItem value="prefer">Prefer</SelectItem>
                          <SelectItem value="disable">Disable</SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="true">Encrypt (Recommended)</SelectItem>
                          <SelectItem value="false">No Encryption</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  {type === 'sqlserver' && (
                    <p className="text-[11px] text-muted-foreground italic px-1">
                      SQL Server usually requires "Encrypt=true" for cloud hosts like Azure.
                    </p>
                  )}
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={handleTest} disabled={testing || !formData.host}>
                    {testing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <TestTube className="h-4 w-4 mr-2" />}
                    Test
                  </Button>
                  <Button type="submit" className="flex-1" disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                    Save Connection
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {connections.length === 0 ? (
          <Card className="border-dashed border-2 border-border">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Server className="h-12 w-12 text-muted-foreground mb-4" />
              <CardTitle className="mb-2">No {dbNameLabel} connections yet</CardTitle>
              <p className="text-muted-foreground text-center">Add your first {dbNameLabel} connection to start managing backups.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {connections.map((conn, i) => (
              <motion.div key={conn.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <StatCard className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-primary/20 text-primary">
                        <MainIcon className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{conn.name}</h3>
                        <p className="text-sm text-muted-foreground">{conn.host}:{conn.port}/{conn.database_name}</p>
                        {conn.last_connected_at && (
                          <p className="text-xs text-muted-foreground mt-1">Last used {formatDistanceToNow(new Date(conn.last_connected_at))} ago</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center gap-1 text-sm ${conn.is_active ? 'text-success' : 'text-muted-foreground'}`}>
                        {conn.is_active ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                        {conn.is_active ? 'Active' : 'Inactive'}
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Connection?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete the {dbNameLabel} connection and cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteConnection(conn.id)}>Delete</AlertDialogAction>
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