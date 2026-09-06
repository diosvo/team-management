import { Activity, type PropsWithChildren } from 'react';

type VisibilityProps = {
  isVisible: boolean;
};

export default function Visibility({
  isVisible,
  children,
}: PropsWithChildren<VisibilityProps>) {
  return (
    <Activity mode={isVisible ? 'visible' : 'hidden'}>{children}</Activity>
  );
}
