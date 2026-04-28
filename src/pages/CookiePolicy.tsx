import { PublicLayout } from "@/components/layout/PublicLayout";
import { useI18n } from "@/i18n/I18nProvider";
import { useSeo } from "@/seo/seo";
import { Link } from "react-router-dom";
import heroImg from "@/assets/hero-legal.jpg";
import { ParallaxHeroImage } from "@/components/layout/ParallaxHeroImage";

type Section = { heading: string; items: string[] };

export default function CookiePolicy() {
  const { t, lang } = useI18n();

  useSeo(
    {
      title: t.legal.cookies,
      description:
        lang === "es"
          ? "Cómo MatchVenezuelan usa cookies, almacenamiento local e identificadores similares: categorías, finalidades, bases legales, terceros, retención y cómo retirar tu consentimiento."
          : "How MatchVenezuelan uses cookies, local storage and similar identifiers: categories, purposes, legal bases, third parties, retention and how to withdraw consent.",
      path: lang === "es" ? "/es/legal/cookies" : "/legal/cookies",
      lang,
      robots: "index,follow",
      alternates: [
        { hreflang: "en", href: "https://matchvenezuelan.com/legal/cookies" },
        { hreflang: "es", href: "https://matchvenezuelan.com/es/legal/cookies" },
        { hreflang: "x-default", href: "https://matchvenezuelan.com/legal/cookies" },
      ],
    },
    [lang],
  );

  const intro =
    lang === "es"
      ? "Esta Política de Cookies explica cómo MatchVenezuelan ('nosotros') usamos cookies, almacenamiento local del navegador, identificadores de dispositivo móvil, etiquetas de píxel y tecnologías similares ('cookies' en su conjunto) cuando visitas nuestro sitio web, abres nuestros correos o usas nuestra aplicación. Forma parte de — y debe leerse junto con — nuestra Política de Privacidad y nuestros Términos de Servicio. Puedes ajustar o retirar tu consentimiento en cualquier momento desde Preferencias de Consentimiento."
      : "This Cookie Policy explains how MatchVenezuelan ('we', 'us', 'our') uses cookies, browser local storage, mobile device identifiers, pixel tags and similar technologies (collectively, 'cookies') when you visit our website, open our emails or use our app. It forms part of, and should be read together with, our Privacy Policy and our Terms of Service. You can adjust or withdraw your consent at any time from Consent Settings.";

  const sections: Section[] = lang === "es"
    ? [
        { heading: "1. Qué son las cookies y tecnologías similares", items: [
          "Una cookie es un pequeño archivo de texto que un sitio web guarda en tu dispositivo cuando lo visitas. El almacenamiento local (localStorage, sessionStorage, IndexedDB) es un mecanismo similar que permite a una aplicación web guardar datos en tu navegador. Los píxeles o web beacons son imágenes diminutas incrustadas en correos o páginas que registran cuándo se cargan. En aplicaciones móviles también se utilizan identificadores publicitarios (IDFA en iOS, AAID en Android), identificadores de instalación y cachés del SDK.",
          "Tratamos todas estas tecnologías bajo el término común de 'cookies'. Las normas legales que se les aplican incluyen el artículo 5(3) de la Directiva ePrivacy de la UE/Reino Unido, el RGPD, la LFPDPPP de México, la LGPD de Brasil, la CCPA/CPRA de California y otras leyes locales equivalentes.",
          "Algunas cookies son nuestras (cookies de origen o 'first-party'); otras son colocadas por proveedores que actúan en nuestro nombre o de forma independiente (cookies de terceros). Identificamos a continuación todos los terceros que pueden colocar cookies a través del servicio.",
        ]},
        { heading: "2. Categorías de cookies que usamos", items: [
          "Estrictamente necesarias: imprescindibles para que el sitio funcione y no pueden desactivarse. Incluyen el token de sesión de autenticación, la preservación de tu estado de inicio de sesión, la protección CSRF, el balanceo de carga, la mitigación de fraude y abuso (rate limiting, detección de bots), el respeto de tus elecciones de consentimiento y la protección frente a pagos fraudulentos. Base legal: interés legítimo y/o ejecución del contrato; no requieren consentimiento bajo el art. 5(3) ePrivacy.",
          "Funcionales / preferencias: recuerdan elecciones que mejoran tu experiencia, como el idioma (EN/ES), la zona horaria, el modo claro/oscuro, los filtros de búsqueda guardados, la última pestaña vista o si ya cerraste un banner. Base legal: consentimiento o interés legítimo, según jurisdicción.",
          "Analíticas y de medición: nos ayudan a entender, de forma agregada y seudonimizada, qué páginas se visitan, qué funciones se usan, cuántos errores ocurren, cuánto tarda en cargar el sitio y qué dispositivos usan los miembros, para mejorar el producto y la fiabilidad. Base legal: consentimiento (donde la ley lo exige, p. ej. UE/Reino Unido) o interés legítimo (en otras jurisdicciones).",
          "Seguridad y antifraude: detectan accesos sospechosos, intentos de adquisición de cuenta, cargos fraudulentos, scrapers, bots y patrones de evasión de baneo. Estas cookies pueden combinarse con huellas de dispositivo limitadas. Base legal: interés legítimo en proteger a la comunidad y obligación legal de prevención del fraude.",
          "Marketing y atribución: solo se activan con tu consentimiento explícito y solo si decidimos lanzar campañas pagadas. Pueden registrar cómo llegaste al sitio (referrer, parámetros UTM), si respondiste a una campaña concreta y métricas agregadas para nuestros canales. No vendemos tus datos personales y no permitimos publicidad conductual entre contextos.",
          "Encuestas y soporte: cuando contactas con soporte o respondes a una encuesta voluntaria, puede usarse una cookie temporal para mantener el hilo de la conversación o para no volver a mostrarte la misma encuesta.",
        ]},
        { heading: "3. Finalidades por las que usamos cookies", items: [
          "Autenticarte de forma segura y mantener tu sesión activa entre páginas y pestañas.",
          "Aplicar tus elecciones de consentimiento y preferencias (idioma, moneda, accesibilidad).",
          "Detectar y prevenir actividad sospechosa: adquisición de cuentas, fraude de pagos, suplantación de identidad, evasión de baneo, scraping y automatización.",
          "Cumplir obligaciones de moderación, verificación y de Confianza & Seguridad: por ejemplo, asociar un evento de moderación al miembro correcto.",
          "Procesar pagos y prevenir contracargos abusivos a través de nuestros procesadores de pago.",
          "Medir, de forma agregada, el rendimiento del sitio, los errores y la adopción de funciones para mejorar el producto.",
          "Recordar elecciones de interfaz y reducir la fricción (no volver a mostrar avisos ya vistos, recordar el idioma).",
          "Solo con tu consentimiento explícito: medir la efectividad de campañas de marketing si las lanzamos.",
        ]},
        { heading: "4. Bases legales y consentimiento", items: [
          "En la UE, el Reino Unido y jurisdicciones equivalentes, las cookies que no son estrictamente necesarias requieren tu consentimiento previo, libre, específico, informado e inequívoco, conforme al art. 5(3) ePrivacy y al RGPD/UK GDPR. Solicitamos ese consentimiento mediante un banner antes de activar cookies analíticas, de marketing o de medición.",
          "En jurisdicciones que aplican un modelo de 'opt-out' (p. ej. CCPA/CPRA en California, LGPD en Brasil bajo ciertas hipótesis), tienes derecho a oponerte al uso de cookies no esenciales y a la 'venta' o 'compartición' de información personal. No vendemos información personal y no compartimos para publicidad conductual entre contextos.",
          "Las cookies estrictamente necesarias se basan en nuestro interés legítimo en operar un servicio seguro y/o en la ejecución del contrato contigo, y por su naturaleza no pueden desactivarse sin que el servicio deje de funcionar.",
          "Tu consentimiento se almacena durante un máximo de 12 meses; tras ese plazo te pediremos que lo confirmes nuevamente. También puedes retirarlo en cualquier momento.",
        ]},
        { heading: "5. Terceros que pueden colocar cookies", items: [
          "Procesadores de pago (Stripe / Paddle u otro proveedor que indiquemos en el momento del pago): cookies estrictamente necesarias para autenticar la transacción, prevenir fraude y cumplir obligaciones de PCI-DSS y de blanqueo de capitales (AML).",
          "Proveedor de autenticación e identidad: cookies necesarias para iniciar sesión, mantener la sesión y, cuando corresponda, completar inicios de sesión federados (Google).",
          "Proveedor de verificación (cuando se ofrece verificación de ID, foto, fuente de fondos o ingresos): cookies temporales necesarias para la sesión de verificación.",
          "Proveedor de mensajería transaccional (correo y, en su caso, SMS): píxeles para confirmar la entrega y apertura de correos transaccionales relacionados con tu cuenta.",
          "Proveedor de soporte / chat de ayuda (cuando esté activo): cookies funcionales necesarias para mantener el hilo de la conversación contigo.",
          "Analítica de producto seudonimizada (solo con consentimiento donde la ley lo exija): cookies analíticas para medir uso, rendimiento y errores. No usamos identificadores publicitarios cruzados.",
          "Red de distribución de contenido y mitigación de DDoS: cookies estrictamente necesarias para enrutar el tráfico, defender la plataforma y conservar la integridad de la sesión.",
          "Cuando un tercero coloca una cookie a través del servicio, dicha cookie se rige también por su propia política de privacidad y de cookies. Mantenemos una lista actualizada de subencargados en nuestra Política de Privacidad y la facilitamos a las autoridades cuando es requerida.",
        ]},
        { heading: "6. Cookies específicas que utilizamos", items: [
          "sb-access-token / sb-refresh-token (origen, estrictamente necesarias): mantienen tu sesión autenticada. Duración: hasta el cierre de sesión o caducidad del refresh token.",
          "mv-consent (origen, estrictamente necesaria para registrar tu elección): almacena tus preferencias de consentimiento (versión de la política, categorías aceptadas, marca temporal). Duración: hasta 12 meses.",
          "mv-lang (origen, funcional): recuerda tu idioma preferido (EN/ES). Duración: hasta 12 meses.",
          "mv-theme (origen, funcional): recuerda tu modo claro u oscuro. Duración: hasta 12 meses.",
          "mv-csrf (origen, estrictamente necesaria): token anti-CSRF asociado a formularios sensibles. Duración: sesión.",
          "mv-rate (origen, estrictamente necesaria): control de frecuencia para prevenir abuso. Duración: ventana de minutos.",
          "mv-analytics-* (origen o seudonimizada, analítica, solo con consentimiento donde la ley lo exija): mide eventos de producto agregados. Duración: hasta 13 meses.",
          "Cookies del procesador de pagos: gestionadas por el procesador para autenticar la sesión de pago y prevenir fraude. Consulta su política de cookies para detalles.",
          "Esta lista puede actualizarse a medida que evoluciona el producto. Publicaremos cualquier cambio sustancial junto con una notificación.",
        ]},
        { heading: "7. Cómo gestionar y retirar tu consentimiento", items: [
          "Puedes ajustar tu consentimiento en cualquier momento abriendo Preferencias de Consentimiento desde el pie de página o desde tu cuenta.",
          "También puedes bloquear o eliminar cookies desde la configuración de tu navegador (Chrome, Safari, Firefox, Edge, Brave). Ten en cuenta que bloquear cookies estrictamente necesarias puede impedir que inicies sesión o que el servicio funcione correctamente.",
          "En dispositivos móviles puedes restablecer o limitar el seguimiento de identificadores publicitarios desde los ajustes de privacidad del sistema operativo.",
          "Respetamos las señales 'Global Privacy Control' (GPC) cuando se reciben de tu navegador, tratándolas como una solicitud válida de exclusión donde la ley lo prevé. La señal 'Do Not Track' (DNT) no tiene un estándar uniforme pero la consideramos como una expresión de preferencia.",
          "Retirar el consentimiento no afecta a la licitud del tratamiento previo basado en el consentimiento dado antes de la retirada.",
        ]},
        { heading: "8. Cookies en correos y notificaciones", items: [
          "Los correos transaccionales (verificación de cuenta, recibos, alertas de seguridad, restablecimiento de contraseña, notificaciones legales) pueden incluir píxeles para confirmar la entrega, el rebote y la apertura. Estos correos forman parte de la prestación del servicio y no requieren consentimiento adicional.",
          "Si en el futuro enviamos correos de marketing, lo haremos solo con tu consentimiento previo y siempre incluyendo un enlace para darte de baja. Los correos de marketing pueden incluir píxeles para medir aperturas y clics agregados.",
        ]},
        { heading: "9. Transferencias internacionales", items: [
          "Algunos de los proveedores que colocan cookies a través del servicio están establecidos fuera de tu país, principalmente en la UE, el Reino Unido o Estados Unidos. Cuando se realizan transferencias internacionales aplicamos las salvaguardias descritas en la Política de Privacidad (cláusulas contractuales tipo de la UE/Reino Unido, marcos de adecuación, evaluaciones de transferencia). No transferimos datos a destinatarios sancionados.",
        ]},
        { heading: "10. Retención y seguridad", items: [
          "Las cookies de sesión se eliminan al cerrar el navegador. Las cookies persistentes tienen el plazo indicado en cada caso (entre minutos y un máximo de 13 meses).",
          "Los datos generados por cookies analíticas se conservan en formato seudonimizado y se eliminan o se agregan totalmente tras el plazo aplicable.",
          "Aplicamos medidas técnicas y organizativas razonables para proteger la información asociada a cookies, incluyendo cifrado en tránsito (TLS), control de acceso, segmentación de red y revisión periódica de proveedores.",
        ]},
        { heading: "11. Niños", items: [
          "El servicio está dirigido a personas mayores de 18 años. No recopilamos cookies dirigidas conscientemente a menores. Si crees que un menor ha accedido al servicio, escríbenos a privacy@matchvenezuelan.com para que tomemos las medidas necesarias.",
        ]},
        { heading: "12. Cambios a esta Política de Cookies", items: [
          "Podemos actualizar esta política para reflejar cambios en el producto, en los proveedores o en la normativa aplicable. Indicaremos en la parte superior la fecha de última actualización y, cuando los cambios sean materiales, publicaremos un aviso destacado y, cuando proceda, te volveremos a pedir consentimiento.",
        ]},
        { heading: "13. Cómo contactarnos", items: [
          "Para preguntas sobre esta política o sobre el tratamiento de datos asociado a cookies, escríbenos a privacy@matchvenezuelan.com. Para ejercer derechos como acceso, rectificación, supresión, oposición o portabilidad, consulta el apartado correspondiente de la Política de Privacidad.",
        ]},
      ]
    : [
        { heading: "1. What cookies and similar technologies are", items: [
          "A cookie is a small text file that a website stores on your device when you visit. Browser local storage (localStorage, sessionStorage, IndexedDB) is a similar mechanism that lets a web app store data in your browser. Pixels (or web beacons) are tiny images embedded in emails or pages that record when they are loaded. On mobile we may also use advertising identifiers (IDFA on iOS, AAID on Android), install identifiers and SDK caches.",
          "We treat all of these technologies under the umbrella term 'cookies'. The legal frameworks that apply to them include Article 5(3) of the EU/UK ePrivacy Directive, the GDPR/UK GDPR, Mexico's LFPDPPP, Brazil's LGPD, California's CCPA/CPRA, and other comparable local laws.",
          "Some cookies are set by us (first-party); others are placed by vendors acting on our behalf or independently (third-party). We identify below every category of third party that may set cookies through the service.",
        ]},
        { heading: "2. Categories of cookies we use", items: [
          "Strictly necessary: required for the site to work and cannot be turned off. They include your authentication session token, login state, CSRF protection, load balancing, fraud and abuse mitigation (rate limiting, bot detection), enforcement of your consent choices, and payment-fraud protection. Legal basis: legitimate interest and/or contract performance; no consent required under Article 5(3) ePrivacy.",
          "Functional / preferences: remember choices that improve your experience, such as language (EN/ES), time zone, light/dark mode, saved search filters, the last tab you viewed, or whether you already dismissed a banner. Legal basis: consent or legitimate interest, depending on jurisdiction.",
          "Analytics and measurement: help us understand, in aggregate and pseudonymized form, which pages are visited, which features are used, how many errors occur, how fast pages load, and what devices members use, in order to improve the product and reliability. Legal basis: consent (where required by law, e.g. EU/UK) or legitimate interest (in other jurisdictions).",
          "Security and anti-fraud: detect suspicious logins, account takeover attempts, fraudulent charges, scrapers, bots and ban-evasion patterns. These cookies may be combined with limited device fingerprinting. Legal basis: legitimate interest in protecting the community and legal obligation to prevent fraud.",
          "Marketing and attribution: only set with your explicit consent and only if we decide to run paid campaigns. They may record how you arrived at the site (referrer, UTM parameters), whether you responded to a specific campaign, and aggregated metrics for our channels. We do not sell personal data and we do not allow cross-context behavioral advertising.",
          "Survey and support: when you contact support or answer a voluntary survey, a temporary cookie may be used to keep the conversation thread or to avoid showing you the same survey twice.",
        ]},
        { heading: "3. Purposes for which we use cookies", items: [
          "Authenticate you securely and keep your session alive across pages and tabs.",
          "Apply your consent choices and preferences (language, currency, accessibility).",
          "Detect and prevent suspicious activity: account takeover, payment fraud, identity impersonation, ban evasion, scraping and automation.",
          "Comply with moderation, verification and Trust & Safety obligations — for example, associating a moderation event with the correct member.",
          "Process payments and prevent abusive chargebacks through our payment processors.",
          "Measure site performance, errors and feature adoption in aggregate to improve the product.",
          "Remember UI choices and reduce friction (don't show banners you already dismissed, remember the language).",
          "Only with your explicit consent: measure the effectiveness of marketing campaigns if we run them.",
        ]},
        { heading: "4. Legal bases and consent", items: [
          "In the EU, UK and equivalent jurisdictions, cookies that are not strictly necessary require your prior, freely given, specific, informed and unambiguous consent under Article 5(3) ePrivacy and the GDPR/UK GDPR. We collect that consent through a banner before activating analytics, marketing or measurement cookies.",
          "In opt-out jurisdictions (e.g. California CCPA/CPRA, Brazil LGPD under certain conditions), you have the right to object to non-essential cookies and to the 'sale' or 'sharing' of personal information. We do not sell personal information and do not share it for cross-context behavioral advertising.",
          "Strictly necessary cookies rely on our legitimate interest in operating a secure service and/or contract performance with you, and by their nature cannot be disabled without breaking the service.",
          "Your consent is stored for up to 12 months; after that period we will ask you to confirm it again. You can also withdraw consent at any time.",
        ]},
        { heading: "5. Third parties that may set cookies", items: [
          "Payment processors (Stripe / Paddle, or any other provider we identify at checkout): strictly necessary cookies to authenticate the transaction, prevent fraud and meet PCI-DSS and anti-money-laundering (AML) obligations.",
          "Authentication and identity provider: necessary cookies to sign you in, keep your session, and where applicable complete federated logins (Google).",
          "Verification provider (when ID, photo, source-of-funds or income verification is offered): temporary cookies necessary for the verification session.",
          "Transactional messaging provider (email and, where applicable, SMS): pixels to confirm delivery and opening of transactional emails about your account.",
          "Help / live-chat provider (when active): functional cookies needed to keep the conversation thread with you.",
          "Pseudonymized product analytics (only with consent where required): analytics cookies to measure usage, performance and errors. We do not use cross-site advertising identifiers.",
          "Content delivery network and DDoS mitigation: strictly necessary cookies to route traffic, defend the platform and preserve session integrity.",
          "When a third party sets a cookie through the service, that cookie is also governed by the third party's own privacy and cookie policies. We keep an updated list of sub-processors in our Privacy Policy and provide it to authorities when required.",
        ]},
        { heading: "6. Specific cookies we use", items: [
          "sb-access-token / sb-refresh-token (first-party, strictly necessary): keep your authenticated session. Duration: until logout or refresh-token expiry.",
          "mv-consent (first-party, strictly necessary to record your choice): stores your consent preferences (policy version, accepted categories, timestamp). Duration: up to 12 months.",
          "mv-lang (first-party, functional): remembers your preferred language (EN/ES). Duration: up to 12 months.",
          "mv-theme (first-party, functional): remembers your light or dark mode. Duration: up to 12 months.",
          "mv-csrf (first-party, strictly necessary): anti-CSRF token tied to sensitive forms. Duration: session.",
          "mv-rate (first-party, strictly necessary): rate-limit counter to prevent abuse. Duration: minutes window.",
          "mv-analytics-* (first-party or pseudonymized, analytics, only with consent where required): measures aggregated product events. Duration: up to 13 months.",
          "Payment-processor cookies: managed by the processor to authenticate the payment session and prevent fraud. See its cookie policy for details.",
          "This list may evolve as the product evolves. We will publish material changes alongside a notice.",
        ]},
        { heading: "7. How to manage and withdraw your consent", items: [
          "You can adjust your consent at any time by opening Consent Settings from the footer or from your account.",
          "You can also block or delete cookies from your browser settings (Chrome, Safari, Firefox, Edge, Brave). Note that blocking strictly necessary cookies may prevent you from signing in or using the service.",
          "On mobile devices you can reset or limit advertising-identifier tracking from the system privacy settings.",
          "We honor 'Global Privacy Control' (GPC) signals when received from your browser, treating them as a valid opt-out request where applicable law provides for one. The 'Do Not Track' (DNT) signal does not have a uniform standard but we treat it as an expression of preference.",
          "Withdrawing consent does not affect the lawfulness of processing carried out before the withdrawal based on consent given prior to that point.",
        ]},
        { heading: "8. Cookies in emails and notifications", items: [
          "Transactional emails (account verification, receipts, security alerts, password reset, legal notices) may include pixels to confirm delivery, bounces and opens. These emails are part of providing the service and do not require additional consent.",
          "If we ever send marketing emails in the future, we will only do so with your prior consent and will always include an unsubscribe link. Marketing emails may include pixels to measure aggregated opens and clicks.",
        ]},
        { heading: "9. International transfers", items: [
          "Some vendors that set cookies through the service are established outside your country, primarily in the EU, the UK or the United States. When international transfers occur we apply the safeguards described in the Privacy Policy (EU/UK Standard Contractual Clauses, adequacy frameworks, transfer impact assessments). We do not transfer data to sanctioned recipients.",
        ]},
        { heading: "10. Retention and security", items: [
          "Session cookies are deleted when you close the browser. Persistent cookies have the duration listed for each (from minutes up to a maximum of 13 months).",
          "Data generated by analytics cookies is kept in pseudonymized form and is deleted or fully aggregated after the applicable period.",
          "We apply reasonable technical and organizational measures to protect cookie-related information, including encryption in transit (TLS), access control, network segmentation and periodic vendor review.",
        ]},
        { heading: "11. Children", items: [
          "The service is intended for people aged 18 and over. We do not knowingly collect cookies targeted to minors. If you believe a minor has accessed the service, contact us at privacy@matchvenezuelan.com so we can take the necessary steps.",
        ]},
        { heading: "12. Changes to this Cookie Policy", items: [
          "We may update this policy to reflect changes in the product, in our vendors or in applicable regulation. We will note the last-updated date at the top and, when changes are material, post a prominent notice and, where appropriate, ask you to renew your consent.",
        ]},
        { heading: "13. How to contact us", items: [
          "For questions about this policy or about the data processing associated with cookies, contact us at privacy@matchvenezuelan.com. To exercise rights such as access, rectification, deletion, objection or portability, see the relevant section of the Privacy Policy.",
        ]},
      ];

  return (
    <PublicLayout>
      <section className="relative isolate overflow-hidden">
        <ParallaxHeroImage src={heroImg} />
        <div className="absolute inset-0 bg-gradient-to-b from-burgundy/80 via-burgundy/65 to-background" />
        <div className="relative container py-section px-gutter">
          <div className="mx-auto max-w-3xl text-primary-foreground animate-fade-in">
            <p className="text-xs uppercase tracking-widest text-primary-foreground/80">
              {t.legal.effective}: 2026-01-01 · {t.legal.lastUpdated}: 2026-04
            </p>
            <h1 className="mt-2 font-display text-4xl font-semibold md:text-5xl text-balance drop-shadow-sm">
              {t.legal.cookies}
            </h1>
          </div>
        </div>
      </section>

      <section className="container py-section px-gutter">
        <div className="mx-auto max-w-3xl">
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">{intro}</p>

          <nav
            aria-label={lang === "es" ? "Índice" : "Table of contents"}
            className="mt-10 rounded-2xl border border-border bg-muted/30 p-5"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {lang === "es" ? "Contenido" : "Contents"}
            </p>
            <ol className="mt-3 space-y-1.5 text-sm">
              {sections.map((s, i) => (
                <li key={i}>
                  <a href={`#sec-${i}`} className="text-foreground/80 hover:text-primary hover:underline">
                    {s.heading}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="mt-12 space-y-10">
            {sections.map((s, i) => (
              <section key={i} id={`sec-${i}`} className="scroll-mt-24">
                <h2 className="font-display text-xl font-semibold text-burgundy md:text-2xl">{s.heading}</h2>
                <ul className="mt-4 space-y-2.5 text-base leading-relaxed text-muted-foreground">
                  {s.items.map((it, j) => (
                    <li key={j} className="flex gap-3">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                      <span>{it}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <div className="mt-12 flex flex-wrap gap-3 text-sm">
            <Link to="/legal/privacy" className="text-primary hover:underline">
              {lang === "es" ? "Política de Privacidad" : "Privacy Policy"}
            </Link>
            <span className="text-muted-foreground">·</span>
            <Link to="/legal/terms" className="text-primary hover:underline">
              {lang === "es" ? "Términos de Servicio" : "Terms of Service"}
            </Link>
            <span className="text-muted-foreground">·</span>
            <Link to="/consent" className="text-primary hover:underline">
              {lang === "es" ? "Preferencias de Consentimiento" : "Consent Settings"}
            </Link>
          </div>

          <p className="mt-12 border-t border-border pt-6 text-xs text-muted-foreground">
            {lang === "es"
              ? "¿Preguntas sobre cookies? Escríbenos a privacy@matchvenezuelan.com."
              : "Questions about cookies? Contact us at privacy@matchvenezuelan.com."}
          </p>
        </div>
      </section>
    </PublicLayout>
  );
}
