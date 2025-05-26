import RegistrationInfo from "./components/registration-info";
import NameserverInfo from "./components/nameserver-info";
import DomainResultClientHelper from "./helper";
import Link from "next/link";
import { Metadata } from "next";
import domainInfo from "@/lib/domain-info";
import Section from "@/components/section";

type DomainResultProps = { params: Promise<{ domain: string }> };

export async function generateMetadata({ params }: DomainResultProps): Promise<Metadata> {
  return {
    title: (await params).domain
  }
}

export default async function DomainResult({ params }: DomainResultProps) {
  const { domain } = await params;
  const info = await domainInfo(domain);
  
  return (
    <article className="my-4 mb-200">
      <h1 className="text-4xl text-center">{domain} <Link href="/" className="text-base"><span className="underline">New Search</span> <span className="text-mono bg-foreground/[0.1] border-1 border-foreground/[0.3] rounded-sm py-0.5 px-1">/</span></Link></h1>
      {info
        ? <>
          <RegistrationInfo domainInfo={info} />
          <NameserverInfo domainInfo={info} />
          <p className="p-2">Source: {info.source}</p>
        </>
        : <Section title="404" id="domain-not-found">Domain not found... :(</Section>
      }
      <DomainResultClientHelper />
    </article>
  );
}