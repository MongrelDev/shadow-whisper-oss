"use client";

import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";

import { makeQueryClient } from "@/lib/query-client";

export function QueryProvider({
  children,
}: Readonly<{ children: React.ReactNode }>): React.ReactElement {
  const [client] = useState(makeQueryClient);
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
