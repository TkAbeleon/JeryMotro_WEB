import { useI18n } from "@/hooks/use-i18n";
import { AsyncState } from "@/components/ui/async-state";

interface LoadingPageProps {
  message?: string;
}

export default function LoadingPage({ message }: LoadingPageProps) {
  const { t } = useI18n();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 px-6 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-border/50 bg-card/80 p-6 shadow-xl sm:p-8">
        <AsyncState
          type="loading"
          title={message ?? t("common.loading")}
          description="JeryMotro prépare les données de surveillance."
          className="min-h-0 py-4"
        />
      </div>
    </div>
  );
}
