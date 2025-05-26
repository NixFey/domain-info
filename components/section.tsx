import React from "react";

export default function Section(
  { title, id, hotkey, children }: { title: string, id: string, hotkey?: string, children: React.ReactNode }
) {
  return (
    <section id={id} className="m-2 p-4 rounded-lg border-1 border-foreground/[0.5] scroll-mt-2">
      <h2 className="text-2xl my-1 w-full flex">
        {title}
        { hotkey
          ? <span
            className="ml-auto inline-block font-mono bg-foreground/[0.1] border-1 border-foreground/[0.3] rounded-sm py-0.5 px-1">
            {hotkey}
          </span>
          : <></>
        }
      </h2>
      {children}
    </section>
  );
}