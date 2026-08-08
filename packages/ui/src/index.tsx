import {
  createContext,
  useContext,
  type ButtonHTMLAttributes,
  type ComponentType,
  type InputHTMLAttributes,
  type PropsWithChildren,
  type ReactNode,
} from "react";

export interface UiBindings {
  readonly Card: ComponentType<PropsWithChildren>;
  readonly Field: ComponentType<PropsWithChildren<{ label: string; error?: string }>>;
  readonly Input: ComponentType<InputHTMLAttributes<HTMLInputElement>>;
  readonly Button: ComponentType<ButtonHTMLAttributes<HTMLButtonElement>>;
  readonly Alert: ComponentType<{ children?: ReactNode; title?: string }>;
}

export function defineUiBindings(bindings: UiBindings): UiBindings {
  return bindings;
}

const semanticBindings: UiBindings = {
  Card: ({ children }) => <section>{children}</section>,
  Field: ({ label, error, children }) => (
    <label>
      <span>{label}</span>
      {children}
      {error ? <small role="alert">{error}</small> : null}
    </label>
  ),
  Input: (props) => <input {...props} />,
  Button: (props) => <button {...props} />,
  Alert: ({ children, title = "Something went wrong" }) => (
    <div role="alert">
      <strong>{title}</strong>
      {children ? <div>{children}</div> : null}
    </div>
  ),
};

const UiContext = createContext<UiBindings>(semanticBindings);

export function UiProvider({ bindings, children }: PropsWithChildren<{ bindings: UiBindings }>) {
  return <UiContext.Provider value={bindings}>{children}</UiContext.Provider>;
}

export function useUi(): UiBindings {
  return useContext(UiContext);
}

export { semanticBindings };
