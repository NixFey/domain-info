import Section from "@/components/section";
import { DomainInfoResponse } from "@/lib/domain-info";

export default function RegistrationInfo({ domainInfo }: { domainInfo: DomainInfoResponse | null }) {
  return (
    <Section title="Registration Info" id="registration-info" hotkey="r">
      {domainInfo ? JSON.stringify(domainInfo) : "Failed to get domain info"}
    </Section>
  );
}