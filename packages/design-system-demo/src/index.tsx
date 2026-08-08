import type { ButtonHTMLAttributes, InputHTMLAttributes, PropsWithChildren, ReactNode } from "react";

const stack = { display: "grid", gap: 6 } as const;

export function Card({ children }: PropsWithChildren) {
  return <section style={{ maxWidth: 560, padding: 24, border: "1px solid #ddd", borderRadius: 14, background: "white", boxShadow: "0 8px 30px rgba(0,0,0,.06)" }}>{children}</section>;
}

export function Field({ label, error, children }: PropsWithChildren<{ label: string; error?: string }>) {
  return <label style={stack}><span style={{ fontWeight: 650 }}>{label}</span>{children}{error ? <small role="alert">{error}</small> : null}</label>;
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} style={{ padding: "11px 12px", border: "1px solid #bbb", borderRadius: 8, font: "inherit", ...props.style }} />;
}

export function Button(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} style={{ padding: "11px 16px", border: 0, borderRadius: 8, cursor: props.disabled ? "not-allowed" : "pointer", font: "inherit", fontWeight: 700, ...props.style }} />;
}

export function Alert({ children, title = "Something went wrong" }: { children?: ReactNode; title?: string }) {
  return <div role="alert" style={{ padding: 12, border: "1px solid currentColor", borderRadius: 8 }}><strong>{title}</strong>{children ? <div>{children}</div> : null}</div>;
}
