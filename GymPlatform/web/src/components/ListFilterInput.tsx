type Props = {
  value: string
  onChange: (value: string) => void
  resultCount?: number
  totalCount?: number
  placeholder?: string
}

export default function ListFilterInput({
  value,
  onChange,
  resultCount,
  totalCount,
  placeholder = 'Buscar en la lista…',
}: Props) {
  const showCount = resultCount != null && totalCount != null && value.trim().length > 0

  return (
    <div className="list-filter">
      <input
        type="search"
        className="list-filter-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label="Filtrar lista"
      />
      {showCount && (
        <span className="list-filter-count">
          {resultCount} de {totalCount}
        </span>
      )}
    </div>
  )
}
