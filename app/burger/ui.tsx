"use client";

export function ArrowIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 6l6 6-6 6"/>
    </svg>
  );
}

export function PrimaryBtn({
  children,
  onClick,
  disabled,
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        padding: "16px 22px",
        borderRadius: "var(--radius-md)",
        background: disabled ? "var(--paper-100)" : "var(--moss-500)",
        color: disabled ? "var(--ink-300)" : "var(--paper-50)",
        border: "none",
        fontFamily: "var(--font-sans)",
        fontSize: 16,
        fontWeight: 500,
        cursor: disabled ? "not-allowed" : "pointer",
        boxShadow: disabled ? "none" : "var(--shadow-sm)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        transition: `all var(--dur-fast) var(--ease-out)`,
      }}
    >
      {children}
      {!disabled && <ArrowIcon />}
    </button>
  );
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 12,
      fontWeight: 500,
      textTransform: "uppercase",
      letterSpacing: "0.18em",
      color: "var(--fg-tertiary)",
      marginBottom: 12,
    }}>
      {children}
    </div>
  );
}

export function DisplayH1({ children }: { children: React.ReactNode }) {
  return (
    <h1 style={{
      fontFamily: "var(--font-display)",
      fontSize: "clamp(28px, 6vw, 36px)",
      fontWeight: 500,
      lineHeight: 1.15,
      letterSpacing: "-0.02em",
      color: "var(--ink-900)",
      margin: "0 0 14px 0",
      textWrap: "balance",
      fontVariationSettings: "'opsz' 144, 'SOFT' 50",
    }}>
      {children}
    </h1>
  );
}

export function Lead({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: 16,
      lineHeight: 1.6,
      color: "var(--fg-secondary)",
      margin: "0 0 28px 0",
    }}>
      {children}
    </p>
  );
}

export function InputField({
  label,
  id,
  value,
  onChange,
  placeholder,
  type = "text",
  inputMode,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <label style={{ display: "block" }}>
      <span style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--fg-secondary)", marginBottom: 8 }}>
        {label}
      </span>
      <input
        id={id}
        type={type}
        inputMode={inputMode}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          padding: "14px 16px",
          fontSize: 16,
          fontFamily: "var(--font-sans)",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--border-medium)",
          background: "var(--paper-0)",
          color: "var(--ink-900)",
          outline: "none",
          boxSizing: "border-box",
          transition: `border-color var(--dur-fast) var(--ease-out)`,
        }}
      />
    </label>
  );
}
