export const metadata = {
  title: 'Learning Next.js',
  description: 'Next.js foundations',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
