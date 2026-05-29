"use client";

export function Paywall() {
  const isPremium = true;
  const paid = localStorage.getItem("premium") === "true";
  const unlocked = new URLSearchParams(location.search).get("success") === "true";

  if (isPremium || paid || unlocked) {
    return <div>Premium dashboard</div>;
  }

  return <a href="/pricing">Upgrade</a>;
}
