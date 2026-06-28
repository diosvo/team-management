'use client';

import { Button, HStack, Menu, Portal } from '@chakra-ui/react';
import { ChevronDown, FileDown, Send } from 'lucide-react';
import { useState } from 'react';

import TimePicker from '@/components/filters/TimePicker';
import { toaster } from '@/components/ui/toaster';

import { triggerDownload } from '@/lib/download';
import { MatchSearchParamsKeys, useDashboardFilters } from '@/lib/nuqs';
import { formatDuration } from '@/utils/formatter';

import EmailReport from './EmailReport';

export default function DashboardFilters() {
  const [{ interval }, setSearchParams] = useDashboardFilters();
  const [downloading, setDownloading] = useState(false);
  const [open, setOpen] = useState(false);

  const formattedPeriod = formatDuration(interval);
  // Collapse non-digit runs (the "/" in dates and the " - " separator) into a
  // single dash so the OS doesn't rewrite illegal "/" characters to "_".
  const filename = `sgr-report-${formattedPeriod.replace(/\D+/g, '-')}.pdf`;

  const handleSearchParams = (key: MatchSearchParamsKeys, value: string) => {
    setSearchParams({ [key]: value, page: 1 }, { shallow: false });
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const response = await fetch('/api/reports/dashboard', {
        method: 'POST',
        body: JSON.stringify({ period: formattedPeriod, filename }),
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
      triggerDownload(blob, filename);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      <HStack>
        <Menu.Root>
          <Menu.Trigger asChild>
            <Button
              variant="outline"
              colorPalette="blue"
              loading={downloading}
              loadingText="Generating..."
            >
              Actions <ChevronDown />
            </Button>
          </Menu.Trigger>
          <Portal>
            <Menu.Positioner>
              <Menu.Content>
                <Menu.Item
                  value="download"
                  _hover={{ cursor: 'pointer' }}
                  onClick={handleDownload}
                >
                  <FileDown size={14} /> Download
                </Menu.Item>
                <Menu.Item
                  value="email"
                  _hover={{ cursor: 'pointer' }}
                  onClick={() => setOpen(true)}
                >
                  <Send size={14} /> Send to...
                </Menu.Item>
              </Menu.Content>
            </Menu.Positioner>
          </Portal>
        </Menu.Root>

        <TimePicker
          value={interval}
          onChange={(value) => handleSearchParams('interval', value)}
        />
      </HStack>

      <EmailReport
        open={open}
        interval={interval}
        filename={filename}
        formattedPeriod={formattedPeriod}
        onOpenChange={setOpen}
      />
    </>
  );
}
