"use client";

import AppProvider from "@/modules/tenant/AppProvider";
import { useCogniInstance } from "@/modules/tenant/TenantProvider";
import { Loader } from "@mantine/core";

function AppLayoutContent({ children }: { children: React.ReactNode }) {
  const { isInitializing } = useCogniInstance();

  return (
    <div className="h-screen w-screen bg-[#0B0F19] text-gray-200 overflow-hidden">
      {isInitializing ? (
        <div className="h-full w-full flex flex-col items-center justify-center bg-[#0B0F19] gap-3">
          <Loader color="amber" size="md" />
          <span className="font-serif italic text-amber-500 text-sm tracking-wider">Connecting to town...</span>
        </div>
      ) : children}
    </div>
  );
}

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AppProvider>
      <AppLayoutContent>{children}</AppLayoutContent>
    </AppProvider>
  );
}
