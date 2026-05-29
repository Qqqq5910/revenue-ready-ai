"use client";

import posthog from "posthog-js";

export function Analytics() {
  posthog.capture("checkout_started");
  return null;
}
