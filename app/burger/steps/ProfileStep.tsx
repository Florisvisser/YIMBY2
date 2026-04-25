"use client";

import { useRef, useState } from "react";
import type { ProfileData, SuggestResult } from "@/lib/data/types";
import { Eyebrow, DisplayH1, Lead, InputField, PrimaryBtn } from "../ui";

export default function ProfileStep({
  onComplete,
  initial,
}: {
  onComplete: (data: ProfileData) => void;
  initial?: ProfileData;
}) {
  const [voornaam, setVoornaam] = useState(initial?.voornaam ?? "");
  const [achternaam, setAchternaam] = useState(initial?.achternaam ?? "");
  const [leeftijdRaw, setLeeftijdRaw] = useState(
    initial?.leeftijd ? String(initial.leeftijd) : "",
  );

  const [addressInput, setAddressInput] = useState("");
  const [suggestions, setSuggestions] = useState<SuggestResult[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<SuggestResult | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [suggestError, setSuggestError] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const leeftijd = parseInt(leeftijdRaw, 10);
  const leeftijdValid = !isNaN(leeftijd) && leeftijd >= 1 && leeftijd <= 120;
  const canSubmit =
    voornaam.trim().length > 0 &&
    achternaam.trim().length > 0 &&
    leeftijdValid &&
    selectedAddress !== null;

  function handleAddressInput(val: string) {
    setAddressInput(val);
    setSelectedAddress(null);
    setSuggestError(false);
    setSuggestions([]);
    setDropdownOpen(false);
    setHighlightedIndex(-1);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.length < 4) return;

    debounceRef.current = setTimeout(async () => {
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;
      try {
        const res = await fetch(
          `/api/pdok-suggest?q=${encodeURIComponent(val)}`,
          { signal: controller.signal },
        );
        const data = (await res.json()) as SuggestResult[];
        setSuggestions(data);
        setDropdownOpen(data.length > 0);
        if (data.length === 0) setSuggestError(true);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setSuggestions([]);
        setSuggestError(true);
      }
    }, 300);
  }

  function selectSuggestion(s: SuggestResult) {
    setSelectedAddress(s);
    setAddressInput(s.label);
    setSuggestions([]);
    setDropdownOpen(false);
    setHighlightedIndex(-1);
    setSuggestError(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!dropdownOpen || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && highlightedIndex >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[highlightedIndex]);
    } else if (e.key === "Escape") {
      setDropdownOpen(false);
      setHighlightedIndex(-1);
    }
  }

  function handleBypass() {
    const manualAddress: SuggestResult = {
      label: addressInput || "Bilthoven (handmatig)",
      postcode: "3722 HD",
      straatnaam: "Bilthoven",
      huis_nlt: "",
      neighbourhood: "Bilthoven",
    };
    selectSuggestion(manualAddress);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || !selectedAddress) return;
    onComplete({
      voornaam: voornaam.trim(),
      achternaam: achternaam.trim(),
      leeftijd,
      postcode: selectedAddress.postcode,
      neighbourhood: selectedAddress.neighbourhood,
      straatnaam: selectedAddress.straatnaam,
      huis_nlt: selectedAddress.huis_nlt,
      lat: selectedAddress.lat,
      lon: selectedAddress.lon,
    });
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <Eyebrow>Schapenweide · Bilthoven · 2026</Eyebrow>
      <DisplayH1>Wat speelt er in jouw buurt?</DisplayH1>
      <Lead>
        Vul je naam en adres in. Wij zoeken het ontwikkelplan dat jou raakt en leggen het
        uit in begrijpelijke taal.
      </Lead>

      {/* Naam */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <InputField
          label="Voornaam"
          id="voornaam"
          value={voornaam}
          onChange={setVoornaam}
          placeholder="Jan"
        />
        <InputField
          label="Achternaam"
          id="achternaam"
          value={achternaam}
          onChange={setAchternaam}
          placeholder="de Vries"
        />
      </div>

      {/* Leeftijd */}
      <div style={{ marginBottom: 20 }}>
        <InputField
          label="Leeftijd"
          id="leeftijd"
          value={leeftijdRaw}
          onChange={setLeeftijdRaw}
          placeholder="42"
          type="number"
          inputMode="numeric"
        />
        {leeftijdRaw && !leeftijdValid && (
          <p style={{ fontSize: 12, color: "var(--rose-400)", margin: "6px 0 0 0" }}>
            Vul een leeftijd in tussen 1 en 120.
          </p>
        )}
      </div>

      {/* Address autocomplete */}
      <div style={{ position: "relative", marginBottom: 8 }}>
        <label style={{ display: "block" }}>
          <span style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--fg-secondary)", marginBottom: 8 }}>
            Adres
          </span>
          <input
            type="text"
            value={addressInput}
            onChange={(e) => handleAddressInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => suggestions.length > 0 && setDropdownOpen(true)}
            onBlur={() => setTimeout(() => setDropdownOpen(false), 150)}
            placeholder="Emmalaan 12, 3722 XL Bilthoven"
            autoComplete="off"
            style={{
              width: "100%",
              padding: "14px 16px",
              fontSize: 16,
              fontFamily: "var(--font-sans)",
              borderRadius: selectedAddress
                ? "var(--radius-md)"
                : dropdownOpen
                ? "var(--radius-md) var(--radius-md) 0 0"
                : "var(--radius-md)",
              border: selectedAddress
                ? "1.5px solid var(--moss-400)"
                : "1px solid var(--border-medium)",
              background: selectedAddress ? "var(--moss-50)" : "var(--paper-0)",
              color: "var(--ink-900)",
              outline: "none",
              boxSizing: "border-box",
              transition: `all var(--dur-fast) var(--ease-out)`,
            }}
          />
        </label>

        {/* Dropdown */}
        {dropdownOpen && suggestions.length > 0 && (
          <ul
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              background: "var(--paper-0)",
              border: "1px solid var(--border-medium)",
              borderTop: "none",
              borderRadius: "0 0 var(--radius-md) var(--radius-md)",
              boxShadow: "var(--shadow-md)",
              listStyle: "none",
              margin: 0,
              padding: 0,
              zIndex: 10,
              maxHeight: 220,
              overflowY: "auto",
            }}
          >
            {suggestions.map((s, i) => (
              <li
                key={i}
                onMouseDown={() => selectSuggestion(s)}
                style={{
                  padding: "11px 16px",
                  fontSize: 14,
                  cursor: "pointer",
                  background: i === highlightedIndex ? "var(--moss-50)" : "transparent",
                  color: i === highlightedIndex ? "var(--moss-700)" : "var(--ink-900)",
                  borderBottom: i < suggestions.length - 1 ? "1px solid var(--border-soft)" : "none",
                  transition: "background var(--dur-fast) var(--ease-out)",
                }}
              >
                {s.label}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Status / bypass */}
      {selectedAddress && (
        <p style={{ fontSize: 12, color: "var(--moss-600)", margin: "0 0 20px 0" }}>
          ✓ Adres geselecteerd: {selectedAddress.postcode} · {selectedAddress.neighbourhood}
        </p>
      )}

      {suggestError && !selectedAddress && addressInput.length >= 4 && (
        <div style={{
          fontSize: 13,
          color: "var(--fg-muted)",
          margin: "0 0 20px 0",
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}>
          <span>Adres niet gevonden in PDOK.</span>
          <button
            type="button"
            onClick={handleBypass}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              fontFamily: "var(--font-sans)",
              fontSize: 13,
              color: "var(--fg-secondary)",
              textDecoration: "underline",
              padding: 0,
              textAlign: "left",
            }}
          >
            Toch doorgaan met &ldquo;{addressInput}&rdquo;
          </button>
        </div>
      )}

      {!selectedAddress && !suggestError && (
        <p style={{ fontSize: 12, color: "var(--fg-muted)", margin: "0 0 20px 0" }}>
          Typ minimaal 4 tekens om adressuggesties te zien.
        </p>
      )}

      <PrimaryBtn type="submit" disabled={!canSubmit}>
        Bekijk wat dit plan voor mij betekent
      </PrimaryBtn>
    </form>
  );
}
