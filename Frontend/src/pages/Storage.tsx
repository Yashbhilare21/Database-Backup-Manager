import Header from '@/components/layout/Header';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { HardDrive } from 'lucide-react';

export default function Storage() {
  return (
    <div className="flex-1">
      <Header title="Storage Configuration" description="Configure cloud storage for your backups" />
      <div className="p-6">
        <Card className="border-dashed border-2 border-border">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <HardDrive className="h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle className="mb-2">No storage configured</CardTitle>
            <p className="text-muted-foreground text-center">Configure AWS S3, Google Cloud Storage, or Azure Blob Storage.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
