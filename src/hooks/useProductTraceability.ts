import { useMemo, useState } from 'react';
import { useDashboardStore } from '../store/dashboardStore';
import { Invoice } from '../types';

interface ProductTraceabilityData {
  brand: string;
  invoiceDetails: Array<{
    invoiceNumber: string;
    invoiceDate: string;
    clientName: string;
    productDesignation: string;
    productReference: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  totalAmount: number;
}

export const useProductTraceability = () => {
  const { invoices } = useDashboardStore();
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fonction pour obtenir tous les détails d'une marque concurrente
  const getProductTraceability = (brand: string): ProductTraceabilityData => {
    const invoiceDetails: ProductTraceabilityData['invoiceDetails'] = [];
    let totalAmount = 0;

    invoices.forEach((invoice: Invoice) => {
      invoice.products.forEach(product => {
        if (product.type === 'competitor' && 
            (product.competitor?.brand === brand || 
             product.brand === brand ||
             // Fallback: chercher la marque dans la désignation
             product.designation.toUpperCase().includes(brand.toUpperCase()))) {
          
          invoiceDetails.push({
            invoiceNumber: invoice.number,
            invoiceDate: invoice.date,
            clientName: typeof invoice.client === 'string' 
              ? invoice.client 
              : invoice.client?.name || 'Client inconnu',
            productDesignation: product.designation,
            productReference: product.reference || '',
            quantity: product.quantity,
            unitPrice: product.unitPrice,
            totalPrice: product.totalPrice
          });
          
          totalAmount += product.totalPrice;
        }
      });
    });

    return {
      brand,
      invoiceDetails,
      totalAmount
    };
  };

  // Fonction pour obtenir toutes les marques concurrentes avec leur total
  const getAllCompetitorBrands = () => {
    const brandTotals = new Map<string, number>();
    const brandInvoiceCount = new Map<string, Set<string>>();

    invoices.forEach((invoice: Invoice) => {
      invoice.products.forEach(product => {
        if (product.type === 'competitor') {
          const brand = product.competitor?.brand || product.brand || 'Marque inconnue';
          
          // Accumular el total
          const currentTotal = brandTotals.get(brand) || 0;
          brandTotals.set(brand, currentTotal + product.totalPrice);
          
          // Contar facturas únicas
          if (!brandInvoiceCount.has(brand)) {
            brandInvoiceCount.set(brand, new Set());
          }
          brandInvoiceCount.get(brand)!.add(invoice.number);
        }
      });
    });

    return Array.from(brandTotals.entries()).map(([brand, total]) => ({
      brand,
      total,
      invoiceCount: brandInvoiceCount.get(brand)?.size || 0
    })).sort((a, b) => b.total - a.total);
  };

  // Fonction pour ouvrir le modal avec une marque spécifique
  const showBrandDetails = (brand: string) => {
    setSelectedBrand(brand);
    setIsModalOpen(true);
  };

  // Fonction pour fermer le modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedBrand(null);
  };

  // Obtenir les données de traçabilité pour la marque sélectionnée
  const selectedBrandData = useMemo(() => {
    if (!selectedBrand) return null;
    return getProductTraceability(selectedBrand);
  }, [selectedBrand, invoices]);

  return {
    selectedBrandData,
    isModalOpen,
    showBrandDetails,
    closeModal,
    getProductTraceability,
    getAllCompetitorBrands
  };
};