-- Rich blog posts with callout boxes, tips, warnings, and gender-specific advice.
-- Uses ON CONFLICT (slug) DO UPDATE so re-running this migration refreshes content.

INSERT INTO public.blog_posts (
  slug, category, reading_minutes, featured, published, published_at, tags,
  title_en, meta_description_en, excerpt_en, body_en, faq_en, internal_links_en,
  title_es, meta_description_es, excerpt_es, body_es, faq_es, internal_links_es
) VALUES

-- ── POST 1: Verify before you fall ──────────────────────────────────────────
(
  'how-to-verify-a-profile-before-you-fall',
  'trust',
  7,
  true,
  true,
  now() - interval '10 days',
  ARRAY['verification','safety','scam prevention','trust'],

  'How to Verify a Profile Before You Fall for Them',
  'A step-by-step guide to verifying a Venezuelan dating profile before emotional investment. Reverse image search, video calls, platform badges, and red flags explained.',
  'Attraction moves fast. Verification should move faster. Here is a practical checklist every member—male or female—should complete before sharing personal details or developing deep feelings.',

  $body_en$
## Why Verification Matters Before Emotion Does

The excitement of a new connection is real—but so is the risk of investing weeks of emotion into someone who is not who they claim to be. Scammers specifically target the window *before* you verify, because emotional investment makes people overlook inconsistencies.

The good news: verification takes less than 20 minutes and dramatically reduces risk.

> [!IMPORTANT]
> Complete at least steps 1–3 before any video call, and all five steps before sharing personal contact information outside the platform.

---

## Step 1 — Reverse Image Search Every Profile Photo

Copy each profile photo and run it through Google Images or TinEye. Stolen photos typically appear on stock sites, Instagram accounts, or modelling portfolios.

**How to do it in 60 seconds:**

1. Right-click any profile photo → "Search image" (Chrome) or save and upload at images.google.com
2. Run the same image on TinEye.com for older matches
3. Search their stated full name + country on Google Images

> [!WARNING]
> A clean reverse-image result does **not** confirm authenticity—it only means the photos aren't widely stolen. Scammers increasingly use AI-generated faces that pass reverse-image checks. Proceed to Step 2.

---

## Step 2 — Request a Specific Live Photo

Ask them to send a photo holding a piece of paper with today's date and your name written on it, or making a unique gesture you describe. This is the oldest and most reliable live-verification method.

> [!FOR_WOMEN]
> If a man you have been chatting with refuses this request or becomes defensive, that is a significant red flag. Genuine people with nothing to hide find this charming, not offensive. You can frame it lightly: *"I do this with everyone I meet online—hope you understand!"*

> [!FOR_MEN]
> Do not skip this step even if the woman has a verified badge. Badges verify identity documents but the same person can be coached by a third party. The live photo confirms the person on the screen is the person typing.

---

## Step 3 — Complete a Video Call Before Sharing Contact Info

A video call is the minimum threshold for authenticity. Schedule one within the first two weeks of chatting. If they repeatedly delay with excuses, treat that as a red flag.

**Signs the video call is real:**

- Lighting and background match their described location
- They can speak and move naturally, not scripted or frozen
- They respond to spontaneous requests ("Can you wave?" / "Show me the room behind you")
- Audio and lip-sync are natural (deepfake indicators)

> [!WARNING]
> A single staged video call is no longer proof enough. Deepfake video technology exists. Do multiple shorter calls at unexpected times rather than one long planned call.

---

## Step 4 — Check Their Platform Verification Badge

MatchVenezuelan offers multiple verification tiers. Look for these badges on the profile:

| Badge | What it means |
|---|---|
| **Photo Verified** | A reviewer matched their selfie to their profile photos |
| **ID Verified** | Government ID document reviewed by staff |
| **Social Verified** | Active social media account confirmed as theirs |
| **Concierge Verified** | Full background check and in-depth review |

> [!TIP]
> Filter your browsing to show only **Photo Verified** or higher members as a starting point. You can always relax this filter later once you have completed your own checks.

---

## Step 5 — Trust Patterns, Not Promises

Scammers are trained to build trust quickly through intense flattery, rapid declarations of love, and emotional bonding. This is called "love bombing."

Watch for these patterns in the first two weeks:

- Moves to "I love you" or marriage talk within days
- Claims unusual tragedy or emergency requiring financial help
- Refuses to video call but sends many photos
- Pushes to move off the platform to WhatsApp or Telegram quickly
- Stories have minor inconsistencies that shift when you ask questions

> [!CAUTION]
> If someone you have never met asks for money—in any form, for any reason—end the conversation immediately. No legitimate romantic interest requires financial help from a stranger. This applies even if they have passed steps 1–4.

---

## A Note on Verified Members Who Are Still a Risk

Verification confirms identity; it does not guarantee compatibility, honesty, or good intentions in a relationship. A verified person can still be emotionally manipulative, unfaithful, or dishonest about their circumstances.

Use verification as a floor, not a ceiling. Continue getting to know someone carefully through conversation, consistency, and time.

> [!NOTE]
> MatchVenezuelan's Trust & Safety team reviews verification requests manually. If you suspect a verified member is fraudulent, report them immediately. Fraudulent use of someone else's identity documents is a serious violation and results in permanent ban.
$body_en$,

  '[
    {"q": "How long does platform verification take?", "a": "Photo verification is typically reviewed within 24 hours. ID and Social verification take 2–4 business days. Concierge Verified review takes up to 7 business days as it involves a more thorough background process."},
    {"q": "What should I do if a reverse image search shows their photo elsewhere?", "a": "Report the profile immediately using the flag icon on their profile page. Include the URL where the stolen photo appears. Our moderation team will investigate within 12 hours and suspend the account if fraud is confirmed."},
    {"q": "Is it rude to ask for a live verification photo?", "a": "No. It is a standard practice in online dating and any genuine person will understand. You can frame it warmly: ''I do this with everyone I meet here, hope that''s okay!'' If they react with anger or repeated deflection, that itself is useful information."},
    {"q": "Can deepfake videos fool a video call check?", "a": "Real-time deepfake video is still detectable with careful attention. Look for unnatural eye movement, blurring around the hairline, lag between mouth movement and audio, and lighting that does not match the background. Ask them to perform spontaneous actions — rapid deepfake responses to unexpected requests are much harder to fake convincingly."},
    {"q": "What if I already sent money before reading this?", "a": "Stop all contact and do not send more. Report the profile on MatchVenezuelan immediately. If you used a bank transfer, contact your bank within 24 hours — fraud reversals are possible in the early window. If you used cryptocurrency or gift cards, recovery is unlikely but reporting still helps prevent others from being targeted."}
  ]'::jsonb,

  '[
    {"label": "Red flags in online dating — a complete guide", "href": "/resources/red-flags-online-dating-venezuelan"},
    {"label": "Understanding Venezuelan dating culture", "href": "/resources/venezuelan-dating-culture-guide"},
    {"label": "Safety tips for women meeting men online", "href": "/resources/safety-tips-for-women-meeting-men-online"}
  ]'::jsonb,

  -- Spanish version
  'Cómo Verificar un Perfil Antes de Enamorarte',
  'Guía paso a paso para verificar un perfil venezolano antes de invertir emocionalmente. Búsqueda inversa de imágenes, videollamadas, insignias de verificación y señales de alerta.',
  'La atracción avanza rápido. La verificación debe avanzar más rápido. Aquí tienes una lista de verificación práctica que todo miembro —hombre o mujer— debe completar antes de compartir datos personales.',

  $body_es$
## Por Qué la Verificación Importa Antes que la Emoción

La emoción de una nueva conexión es real, pero también lo es el riesgo de invertir semanas de sentimientos en alguien que no es quien dice ser. Los estafadores apuntan específicamente a la ventana *antes* de que verifiques, porque el apego emocional hace que las personas pasen por alto las inconsistencias.

La buena noticia: la verificación toma menos de 20 minutos y reduce drásticamente el riesgo.

> [!IMPORTANT]
> Completa al menos los pasos 1–3 antes de cualquier videollamada, y los cinco pasos antes de compartir información de contacto personal fuera de la plataforma.

---

## Paso 1 — Búsqueda Inversa de Cada Foto de Perfil

Copia cada foto de perfil y búscala en Google Imágenes o TinEye. Las fotos robadas suelen aparecer en sitios de fotos de stock, cuentas de Instagram o portafolios de modelos.

> [!WARNING]
> Un resultado limpio en la búsqueda inversa **no** confirma autenticidad. Los estafadores usan cada vez más caras generadas por IA que superan estas verificaciones. Continúa con el Paso 2.

---

## Paso 2 — Solicita una Foto en Vivo Específica

Pídele que envíe una foto sosteniendo un papel con la fecha de hoy y tu nombre escrito, o haciendo un gesto único que tú describes. Este es el método de verificación en vivo más antiguo y confiable.

> [!FOR_WOMEN]
> Si un hombre con quien has estado chateando rechaza esta solicitud o se pone a la defensiva, eso es una señal de alerta significativa. Las personas genuinas que no tienen nada que ocultar encuentran esto encantador, no ofensivo.

> [!FOR_MEN]
> No omitas este paso aunque la mujer tenga una insignia verificada. Las insignias verifican documentos de identidad, pero la misma persona puede ser dirigida por un tercero. La foto en vivo confirma que la persona en la pantalla es quien está escribiendo.

---

## Paso 3 — Realiza una Videollamada Antes de Compartir Datos de Contacto

Una videollamada es el umbral mínimo de autenticidad. Programa una dentro de las primeras dos semanas de chat. Si constantemente pospone con excusas, tómalo como una señal de alerta.

> [!WARNING]
> Una sola videollamada preparada ya no es suficiente prueba. La tecnología deepfake existe. Realiza múltiples llamadas cortas en momentos inesperados en lugar de una sola llamada larga y planificada.

---

## Paso 4 — Verifica la Insignia de Verificación de la Plataforma

MatchVenezuelan ofrece múltiples niveles de verificación. Busca estas insignias en el perfil:

| Insignia | Qué significa |
|---|---|
| **Foto Verificada** | Un revisor cotejó su selfie con sus fotos de perfil |
| **ID Verificada** | Documento de identidad gubernamental revisado por el equipo |
| **Social Verificada** | Cuenta de redes sociales activa confirmada como propia |
| **Concierge Verificada** | Verificación de antecedentes completa y revisión detallada |

> [!TIP]
> Filtra tu búsqueda para mostrar solo miembros con **Foto Verificada** o superior como punto de partida. Siempre puedes relajar este filtro más adelante una vez que hayas completado tus propias verificaciones.

---

## Paso 5 — Confía en Patrones, No en Promesas

Los estafadores están entrenados para generar confianza rápidamente a través de halagos intensos, declaraciones rápidas de amor y vínculos emocionales. Esto se llama "bombardeo de amor".

> [!CAUTION]
> Si alguien que nunca has conocido te pide dinero —en cualquier forma, por cualquier razón— termina la conversación de inmediato. Ningún interés romántico legítimo requiere ayuda financiera de un extraño.

---

## Una Nota sobre Miembros Verificados que Aún Representan un Riesgo

La verificación confirma identidad; no garantiza compatibilidad, honestidad o buenas intenciones. Una persona verificada aún puede ser manipuladora emocionalmente o deshonesta sobre sus circunstancias.

> [!NOTE]
> El equipo de Confianza y Seguridad de MatchVenezuelan revisa las solicitudes de verificación manualmente. Si sospechas que un miembro verificado es fraudulento, repórtalo de inmediato.
$body_es$,

  '[
    {"q": "¿Cuánto tiempo tarda la verificación de la plataforma?", "a": "La verificación de fotos generalmente se revisa en 24 horas. La verificación de ID y Social toma de 2 a 4 días hábiles. La revisión Concierge Verificada toma hasta 7 días hábiles."},
    {"q": "¿Qué hago si una búsqueda inversa muestra su foto en otro lugar?", "a": "Reporta el perfil de inmediato usando el ícono de bandera en su página de perfil. Incluye la URL donde aparece la foto robada. Nuestro equipo de moderación investigará en 12 horas."},
    {"q": "¿Es de mala educación pedir una foto de verificación en vivo?", "a": "No. Es una práctica estándar en las citas en línea y cualquier persona genuina lo entenderá. Puedes presentarlo amablemente: ''Hago esto con todos los que conozco aquí, ¿está bien?''"},
    {"q": "¿Pueden los videos deepfake engañar en una videollamada?", "a": "El video deepfake en tiempo real aún es detectable con atención cuidadosa. Busca movimiento ocular antinatural, desenfoque alrededor de la línea del cabello, retraso entre el movimiento de la boca y el audio. Pídeles que realicen acciones espontáneas."},
    {"q": "¿Qué pasa si ya envié dinero antes de leer esto?", "a": "Detén todo contacto y no envíes más. Reporta el perfil en MatchVenezuelan de inmediato. Si usaste una transferencia bancaria, contacta a tu banco dentro de las 24 horas."}
  ]'::jsonb,

  '[
    {"label": "Señales de alerta en las citas en línea", "href": "/resources/red-flags-online-dating-venezuelan"},
    {"label": "Guía de cultura del dating venezolano", "href": "/resources/venezuelan-dating-culture-guide"},
    {"label": "Consejos de seguridad para mujeres", "href": "/resources/safety-tips-for-women-meeting-men-online"}
  ]'::jsonb
),

-- ── POST 2: Safety tips for women ───────────────────────────────────────────
(
  'safety-tips-for-women-meeting-men-online',
  'safety',
  8,
  true,
  true,
  now() - interval '7 days',
  ARRAY['safety','women','red flags','scam','protection'],

  'Safety Tips for Women: Meeting International Men Online',
  'Essential safety guide for Venezuelan women meeting men from abroad on dating platforms. Protect your identity, spot manipulation, and move at your own pace.',
  'International online dating opens real doors to meaningful relationships — but it also attracts men who see Venezuelan women as vulnerable targets. This guide puts control firmly in your hands.',

  $body_en_2$
## You Set the Pace — Always

One of the most common forms of manipulation in international online dating is pressure. A genuine man who is serious about a relationship will respect your timeline — for sharing photos, starting video calls, meeting in person, or discussing finances.

> [!IMPORTANT]
> If any man pressures you to move faster than you are comfortable with on any front — emotionally, physically, or financially — that is a boundary violation, not a sign of passion. Slow down, not speed up.

---

## Protect Your Identity in the Early Stages

Before trust is genuinely established (weeks to months, not days), protect the following:

- Your full legal name
- Home address or neighborhood
- Workplace name or location
- Phone number (use the platform's messaging until you are certain)
- Social media accounts (especially those showing your routines or location)

> [!FOR_WOMEN]
> You do not owe anyone your personal contact information in exchange for their attention or affection. Requesting your WhatsApp or Instagram within the first few messages is a common tactic to move you off the moderated platform where your communications are safer.

---

## How to Read a Man's Real Intentions

Words are easy. Consistency over time is not. Watch these behavioral patterns over the first month:

**Positive signs:**
- He respects "no" without argument
- He asks about your life, goals, and family — not just your appearance
- He suggests video calls rather than avoiding them
- He is patient about the pace of the relationship
- He does not discuss money or hint at financial problems early on

**Warning signs:**
- Intense declarations of love within the first week
- He deflects or becomes vague when asked basic life questions
- He only contacts you at unusual hours
- He gradually isolates you from friends or family ("they don't understand our connection")
- Tiny inconsistencies in his story that shift when you ask follow-up questions

> [!WARNING]
> "Love bombing" — intense, fast emotional investment including declarations of love, future plans, and excessive flattery very early — is the most common entry point for romance scams. It feels wonderful. That is by design. The purpose is to create emotional debt so you feel obligated to help when the "emergency" arrives.

---

## The Money Question

This cannot be stated plainly enough: **no legitimate romantic partner asks for money before you have met in person and established a real relationship.**

Common financial manipulation scenarios:

| Story | Reality |
|---|---|
| Emergency medical bills for a family member | Classic pretext — the family member does not exist |
| Flight ticket to come visit you | He will cancel after receiving the money |
| Business investment that fell through | Advance-fee fraud setup |
| Customs fees to release a gift sent to you | No gift exists; you are paying nothing for nothing |

> [!CAUTION]
> Even if he has video-called you, you have seen his home, and he seems completely genuine — do not send money. Romance scammers invest weeks or months before the ask because the longer the investment, the higher the payout.

---

## First Meeting Safety: Non-Negotiable Rules

When you decide to meet someone in person for the first time:

1. **Meet in a public place** — a restaurant or café in a busy area during daytime hours
2. **Tell someone exactly where you are going** — a friend or family member, with his name and photo
3. **Arrange your own transport** — do not allow him to pick you up from your home the first time
4. **Keep your phone charged** — and share your live location with a trusted contact
5. **Trust your instincts** — if something feels wrong when you arrive, you are allowed to leave

> [!TIP]
> Some women use a code word with a trusted friend: if you text that word, the friend calls you with a believable excuse to leave. This is standard practice and there is nothing embarrassing about using it.

---

## If Something Goes Wrong

- **On the platform:** Use the report button on any message or profile. MatchVenezuelan's Trust & Safety team reviews reports within 12–24 hours.
- **Financial fraud:** Contact your bank immediately. If gift cards or cryptocurrency were involved, report to your national consumer protection authority.
- **In-person danger:** Contact local emergency services immediately. Your safety is the only priority.

> [!NOTE]
> MatchVenezuelan does not share your contact details with other members. Your email, phone number, and address are never visible on your profile. If a man claims to have found your personal information "outside the platform," report it immediately — this is a serious privacy violation.
$body_en_2$,

  '[
    {"q": "Is it safe to give my WhatsApp number to someone I met here?", "a": "We recommend keeping all early communication on the platform, where messages are moderated and you have clear reporting tools. Move to WhatsApp only after you have completed video calls and feel confident in the person''s identity. Never share your number in the first few days of contact."},
    {"q": "What if a man sends me a gift or money I did not ask for?", "a": "Unsolicited gifts or money transfers are sometimes used to create a sense of obligation. You are not required to reciprocate in any way. If the gift request involves customs fees, clearance charges, or any payment from you, it is a scam — do not pay anything."},
    {"q": "He says he loves me after only a week. Is that normal?", "a": "Genuine love develops over time through shared experience. Declarations of love within the first week of online contact are a recognized manipulation tactic called ''love bombing.'' It is designed to create emotional dependency. Slow the relationship down, not up."},
    {"q": "What should I do if I feel pressured during a conversation?", "a": "You are always allowed to end or pause a conversation at any time without explanation. If a man becomes aggressive, threatening, or manipulative when you set a limit, report his profile immediately. Healthy partners do not react that way to boundaries."},
    {"q": "Is it okay to block someone who makes me uncomfortable?", "a": "Yes, absolutely. Blocking is a safety tool, not rudeness. You do not need a reason to block, and you do not owe anyone an explanation. Use it freely whenever something feels wrong."}
  ]'::jsonb,

  '[
    {"label": "How to verify a profile before you fall", "href": "/resources/how-to-verify-a-profile-before-you-fall"},
    {"label": "Red flags in online dating", "href": "/resources/red-flags-online-dating-venezuelan"},
    {"label": "Understanding Venezuelan dating culture", "href": "/resources/venezuelan-dating-culture-guide"}
  ]'::jsonb,

  -- Spanish
  'Consejos de Seguridad para Mujeres: Conocer Hombres Internacionales en Línea',
  'Guía esencial de seguridad para mujeres venezolanas que conocen hombres del extranjero en plataformas de citas. Protege tu identidad, detecta la manipulación y avanza a tu propio ritmo.',
  'Las citas internacionales en línea abren puertas reales a relaciones significativas — pero también atrae a hombres que ven a las mujeres venezolanas como objetivos vulnerables. Esta guía pone el control firmemente en tus manos.',

  $body_es_2$
## Tú Marcas el Ritmo — Siempre

Una de las formas más comunes de manipulación en las citas internacionales en línea es la presión. Un hombre genuino que va en serio respetará tu cronograma — para compartir fotos, iniciar videollamadas, conocerse en persona o hablar de finanzas.

> [!IMPORTANT]
> Si algún hombre te presiona para avanzar más rápido de lo que te sientes cómoda — emocional, física o financieramente — eso es una violación de límites, no una señal de pasión. Frena, no aceleres.

---

## Protege Tu Identidad en las Etapas Iniciales

Antes de que se establezca confianza genuina (semanas a meses, no días), protege lo siguiente: tu nombre legal completo, dirección de casa, nombre del lugar de trabajo, número de teléfono, y cuentas de redes sociales que muestren tu rutina o ubicación.

> [!FOR_WOMEN]
> No le debes a nadie tu información de contacto personal a cambio de su atención o afecto. Solicitar tu WhatsApp o Instagram en los primeros mensajes es una táctica común para sacarte de la plataforma moderada donde tus comunicaciones son más seguras.

---

## Cómo Leer las Verdaderas Intenciones de un Hombre

Las palabras son fáciles. La consistencia a lo largo del tiempo no lo es. Observa estos patrones de comportamiento durante el primer mes:

**Señales positivas:** Respeta el "no" sin argumentar, pregunta sobre tu vida y metas, sugiere videollamadas, es paciente con el ritmo de la relación, no habla de dinero ni insinúa problemas financieros.

**Señales de alerta:** Declaraciones intensas de amor en la primera semana, evita las videollamadas, te aísla gradualmente de amigos o familiares, pequeñas inconsistencias en su historia.

> [!WARNING]
> El "bombardeo de amor" — inversión emocional intensa y rápida, incluyendo declaraciones de amor y planes de futuro muy temprano — es el punto de entrada más común para las estafas románticas. Se siente maravilloso. Eso es por diseño.

---

## La Pregunta del Dinero

No puede decirse con más claridad: **ninguna pareja romántica legítima pide dinero antes de haberse conocido en persona y haber establecido una relación real.**

> [!CAUTION]
> Aunque te haya hecho videollamadas y parezca completamente genuino — no envíes dinero. Los estafadores románticos invierten semanas o meses antes de pedir porque cuanto mayor es la inversión emocional, mayor es el pago.

---

## Primera Reunión: Reglas No Negociables

1. Reúnete en un lugar público durante horas diurnas
2. Informa a alguien exactamente a dónde vas — con su nombre y foto
3. Organiza tu propio transporte — no permitas que te recoja en tu casa la primera vez
4. Mantén tu teléfono cargado y comparte tu ubicación en vivo con un contacto de confianza
5. Confía en tus instintos — si algo se siente mal al llegar, tienes permitido irte

> [!TIP]
> Algunas mujeres usan una palabra clave con una amiga de confianza: si envías esa palabra por mensaje, la amiga te llama con una excusa creíble para irte. Esta es una práctica estándar y no hay nada vergonzoso en usarla.

> [!NOTE]
> MatchVenezuelan no comparte tus datos de contacto con otros miembros. Tu correo electrónico, número de teléfono y dirección nunca son visibles en tu perfil.
$body_es_2$,

  '[
    {"q": "¿Es seguro dar mi número de WhatsApp a alguien que conocí aquí?", "a": "Recomendamos mantener toda la comunicación inicial en la plataforma, donde los mensajes son moderados y tienes herramientas claras de reporte. Pasa a WhatsApp solo después de haber hecho videollamadas y sentirte segura de la identidad de la persona."},
    {"q": "¿Qué pasa si un hombre me envía un regalo o dinero que no pedí?", "a": "Los regalos o transferencias no solicitadas a veces se usan para crear un sentido de obligación. Si la solicitud de regalo implica tarifas de aduana o cualquier pago de tu parte, es una estafa — no pagues nada."},
    {"q": "Dice que me ama después de solo una semana. ¿Es normal?", "a": "El amor genuino se desarrolla con el tiempo a través de experiencias compartidas. Las declaraciones de amor en la primera semana de contacto en línea son una táctica de manipulación reconocida llamada ''bombardeo de amor''."},
    {"q": "¿Qué debo hacer si me siento presionada durante una conversación?", "a": "Siempre tienes permitido terminar o pausar una conversación en cualquier momento sin dar explicaciones. Si un hombre se vuelve agresivo o manipulador cuando estableces un límite, reporta su perfil de inmediato."},
    {"q": "¿Está bien bloquear a alguien que me hace sentir incómoda?", "a": "Sí, absolutamente. Bloquear es una herramienta de seguridad, no una falta de educación. No necesitas una razón para bloquear y no le debes una explicación a nadie."}
  ]'::jsonb,

  '[
    {"label": "Cómo verificar un perfil antes de enamorarte", "href": "/resources/how-to-verify-a-profile-before-you-fall"},
    {"label": "Señales de alerta en las citas en línea", "href": "/resources/red-flags-online-dating-venezuelan"},
    {"label": "Guía de cultura del dating venezolano", "href": "/resources/venezuelan-dating-culture-guide"}
  ]'::jsonb
),

-- ── POST 3: Venezuelan dating culture guide ──────────────────────────────────
(
  'venezuelan-dating-culture-guide',
  'culture',
  9,
  true,
  true,
  now() - interval '5 days',
  ARRAY['culture','venezuela','dating','family','language','etiquette'],

  'Venezuelan Dating Culture: What International Men Really Need to Know',
  'A genuine guide to Venezuelan family values, communication styles, relationship expectations, and cultural etiquette for international men serious about a Venezuelan partner.',
  'Venezuelan women are warm, family-oriented, and deeply values-driven. But culture shapes expectations in ways that can create misunderstanding if you are unprepared. This guide bridges the gap.',

  $body_en_3$
## Context First: Venezuela Is Not a Monolith

Venezuela is a country of enormous geographic, economic, and cultural diversity. A woman from Caracas, Maracaibo, Mérida, or a small town in Los Llanos will have different expectations, communication styles, and family dynamics. Avoid treating "Venezuelan culture" as a single fixed script.

> [!NOTE]
> Many Venezuelan women you meet on this platform have emigrated or are planning to. Their relationship with Venezuelan culture may be complicated by migration stress, economic hardship, or the experience of rebuilding identity in a new country. Ask rather than assume.

---

## Family Is Central — Take That Seriously

In Venezuelan culture, family is not a background feature of life — it is the main stage. This affects your relationship in practical ways:

- **Her family's opinion matters.** Even adult, independent women take their parents' and siblings' views seriously. Being embraced by her family is not a bonus — it is part of the relationship.
- **Extended family involvement is normal.** Cousins, aunts, and grandparents may weigh in on major decisions. This is not interference; it is how families operate.
- **Children from previous relationships are often close to their family.** If she has children, her family is almost certainly deeply involved in raising them.

> [!FOR_MEN]
> The fastest way to demonstrate genuine interest to a Venezuelan woman is to ask about her family with warmth and curiosity. Ask her mother's name. Ask what her parents do. Ask about her siblings. This signals that you see her as a complete person, not just an attractive profile photo.

---

## Communication Style: Warmth, Not Directness

Venezuelan social communication tends toward warmth, indirectness, and emotional expressiveness. This is different from the direct, task-oriented communication style common in Northern Europe or North America.

**What this looks like in practice:**

- Saying "no" directly may feel rude. She may signal reluctance through delay, subject changes, or "maybe" instead of a clear no.
- Disagreement is often expressed through tone and body language rather than explicit statement.
- Emotional expression — warmth, affection, enthusiasm — is not performance; it is natural.
- Silence or withdrawal often signals something is wrong before she will say so directly.

> [!TIP]
> If she goes quiet or becomes less warm, ask gently rather than waiting. A simple "Are you okay? You seem a little different today" opens the door. In Venezuelan culture, being noticed and checked-in-on is experienced as caring, not intrusive.

---

## Language and the Effort You Put In

Spanish is the language of intimacy for most Venezuelan women, even those who speak English fluently. Making the effort to learn basic Spanish — and especially to use it with her family — signals deep respect and genuine commitment.

Even clumsy Spanish is received warmly. No one expects perfection; they expect effort.

> [!FOR_MEN]
> Start with the basics before your first video call with her family: greetings, how to ask how someone is doing, a few compliments in Spanish. Her mother's face when you try will tell you everything about whether the relationship has a future.

> [!WARNING]
> Do not use translation apps exclusively for conversations with her family without disclosing this. It creates a false impression of fluency that will become obvious and embarrassing when you meet in person. Honesty about your level and genuine effort to improve is far more respected.

---

## Relationship Expectations: What She Is (Likely) Looking For

Venezuelan women on a serious dating platform are typically looking for:

- **Stability and reliability** — emotional and financial predictability, not wealth per se
- **Commitment clarity** — a man who is serious about long-term partnership, not casual dating
- **Respect and equal treatment** — being treated as an equal partner, not a trophy or an "exotic" choice
- **A man who shows up** — consistent communication, remembered dates and details, follow-through on plans

> [!IMPORTANT]
> Many Venezuelan women have navigated significant hardship — economic crisis, family separation through emigration, social instability. What they look for in a partner is often someone steady and calm, not someone exciting and unpredictable. Do not confuse "traditional" with "submissive."

---

## What to Avoid: Common Mistakes International Men Make

| Mistake | Why it's a problem |
|---|---|
| Treating her as culturally "exotic" | Reduces her to her nationality, not her individuality |
| Moving too fast emotionally | Creates pressure and distrust, not romance |
| Ignoring her family | Signals you are not serious about integrating into her life |
| Assuming she needs rescuing | Patronizing and inaccurate — she is a partner, not a project |
| Only complimenting her looks | Signals shallow interest — comment on what she says, thinks, and does |
| Expecting her to relocate easily | Migration is traumatic; treat it as a serious conversation, not a given |

> [!CAUTION]
> Some international men approach Venezuelan women with a "provider" dynamic — offering financial support in exchange for companionship. This dynamic is harmful to genuine relationships and creates a power imbalance that rarely leads to real partnership. MatchVenezuelan exists for serious, equal relationships.

---

## On Meeting Her Family

If the relationship is progressing seriously, you will likely meet her family via video call before meeting in person. Treat this as a formal occasion:

- Be punctual and dressed appropriately
- Have a few words prepared in Spanish
- Ask about them — their work, their health, their home
- Be warm but not overfamiliar with her parents on the first call
- Thank them for the call before ending it

> [!TIP]
> Bringing or sending a small gift when you first meet in person is appreciated and culturally expected — it does not need to be expensive. Something from your home country that has a story behind it is more meaningful than something expensive with no context.
$body_en_3$,

  '[
    {"q": "Is it true that Venezuelan women are very traditional?", "a": "It varies enormously by individual, family background, education, and region. Many Venezuelan women are highly educated, professionally independent, and hold egalitarian views on relationships. Others place high value on traditional family roles. Ask her directly about her expectations rather than assuming."},
    {"q": "How important is religion in Venezuelan relationships?", "a": "Venezuela is predominantly Catholic and religion plays a role in many families'' values and expectations, particularly around marriage and family structure. However, practice varies widely. Some women are deeply devout; others have a cultural but not practiced relationship with religion. This is an important early conversation to have."},
    {"q": "How do I handle the language barrier if I don''t speak Spanish?", "a": "Many Venezuelan women on the platform speak English at varying levels. Use platform messaging, which supports bilingual conversation. Make genuine effort to learn basic Spanish — even a few phrases signal commitment. Avoid relying entirely on translation apps, which create misunderstandings and a false impression of fluency."},
    {"q": "What is a reasonable timeline before visiting her?", "a": "There is no universal answer, but most couples on this platform who move to an in-person meeting do so after 2–4 months of regular communication including frequent video calls. The first visit should be relatively short (5–10 days) and in a neutral public environment, not staying together immediately."},
    {"q": "How do I know if her family approves of me?", "a": "Venezuelan family approval tends to be expressed through inclusion rather than explicit statement. If her family begins inviting you into video calls, asking about you, and referencing you in plans, that is a strong positive signal. Disapproval is more often expressed through absence or formality than direct objection."}
  ]'::jsonb,

  '[
    {"label": "How to verify a profile before you fall", "href": "/resources/how-to-verify-a-profile-before-you-fall"},
    {"label": "Making long-distance relationships work", "href": "/resources/making-long-distance-work"},
    {"label": "Red flags in online dating", "href": "/resources/red-flags-online-dating-venezuelan"}
  ]'::jsonb,

  -- Spanish
  'Cultura del Dating Venezolano: Lo Que los Hombres Internacionales Realmente Necesitan Saber',
  'Una guía genuina sobre los valores familiares venezolanos, estilos de comunicación, expectativas de relación y etiqueta cultural para hombres internacionales serios acerca de una pareja venezolana.',
  'Las mujeres venezolanas son cálidas, orientadas a la familia y profundamente basadas en valores. Pero la cultura moldea las expectativas de maneras que pueden crear malentendidos si no estás preparado.',

  $body_es_3$
## Contexto Primero: Venezuela No Es un Monolito

Venezuela es un país de enorme diversidad geográfica, económica y cultural. Evita tratar "la cultura venezolana" como un guión único y fijo.

> [!NOTE]
> Muchas mujeres venezolanas que encuentras en esta plataforma han emigrado o están planeando hacerlo. Su relación con la cultura venezolana puede estar complicada por el estrés de la migración, las dificultades económicas o la experiencia de reconstruir su identidad en un nuevo país. Pregunta en lugar de asumir.

---

## La Familia Es Central — Tómalo en Serio

En la cultura venezolana, la familia no es un elemento de fondo — es el escenario principal. Esto afecta tu relación de maneras prácticas: la opinión de su familia importa, la participación de la familia extendida es normal, y ser aceptado por su familia no es un extra — es parte de la relación.

> [!FOR_MEN]
> La forma más rápida de demostrar interés genuino a una mujer venezolana es preguntar sobre su familia con calidez y curiosidad. Pregunta el nombre de su madre. Pregunta qué hacen sus padres. Esto señala que la ves como una persona completa, no solo una foto de perfil atractiva.

---

## Estilo de Comunicación: Calidez, No Directividad

La comunicación social venezolana tiende hacia la calidez, la indirectividad y la expresividad emocional. Decir "no" directamente puede sentirse grosero. El desacuerdo a menudo se expresa a través del tono y el lenguaje corporal.

> [!TIP]
> Si ella se pone silenciosa o menos cálida, pregunta suavemente en lugar de esperar. Un simple "¿Estás bien? Te noto un poco diferente hoy" abre la puerta. En la cultura venezolana, ser notada y consultada se experimenta como cuidado, no como intrusión.

---

## El Idioma y el Esfuerzo que Pones

El español es el idioma de la intimidad para la mayoría de las mujeres venezolanas. Hacer el esfuerzo de aprender español básico señala profundo respeto y compromiso genuino.

> [!FOR_MEN]
> Empieza con lo básico antes de tu primera videollamada con su familia: saludos, cómo preguntar cómo está alguien, algunos cumplidos en español. La cara de su madre cuando lo intentes te dirá todo sobre si la relación tiene futuro.

> [!WARNING]
> No uses aplicaciones de traducción exclusivamente para conversaciones con su familia sin revelarlo. Crea una falsa impresión de fluidez que se hará obvia cuando se conozcan en persona.

---

## Expectativas de Relación

Las mujeres venezolanas en una plataforma de citas seria típicamente buscan estabilidad y confiabilidad, claridad de compromiso, respeto e igualdad, y un hombre que "aparezca" — comunicación consistente y seguimiento de los planes.

> [!IMPORTANT]
> Muchas mujeres venezolanas han navegado dificultades significativas. Lo que buscan en un compañero a menudo es alguien estable y tranquilo. No confundas "tradicional" con "sumisa."

> [!CAUTION]
> Algunos hombres internacionales se acercan a las mujeres venezolanas con una dinámica de "proveedor". Esta dinámica es dañina para las relaciones genuinas y crea un desequilibrio de poder que raramente conduce a una verdadera asociación.
$body_es_3$,

  '[
    {"q": "¿Es cierto que las mujeres venezolanas son muy tradicionales?", "a": "Varía enormemente según el individuo, el entorno familiar, la educación y la región. Muchas mujeres venezolanas son altamente educadas, profesionalmente independientes y tienen visiones igualitarias sobre las relaciones. Pregúntale directamente sobre sus expectativas."},
    {"q": "¿Qué importancia tiene la religión en las relaciones venezolanas?", "a": "Venezuela es predominantemente católica y la religión juega un papel en los valores y expectativas de muchas familias. Sin embargo, la práctica varía ampliamente. Esta es una conversación temprana importante."},
    {"q": "¿Cómo manejo la barrera del idioma si no hablo español?", "a": "Muchas mujeres venezolanas en la plataforma hablan inglés en varios niveles. Haz un esfuerzo genuino por aprender español básico. Evita depender completamente de aplicaciones de traducción, que crean malentendidos y una falsa impresión de fluidez."},
    {"q": "¿Cuál es un cronograma razonable antes de visitarla?", "a": "La mayoría de las parejas en esta plataforma que avanzan a un encuentro en persona lo hacen después de 2 a 4 meses de comunicación regular incluyendo videollamadas frecuentes."},
    {"q": "¿Cómo sé si su familia me aprueba?", "a": "La aprobación familiar venezolana tiende a expresarse a través de la inclusión. Si su familia comienza a invitarte a videollamadas, preguntando por ti y refiriéndote en planes, esa es una señal positiva fuerte."}
  ]'::jsonb,

  '[
    {"label": "Cómo verificar un perfil antes de enamorarte", "href": "/resources/how-to-verify-a-profile-before-you-fall"},
    {"label": "Hacer funcionar las relaciones a distancia", "href": "/resources/making-long-distance-work"},
    {"label": "Señales de alerta en las citas en línea", "href": "/resources/red-flags-online-dating-venezuelan"}
  ]'::jsonb
),

-- ── POST 4: Long-distance relationships ─────────────────────────────────────
(
  'making-long-distance-work',
  'relationships',
  8,
  false,
  true,
  now() - interval '3 days',
  ARRAY['long distance','relationships','communication','trust','planning'],

  'Making Long-Distance Work: From Caracas to the World',
  'Practical strategies for building and sustaining a long-distance relationship with a Venezuelan partner — communication cadence, managing time zones, planning visits, and navigating immigration.',
  'Long-distance relationships between Venezuelan women and international partners are common on this platform. Most of the couples who make it through the distance share the same core habits. Here they are.',

  $body_en_4$
## The Distance Is Temporary — But Only If You Plan

The most important mindset shift for long-distance success: treat the distance as a temporary practical problem to solve, not a permanent state to endure. Couples who do not have a concrete plan to close the distance within a defined timeframe rarely make it past year two.

> [!IMPORTANT]
> Have the "closing the distance" conversation early — within the first few months of a serious relationship. It does not need to be a definitive plan, but you both need to know the other person is genuinely working toward the same end goal. Ambiguity here is relationship poison.

---

## Communication: Cadence Over Intensity

Many new long-distance couples make the mistake of overcommunicating in bursts and then hitting exhaustion. A sustainable cadence works far better.

**What works:**
- A short daily check-in (5–10 minutes) — a voice note, a quick video, a "good morning" message
- One longer video call per week where you have genuine conversation
- Shared content — sending each other articles, music, shows to watch together
- Surprise communication — a voice note at an unexpected moment

**What doesn't work:**
- Demanding constant availability and tracking online status
- Making the relationship the only topic of conversation
- Using communication volume as a measurement of love

> [!FOR_WOMEN]
> If you feel anxious when he does not respond quickly, name that anxiety to yourself rather than escalating to him immediately. Long-distance anxiety is normal. Before assuming the worst, ask yourself: "Is there a reasonable explanation?" A habit of checking in calmly rather than with fear is a skill worth developing.

> [!FOR_MEN]
> Consistency matters more than grand gestures over distance. Remembering the small things she mentioned — her sister's birthday, her interview, her difficult week — and following up on them is worth more than a dozen surprise flower deliveries. It signals that you actually listen.

---

## Managing Time Zones Without Resentment

Time zone differences — especially between Venezuela (UTC-4) and Europe (UTC+1 to +3), Asia-Pacific, or Australia — require active management.

**Practical strategies:**

1. Agree on a standing call time that works for both of you — put it in both calendars
2. Each person takes responsibility for one of the two standard call types (she might choose the weekly call time; he might handle the daily check-in schedule)
3. Keep a shared note with your time zones auto-converted so there is no confusion
4. Build flexibility for when life disrupts the schedule — a missed call is not a crisis

> [!TIP]
> Use a world clock app widget on your phone with her city so you always know what time it is for her before you message. It takes 10 seconds to set up and prevents a lot of 2am accidental wake-up calls.

---

## Planning Visits: The Rules That Make It Work

**First visit:**
- Keep it to 5–10 days maximum
- Stay in a separate accommodation (hotel or Airbnb) — this is important even in serious relationships
- Plan specific activities rather than unstructured time, which creates pressure
- Have at least one meeting with her family if the relationship is progressing seriously
- Have no major relationship decisions scheduled for the trip — let it be a natural experience

**Subsequent visits:**
- Alternate who bears the cost burden when finances allow
- Document your trip well — photos, shared experiences build the "story" of the relationship
- Extend the stay as trust and comfort grow
- If possible, visit her in her context before expecting her to visit yours

> [!WARNING]
> Do not propose marriage or make major relationship decisions on the first in-person visit. The in-person dynamic is different from the online dynamic and you need time to adjust to each other in the same space. Let the relationship breathe.

---

## Immigration: What You Both Need to Know

For relationships that progress toward closing the distance, immigration is unavoidable. Some key realities:

- **Visa timelines are long** — most processes take 12–24 months from application to approval
- **Denial rates are significant** — especially for Venezuelan nationals applying for visas to North America and Europe
- **Financial sponsorship is required** — most immigration routes require the sponsoring partner to demonstrate income and assets above a threshold
- **Criminal history on either side can be disqualifying** — even minor records in some jurisdictions
- **Marriage does not automatically grant residency** in most countries

> [!IMPORTANT]
> Get proper immigration legal advice before starting a visa process. Country-specific rules vary enormously and the wrong application category can result in multi-year bans. Many couples have been separated for years by avoidable procedural errors.

> [!NOTE]
> MatchVenezuelan does not provide immigration advice. For country-specific guidance, consult an accredited immigration attorney in the destination country. Many offer free 30-minute consultations.

---

## Maintaining Individuality Over Distance

A common long-distance trap is making the relationship the entirety of each person's social life because it is the primary source of emotional connection available. This creates unsustainable pressure on both people.

> [!TIP]
> Actively maintain friendships, hobbies, and social engagements outside the relationship. This is not a sign of low investment — it is the thing that keeps you mentally healthy and emotionally generous when you do connect. The happiest long-distance couples are those who each have a full life between calls.
$body_en_4$,

  '[
    {"q": "How long can a long-distance relationship realistically last?", "a": "Research and practical evidence suggest that long-distance relationships need a plan to close the distance within 2–3 years to remain sustainable for most people. Relationships with no closing plan become increasingly difficult to maintain. The distance itself is not the primary obstacle — uncertainty about the future is."},
    {"q": "How do we handle jealousy and trust over distance?", "a": "Trust is built through consistency over time, not through surveillance. Demanding to know where someone is at all times, checking their social media constantly, or requiring immediate responses signals anxiety that no amount of reassurance will permanently fix. If jealousy is a serious issue, addressing it through honest conversation is more effective than behavioral control."},
    {"q": "Who pays for visits when there is a significant income gap?", "a": "There is no universal rule, but most couples find a proportional contribution model works best — each person contributes according to their means. The important thing is that both people feel the arrangement is fair, which requires open conversation rather than assumption. Early visits can be split or alternated; later visits often become joint planning."},
    {"q": "What if her visa application is denied?", "a": "Visa denials are common and not permanent. Understanding the reason for denial is the first step — some reasons are correctable and a reapplication with stronger documentation succeeds. Others require a different immigration pathway. An immigration attorney is valuable here. Do not submit a second application without understanding why the first was denied."},
    {"q": "How do we maintain intimacy over distance?", "a": "Emotional intimacy is maintained through genuine communication — vulnerability, shared experiences (watching films together, reading the same book), surprise gestures, and remembering the small details of each other''s lives. Physical separation is real but couples who invest in emotional closeness are far better positioned for the transition to living together."}
  ]'::jsonb,

  '[
    {"label": "Venezuelan dating culture guide", "href": "/resources/venezuelan-dating-culture-guide"},
    {"label": "How to verify a profile before you fall", "href": "/resources/how-to-verify-a-profile-before-you-fall"},
    {"label": "Safety tips for women meeting men online", "href": "/resources/safety-tips-for-women-meeting-men-online"}
  ]'::jsonb,

  -- Spanish
  'Hacer Funcionar la Distancia: De Caracas al Mundo',
  'Estrategias prácticas para construir y sostener una relación a distancia con una pareja venezolana — cadencia de comunicación, gestión de zonas horarias, planificación de visitas e inmigración.',
  'Las relaciones a distancia entre mujeres venezolanas y parejas internacionales son comunes en esta plataforma. La mayoría de las parejas que superan la distancia comparten los mismos hábitos fundamentales. Aquí están.',

  $body_es_4$
## La Distancia Es Temporal — Pero Solo Si Planificas

El cambio de mentalidad más importante para el éxito a distancia: trata la distancia como un problema práctico temporal a resolver, no como un estado permanente a soportar.

> [!IMPORTANT]
> Ten la conversación sobre "cerrar la distancia" temprano — dentro de los primeros meses de una relación seria. Ambos necesitan saber que el otro está genuinamente trabajando hacia el mismo objetivo final. La ambigüedad aquí es veneno para la relación.

---

## Comunicación: Cadencia Sobre Intensidad

**Lo que funciona:** Una verificación diaria corta (5–10 minutos), una videollamada más larga por semana con conversación genuina, contenido compartido como artículos o series para ver juntos, y comunicación sorpresa.

**Lo que no funciona:** Exigir disponibilidad constante, usar el volumen de comunicación como medida del amor.

> [!FOR_WOMEN]
> Si sientes ansiedad cuando no responde rápidamente, nombra esa ansiedad para ti misma antes de escalarla hacia él de inmediato. Pregúntate: "¿Hay una explicación razonable?" Un hábito de verificar calmadamente es una habilidad que vale la pena desarrollar.

> [!FOR_MEN]
> La consistencia importa más que los grandes gestos a distancia. Recordar las pequeñas cosas que ella mencionó — el cumpleaños de su hermana, su entrevista, su semana difícil — vale más que una docena de entregas de flores sorpresa.

---

## Gestión de Zonas Horarias Sin Resentimiento

Las diferencias de zona horaria requieren gestión activa. Acuerda un horario de llamada fijo que funcione para ambos. Construye flexibilidad para cuando la vida interrumpa el horario.

> [!TIP]
> Usa un widget de reloj mundial en tu teléfono con su ciudad para que siempre sepas qué hora es para ella antes de enviar un mensaje. Tarda 10 segundos en configurar y evita muchas llamadas accidentales a las 2 de la madrugada.

---

## Planificación de Visitas: Las Reglas que Hacen que Funcione

**Primera visita:** Mantenla en un máximo de 5–10 días. Quédate en un alojamiento separado. Planifica actividades específicas. No programes grandes decisiones de relación para el viaje.

> [!WARNING]
> No propongas matrimonio ni tomes grandes decisiones de relación en la primera visita en persona. La dinámica en persona es diferente a la dinámica en línea y necesitan tiempo para adaptarse el uno al otro en el mismo espacio.

---

## Inmigración: Lo que Ambos Necesitan Saber

- Los plazos de visa son largos — la mayoría de los procesos toman 12–24 meses
- Las tasas de denegación son significativas — especialmente para ciudadanos venezolanos
- Se requiere patrocinio financiero en la mayoría de las rutas migratorias
- El matrimonio no otorga automáticamente residencia en la mayoría de los países

> [!IMPORTANT]
> Obtén asesoramiento legal de inmigración adecuado antes de iniciar un proceso de visa. Las reglas específicas de cada país varían enormemente y la categoría de solicitud incorrecta puede resultar en prohibiciones de varios años.

> [!NOTE]
> MatchVenezuelan no proporciona asesoramiento de inmigración. Para orientación específica por país, consulta a un abogado de inmigración acreditado en el país de destino.

---

## Mantener la Individualidad a Distancia

> [!TIP]
> Mantén activamente amistades, pasatiempos y compromisos sociales fuera de la relación. Las parejas a distancia más felices son aquellas que cada una tiene una vida plena entre llamadas.
$body_es_4$,

  '[
    {"q": "¿Cuánto tiempo puede durar realistamente una relación a distancia?", "a": "Las relaciones a distancia necesitan un plan para cerrar la distancia dentro de 2–3 años para ser sostenibles para la mayoría de las personas. La incertidumbre sobre el futuro es el principal obstáculo, no la distancia en sí."},
    {"q": "¿Cómo manejamos los celos y la confianza a distancia?", "a": "La confianza se construye a través de la consistencia a lo largo del tiempo, no a través de la vigilancia. Si los celos son un problema serio, abordarlo a través de una conversación honesta es más efectivo que el control conductual."},
    {"q": "¿Quién paga las visitas cuando hay una brecha de ingresos significativa?", "a": "La mayoría de las parejas encuentran que un modelo de contribución proporcional funciona mejor — cada persona contribuye según sus posibilidades. Lo importante es que ambas personas sientan que el arreglo es justo, lo que requiere una conversación abierta."},
    {"q": "¿Qué hacemos si su solicitud de visa es denegada?", "a": "Las denegaciones de visa son comunes y no son permanentes. Entender el motivo de la denegación es el primer paso. No presentes una segunda solicitud sin entender por qué fue denegada la primera."},
    {"q": "¿Cómo mantenemos la intimidad a distancia?", "a": "La intimidad emocional se mantiene a través de la comunicación genuina — vulnerabilidad, experiencias compartidas, gestos sorpresa y recordar los pequeños detalles de la vida del otro."}
  ]'::jsonb,

  '[
    {"label": "Guía de cultura del dating venezolano", "href": "/resources/venezuelan-dating-culture-guide"},
    {"label": "Cómo verificar un perfil antes de enamorarte", "href": "/resources/how-to-verify-a-profile-before-you-fall"},
    {"label": "Consejos de seguridad para mujeres", "href": "/resources/safety-tips-for-women-meeting-men-online"}
  ]'::jsonb
)

ON CONFLICT (slug) DO UPDATE SET
  category          = EXCLUDED.category,
  reading_minutes   = EXCLUDED.reading_minutes,
  featured          = EXCLUDED.featured,
  tags              = EXCLUDED.tags,
  title_en          = EXCLUDED.title_en,
  meta_description_en = EXCLUDED.meta_description_en,
  excerpt_en        = EXCLUDED.excerpt_en,
  body_en           = EXCLUDED.body_en,
  faq_en            = EXCLUDED.faq_en,
  internal_links_en = EXCLUDED.internal_links_en,
  title_es          = EXCLUDED.title_es,
  meta_description_es = EXCLUDED.meta_description_es,
  excerpt_es        = EXCLUDED.excerpt_es,
  body_es           = EXCLUDED.body_es,
  faq_es            = EXCLUDED.faq_es,
  internal_links_es = EXCLUDED.internal_links_es,
  updated_at        = now();
