import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Favorites",
  description: "Review and manage your saved BookWise books in one place.",
  openGraph: {
    title: "My Favorites | BookWise",
    description: "Review and manage your saved BookWise books in one place.",
  },
};

export default function FavoritesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
