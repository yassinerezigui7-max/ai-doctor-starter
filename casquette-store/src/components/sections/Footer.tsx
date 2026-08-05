import { config } from "@/config/site.config";
import { t } from "@/config/copy.fr";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-line py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 text-center">
        <p className="font-display text-h3 text-primary">{config.store.name}</p>
        {config.store.whatsapp !== "" && (
          <a
            className="text-small text-muted underline-offset-4 hover:text-primary hover:underline"
            href={`https://wa.me/${config.store.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            WhatsApp : +{config.store.whatsapp}
          </a>
        )}
        <p className="text-small text-muted">{t("footer.deliveryNote")}</p>
        <p className="text-micro text-muted/80">
          {t("footer.rights", { year, store: config.store.name })}
        </p>
      </div>
    </footer>
  );
}
