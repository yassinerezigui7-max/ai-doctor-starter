"use client";

import { Select } from "@/components/ui/Select";
import { t } from "@/config/copy.fr";
import { communesOf } from "@/data/communes";

interface CommuneSelectProps {
  wilayaCode: string;
  value: string;
  onChange: (name: string) => void;
  onBlur: () => void;
  error?: string;
}

/** Disabled until a wilaya is chosen; repopulates instantly (bundled data). */
export function CommuneSelect({
  wilayaCode,
  value,
  onChange,
  onBlur,
  error,
}: CommuneSelectProps) {
  const communes = wilayaCode ? communesOf(wilayaCode) : [];
  const disabled = communes.length === 0;

  return (
    <Select
      label={t("order.fields.commune.label")}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      error={error}
      disabled={disabled}
      required
      autoComplete="address-level2"
    >
      <option value="" disabled>
        {disabled
          ? t("order.fields.commune.placeholderDisabled")
          : t("order.fields.commune.placeholder")}
      </option>
      {communes.map((c) => (
        <option key={c.name} value={c.name}>
          {c.name}
        </option>
      ))}
    </Select>
  );
}
