
import React from 'react';
import { LanguageSelector } from '@/components/LanguageSelector';
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { T } from '@/components/T';

const Settings = () => {
  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6"><T keyName="settings">Settings</T></h1>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle><T keyName="language">Language</T></CardTitle>
            <CardDescription><T keyName="selectLanguage">Select your preferred language</T></CardDescription>
          </CardHeader>
          <CardContent>
            <LanguageSelector />
          </CardContent>
        </Card>
        
        {/* More settings sections can be added here */}
      </div>
    </DashboardLayout>
  );
};

export default Settings;
