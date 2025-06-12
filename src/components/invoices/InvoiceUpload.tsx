import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CloudArrowUpIcon, 
  DocumentIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CpuChipIcon,
  SparklesIcon,
  MapPinIcon,
  XCircleIcon,
  QueueListIcon,
  PlayIcon,
  PauseIcon,
  ArrowPathIcon,
  ExclamationCircleIcon,
  CommandLineIcon
} from '@heroicons/react/24/outline';
import { claudeService } from '../../services/claudeService';
import { useDashboardStore } from '../../store/dashboardStore';
import { NoPlansExplanationModal } from '../reconquest/NoPlansExplanationModal';
import { reconquestService } from '../../services/reconquestService';
import { RECONQUEST_THRESHOLDS } from '../../constants/reconquest';

interface UploadStatus {
  status: 'idle' | 'processing' | 'paused' | 'success' | 'error' | 'completed' | 'checking-server';
  message: string;
  error?: string;
  debugInfo?: any;
  totalFiles?: number;
  processedFiles?: number;
  successFiles?: number;
  errorFiles?: number;
}

interface FileProgress {
  file: File;
  status: 'waiting' | 'processing' | 'completed' | 'error' | 'skipped';
  progress: number;
  error?: string;
  invoice?: any;
  processedAt?: Date;
  debugInfo?: any;
}

interface BatchStats {
  total: number;
  processed: number;
  success: number;
  errors: number;
  currentBatch: number;
  totalBatches: number;
  estimatedTimeRemaining: string;
  processingSpeed: string;
}

export const InvoiceUpload: React.FC = () => {
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({ 
    status: 'idle', 
    message: '' 
  });
  
  const [fileQueue, setFileQueue] = useState<FileProgress[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [batchStats, setBatchStats] = useState<BatchStats | null>(null);
  const [processingStartTime, setProcessingStartTime] = useState<Date | null>(null);
  const [debugMode, setDebugMode] = useState(false);
  const [serverStatus, setServerStatus] = useState<'unknown' | 'healthy' | 'error' | 'checking'>('unknown');
  const [showNoPlansModal, setShowNoPlansModal] = useState(false);
  const [noPlansStats, setNoPlansStats] = useState<any>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [hasEligibleClients, setHasEligibleClients] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'warning', title: string, message: string } | null>(null);
  
  const { addInvoice, setLoading, setError, invoices, setReconquestPlans, setReconquestSummary } = useDashboardStore();

  // Configuration pour traitement par lots
  const BATCH_SIZE = 5;
  const MAX_FILES = 100;
  const CONCURRENT_PROCESSING = 3;

  // Fonction pour générer automatiquement les plans de reconquête
  const generateReconquestPlansAuto = async (allInvoices: any[]) => {
    try {
      console.log('🎯 Génération automatique des plans de reconquête...');
      console.log('📊 DEBUG - Factures à analyser:', {
        total: allInvoices.length,
        factureNumbers: allInvoices.map(inv => inv.number).slice(0, 5),
        clients: allInvoices.map(inv => inv.client?.name).slice(0, 5)
      });
      
      // Debug détaillé de chaque facture
      allInvoices.forEach((invoice, index) => {
        const competitorProducts = invoice.products?.filter(p => 
          p.type === 'competitor' || p.isCompetitor === true || p.isCompetitor === 'true'
        ) || [];
        
        console.log(`🔍 Facture ${index + 1} (${invoice.number}):`, {
          client: invoice.client?.name,
          totalProducts: invoice.products?.length || 0,
          competitorProducts: competitorProducts.length,
          firstCompetitor: competitorProducts[0]?.designation || 'Aucun'
        });
      });
      
      // Filtrer les factures pertinentes (avec produits concurrents)
      const relevantInvoices = reconquestService.filterInvoicesForReconquest(allInvoices);
      
      if (relevantInvoices.length === 0) {
        console.log('ℹ️ Aucune facture avec produits concurrents - pas de plans générés');
        console.log('🔍 DIAGNOSTIC: Vérifiez que les produits ont bien type="competitor" ou isCompetitor=true');
        return;
      }
      
      console.log(`📊 ${relevantInvoices.length} factures avec produits concurrents trouvées`);
      
      // Générer les plans automatiquement
      const result = await reconquestService.generateReconquestPlans(relevantInvoices);
      
      // Sauvegarder dans le store
      setReconquestPlans(result.plans);
      setReconquestSummary(result.summary);
      
      console.log(`✅ ${result.plans.length} plans de reconquête générés automatiquement`);
      
    } catch (error) {
      console.error('❌ Erreur génération automatique plans:', error);
      // Ne pas afficher d'erreur à l'utilisateur car c'est automatique
    }
  };

  // Vérifier l'état du serveur AVANT de traiter
  const checkServerHealth = async (): Promise<boolean> => {
    try {
      setServerStatus('checking');
      setUploadStatus({
        status: 'checking-server',
        message: 'Vérification du serveur et des clés API...'
      });

      const response = await fetch('http://localhost:3001/api/health');
      
      if (!response.ok) {
        throw new Error(`Serveur inaccessible (HTTP ${response.status})`);
      }

      const health = await response.json();
      

      if (health.status !== 'OK') {
        setServerStatus('error');
        setUploadStatus({
          status: 'error',
          message: 'Configuration incomplète',
          error: 'Le serveur indique des problèmes de configuration',
          debugInfo: health
        });
        return false;
      }

      if (!health.features?.claudeAI) {
        setServerStatus('error');
        setUploadStatus({
          status: 'error',
          message: 'Claude AI non configuré',
          error: 'ANTHROPIC_API_KEY manquante dans le fichier .env',
          debugInfo: health
        });
        return false;
      }

      if (!health.features?.googleMaps) {
        }

      setServerStatus('healthy');
      return true;

    } catch (error) {
      setServerStatus('error');
      
      if (error.message.includes('fetch')) {
        setUploadStatus({
          status: 'error',
          message: 'Serveur Node.js non démarré',
          error: 'Impossible de contacter http://localhost:3001. Exécutez "npm run dev" dans un terminal.',
          debugInfo: { error: error.message, serverUrl: 'http://localhost:3001' }
        });
      } else {
        setUploadStatus({
          status: 'error',
          message: 'Erreur de connexion serveur',
          error: error.message,
          debugInfo: { error: error.message }
        });
      }
      return false;
    }
  };

  // Traitement d'une seule facture avec DEBUG amélioré
  const processSingleFile = async (file: File, fileIndex: number): Promise<any> => {
    try {
      console.log('🔄 Début traitement fichier:', file.name, 'index:', fileIndex);
      
      // Mettre à jour le statut du fichier
      setFileQueue(prev => prev.map((f, index) => 
        index === fileIndex ? { 
          ...f, 
          status: 'processing', 
          progress: 10,
          debugInfo: { phase: 'upload', startTime: new Date() }
        } : f
      ));

      // Ajouter un message spécifique pour les fichiers PDF
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      if (isPdf) {
        setFileQueue(prev => prev.map((f, index) => 
          index === fileIndex ? { 
            ...f, 
            debugInfo: { 
              ...f.debugInfo, 
              phase: 'pdf-conversion',
              message: 'Extraction de texte et OCR en cours...'
            }
          } : f
        ));
      }

      // Simulation de progression pendant l'analyse
      const progressInterval = setInterval(() => {
        setFileQueue(prev => prev.map((f, index) => 
          index === fileIndex && f.status === 'processing' 
            ? { ...f, progress: Math.min(f.progress + 10, 90) } 
            : f
        ));
      }, 1000);

      // Appel à Claude via le service
      // Le retraitement est maintenant géré automatiquement côté serveur
      const extractedData = await claudeService.processFile(file);
      
      clearInterval(progressInterval);

      const newInvoice = {
        id: `invoice-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        number: extractedData.invoiceNumber,
        date: extractedData.date,
        client: extractedData.client,
        distributor: extractedData.distributor,
        amount: extractedData.totalAmount,
        potential: Math.round(extractedData.totalAmount * 1.15 * 100) / 100,
        products: extractedData.products.map(product => ({
          ...product,
          type: product.isCompetitor ? 'competitor' : 'soprema',
          competitor: product.isCompetitor ? {
            brand: product.brand || 'marque inconnue',
            category: 'Produit BTP'
          } : undefined,
          verificationDetails: product.verificationDetails
        })),
        status: 'analyzed' as const,
        region: extractedData.region || 'France',
        reconquestPlan: extractedData.reconquestPlan,
        _productVerification: extractedData._productVerification
      };

      // Marquer comme terminé
      setFileQueue(prev => prev.map((f, index) => 
        index === fileIndex ? { 
          ...f, 
          status: 'completed', 
          progress: 100, 
          invoice: newInvoice,
          processedAt: new Date(),
          debugInfo: { 
            phase: 'completed',
            extractedData: {
              invoiceNumber: extractedData.invoiceNumber,
              clientName: extractedData.client?.name,
              productsCount: extractedData.products?.length,
              totalAmount: extractedData.totalAmount
            }
          }
        } : f
      ));

      console.log('➕ Ajout de la facture au store:', {
        id: newInvoice.id,
        number: newInvoice.number,
        client: newInvoice.client.name,
        amount: newInvoice.amount,
        productsCount: newInvoice.products.length
      });
      
      // Debug: analyser les produits avant ajout
      const competitorProducts = newInvoice.products.filter(p => p.type === 'competitor' || p.isCompetitor);
      const sopremaProducts = newInvoice.products.filter(p => p.type === 'soprema' || p.isSoprema);
      console.log('🔍 DEBUG Produits avant ajout:', {
        total: newInvoice.products.length,
        competitors: competitorProducts.length,
        soprema: sopremaProducts.length,
        competitorNames: competitorProducts.map(p => p.designation).slice(0, 3),
        sopremaNames: sopremaProducts.map(p => p.designation).slice(0, 3)
      });
      
      // Compter les factures avant ajout
      const invoicesCountBefore = useDashboardStore.getState().invoices.length;
      
      addInvoice(newInvoice);
      
      // Vérifier si la facture a vraiment été ajoutée
      const invoicesCountAfter = useDashboardStore.getState().invoices.length;
      const wasActuallyAdded = invoicesCountAfter > invoicesCountBefore;
      
      console.log('📊 DEBUG Store après ajout:', {
        totalInvoices: invoicesCountAfter,
        lastInvoice: useDashboardStore.getState().invoices[0]?.number,
        lastInvoiceProducts: useDashboardStore.getState().invoices[0]?.products?.length,
        wasActuallyAdded: wasActuallyAdded
      });
      
      return { invoice: newInvoice, wasAdded: wasActuallyAdded };

    } catch (error) {
      console.error('❌ Erreur traitement fichier:', error.message);
      
      // Distinguer les erreurs de rejection des vraies erreurs
      const isRejectedInvoice = error.message.includes('Facture corrompue détectée') || 
                               error.message.includes('sera ignorée') ||
                               error.message.includes('conversion alternative');
      
      setFileQueue(prev => prev.map((f, index) => 
        index === fileIndex ? { 
          ...f, 
          status: isRejectedInvoice ? 'skipped' : 'error', 
          progress: 100, 
          error: isRejectedInvoice ? 'Facture corrompue - Ignorée automatiquement' : error.message,
          processedAt: new Date(),
          debugInfo: {
            phase: isRejectedInvoice ? 'rejected' : 'error',
            isRejected: isRejectedInvoice,
            errorDetails: {
              message: error.message,
              stack: error.stack,
              serverResponse: error.serverResponse || 'Aucune réponse serveur'
            }
          }
        } : f
      ));
      
      // Les factures rejetées ne sont pas des "erreurs" à proprement parler
      if (!isRejectedInvoice) {
        throw error;
      }
      
      // Pour les factures rejetées, on continue sans lancer d'erreur
      console.log('📋 Facture rejetée automatiquement:', file.name);
    }
  };

  // Traitement par lots intelligent pour 100 factures (inchangé mais avec meilleurs logs)
  const processBatchQueue = async (files: FileProgress[]) => {
    console.log('🎯 processBatchQueue démarré avec', files.length, 'fichiers');
    setIsProcessing(true);
    setIsPaused(false);
    setProcessingStartTime(new Date());
    console.log('🔄 État après setIsProcessing:', { isProcessing, isPaused });
    
    const totalFiles = files.length;
    const totalBatches = Math.ceil(totalFiles / BATCH_SIZE);
    let processedCount = 0;
    let successCount = 0; // Fichiers traités avec succès par le serveur
    let validatedCount = 0; // Factures réellement validées dans le store
    let errorCount = 0;


    setBatchStats({
      total: totalFiles,
      processed: 0,
      success: 0,
      errors: 0,
      currentBatch: 1,
      totalBatches,
      estimatedTimeRemaining: 'Calcul en cours...',
      processingSpeed: '0 factures/min'
    });

    setUploadStatus({
      status: 'processing',
      message: `Traitement par lots: 0/${totalFiles} factures`,
      totalFiles,
      processedFiles: 0,
      successFiles: 0,
      errorFiles: 0
    });
    
    console.log('📊 Stats initiales définies:', { totalFiles, totalBatches });

    // Traiter par lots de BATCH_SIZE
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      console.log(`📦 Traitement du lot ${batchIndex + 1}/${totalBatches}`);
      
      // Temporairement commenté pour debug
      // while (isPaused && isProcessing) {
      //   await new Promise(resolve => setTimeout(resolve, 1000));
      // }

      // if (!isProcessing) break;

      const batchStart = batchIndex * BATCH_SIZE;
      const batchEnd = Math.min(batchStart + BATCH_SIZE, totalFiles);
      const batchFiles = files.slice(batchStart, batchEnd);
      console.log(`📊 Lot contient ${batchFiles.length} fichiers (index ${batchStart} à ${batchEnd - 1})`);
      console.log('📑 batchFiles:', batchFiles);
      console.log('🔍 isProcessing:', isProcessing);

      const batchPromises = batchFiles.map(async (fileProgress, localIndex) => {
        const globalIndex = batchStart + localIndex;
        console.log(`🎯 Traitement fichier ${globalIndex + 1}:`, files[globalIndex].file.name);
        
        try {
          const result = await processSingleFile(files[globalIndex].file, globalIndex);
          successCount++; // Fichier traité avec succès par le serveur
          if (result?.wasAdded) {
            validatedCount++; // Facture vraiment ajoutée au store
          }
          processedCount++;
          console.log(`✅ Fichier ${globalIndex + 1} traité avec succès (ajouté au store: ${result?.wasAdded})`);
          
          // Mettre à jour immédiatement après chaque fichier
          const elapsed = processingStartTime ? (new Date().getTime() - processingStartTime.getTime()) / 1000 : 0;
          const speed = Math.round((processedCount / elapsed) * 60);
          const remaining = totalFiles - processedCount;
          const eta = speed > 0 ? Math.round(remaining / (speed / 60)) : 0;
        
        setBatchStats({
          total: totalFiles,
          processed: processedCount,
          success: validatedCount, // Utiliser le vrai nombre de factures validées
          errors: errorCount,
          currentBatch: batchIndex + 1,
          totalBatches: totalBatches,
          estimatedTimeRemaining: eta > 0 ? `${Math.floor(eta / 60)}m ${eta % 60}s` : 'Bientôt terminé',
          processingSpeed: `${speed} factures/min`
        });

        setUploadStatus({
          status: 'processing',
          message: `Traitement par lots: ${processedCount}/${totalFiles} factures`,
          totalFiles: totalFiles,
          processedFiles: processedCount,
          successFiles: validatedCount, // Factures vraiment validées
          errorFiles: errorCount
        });
          
          console.log(`📊 Mise à jour stats: ${processedCount}/${totalFiles} traités`);
        } catch (error) {
          errorCount++;
          processedCount++;
          console.error(`❌ Erreur fichier ${globalIndex + 1}:`, error);
          
          // Mettre à jour aussi en cas d'erreur
          const elapsed = processingStartTime ? (new Date().getTime() - processingStartTime.getTime()) / 1000 : 0;
          const speed = Math.round((processedCount / elapsed) * 60);
          const remaining = totalFiles - processedCount;
          const eta = speed > 0 ? Math.round(remaining / (speed / 60)) : 0;
          
          setBatchStats({
            total: totalFiles,
            processed: processedCount,
            success: validatedCount, // Utiliser le vrai nombre de factures validées
            errors: errorCount,
            currentBatch: batchIndex + 1,
            totalBatches: totalBatches,
            estimatedTimeRemaining: eta > 0 ? `${Math.floor(eta / 60)}m ${eta % 60}s` : 'Bientôt terminé',
            processingSpeed: `${speed} factures/min`
          });

          setUploadStatus({
            status: 'processing',
            message: `Traitement par lots: ${processedCount}/${totalFiles} factures (${validatedCount} validées)`,
            totalFiles: totalFiles,
            processedFiles: processedCount,
            successFiles: validatedCount, // Factures vraiment validées
            errorFiles: errorCount
          });
        }
      });

      await Promise.allSettled(batchPromises);

      if (batchIndex < totalBatches - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    setIsProcessing(false);
    setIsPaused(false);


    if (processedCount === totalFiles) {
      // Analyser les résultats en utilisant la MÊME logique que reconquestService
      const allInvoices = useDashboardStore.getState().invoices;
      
      // ÉTAPE 1: Filtrer les factures pertinentes (avec produits concurrents)
      const relevantInvoices = reconquestService.filterInvoicesForReconquest(allInvoices);
      
      // ÉTAPE 2: Analyser les clients éligibles sur ces factures filtrées
      const clientsAnalyzed = reconquestService.getClientsAnalysisDetails(relevantInvoices);
      
      // ÉTAPE 3: Appliquer le seuil (même logique que reconquestService)
      const eligibleClients = clientsAnalyzed.filter(client => client.competitorAmount >= RECONQUEST_THRESHOLDS.MIN_COMPETITOR_AMOUNT);
      
      // Calculer les vraies statistiques
      const actualInvoicesCount = allInvoices.length;
      const uniqueClients = new Set(allInvoices.map(inv => inv.client?.name)).size;
      const rejectedCount = successCount - validatedCount; // Factures traitées mais rejetées par validation
      
      console.log('🔍 Analyse post-upload:', {
        filesProcessed: processedCount,
        filesSuccess: successCount,
        filesErrors: errorCount,
        facuresValidated: validatedCount,
        facuresStored: actualInvoicesCount,
        facturesRejected: rejectedCount,
        relevantInvoices: relevantInvoices.length,
        eligibleClients: eligibleClients.length,
        uniqueClients: uniqueClients,
        clientsAnalyzed
      });

      // Toast de succès immédiat pour le traitement par lots
      if (eligibleClients.length > 0) {
        setToastMessage({
          type: 'success',
          title: '🎯 Opportunités de reconquête détectées !',
          message: `${validatedCount} factures validées • ${eligibleClients.length} client(s) à analyser`
        });
        setHasEligibleClients(true);
        setUploadStatus({
          status: 'completed',
          message: `Traitement terminé: ${validatedCount} factures validées sur ${successCount} traitées (${rejectedCount} rejetées) - ${eligibleClients.length} client(s) à analyser`,
          totalFiles,
          processedFiles: processedCount,
          successFiles: validatedCount,
          errorFiles: errorCount
        });
      } else {
        setToastMessage({
          type: 'warning',
          title: '⚠️ Aucun plan de reconquête',
          message: `${validatedCount} factures validées • Clients sous le seuil de ${(RECONQUEST_THRESHOLDS.MIN_COMPETITOR_AMOUNT).toLocaleString('fr-FR')}€`
        });
        setHasEligibleClients(false);
        setUploadStatus({
          status: 'completed',
          message: `Traitement terminé: ${validatedCount} factures validées sur ${successCount} traitées (${rejectedCount} rejetées), ${errorCount} erreurs`,
          totalFiles,
          processedFiles: processedCount,
          successFiles: validatedCount,
          errorFiles: errorCount
        });
      }
      
      // Afficher le toast immédiatement
      setShowSuccessToast(true);
      
      // Générer automatiquement les plans de reconquête
      await generateReconquestPlansAuto(allInvoices);
    }
  };
  
  // Log l'état du modal pour debug
  React.useEffect(() => {
    console.log('📊 État du modal:', { showNoPlansModal, noPlansStats });
  }, [showNoPlansModal, noPlansStats]);

  // Contrôles de traitement (inchangés)
  const pauseProcessing = () => {
    setIsPaused(true);
    setUploadStatus(prev => ({ ...prev, status: 'paused', message: 'Traitement en pause...' }));
  };

  const resumeProcessing = () => {
    setIsPaused(false);
    setUploadStatus(prev => ({ ...prev, status: 'processing' }));
  };

  const stopProcessing = () => {
    setIsProcessing(false);
    setIsPaused(false);
    setUploadStatus({ status: 'idle', message: '' });
    setBatchStats(null);
  };

  const retryErrors = async () => {
    const errorFiles = fileQueue
      .map((file, index) => ({ ...file, originalIndex: index }))
      .filter(f => f.status === 'error');

    if (errorFiles.length === 0) return;

    
    setFileQueue(prev => prev.map(f => 
      f.status === 'error' ? { ...f, status: 'waiting', progress: 0, error: undefined } : f
    ));

    for (const errorFile of errorFiles) {
      if (!isProcessing) break;
      
      try {
        await processSingleFile(errorFile.file, errorFile.originalIndex);
      } catch (error) {
      }
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    console.log('📥 Fichiers déposés:', acceptedFiles.length, 'isProcessing:', isProcessing);
    if (acceptedFiles.length === 0) return;

    if (isProcessing) {
      console.log('⚠️ Traitement déjà en cours!');
      setError('Un traitement est déjà en cours. Attendez la fin avant d\'ajouter d\'autres factures.');
      return;
    }

    if (acceptedFiles.length > MAX_FILES) {
      setError(`Trop de fichiers ! Maximum ${MAX_FILES} factures autorisées. Vous avez sélectionné ${acceptedFiles.length} fichiers.`);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    setHasEligibleClients(false);
    setShowSuccessToast(false);
    setToastMessage(null);

    // ÉTAPE 1: Vérifier le serveur AVANT tout traitement
    console.log('🔍 Vérification du serveur...');
    const serverOk = await checkServerHealth();
    console.log('✅ Serveur OK:', serverOk);
    if (!serverOk) {
      setLoading(false);
      return; // Arrêter ici si le serveur n'est pas OK
    }

    // ÉTAPE 2: Initialiser la queue avec tous les fichiers
    const initialQueue: FileProgress[] = acceptedFiles.map(file => ({
      file,
      status: 'waiting',
      progress: 0
    }));
    
    console.log('📋 Queue initialisée avec', initialQueue.length, 'fichiers');
    setFileQueue(initialQueue);

    if (acceptedFiles.length === 1) {
      // Une seule facture - traitement direct
      try {
        await processSingleFile(acceptedFiles[0], 0);
        
        // Analyser si des plans de reconquête sont possibles (MÊME logique que pour les lots)
        const allInvoices = useDashboardStore.getState().invoices;
        
        // ÉTAPE 1: Filtrer les factures pertinentes (avec produits concurrents)
        const relevantInvoices = reconquestService.filterInvoicesForReconquest(allInvoices);
        
        // ÉTAPE 2: Analyser les clients éligibles sur ces factures filtrées
        const clientsAnalyzed = reconquestService.getClientsAnalysisDetails(relevantInvoices);
        
        // ÉTAPE 3: Appliquer le seuil (même logique que reconquestService)
        const eligibleClients = clientsAnalyzed.filter(client => client.competitorAmount >= RECONQUEST_THRESHOLDS.MIN_COMPETITOR_AMOUNT);
        
        console.log('🔍 Analyse après facture unique:', {
          relevantInvoices: relevantInvoices.length,
          eligibleClients: eligibleClients.length,
          totalClients: clientsAnalyzed.length,
          clientsAnalyzed
        });

        // Toast de succès immédiat et visible
        if (eligibleClients.length > 0) {
          setToastMessage({
            type: 'success',
            title: '🎯 Client éligible détecté !',
            message: `${eligibleClients.length} client(s) éligible(s) • Plan généré automatiquement`
          });
          setHasEligibleClients(true);
          setUploadStatus({
            status: 'success',
            message: `Facture analysée - ${eligibleClients.length} plan(s) de reconquête disponible(s)`,
            totalFiles: 1,
            processedFiles: 1,
            successFiles: 1,
            errorFiles: 0
          });
        } else {
          setToastMessage({
            type: 'warning',
            title: '⚠️ Aucun plan de reconquête',
            message: `Client sous le seuil de ${(RECONQUEST_THRESHOLDS.MIN_COMPETITOR_AMOUNT).toLocaleString('fr-FR')}€ de produits concurrents`
          });
          setHasEligibleClients(false);
          setUploadStatus({
            status: 'success',
            message: 'Facture analysée avec succès !',
            totalFiles: 1,
            processedFiles: 1,
            successFiles: 1,
            errorFiles: 0
          });
        }
        
        // Afficher le toast immédiatement
        setShowSuccessToast(true);
        
        // Générer automatiquement les plans de reconquête
        await generateReconquestPlansAuto(allInvoices);
        
        setTimeout(() => {
          setUploadStatus({ status: 'idle', message: '' });
          setFileQueue([]);
          setSuccessMessage(null);
          setHasEligibleClients(false);
        }, 10000);
      } catch (error) {
        setUploadStatus({
          status: 'error',
          message: 'Erreur d\'analyse de la facture',
          error: error.message,
          debugInfo: { 
            fileName: acceptedFiles[0].name,
            fileSize: acceptedFiles[0].size,
            error: error.message 
          }
        });
      } finally {
        setLoading(false);
      }
    } else {
      // Traitement par lots pour plusieurs factures
      console.log('🚀 Démarrage du traitement par lots');
      try {
        await processBatchQueue(initialQueue);
      } finally {
        setLoading(false);
      }
    }
  }, [addInvoice, setLoading, setError]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.tiff'],
      'application/pdf': ['.pdf']
    },
    maxFiles: MAX_FILES,
    maxSize: 20 * 1024 * 1024,
    disabled: isProcessing
  });

  const getStatusIcon = () => {
    if (uploadStatus.status === 'checking-server') {
      return (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 text-blue-600"
        >
          <CommandLineIcon className="w-12 h-12" />
        </motion.div>
      );
    }

    if (isProcessing && !isPaused) {
      return (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 text-blue-600 relative"
        >
          <QueueListIcon className="w-12 h-12" />
          <SparklesIcon className="w-6 h-6 absolute -top-1 -right-1 text-yellow-500" />
        </motion.div>
      );
    }

    if (isPaused) {
      return <PauseIcon className="w-12 h-12 text-orange-600" />;
    }

    switch (uploadStatus.status) {
      case 'completed':
        return <CheckCircleIcon className="w-12 h-12 text-green-600" />;
      case 'error':
        return <XCircleIcon className="w-12 h-12 text-red-600" />;
      default:
        return <CloudArrowUpIcon className="w-12 h-12 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    if (uploadStatus.status === 'checking-server') return 'border-blue-300 bg-blue-50';
    if (isProcessing) return 'border-blue-300 bg-blue-50';
    if (isPaused) return 'border-orange-300 bg-orange-50';
    
    switch (uploadStatus.status) {
      case 'completed':
        return 'border-green-300 bg-green-50';
      case 'error':
        return 'border-red-300 bg-red-50';
      default:
        return isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-gray-50';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Toast de notification immédiat - AFFICHÉ EN HAUT */}
      <AnimatePresence>
        {showSuccessToast && toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -100, scale: 0.3 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -100, scale: 0.3 }}
            transition={{ duration: 0.5, type: "spring" }}
            className={`fixed top-4 right-4 z-50 max-w-md p-4 rounded-lg shadow-2xl border-2 ${
              toastMessage.type === 'success' 
                ? 'bg-green-50 border-green-200 text-green-900' 
                : 'bg-yellow-50 border-yellow-200 text-yellow-900'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-bold text-lg mb-1">{toastMessage.title}</h4>
                <p className="text-sm">{toastMessage.message}</p>
              </div>
              <button
                onClick={() => {
                  setShowSuccessToast(false);
                  setToastMessage(null);
                }}
                className="ml-3 text-gray-400 hover:text-gray-600"
              >
                <XCircleIcon className="w-5 h-5" />
              </button>
            </div>
            
            {/* Barre de progression pour fermeture automatique */}
            <motion.div
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 8, ease: "linear" }}
              className={`mt-3 h-1 rounded-full ${
                toastMessage.type === 'success' ? 'bg-green-300' : 'bg-yellow-300'
              }`}
              onAnimationComplete={() => {
                setShowSuccessToast(false);
                setToastMessage(null);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
          isProcessing ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'
        } ${getStatusColor()}`}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center gap-4">
          {getStatusIcon()}
          
          <div className="text-center">
            <AnimatePresence mode="wait">
              {uploadStatus.status === 'idle' && fileQueue.length === 0 ? (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {isDragActive
                      ? 'Déposez vos factures ici'
                      : 'Analysez jusqu\'à 100 factures simultanément'
                    }
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Glissez-déposez jusqu'à 100 fichiers PDF ou images, ou cliquez pour parcourir
                  </p>
                  
                  {/* Indicateur d'état serveur */}
                  <div className="mb-4">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                      serverStatus === 'healthy' ? 'bg-green-100 text-green-700' :
                      serverStatus === 'error' ? 'bg-red-100 text-red-700' :
                      serverStatus === 'checking' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {serverStatus === 'healthy' && '✅ Serveur prêt'}
                      {serverStatus === 'error' && '❌ Configuration requise'}
                      {serverStatus === 'checking' && '🔍 Vérification...'}
                      {serverStatus === 'unknown' && '⚙️ État inconnu - Cliquez pour tester'}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                    <div className="flex items-center justify-center gap-2 text-purple-600 bg-purple-100 px-3 py-2 rounded-full">
                      <QueueListIcon className="w-4 h-4" />
                      <span className="font-medium">Traitement par lots</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-blue-600 bg-blue-100 px-3 py-2 rounded-full">
                      <CpuChipIcon className="w-4 h-4" />
                      <span className="font-medium">Claude 4 Opus</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-green-600 bg-green-100 px-3 py-2 rounded-full">
                      <MapPinIcon className="w-4 h-4" />
                      <span className="font-medium">Plans de reconquête</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-orange-600 bg-orange-100 px-3 py-2 rounded-full">
                      <SparklesIcon className="w-4 h-4" />
                      <span className="font-medium">100 factures max</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">
                    Formats: PDF, JPG, PNG, TIFF (max 20MB/fichier) • Traitement intelligent par lots de 5
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="status"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <h3 className={`text-lg font-semibold mb-2 ${
                    uploadStatus.status === 'completed' ? 'text-green-700' :
                    uploadStatus.status === 'error' ? 'text-red-700' :
                    uploadStatus.status === 'checking-server' ? 'text-blue-700' :
                    isPaused ? 'text-orange-700' :
                    'text-blue-700'
                  }`}>
                    {uploadStatus.message}
                  </h3>
                  
                  {uploadStatus.totalFiles && uploadStatus.totalFiles > 1 && (
                    <div className="text-sm text-gray-600 mb-4">
                      {uploadStatus.processedFiles}/{uploadStatus.totalFiles} factures traitées • 
                      {uploadStatus.successFiles} validées • 
                      {uploadStatus.errorFiles} erreurs
                    </div>
                  )}
                  
                  {/* Message spécial pour la conversion PDF */}
                  {fileQueue.some(f => f.status === 'processing' && f.debugInfo?.phase === 'pdf-conversion') && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          className="text-blue-600"
                        >
                          <ArrowPathIcon className="w-6 h-6" />
                        </motion.div>
                        <div>
                          <p className="text-sm font-semibold text-blue-800">
                            Extraction de texte et OCR en cours...
                          </p>
                          <p className="text-xs text-blue-600">
                            Pipeline : PDF → OCR (ILovePDF) → Extraction texte → Analyse Claude AI
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Contrôles de traitement */}
                  {isProcessing && (
                    <div className="flex items-center justify-center gap-3 mb-4">
                      {!isPaused ? (
                        <button
                          onClick={pauseProcessing}
                          className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                        >
                          <PauseIcon className="w-4 h-4" />
                          Pause
                        </button>
                      ) : (
                        <button
                          onClick={resumeProcessing}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <PlayIcon className="w-4 h-4" />
                          Reprendre
                        </button>
                      )}
                      <button
                        onClick={stopProcessing}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <XCircleIcon className="w-4 h-4" />
                        Arrêter
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Message de succès */}
      {successMessage && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-6 bg-green-50 rounded-lg border border-green-200"
        >
          <div className="flex items-center gap-3">
            <CheckCircleIcon className="w-8 h-8 text-green-600" />
            <div>
              <h4 className="font-semibold text-green-900 text-lg">{successMessage}</h4>
              <p className="text-green-700 text-sm mt-1">
                Les plans de reconquête sont générés automatiquement et visibles sur la carte interactive
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Affichage d'erreur détaillé */}
      {uploadStatus.status === 'error' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-6 bg-red-50 rounded-lg border border-red-200"
        >
          <div className="flex items-start gap-3">
            <ExclamationCircleIcon className="w-8 h-8 text-red-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h4 className="font-semibold text-red-900 text-lg mb-2">Problème détecté</h4>
              <p className="text-red-700 mb-4">{uploadStatus.error}</p>
              
              {/* Bouton debug toggle */}
              <button
                onClick={() => setDebugMode(!debugMode)}
                className="flex items-center gap-2 text-sm text-red-600 hover:text-red-800 mb-4"
              >
                <CommandLineIcon className="w-4 h-4" />
                {debugMode ? 'Masquer' : 'Afficher'} les détails techniques
              </button>
              
              {/* Informations de debug */}
              {debugMode && uploadStatus.debugInfo && (
                <div className="bg-red-100 p-4 rounded-lg border border-red-300 text-xs font-mono">
                  <h5 className="font-semibold text-red-800 mb-2">Informations de débogage:</h5>
                  <pre className="text-red-700 whitespace-pre-wrap overflow-x-auto">
                    {JSON.stringify(uploadStatus.debugInfo, null, 2)}
                  </pre>
                </div>
              )}
              
              {/* Solutions suggérées */}
              <div className="bg-red-100 p-4 rounded-lg border border-red-300">
                <h5 className="font-semibold text-red-800 mb-2">Solutions suggérées:</h5>
                <ul className="text-sm text-red-700 space-y-1">
                  <li>1. Vérifiez que le serveur est démarré: <code className="bg-red-200 px-1 rounded">npm run dev</code></li>
                  <li>2. Vérifiez vos clés API dans le fichier <code className="bg-red-200 px-1 rounded">.env</code></li>
                  <li>3. Consultez les logs dans la console du navigateur (F12)</li>
                  <li>4. Redémarrez le serveur si nécessaire</li>
                </ul>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Statistiques en temps réel pour gros volumes (inchangé) */}
      {batchStats && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="text-2xl font-bold text-blue-600">{batchStats.processed}</div>
            <div className="text-sm text-blue-700">Traitées</div>
            <div className="text-xs text-blue-600">sur {batchStats.total}</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="text-2xl font-bold text-green-600">{batchStats.success}</div>
            <div className="text-sm text-green-700">Succès</div>
            <div className="text-xs text-green-600">{Math.round((batchStats.success / Math.max(1, batchStats.processed)) * 100)}%</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <div className="text-2xl font-bold text-purple-600">{batchStats.currentBatch}</div>
            <div className="text-sm text-purple-700">Lot actuel</div>
            <div className="text-xs text-purple-600">sur {batchStats.totalBatches}</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
            <div className="text-lg font-bold text-orange-600">{batchStats.estimatedTimeRemaining}</div>
            <div className="text-sm text-orange-700">Temps restant</div>
            <div className="text-xs text-orange-600">{batchStats.processingSpeed}</div>
          </div>
        </motion.div>
      )}

      {/* Liste compacte pour gros volumes avec debug amélioré */}
      {fileQueue.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 bg-white rounded-lg border border-gray-200 shadow-sm"
        >
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <QueueListIcon className="w-6 h-6 text-blue-600" />
              <h4 className="font-medium text-gray-900">
                Queue de traitement ({fileQueue.filter(f => f.status === 'completed').length}/{fileQueue.length})
              </h4>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setDebugMode(!debugMode)}
                className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                <CommandLineIcon className="w-4 h-4" />
                Debug {debugMode ? 'ON' : 'OFF'}
              </button>
              
              {fileQueue.some(f => f.status === 'error') && !isProcessing && (
                <button
                  onClick={retryErrors}
                  className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  <ArrowPathIcon className="w-4 h-4" />
                  Réessayer erreurs
                </button>
              )}
            </div>
          </div>
          
          <div className="p-4 border-b border-gray-200">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progression globale</span>
              <span>{Math.round((fileQueue.filter(f => f.status === 'completed' || f.status === 'error').length / fileQueue.length) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-blue-600 h-3 rounded-full transition-all duration-300 flex"
                style={{ width: `${(fileQueue.filter(f => f.status === 'completed' || f.status === 'error').length / fileQueue.length) * 100}%` }}
              >
                <div 
                  className="bg-green-600 h-full rounded-l-full"
                  style={{ width: `${(fileQueue.filter(f => f.status === 'completed').length / Math.max(1, fileQueue.filter(f => f.status === 'completed' || f.status === 'error').length)) * 100}%` }}
                />
              </div>
            </div>
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            <div className="divide-y divide-gray-200">
              {fileQueue.map((fileProgress, index) => (
                <div key={index} className="p-3 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="flex-shrink-0">
                        {fileProgress.status === 'completed' && <CheckCircleIcon className="w-5 h-5 text-green-600" />}
                        {fileProgress.status === 'error' && <XCircleIcon className="w-5 h-5 text-red-600" />}
                        {fileProgress.status === 'skipped' && <ExclamationTriangleIcon className="w-5 h-5 text-orange-600" />}
                        {fileProgress.status === 'processing' && (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full"
                          />
                        )}
                        {fileProgress.status === 'waiting' && <div className="w-5 h-5 bg-gray-300 rounded-full" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {fileProgress.file.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {(fileProgress.file.size / 1024 / 1024).toFixed(1)}MB
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="text-right">
                        <div className={`text-xs px-2 py-1 rounded ${
                          fileProgress.status === 'completed' ? 'bg-green-100 text-green-700' :
                          fileProgress.status === 'error' ? 'bg-red-100 text-red-700' :
                          fileProgress.status === 'skipped' ? 'bg-orange-100 text-orange-700' :
                          fileProgress.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {fileProgress.status === 'completed' ? 'Terminé' :
                           fileProgress.status === 'error' ? 'Erreur' :
                           fileProgress.status === 'skipped' ? 'Ignoré' :
                           fileProgress.status === 'processing' ? 'En cours' :
                           'En attente'}
                        </div>
                        {fileProgress.processedAt && (
                          <div className="text-xs text-gray-500 mt-1">
                            {fileProgress.processedAt.toLocaleTimeString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {fileProgress.status === 'processing' && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-1">
                        <div 
                          className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                          style={{ width: `${fileProgress.progress}%` }}
                        />
                      </div>
                      {/* Message de conversion PDF */}
                      {fileProgress.debugInfo?.phase === 'pdf-conversion' && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-blue-600 bg-blue-50 p-2 rounded">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          >
                            <ArrowPathIcon className="w-4 h-4" />
                          </motion.div>
                          <span className="font-medium">Extraction de texte et OCR en cours...</span>
                          <span className="text-blue-500">(iLovePDF API)</span>
                        </div>
                      )}
                      
                      {/* Message de retraitement automatique */}
                      {fileProgress.debugInfo?.phase === 'reprocessing' && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-orange-600 bg-orange-50 p-2 rounded border border-orange-200">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          >
                            <ExclamationTriangleIcon className="w-4 h-4" />
                          </motion.div>
                          <div className="flex-1">
                            <span className="font-medium">Retraitement automatique en cours...</span>
                            <div className="text-orange-500 text-xs mt-1">
                              Extraction partielle détectée - Tentative avec méthode alternative
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {fileProgress.error && (
                    <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded border">
                      {fileProgress.error}
                    </div>
                  )}
                  
                  {/* Informations de debug par fichier */}
                  {debugMode && fileProgress.debugInfo && (
                    <div className="mt-2 text-xs bg-gray-100 p-2 rounded border font-mono">
                      <strong>Debug:</strong> {JSON.stringify(fileProgress.debugInfo, null, 2)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Message de succès final */}
      {uploadStatus.status === 'completed' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-6 bg-green-50 rounded-lg border border-green-200"
        >
          <div className="flex items-center gap-3 mb-3">
            <CheckCircleIcon className="w-8 h-8 text-green-600" />
            <div>
              <h4 className="font-semibold text-green-900 text-lg">Traitement par lots terminé !</h4>
              <p className="text-green-700">
                {uploadStatus.successFiles} factures validées sur {uploadStatus.totalFiles} traitées
                {uploadStatus.errorFiles > 0 && ` • ${uploadStatus.errorFiles} erreurs`}
              </p>
              <p className="text-sm text-green-600 mt-1">
                ✅ Factures automatiquement ajoutées à votre liste persistante
              </p>
            </div>
          </div>
          
          {/* L'ancien message conditionnel est remplacé par le toast en haut */}
          
          {batchStats && (
            <div className="mt-4 text-sm text-green-600">
              <p>⚡ Performance: {batchStats.processingSpeed} • 
                 Temps total: {Math.round((new Date().getTime() - processingStartTime!.getTime()) / 1000 / 60)} minutes</p>
            </div>
          )}
        </motion.div>
      )}
      
      {/* Modal d'explication si aucun plan de reconquête */}
      {showNoPlansModal && noPlansStats && (
        <NoPlansExplanationModal
          isOpen={showNoPlansModal}
          onClose={() => setShowNoPlansModal(false)}
          statistics={noPlansStats}
        />
      )}
    </div>
  );
};