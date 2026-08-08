import type { ComponentType, FormEvent } from "react";
import type { Lead, LeadDraft } from "@interaction-sdk/feature-lead";
import type { SdkError } from "@interaction-sdk/core";
import { Alert, Button, Card, Field, Input } from "@interaction-sdk/design-system-demo";

export interface LeadFormSlots {
  Header?: ComponentType<{ title: string }>;
  SubmitButton?: ComponentType<{ disabled: boolean; children: string }>;
  Error?: ComponentType<{ error: SdkError }>;
  Success?: ComponentType<{ lead: Lead }>;
}

export interface LeadFormViewProps {
  title?: string;
  values: LeadDraft;
  hydrated?: boolean;
  isSubmitting?: boolean;
  error?: SdkError | null;
  lead?: Lead | null;
  slots?: LeadFormSlots;
  onChange(field: keyof LeadDraft, value: string): void;
  onSubmit(): void | Promise<void>;
}

export function LeadFormView({
  title = "Tell us about yourself",
  values,
  hydrated = true,
  isSubmitting = false,
  error,
  lead,
  slots,
  onChange,
  onSubmit,
}: LeadFormViewProps) {
  const Header = slots?.Header ?? (({ title: text }) => <h2>{text}</h2>);
  const SubmitButton = slots?.SubmitButton ?? ((props) => <Button type="submit" disabled={props.disabled}>{props.children}</Button>);
  const ErrorView = slots?.Error ?? (({ error: sdkError }) => <Alert>{sdkError.message} <code>{sdkError.code}</code></Alert>);
  const Success = slots?.Success ?? (({ lead: created }) => <Alert title="Lead created">Reference: {created.id}</Alert>);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    void onSubmit();
  };

  return (
    <Card>
      <Header title={title} />
      {!hydrated ? <p>Restoring draft…</p> : null}
      {lead ? <Success lead={lead} /> : null}
      {error ? <ErrorView error={error} /> : null}
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }}>
        <Field label="First name"><Input required value={values.firstName} onChange={(e) => onChange("firstName", e.target.value)} /></Field>
        <Field label="Last name"><Input required value={values.lastName} onChange={(e) => onChange("lastName", e.target.value)} /></Field>
        <Field label="Email"><Input required type="email" value={values.email} onChange={(e) => onChange("email", e.target.value)} /></Field>
        <Field label="Phone"><Input value={values.phone} onChange={(e) => onChange("phone", e.target.value)} /></Field>
        <SubmitButton disabled={isSubmitting}>{isSubmitting ? "Creating…" : "Create lead"}</SubmitButton>
      </form>
    </Card>
  );
}
