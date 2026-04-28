import { useI18n } from "@/i18n/I18nProvider";
import { useSeo } from "@/seo/seo";
import { LegalShell, type LegalSection } from "@/components/legal/LegalShell";

export default function Disclaimer() {
  const { lang } = useI18n();
  const isEs = lang === "es";

  useSeo(
    {
      title: isEs ? "Aviso Legal y Descargo de Responsabilidad" : "Legal Disclaimer",
      description: isEs
        ? "Descargo de responsabilidad de MatchVenezuelan: naturaleza del servicio, ausencia de garantías de resultados, verificación, contenido de terceros y limitaciones de responsabilidad."
        : "MatchVenezuelan legal disclaimer: nature of the service, no guarantee of outcomes, verification, third-party content and limitations of liability.",
      path: isEs ? "/es/legal/disclaimer" : "/legal/disclaimer",
      lang,
      robots: "index,follow",
      alternates: [
        { hreflang: "en", href: "https://matchvenezuelan.com/legal/disclaimer" },
        { hreflang: "es", href: "https://matchvenezuelan.com/es/legal/disclaimer" },
        { hreflang: "x-default", href: "https://matchvenezuelan.com/legal/disclaimer" },
      ],
    },
    [lang],
  );

  const intro = isEs
    ? "Este Aviso Legal aclara qué es y qué no es MatchVenezuelan, los límites de la información publicada en el sitio y las responsabilidades de cada parte. Forma parte de — y debe leerse junto con — nuestros Términos de Servicio, la Política de Privacidad y la Política de Uso Aceptable. Al usar el servicio aceptas los términos descritos a continuación."
    : "This Legal Disclaimer clarifies what MatchVenezuelan is and is not, the limits of information published on the site, and each party's responsibilities. It forms part of — and should be read together with — our Terms of Service, Privacy Policy and Acceptable Use Policy. By using the service you accept the terms described below.";

  const sections: LegalSection[] = isEs
    ? [
        { heading: "1. Naturaleza del servicio",
          summary: "Quiénes somos — y, sobre todo, quiénes no somos.",
          items: [
            "MatchVenezuelan es una plataforma de presentación entre adultos para fines de relación seria y matrimonio. No somos una agencia matrimonial, no somos un servicio de escort, no somos una agencia de viajes y no somos un servicio de 'novia por correo'. No organizamos, facilitamos ni promovemos encuentros pagados, prostitución, arreglos 'sugar' ni actividad sexual comercial.",
            "No actuamos como representantes, agentes ni intermediarios de ningún miembro. Las decisiones de a quién contactar, con quién hablar, con quién reunirse, viajar o casarse son siempre exclusivamente del miembro.",
          ],
          callout: { tone: "important", title: "En una frase",
            body: "Somos una plataforma de introducción para relaciones serias entre adultos. Tú decides; nosotros facilitamos." } },
        { heading: "2. Sin garantía de resultados",
          summary: "Lo que el servicio puede y no puede prometer.",
          items: [
            "No prometemos ni garantizamos que vayas a encontrar pareja, matrimonio, amistad, citas ni cualquier otro resultado al usar el servicio. Las funciones de búsqueda, recomendación y mensajería son herramientas que facilitan la posibilidad de conexión, pero el resultado depende de muchos factores fuera de nuestro control.",
            "Cualquier referencia a 'historias de éxito', testimonios o estadísticas refleja experiencias individuales y no constituye una promesa, garantía ni proyección aplicable a tu caso.",
          ] },
        { heading: "3. Verificación e identidad de los miembros",
          summary: "Qué significa una insignia verificada — y qué no significa.",
          items: [
            "Ofrecemos verificación de foto, verificación de ID, verificación social y verificación 'concierge' como capas adicionales de confianza. Una insignia verificada significa que un miembro ha completado satisfactoriamente uno o más de esos controles en el momento de la verificación; no constituye una garantía absoluta de identidad, intenciones, situación civil, situación financiera, antecedentes penales o estado de salud actual.",
            "No realizamos verificaciones de antecedentes penales, ni controles de prevención del lavado de dinero sobre cada miembro, ni evaluaciones psicológicas. Cuando contemos con señales fiables que indiquen riesgo, podemos suspender, restringir o cerrar cuentas conforme a nuestras políticas.",
            "Eres siempre responsable de evaluar a otros miembros con sentido común, hacer videollamadas antes de conocerse en persona, verificar fotos por tu cuenta y seguir las recomendaciones de nuestra página de Seguridad.",
          ],
          callout: { tone: "warning", title: "Importante",
            body: "Una insignia verificada eleva la confianza, pero no sustituye tu propio criterio. Videollamada antes de viajar, siempre." } },
        { heading: "4. Contenido publicado por miembros",
          summary: "Quién responde por lo que se publica en perfiles y mensajes.",
          items: [
            "Los perfiles, fotos, biografías, mensajes, regalos y cualquier otro contenido enviado por miembros ('Contenido del Miembro') son responsabilidad exclusiva de quien los publica. Aplicamos moderación previa y reactiva, pero no podemos revisar, validar ni garantizar la exactitud, veracidad, legalidad o seguridad de todo el Contenido del Miembro.",
            "No aprobamos ni respaldamos el Contenido del Miembro y no asumimos responsabilidad por declaraciones, promesas, ofertas, opiniones políticas, religiosas o personales hechas por miembros entre ellos.",
          ] },
        { heading: "5. Información general no es asesoramiento profesional",
          summary: "Nuestros artículos informan; no sustituyen a un profesional.",
          items: [
            "El contenido publicado por nosotros — guías de seguridad, artículos del blog, recursos sobre cultura venezolana, viajes, inmigración, finanzas, fiscalidad, salud, derecho de familia o cualquier tema similar — se ofrece únicamente con fines informativos generales y no constituye asesoramiento legal, migratorio, financiero, fiscal, psicológico, médico ni profesional de ningún tipo.",
            "Antes de tomar decisiones importantes (visados, traslados internacionales, transferencias de dinero, matrimonio, contratos prenupciales, salud sexual y reproductiva, etc.), consulta con un profesional cualificado en tu jurisdicción.",
          ],
          callout: { tone: "info",
            body: "Para decisiones legales, migratorias, financieras o médicas, consulta siempre a un profesional cualificado en tu país." } },
        { heading: "6. Enlaces y servicios de terceros",
          summary: "Lo que ocurre cuando sales de MatchVenezuelan.",
          items: [
            "El sitio puede contener enlaces o integraciones con servicios de terceros (procesadores de pago, proveedores de verificación, servicios de mapas, traducción, soporte, etc.). No controlamos esos servicios y no somos responsables de su contenido, prácticas, disponibilidad ni políticas.",
            "Tu uso de servicios de terceros se rige por sus propios términos y políticas de privacidad. Te recomendamos revisarlos antes de usarlos.",
          ] },
        { heading: "7. Disponibilidad del servicio",
          summary: "Procuramos disponibilidad 24/7, pero no la garantizamos.",
          items: [
            "Nos esforzamos por mantener el servicio disponible 24/7, pero no garantizamos disponibilidad ininterrumpida, libre de errores o sin demoras. El servicio puede interrumpirse para mantenimiento, actualizaciones, motivos de seguridad o por causas fuera de nuestro control (fuerza mayor, fallo de proveedores, eventos de red).",
            "Podemos modificar, suspender o discontinuar funciones del servicio en cualquier momento, con aviso razonable cuando sea posible.",
          ] },
        { heading: "8. Restricciones geográficas y legales",
          summary: "Dónde se puede — y dónde no se puede — usar el servicio.",
          items: [
            "El servicio está dirigido a personas adultas en jurisdicciones donde su uso es legal. Si las leyes locales prohíben o restringen el uso de plataformas internacionales de relaciones, no debes usar el servicio.",
            "No prestamos servicios a personas o entidades incluidas en listas de sanciones aplicables (UE, Reino Unido, EE. UU., ONU u otras), ni en jurisdicciones sujetas a sanciones integrales.",
          ] },
        { heading: "9. Limitación de responsabilidad",
          summary: "Hasta dónde llega nuestra responsabilidad económica.",
          items: [
            "En la máxima medida permitida por la ley aplicable, MatchVenezuelan, sus afiliados, directores, empleados y proveedores no serán responsables de daños indirectos, incidentales, especiales, consecuentes o punitivos, incluyendo pérdida de ganancias, datos, oportunidades, reputación o sufrimiento emocional, derivados de o relacionados con tu uso del servicio o con interacciones con otros miembros.",
            "Nuestra responsabilidad total agregada hacia ti por cualquier reclamación se limita a la cantidad mayor entre (a) lo que hayas pagado a MatchVenezuelan en los 12 meses anteriores al hecho que dio origen a la reclamación o (b) USD 100, salvo que la ley imperativa de tu país disponga otra cosa.",
          ],
          callout: { tone: "legal", title: "Derechos del consumidor",
            body: "Cuando la ley imperativa de tu país (por ejemplo, derechos del consumidor en la UE/Reino Unido) te otorgue protecciones más amplias, prevalecerán esas protecciones." } },
        { heading: "10. Indemnización",
          summary: "Cuándo respondes tú por reclamaciones de terceros.",
          items: [
            "Aceptas indemnizar y mantener indemnes a MatchVenezuelan y sus afiliados frente a cualquier reclamación, demanda, daño, pérdida o gasto (incluidos honorarios razonables de abogados) derivados del Contenido del Miembro que publiques, de tu uso del servicio, de tu incumplimiento de los Términos o políticas, o de la violación de derechos de terceros.",
          ] },
        { heading: "11. Cambios a este Aviso",
          summary: "Cómo y cuándo te avisamos de cambios materiales.",
          items: [
            "Podemos actualizar este Aviso Legal. La versión vigente es la publicada en esta página con la fecha de actualización indicada. Cuando los cambios sean materiales, lo anunciaremos de forma destacada y, cuando proceda, te lo notificaremos.",
          ] },
        { heading: "12. Cómo contactarnos",
          summary: "Direcciones de contacto según el tipo de consulta.",
          items: [
            "Para preguntas legales: legal@matchvenezuelan.com. Para temas de privacidad: privacy@matchvenezuelan.com. Para Confianza y Seguridad: trust@matchvenezuelan.com.",
          ] },
      ]
    : [
        { heading: "1. Nature of the service",
          summary: "Who we are — and, more importantly, who we are not.",
          items: [
            "MatchVenezuelan is an introduction platform for adults pursuing serious relationships and marriage. We are not a matchmaking agency, an escort service, a travel agency or a 'mail-order bride' service. We do not arrange, facilitate or promote paid encounters, prostitution, 'sugar' arrangements or commercial sexual activity.",
            "We do not act as the agent, representative or intermediary of any member. Decisions about whom to contact, talk to, meet, travel to see, or marry are always exclusively the member's own.",
          ],
          callout: { tone: "important", title: "In one line",
            body: "We are an introduction platform for serious relationships between adults. You decide; we facilitate." } },
        { heading: "2. No guarantee of outcome",
          summary: "What the service can and cannot promise.",
          items: [
            "We do not promise or guarantee that you will find a partner, marriage, friendship, dates or any other outcome from using the service. Search, recommendation and messaging features are tools that increase the chance of connection, but the result depends on many factors outside our control.",
            "Any reference to 'success stories', testimonials or statistics reflects individual experiences and is not a promise, warranty or projection that applies to your case.",
          ] },
        { heading: "3. Member verification and identity",
          summary: "What a verified badge means — and what it does not.",
          items: [
            "We offer photo verification, ID verification, social verification and concierge verification as additional layers of trust. A 'verified' badge means that a member successfully completed one or more of those checks at the moment of verification; it is not an absolute guarantee of identity, intentions, marital status, financial condition, criminal history or current health status.",
            "We do not run criminal background checks, full anti-money-laundering screening or psychological evaluations on every member. When we have reliable signals indicating risk, we may suspend, restrict or close accounts in line with our policies.",
            "You are always responsible for assessing other members with common sense, video-calling before meeting in person, reverse-image-searching photos yourself and following the recommendations on our Safety page.",
          ],
          callout: { tone: "warning", title: "Important",
            body: "A verified badge raises trust but does not replace your own judgment. Always video-call before traveling." } },
        { heading: "4. Member-submitted content",
          summary: "Who is responsible for what gets posted in profiles and chats.",
          items: [
            "Profiles, photos, bios, messages, gifts and any other content submitted by members ('Member Content') are the sole responsibility of the person who posts them. We apply both pre-publication and reactive moderation, but we cannot review, validate or guarantee the accuracy, truthfulness, legality or safety of all Member Content.",
            "We do not endorse Member Content and we accept no responsibility for statements, promises, offers, political, religious or personal opinions made by members to one another.",
          ] },
        { heading: "5. General information is not professional advice",
          summary: "Our articles inform; they do not replace a qualified professional.",
          items: [
            "Content we publish — safety guides, blog articles, resources about Venezuelan culture, travel, immigration, finance, taxation, health, family law or any similar topic — is provided for general informational purposes only and does not constitute legal, immigration, financial, tax, psychological, medical or any other professional advice.",
            "Before making important decisions (visas, international relocation, money transfers, marriage, prenuptial agreements, sexual and reproductive health, etc.), consult a qualified professional in your jurisdiction.",
          ],
          callout: { tone: "info",
            body: "For legal, immigration, financial or medical decisions, always consult a qualified professional in your own country." } },
        { heading: "6. Third-party links and services",
          summary: "What happens when you leave MatchVenezuelan.",
          items: [
            "The site may contain links to or integrations with third-party services (payment processors, verification vendors, mapping, translation, support tools, etc.). We do not control those services and are not responsible for their content, practices, availability or policies.",
            "Your use of third-party services is governed by their own terms and privacy notices. We recommend you review them before using them.",
          ] },
        { heading: "7. Service availability",
          summary: "We aim for 24/7 availability — but we cannot guarantee it.",
          items: [
            "We strive to keep the service available 24/7, but we do not guarantee uninterrupted, error-free or delay-free operation. The service may be interrupted for maintenance, updates, security reasons or causes outside our control (force majeure, vendor failure, network events).",
            "We may modify, suspend or discontinue features of the service at any time, with reasonable notice when feasible.",
          ] },
        { heading: "8. Geographic and legal restrictions",
          summary: "Where the service can — and cannot — be used.",
          items: [
            "The service is intended for adults in jurisdictions where its use is lawful. If local laws prohibit or restrict the use of international relationship platforms, you must not use the service.",
            "We do not provide services to persons or entities listed on applicable sanctions lists (EU, UK, US, UN or others) or in jurisdictions subject to comprehensive sanctions.",
          ] },
        { heading: "9. Limitation of liability",
          summary: "How far our financial responsibility extends.",
          items: [
            "To the maximum extent permitted by applicable law, MatchVenezuelan, its affiliates, directors, employees and vendors will not be liable for indirect, incidental, special, consequential or punitive damages, including loss of profits, data, opportunity, reputation or emotional distress, arising out of or related to your use of the service or interactions with other members.",
            "Our total aggregate liability to you for any claim is limited to the greater of (a) the amount you paid to MatchVenezuelan in the 12 months preceding the event giving rise to the claim, or (b) USD 100, except where mandatory law in your country provides otherwise.",
          ],
          callout: { tone: "legal", title: "Consumer rights",
            body: "Where mandatory law in your country (e.g. EU/UK consumer law) gives you broader protections, those protections prevail." } },
        { heading: "10. Indemnification",
          summary: "When you are the one responsible for third-party claims.",
          items: [
            "You agree to indemnify and hold harmless MatchVenezuelan and its affiliates against any claim, demand, damage, loss or expense (including reasonable legal fees) arising out of Member Content you post, your use of the service, your breach of the Terms or policies, or your violation of third-party rights.",
          ] },
        { heading: "11. Changes to this Disclaimer",
          summary: "How and when we notify you of material changes.",
          items: [
            "We may update this Legal Disclaimer. The version in force is the one published on this page with the indicated update date. When changes are material, we will announce them prominently and, where appropriate, notify you.",
          ] },
        { heading: "12. How to contact us",
          summary: "Email addresses for each type of question.",
          items: [
            "For legal questions: legal@matchvenezuelan.com. For privacy: privacy@matchvenezuelan.com. For Trust & Safety: trust@matchvenezuelan.com.",
          ] },
      ];

  return (
    <LegalShell
      title={isEs ? "Aviso Legal y Descargo de Responsabilidad" : "Legal Disclaimer"}
      effective="2026-01-01"
      lastUpdated="2026-04"
      intro={intro}
      sections={sections}
    />
  );
}
