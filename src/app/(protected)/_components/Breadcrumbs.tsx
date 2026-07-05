'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Fragment } from 'react';

import { Breadcrumb } from '@chakra-ui/react';

import { segmentToLabel } from '../_helpers/utils';

/**
 * Segments that have no index route of their own, so they should be rendered
 * as plain text instead of a link
 *
 * @example `/profile` only exists as `/profile/[id]`
 */
const NON_NAVIGABLE_SEGMENTS = new Set<string>(['profile']);

export default function Breadcrumbs() {
  const pathname = usePathname();

  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return null;

  const crumbs = segments.map((segment, index) => ({
    segment,
    label: segmentToLabel(segment),
    href: `/${segments.slice(0, index + 1).join('/')}`,
    isLast: index === segments.length - 1,
  }));

  return (
    <Breadcrumb.Root size="md">
      <Breadcrumb.List>
        {crumbs.map(({ segment, label, href, isLast }) => {
          const isLink = !isLast && !NON_NAVIGABLE_SEGMENTS.has(segment);

          return (
            <Fragment key={href}>
              <Breadcrumb.Item>
                {isLink ? (
                  <Breadcrumb.Link asChild>
                    <Link href={href}>{label}</Link>
                  </Breadcrumb.Link>
                ) : isLast ? (
                  <Breadcrumb.CurrentLink>{label}</Breadcrumb.CurrentLink>
                ) : (
                  label
                )}
              </Breadcrumb.Item>
              {!isLast && <Breadcrumb.Separator />}
            </Fragment>
          );
        })}
      </Breadcrumb.List>
    </Breadcrumb.Root>
  );
}
