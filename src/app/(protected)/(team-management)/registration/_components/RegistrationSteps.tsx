import { Circle, Span, Steps } from '@chakra-ui/react';
import { Check } from 'lucide-react';

export interface StepDef {
  title: string;
  done: boolean;
  isOptional?: boolean;
}

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
              <Circle
                size="6"
                fontSize="xs"
                borderWidth={1}
                color={step.done ? 'white' : 'fg.muted'}
                borderColor={step.done ? 'green.solid' : 'border'}
                backgroundColor={step.done ? 'green.solid' : 'transparent'}
              >
                {step.done ? <Check size={14} /> : index + 1}
              </Circle>
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
