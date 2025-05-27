"use server";

import { DnsRecord, getAllDnsRecords } from "@/lib/dns";

export default async function getDnsRecords(_: DnsRecord[], { dnsName, nameservers, provider }: { dnsName: string, nameservers: string[], provider: string }) {
  "use server";

  if (provider === "google") {
    return await getAllDnsRecords(dnsName, undefined, ["8.8.8.8", "8.8.4.4"]);
  } else if (provider === "cloudflare") {
    return await getAllDnsRecords(dnsName, undefined, ["1.1.1.1", "1.0.0.1"]);
  }

  return await getAllDnsRecords(dnsName, nameservers);
}