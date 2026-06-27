'use client';

import { Button, HStack } from '@chakra-ui/react';
import { FileDown } from 'lucide-react';
import { useState } from 'react';

import TimePicker from '@/components/filters/TimePicker';
import { toaster } from '@/components/ui/toaster';

import { triggerDownload } from '@/lib/download';
import { MatchSearchParamsKeys, useDashboardFilters } from '@/lib/nuqs';

const FILE_NAME = 'analytics-overview-report.pdf';

export default function DashboardFilters() {
  const [{ interval }, setSearchParams] = useDashboardFilters();
  const [downloading, setDownloading] = useState(false);

  const handleSearchParams = (key: MatchSearchParamsKeys, value: string) => {
    setSearchParams({ [key]: value, page: 1 }, { shallow: false });
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const response = await fetch('/api/reports/dashboard', {
        method: 'POST',
        body: JSON.stringify({ interval, filename: FILE_NAME }),
      });

      if (!response.ok) {
        const { error } = await response.json();
        toaster.error({
          title: 'Download failed',
          description: error,
        });
        return;
      }

      const blob = await response.blob();
      triggerDownload(blob, FILE_NAME);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <HStack>
      <Button
        variant="outline"
        colorPalette="blue"
        loading={downloading}
        loadingText="Generating..."
        onClick={handleDownload}
      >
        <FileDown /> Download
      </Button>

      <TimePicker
        value={interval}
        onChange={(value) => handleSearchParams('interval', value)}
      />
    </HStack>
  );
}
