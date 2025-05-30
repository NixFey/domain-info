"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Button from "@/components/button";
import { useCallback } from "react";
import { DomainInfoDepth, DomainInfoSource } from "@/lib/domain-info";

export default function SearchParams({ initialSource, initialDepth }: { initialSource: DomainInfoSource, initialDepth: DomainInfoDepth }) {
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
  
  const source = (searchParams.get("source") as DomainInfoSource) ?? initialSource;
  const depth = (searchParams.get("depth") as DomainInfoDepth) ?? initialDepth;
  
  return (
    <div className="m-4 flex gap-2 flex-wrap">
      <span>
        Source:
        <Button active={source === "auto"} onclick={() => {
          updateQueryString("source", "auto");
        }}>Auto</Button>
        <Button active={source === "rdap"} onclick={() => {
          updateQueryString("source", "rdap");
        }}>RDAP</Button>
        <Button active={source === "whois"} onclick={() => {
          updateQueryString("source", "whois");
        }}>WHOIS</Button>
      </span>
      <span>
        Depth:
        <Button active={depth === "registry"} onclick={() => {
          updateQueryString("depth", "registry");
        }}>Registry</Button>
        <Button active={depth === "registrar"} onclick={() => {
          updateQueryString("depth", "registrar");
        }}>Registrar</Button>
      </span>
    </div>
  );
}