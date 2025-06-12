import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInvoiceStore } from '../store/invoiceStore';
import { Invoice } from '../types/invoice';
import { generateDemoInvoices } from '../utils/demoData';

export const DemoMode: React.FC = () => {
  const navigate = useNavigate();
  const { setInvoices } = useInvoiceStore();

  useEffect(() => {
    // Générer et charger les factures de démo
    const demoInvoices = generateDemoInvoices();
    setInvoices(demoInvoices);
    
    // Rediriger vers le dashboard
    navigate('/dashboard');
  }, [navigate, setInvoices]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Chargement des données de démonstration...</p>
      </div>
    </div>
  );
};