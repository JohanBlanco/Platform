import BroadcastMessagesSection from '../pages/configuracion/BroadcastMessagesSection'
import CashSettingsSection from '../pages/configuracion/CashSettingsSection'
import FormsHub from '../pages/configuracion/FormsHub'
import ForumsSection from '../pages/configuracion/ForumsSection'
import GymProfileSection from '../pages/configuracion/GymProfileSection'
import PrivateAccessSection from '../pages/configuracion/PrivateAccessSection'
import {
  LANGUAGE_OPTIONS,
  usePreferences,
  type SettingsSection,
} from '../preferences'

type Props = {
  section: SettingsSection
}

export default function SettingsPanel({ section }: Props) {
  const { theme, language, setTheme, setLanguage, t } = usePreferences()

  if (section === 'gym-profile') {
    return (
      <div className="settings-panel">
        <div className="page-header">
          <h1>{t('settings.gymProfile')}</h1>
          <p>{t('settings.gymProfileDescription')}</p>
        </div>
        <GymProfileSection />
      </div>
    )
  }

  if (section === 'whatsapp-wame') {
    return (
      <div className="settings-panel">
        <div className="page-header">
          <h1>{t('settings.broadcastWhatsapp')}</h1>
          <p>{t('settings.broadcastWhatsappDescription')}</p>
        </div>
        <BroadcastMessagesSection fixedChannel="WHATSAPP" variant="wame" />
      </div>
    )
  }

  if (section === 'whatsapp-cloud') {
    return (
      <div className="settings-panel">
        <div className="page-header">
          <h1>{t('settings.whatsappCloud')}</h1>
          <p>{t('settings.whatsappCloudDescription')}</p>
        </div>
        <BroadcastMessagesSection fixedChannel="WHATSAPP" variant="cloud" />
      </div>
    )
  }

  if (section === 'broadcast-messages') {
    return (
      <div className="settings-panel">
        <div className="page-header">
          <h1>{t('settings.broadcastMessages')}</h1>
          <p>{t('settings.broadcastMessagesDescription')}</p>
        </div>
        <BroadcastMessagesSection fixedChannel="WHATSAPP" variant="templates" />
      </div>
    )
  }

  if (section === 'forms') {
    return (
      <div className="settings-panel">
        <div className="page-header">
          <h1>{t('settings.forms')}</h1>
          <p>{t('settings.formsDescription')}</p>
        </div>
        <FormsHub />
      </div>
    )
  }

  if (section === 'forums') {
    return (
      <div className="settings-panel">
        <div className="page-header">
          <h1>{t('settings.forums')}</h1>
          <p>{t('settings.forumsDescription')}</p>
        </div>
        <ForumsSection />
      </div>
    )
  }

  if (section === 'cash') {
    return (
      <div className="settings-panel">
        <div className="page-header">
          <h1>Caja</h1>
          <p>Fondo de apertura, monedas y billetes para el conteo diario.</p>
        </div>
        <CashSettingsSection />
      </div>
    )
  }

  if (section === 'private-access') {
    return (
      <div className="settings-panel">
        <div className="page-header">
          <h1>{t('settings.privateAccess')}</h1>
          <p>{t('settings.privateAccessDescription')}</p>
        </div>
        <PrivateAccessSection />
      </div>
    )
  }

  const title = section === 'theme' ? t('settings.theme') : t('settings.language')
  const description = section === 'theme' ? t('settings.themeDescription') : t('settings.languageDescription')

  return (
    <div className="settings-panel">
      <div className="page-header">
        <h1>{title}</h1>
        <p>{description}</p>
      </div>

      {section === 'theme' && (
        <div className="settings-panel-options" role="radiogroup" aria-label={title}>
          <button
            type="button"
            role="radio"
            aria-checked={theme === 'dark'}
            className={`settings-panel-option${theme === 'dark' ? ' active' : ''}`}
            onClick={() => setTheme('dark')}
          >
            <span className="settings-panel-option-preview settings-panel-option-preview--dark" aria-hidden="true" />
            <span className="settings-panel-option-label">{t('settings.themeDark')}</span>
            {theme === 'dark' && <span className="settings-panel-option-check">✓</span>}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={theme === 'light'}
            className={`settings-panel-option${theme === 'light' ? ' active' : ''}`}
            onClick={() => setTheme('light')}
          >
            <span className="settings-panel-option-preview settings-panel-option-preview--light" aria-hidden="true" />
            <span className="settings-panel-option-label">{t('settings.themeLight')}</span>
            {theme === 'light' && <span className="settings-panel-option-check">✓</span>}
          </button>
        </div>
      )}

      {section === 'language' && (
        <div className="settings-panel-options" role="radiogroup" aria-label={title}>
          {LANGUAGE_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={language === option.id}
              className={`settings-panel-option${language === option.id ? ' active' : ''}`}
              onClick={() => setLanguage(option.id)}
            >
              <span className="settings-panel-option-label settings-panel-option-label--large">{option.label}</span>
              {language === option.id && <span className="settings-panel-option-check">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
