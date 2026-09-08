import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "IT HelpDesk",
  description: "Internal IT Helpdesk Application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
