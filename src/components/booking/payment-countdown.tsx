"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/** Time left to transfer before the seats are released; refreshes the page when it runs out. */
export function PaymentCountdown({ expiresAt }: { expiresAt: string }) {
  const router = useRouter();
  const end = new Date(expiresAt).getTime();
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setLeft(Math.max(0, end - Date.now()));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [end]);

  useEffect(() => {
    if (left === 0) router.refresh();
  }, [left, router]);

  if (left === null) return <span className="tabular-nums">--:--:--</span>;
  const s = Math.floor(left / 1000);
  const hh = String(Math.floor(s / 3600));
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return (
    <span className="tabular-nums" role="timer" aria-live="off">
      {hh}:{mm}:{ss}
    </span>
  );
}
