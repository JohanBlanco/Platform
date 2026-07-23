import {
  GYM_APP_NAME,
  GYM_APP_VERSION,
  PLATFORM_NAME,
  PLATFORM_OFFICIAL_URL,
} from '../../constants/platform'
import { usePreferences } from '../../preferences'

export default function PlatformAboutSection() {
  const { t } = usePreferences()

  return (
    <div className="card platform-about-card">
      <div className="platform-about-brand">
        <span className="platform-about-app">{GYM_APP_NAME}</span>
        <span className="platform-about-version">v{GYM_APP_VERSION}</span>
      </div>

      <p className="platform-about-lead">{t('settings.aboutPlatformLead')}</p>

      <dl className="platform-about-meta">
        <div>
          <dt>{t('settings.aboutPlatformProduct')}</dt>
          <dd>{PLATFORM_NAME}</dd>
        </div>
        <div>
          <dt>{t('settings.aboutPlatformSite')}</dt>
          <dd>
            <a
              href={PLATFORM_OFFICIAL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="platform-about-link"
            >
              platform-cr.vercel.app
            </a>
          </dd>
        </div>
      </dl>

      <a
        href={PLATFORM_OFFICIAL_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-secondary platform-about-cta"
      >
        {t('settings.aboutPlatformVisit')}
      </a>
    </div>
  )
}
