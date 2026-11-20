import { DOCUMENT_TYPE_SELECTION, ESTABLISHED_DATE } from '@/utils/constants';
import { DocumentType } from '@/utils/enum';

import {
  mockUseQueryStates,
  renderWithUI,
  setupTestLifecycle,
} from '@/test/utilities';

import DocumentFilters from './DocumentFilters';

// The generic Filters component is covered by its own tests; capture the props
// DocumentFilters wires through to it.
const propsSpy = {
  filters: [] as Array<{ key: string; label: string }>,
  values: undefined as unknown,
  defaults: undefined as unknown,
  onApply: (() => {}) as (values: Record<string, unknown>) => void,
};

vi.mock('@/components/filters/Filters', () => ({
  default: (props: typeof propsSpy) => {
    Object.assign(propsSpy, props);
    return <div>Filters</div>;
  },
}));

describe('DocumentFilters', () => {
  const mockSetSearchParams = vi.fn();

  const setup = (values: Record<string, unknown> = {}) => {
    mockUseQueryStates(
      { page: 1, q: '', type: [], from: '', to: '', ...values },
      mockSetSearchParams,
    );

    return renderWithUI(<DocumentFilters />);
  };

  setupTestLifecycle();

  test('provides the event date range and type filters', () => {
    setup();

    expect(propsSpy.filters).toMatchObject([
      {
        key: 'event_date',
        label: 'Event date',
        control: { type: 'date-range', min: ESTABLISHED_DATE },
      },
      {
        key: 'type',
        label: 'Type',
        control: {
          type: 'checkbox-group',
          // Labels and hints come from the `documentType` enum messages.
          options: DOCUMENT_TYPE_SELECTION.map(({ value }) =>
            expect.objectContaining({ value }),
          ),
        },
      },
    ]);
  });

  test('passes the committed values and defaults through', () => {
    setup({ type: [DocumentType.VIDEO], from: '2025-01-01', to: '2025-12-31' });

    expect(propsSpy.values).toMatchObject({
      type: [DocumentType.VIDEO],
      from: '2025-01-01',
      to: '2025-12-31',
    });
    // No default window: the event date range is optional (all time).
    expect(propsSpy.defaults).toMatchObject({ type: [], from: '', to: '' });
  });

  test('resets to the first page when filters are applied', () => {
    setup();

    propsSpy.onApply({ type: [DocumentType.ALBUM] });

    expect(mockSetSearchParams).toHaveBeenCalledWith({
      type: [DocumentType.ALBUM],
      page: 1,
    });
  });
});
