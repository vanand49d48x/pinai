"use client";

import dynamic from "next/dynamic";

const AppNavClient = dynamic(
  () => import("./app-nav-client").then((m) => m.AppNavClient),
  {
    ssr: false,
    loading: () => <div className="h-16 border-b" />,
  }
);

export function AppNav() {
  return <AppNavClient />;
}
