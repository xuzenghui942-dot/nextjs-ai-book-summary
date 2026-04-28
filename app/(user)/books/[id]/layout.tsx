import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Book Details",
  description:
    "Read a detailed BookWise summary, reviews, audio chapters, and learning notes for this book.",
  openGraph: {
    title: "Book Details | BookWise",
    description:
      "Read a detailed BookWise summary, reviews, audio chapters, and learning notes for this book.",
  },
};

export default function BookDetailLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
