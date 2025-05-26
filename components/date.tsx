import { formatDistanceToNow, formatISO9075 } from "date-fns";

export default function Date({ date }: { date: Date | null | undefined }) {
  if (!date) return <></>;
  
  return <>{formatISO9075(date)} ({formatDistanceToNow(date, { addSuffix: true })})</>
}