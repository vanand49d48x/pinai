import { Suspense } from "react";
import SettingsContent from "./settings-content";

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <SettingsContent />
    </Suspense>
  );
}
