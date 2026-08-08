import type { ReactNode } from "react";
export default function RootLayout({ children }: { children: ReactNode }) { return <html lang="en"><body style={{ fontFamily: "system-ui", background: "#f5f5f5", padding: 32 }}>{children}</body></html>; }
