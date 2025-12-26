import Header from '@/components/layout/Header';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Bell } from 'lucide-react';

export default function Notifications() {
  return (
    <div className="flex-1">
      <Header title="Notifications" description="View backup alerts and system notifications" />
      <div className="p-6">
        <Card className="border-dashed border-2 border-border">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bell className="h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle className="mb-2">No notifications</CardTitle>
            <p className="text-muted-foreground text-center">You'll receive notifications about backup status here.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
