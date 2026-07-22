import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import RoutineDisplay from '../components/RoutineDisplay'
import { useToast } from '../toast'
import type { Routine, User } from '../types'

export default function ProfilePage() {
  const { showSuccess } = useToast()
  const [user, setUser] = useState<User | null>(null)
  const [routines, setRoutines] = useState<Routine[]>([])
  const [birthYear, setBirthYear] = useState('')
  const [age, setAge] = useState('')
  const [goals, setGoals] = useState('')
  const [phone, setPhone] = useState('')

  useEffect(() => {
    api.getMe().then((u) => {
      setUser(u)
      if (u.profile) {
        setBirthYear(u.profile.birthYear?.toString() ?? '')
        setAge(u.profile.age?.toString() ?? '')
        setGoals(u.profile.goals ?? '')
        setPhone(u.profile.phone ?? '')
      }
    })
    api.getMyRoutines()
      .then(setRoutines)
      .catch(() => setRoutines([]))
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    await api.updateProfile({
      birthYear: birthYear ? parseInt(birthYear) : null,
      age: age ? parseInt(age) : null,
      goals, phone,
    })
    showSuccess('Perfil actualizado')
  }

  if (!user) return <p>Cargando...</p>

  return (
    <div>
      <div className="page-header">
        <h1>Mi perfil</h1>
        <p>{user.firstName} {user.lastName} · {user.email}</p>
      </div>

      {routines.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h2 style={{ fontSize: '1.15rem', margin: 0 }}>Mis rutinas</h2>
            <Link to="/servicios/rutinas" className="btn-secondary" style={{ fontSize: '0.85rem' }}>
              Ver todas
            </Link>
          </div>
          <div className="grid grid-2">
            {routines.slice(0, 2).map((r) => (
              <div key={r.id} className="card">
                <RoutineDisplay routine={r} compact />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card" style={{ maxWidth: 600 }}>
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label>Año de nacimiento</label>
            <input type="number" value={birthYear} onChange={(e) => setBirthYear(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Edad</label>
            <input type="number" value={age} onChange={(e) => setAge(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Teléfono</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Objetivos</label>
            <textarea value={goals} onChange={(e) => setGoals(e.target.value)} rows={3} />
          </div>
          <button type="submit" className="btn-primary">Guardar</button>
        </form>
      </div>
    </div>
  )
}
