import { motion } from 'framer-motion';
import Header from '@/components/layout/Header';
import { Card, CardContent, CardTitle, StatCard } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  History as HistoryIcon, 
  Download, 
  Database, 
  User, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  FilterX, 
  Trash2,
  FileCode
} from 'lucide-react';
import { useBackupHistory } from '@/hooks/useBackupHistory';
import { useConnections } from '@/hooks/useConnections';
import { format } from 'date-fns';

export default function History() {
  const { backups, loading, filters, setFilters, downloadBackup, deleteBackup } = useBackupHistory();
  const { connections } = useConnections(); // Fetches all connections for the filter dropdown

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-success/20 text-success border-success/30 hover:bg-success/20 shadow-sm"><CheckCircle2 className="w-3 h-3 mr-1" /> Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive" className="hover:bg-destructive shadow-sm"><XCircle className="w-3 h-3 mr-1" /> Failed</Badge>;
      case 'running':
        return <Badge className="bg-primary/20 text-primary animate-pulse border-primary/30 hover:bg-primary/20 shadow-sm"><Clock className="w-3 h-3 mr-1" /> Running</Badge>;
      default:
        return <Badge variant="secondary" className="shadow-sm">Pending</Badge>;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 KB';
    const kb = bytes / 1024;
    if (kb > 1024) return `${(kb / 1024).toFixed(2)} MB`;
    return `${kb.toFixed(2)} KB`;
  };

  return (
    <div className="flex-1 min-h-screen bg-background">
      <Header 
        title="Backup History" 
        description="View, filter, and download your database backup logs" 
      />
      
      <div className="p-6 space-y-6">
        {/* Filter Section - DevOps Style */}
        <div className="flex flex-col md:flex-row gap-4 items-end bg-secondary/20 p-4 rounded-xl border border-border/50 backdrop-blur-sm">
          <div className="grid gap-2 flex-1 w-full">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Database className="w-3 h-3" /> Filter by Connection
            </label>
            <Select 
              value={filters.connection_id || "all"} 
              onValueChange={(v) => setFilters({ ...filters, connection_id: v === "all" ? undefined : v })}
            >
              <SelectTrigger className="bg-background border-border/50">
                <SelectValue placeholder="All Database Connections" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Connections</SelectItem>
                {connections.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] bg-secondary px-1 rounded text-muted-foreground uppercase">{c.db_type === 'postgresql' ? 'PG' : 'SQL'}</span>
                       {c.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setFilters({})}
            disabled={!filters.connection_id}
            className="h-10 px-4"
          >
            <FilterX className="w-4 h-4 mr-2" /> Clear
          </Button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4 opacity-50" />
            <p className="text-sm text-muted-foreground font-mono animate-pulse">Syncing history from Python backend...</p>
          </div>
        ) : backups.length === 0 ? (
          <Card className="border-dashed border-2 border-border/50 bg-transparent">
            <CardContent className="flex flex-col items-center justify-center py-20">
              <div className="p-4 rounded-full bg-secondary/30 mb-4">
                <HistoryIcon className="h-10 w-10 text-muted-foreground opacity-20" />
              </div>
              <CardTitle className="text-lg font-semibold mb-2">Logs Empty</CardTitle>
              <p className="text-sm text-muted-foreground text-center max-w-xs">
                No backup execution logs found. Try triggering a manual backup from the Schedules page.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {backups.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <StatCard className="p-5 group border-border/40 hover:border-primary/40 transition-all duration-300">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-start gap-5">
                      {/* Icon based on status */}
                      <div className={`p-3 rounded-xl ${item.status === 'failed' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary shadow-glow-sm'}`}>
                        {item.status === 'failed' ? <XCircle className="w-6 h-6" /> : <Database className="w-6 h-6" />}
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h4 className="text-base font-bold text-foreground tracking-tight">
                            {item.connection_name || 'Legacy Connection'}
                          </h4>
                          {getStatusBadge(item.status)}
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-primary/60" /> 
                            {format(new Date(item.created_at), 'MMM d, yyyy • HH:mm')}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-primary/60" /> 
                            {item.user_email || 'System Account'}
                          </span>
                          <span className="flex items-center gap-1.5 bg-secondary/50 px-2 py-0.5 rounded text-foreground/70 border border-border/50">
                            <FileCode className="w-3 h-3" />
                            {item.backup_format?.toUpperCase()}
                          </span>
                          {item.file_size_bytes > 0 && (
                            <span className="text-foreground/60">{formatFileSize(item.file_size_bytes)}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end md:self-center">
                      {item.status === 'completed' && (
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          // Passing both ID and Filename to our authenticated download handler
                          onClick={() => downloadBackup(item.id, item.file_name)} 
                          className="h-9 px-4 hover:bg-primary hover:text-primary-foreground transition-colors"
                        >
                          <Download className="w-4 h-4 mr-2" /> Download
                        </Button>
                      )}
                      
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                        onClick={() => {
                          if (confirm('Delete this history record and file?')) {
                            deleteBackup(item.id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Detailed Error message if failed */}
                  {item.status === 'failed' && item.error_message && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="mt-4 p-3 rounded-lg bg-destructive/5 border border-destructive/10 border-l-4 border-l-destructive shadow-inner"
                    >
                      <p className="text-[10px] uppercase font-bold text-destructive mb-1 tracking-widest">Error Traceback</p>
                      <p className="text-[11px] text-destructive/90 font-mono leading-relaxed break-all">
                        {item.error_message}
                      </p>
                    </motion.div>
                  )}
                </StatCard>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}