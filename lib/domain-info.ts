import { lookupRdap } from "@/lib/rdap";
import whoiser, { WhoisSearchResult } from "whoiser";
import { parseISO } from "date-fns";

export type DomainInfoResponse = {
  source: string
  domainStatuses: string[],
  createDate: Date,
  updateDate: Date,
  registryExpirationDate: Date,
  registrar: string,
  registrantName: string | null,
  nameservers: string[],
  dnssec: boolean
};

export default async function domainInfo(domain: string, fromRegistrar: boolean = false): Promise<DomainInfoResponse | null> {
  const rdapResult = await lookupRdap(domain, fromRegistrar);
  
  if (rdapResult) {
    return rdapResult;
  }
  
  const whoisResult = await whoiser(domain);
  console.log(whoisResult);
  const whoisServer = Object.keys(whoisResult)[0];
  const registryWhois = whoisResult[whoisServer] as WhoisSearchResult;
  if (registryWhois["Domain Status"].length === 0) return null;
  return {
    source: `WHOIS (${whoisServer})`,
    domainStatuses: registryWhois["Domain Status"] as string[],
    createDate: parseISO(registryWhois["Created Date"] as string),
    updateDate: parseISO(registryWhois["Updated Date"] as string),
    registryExpirationDate: parseISO(registryWhois["Expiry Date"] as string),
    dnssec: registryWhois["DNSSEC"] === "signedDelegation",
    nameservers: registryWhois["Name Server"] as string[],
    registrantName: null,
    registrar: registryWhois["Registrar"] as string
  };
}