import { Accordion, Span } from '@chakra-ui/react';
import { FileChartLine, RotateCcwKey } from 'lucide-react';
import { useTranslations } from 'next-intl';

import ResetPassword from '@/app/(auth)/_components/ResetPassword';
import AnalyticsReport from '@/app/(protected)/(overview)/reports/_components/AnalyticsReport';

const SAMPLES: Array<{
  label: 'resetPassword' | 'analyticsReport';
  icon: React.ReactNode;
  html: string;
}> = [
  {
    label: 'resetPassword',
    icon: <RotateCcwKey size={18} />,
    html: ResetPassword({
      name: 'Admin',
      url: 'https://sgr-portal.vercel.app/reset-password?token=sample',
    }),
  },
  {
    label: 'analyticsReport',
    icon: <FileChartLine size={18} />,
    html: AnalyticsReport({
      period: '01/01/2026 - 31/12/2026',
    }),
  },
];

export default function EmailPreview() {
  const t = useTranslations('emails.samples');

  return (
    <Accordion.Root collapsible>
      {SAMPLES.map((item, index) => (
        <Accordion.Item key={index} value={item.label}>
          <Accordion.ItemTrigger fontWeight="normal" fontSize="sm">
            {item.icon}
            <Span flex={1}>{t(item.label)}</Span>
            <Accordion.ItemIndicator />
          </Accordion.ItemTrigger>
          <Accordion.ItemContent>
            <Accordion.ItemBody
              dangerouslySetInnerHTML={{ __html: item.html }}
            />
          </Accordion.ItemContent>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}
