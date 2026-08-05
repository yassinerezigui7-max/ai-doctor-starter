import { t } from "@/config/copy.fr";
import { OrderFormLoader } from "@/components/order/OrderFormLoader";
import { Reveal } from "@/components/ui/Reveal";

export function OrderSection() {
  return (
    <section
      id="commander"
      aria-labelledby="order-title"
      className="mx-auto max-w-xl scroll-mt-6 px-4 py-16 md:py-28"
    >
      <Reveal className="mb-8 text-center">
        <p className="eyebrow mb-2">{t("order.eyebrow")}</p>
        <h2 id="order-title" className="font-display text-h2 text-ink">
          {t("order.title")}
        </h2>
        <p className="mt-2 text-small text-muted">{t("order.subtitle")}</p>
      </Reveal>
      <OrderFormLoader />
    </section>
  );
}
