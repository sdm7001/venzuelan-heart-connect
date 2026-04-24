import { MessageCircle } from "lucide-react";
import { AppLayout, EmptyState, PageHeader } from "@/components/layout/AppLayout";
import { useI18n } from "@/i18n/I18nProvider";

export default function Messages() {
  const { t } = useI18n();
  return (
    <AppLayout>
      <PageHeader title={t.messages.title} />
      <EmptyState icon={<MessageCircle className="h-5 w-5" />} title={t.messages.title} body={t.messages.empty} />
    </AppLayout>
  );
}
