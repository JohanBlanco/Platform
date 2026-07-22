import TagMultiSelect, { type TagOption } from './TagMultiSelect'

export type MultiSelectOption<T extends string | number> = {
  value: T
  label: string
}

type Props<T extends string | number> = {
  options: MultiSelectOption<T>[]
  value: T[]
  onChange: (value: T[]) => void
  placeholder?: string
  /** Conservado por compatibilidad con el trigger anterior. */
  emptyLabel?: string
  disabled?: boolean
}

export default function MultiSelect<T extends string | number>({
  options,
  value,
  onChange,
  placeholder,
  emptyLabel,
  disabled = false,
}: Props<T>) {
  const tagOptions: TagOption<T>[] = options.map((o) => ({
    value: o.value,
    label: o.label,
  }))

  return (
    <TagMultiSelect
      options={tagOptions}
      value={value}
      onChange={onChange}
      disabled={disabled}
      placeholder={placeholder ?? emptyLabel ?? 'Escribe y pulsa Enter…'}
      noResultsMessage="Sin coincidencias"
    />
  )
}
