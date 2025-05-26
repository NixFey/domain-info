import { lookupRdap } from "@/lib/rdap";
import whoiser, { WhoisSearchResult } from "whoiser";

export type DomainInfoResponse = {
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
  const registryWhois = whoisResult[Object.keys(whoisResult)[0]] as WhoisSearchResult;
  return {
    dnssec: registryWhois["DNSSEC"] === "signedDelegation",
    nameservers: registryWhois["Name Server"] as string[],
    registrantName: null,
    registrar: registryWhois["Registrar"] as string
  };
}