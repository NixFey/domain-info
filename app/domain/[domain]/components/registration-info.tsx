import Section from "@/components/section";
import { DomainInfoResponse } from "@/lib/domain-info";
import Date from "@/components/date";
import { ReactElement } from "react";

export default function RegistrationInfo({ domainInfo }: { domainInfo: DomainInfoResponse }) {
  // eslint react/jsx-key="off"
  const info: {name: string, value: ReactElement}[] = [
    {name: "Created", value: <Date date={domainInfo.createDate} />},
    {name: "Updated", value: <Date date={domainInfo.updateDate} />},
    {name: "Expires (Registry)", value: <Date date={domainInfo.registryExpirationDate} />},
    ...(domainInfo.registrarExpirationDate ? [{
      name: "Expires (Registrar)",
      value: <Date date={domainInfo.registrarExpirationDate} />
    }] : []),
    {name: "Registrar", value: <>{domainInfo.registrar}</>},
    {name: "Statuses", value: <ul className="flex flex-wrap gap-2">{domainInfo.statuses?.map((s, idx) => <li key={idx} className="border-1 border-foreground/[0.5] rounded-sm p-0.5">{s}</li>)}</ul>}
  ];
  return (
    <Section title="Registration Info" id="registration-info" hotkey="r">
      <dl>
        {info.map((item, idx) => <div key={idx}>
          <dt className="inline pe-2 font-bold">{item.name}:</dt>
          <dd className="inline">{item.value}</dd>
        </div>)}
      </dl>
    </Section>
  );
}