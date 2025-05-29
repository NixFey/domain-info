import RegistrationInfo from "./components/registration-info";
import NameserverInfo from "./components/nameserver-info";
import DomainResultClientHelper from "./helper";
import Link from "next/link";
import { Metadata } from "next";
import { DomainInfoResponse } from "@/lib/domain-info";
import Section from "@/components/section";
import { Suspense } from "react";
import Loading from "@/components/loading";
import DnsInfoWrapper from "@/app/domain/[domain]/components/dns-info-wrapper";

type DomainResultProps = { params: Promise<{ domain: string }> };

export async function generateMetadata({ params }: DomainResultProps): Promise<Metadata> {
  return {
    title: (await params).domain
  }
}

export default async function DomainResult({ params }: DomainResultProps) {
  const { domain } = await params;

  const resp = await fetch(process.env.API_BASE + "/info/" + domain);
  if (!resp.ok) {
    try {
      const json = await resp.json();
      if ("errors" in json && Array.isArray(json.errors)) {
        return (
          <article className="my-4 mb-200 max-w-7xl mx-auto border-2 border-red-500/[0.5] rounded-lg p-4">
            <h1 className="text-4xl text-center"><span className="font-mono">{domain}</span> <Link href="/" className="text-base"><span className="underline">New Search</span> <span className="text-mono bg-foreground/[0.1] border-1 border-foreground/[0.3] rounded-sm py-0.5 px-1">/</span></Link></h1>
            
            <p>An error occurred looking up that domain name:</p>
            {json.errors.length > 0 && (<ul>
              {json.errors.map((e: string, idx: number) => (<li key={idx}>{e}</li>))}
            </ul>)}
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
      <h1 className="text-4xl text-center"><span className="font-mono">{domain}</span> <Link href="/" className="text-base"><span className="underline">New Search</span> <span className="text-mono bg-foreground/[0.1] border-1 border-foreground/[0.3] rounded-sm py-0.5 px-1">/</span></Link></h1>
      {info
        ? <>
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