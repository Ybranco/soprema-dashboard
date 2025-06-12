import ILovePDFApi from '@ilovepdf/ilovepdf-nodejs';
import fetch from 'node-fetch';
import fs from 'fs/promises';
import FormData from 'form-data';

// Wrapper pour iLovePDF qui utilise directement l'API REST
// pour contourner le problème de date système
export class ILovePDFWrapper {
  constructor(publicKey, secretKey) {
    this.publicKey = publicKey;
    this.secretKey = secretKey;
    this.baseUrl = 'https://api.ilovepdf.com/v1';
    this.token = null;
    this.tokenExpiry = null;
  }

  async authenticate() {
    try {
      const response = await fetch(`${this.baseUrl}/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ public_key: this.publicKey })
      });

      if (!response.ok) {
        throw new Error(`Auth failed: ${response.status}`);
      }

      const data = await response.json();
      this.token = data.token;
      // Token valide pour 2 heures
      this.tokenExpiry = Date.now() + (2 * 60 * 60 * 1000);
      
      return this.token;
    } catch (error) {
      console.error('Erreur authentification iLovePDF:', error);
      throw error;
    }
  }

  async ensureAuthenticated() {
    if (!this.token || Date.now() >= this.tokenExpiry) {
      await this.authenticate();
    }
  }

  // Fonction OCR pour extraire le texte d'un PDF scanné
  async ocrPdf(pdfPath, outputPath) {
    try {
      // Validation du fichier d'entrée
      try {
        const stats = await fs.stat(pdfPath);
        if (stats.size === 0) {
          throw new Error('Le fichier PDF est vide');
        }
        if (stats.size > 50 * 1024 * 1024) { // 50MB max
          throw new Error('Le fichier PDF est trop gros (max 50MB)');
        }
        
        // Vérifier que c'est bien un PDF
        const buffer = await fs.readFile(pdfPath);
        const header = buffer.toString('ascii', 0, 5);
        if (header !== '%PDF-') {
          throw new Error('Le fichier n\'est pas un PDF valide');
        }
      } catch (error) {
        console.error('❌ Erreur validation fichier:', error.message);
        throw error;
      }
      
      await this.ensureAuthenticated();

      // Étape 1: Créer une tâche OCR
      console.log('→ Création de la tâche OCR PDF...');
      const startResponse = await fetch(`${this.baseUrl}/start/pdfocr`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${this.token}` }
      });

      if (!startResponse.ok) {
        throw new Error(`Start OCR task failed: ${startResponse.status}`);
      }

      const { server, task } = await startResponse.json();
      console.log(`✓ Tâche OCR créée: ${task}`);

      // Étape 2: Upload du fichier
      console.log('→ Upload du fichier PDF pour OCR...');
      const formData = new FormData();
      formData.append('task', task);
      formData.append('file', await fs.readFile(pdfPath), {
        filename: 'invoice.pdf',
        contentType: 'application/pdf'
      });

      const uploadResponse = await fetch(`https://${server}/v1/upload`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${this.token}`,
          ...formData.getHeaders()
        },
        body: formData
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.status}`);
      }

      const uploadData = await uploadResponse.json();
      console.log('✓ Fichier uploadé pour OCR');
      console.log('   Données upload:', JSON.stringify(uploadData, null, 2));

      // Étape 3: Traiter l'OCR
      console.log('→ OCR en cours...');
      
      // L'API peut retourner soit un objet direct, soit un tableau
      const fileData = Array.isArray(uploadData) ? uploadData[0] : uploadData;
      
      const processBody = {
        task: task,
        tool: 'pdfocr',
        files: [{
          server_filename: fileData.server_filename,
          filename: fileData.filename || 'invoice.pdf'
        }],
        ocr_languages: ['fra', 'eng', 'deu'], // Français, Anglais, Allemand
        ocr_searchable_pdf: true // Créer un PDF searchable
      };
      
      console.log('   Body de process OCR:', JSON.stringify(processBody, null, 2));
      
      const processResponse = await fetch(`https://${server}/v1/process`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(processBody)
      });

      if (!processResponse.ok) {
        const errorText = await processResponse.text();
        console.error('   Erreur process OCR:', errorText);
        throw new Error(`OCR Process failed: ${processResponse.status} - ${errorText}`);
      }

      console.log('✓ OCR terminé');

      // Étape 4: Télécharger le résultat
      console.log('→ Téléchargement du PDF avec OCR...');
      const downloadResponse = await fetch(`https://${server}/v1/download/${task}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${this.token}` }
      });

      if (!downloadResponse.ok) {
        throw new Error(`Download failed: ${downloadResponse.status}`);
      }

      const arrayBuffer = await downloadResponse.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // Vérifier que le buffer n'est pas vide
      if (buffer.length === 0) {
        throw new Error('Le fichier téléchargé depuis iLovePDF est vide');
      }
      
      await fs.writeFile(outputPath, buffer);
      
      // Vérifier que le fichier a bien été écrit
      const stats = await fs.stat(outputPath);
      if (stats.size === 0) {
        throw new Error('Le fichier de sortie est vide après écriture');
      }
      
      console.log(`✅ OCR réussi! PDF searchable créé. Taille: ${stats.size} bytes`);
      
      // Nettoyer la tâche
      try {
        await fetch(`https://${server}/v1/task/${task}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${this.token}` }
        });
      } catch (e) {
        // Ignorer les erreurs de suppression
      }

      return outputPath;

    } catch (error) {
      console.error('❌ Erreur OCR iLovePDF:', error.message);
      throw error;
    }
  }
  
  async convertPdfToJpg(pdfPath, outputPath) {
    try {
      // Validation du fichier d'entrée
      try {
        const stats = await fs.stat(pdfPath);
        if (stats.size === 0) {
          throw new Error('Le fichier PDF est vide');
        }
        if (stats.size > 50 * 1024 * 1024) { // 50MB max
          throw new Error('Le fichier PDF est trop gros (max 50MB)');
        }
        
        // Vérifier que c'est bien un PDF
        const buffer = await fs.readFile(pdfPath);
        const header = buffer.toString('ascii', 0, 5);
        if (header !== '%PDF-') {
          throw new Error('Le fichier n\'est pas un PDF valide');
        }
      } catch (error) {
        console.error('❌ Erreur validation fichier:', error.message);
        throw error;
      }
      
      await this.ensureAuthenticated();

      // Étape 1: Créer une tâche
      console.log('→ Création de la tâche PDF to JPG...');
      const startResponse = await fetch(`${this.baseUrl}/start/pdfjpg`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${this.token}` }
      });

      if (!startResponse.ok) {
        throw new Error(`Start task failed: ${startResponse.status}`);
      }

      const { server, task } = await startResponse.json();
      console.log(`✓ Tâche créée: ${task}`);

      // Étape 2: Upload du fichier
      console.log('→ Upload du fichier PDF...');
      const formData = new FormData();
      formData.append('task', task);
      formData.append('file', await fs.readFile(pdfPath), {
        filename: 'invoice.pdf',
        contentType: 'application/pdf'
      });

      const uploadResponse = await fetch(`https://${server}/v1/upload`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${this.token}`,
          ...formData.getHeaders()
        },
        body: formData
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.status}`);
      }

      const uploadData = await uploadResponse.json();
      console.log('✓ Fichier uploadé');
      console.log('   Données upload:', JSON.stringify(uploadData, null, 2));

      // Étape 3: Traiter la conversion
      console.log('→ Conversion en cours...');
      
      // L'API peut retourner soit un objet direct, soit un tableau
      const fileData = Array.isArray(uploadData) ? uploadData[0] : uploadData;
      
      const processBody = {
        task: task,
        tool: 'pdfjpg',
        files: [{
          server_filename: fileData.server_filename,
          filename: fileData.filename || 'invoice.pdf'
        }],
        pdfjpg_mode: 'pages'
      };
      
      console.log('   Body de process:', JSON.stringify(processBody, null, 2));
      
      const processResponse = await fetch(`https://${server}/v1/process`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(processBody)
      });

      if (!processResponse.ok) {
        const errorText = await processResponse.text();
        console.error('   Erreur process:', errorText);
        throw new Error(`Process failed: ${processResponse.status} - ${errorText}`);
      }

      console.log('✓ Conversion terminée');

      // Étape 4: Télécharger le résultat
      console.log('→ Téléchargement du résultat...');
      const downloadResponse = await fetch(`https://${server}/v1/download/${task}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${this.token}` }
      });

      if (!downloadResponse.ok) {
        throw new Error(`Download failed: ${downloadResponse.status}`);
      }

      const arrayBuffer = await downloadResponse.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // Vérifier que le buffer n'est pas vide
      if (buffer.length === 0) {
        throw new Error('Le fichier téléchargé depuis iLovePDF est vide');
      }
      
      // Vérifier taille minimale (un JPG valide fait au moins 1KB)
      if (buffer.length < 1024) {
        throw new Error(`Le fichier téléchargé est trop petit (${buffer.length} bytes) - conversion échouée`);
      }
      
      // Vérifier la signature JPG (premiers bytes doivent être FF D8 FF)
      if (buffer[0] !== 0xFF || buffer[1] !== 0xD8 || buffer[2] !== 0xFF) {
        throw new Error('Le fichier téléchargé n\'est pas un JPG valide - conversion échouée');
      }
      
      await fs.writeFile(outputPath, buffer);
      
      // Vérifier que le fichier a bien été écrit
      const stats = await fs.stat(outputPath);
      if (stats.size === 0) {
        throw new Error('Le fichier de sortie est vide après écriture');
      }
      
      console.log(`✅ Conversion réussie avec l'API REST directe! Taille: ${stats.size} bytes`);
      
      // Nettoyer la tâche
      try {
        await fetch(`https://${server}/v1/task/${task}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${this.token}` }
        });
      } catch (e) {
        // Ignorer les erreurs de suppression
      }

      return outputPath;

    } catch (error) {
      console.error('❌ Erreur conversion iLovePDF:', error.message);
      throw error;
    }
  }
}

// Fonction pour remplacer l'usage du package défaillant
export async function convertWithILovePDF(publicKey, secretKey, pdfPath, outputPath) {
  const wrapper = new ILovePDFWrapper(publicKey, secretKey);
  return await wrapper.convertPdfToJpg(pdfPath, outputPath);
}

// Fonction pour faire l'OCR d'un PDF
export async function ocrWithILovePDF(publicKey, secretKey, pdfPath, outputPath) {
  const wrapper = new ILovePDFWrapper(publicKey, secretKey);
  return await wrapper.ocrPdf(pdfPath, outputPath);
}