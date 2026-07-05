"use client";

import { useEffect, useState } from "react";
import { Tenant } from "./types";
import { TenantContext, localInstance } from "./TenantContext";
import { tokens } from "@/ui/theme/tokens";

const localApiUrl = process.env.NEXT_PUBLIC_LOCAL_API_URL || "http://localhost:8000";

export function LocalProvider({ children }: { children: React.ReactNode }) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTenant({ tenant_id: "local", tenant_name: "local" });
    setIsInitializing(false);
  }, []);

  if (error && !isInitializing) {
    return (
      <ErrorScreen message={error} />
    );
  }

  return (
    <TenantContext.Provider value={{
      tenant,
      cogniInstance: localInstance,
      localInstance,
      serviceUrl: localApiUrl,
      isInitializing,
      error,
      statusMessage: null,
      availableTenants: [],
      switchTenant: () => {},
      planType: null,
      hasAccess: true,
      requestCreateWorkspace: () => {},
    }}>
      {children}
    </TenantContext.Provider>
  );
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      padding: "2rem",
      textAlign: "center",
      fontFamily: "system-ui, sans-serif",
    }}>
      <div style={{
        backgroundColor: "#ffffff",
        borderRadius: "0.75rem",
        padding: "2.5rem",
        maxWidth: "28rem",
        width: "100%",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
      }}>
        <h2 style={{ margin: "0 0 0.75rem", fontSize: "1.25rem", fontWeight: 600, color: tokens.textDark }}>
          Connection Error
        </h2>
        <p style={{ margin: "0 0 1.5rem", fontSize: "0.875rem", color: tokens.textSecondary, lineHeight: 1.5 }}>
          {message}
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: "0.5rem 1.5rem",
            borderRadius: "0.5rem",
            border: "1px solid #d1d5db",
            backgroundColor: "#ffffff",
            cursor: "pointer",
            fontSize: "0.875rem",
            fontWeight: 500,
          }}
        >
          Try again
        </button>
      </div>
    </div>
  );
}
