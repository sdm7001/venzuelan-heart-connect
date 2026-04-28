import { useI18n } from "@/i18n/I18nProvider";
import { useSeo } from "@/seo/seo";
import { LegalShell, type LegalSection } from "@/components/legal/LegalShell";

export default function CommunityGuidelines() {
  const { lang } = useI18n();
  const isEs = lang === "es";

  useSeo(
    {
      title: isEs ? "Normas de la Comunidad" : "Community Guidelines",
      description: isEs
        ? "Las Normas de la Comunidad de MatchVenezuelan: respeto, autenticidad, seguridad, intenciones serias y cero tolerancia frente al acoso, la explotación o la solicitación."
        : "MatchVenezuelan Community Guidelines: respect, authenticity, safety, serious intentions and zero tolerance for harassment, exploitation or solicitation.",
      path: isEs ? "/es/legal/community-guidelines" : "/legal/community-guidelines",
      lang,
      robots: "index,follow",
      alternates: [
        { hreflang: "en", href: "https://matchvenezuelan.com/legal/community-guidelines" },
        { hreflang: "es", href: "https://matchvenezuelan.com/es/legal/community-guidelines" },
        { hreflang: "x-default", href: "https://matchvenezuelan.com/legal/community-guidelines" },
      ],
    },
    [lang],
  );

  const intro = isEs
    ? "MatchVenezuelan existe para ayudar a mujeres venezolanas y a hombres de todo el mundo a construir relaciones serias y duraderas. Estas Normas de la Comunidad describen cómo nos tratamos en la plataforma. Son obligatorias para todos los miembros y se aplican junto con los Términos de Servicio, la Política de Uso Aceptable y la Política Anti-Solicitación. Cuando una conducta cruza una línea, intervenimos: avisamos, restringimos funciones, suspendemos cuentas y, en los casos más graves, las cerramos para siempre y reportamos a las autoridades."
    : "MatchVenezuelan exists to help Venezuelan women and men around the world build serious, lasting relationships. These Community Guidelines describe how we treat one another on the platform. They apply to every member and run alongside the Terms of Service, the Acceptable Use Policy and the Anti-Solicitation Policy. When behavior crosses a line we step in: we warn, restrict features, suspend accounts and — in the most serious cases — close them permanently and report to authorities.";

  const sections: LegalSection[] = isEs
    ? [
        { heading: "1. Sé tú mismo (autenticidad)",
          summary: "Una sola persona, real, detrás de cada perfil.",
          items: [
          "Usa tu nombre real (o una forma reconocible de él) y solo fotografías actuales tuyas. No uses caras generadas por IA, deepfakes, fotos de stock, fotos de otras personas o imágenes muy retocadas que tergiversen tu apariencia.",
          "Sé honesto sobre tu edad, ubicación, situación civil, hijos, profesión e intenciones. Mentir sobre datos básicos rompe la confianza y es motivo de suspensión.",
          "Una sola cuenta por persona. No crees cuentas duplicadas, no compartas tu cuenta con otras personas y no evadas baneos creando una nueva.",
        ]},
        { heading: "2. Trata a los demás con respeto",
          summary: "Tono cálido, sin acoso, sin discriminación.",
          items: [
          "Habla con cortesía. No insultes, humilles, amenaces, acoses ni intimides a otros miembros, ni siquiera 'en broma'.",
          "Cero tolerancia frente al racismo, sexismo, homofobia, transfobia, xenofobia, discriminación por discapacidad, edad, religión, nacionalidad o estatus migratorio.",
          "Acepta un 'no'. Si alguien no responde, te bloquea o te dice que no está interesado, no insistas y no crees una nueva cuenta para volver a contactarlo.",
        ]},
        { heading: "3. Intenciones serias, no entretenimiento",
          summary: "Esto no es Tinder ni un chat para 'pasar el rato'.",
          items: [
          "MatchVenezuelan no es un sitio de citas casuales, no es un sitio para sexo, no es para encuentros pagados y no es para 'pasar el rato'. Si tu intención no es una relación seria, no es la plataforma adecuada para ti.",
          "Sé claro desde el principio sobre lo que buscas. La transparencia ahorra tiempo y dolor a todos.",
        ]},
        { heading: "4. Cero tolerancia a la solicitación y al fraude",
          summary: "Nada de dinero a cambio de afecto, presencia o sexo.",
          callout: { tone: "warning", title: "Señal de alerta",
            body: "Si alguien te pide dinero, criptomonedas o tarjetas regalo: no envíes nada y reporta inmediatamente a trust@matchvenezuelan.com." },
          items: [
          "Está estrictamente prohibido pedir, ofrecer o transferir dinero, criptomonedas, tarjetas de regalo, mesadas u otras contraprestaciones a cambio de contacto romántico, sexual o de compañía.",
          "No están permitidas las relaciones tipo 'sugar', escort, prostitución, agencias matrimoniales encubiertas, MLM, OnlyFans, casinos, inversiones, criptomonedas ni la captación de tráfico hacia otros sitios.",
          "Si alguien te pide dinero — para un viaje, una emergencia médica, un visado o una transferencia — repórtalo de inmediato y no envíes nada. Esto es la señal más común de estafa romántica.",
        ]},
        { heading: "5. Protege a los menores",
          summary: "Plataforma estrictamente para mayores de 18 años.",
          callout: { tone: "important", title: "Reporte inmediato",
            body: "Cualquier sospecha de menores o de explotación infantil será suspendida y reportada a NCMEC y autoridades locales." },
          items: [
          "El servicio es exclusivamente para mayores de 18 años. No están permitidas fotos de menores como foto principal ni contenido que sexualice a menores bajo ninguna forma.",
          "Cualquier sospecha de presencia de menores o de explotación infantil será suspendida de inmediato y reportada a las autoridades competentes (NCMEC y/o equivalentes locales).",
        ]},
        { heading: "6. Contenido permitido y no permitido",
          summary: "Lo que puedes — y lo que nunca debes — publicar o enviar.",
          items: [
          "Permitido: fotos claras y actuales de tu rostro y cuerpo (vestido), descripciones honestas, conversaciones respetuosas, regalos virtuales o físicos enviados con buena intención.",
          "No permitido: desnudos, contenido sexualmente explícito, lencería provocativa, ropa interior, fotos en la cama o en el baño, contenido violento, sangre, autolesiones, drogas ilegales, armas, simbología de odio o cualquier contenido que infrinja derechos de terceros.",
          "No permitido: enviar enlaces a sitios externos sin contexto, números de WhatsApp/Telegram en los primeros mensajes para evadir nuestra moderación, ni invitaciones a 'continuar la conversación fuera' antes de haber construido confianza dentro de la plataforma.",
        ]},
        { heading: "7. Privacidad de los demás",
          summary: "Lo que te confían no se comparte fuera de la plataforma.",
          items: [
          "No compartas, publiques ni reenvíes capturas de pantalla, fotos privadas, mensajes, datos de contacto, ubicaciones o información personal de otros miembros sin su consentimiento explícito.",
          "Las fotos privadas que un miembro te haya autorizado a ver son solo para ti. Compartirlas en otro lugar es una violación grave y puede tener consecuencias legales.",
        ]},
        { heading: "8. Verificación y confianza",
          summary: "Capas de verificación que reducen — pero no eliminan — el riesgo.",
          items: [
          "Te animamos a verificar tu foto, tu identidad y, si aplica, tus ingresos o tu historial relacional para construir confianza. Las insignias de verificación se otorgan tras superar controles reales y pueden retirarse si encontramos evidencia de fraude.",
          "Da prioridad a las videollamadas antes de planificar cualquier encuentro presencial. Si alguien evita constantemente la videollamada, considéralo una señal de alerta.",
        ]},
        { heading: "9. Seguridad al conocerse en persona",
          summary: "Pasos básicos para un primer encuentro seguro.",
          callout: { tone: "success", title: "Regla de oro",
            body: "Videollamada antes de viajar. Lugar público y de día en el primer encuentro. Tu propio dinero y documentos siempre contigo." },
          items: [
          "Tómate tu tiempo. Varias videollamadas, conversaciones largas y conocer a familiares y amigos por video son pasos saludables antes de viajar.",
          "Cuando te encuentres en persona por primera vez, hazlo en un lugar público, durante el día, dile a una persona de confianza dónde estarás y mantén tu propio dinero y documentos contigo. Nunca dependas económicamente de la otra persona durante los primeros encuentros.",
          "Consulta nuestra página de Seguridad para una lista completa de buenas prácticas.",
        ]},
        { heading: "10. Mensajes, regalos y créditos",
          summary: "Cómo se moderan y cómo se usan correctamente.",
          items: [
          "Los mensajes y regalos están sujetos a moderación. Mensajes con insultos, solicitación, spam, enlaces sospechosos o contenido prohibido pueden bloquearse antes de entregarse.",
          "Los regalos son una forma cálida de mostrar interés, no un instrumento para presionar, condicionar o comprar comportamiento. Enviar regalos esperando favores o respuestas concretas no está permitido.",
        ]},
        { heading: "11. Política de denuncias",
          summary: "Cómo reportar y cómo investigamos.",
          items: [
          "Si ves o experimentas algo que viole estas normas, repórtalo desde el perfil, el chat o el correo trust@matchvenezuelan.com. Los reportes son confidenciales.",
          "Investigamos cada reporte. Cuando sea necesario podemos pedirte información adicional. La represalia contra quien reporta de buena fe está prohibida y se sanciona.",
        ]},
        { heading: "12. Aplicación y consecuencias",
          summary: "Enfoque graduado — y línea roja para violaciones graves.",
          items: [
          "Aplicamos un enfoque graduado: educación → advertencia → restricción de funciones → suspensión temporal → terminación permanente. La gravedad determina dónde empezamos.",
          "Las violaciones graves (explotación de menores, trata, fraude, amenazas creíbles, contenido sexual no consensuado) resultan en terminación inmediata y, cuando proceda, en reportes a fuerzas del orden, unidades antifraude y autoridades de protección infantil.",
          "Las cuentas terminadas por violación no tienen derecho a reembolso de períodos no usados, créditos restantes o regalos pendientes, conforme a los Términos.",
        ]},
        { heading: "13. Apelaciones",
          summary: "Tienes 30 días y revisa una persona distinta.",
          items: [
          "Si crees que una decisión de moderación es incorrecta, puedes apelar respondiendo al correo de notificación o escribiendo a trust@matchvenezuelan.com en un plazo de 30 días. Una persona distinta de quien tomó la decisión inicial revisará tu caso.",
        ]},
        { heading: "14. Cómo contactarnos",
          summary: "Direcciones por tema.",
          items: [
          "Confianza y Seguridad: trust@matchvenezuelan.com · Soporte: support@matchvenezuelan.com · Asuntos legales: legal@matchvenezuelan.com.",
        ]},
      ]
    : [
        { heading: "1. Be yourself (authenticity)",
          summary: "One real person behind every profile.",
          items: [
          "Use your real first name (or a recognizable form of it) and current photos of yourself only. No AI-generated faces, deepfakes, stock images, photos of other people or heavily retouched images that misrepresent your appearance.",
          "Be honest about your age, location, marital status, children, profession and intentions. Lying about basic facts breaks trust and is grounds for suspension.",
          "One account per person. Do not create duplicate accounts, do not share your account with others, and do not evade bans by creating a new one.",
        ]},
        { heading: "2. Treat others with respect",
          summary: "Warm tone — no harassment, no discrimination.",
          items: [
          "Speak kindly. Do not insult, humiliate, threaten, harass or intimidate other members — not even 'as a joke'.",
          "Zero tolerance for racism, sexism, homophobia, transphobia, xenophobia, or discrimination based on disability, age, religion, nationality or immigration status.",
          "Accept a 'no'. If someone does not reply, blocks you or tells you they are not interested, do not insist and do not create a new account to reach them again.",
        ]},
        { heading: "3. Serious intentions, not entertainment",
          summary: "This is not Tinder, not a hookup app, not a chat to 'kill time'.",
          items: [
          "MatchVenezuelan is not a casual dating site, not a hookup site, not for paid encounters and not for 'just chatting'. If your intention is not a serious relationship, this is not the right platform for you.",
          "Be clear from the start about what you are looking for. Transparency saves everyone time and pain.",
        ]},
        { heading: "4. Zero tolerance for solicitation and fraud",
          summary: "No money in exchange for affection, presence or sex.",
          callout: { tone: "warning", title: "Red flag",
            body: "If anyone asks you for money, crypto or gift cards: do not send anything and report immediately to trust@matchvenezuelan.com." },
          items: [
          "It is strictly forbidden to ask for, offer or transfer money, crypto, gift cards, allowances or any other consideration in exchange for romantic, sexual or companionship contact.",
          "Sugar arrangements, escort services, prostitution, hidden matchmaking agencies, MLM, OnlyFans, casinos, investments, crypto schemes and traffic-driving to other sites are not allowed.",
          "If someone asks you for money — for travel, a medical emergency, a visa or a transfer — report it immediately and do not send anything. This is the most common red flag of a romance scam.",
        ]},
        { heading: "5. Protect minors",
          summary: "Strictly an adults-only platform.",
          callout: { tone: "important", title: "Immediate reporting",
            body: "Any suspicion of minors or child exploitation is suspended and reported to NCMEC and local authorities." },
          items: [
          "The service is strictly for adults aged 18+. Photos of minors as a primary photo and any content sexualizing minors in any form are forbidden.",
          "Any suspicion of minors or child exploitation is suspended immediately and reported to competent authorities (NCMEC and/or local equivalents).",
        ]},
        { heading: "6. What you can and cannot post",
          summary: "What is welcome — and what is never allowed.",
          items: [
          "Allowed: clear, current photos of your face and body (clothed), honest descriptions, respectful conversations, virtual or physical gifts sent in good faith.",
          "Not allowed: nudity, sexually explicit content, provocative lingerie, underwear, bedroom or bathroom photos, violent content, gore, self-harm, illegal drugs, weapons, hate symbols or any content that infringes third-party rights.",
          "Not allowed: posting external links without context, sharing WhatsApp/Telegram numbers in the first messages to bypass our moderation, or pushing to 'continue the conversation off-platform' before trust has been built inside the platform.",
        ]},
        { heading: "7. Other people's privacy",
          summary: "What is shared with you stays inside the platform.",
          items: [
          "Do not share, publish or forward screenshots, private photos, messages, contact details, locations or personal information of other members without their explicit consent.",
          "Private photos a member has authorized you to view are for you alone. Sharing them anywhere else is a serious violation and may have legal consequences.",
        ]},
        { heading: "8. Verification and trust",
          summary: "Verification layers reduce — but do not eliminate — risk.",
          items: [
          "We encourage you to verify your photo, your identity and, where applicable, your income or relationship history to build trust. Verification badges are awarded after passing real checks and can be removed if we find evidence of fraud.",
          "Prioritize video calls before planning any in-person meeting. If someone consistently avoids video, treat it as a red flag.",
        ]},
        { heading: "9. Safety when meeting in person",
          summary: "Basic steps for a safe first meeting.",
          callout: { tone: "success", title: "Golden rule",
            body: "Video-call before traveling. Public place in daytime for the first meeting. Always keep your own money and documents with you." },
          items: [
          "Take your time. Multiple video calls, long conversations and meeting family or friends on camera are healthy steps before traveling.",
          "When you first meet in person, do it in a public place, during the day, tell a trusted person where you will be, and keep your own money and documents with you. Never depend financially on the other person during early meetings.",
          "See our Safety page for a complete checklist of best practices.",
        ]},
        { heading: "10. Messages, gifts and credits",
          summary: "How they are moderated and how to use them well.",
          items: [
          "Messages and gifts are subject to moderation. Messages containing insults, solicitation, spam, suspicious links or prohibited content may be blocked before delivery.",
          "Gifts are a warm way to show interest, not a tool to pressure, condition or buy behavior. Sending gifts expecting specific favors or replies is not allowed.",
        ]},
        { heading: "11. Reporting policy",
          summary: "How to report and how we investigate.",
          items: [
          "If you see or experience something that breaks these guidelines, report it from the profile, the chat or by emailing trust@matchvenezuelan.com. Reports are confidential.",
          "We investigate every report. We may ask you for additional information when needed. Retaliation against anyone who reports in good faith is forbidden and sanctioned.",
        ]},
        { heading: "12. Enforcement and consequences",
          summary: "Graduated approach — and a hard line for serious violations.",
          items: [
          "We apply a graduated approach: education → warning → feature restriction → temporary suspension → permanent termination. Severity determines where we start.",
          "Serious violations (child exploitation, trafficking, fraud, credible threats, non-consensual sexual content) result in immediate termination and, where appropriate, reports to law enforcement, financial-crime units and child-protection authorities.",
          "Accounts terminated for violation are not eligible for refunds of unused periods, remaining credits or pending gifts, in line with the Terms.",
        ]},
        { heading: "13. Appeals",
          summary: "30 days, reviewed by a different person.",
          items: [
          "If you believe a moderation decision is wrong, you can appeal by replying to the notification email or writing to trust@matchvenezuelan.com within 30 days. A person other than the one who made the initial decision will review your case.",
        ]},
        { heading: "14. How to contact us",
          summary: "Email addresses by topic.",
          items: [
          "Trust & Safety: trust@matchvenezuelan.com · Support: support@matchvenezuelan.com · Legal: legal@matchvenezuelan.com.",
        ]},
      ];

  return (
    <LegalShell
      title={isEs ? "Normas de la Comunidad" : "Community Guidelines"}
      effective="2026-01-01"
      lastUpdated="2026-04"
      intro={intro}
      sections={sections}
    />
  );
}
