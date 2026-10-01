import Link from "next/link";
import { ChevronLeftIcon } from "@/components/icons";
import { QrReviewItem } from "@/components/qr-review";
import { QrSimulate } from "@/components/qr-simulate";
import { Amount, Badge, Card, SectionHeader } from "@/components/ui";
import { listCustomers } from "@/lib/data/customers";
import { formatDate } from "@/lib/format";
import { getLang, getT } from "@/lib/i18n/server";
import { ensureShopQr, listQrPayments } from "@/lib/payments/qr";
import { requireSandbox } from "@/lib/sandbox/server";
import { SHARED_FAMILY_VPA } from "@/lib/seed/demo-seed";
import { supabaseAdmin } from "@/lib/supabase/admin";

/** UD-19 Shop QR: the QR itself, payments to review, and a demo simulator. */
export default async function ShopQrPage() {
  const [t, lang, sandboxId] = await Promise.all([getT(), getLang(), requireSandbox()]);
  const [qr, { pending, recent }, customers, vpaRows] = await Promise.all([
    ensureShopQr(sandboxId),
    listQrPayments(sandboxId),
    listCustomers(sandboxId),
    supabaseAdmin()
      .from("payments")
      .select("payer_vpa, customers(name)")
      .eq("sandbox_id", sandboxId)
      .not("payer_vpa", "is", null)
      .neq("payer_vpa", SHARED_FAMILY_VPA),
  ]);
  const knownVpas = [
    ...new Map(
      ((vpaRows.data ?? []) as unknown as { payer_vpa: string; customers: { name: string } }[]).map((r) => [
        r.payer_vpa,
        { vpa: r.payer_vpa, name: r.customers.name },
      ]),
    ).values(),
  ].sort((a, b) => a.name.localeCompare(b.name));
  const pickable = customers.map(({ id, name }) => ({ id, name }));

  return (
    <div className="space-y-5">
      <Link href="/app" className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
        <ChevronLeftIcon size={16} />
        {t("nav.home")}
      </Link>
      <div>
        <SectionHeader title={t("qr.title")} />
        <p className="-mt-2 text-sm text-ink-muted">{t("qr.subtitle")}</p>
      </div>
      <Card className="flex justify-center p-4">
        {/* Razorpay's printable QR poster (PNG). Served by Razorpay, so a plain img is right here. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qr.imageUrl} alt={t("qr.title")} className="max-h-96 w-auto rounded-sm" />
      </Card>

      <section className="space-y-3">
        <h3 className="font-heading text-base font-semibold text-ink">{t("qr.review")}</h3>
        {pending.length === 0 ? (
          <Card className="p-4 text-sm text-ink-muted">{t("qr.nothingToReview")}</Card>
        ) : (
          pending.map((item) => <QrReviewItem key={item.id} item={item} customers={pickable} />)
        )}
      </section>

      {recent.length > 0 && (
        <section>
          <h3 className="mb-2 font-heading text-base font-semibold text-ink">{t("qr.recent")}</h3>
          <Card className="overflow-hidden">
            <ul>
              {recent.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 last:border-b-0">
                  <div className="min-w-0">
                    <Amount paise={r.amountPaise} size="sm" />
                    <p className="mt-0.5 truncate text-xs text-ink-muted">
                      {r.payerVpa ?? t("qr.unknownVpa")} · {formatDate(r.receivedAt, lang)}
                    </p>
                  </div>
                  <Badge tone={r.status === "matched" ? "positive" : "neutral"}>
                    {r.status === "matched" ? t("qr.matched", { name: r.customerName ?? "" }) : t("qr.markedSale")}
                  </Badge>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      )}

      <QrSimulate knownVpas={knownVpas} familyVpa={SHARED_FAMILY_VPA} />
    </div>
  );
}
