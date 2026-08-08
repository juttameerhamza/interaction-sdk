import { createContext, useContext, type FormEvent, type PropsWithChildren } from "react";
import { useLeadFormController, type UseLeadFormControllerOptions } from "@interaction-sdk/react/lead";
import { Alert, Button, Field, Input } from "@interaction-sdk/design-system-demo";

type Controller = ReturnType<typeof useLeadFormController>;
const LeadFormContext = createContext<Controller | null>(null);

function useController() {
  const controller = useContext(LeadFormContext);
  if (!controller) throw new Error("LeadForm compound components must be inside <LeadFormCompound.Root>.");
  return controller;
}

function Root({ children, ...options }: PropsWithChildren<UseLeadFormControllerOptions>) {
  const controller = useLeadFormController(options);
  const submit = (event: FormEvent) => { event.preventDefault(); void controller.submit(); };
  return <LeadFormContext.Provider value={controller}><form onSubmit={submit}>{children}</form></LeadFormContext.Provider>;
}

function Fields() {
  const controller = useController();
  return <div style={{ display: "grid", gap: 12 }}>
    <Field label="First name"><Input value={controller.values.firstName} onChange={(e) => controller.update("firstName", e.target.value)} /></Field>
    <Field label="Last name"><Input value={controller.values.lastName} onChange={(e) => controller.update("lastName", e.target.value)} /></Field>
    <Field label="Email"><Input type="email" value={controller.values.email} onChange={(e) => controller.update("email", e.target.value)} /></Field>
    <Field label="Phone"><Input value={controller.values.phone} onChange={(e) => controller.update("phone", e.target.value)} /></Field>
  </div>;
}

function Submit({ children = "Create lead" }: PropsWithChildren) {
  const controller = useController();
  return <Button type="submit" disabled={controller.isSubmitting}>{controller.isSubmitting ? "Creating…" : children}</Button>;
}

function ErrorMessage() {
  const { error } = useController();
  return error ? <Alert>{error.message}</Alert> : null;
}

function Success() {
  const { data } = useController();
  return data ? <Alert title="Lead created">Reference: {data.id}</Alert> : null;
}

export const LeadFormCompound = { Root, Fields, Submit, Error: ErrorMessage, Success };
