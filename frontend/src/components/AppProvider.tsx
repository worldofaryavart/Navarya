"use client";

import { ReactNode } from "react";

export const AppProviders: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  return <>{children};</>;
};
