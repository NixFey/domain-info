export type DomainInfoSource = "auto" | "rdap" | "whois";
export type DomainInfoDepth = "registry" | "registrar";

export type DomainInfoResponse = {
  source: string,
  domain: string,
  registrar: string,
  statuses: string[],
  nameservers: string[],
  createDate: Date,
  updateDate: Date,
  registryExpirationDate: Date | null,
  registrarExpirationDate: Date | null,
  registrantName: string | null,
  dnssec: boolean
};