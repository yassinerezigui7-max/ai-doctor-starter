"use client";

import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { t } from "@/config/copy.fr";
import { WILAYAS } from "@/data/wilayas";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useState } from "react";

interface WilayaSelectProps {
  value: string;
  onChange: (code: string) => void;
  onBlur: () => void;
  error?: string;
}

const optionLabel = (code: string, name: string) => `${code} — ${name}`;

/**
 * Native <select> on touch devices (native pickers beat custom dropdowns on
 * phones); a searchable <input list> combobox on desktop. Value = wilaya code.
 */
export function WilayaSelect({ value, onChange, onBlur, error }: WilayaSelectProps) {
  const desktop = useMediaQuery("(min-width: 768px) and (pointer: fine)");
  const [text, setText] = useState("");
  // Keep the visible text in sync when the value changes externally
  // (draft rehydration) — state-adjustment-during-render pattern.
  const [lastValue, setLastValue] = useState(value);
  if (value !== lastValue) {
    setLastValue(value);
    const w = WILAYAS.find((w) => w.code === value);
    setText(w ? optionLabel(w.code, w.name) : "");
  }

  if (!desktop) {
    return (
      <Select
        label={t("order.fields.wilaya.label")}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        error={error}
        required
        autoComplete="address-level1"
      >
        <option value="" disabled>
          {t("order.fields.wilaya.placeholder")}
        </option>
        {WILAYAS.map((w) => (
          <option key={w.code} value={w.code}>
            {optionLabel(w.code, w.name)}
          </option>
        ))}
      </Select>
    );
  }

  return (
    <>
      <Input
        label={t("order.fields.wilaya.label")}
        placeholder={t("order.fields.wilaya.placeholder")}
        list="wilaya-options"
        value={text}
        error={error}
        required
        autoComplete="off"
        onChange={(e) => {
          const next = e.target.value;
          setText(next);
          const match = WILAYAS.find(
            (w) =>
              optionLabel(w.code, w.name).toLowerCase() === next.toLowerCase() ||
              w.name.toLowerCase() === next.trim().toLowerCase(),
          );
          onChange(match ? match.code : "");
        }}
        onBlur={onBlur}
      />
      <datalist id="wilaya-options">
        {WILAYAS.map((w) => (
          <option key={w.code} value={optionLabel(w.code, w.name)} />
        ))}
      </datalist>
    </>
  );
}
