import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Track your BookWise subscription, listening progress, and learning activity.",
  openGraph: {
    title: "Dashboard | BookWise",
    description: "Track your BookWise subscription, listening progress, and learning activity.",
  },
};

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
