import Header from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings as SettingsIcon } from 'lucide-react';

export default function Settings() {
  return (
    <div className="flex-1">
      <Header title="Settings" description="Manage your account and preferences" />
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              General Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Settings configuration coming soon.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
