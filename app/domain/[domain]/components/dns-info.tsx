"use client";

import Section from "@/components/section";
import { DnsProvider, DnsRecord } from "@/lib/dns";
import { useEffect, useRef, useState } from "react";
import Loading from "@/components/loading";
import Button from "@/components/button";

export default function DnsInfo({ initialRecords, updateRecordsAction }: { initialRecords: {type: "error", errors: string[]} | Record<string, DnsRecord[]>, updateRecordsAction: (deep: boolean, provider: DnsProvider) => Promise<{type: "error", errors: string[]} | Record<string, DnsRecord[]>> }) {
  const sectionRef = useRef(null);
  const [deep, setDeep] = useState(false);
  const [provider, setProvider] = useState<DnsProvider>("authoritative");
  const [dnsRecords, setRecords] = useState(initialRecords);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!updateRecordsAction) return;
    (async () => {
      setLoading(true);
      try {
        setRecords(await updateRecordsAction(deep, provider))
      } finally {
        setLoading(false);
      }
    })();
  }, [deep, provider, updateRecordsAction]);
  
  if (!dnsRecords) return;
  
  return (
    <Section title="DNS Records" id="dns-info" hotkey="d" ref={sectionRef}>
      <div className="mb-2 mx-[-4]">
        <p className="px-2 font-bold">Provider</p>
        <Button active={provider === "authoritative"} onclick={() => {
          setProvider("authoritative");
        }}>Authoritative</Button>
        <Button active={provider === "google"} onclick={() => {
          setProvider("google");
        }}>Google</Button>
        <Button active={provider === "cloudflare"} onclick={() => {
          setProvider("cloudflare");
        }}>Cloudflare</Button>
      </div>
      <div className="mb-2 mx-[-4]">
        <p className="px-2 font-bold">Deep/Shallow</p>
        <Button active={deep} onclick={() => {
          setDeep(true);
        }}>All DNS Servers</Button>
        <Button active={!deep} onclick={() => {
          setDeep(false);
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