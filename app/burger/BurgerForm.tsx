"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import {
  CATEGORY_LABEL_NL,
  type ConcernCategory,
} from "@/lib/data/types";

type Step = "address" | "concern" | "done";

type AddressInfo = {
  postcode: string;
  neighbourhood: string;
  streetReference?: string;
};

const CATEGORY_OPTIONS: ConcernCategory[] = [
  "traffic_parking",
  "building_height",
  "green_nature",
  "noise_livability",
];

const SEVERITY_LABELS: Record<number, string> = {
  1: "klein ongemak",
  2: "merkbaar nadeel",
  3: "duidelijk probleem",
  4: "groot probleem",
  5: "onaanvaardbaar",
};

const MIN_TEXT = 10;
const MAX_TEXT = 1500;

export default function BurgerForm() {
  const [step, setStep] = useState<Step>("address");

  const [postcodeInput, setPostcodeInput] = useState("");
  const [huisnummerInput, setHuisnummerInput] = useState("");
  const [address, setAddress] = useState<AddressInfo | null>(null);
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);

  const [category, setCategory] = useState<ConcernCategory | null>(null);
  const [severity, setSeverity] = useState<number>(3);
  const [concernText, setConcernText] = useState("");

  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const lookupInFlight = useRef(false);
  const submitInFlight = useRef(false);

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    if (lookupInFlight.current) return;
    lookupInFlight.current = true;
    setAddressError(null);
    setAddressLoading(true);
    try {
      const params = new URLSearchParams({
        postcode: postcodeInput.trim(),
        huisnummer: huisnummerInput.trim(),
      });
      const res = await fetch(`/api/pdok?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        setAddressError(
          typeof data?.error === "string"
            ? data.error
            : "Adres kon niet gevonden worden.",
        );
        setAddress(null);
        return;
      }
      setAddress(data as AddressInfo);
      setStep("concern");
    } catch {
      setAddressError("Verbinding met PDOK mislukt. Probeer opnieuw.");
    } finally {
      setAddressLoading(false);
      lookupInFlight.current = false;
    }
  }

  async function handleSubmit() {
    if (submitInFlight.current) return;
    if (!address || !category) return;
    if (concernText.length < MIN_TEXT) return;
    submitInFlight.current = true;

    setSubmitError(null);
    setSubmitLoading(true);
    try {
      const res = await fetch("/api/concerns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postcode: address.postcode,
          neighbourhood: address.neighbourhood,
          streetReference: address.streetReference,
          category,
          severity,
          concernText,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(
          typeof data?.error === "string"
            ? data.error
            : "Zienswijze kon niet worden opgeslagen.",
        );
        return;
      }
      setStep("done");
    } catch {
      setSubmitError("Verbinding mislukt. Probeer opnieuw.");
    } finally {
      setSubmitLoading(false);
      submitInFlight.current = false;
    }
  }

  if (step === "done") {
    return (
      <section className="bg-white border border-neutral-200 rounded-lg p-8 space-y-4">
        <h2 className="text-xl font-semibold text-neutral-900">
          Bedankt — je zienswijze is opgeslagen.
        </h2>
        <p className="text-neutral-600 text-sm leading-relaxed">
          De gemeente neemt jouw input mee in het participatieverslag voor
          Schapenweide.
        </p>
        <Link
          href="/gemeente"
          className="inline-block rounded-lg bg-neutral-900 text-white px-5 py-2.5 font-medium hover:bg-neutral-700 transition"
        >
          Bekijk het dashboard
        </Link>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <ol className="flex gap-2 text-xs uppercase tracking-widest text-neutral-400">
        <li className={step === "address" ? "text-neutral-900" : ""}>1. Adres</li>
        <li>·</li>
        <li className={step === "concern" ? "text-neutral-900" : ""}>2. Zorg</li>
        <li>·</li>
        <li>3. Bevestigen</li>
      </ol>

      {step === "address" && (
        <form
          onSubmit={handleLookup}
          className="bg-white border border-neutral-200 rounded-lg p-6 space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <label className="space-y-1.5 block">
              <span className="text-sm font-medium text-neutral-700">
                Postcode
              </span>
              <input
                type="text"
                required
                placeholder="3722 HD"
                value={postcodeInput}
                onChange={(e) => setPostcodeInput(e.target.value)}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </label>
            <label className="space-y-1.5 block">
              <span className="text-sm font-medium text-neutral-700">
                Huisnummer
              </span>
              <input
                type="text"
                inputMode="numeric"
                required
                placeholder="12"
                value={huisnummerInput}
                onChange={(e) => setHuisnummerInput(e.target.value)}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </label>
          </div>

          {addressError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {addressError}
            </p>
          )}

          <button
            type="submit"
            disabled={addressLoading}
            className="rounded-lg bg-neutral-900 text-white px-5 py-2.5 font-medium hover:bg-neutral-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {addressLoading ? "Adres opzoeken…" : "Volgende"}
          </button>
        </form>
      )}

      {step === "concern" && address && (
        <div className="space-y-6">
          <div className="bg-white border border-neutral-200 rounded-lg p-4 text-sm text-neutral-600">
            <p className="text-xs uppercase tracking-widest text-neutral-400 mb-1">
              Adres
            </p>
            <p className="text-neutral-900 font-medium">
              {address.streetReference ?? ""}
            </p>
            <p>
              {address.postcode} · {address.neighbourhood}
            </p>
            <button
              type="button"
              onClick={() => {
                setStep("address");
                setAddress(null);
              }}
              className="mt-2 text-xs text-neutral-500 underline hover:text-neutral-900"
            >
              Adres wijzigen
            </button>
          </div>

          <fieldset className="bg-white border border-neutral-200 rounded-lg p-6 space-y-4">
            <legend className="text-sm font-medium text-neutral-700 px-1">
              Welk thema?
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CATEGORY_OPTIONS.map((opt) => (
                <label
                  key={opt}
                  className={`block border rounded-md px-4 py-3 cursor-pointer text-sm transition ${
                    category === opt
                      ? "border-neutral-900 bg-neutral-900 text-white"
                      : "border-neutral-200 hover:border-neutral-400"
                  }`}
                >
                  <input
                    type="radio"
                    name="category"
                    value={opt}
                    checked={category === opt}
                    onChange={() => setCategory(opt)}
                    className="sr-only"
                  />
                  {CATEGORY_LABEL_NL[opt]}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="bg-white border border-neutral-200 rounded-lg p-6 space-y-3">
            <label
              htmlFor="severity"
              className="text-sm font-medium text-neutral-700 block"
            >
              Hoe groot is het probleem voor jou?{" "}
              <span className="text-neutral-500 font-normal">
                ({severity}/5 — {SEVERITY_LABELS[severity]})
              </span>
            </label>
            <input
              id="severity"
              type="range"
              min={1}
              max={5}
              step={1}
              value={severity}
              onChange={(e) => setSeverity(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="bg-white border border-neutral-200 rounded-lg p-6 space-y-2">
            <label
              htmlFor="concernText"
              className="text-sm font-medium text-neutral-700 block"
            >
              Beschrijf je zorg
            </label>
            <textarea
              id="concernText"
              value={concernText}
              onChange={(e) => setConcernText(e.target.value.slice(0, MAX_TEXT))}
              rows={5}
              placeholder="Bijvoorbeeld: 'Tijdens de spits is de Emmalaan al overbelast…'"
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
            <p className="text-xs text-neutral-500">
              {concernText.length}/{MAX_TEXT} tekens
              {concernText.length < MIN_TEXT && (
                <span className="text-red-600">
                  {" "}
                  · minimaal {MIN_TEXT} tekens
                </span>
              )}
            </p>
          </div>

          {submitError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {submitError}
            </p>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={
              submitLoading ||
              !category ||
              concernText.length < MIN_TEXT
            }
            className="rounded-lg bg-neutral-900 text-white px-5 py-2.5 font-medium hover:bg-neutral-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitLoading ? "Versturen…" : "Verstuur zienswijze"}
          </button>
        </div>
      )}
    </section>
  );
}
