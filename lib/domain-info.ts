export type DomainInfoType = "auto" | "rdap" | "whois";
export type DomainInfoSource = "auto" | "registry" | "registrar";

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