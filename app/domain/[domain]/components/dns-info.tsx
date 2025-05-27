"use client";

import Section from "@/components/section";
import { DnsProvider, DnsRecord } from "@/lib/dns";
import { useEffect, useRef, useState } from "react";
import Loading from "@/components/loading";
import Button from "@/components/button";

export default function DnsInfo({ initialRecords, updateRecordsAction }: { initialRecords: Record<string, DnsRecord[]>, updateRecordsAction: (deep: boolean, provider: DnsProvider) => Promise<Record<string, DnsRecord[]>> }) {
  const sectionRef = useRef(null);
  const [deep, setDeep] = useState(false);
  const [provider, setProvider] = useState<DnsProvider>("authoritative");
  const [dnsRecords, setRecords] = useState(initialRecords);
  const [loading, setLoading] = useState(false);
  
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
        <p className="px-2 font-bold">Deep/Shallow</p>
        <Button active={deep} onclick={() => {
          setDeep(true);
        }}>All DNS Servers</Button>
        <Button active={!deep} onclick={() => {
          setDeep(false);
        }}>Random DNS Server</Button>
      </div>
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
      
      {loading && <Loading />}
      {Object.keys(dnsRecords).map(source => {
        const sourceRecords = dnsRecords[source];
        const hasMultipleSources = Object.keys(dnsRecords).length > 1;
        return (<div key={source}>
          {hasMultipleSources && <h3 className="text-lg font-bold">{source}</h3>}
          
          {sourceRecords?.length && (<div className={hasMultipleSources ? "ms-8" : ""}>
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