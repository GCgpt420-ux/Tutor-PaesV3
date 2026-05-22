/**
 * useBilling Hook
 * 
 * Hook personalizado para gestionar datos de facturación del usuario.
 * Usa React Query para caché y sincronización automática.
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/src/lib/api/client';
import type { BillingHistory, Invoice } from '@/src/types';

/**
 * Hook para obtener el historial de facturas y pagos del usuario
 */
export function useBillingHistory(options: { enabled?: boolean } = {}) {
  return useQuery<BillingHistory>({
    queryKey: ['billing', 'history'],
    queryFn: async () => {
      try {
        const data = await apiFetch<BillingHistory>(
          '/payments/history?limit=50',
          { method: 'GET' }
        );
        return data;
      } catch (error) {
        console.error('Error fetching billing history:', error);
        throw error;
      }
    },
    enabled: options.enabled !== false,
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 2,
  });
}

/**
 * Hook para obtener detalles de una invoice específica
 */
export function useInvoice(invoiceId: number | null) {
  return useQuery<Invoice>({
    queryKey: ['billing', 'invoice', invoiceId],
    queryFn: async () => {
      if (!invoiceId) throw new Error('Invoice ID is required');
      
      try {
        const data = await apiFetch<Invoice>(
          `/payments/invoices/${invoiceId}`,
          { method: 'GET' }
        );
        return data;
      } catch (error) {
        console.error('Error fetching invoice:', error);
        throw error;
      }
    },
    enabled: !!invoiceId,
    staleTime: 10 * 60 * 1000, // 10 minutos
    retry: 1,
  });
}

/**
 * Hook para descargar PDF de una invoice
 */
export function useDownloadInvoicePDF(invoiceId: number | null) {
  const handleDownload = async () => {
    if (!invoiceId) {
      console.error('Invoice ID is required');
      return;
    }

    try {
      const response = await fetch(
        `/api/v1/payments/invoices/${invoiceId}/download`,
        {
          method: 'GET',
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      // Crear blob y descargar
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoiceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (error) {
      console.error('Error downloading invoice:', error);
      throw error;
    }
  };

  return { handleDownload };
}

/**
 * Utilidades para formatear datos de facturación
 */
export const billingFormatters = {
  formatCurrency: (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  },

  formatDate: (dateString: string | null | undefined) => {
    if (!dateString) return "—";
    try {
      return new Intl.DateTimeFormat('es-CL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(new Date(dateString));
    } catch {
      return "—";
    }
  },

  formatInvoiceNumber: (number: string) => {
    // INV-YYYYMMDD-XXXXX → Mostrar de forma legible
    return number.replace(/INV-(\d{4})(\d{2})(\d{2})-(.+)/, '$3/$2/$1-$4');
  },

  getPlanLabel: (plan: 'monthly' | 'annual') => {
    return plan === 'annual' ? 'Plan Anual' : 'Plan Mensual';
  },

  getStatusLabel: (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pendiente',
      authorized: 'Autorizado',
      failed: 'Fallido',
      issued: 'Emitido',
      paid: 'Pagado',
      cancelled: 'Cancelado',
    };
    return labels[status] || status;
  },

  getStatusColor: (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      authorized: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      issued: 'bg-blue-100 text-blue-800',
      paid: 'bg-emerald-100 text-emerald-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  },
};
