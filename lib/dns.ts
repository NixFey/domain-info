import { Resolver } from "node:dns/promises";
import * as dns from "node:dns";

export type DnsRecord = {
  type: "A" | "NS" | "CNAME" | "SOA" | "PTR" | "MX" | "TXT" | "SIG" | "KEY" | "AAAA" | "SRV" | "NAPTR" | "DS" | "DNSKEY" | "CAA",
  data: string,
  ttl: number
}

async function dnsQueryWrapper<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch (e: unknown) {
    // @ts-expect-error <-- this is bad, never do this. i don't care
    if ('code' in e && (e.code === dns.NODATA || e.code === dns.NOTFOUND || e.code === dns.BADRESP)) {
      return null;
    }
    
    throw e;
  }
}

export async function getAllDnsRecords(hostname: string, nameservers?: string[], serverIps?: string[]): Promise<DnsRecord[]> {
  const resolver = new Resolver();
  if (nameservers) {
    const nsIps = (await Promise.all(nameservers.map(ns => resolver.resolve(ns)))).reduce((arr, i) => arr.concat(i), []);
    resolver.setServers(nsIps);
  } else if (serverIps) {
    resolver.setServers(serverIps);
  } else {
    throw new Error("No servers provided for DNS lookup");
  }
  
  const [a, aaaa, cname, txt, mx, soa] = await Promise.all([
    dnsQueryWrapper(() => resolver.resolve4(hostname, {ttl: true})),
    dnsQueryWrapper(() => resolver.resolve6(hostname, {ttl: true})),
    dnsQueryWrapper(() => resolver.resolveCname(hostname)),
    dnsQueryWrapper(() => resolver.resolveTxt(hostname)),
    dnsQueryWrapper(() => resolver.resolveMx(hostname)),
    dnsQueryWrapper(() => resolver.resolveSoa(hostname))
  ]);
  
  return [
    ...a?.map(i => ({
      type: "A",
      ttl: i.ttl,
      data: i.address
    })) ?? [],
    ...aaaa?.map(i => ({
      type: "AAAA",
      ttl: i.ttl,
      data: i.address
    })) ?? [],
    ...cname?.map(i => ({
      type: "CNAME",
      data: i
    })) ?? [],
    ...txt?.map(i => ({
      type: "TXT",
      data: i.join(" ")
    })) ?? [],
    ...mx?.sort((a, b) => a.priority - b.priority).map(i => ({
      type: "MX",
      data: `${i.exchange} (priority ${i.priority})`
    })) ?? [],
    ...(soa ? [{
      type: "SOA",
      data: `hostmaster: ${soa.hostmaster},
nsname: ${soa.nsname},
serial: ${soa.serial},
refresh: ${soa.refresh},
retry: ${soa.retry},
expire: ${soa.expire},
ttl: ${soa.minttl}
`
    } as DnsRecord] : [])
  ] as DnsRecord[];
}