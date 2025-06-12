import React from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { XMarkIcon, DocumentTextIcon, CalendarIcon, CurrencyEuroIcon, UserIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ProductInvoiceDetail {
  invoiceNumber: string;
  invoiceDate: string;
  clientName: string;
  productDesignation: string;
  productReference: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface ProductTraceabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  productBrand: string;
  invoiceDetails: ProductInvoiceDetail[];
  totalAmount: number;
  onInvoiceClick: (invoiceNumber: string) => void;
}

export const ProductTraceabilityModal: React.FC<ProductTraceabilityModalProps> = ({
  isOpen,
  onClose,
  productBrand,
  invoiceDetails,
  totalAmount,
  onInvoiceClick
}) => {
  const formatAmount = (amount: number) => {
    return amount.toLocaleString('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    });
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: fr });
    } catch {
      return dateString;
    }
  };

  // Grouper par facture
  const invoiceGroups = invoiceDetails.reduce((acc, detail) => {
    if (!acc[detail.invoiceNumber]) {
      acc[detail.invoiceNumber] = {
        invoiceNumber: detail.invoiceNumber,
        invoiceDate: detail.invoiceDate,
        clientName: detail.clientName,
        products: [],
        totalAmount: 0
      };
    }
    acc[detail.invoiceNumber].products.push(detail);
    acc[detail.invoiceNumber].totalAmount += detail.totalPrice;
    return acc;
  }, {} as Record<string, any>);

  const sortedInvoices = Object.values(invoiceGroups).sort((a: any, b: any) => 
    b.totalAmount - a.totalAmount
  );

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="div"
                  className="flex items-center justify-between mb-6"
                >
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      Traçabilité - {productBrand}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {sortedInvoices.length} facture{sortedInvoices.length > 1 ? 's' : ''} • 
                      {invoiceDetails.length} produit{invoiceDetails.length > 1 ? 's' : ''} • 
                      {formatAmount(totalAmount)}
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="rounded-full p-2 hover:bg-gray-100 transition-colors"
                  >
                    <XMarkIcon className="w-6 h-6 text-gray-500" />
                  </button>
                </Dialog.Title>

                {/* Résumé */}
                <div className="mb-6 grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-sm text-blue-700 font-medium">Total facturé</div>
                    <div className="text-2xl font-bold text-blue-900">{formatAmount(totalAmount)}</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-sm text-green-700 font-medium">Nombre de factures</div>
                    <div className="text-2xl font-bold text-green-900">{sortedInvoices.length}</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="text-sm text-purple-700 font-medium">Clients uniques</div>
                    <div className="text-2xl font-bold text-purple-900">
                      {new Set(invoiceDetails.map(d => d.clientName)).size}
                    </div>
                  </div>
                </div>

                {/* Liste des factures */}
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {sortedInvoices.map((invoice: any) => (
                    <div
                      key={invoice.invoiceNumber}
                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                      onClick={() => onInvoiceClick(invoice.invoiceNumber)}
                    >
                      {/* En-tête de la facture */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <DocumentTextIcon className="w-5 h-5 text-blue-600" />
                          <div>
                            <h4 className="font-semibold text-gray-900">{invoice.invoiceNumber}</h4>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <UserIcon className="w-4 h-4" />
                                {invoice.clientName}
                              </span>
                              <span className="flex items-center gap-1">
                                <CalendarIcon className="w-4 h-4" />
                                {formatDate(invoice.invoiceDate)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-900">
                            {formatAmount(invoice.totalAmount)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {invoice.products.length} produit{invoice.products.length > 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>

                      {/* Produits de la facture */}
                      <div className="border-t pt-2 mt-2">
                        <table className="w-full text-sm">
                          <tbody>
                            {invoice.products.map((product: ProductInvoiceDetail, idx: number) => (
                              <tr key={idx} className="border-b last:border-0">
                                <td className="py-1 text-gray-600">{product.productReference}</td>
                                <td className="py-1">{product.productDesignation}</td>
                                <td className="py-1 text-center">{product.quantity}</td>
                                <td className="py-1 text-right font-medium">{formatAmount(product.totalPrice)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Fermer
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};