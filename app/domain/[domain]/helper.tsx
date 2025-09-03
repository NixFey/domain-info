"use client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";

export default function DomainResultClientHelper() {
  
  const router = useRouter();
  
  function scrollAndFocusId(id: string) {
    window.history.replaceState(null, "", `#${id}`);
    const el = [...document.querySelectorAll(`#${id}`)].find(e => e.checkVisibility());
    if (el) {
      console.warn(el);
      
      (el as HTMLElement).focus();
      el.scrollIntoView({
        block: "start"
      });
    }
  }

  const handleKeyPress = useCallback((evt: KeyboardEvent) => {
    let stop = false;
    if (evt.key === "/") {
      router.push("/");
      stop = true;
    } else if (evt.key === "n") {
      scrollAndFocusId("nameserver-info");
      stop = true;
    } else if (evt.key === "r") {
      scrollAndFocusId("registration-info");
      stop = true;
    } else if (evt.key === "d") {
      scrollAndFocusId("dns-info");
      stop = true;
    }
    
    if (stop) evt.stopPropagation();
  }, [router]);

  useEffect(() => {
    document.addEventListener("keypress", handleKeyPress)

    return () => {
      document.removeEventListener("keypress", handleKeyPress)
    }
  }, [handleKeyPress]);
  return (<></>);
}