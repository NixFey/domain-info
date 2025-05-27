"use server";

import { DomainInfoResponse } from "@/lib/domain-info";
import Section from "@/components/section";
import { DnsRecord, getAllDnsRecords } from "@/lib/dns";
//import getDnsRecords from "../actions/get-dns-records";

export default async function DnsInfo({ domainInfo, dnsName }: { domainInfo: DomainInfoResponse, dnsName: string }) {
  //const [state, action, pending] = useActionState<DnsRecord[], { dnsName: string, nameservers: string[], provider: string }>(getDnsRecords, await getAllDnsRecords(dnsName, domainInfo.nameservers));
  let dnsRecords: DnsRecord[] = [];
  let provider = "authoritative";
  
  async function refreshDnsRecords(newProvider: string) {
    "use server";
    if (provider === "google") {
      dnsRecords = await getAllDnsRecords(dnsName, undefined, ["8.8.8.8", "8.8.4.4"]);
    } else if (provider === "cloudflare") {
      dnsRecords = await getAllDnsRecords(dnsName, undefined, ["1.1.1.1", "1.0.0.1"]);
    } else {
      dnsRecords = await getAllDnsRecords(dnsName, domainInfo.nameservers);
    }
    
    provider = newProvider;
  }
  
  await refreshDnsRecords("authoritative");
  
  return (
    <Section title="DNS Records" id="dns-info" hotkey="d">
      {dnsRecords.length && (<>
        {/*<label>*/}
        {/*  <input name="dnsServer" id="dnsServer-authoritative" type="radio" value="authoritative" />*/}
        {/*  Authoritative*/}
        {/*</label>*/}
        {/*<label>*/}
        {/*  <input name="dnsServer" id="dnsServer-google" type="radio" value="google" />*/}
        {/*  Google*/}
        {/*</label>*/}
        {/*<label>*/}
        {/*  <input name="dnsServer" id="dnsServer-cloudflare" type="radio" value="cloudflare" />*/}
        {/*  Cloudflare*/}
        {/*</label>*/}
        <ul>
          {dnsRecords.map((r, idx) => <li key={idx}><strong>{r.type}:</strong> {r.data} {r.ttl ? `(ttl ${r.ttl})` : ""}</li>)}
        </ul>
      </>)}
      {!dnsRecords.length && <>
        No DNS records found
      </>}
    </Section>
  )
}