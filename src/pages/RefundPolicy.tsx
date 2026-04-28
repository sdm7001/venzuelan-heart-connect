import { useI18n } from "@/i18n/I18nProvider";
import { useSeo } from "@/seo/seo";
import { LegalShell, type LegalSection } from "@/components/legal/LegalShell";

export default function RefundPolicy() {
  const { lang } = useI18n();
  const isEs = lang === "es";

  useSeo(
    {
      title: isEs ? "Política de Reembolsos" : "Refund Policy",
      description: isEs
        ? "Política de reembolsos de MatchVenezuelan: suscripciones, paquetes de créditos, regalos virtuales y físicos, derecho de desistimiento de la UE/Reino Unido y reembolsos por fraude."
        : "MatchVenezuelan refund policy: subscriptions, credit packs, virtual and physical gifts, EU/UK right of withdrawal and fraud-related refunds.",
      path: isEs ? "/es/legal/refunds" : "/legal/refunds",
      lang,
      robots: "index,follow",
      alternates: [
        { hreflang: "en", href: "https://matchvenezuelan.com/legal/refunds" },
        { hreflang: "es", href: "https://matchvenezuelan.com/es/legal/refunds" },
        { hreflang: "x-default", href: "https://matchvenezuelan.com/legal/refunds" },
      ],
    },
    [lang],
  );

  const intro = isEs
    ? "Esta Política de Reembolsos explica cuándo y cómo puedes solicitar un reembolso por las compras realizadas en MatchVenezuelan: suscripciones de hombre (Nivel 1, Nivel 2, Premium), paquetes de créditos, regalos virtuales y, en el futuro, regalos físicos. Forma parte de los Términos de Servicio. Esta política respeta los derechos del consumidor obligatorios en la UE, el Reino Unido y otras jurisdicciones; cuando una norma local imperativa te conceda derechos más amplios, prevalecerá esa norma."
    : "This Refund Policy explains when and how you can request a refund for purchases made on MatchVenezuelan: men's subscriptions (Level 1, Level 2, Premium), credit packs, virtual gifts and, in the future, physical gifts. It forms part of the Terms of Service. This policy honors mandatory consumer rights in the EU, UK and other jurisdictions; where local mandatory law gives you broader rights, that local law prevails.";

  const sections: LegalSection[] = isEs
    ? [
        { heading: "1. Resumen",
          summary: "Lo esencial en pocas líneas.",
          callout: { tone: "info", title: "En resumen",
            body: "Las mujeres no pagan. Los hombres pueden cancelar la renovación cuando quieran. Los reembolsos se rigen por las secciones de abajo y por la ley aplicable." },
          items: [
          "Las suscripciones se cobran por adelantado por el período elegido (mensual, trimestral, anual). Tras una compra exitosa, tienes acceso inmediato al contenido digital y a las funciones de pago.",
          "Las mujeres no pagan por usar el servicio, por lo que esta política no aplica a cuentas femeninas.",
          "Los hombres pueden cancelar la renovación automática en cualquier momento desde Configuración → Facturación. La cancelación detiene futuros cargos pero no genera por sí sola un reembolso del período ya pagado, salvo lo previsto en las secciones siguientes y en la ley aplicable.",
        ]},
        { heading: "2. Derecho de desistimiento (UE / EEE / Reino Unido)",
          summary: "14 días para desistir de un servicio digital, con matices.",
          callout: { tone: "legal", title: "Derecho legal",
            body: "Residentes en la UE/EEE/Reino Unido: 14 días naturales desde la compra para desistir, salvo la parte ya consumida. Escribe a billing@matchvenezuelan.com." },
          items: [
          "Si resides en la UE, el EEE o el Reino Unido, tienes derecho a desistir de un contrato de servicios digitales en un plazo de 14 días naturales desde la compra, sin necesidad de justificarlo.",
          "Importante: al iniciar tu suscripción o usar tus créditos/regalos, se te pide reconocer expresamente que el servicio digital comienza inmediatamente y que, en consecuencia, pierdes el derecho de desistimiento sobre la parte ya consumida (mensajes enviados, contactos iniciados, regalos entregados, créditos gastados, verificación realizada). Esta condición se ajusta al art. 16(m) de la Directiva (UE) 2011/83 sobre derechos de los consumidores y a la legislación local de transposición.",
          "Para ejercer el derecho de desistimiento dentro de los 14 días, escríbenos a billing@matchvenezuelan.com indicando tu nombre, correo de la cuenta, fecha de compra e identificador de transacción. Reembolsaremos la parte no consumida usando el mismo método de pago en un plazo máximo de 14 días desde la recepción de tu solicitud.",
        ]},
        { heading: "3. Suscripciones (Nivel 1, Nivel 2, Premium)",
          summary: "Renovación, cancelación, fallos técnicos y cambios de plan.",
          items: [
          "Renovación automática: las suscripciones se renuevan automáticamente al final del período actual al precio vigente. Recibirás un correo recordatorio antes de la renovación de planes anuales.",
          "Cancelación: puedes cancelar la renovación en cualquier momento desde Configuración → Facturación. Mantendrás el acceso hasta el final del período pagado y no se te volverá a cobrar.",
          "Reembolso prorrateado por error técnico: si una caída del servicio atribuible a nosotros impide significativamente el uso de tu suscripción durante más de 72 horas continuas, podrás solicitar un crédito o reembolso prorrateado por los días afectados.",
          "Cambios involuntarios de plan: si actualizas o degradas tu plan, prorrateamos el período restante. Las degradaciones no generan reembolso en efectivo: el saldo restante se aplica como crédito al nuevo plan.",
          "Sin reembolso por uso parcial voluntario: si simplemente decides no usar el servicio durante el período contratado, no se generan reembolsos parciales fuera del derecho de desistimiento de 14 días en la UE/Reino Unido.",
        ]},
        { heading: "4. Paquetes de créditos",
          summary: "Una vez gastado el primer crédito, el paquete deja de ser reembolsable.",
          items: [
          "Los créditos comprados son no reembolsables una vez que se ha gastado al menos un crédito del paquete adquirido, ya que el servicio digital se ha consumido y prestado de forma personalizada.",
          "Si nunca has gastado créditos del paquete, puedes solicitar un reembolso en los 14 días posteriores a la compra (UE/Reino Unido) o en los 7 días posteriores a la compra (resto de jurisdicciones, como cortesía comercial).",
          "Los créditos no caducan mientras tu cuenta esté activa. Si cierras tu cuenta voluntariamente, los créditos no utilizados se pierden y no se reembolsan, salvo obligación legal.",
        ]},
        { heading: "5. Regalos virtuales",
          summary: "Entrega instantánea — y, por tanto, no reembolsables tras el envío.",
          items: [
          "Los regalos virtuales (P2) se entregan instantáneamente al destinatario y no son reembolsables una vez enviados.",
          "Si un regalo virtual se rechaza, se retiene por moderación o no puede entregarse por motivos del sistema, te devolveremos automáticamente los créditos o el importe equivalente en un plazo de 7 días, sin necesidad de solicitarlo.",
          "Los regalos enviados a cuentas que posteriormente sean baneadas por fraude u otra violación grave pueden reembolsarse al remitente, en créditos, caso por caso.",
        ]},
        { heading: "6. Regalos físicos (cuando estén disponibles)",
          summary: "Reglas específicas para envíos físicos a través de proveedores externos.",
          items: [
          "Los regalos físicos (P3) se contratan a proveedores externos (floristerías, cestas, joyería, etc.). Una vez confirmada la orden y enviada al proveedor, no aceptamos cancelaciones.",
          "Si el proveedor no logra entregar el regalo o el destinatario lo rechaza, organizaremos un reenvío equivalente o, si no es posible, te reembolsaremos el importe pagado, descontando comisiones del proveedor cuando proceda.",
          "Los daños o defectos del producto deben reportarse en un plazo de 72 horas desde la entrega, con fotografías. Gestionaremos un reemplazo o reembolso conforme a las condiciones del proveedor.",
        ]},
        { heading: "7. Cobros duplicados, errores y fraude",
          summary: "Qué hacer si ves un cargo que no reconoces.",
          callout: { tone: "warning", title: "Antes de un chargeback",
            body: "Contáctanos primero en billing@matchvenezuelan.com. Resolvemos la mayoría de incidencias en pocos días y evitamos suspensiones automáticas." },
          items: [
          "Si detectas un cargo duplicado, un cargo no autorizado o un cargo por un importe incorrecto, escríbenos a billing@matchvenezuelan.com en un plazo máximo de 60 días desde la fecha del cargo. Investigaremos y, cuando proceda, reembolsaremos íntegramente.",
          "Si tu cuenta o método de pago fue usado por un tercero sin tu autorización, repórtalo de inmediato. Cooperaremos con tu banco y, si confirmamos el fraude, reembolsaremos los cargos afectados.",
          "Las disputas (chargebacks) abiertas sin contactar antes a soporte pueden derivar en la suspensión de la cuenta hasta su resolución, conforme a las normas de las redes de tarjetas y de los procesadores de pago.",
        ]},
        { heading: "8. Cuentas suspendidas o cerradas por violación",
          summary: "Las violaciones materiales no generan reembolso por períodos no usados.",
          items: [
          "Si suspendemos o cerramos tu cuenta por una violación material de los Términos, la Política de Uso Aceptable o la Política Anti-Solicitación (incluida la solicitud de actos sexuales pagados, fraude, suplantación o comportamiento abusivo), no se concederán reembolsos por el período no usado, los créditos restantes ni los regalos pendientes, conforme a la sección 9 de los Términos.",
          "Cuando la ley imperativa de tu país exija un reembolso parcial, lo respetaremos.",
        ]},
        { heading: "9. Cómo solicitar un reembolso",
          summary: "El proceso, los plazos y la información que debes incluir.",
          callout: { tone: "success", title: "Plazos de respuesta",
            body: "Acuse en ≤ 2 días hábiles. Resolución de la mayoría de casos en ≤ 10 días hábiles." },
          items: [
          "Envía un correo a billing@matchvenezuelan.com desde la dirección asociada a tu cuenta. Incluye: tu nombre completo, identificador de la cuenta o correo, fecha y monto de la transacción, identificador de la transacción (si lo conoces) y el motivo de la solicitud.",
          "Confirmaremos la recepción en un máximo de 2 días hábiles y resolveremos la mayoría de las solicitudes en un máximo de 10 días hábiles. Los reembolsos aprobados se procesan al método de pago original; el tiempo en que se reflejen depende de tu banco o emisor.",
          "Si necesitas asistencia urgente por seguridad o sospecha de fraude, escribe simultáneamente a trust@matchvenezuelan.com.",
        ]},
        { heading: "10. Impuestos",
          summary: "Cómo se tratan los impuestos en los reembolsos.",
          items: [
          "Los precios mostrados pueden incluir o excluir impuestos según tu país. En reembolsos parciales o totales, los impuestos cobrados se reembolsan proporcionalmente conforme a la normativa aplicable.",
        ]},
        { heading: "11. Cambios a esta Política",
          summary: "Aviso anticipado de cambios materiales.",
          items: [
          "Podemos actualizar esta política para reflejar cambios en el producto, en los proveedores de pago o en la regulación. Anunciaremos los cambios materiales con antelación razonable y, cuando proceda, te notificaremos por correo.",
        ]},
        { heading: "12. Contacto",
          summary: "Dónde escribir según el tema.",
          items: [
          "Facturación y reembolsos: billing@matchvenezuelan.com · Confianza y Seguridad: trust@matchvenezuelan.com · Asuntos legales: legal@matchvenezuelan.com.",
        ]},
      ]
    : [
        { heading: "1. Summary",
          summary: "The essentials in a few lines.",
          callout: { tone: "info", title: "In short",
            body: "Women never pay. Men can cancel auto-renewal at any time. Refunds follow the sections below and applicable law." },
          items: [
          "Subscriptions are charged in advance for the period you select (monthly, quarterly, annual). After a successful purchase, you immediately receive access to the digital content and paid features.",
          "Women do not pay to use the service, so this policy does not apply to female accounts.",
          "Men can cancel auto-renewal at any time from Settings → Billing. Canceling stops future charges but does not, by itself, refund the period already paid for, except as set out in the sections below and as required by applicable law.",
        ]},
        { heading: "2. Right of withdrawal (EU / EEA / UK)",
          summary: "14 days to withdraw from a digital service, with caveats.",
          callout: { tone: "legal", title: "Your statutory right",
            body: "EU/EEA/UK residents: 14 calendar days from purchase to withdraw, except for the portion already consumed. Email billing@matchvenezuelan.com." },
          items: [
          "If you reside in the EU, EEA or UK, you have the right to withdraw from a digital-services contract within 14 calendar days of purchase, without giving any reason.",
          "Important: when starting your subscription or using your credits/gifts, you are asked to expressly acknowledge that the digital service begins immediately and that, as a result, you lose the right of withdrawal over the portion already consumed (messages sent, contacts initiated, gifts delivered, credits spent, verification performed). This follows Article 16(m) of EU Directive 2011/83 on consumer rights and equivalent local law.",
          "To exercise the right of withdrawal within 14 days, email billing@matchvenezuelan.com with your name, account email, purchase date and transaction ID. We will refund the unused portion via the original payment method within 14 days of receiving your request.",
        ]},
        { heading: "3. Subscriptions (Level 1, Level 2, Premium)",
          summary: "Renewal, cancellation, technical failures and plan changes.",
          items: [
          "Auto-renewal: subscriptions automatically renew at the end of the current period at the then-current price. You will receive a reminder email before annual renewals.",
          "Cancellation: you can cancel auto-renewal at any time from Settings → Billing. You keep access until the end of the paid period and you will not be charged again.",
          "Pro-rated refund for technical failure: if an outage attributable to us materially prevents use of your subscription for more than 72 continuous hours, you may request a credit or pro-rated refund for the affected days.",
          "Plan changes: when you upgrade or downgrade, we pro-rate the remaining period. Downgrades do not produce a cash refund: the remaining balance is applied as credit to the new plan.",
          "No refund for voluntary partial use: if you simply choose not to use the service during the contracted period, no partial refund is owed beyond the 14-day right of withdrawal in the EU/UK.",
        ]},
        { heading: "4. Credit packs",
          summary: "Once the first credit is spent, the pack is no longer refundable.",
          items: [
          "Purchased credits are non-refundable once at least one credit from the purchased pack has been spent, since the digital service has been delivered and consumed in a personalized way.",
          "If you have not spent any credits from the pack, you may request a refund within 14 days of purchase (EU/UK) or within 7 days (other jurisdictions, as a goodwill courtesy).",
          "Credits do not expire while your account is active. If you voluntarily close your account, unused credits are forfeited and not refunded, unless required by law.",
        ]},
        { heading: "5. Virtual gifts",
          summary: "Delivered instantly — and therefore non-refundable once sent.",
          items: [
          "Virtual gifts (P2) are delivered instantly to the recipient and are non-refundable once sent.",
          "If a virtual gift is rejected, held by moderation, or cannot be delivered for system reasons, we will automatically return the credits or equivalent amount within 7 days, with no need to request it.",
          "Gifts sent to accounts that are later banned for fraud or another serious violation may be refunded to the sender, in credits, on a case-by-case basis.",
        ]},
        { heading: "6. Physical gifts (when available)",
          summary: "Specific rules for physical shipments via external vendors.",
          items: [
          "Physical gifts (P3) are fulfilled by external vendors (florists, gift baskets, jewelry, etc.). Once the order is confirmed and sent to the vendor, we cannot accept cancellations.",
          "If the vendor cannot deliver the gift, or the recipient refuses it, we will arrange an equivalent re-delivery or, if not possible, refund the amount paid, less vendor fees where applicable.",
          "Damage or defects must be reported within 72 hours of delivery, with photos. We will arrange a replacement or refund subject to the vendor's terms.",
        ]},
        { heading: "7. Duplicate charges, errors and fraud",
          summary: "What to do if you see a charge you do not recognize.",
          callout: { tone: "warning", title: "Before opening a chargeback",
            body: "Email billing@matchvenezuelan.com first. We resolve most issues within days and avoid automatic account suspensions." },
          items: [
          "If you spot a duplicate charge, an unauthorized charge or a charge for an incorrect amount, email billing@matchvenezuelan.com within 60 days of the charge date. We will investigate and, where appropriate, refund in full.",
          "If your account or payment method was used by a third party without your authorization, report it immediately. We will cooperate with your bank and, if we confirm fraud, refund the affected charges.",
          "Disputes (chargebacks) opened without first contacting support may result in your account being suspended until resolution, in line with card-network and payment-processor rules.",
        ]},
        { heading: "8. Accounts suspended or terminated for violation",
          summary: "Material breaches do not entitle you to a refund of unused periods.",
          items: [
          "If we suspend or terminate your account for a material breach of the Terms, the Acceptable Use Policy or the Anti-Solicitation Policy (including soliciting paid sexual acts, fraud, impersonation or abusive behavior), no refund will be granted for the unused period, remaining credits or pending gifts, in line with section 9 of the Terms.",
          "Where mandatory law in your country requires a partial refund, we will honor it.",
        ]},
        { heading: "9. How to request a refund",
          summary: "The process, the timelines and what to include.",
          callout: { tone: "success", title: "Response timelines",
            body: "Acknowledgement within 2 business days. Most cases resolved within 10 business days." },
          items: [
          "Email billing@matchvenezuelan.com from the address associated with your account. Include: your full name, account ID or email, transaction date and amount, transaction ID (if known) and the reason for the request.",
          "We acknowledge receipt within 2 business days and resolve most requests within 10 business days. Approved refunds are processed to the original payment method; the time it takes to appear depends on your bank or issuer.",
          "If you need urgent help due to security or suspected fraud, also email trust@matchvenezuelan.com.",
        ]},
        { heading: "10. Taxes",
          summary: "How taxes are treated in refunds.",
          items: [
          "Displayed prices may include or exclude taxes depending on your country. On full or partial refunds, taxes collected are refunded proportionally in line with applicable rules.",
        ]},
        { heading: "11. Changes to this Policy",
          summary: "Reasonable advance notice for material changes.",
          items: [
          "We may update this policy to reflect changes in the product, payment providers or regulation. We will announce material changes with reasonable advance notice and, where appropriate, notify you by email.",
        ]},
        { heading: "12. Contact",
          summary: "Where to write depending on the topic.",
          items: [
          "Billing and refunds: billing@matchvenezuelan.com · Trust & Safety: trust@matchvenezuelan.com · Legal: legal@matchvenezuelan.com.",
        ]},
      ];

  return (
    <LegalShell
      title={isEs ? "Política de Reembolsos" : "Refund Policy"}
      effective="2026-01-01"
      lastUpdated="2026-04"
      intro={intro}
      sections={sections}
    />
  );
}
