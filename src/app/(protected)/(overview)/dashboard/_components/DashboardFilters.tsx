'use client';

import { Button, HStack, Menu, Portal } from '@chakra-ui/react';
import { ChevronDown, FileDown, Send } from 'lucide-react';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import { useState } from 'react';

import { DateRangePicker } from '@/components/date-picker/DateRangePicker';
import { toaster } from '@/components/ui/toaster';

import { triggerDownload } from '@/lib/download';
import { useDashboardFilters } from '@/lib/nuqs';
import { ESTABLISHED_DATE } from '@/utils/constants';
import { formatDateRange } from '@/utils/datetime';

const EmailReport = dynamic(() => import('./EmailReport'), { ssr: false });

export default function DashboardFilters() {
  const t = useTranslations('dashboard.filters');
  const tCommon = useTranslations('common');
  const [{ from, to }, setSearchParams] = useDashboardFilters();
  const [downloading, setDownloading] = useState(false);
  const [open, setOpen] = useState(false);

  const formattedPeriod = formatDateRange({ from, to });
  // Collapse non-digit runs (the "/" in dates and the " - " separator) into a
  // single dash so the OS doesn't rewrite illegal "/" characters to "_".
  const filename = `sgr-report-${formattedPeriod.replace(/\D+/g, '-')}.pdf`;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const response = await fetch('/api/reports/dashboard', {
        method: 'POST',
        body: JSON.stringify({ from, to, filename }),
      });

      if (!response.ok) {
        const { error } = await response.json();
        toaster.error({
          title: t('downloadFailed'),
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
              loadingText={t('generating')}
            >
              {t('exportReport')} <ChevronDown />
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
                  <FileDown size={14} /> {t('download')}
                </Menu.Item>
                <Menu.Item
                  value="email"
                  _hover={{ cursor: 'pointer' }}
                  onClick={() => setOpen(true)}
                >
                  <Send size={14} /> {t('sendTo')}
                </Menu.Item>
              </Menu.Content>
            </Menu.Positioner>
          </Portal>
        </Menu.Root>

        <DateRangePicker
          label={tCommon('time')}
          min={ESTABLISHED_DATE}
          value={{ from, to }}
          onChange={(range) =>
            setSearchParams({ ...range, page: 1 }, { shallow: false })
          }
        />
      </HStack>

      {open && (
        <EmailReport
          open={open}
          range={{ from, to }}
          filename={filename}
          onOpenChange={setOpen}
        />
      )}
    </>
  );
}
