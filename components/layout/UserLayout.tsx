import type { ReactNode } from "react";
import { Navbar } from "./Navbar";
import type { UserProfile } from "@/types/api";

type UserLayoutProps = {
  children: ReactNode;
  user?: UserProfile | null;
  activePath?: string;
  onSignOut?: () => void;
  contentClassName?: string;
};

export function UserLayout({
  children,
  user,
  activePath,
  onSignOut,
  contentClassName,
}: UserLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar user={user} activePath={activePath} onSignOut={onSignOut} />
      <main className={contentClassName}>{children}</main>
    </div>
  );
}
