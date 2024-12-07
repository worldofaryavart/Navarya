'use client';

import { ToastProvider } from "@/context/ToastContext";
import { TaskProvider } from "@/context/TaskContext";
import Layout from "./Layout";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TaskProvider>
      <ToastProvider>
        <Layout>{children}</Layout>
      </ToastProvider>
    </TaskProvider>
  );
}
