import type { User } from '../types'
import UserSearchSelect from './UserSearchSelect'

type Props = {
  members: User[]
  value: number | ''
  onChange: (memberId: number | '') => void
  label?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
}

export default function MemberSearchSelect({
  members,
  value,
  onChange,
  label = 'Miembro',
  placeholder,
  required = false,
  disabled = false,
}: Props) {
  return (
    <UserSearchSelect
      users={members}
      value={value}
      onChange={onChange}
      mode="member"
      label={label}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
    />
  )
}
