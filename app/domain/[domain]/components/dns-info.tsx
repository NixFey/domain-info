"use client";

import Section from "@/components/section";
import { DnsProvider, DnsRecord } from "@/lib/dns";
import { useCallback, useEffect, useState } from "react";
import Loading from "@/components/loading";
import Button from "@/components/button";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function DnsInfo({ initialRecords, updateRecordsAction }: { initialRecords: {type: "error", errors: string[]} | Record<string, DnsRecord[]>, updateRecordsAction: (deep: boolean, provider: DnsProvider) => Promise<{type: "error", errors: string[]} | Record<string, DnsRecord[]>> }) {
  // const sectionRef = useRef(null);
  const [dnsRecords, setRecords] = useState(initialRecords);
  const [loading, setLoading] = useState(true);

  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Get a new searchParams string by merging the current
  // searchParams with a provided key/value pair
  const updateQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set(name, value)

      window.history.replaceState(null, "", pathname + "?" + params.toString());
    },
    [pathname, searchParams]
  )
  
  useEffect(() => {
    const provider = (searchParams.get("dnsprovider") as DnsProvider | null) ?? "authoritative";
    const deep = searchParams.get("dnsdeep") === "true";
    if (!updateRecordsAction || !provider) return;
    (async () => {
      setLoading(true);
      try {
        setRecords(await updateRecordsAction(deep, provider));
      } finally {
        setLoading(false);
      }
    })();
  }, [searchParams.get("dnsprovider"), searchParams.get("dnsdeep"), updateRecordsAction]);
  
  if (!dnsRecords) return;
  
  return (
    <Section title="DNS Records" id="dns-info" hotkey="d"> {/*ref={sectionRef}>*/}
      <div className="mb-2 mx-[-4]">
        <p className="px-2 font-bold">Provider</p>
        <Button active={searchParams.get("dnsprovider") === "authoritative"} onclick={() => {
          updateQueryString("dnsprovider", "authoritative");
        }}>Authoritative</Button>
        <Button active={searchParams.get("dnsprovider") === "google"} onclick={() => {
          updateQueryString("dnsprovider", "google");
        }}>Google</Button>
        <Button active={searchParams.get("dnsprovider") === "cloudflare"} onclick={() => {
          updateQueryString("dnsprovider", "cloudflare");
        }}>Cloudflare</Button>
      </div>
      <div className="mb-2 mx-[-4]">
        <p className="px-2 font-bold">Deep/Shallow</p>
        <Button active={searchParams.get("dnsdeep") === "true"} onclick={() => {
          updateQueryString("dnsdeep", "true");
        }}>All DNS Servers</Button>
        <Button active={searchParams.get("dnsdeep") !== "true"} onclick={() => {
          updateQueryString("dnsdeep", "false");
        }}>Random DNS Server</Button>
      </div>
      
      {loading && <Loading />}
      {"errors" in dnsRecords && Array.isArray(dnsRecords.errors) && <div className="my-4 mb-200 max-w-7xl mx-auto border-2 border-red-500/[0.5] rounded-lg p-4">
        <p>An error occurred getting DNS:</p>
          {dnsRecords.errors.length > 0 && (<ul className="my-4">
            {(dnsRecords.errors as string[]).map((e: string, idx: number) => (<li key={idx}>{e}</li>))}
          </ul>)}
      </div>}
      {dnsRecords.type !== "error" && Object.keys(dnsRecords).map(source => {
        const sourceRecords = (dnsRecords as Record<string, DnsRecord[]>)[source];
        const hasMultipleSources = Object.keys(dnsRecords).length > 1;
        return (<div key={source}>
          {hasMultipleSources && <h3 className="text-lg font-bold">{source}</h3>}
          
          {sourceRecords?.length && (<div className={hasMultipleSources ? "ms-8" : ""}>
            <ul>
              {sourceRecords?.map((r, idx) => <li key={idx}>
                <strong>{r.type}:</strong> {r.data} {r.ttl ? `(ttl ${r.ttl})` : ""}</li>)}
            </ul>
          </div>)}
          {!sourceRecords?.length && <>
              No DNS records found
          </>}
        </div>)
      })}
    </Section>
  )
}