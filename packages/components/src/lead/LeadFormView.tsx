import type { ComponentType, FormEvent } from "react";
import type { Lead, LeadDraft } from "@interaction-sdk/feature-lead";
import type { SdkError } from "@interaction-sdk/core";
import { useUi } from "@interaction-sdk/ui";

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
  onSubmit(): void | Promise<unknown>;
}

function DefaultHeader({ title }: { title: string }) {
  return <h2>{title}</h2>;
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
  const { Card, Field, Input, Button, Alert } = useUi();
  const Header = slots?.Header ?? DefaultHeader;
  const SubmitButton = slots?.SubmitButton;
  const ErrorView = slots?.Error;
  const SuccessView = slots?.Success;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    void onSubmit();
  };

  return (
    <Card>
      <Header title={title} />
      {!hydrated ? <p>Restoring draft…</p> : null}
      {lead ? (
        SuccessView ? <SuccessView lead={lead} /> : <Alert title="Lead created">Reference: {lead.id}</Alert>
      ) : null}
      {error ? (
        ErrorView ? <ErrorView error={error} /> : <Alert>{error.message} <code>{error.code}</code></Alert>
      ) : null}
      <form onSubmit={handleSubmit}>
        <Field label="First name"><Input required value={values.firstName} onChange={(event) => onChange("firstName", event.target.value)} /></Field>
        <Field label="Last name"><Input required value={values.lastName} onChange={(event) => onChange("lastName", event.target.value)} /></Field>
        <Field label="Email"><Input required type="email" value={values.email} onChange={(event) => onChange("email", event.target.value)} /></Field>
        <Field label="Phone"><Input value={values.phone} onChange={(event) => onChange("phone", event.target.value)} /></Field>
        {SubmitButton ? (
          <SubmitButton disabled={isSubmitting}>{isSubmitting ? "Creating…" : "Create lead"}</SubmitButton>
        ) : (
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Creating…" : "Create lead"}</Button>
        )}
      </form>
    </Card>
  );
}
