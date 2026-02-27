"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

const VISITOR_KEY_STORAGE = "lb_visitor_key";
const SESSION_KEY_STORAGE = "lb_session_id";
const VISITOR_COOKIE = "lb_visitor_key";

function randomId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getOrCreateId(storage: Storage, key: string) {
  const existing = storage.getItem(key);
  if (existing) return existing;
  const id = randomId();
  storage.setItem(key, id);
  return id;
}

function sendVisit(payload: {
  path: string;
  timestamp: string;
  sessionId: string;
  visitorKey: string;
  referrer: string | null;
  durationSeconds?: number;
}, useBeacon = false) {
  const url = "/api/analytics/visit";
  const body = JSON.stringify(payload);

  if (useBeacon && typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon(url, blob);
    return;
  }

  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: useBeacon,
  }).catch(() => {
    // Ignore analytics transport errors.
  });
}

export function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentPathRef = useRef<string>("");
  const viewStartedAtRef = useRef<number>(Date.now());
  const visitorKeyRef = useRef<string>("");
  const sessionIdRef = useRef<string>("");

  useEffect(() => {
    if (typeof window === "undefined") return;

    visitorKeyRef.current = getOrCreateId(window.localStorage, VISITOR_KEY_STORAGE);
    sessionIdRef.current = getOrCreateId(window.sessionStorage, SESSION_KEY_STORAGE);
    document.cookie = `${VISITOR_COOKIE}=${visitorKeyRef.current};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`;
  }, []);

  useEffect(() => {
    if (!pathname) return;

    const search = searchParams.toString();
    const nextPath = search ? `${pathname}?${search}` : pathname;
    const now = Date.now();

    if (currentPathRef.current) {
      const durationSeconds = Math.max(0, Math.round((now - viewStartedAtRef.current) / 1000));
      sendVisit(
        {
          path: currentPathRef.current,
          timestamp: new Date(now).toISOString(),
          sessionId: sessionIdRef.current,
          visitorKey: visitorKeyRef.current,
          referrer: document.referrer || null,
          durationSeconds,
        },
        true,
      );
    }

    currentPathRef.current = nextPath;
    viewStartedAtRef.current = now;

    sendVisit({
      path: nextPath,
      timestamp: new Date(now).toISOString(),
      sessionId: sessionIdRef.current,
      visitorKey: visitorKeyRef.current,
      referrer: document.referrer || null,
    });
  }, [pathname, searchParams]);

  useEffect(() => {
    const flushDwellTime = () => {
      if (!currentPathRef.current) return;

      const now = Date.now();
      const durationSeconds = Math.max(0, Math.round((now - viewStartedAtRef.current) / 1000));
      sendVisit(
        {
          path: currentPathRef.current,
          timestamp: new Date(now).toISOString(),
          sessionId: sessionIdRef.current,
          visitorKey: visitorKeyRef.current,
          referrer: document.referrer || null,
          durationSeconds,
        },
        true,
      );

      viewStartedAtRef.current = now;
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flushDwellTime();
      }
    };

    window.addEventListener("beforeunload", flushDwellTime);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", flushDwellTime);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return null;
}
