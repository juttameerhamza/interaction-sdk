export interface WorkflowEffect {
  readonly type: string;
  readonly payload?: unknown;
}

export interface WorkflowTransition<TState> {
  readonly state: TState;
  readonly changed: boolean;
  readonly effects?: readonly WorkflowEffect[];
}

export interface WorkflowDefinition<TState, TEvent, TContext = void> {
  readonly id: string;
  readonly version: number;
  readonly initial: TState;
  transition(state: TState, event: TEvent, context: TContext): WorkflowTransition<TState>;
}

export function defineWorkflow<TState, TEvent, TContext = void>(
  definition: WorkflowDefinition<TState, TEvent, TContext>,
): WorkflowDefinition<TState, TEvent, TContext> {
  return definition;
}
