'use client';

import React from 'react';
import Layout from "./Layout";
import ToastManager from './ToastManager';
import { ToastProvider } from '@/context/ToastContext';

const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
    {/* // <ToastProvider> */}
        <Layout>
          {children}
        </Layout>
      // <ToastManager />
    {/* // </ToastProvider> */}
    </>
  );
};

export default Providers;
