import StepIndicator from '@/components/StepIndicator';
import { Span, Steps } from '@chakra-ui/react';

export type StepDef = {
  title: string;
  done: boolean;
  isOptional?: boolean;
};

export default function RegistrationSteps({
  steps,
}: {
  steps: Array<StepDef>;
}) {
  return (
    <Steps.Root
      step={0}
      size="sm"
      colorPalette="green"
      linear={false}
      count={steps.length}
    >
      <Steps.List>
        {steps.map((step, index) => (
          <Steps.Item key={step.title} index={index} title={step.title}>
            <Steps.Trigger>
              <StepIndicator step={index + 1} done={step.done} />
              <Steps.Title
                whiteSpace="nowrap"
                display={{ base: 'none', md: 'block' }}
              >
                {step.title}
                {step.isOptional && (
                  <Span color="fg.muted" fontSize="xs">
                    &nbsp;(optional)
                  </Span>
                )}
              </Steps.Title>
            </Steps.Trigger>
            <Steps.Separator />
          </Steps.Item>
        ))}
      </Steps.List>
    </Steps.Root>
  );
}
