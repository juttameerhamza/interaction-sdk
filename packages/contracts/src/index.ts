export interface Mapper<TTransport, TDomain> {
  toDomain(value: TTransport): TDomain;
  toTransport?(value: TDomain): TTransport;
}

export function defineMapper<TTransport, TDomain>(
  mapper: Mapper<TTransport, TDomain>,
): Mapper<TTransport, TDomain> {
  return mapper;
}

export interface TransportContract<TDto> {
  readonly id: string;
  readonly version: string;
  parse(input: unknown): TDto;
}

export function defineTransportContract<TDto>(
  contract: TransportContract<TDto>,
): TransportContract<TDto> {
  return contract;
}
