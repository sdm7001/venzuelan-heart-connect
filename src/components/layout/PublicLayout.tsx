import { ReactNode } from "react";
import { PublicHeader } from "./PublicHeader";
import { PublicFooter } from "./PublicFooter";

export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicHeader />
      <main id="main-content" tabIndex={-1} className="flex-1 scroll-mt-header focus:outline-none">{children}</main>
      <PublicFooter />
    </div>
  );
}
