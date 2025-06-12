import React from 'react';
import { Invoice } from '../../types';
import { LightBulbIcon, TagIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface InvoiceDetailsProps {
  invoice: Invoice;
}

export const InvoiceDetails: React.FC<InvoiceDetailsProps> = ({ invoice }) => {
  const formatAmount = (amount: number) => {
    return amount.toLocaleString('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    });
  };

  const competitorProducts = invoice.products.filter(p => p.type === 'competitor');
  const sopremaProducts = invoice.products.filter(p => p.type === 'soprema');

  return (
    <div className="p-6">
      {/* Client and Invoice Info */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide border-b border-gray-200 pb-2">
            Informations Client
          </h4>
          <div className="space-y-2 text-sm">
            <p><span className="font-medium">Raison sociale :</span> {typeof invoice.client === 'string' ? invoice.client : invoice.client?.fullName || invoice.client?.name || 'Client extrait'}</p>
            <p><span className="font-medium">Adresse :</span> {typeof invoice.client === 'string' ? 'Adresse extraite' : invoice.client?.address || 'Adresse extraite'}</p>
            {typeof invoice.client !== 'string' && invoice.client?.siret && (
              <p><span className="font-medium">SIRET :</span> {invoice.client.siret}</p>
            )}
            {typeof invoice.client !== 'string' && invoice.client?.contact && (
              <p><span className="font-medium">Contact :</span> {invoice.client.contact}</p>
            )}
            {typeof invoice.client !== 'string' && invoice.client?.phone && (
              <p><span className="font-medium">Téléphone :</span> {invoice.client.phone}</p>
            )}
          </div>
        </div>
        
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide border-b border-gray-200 pb-2">
            Informations Facture
          </h4>
          <div className="space-y-2 text-sm">
            <p><span className="font-medium">Numéro facture :</span> {invoice.number}</p>
            <p><span className="font-medium">Date :</span> {invoice.date}</p>
            <p><span className="font-medium">Distributeur :</span> {typeof invoice.distributor === 'string' ? invoice.distributor : invoice.distributor?.name || 'Distributeur extrait'}</p>
            <p><span className="font-medium">Agence :</span> {typeof invoice.distributor === 'string' ? 'Agence extraite' : invoice.distributor?.agency || 'Agence extraite'}</p>
            {typeof invoice.distributor !== 'string' && invoice.distributor?.seller && (
              <p><span className="font-medium">Vendeur :</span> {invoice.distributor.seller}</p>
            )}
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide border-b border-gray-200 pb-2">
          Produits Achetés
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-blue-50 text-blue-700">
                <th className="text-left p-3 font-semibold">Référence</th>
                <th className="text-left p-3 font-semibold">Désignation</th>
                <th className="text-center p-3 font-semibold">Quantité</th>
                <th className="text-right p-3 font-semibold">Prix unitaire</th>
                <th className="text-right p-3 font-semibold">Total HT</th>
                <th className="text-center p-3 font-semibold">Type</th>
              </tr>
            </thead>
            <tbody>
              {invoice.products.map((product, index) => (
                <tr key={index} className="border-b border-gray-200">
                  <td className="p-3 font-mono text-xs">{product.reference}</td>
                  <td className="p-3">
                    <div>
                      {product.designation}
                      {product.verificationDetails?.reclassified && (
                        <div className="mt-1 flex items-center gap-1 text-xs text-blue-600">
                          <ArrowPathIcon className="w-3 h-3" />
                          <span>Reclassifié automatiquement (confiance: {product.verificationDetails.confidence}%)</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-3 text-center">{product.quantity}</td>
                  <td className="p-3 text-right">{formatAmount(product.unitPrice)}</td>
                  <td className="p-3 text-right">{formatAmount(product.totalPrice)}</td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      product.type === 'competitor' 
                        ? 'bg-red-100 text-red-700' 
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {product.type === 'competitor' ? 'Concurrent' : 'SOPREMA'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Opportunities Section */}
      {competitorProducts.length > 0 && (
        <div className="bg-blue-50 rounded-xl p-6 border-l-4 border-blue-600">
          <div className="flex items-center gap-2 mb-4">
            <LightBulbIcon className="w-6 h-6 text-blue-600" />
            <h4 className="text-lg font-semibold text-blue-700">Opportunité détectée</h4>
          </div>
          
          <p className="text-gray-700 mb-4 leading-relaxed">
            Le client achète des produits concurrents représentant un potentiel de {formatAmount(invoice.potential)}. 
            {sopremaProducts.length > 0 && ' Il utilise déjà certains produits SOPREMA, ce qui facilite la conversion.'}
          </p>

        </div>
      )}
    </div>
  );
};