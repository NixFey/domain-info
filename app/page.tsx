"use client";
import Form from "next/form";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-start sm:items-center w-full">
        <p>Search for a domain...</p>
        <Form action={(data) => router.push(`domain/${data.get("domain")}`)} className="min-w-8 w-full sm:w-1/2">
          <input required autoFocus={true} autoCapitalize="none" autoCorrect="off" className="border-1 border-foreground rounded-md p-4 w-full" type="text" name="domain" />
          <button type="submit" className="my-2 rounded-md cursor-pointer bg-foreground text-background p-2 w-full">Search</button>
        </Form>
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <a className="underline" href="https://github.com/nixfey/domain-info">Source Code</a>
      </footer>
    </div>
  );
}
