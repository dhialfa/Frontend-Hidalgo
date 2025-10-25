import { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import { getAllCustomers } from "../../api/customer/customer.api";
import type { Customer } from "../../api/customer/customer.api";

type Props = {
  value?: number | null;
  onChange: (value: number | null) => void;
  label?: string;
};

type Option = { value: number; label: string };

export default function CustomerSelect({ value = null, onChange, label = "Cliente" }: Props) {
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await getAllCustomers();
        const opts: Option[] = (res.data as Customer[]).map((c) => ({
          value: c.id,
          label: c.name,
        }));
        setOptions(opts);
      } catch (err) {
        console.error("Error cargando clientes", err);
        setOptions([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const selected = useMemo(
    () => (value == null ? null : options.find((o) => o.value === value) ?? null),
    [value, options]
  );

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <Select
        options={options}
        value={selected}
        onChange={(opt) => onChange(opt ? (opt as Option).value : null)}
        isLoading={loading}
        isClearable
        placeholder="Buscar cliente…"
        classNamePrefix="react-select"
        styles={{
          control: (base) => ({
            ...base,
            backgroundColor: "transparent",
            borderColor: "#d1d5db",
            minHeight: "2.75rem",
          }),
          menu: (base) => ({ ...base, zIndex: 40 }),
        }}
      />
    </div>
  );
}
