import { useMemo } from 'react'
import type { User } from '../types'
import {
  filterUsers,
  formatUserHint,
  userFullName,
  type UserSearchMode,
} from '../utils/userSearch'
import TagMultiSelect, { type TagOption } from './TagMultiSelect'

type Props = {
  users: User[]
  value: number[]
  onChange: (value: number[]) => void
  mode?: UserSearchMode
  placeholder?: string
  searchPlaceholder?: string
  /** Conservado por compatibilidad; sin chips = sin filtro (todos). */
  emptyLabel?: string
  noResultsMessage?: string
  disabled?: boolean
}

export default function UserSearchMultiSelect({
  users,
  value,
  onChange,
  mode = 'staff',
  placeholder,
  searchPlaceholder,
  noResultsMessage,
  disabled = false,
}: Props) {
  const options = useMemo<TagOption<number>[]>(
    () =>
      users.map((user) => ({
        value: user.id,
        label: userFullName(user),
        hint: formatUserHint(user, mode),
      })),
    [users, mode],
  )

  const defaultPlaceholder = mode === 'member'
    ? 'Escribe un miembro y pulsa Enter…'
    : 'Escribe un instructor y pulsa Enter…'

  return (
    <TagMultiSelect
      options={options}
      value={value}
      onChange={onChange}
      disabled={disabled}
      placeholder={searchPlaceholder ?? placeholder ?? defaultPlaceholder}
      noResultsMessage={
        noResultsMessage
        ?? (mode === 'member'
          ? 'Ningún miembro coincide con la búsqueda'
          : 'Ningún instructor coincide con la búsqueda')
      }
      getSuggestions={(query, selected) => {
        const available = users.filter((u) => !selected.includes(u.id))
        return filterUsers(available, query, mode, 8).map((user) => ({
          value: user.id,
          label: userFullName(user),
          hint: formatUserHint(user, mode),
        }))
      }}
    />
  )
}
