import { DomainInfoResponse } from "@/lib/domain-info";
import { parseISO } from "date-fns";

/* eslint @typescript-eslint/no-explicit-any: "off" */
export async function lookupRdap(domain: string, useRegistrar: boolean = false): Promise<DomainInfoResponse | null> {
  if (useRegistrar) throw new Error("not yet implemented");
  const tld = domain.substring(domain.lastIndexOf(".") + 1);
  const tldRdapResponse = await fetch(`https://rdap.iana.org/domain/${tld}`, {next: {revalidate: 3600}});
  if (!tldRdapResponse.ok) throw new Error("Failed to get TLD RDAP server");
  const tldRdapServer: string | undefined = (await tldRdapResponse.json()).links?.find((l: any) => l.rel === "alternate")?.href;
  if (!tldRdapServer) return null;

  const domainRdapResponse = await fetch(`${tldRdapServer.replace(/\/$/, "")}/domain/${domain}`, {next: {revalidate: 18100}});
  if (!domainRdapResponse.ok) return null;
  const domainRdap = await domainRdapResponse.json();
  
  function getEvent(name: string): Date {
    return parseISO(domainRdap.events?.find((e: any) => e.eventAction === name).eventDate);
  }

  return {
    source: `RDAP (${tldRdapServer})`,
    createDate: getEvent("registration"),
    domainStatuses: domainRdap.status as string[],
    registryExpirationDate: getEvent("expiration"),
    updateDate: getEvent("last changed"),
    dnssec: domainRdap.secureDNS?.delegationSigned && domainRdap.secureDNS?.zoneSigned,
    nameservers: domainRdap.nameservers?.map((n: any) => n.ldhName).filter((n: any) => n),
    registrantName: null,
    registrar: domainRdap.entities?.find((e: any) => e.roles?.includes("registrar"))?.vcardArray[1].find((a: any) => a[0] === "fn")?.at(3)
  };
}