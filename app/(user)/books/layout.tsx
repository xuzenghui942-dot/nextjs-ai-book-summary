import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browse Books",
  description:
    "Browse BookWise's catalog of professional book summaries, audio insights, and practical reading tools.",
  openGraph: {
    title: "Browse Books | BookWise",
    description:
      "Browse BookWise's catalog of professional book summaries, audio insights, and practical reading tools.",
  },
};

export default function BooksLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
