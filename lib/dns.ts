import { Resolver } from "node:dns/promises";
import * as dns from "node:dns";

export type DnsRecord = {
  type: "A" | "NS" | "CNAME" | "SOA" | "PTR" | "MX" | "TXT" | "SIG" | "KEY" | "AAAA" | "SRV" | "NAPTR" | "DS" | "DNSKEY" | "CAA",
  data: string,
  ttl: number
}

export type DnsProvider = "authoritative" | "google" | "cloudflare";

export function getIpsForProvider(provider: DnsProvider) {
  // return ["10.0.5.5"];
  if (provider === "cloudflare") return ["1.1.1.1", "1.0.0.1"];
  if (provider === "google") return ["8.8.8.8", "8.8.4.4"];
  return [];
}
