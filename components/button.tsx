export default function Button({children, active = true, onclick}: {children: React.ReactNode, active?: boolean, onclick: () => void}) {
  return (<button onClick={onclick} className={`rounded-md px-2 py-1 mx-1 cursor-pointer ${active ? "bg-foreground text-background" : "bg-foreground/[0.3] text-foreground"}`}>{children}</button>);
}