'use client';

import { CreditCard, ShieldCheck, Receipt, Sparkles, Download, Loader2 } from 'lucide-react';
import { useBillingHistory, useDownloadInvoicePDF, billingFormatters } from '@/src/hooks/useBilling';
import { Button } from '@/src/components/ui/button';

export default function BillingPage() {
  const { data: billingHistory, isLoading: isLoadingBilling, error: billingError } = useBillingHistory();

  // Obtener el plan activo más reciente
  const activePlan = billingHistory?.payments?.find(p => p.status === 'authorized');
  
  // Calcular próxima renovación (sumar 30 o 365 días según plan)
  const nextRenewalDate = activePlan?.authorized_at
    ? new Date(new Date(activePlan.authorized_at).getTime() + (activePlan.plan === 'annual' ? 365 : 30) * 24 * 60 * 60 * 1000)
    : null;

  return (
    <div className="space-y-6">
      <header className="relative overflow-hidden rounded-2xl border border-surface-container bg-gradient-to-br from-surface-raised to-surface-default p-6 md:p-8">
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-brand-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-8 bottom-0 h-28 w-28 rounded-full bg-brand-accent/10 blur-2xl" />
        <div className="relative z-10 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-text-tertiary">Facturación</p>
            <h1 className="mt-2 text-3xl font-black text-text-primary">Tu Plan y Pagos</h1>
            <p className="mt-2 max-w-2xl text-sm text-text-secondary">
              Administra tu suscripción, método de pago e historial de boletas en un solo lugar.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-primary/30 bg-brand-primary/15 px-3 py-1.5 text-xs font-bold text-brand-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Zona segura
          </span>
        </div>
      </header>

      {billingError && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-700">
          Error al cargar datos de facturación. Por favor, intenta de nuevo.
        </div>
      )}

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <article className="glass-card p-6 lg:col-span-2">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-lg bg-brand-primary/20 p-2 text-brand-primary">
              <CreditCard className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-black text-text-primary">Plan Actual</h2>
          </div>

          {isLoadingBilling ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
              <span className="ml-2 text-sm text-text-secondary">Cargando...</span>
            </div>
          ) : activePlan ? (
            <div className="rounded-xl border border-surface-container bg-surface-default/70 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-text-primary">{billingFormatters.getPlanLabel(activePlan.plan)} TutorPAES</p>
                  <p className="text-xs text-text-tertiary">Renovación automática {activePlan.plan === 'annual' ? 'anual' : 'mensual'}</p>
                </div>
                <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400">
                  Activo
                </span>
              </div>
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-text-tertiary">Precio</p>
                  <p className="mt-1 text-lg font-black text-text-primary">{billingFormatters.formatCurrency(activePlan.amount)}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-text-tertiary">Próximo Cobro</p>
                  <p className="mt-1 text-lg font-black text-text-primary">
                    {nextRenewalDate ? billingFormatters.formatDate(nextRenewalDate.toISOString().split('T')[0]) : 'Cargando...'}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-text-tertiary">Estado</p>
                  <p className="mt-1 text-lg font-black text-emerald-400">Al día</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-surface-container bg-surface-default/50 p-8 text-center">
              <p className="text-sm font-bold text-text-primary">Sin plan activo</p>
              <p className="mt-1 text-xs text-text-tertiary">
                Elige un plan en nuestra página de precios para comenzar.
              </p>
            </div>
          )}
        </article>

        <article className="glass-card p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-lg bg-brand-accent/20 p-2 text-brand-accent">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-black text-text-primary">Método</h2>
          </div>
          <div className="rounded-xl border border-surface-container bg-surface-default/70 p-4">
            <p className="text-xs text-text-tertiary">Tarjeta guardada</p>
            <p className="mt-1 text-base font-black text-text-primary">**** **** **** 4242</p>
            <p className="mt-2 text-xs text-text-tertiary">Vence 08/28</p>
          </div>
          <button
            type="button"
            className="mt-4 w-full rounded-xl border border-surface-container bg-surface-raised px-4 py-2.5 text-sm font-bold text-text-primary transition-colors hover:bg-surface-container"
          >
            Actualizar método
          </button>
        </article>
      </section>

      {/* Historial de Boletas */}
      <section className="glass-card p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-lg bg-brand-secondary/20 p-2 text-brand-secondary">
            <Receipt className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-black text-text-primary">Historial de Boletas</h2>
        </div>

        {isLoadingBilling ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
          </div>
        ) : billingHistory?.payments && billingHistory.payments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-container">
                  <th className="px-4 py-3 text-left font-black text-text-primary">Número</th>
                  <th className="px-4 py-3 text-left font-black text-text-primary">Fecha</th>
                  <th className="px-4 py-3 text-left font-black text-text-primary">Plan</th>
                  <th className="px-4 py-3 text-right font-black text-text-primary">Monto</th>
                  <th className="px-4 py-3 text-center font-black text-text-primary">Estado</th>
                  <th className="px-4 py-3 text-center font-black text-text-primary">Acción</th>
                </tr>
              </thead>
              <tbody>
                {billingHistory.payments.map((payment) => (
                  <tr key={payment.payment_id} className="border-b border-surface-container hover:bg-surface-raised/50">
                    <td className="px-4 py-3 font-bold text-text-primary">
                      {payment.invoice?.invoice_number || payment.buy_order}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {payment.created_at ? billingFormatters.formatDate(payment.created_at) : '-'}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {billingFormatters.getPlanLabel(payment.plan)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-text-primary">
                      {billingFormatters.formatCurrency(payment.amount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block rounded-full px-2 py-1 text-xs font-bold ${billingFormatters.getStatusColor(payment.status)}`}>
                        {billingFormatters.getStatusLabel(payment.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {payment.invoice && payment.status === 'authorized' ? (
                        <InvoiceDownloadButton invoiceId={payment.invoice.id} />
                      ) : (
                        <span className="text-xs text-text-tertiary">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-surface-container bg-surface-default/50 p-8 text-center">
            <p className="text-sm font-bold text-text-primary">Aún no hay boletas emitidas</p>
            <p className="mt-1 text-xs text-text-tertiary">
              Cuando se registre un cobro, lo verás aquí para descargar.
            </p>
          </div>
        )}
      </section>

      {/* Resumen de Gasto */}
      {billingHistory && billingHistory.count > 0 && (
        <section className="glass-card p-6">
          <h3 className="mb-4 text-lg font-black text-text-primary">Resumen</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-surface-container bg-surface-default/50 p-4">
              <p className="text-xs font-bold uppercase text-text-tertiary">Total Gastado</p>
              <p className="mt-2 text-2xl font-black text-text-primary">
                {billingFormatters.formatCurrency(billingHistory.total_spent)}
              </p>
            </div>
            <div className="rounded-lg border border-surface-container bg-surface-default/50 p-4">
              <p className="text-xs font-bold uppercase text-text-tertiary">Transacciones</p>
              <p className="mt-2 text-2xl font-black text-text-primary">{billingHistory.count}</p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

/**
 * Componente auxiliar para botón de descarga
 */
function InvoiceDownloadButton({ invoiceId }: { invoiceId: number }) {
  const { handleDownload } = useDownloadInvoicePDF(invoiceId);
  const [isDownloading, setIsDownloading] = React.useState(false);

  const onDownload = async () => {
    setIsDownloading(true);
    try {
      await handleDownload();
    } catch (error) {
      console.error('Download error:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button
      onClick={onDownload}
      disabled={isDownloading}
      size="sm"
      className="inline-flex items-center gap-2"
    >
      {isDownloading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Download className="h-3.5 w-3.5" />
      )}
      {isDownloading ? 'Descargando...' : 'Descargar'}
    </Button>
  );
}

// Re-export React for use in component
import React from 'react';