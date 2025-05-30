import RegistrationInfo from "./components/registration-info";
import NameserverInfo from "./components/nameserver-info";
import DomainResultClientHelper from "./helper";
import Link from "next/link";
import { Metadata } from "next";
import { DomainInfoDepth, DomainInfoResponse, DomainInfoSource } from "@/lib/domain-info";
import Section from "@/components/section";
import { Suspense } from "react";
import Loading from "@/components/loading";
import DnsInfoWrapper from "@/app/domain/[domain]/components/dns-info-wrapper";
import SearchParams from "@/app/domain/[domain]/components/search-params";

type DomainResultProps = { params: Promise<{ domain: string }>, searchParams: Promise<{ source: DomainInfoSource, depth: DomainInfoDepth }> };

export async function generateMetadata({ params }: DomainResultProps): Promise<Metadata> {
  return {
    title: (await params).domain
  }
}

export default async function DomainResult({ params, searchParams }: DomainResultProps) {
  const { domain } = await params;
  const { source, depth } = await searchParams;

  const queryParams = new URLSearchParams({
    t: source ?? "auto",
    f: depth === "registry" ? "f" : "t"
  });
  const resp = await fetch(`${process.env.API_BASE}/info/${domain}?${queryParams}`);
  if (!resp.ok) {
    try {
      const json = await resp.json();
      if ("errors" in json && Array.isArray(json.errors)) {
        return (
          <article className="my-4 mb-200 max-w-7xl mx-auto border-2 border-red-500/[0.5] rounded-lg p-4">
            <h1 className="text-4xl text-center sticky top-0"><span className="font-mono">{domain}</span> <Link href="/" className="text-base"><span className="underline">New Search</span> <span className="text-mono bg-foreground/[0.1] border-1 border-foreground/[0.3] rounded-sm py-0.5 px-1">/</span></Link></h1>
            <div className="mx-[-1rem]">
              <SearchParams initialSource="auto" initialDepth="registrar" />
            </div>
            <p>An error occurred looking up that domain name:</p>
            {json.errors.length > 0 && (<ul className="my-4">
              {json.errors.map((e: string, idx: number) => (<li key={idx}>{e}</li>))}
            </ul>)}
            <p>Try changing your search settings...</p>
            <DomainResultClientHelper />
          </article>
        );
      }
    } catch (err: unknown) {
      throw new Error(await resp.text())
    }
  }
  
  const info = await resp.json() as DomainInfoResponse;
  
  return (
    <article className="my-4 mb-200 max-w-7xl mx-auto">
      <h1 className="text-4xl text-center sticky top-0 bg-background"><span className="font-mono">{domain}</span> <Link href="/" className="text-base"><span className="underline">New Search</span> <span className="text-mono bg-foreground/[0.1] border-1 border-foreground/[0.3] rounded-sm py-0.5 px-1">/</span></Link></h1>
      {info
        ? <>
          <SearchParams initialSource="auto" initialDepth="registrar" />
          <RegistrationInfo domainInfo={info} />
          <NameserverInfo domainInfo={info} />
          <Suspense fallback={<Loading message={"Loading DNS info..."} />}>
            <DnsInfoWrapper domainInfo={info} dnsName={domain} />
          </Suspense>
          <p className="p-2">Source: {info.source}</p>
        </>
        : <Section title="404" id="domain-not-found">Domain not found... :(</Section>
      }
      <DomainResultClientHelper />
    </article>
  );
}