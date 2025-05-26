"use client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";

export default function DomainResultClientHelper() {
  
  const router = useRouter();

  const handleKeyPress = useCallback((evt: KeyboardEvent) => {
    let stop = false;
    if (evt.key === "/") {
      router.push("/");
      stop = true;
    } else if (evt.key === "n") {
      router.replace("#nameserver-info");
      stop = true;
    } else if (evt.key === "r") {
      router.replace("#registration-info");
      stop = true;
    }
    
    if (stop) evt.stopPropagation();
  }, []);

  useEffect(() => {
    document.addEventListener("keypress", handleKeyPress)

    return () => {
      document.removeEventListener("keypress", handleKeyPress)
    }
  }, []);
  return (<></>);
}