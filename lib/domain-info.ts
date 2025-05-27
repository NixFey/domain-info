export type DomainInfoResponse = {
  source: string
  statuses: string[],
  createDate: Date,
  updateDate: Date,
  registryExpirationDate: Date,
  registrar: string,
  registrantName: string | null,
  nameservers: string[],
  dnssec: boolean
};