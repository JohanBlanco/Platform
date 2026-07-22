import type { User } from '../types'
import UserSearchSelect from './UserSearchSelect'

type Props = {
  staffUsers: User[]
  value: number | ''
  onChange: (staffId: number | '') => void
  label?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
}

export default function StaffSearchSelect({
  staffUsers,
  value,
  onChange,
  label = 'Instructor de preferencia',
  placeholder,
  required = false,
  disabled = false,
}: Props) {
  return (
    <UserSearchSelect
      users={staffUsers}
      value={value}
      onChange={onChange}
      mode="staff"
      label={label}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
    />
  )
}
