import { useEffect, useState } from 'react'
import type { SettingsSection } from '../preferences'
import { usePreferences } from '../preferences'

type Props = {
  activeSection: SettingsSection
  onSectionChange: (section: SettingsSection) => void
  onBack: () => void
  showGymProfile?: boolean
  showBroadcastSettings?: boolean
  showFormsSettings?: boolean
  showForumsSettings?: boolean
  showCashSettings?: boolean
  showPrivateAccess?: boolean
}

function isAppearanceSection(section: SettingsSection) {
  return section === 'theme'
}

function isWhatsAppSection(section: SettingsSection) {
  return section === 'whatsapp-wame' || section === 'whatsapp-cloud' || section === 'broadcast-messages'
}

export default function SettingsSidebar({
  activeSection,
  onSectionChange,
  onBack,
  showGymProfile = false,
  showBroadcastSettings = false,
  showFormsSettings = false,
  showForumsSettings = false,
  showCashSettings = false,
  showPrivateAccess = false,
}: Props) {
  const { t } = usePreferences()
  const [appearanceOpen, setAppearanceOpen] = useState(() => isAppearanceSection(activeSection))
  const [whatsappOpen, setWhatsappOpen] = useState(() => isWhatsAppSection(activeSection))

  useEffect(() => {
    if (isAppearanceSection(activeSection)) {
      setAppearanceOpen(true)
    }
  }, [activeSection])

  useEffect(() => {
    if (isWhatsAppSection(activeSection)) {
      setWhatsappOpen(true)
    }
  }, [activeSection])

  return (
    <>
      <button type="button" className="settings-nav-link settings-nav-back" onClick={onBack}>
        ← {t('settings.back')}
      </button>

      {showGymProfile && (
        <button
          type="button"
          className={`settings-nav-link${activeSection === 'gym-profile' ? ' active' : ''}`}
          aria-current={activeSection === 'gym-profile' ? 'page' : undefined}
          onClick={() => onSectionChange('gym-profile')}
        >
          {t('settings.gymProfile')}
        </button>
      )}

      <div className="sidebar-group">
        <button
          type="button"
          className={`sidebar-group-header${isAppearanceSection(activeSection) ? ' active' : ''}`}
          onClick={() => setAppearanceOpen((open) => !open)}
          aria-expanded={appearanceOpen}
        >
          <span>{t('settings.appearance')}</span>
          <span className="sidebar-group-chevron" aria-hidden>{appearanceOpen ? '▾' : '▸'}</span>
        </button>
        {appearanceOpen && (
          <div className="sidebar-subnav">
            <button
              type="button"
              className={`sidebar-sub-link${activeSection === 'theme' ? ' active' : ''}`}
              aria-current={activeSection === 'theme' ? 'page' : undefined}
              onClick={() => onSectionChange('theme')}
            >
              {t('settings.theme')}
            </button>
          </div>
        )}
      </div>

      <button
        type="button"
        className={`settings-nav-link${activeSection === 'language' ? ' active' : ''}`}
        aria-current={activeSection === 'language' ? 'page' : undefined}
        onClick={() => onSectionChange('language')}
      >
        {t('settings.language')}
      </button>

      {showFormsSettings && (
        <button
          type="button"
          className={`settings-nav-link${activeSection === 'forms' ? ' active' : ''}`}
          aria-current={activeSection === 'forms' ? 'page' : undefined}
          onClick={() => onSectionChange('forms')}
        >
          {t('settings.forms')}
        </button>
      )}

      {showForumsSettings && (
        <button
          type="button"
          className={`settings-nav-link${activeSection === 'forums' ? ' active' : ''}`}
          aria-current={activeSection === 'forums' ? 'page' : undefined}
          onClick={() => onSectionChange('forums')}
        >
          {t('settings.forums')}
        </button>
      )}

      {showCashSettings && (
        <button
          type="button"
          className={`settings-nav-link${activeSection === 'cash' ? ' active' : ''}`}
          aria-current={activeSection === 'cash' ? 'page' : undefined}
          onClick={() => onSectionChange('cash')}
        >
          Caja
        </button>
      )}

      {showBroadcastSettings && (
        <div className="sidebar-group">
          <button
            type="button"
            className={`sidebar-group-header${isWhatsAppSection(activeSection) ? ' active' : ''}`}
            onClick={() => setWhatsappOpen((open) => !open)}
            aria-expanded={whatsappOpen}
          >
            <span>{t('settings.whatsappGroup')}</span>
            <span className="sidebar-group-chevron" aria-hidden>{whatsappOpen ? '▾' : '▸'}</span>
          </button>
          {whatsappOpen && (
            <div className="sidebar-subnav">
              <button
                type="button"
                className={`sidebar-sub-link${activeSection === 'whatsapp-wame' ? ' active' : ''}`}
                aria-current={activeSection === 'whatsapp-wame' ? 'page' : undefined}
                onClick={() => onSectionChange('whatsapp-wame')}
              >
                {t('settings.broadcastWhatsapp')}
              </button>
              <button
                type="button"
                className={`sidebar-sub-link${activeSection === 'whatsapp-cloud' ? ' active' : ''}`}
                aria-current={activeSection === 'whatsapp-cloud' ? 'page' : undefined}
                onClick={() => onSectionChange('whatsapp-cloud')}
              >
                {t('settings.whatsappCloud')}
              </button>
              <button
                type="button"
                className={`sidebar-sub-link${activeSection === 'broadcast-messages' ? ' active' : ''}`}
                aria-current={activeSection === 'broadcast-messages' ? 'page' : undefined}
                onClick={() => onSectionChange('broadcast-messages')}
              >
                {t('settings.broadcastMessages')}
              </button>
            </div>
          )}
        </div>
      )}

      {showPrivateAccess && (
        <button
          type="button"
          className={`settings-nav-link${activeSection === 'private-access' ? ' active' : ''}`}
          aria-current={activeSection === 'private-access' ? 'page' : undefined}
          onClick={() => onSectionChange('private-access')}
        >
          {t('settings.privateAccess')}
        </button>
      )}
    </>
  )
}
