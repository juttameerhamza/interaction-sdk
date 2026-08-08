import { useLeadFormController } from "@interaction-sdk/react/lead";
import { LeadFormView, type LeadFormSlots } from "./LeadFormView.js";

export interface LeadFormProps {
  campaignId: string;
  title?: string;
  slots?: LeadFormSlots;
}

export function LeadForm({ campaignId, title, slots }: LeadFormProps) {
  const controller = useLeadFormController({ campaignId });
  return <LeadFormView
    {...(title ? { title } : {})}
    values={controller.values}
    hydrated={controller.hydrated}
    isSubmitting={controller.isSubmitting}
    error={controller.error}
    lead={controller.data}
    slots={slots}
    onChange={controller.update}
    onSubmit={controller.submit}
  />;
}
