import { SdkError } from "./errors.js";

const tokenType = Symbol("interaction-sdk.token-type");

export interface Token<T> {
  readonly id: symbol;
  readonly name: string;
  readonly [tokenType]?: T;
}

export function createToken<T>(name: string): Token<T> {
  return Object.freeze({ id: Symbol(name), name });
}

export interface Container {
  provide<T>(token: Token<T>, value: T): void;
  get<T>(token: Token<T>): T;
  has<T>(token: Token<T>): boolean;
}

export function createContainer(): Container {
  const values = new Map<symbol, unknown>();

  return {
    provide<T>(token: Token<T>, value: T): void {
      if (values.has(token.id)) {
        throw new SdkError(`Dependency '${token.name}' is already provided`, "DEPENDENCY_ALREADY_PROVIDED", "unexpected");
      }
      values.set(token.id, value);
    },
    get<T>(token: Token<T>): T {
      if (!values.has(token.id)) {
        throw new SdkError(`Dependency '${token.name}' is not provided`, "DEPENDENCY_NOT_FOUND", "unexpected");
      }
      return values.get(token.id) as T;
    },
    has<T>(token: Token<T>): boolean {
      return values.has(token.id);
    },
  };
}
