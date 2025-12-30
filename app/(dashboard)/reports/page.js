'use client';

import { useState } from 'react';
import ReportFilters from '@/components/reports/ReportFilters';
import ReportTable from '@/components/reports/ReportTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('inventory');
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: ''
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Reports</h1>
      </div>

      <ReportFilters filters={filters} onChange={setFilters} />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="inventory">Inventory Report</TabsTrigger>
          <TabsTrigger value="customers">Customer Report</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="mt-6">
          <ReportTable type="inventory" filters={filters} />
        </TabsContent>

        <TabsContent value="customers" className="mt-6">
          <ReportTable type="customers" filters={filters} />
        </TabsContent>
      </Tabs>
    </div>
  );
}