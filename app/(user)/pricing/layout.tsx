import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Compare BookWise plans and unlock unlimited book summaries, full audio access, and PDF downloads.",
  openGraph: {
    title: "Pricing | BookWise",
    description:
      "Compare BookWise plans and unlock unlimited book summaries, full audio access, and PDF downloads.",
  },
};

export default function PricingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
