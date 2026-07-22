import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../../api'
import { useFilteredList } from '../../hooks/useFilteredList'
import { useDateFormat } from '../../preferences/useDateFormat'
import { useToast } from '../../toast'
import type { MemberFileDetail, MemberFileUser } from '../../types'
import { downloadMemberFilePdf } from '../../utils/memberFilePdf'
import MemberFormDocument from './MemberFormDocument'

export default function MemberFilesPage() {
  const { userId, submissionId } = useParams()
  const navigate = useNavigate()
  const { formatDate } = useDateFormat()
  const { showApiError } = useToast()

  const selectedUserId = userId ? Number(userId) : null
  const selectedSubmissionId = submissionId ? Number(submissionId) : null

  const [members, setMembers] = useState<MemberFileUser[]>([])
  const [loadingMembers, setLoadingMembers] = useState(true)
  const [selectedMember, setSelectedMember] = useState<MemberFileUser | null>(null)
  const [detail, setDetail] = useState<MemberFileDetail | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  const loadMembers = useCallback(async () => {
    setLoadingMembers(true)
    try {
      const data = await api.getMemberFiles()
      setMembers(data)
    } catch (err) {
      showApiError(err, 'No se pudieron cargar los expedientes')
      setMembers([])
    } finally {
      setLoadingMembers(false)
    }
  }, [showApiError])

  useEffect(() => { loadMembers() }, [loadMembers])

  useEffect(() => {
    if (selectedUserId == null || Number.isNaN(selectedUserId)) {
      setSelectedMember(null)
      return
    }
    const existing = members.find((member) => member.userId === selectedUserId)
    if (existing) {
      setSelectedMember(existing)
      return
    }
    api.getMemberFilesForUser(selectedUserId)
      .then(setSelectedMember)
      .catch((err) => {
        showApiError(err, 'No se pudo cargar el expediente del miembro')
        setSelectedMember(null)
      })
  }, [members, selectedUserId, showApiError])

  useEffect(() => {
    if (selectedUserId == null || selectedSubmissionId == null
      || Number.isNaN(selectedUserId) || Number.isNaN(selectedSubmissionId)) {
      setDetail(null)
      return
    }
    setLoadingDetail(true)
    api.getMemberFileDetail(selectedUserId, selectedSubmissionId)
      .then(setDetail)
      .catch((err) => {
        showApiError(err, 'No se pudo cargar el archivo')
        setDetail(null)
      })
      .finally(() => setLoadingDetail(false))
  }, [selectedUserId, selectedSubmissionId, showApiError])

  const memberSearchExtras = useCallback(
    (member: MemberFileUser) => [member.email, String(member.fileCount)],
    [],
  )
  const { filtered, filterInput } = useFilteredList(members, memberSearchExtras)

  const handleDownloadPdf = () => {
    if (!detail) return
    downloadMemberFilePdf(detail, {
      gymName: detail.organizationName,
      accentHex:
        getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || undefined,
    })
  }

  return (
    <div className="admin-section member-files-page">
      <div className="member-files-layout">
        <aside className="member-files-sidebar card">
          <div className="member-files-sidebar-head">
            <h3>Miembros</h3>
            {filterInput}
          </div>
          {loadingMembers ? (
            <p className="text-muted">Cargando miembros…</p>
          ) : members.length === 0 ? (
            <div className="empty-state">Aún no hay formularios vinculados a miembros.</div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">Ningún resultado coincide con la búsqueda.</div>
          ) : (
            <div className="member-files-user-list">
              {filtered.map((member) => (
                <button
                  key={member.userId}
                  type="button"
                  className={`member-files-user-item${selectedUserId === member.userId ? ' active' : ''}`}
                  onClick={() => navigate(`/reception/expedientes/usuario/${member.userId}`)}
                >
                  <strong>{member.firstName} {member.lastName}</strong>
                  <span className="text-muted">{member.email}</span>
                  <span className="member-files-user-count">
                    {member.fileCount} archivo{member.fileCount === 1 ? '' : 's'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </aside>

        <section className="member-files-main">
          {!selectedUserId ? (
            <div className="empty-state card">Selecciona un miembro para ver sus archivos.</div>
          ) : !selectedMember ? (
            <div className="empty-state card">Cargando expediente…</div>
          ) : (
            <div className="member-files-panel card">
              <div className="member-files-panel-head">
                <div>
                  <h3>{selectedMember.firstName} {selectedMember.lastName}</h3>
                  <p className="text-muted">{selectedMember.email}</p>
                </div>
              </div>

              {selectedMember.files.length === 0 ? (
                <div className="empty-state">Este miembro aún no ha completado formularios.</div>
              ) : (
                <div className="member-files-list">
                  {selectedMember.files.map((file) => (
                    <button
                      key={file.id}
                      type="button"
                      className={`member-files-file-item${selectedSubmissionId === file.id ? ' active' : ''}`}
                      onClick={() => navigate(`/reception/expedientes/usuario/${selectedUserId}/archivo/${file.id}`)}
                    >
                      <strong>{file.formTitle}</strong>
                      <span className="text-muted">{formatDate(file.createdAt)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedSubmissionId && (
            <div className="member-files-preview card">
              <div className="member-files-preview-head">
                <h3>Vista previa</h3>
                <button
                  type="button"
                  className="btn-primary"
                  disabled={!detail || loadingDetail}
                  onClick={handleDownloadPdf}
                >
                  Descargar PDF
                </button>
              </div>
              {loadingDetail ? (
                <p className="text-muted">Generando vista previa…</p>
              ) : detail ? (
                <MemberFormDocument detail={detail} />
              ) : (
                <div className="empty-state">No se pudo cargar el archivo.</div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
