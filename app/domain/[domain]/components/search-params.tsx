"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Button from "@/components/button";
import { useCallback } from "react";
import { DomainInfoSource, DomainInfoType } from "@/lib/domain-info";

export default function SearchParams({ initialType, initialSource }: { initialType: DomainInfoType, initialSource: DomainInfoSource }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  // Get a new searchParams string by merging the current
  // searchParams with a provided key/value pair
  const updateQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set(name, value)

      router.replace(pathname + "?" + params.toString());
    },
    [pathname, searchParams]
  )
  
  const type = (searchParams.get("type") as DomainInfoType) ?? initialType;
  const source = (searchParams.get("source") as DomainInfoSource) ?? initialSource;
  
  return (
    <div className="m-4 flex gap-2 flex-wrap">
      <span>
        Source:
        <Button active={type === "auto"} onclick={() => {
          updateQueryString("type", "auto");
        }}>Auto</Button>
        <Button active={type === "rdap"} onclick={() => {
          updateQueryString("type", "rdap");
        }}>RDAP</Button>
        <Button active={type === "whois"} onclick={() => {
          updateQueryString("type", "whois");
        }}>WHOIS</Button>
      </span>
      <span>
        Depth:
        <Button active={source === "auto"} onclick={() => {
          updateQueryString("source", "auto");
        }}>Auto</Button>
        <Button active={source === "registry"} onclick={() => {
          updateQueryString("source", "registry");
        }}>Registry</Button>
        <Button active={source === "registrar"} onclick={() => {
          updateQueryString("source", "registrar");
        }}>Registrar</Button>
      </span>
    </div>
  );
}