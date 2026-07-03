"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const LoginForm = dynamic(() => import("./login-form"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center">
      <Skeleton className="h-96 w-full max-w-md" />
    </div>
  ),
});

export default function LoginPage() {
  return <LoginForm />;
}
