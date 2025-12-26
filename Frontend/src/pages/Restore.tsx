import Header from '@/components/layout/Header';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { RotateCcw } from 'lucide-react';

export default function Restore() {
  return (
    <div className="flex-1">
      <Header title="Restore Database" description="Restore from backup files" />
      <div className="p-6">
        <Card className="border-dashed border-2 border-border">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <RotateCcw className="h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle className="mb-2">No backups to restore</CardTitle>
            <p className="text-muted-foreground text-center">Create backups first, then you can restore them here.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
