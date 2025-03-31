import React from 'react';

interface VisibilityProps {
  isVisible: boolean;
  children: React.ReactNode;
}

export default function Visibility({ isVisible, children }: VisibilityProps) {
  return isVisible ? React.Children.only(children) : null;
}
