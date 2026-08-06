'use client';

import React from 'react';
import { CreditCard, ShieldCheck, Receipt, Sparkles, Download, Loader2, AlertTriangle } from 'lucide-react';
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
    <div className="max-w-6xl mx-auto space-y-10 text-white animate-in fade-in duration-500">
      {/* Header */}
      <div className="border-b border-white/10 pb-6 mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <CreditCard className="h-5 w-5 text-brand-primary animate-pulse" />
            <span className="text-[10px] font-mono font-black uppercase tracking-[0.3em] text-brand-primary">
              Facturación / Zona Segura de Pagos
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-text-primary uppercase tracking-tight">
            Tu Plan y Pagos
          </h1>
          <p className="text-text-tertiary font-medium mt-1">
            Administra tu suscripción, método de pago e historial de boletas en un solo lugar.
          </p>
        </div>
        <span className="self-start md:self-auto inline-flex items-center gap-2 rounded-lg border border-brand-primary/30 bg-brand-primary/10 px-3 py-1.5 text-[9px] font-mono font-black uppercase tracking-widest text-brand-primary">
          <Sparkles className="h-3.5 w-3.5 animate-pulse" />
          Conexión Segura
        </span>
      </div>

      {billingError && (
        <div className="glass-card p-6 border-brand-danger/30 bg-brand-danger/5 flex items-start gap-4 animate-error-shake">
          <AlertTriangle className="h-6 w-6 text-brand-danger shrink-0 mt-0.5" />
          <div>
            <p className="text-brand-danger font-black uppercase tracking-widest text-sm">Error del Sistema</p>
            <p className="text-text-secondary text-sm mt-1">Error al cargar datos de facturación. Por favor, intenta de nuevo.</p>
          </div>
        </div>
      )}

      {/* Subscription Card & Payment Method */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <article className="glass-card p-8 lg:col-span-2 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-primary/5 blur-[40px] rounded-full" />
          
          <div className="mb-6 flex items-center gap-3 border-b border-white/5 pb-4">
            <div className="p-2 bg-brand-primary/10 border border-brand-primary/20">
              <CreditCard className="h-5 w-5 text-brand-primary" />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase tracking-tight text-white">Plan de Suscripción</h2>
              <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">Estado de cuenta vigente</p>
            </div>
          </div>

          {isLoadingBilling ? (
            <div className="flex flex-col items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-brand-primary mb-3" />
              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Sincronizando estado...</p>
            </div>
          ) : activePlan ? (
            <div className="bg-black/30 border border-white/5 p-6 rounded-2xl space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-4">
                <div>
                  <p className="text-base font-black text-text-primary uppercase tracking-tight">
                    {billingFormatters.getPlanLabel(activePlan.plan)} TutorPAES
                  </p>
                  <p className="text-xs text-text-tertiary">Renovación automática {activePlan.plan === 'annual' ? 'anual' : 'mensual'}</p>
                </div>
                <span className="rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-[9px] font-mono font-black uppercase tracking-widest text-green-400">
                  Activo
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 text-xs">
                <div>
                  <p className="font-mono font-black uppercase tracking-wide text-zinc-500">Monto del Plan</p>
                  <p className="mt-1 text-lg font-black text-text-primary tracking-tighter">
                    {billingFormatters.formatCurrency(activePlan.amount)}
                  </p>
                </div>
                <div>
                  <p className="font-mono font-black uppercase tracking-wide text-zinc-500">Próximo Cobro</p>
                  <p className="mt-1 text-lg font-black text-brand-primary tracking-tighter">
                    {nextRenewalDate ? billingFormatters.formatDate(nextRenewalDate.toISOString().split('T')[0]) : 'Cargando...'}
                  </p>
                </div>
                <div>
                  <p className="font-mono font-black uppercase tracking-wide text-zinc-500">Estado de Pago</p>
                  <p className="mt-1 text-lg font-black text-green-400 tracking-tighter uppercase font-mono">Al día</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="border border-dashed border-white/10 bg-white/[0.01] p-10 text-center rounded-2xl">
              <p className="text-sm font-bold text-text-primary uppercase">Sin suscripción activa</p>
              <p className="mt-1 text-xs text-text-tertiary max-w-sm mx-auto">
                Elige uno de nuestros planes premium para desbloquear análisis avanzados y preguntas ilimitadas con Tuto.
              </p>
            </div>
          )}
        </article>

        <article className="glass-card p-8 relative overflow-hidden group flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-accent/5 blur-[40px] rounded-full" />
          
          <div>
            <div className="mb-6 flex items-center gap-3 border-b border-white/5 pb-4">
              <div className="p-2 bg-brand-accent/10 border border-brand-accent/20">
                <ShieldCheck className="h-5 w-5 text-brand-accent" />
              </div>
              <div>
                <h2 className="text-lg font-black uppercase tracking-tight text-white">Método de Pago</h2>
                <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">Detalles de facturación</p>
              </div>
            </div>

            <div className="bg-black/30 border border-white/5 p-4 rounded-xl space-y-2">
              <p className="text-[10px] font-mono font-bold text-zinc-500 uppercase">Tarjeta Guardada</p>
              <p className="text-base font-black text-text-primary tracking-widest font-mono">•••• •••• •••• 4242</p>
              <p className="text-[10px] font-mono text-zinc-500 uppercase">Vence: 08/28</p>
            </div>
          </div>

          <button
            type="button"
            className="mt-6 w-full rounded-xl border border-white/10 bg-surface-raised/50 py-3 text-[10px] font-mono font-black uppercase tracking-widest text-text-primary transition-all hover:bg-brand-primary hover:text-white"
          >
            Actualizar método
          </button>
        </article>
      </section>

      {/* Invoice History */}
      <section className="bg-black/20 border border-white/5 p-8 rounded-2xl">
        <div className="mb-6 flex items-center gap-3 border-b border-white/5 pb-4">
          <div className="p-2 bg-zinc-800 border border-white/5">
            <Receipt className="h-5 w-5 text-text-secondary" />
          </div>
          <div>
            <h2 className="text-lg font-black uppercase tracking-tight text-white">Historial de Boletas</h2>
            <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">Histórico de cobros autorizados</p>
          </div>
        </div>

        {isLoadingBilling ? (
          <div className="flex flex-col items-center justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-brand-primary mb-3" />
          </div>
        ) : billingHistory?.payments && billingHistory.payments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.01] text-text-tertiary uppercase font-mono tracking-widest text-[9px]">
                  <th className="py-3 px-4 font-bold">Número</th>
                  <th className="py-3 px-4 font-bold">Fecha</th>
                  <th className="py-3 px-4 font-bold">Plan</th>
                  <th className="py-3 px-4 font-bold text-right">Monto</th>
                  <th className="py-3 px-4 font-bold text-center">Estado</th>
                  <th className="py-3 px-4 font-bold text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {billingHistory.payments.map((payment) => (
                  <tr key={payment.payment_id} className="hover:bg-white/5 transition-colors">
                    <td className="py-4 px-4 font-mono font-bold text-text-primary">
                      {payment.invoice?.invoice_number || payment.buy_order}
                    </td>
                    <td className="py-4 px-4 font-mono text-text-secondary">
                      {payment.created_at ? billingFormatters.formatDate(payment.created_at) : '-'}
                    </td>
                    <td className="py-4 px-4 font-bold text-text-secondary uppercase">
                      {billingFormatters.getPlanLabel(payment.plan)}
                    </td>
                    <td className="py-4 px-4 text-right font-mono font-black text-text-primary">
                      {billingFormatters.formatCurrency(payment.amount)}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-[9px] font-mono font-black uppercase tracking-wider ${
                        payment.status === 'authorized'
                          ? 'text-green-400 bg-green-500/10 border border-green-500/20'
                          : 'text-brand-danger bg-brand-danger/10 border border-brand-danger/20'
                      }`}>
                        {billingFormatters.getStatusLabel(payment.status)}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
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
          <div className="border border-dashed border-white/10 bg-white/[0.01] p-10 text-center rounded-2xl">
            <p className="text-sm font-bold text-text-primary uppercase">Aún no hay boletas emitidas</p>
            <p className="mt-1 text-xs text-text-tertiary">
              Cuando se registre tu primer cobro autorizado, aparecerá aquí la opción de descarga.
            </p>
          </div>
        )}
      </section>

      {/* Spend Summary */}
      {billingHistory && billingHistory.count > 0 && (
        <section className="bg-black/20 border border-white/5 p-8 rounded-2xl">
          <h3 className="text-lg font-black uppercase tracking-tight text-white mb-6 border-b border-white/5 pb-4">
            Resumen Financiero
          </h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="bg-black/30 border border-white/5 p-6 rounded-xl">
              <p className="text-[10px] font-mono font-black uppercase text-zinc-500 tracking-wider">Total Invertido</p>
              <p className="mt-2 text-2xl font-black text-brand-primary tracking-tighter">
                {billingFormatters.formatCurrency(billingHistory.total_spent)}
              </p>
            </div>
            <div className="bg-black/30 border border-white/5 p-6 rounded-xl">
              <p className="text-[10px] font-mono font-black uppercase text-zinc-500 tracking-wider">Transacciones Realizadas</p>
              <p className="mt-2 text-2xl font-black text-brand-accent tracking-tighter">{billingHistory.count}</p>
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
      className="bg-brand-primary hover:bg-brand-primary/95 text-white font-mono font-black text-[9px] uppercase tracking-widest hover:scale-[1.02] shadow-md shadow-brand-primary/10 transition-all inline-flex items-center gap-1.5"
    >
      {isDownloading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Download className="h-3.5 w-3.5" />
      )}
      {isDownloading ? 'DESCARGANDO...' : 'DESCARGAR'}
    </Button>
  );
}