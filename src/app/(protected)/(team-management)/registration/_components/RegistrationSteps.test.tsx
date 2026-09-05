import { renderWithUI, screen, setupTestLifecycle } from '@/test/utilities';

import RegistrationSteps, { type StepDef } from './RegistrationSteps';

describe('RegistrationSteps', () => {
  const STEPS: Array<StepDef> = [
    { title: 'Pick a league', done: true },
    { title: 'Select players', done: false },
    { title: 'Add a note', done: false, isOptional: true },
  ];

  const setup = (steps: Array<StepDef> = STEPS) =>
    renderWithUI(<RegistrationSteps steps={steps} />);

  setupTestLifecycle();

  test('renders a step for every definition', () => {
    setup();

    STEPS.forEach(({ title }) => {
      expect(screen.getByText(title, { exact: false })).toBeInTheDocument();
    });
  });

  test('marks an optional step as optional', () => {
    setup();

    expect(screen.getByText('(optional)')).toBeInTheDocument();
  });

  test('shows a check for a completed step and its number otherwise', () => {
    setup();

    // StepIndicator swaps the number for a check icon once the step is done.
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.queryByText('1')).not.toBeInTheDocument();
  });

  test('renders nothing but the list when there are no steps', () => {
    setup([]);

    expect(screen.queryByText('(optional)')).not.toBeInTheDocument();
  });
});
