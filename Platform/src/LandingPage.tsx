import { useEffect, useState } from 'react'

const GYM_APP_URL = import.meta.env.VITE_GYM_PLATFORM_URL ?? 'https://gym-platform-cr.vercel.app/login'

const ROTATING_WORDS = ['Excel', 'WhatsApp', 'cuadernos', 'papel']

const PILLARS = [
  {
    title: 'Todo en un solo lugar',
    body: 'Ventas, inventario, clientes y operaciones conectados. Sin saltar entre apps ni duplicar datos.',
  },
  {
    title: 'Hecho para negocios reales',
    body: 'Para equipos pequeños que necesitan orden hoy, no un ERP que tarda meses en implementarse.',
  },
  {
    title: 'Menos manual, más control',
    body: 'Automatiza lo repetitivo para que te enfoques en atender clientes y hacer crecer tu negocio.',
  },
  {
    title: 'Crece con tu negocio',
    body: 'Empiezas con lo esencial y sumas módulos cuando lo necesitas. Platform evoluciona contigo.',
  },
]

const GYM_FEATURES = [
  'Inventario y punto de venta',
  'Membresías y pagos',
  'Actividades y reservaciones',
  'Rutinas y seguimiento',
  'Estadísticas en tiempo real',
  'Portal para tus miembros',
]

export default function LandingPage() {
  const [wordIndex, setWordIndex] = useState(0)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setWordIndex((i) => (i + 1) % ROTATING_WORDS.length)
    }, 2800)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <div className="site">
      <header className="topbar">
        <a href="#" className="brand">Platform</a>
        <nav className="topbar-nav" aria-label="Principal">
          <a href="#mision">Misión</a>
          <a href="#productos">Productos</a>
          <a href="#pilares">Enfoque</a>
        </nav>
        <div className="topbar-actions">
          <a href={GYM_APP_URL} className="btn btn--ghost">Iniciar sesión</a>
          <a href="#productos" className="btn btn--solid">Conoce más</a>
        </div>
      </header>

      <main>
        <section className="hero" aria-labelledby="hero-title">
          <h1 id="hero-title" className="hero-title">
            ¿Listo para dejar de administrar con{' '}
            <span className="hero-rotate" aria-live="polite">{ROTATING_WORDS[wordIndex]}</span>?
          </h1>
          <p className="hero-sub">
            Platform ayuda a pequeños negocios a centralizar procesos manuales en un sistema
            claro — para que administres, vendas y crezcas sin el caos del día a día.
          </p>

          <div className="hero-prompt" role="group" aria-label="Acciones principales">
            <a href="#productos" className="hero-prompt-main">
              <span>Ver GymPlatform — nuestro primer producto</span>
              <ArrowIcon />
            </a>
          </div>

          <p className="hero-footnote">
            Soluciones digitales para negocios que aún lo hacen a mano.
          </p>
          <p className="hero-founder">Johan Blanco · CEO de Platform</p>
        </section>

        <div className="marquee" aria-hidden>
          <div className="marquee-track">
            {[0, 1].map((copy) => (
              <span key={copy} className="marquee-text">
                DIGITALIZA TU NEGOCIO · ADMINISTRA CON CLARIDAD · DEJA EL PAPEL ATRÁS ·
              </span>
            ))}
          </div>
        </div>

        <section id="mision" className="section section--narrow">
          <p className="eyebrow">Lo que hacemos</p>
          <h2 className="section-title">Tecnología accesible para quienes aún lo hacen manual</h2>
          <p className="section-body">
            Platform nace como emprendimiento con una misión clara: que los pequeños negocios
            dejen atrás hojas de cálculo, chats interminables y procesos en la memoria — y
            pasen a un sistema donde todo convive y se administra desde un solo lugar.
          </p>
        </section>

        <section className="cards-row">
          <article className="card card--muted">
            <p className="eyebrow">El problema</p>
            <h3>Procesos manuales que frenan tu crecimiento</h3>
            <ul>
              <li>Inventario en cuadernos o archivos sueltos</li>
              <li>Ventas sin registro claro ni reportes</li>
              <li>Clientes repartidos entre WhatsApp y Excel</li>
              <li>Horas perdidas buscando información</li>
            </ul>
          </article>
          <article className="card">
            <p className="eyebrow">La solución</p>
            <h3>Un sistema que administra todo por ti</h3>
            <p>
              Un solo panel para operar tu negocio: productos, ventas, clientes y operaciones
              diarias conectados. Menos errores, más visibilidad y decisiones con datos reales.
            </p>
          </article>
        </section>

        <section id="productos" className="product">
          <div className="product-copy">
            <p className="eyebrow">Primer producto</p>
            <h2 className="section-title">GymPlatform</h2>
            <p className="section-body">
              Sistema completo para administración de gimnasios: productos, ventas, membresías,
              actividades y más — pensado para equipos que hoy lo resuelven a mano.
            </p>
            <ul className="feature-list">
              {GYM_FEATURES.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
            <div className="actions">
              <a href={GYM_APP_URL} className="btn btn--solid btn--lg">Acceder a GymPlatform</a>
              <a href="#pilares" className="btn btn--ghost btn--lg">Conoce más</a>
            </div>
          </div>

          <div className="product-visual" aria-hidden>
            <div className="window">
              <div className="window-bar">
                <span /><span /><span />
              </div>
              <div className="window-body">
                <aside className="window-sidebar" />
                <div className="window-main">
                  <div className="window-block window-block--lg" />
                  <div className="window-block" />
                  <div className="window-block" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="pilares" className="section">
          <p className="eyebrow">Nuestro enfoque</p>
          <h2 className="section-title">Cuatro pilares con los que trabajamos</h2>
          <div className="pillar-grid">
            {PILLARS.map((pillar) => (
              <article key={pillar.title} className="pillar">
                <h3>{pillar.title}</h3>
                <p>{pillar.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="cta">
          <h2 className="section-title">Tu negocio merece dejar el papel atrás</h2>
          <p className="section-body">
            GymPlatform es el primer paso. Centraliza tu operación, gana claridad y dedica más
            tiempo a lo que realmente importa: tus clientes.
          </p>
          <a href={GYM_APP_URL} className="btn btn--solid btn--lg">Quiero probar GymPlatform</a>
        </section>
        <section className="founder" aria-label="Fundador">
          <p className="founder-name">Johan Blanco</p>
          <p className="founder-role">CEO de Platform</p>
        </section>
      </main>

      <footer className="footer">
        <span className="brand">Platform</span>
        <p>Soluciones digitales para pequeños negocios.</p>
        <p className="footer-founder">Johan Blanco · CEO de Platform</p>
        <p className="footer-meta">© {new Date().getFullYear()} Platform</p>
      </footer>
    </div>
  )
}

function ArrowIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 12h14M13 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
