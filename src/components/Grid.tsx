import type { PropsWithChildren } from "react";

export default function Grid({ children }: PropsWithChildren) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {children}
    </div>
  );
}
