import Section from "@/components/section";
import { DomainInfoResponse } from "@/lib/domain-info";

export default function NameserverInfo({ domainInfo }: { domainInfo: DomainInfoResponse }) {
  return (
    <Section title="Nameserver Info" id="nameserver-info" hotkey="n">
      {!domainInfo.nameservers || domainInfo.nameservers.length === 0 ? (
        <p>This domain has no nameservers set.</p>
      ) : (
        <ul className="list-disc ps-4">
          {domainInfo.nameservers.map(n => (<li key={n}>{n}</li>))}
        </ul>
      )}
    </Section>
  );
}