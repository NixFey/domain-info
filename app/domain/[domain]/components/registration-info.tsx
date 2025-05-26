import Section from "@/components/section";
import { DomainInfoResponse } from "@/lib/domain-info";
import Date from "@/components/date";
import { ReactElement } from "react";

export default function RegistrationInfo({ domainInfo }: { domainInfo: DomainInfoResponse }) {
  const info: [string, ReactElement][] = [
    ["Created", <Date date={domainInfo.createDate} />],
    ["Updated", <Date date={domainInfo.updateDate} />],
    ["Expires (Registry)", <Date date={domainInfo.registryExpirationDate} />],
    ["Registrar", <>{domainInfo.registrar}</>],
  ];
  return (
    <Section title="Registration Info" id="registration-info" hotkey="r">
      <dl>
        {info.map((item, idx) => <div key={idx}>
          <dt className="inline pe-2 font-bold">{item[0]}:</dt>
          <dd className="inline">{item[1]}</dd>
        </div>)}
      </dl>
    </Section>
  );
}