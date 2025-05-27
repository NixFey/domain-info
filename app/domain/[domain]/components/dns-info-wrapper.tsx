import { DomainInfoResponse } from "@/lib/domain-info";
import { DnsProvider, DnsRecord, getIpsForProvider } from "@/lib/dns";
import DnsInfo from "./dns-info";

export default async function DnsInfoWrapper({ domainInfo, dnsName }: { domainInfo: DomainInfoResponse, dnsName: string }) {
  let response: Record<string, DnsRecord[]> = await (await fetch(process.env.API_BASE + "/dns/" + dnsName + "?ns=" + domainInfo.nameservers.join(","), {
    next: {
      revalidate: 60
    }
  })).json();
  
  async function updateRecordsAction(deep: boolean, provider: DnsProvider): Promise<Record<string, DnsRecord[]>> {
    "use server";
    const source = provider === "authoritative"
      ? `?ns=${domainInfo.nameservers.join(",")}`
      : `?ip=${getIpsForProvider(provider)}`;
    const url = process.env.API_BASE + "/dns/" + dnsName + source + "&deep=" + (deep ? "t" : "f");
    return await (await fetch(url)).json();
  } 
  
  return (<DnsInfo initialRecords={response} updateRecordsAction={updateRecordsAction} />);
}