import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <p className="text-6xl font-bold text-primary">404</p>
      <h1 className="mt-4 text-2xl font-bold">Page not found</h1>
      <p className="mt-2 text-muted-foreground">The page you&apos;re looking for doesn&apos;t exist.</p>
      <Button className="mt-6" asChild>
        <Link href="/">Go home</Link>
      </Button>
    </div>
  );
}
