import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Classe pour matcher les produits Soprema
export class SopremaProductMatcher {
  constructor() {
    this.sopremaProducts = [];
    this.loaded = false;
  }

  // Charger la base de données des produits Soprema
  async loadDatabase() {
    if (this.loaded) return;

    try {
      // Essayer d'abord la base filtrée (sans non-produits)
      const filteredPath = path.join(__dirname, 'Produits_Soprema_France_Final.json');
      const data = await fs.readFile(filteredPath, 'utf8');
      const jsonData = JSON.parse(data);
      this.sopremaProducts = jsonData.produits || jsonData;
      this.loaded = true;
      console.log(`✅ Base Soprema FILTRÉE chargée: ${this.sopremaProducts.length} produits`);
      console.log(`🚫 ${jsonData.metadata?.excluded_count || 0} non-produits exclus (vêtements, services, etc.)`);
    } catch (error) {
      // Fallback sur l'ancienne base si la filtrée n'existe pas
      try {
        const jsonPath = path.join(__dirname, 'Produits_Soprema_France.json');
        const data = await fs.readFile(jsonPath, 'utf8');
        const jsonData = JSON.parse(data);
        this.sopremaProducts = jsonData.produits || jsonData;
        this.loaded = true;
        console.log(`⚠️  Base Soprema NON FILTRÉE chargée: ${this.sopremaProducts.length} produits`);
        console.log(`⚠️  Attention: inclut des non-produits (vêtements, services)`);
      } catch (fallbackError) {
        console.error('❌ Erreur chargement bases Soprema:', fallbackError);
        throw new Error('Impossible de charger la base de produits Soprema');
      }
    }
  }

  // Normaliser un nom de produit pour la comparaison
  normalizeProductName(name) {
    if (!name) return '';
    return name
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, ' ')  // Remplacer caractères spéciaux par espaces
      .replace(/\s+/g, ' ')           // Normaliser espaces multiples
      .trim();
  }

  // Calculer la distance de Levenshtein entre deux chaînes
  levenshteinDistance(str1, str2) {
    const m = str1.length;
    const n = str2.length;
    const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = Math.min(
            dp[i - 1][j] + 1,    // deletion
            dp[i][j - 1] + 1,    // insertion
            dp[i - 1][j - 1] + 1 // substitution
          );
        }
      }
    }
    return dp[m][n];
  }

  // Calculer le score de similarité (0-100%)
  calculateSimilarity(str1, str2) {
    const maxLen = Math.max(str1.length, str2.length);
    if (maxLen === 0) return 100;
    
    const distance = this.levenshteinDistance(str1, str2);
    return Math.round((1 - distance / maxLen) * 100);
  }

  // Vérifier si le produit contient des mots-clés Soprema
  checkSopremaKeywords(productName) {
    const sopremaKeywords = [
      'SOPRA', 'SOPREMA', 'ELASTOPHENE', 'SOPRALENE', 'SOPRAFIX', 'SOPRFIX',
      'MAMMOUTH', 'ALSAN', 'CURAL', 'EFISARKING', 'SOPRASOLAR', 'EFISOL',
      'FLASHING', 'VAPOR', 'PRIMER', 'DEPCO', 'FLAG', 'VERASOL', 'TEXSELF'
    ];

    const normalized = this.normalizeProductName(productName);
    
    for (const keyword of sopremaKeywords) {
      if (normalized.includes(keyword)) {
        return { found: true, keyword };
      }
    }
    
    return { found: false };
  }

  // Trouver la meilleure correspondance pour un produit
  async findBestMatch(productName) {
    if (!this.loaded) {
      await this.loadDatabase();
    }

    const normalizedInput = this.normalizeProductName(productName);
    
    // 1. Vérification exacte
    const exactMatch = this.sopremaProducts.find(p => 
      this.normalizeProductName(p.nom_complet || p.nom || p.name || p) === normalizedInput
    );
    
    if (exactMatch) {
      return {
        matched: true,
        confidence: 100,
        matchedProduct: exactMatch.nom_complet || exactMatch.nom || exactMatch.name || exactMatch,
        method: 'exact'
      };
    }

    // 2. Vérification par mots-clés Soprema
    const keywordCheck = this.checkSopremaKeywords(productName);
    
    // 3. Recherche par similarité
    let bestMatch = null;
    let bestScore = 0;

    for (const sopremaProduct of this.sopremaProducts) {
      const sopremaNorm = this.normalizeProductName(sopremaProduct.nom_complet || sopremaProduct.nom || sopremaProduct.name || sopremaProduct);
      
      // Similarité complète
      let score = this.calculateSimilarity(normalizedInput, sopremaNorm);
      
      // Bonus si contient un mot-clé Soprema
      if (keywordCheck.found) {
        score += 10;
      }

      // Vérifier aussi si le produit Soprema est contenu dans l'input ou vice-versa
      if (normalizedInput.includes(sopremaNorm) || sopremaNorm.includes(normalizedInput)) {
        score = Math.max(score, 90);
      }

      // Comparaison par mots individuels
      const inputWords = normalizedInput.split(' ').filter(w => w.length > 2);
      const sopremaWords = sopremaNorm.split(' ').filter(w => w.length > 2);
      const commonWords = inputWords.filter(w => sopremaWords.includes(w));
      
      if (commonWords.length >= 2) {
        const wordScore = (commonWords.length / Math.max(inputWords.length, sopremaWords.length)) * 100;
        score = Math.max(score, wordScore);
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatch = sopremaProduct.nom_complet || sopremaProduct.nom || sopremaProduct.name || sopremaProduct;
      }
    }

    // Si on a un mot-clé Soprema et un score decent, on augmente la confiance
    if (keywordCheck.found && bestScore >= 70) {
      bestScore = Math.min(bestScore + 15, 100);
    }

    return {
      matched: bestScore >= 85,
      confidence: bestScore,
      matchedProduct: bestMatch,
      method: bestScore === 100 ? 'exact' : 'fuzzy',
      keywordFound: keywordCheck.found ? keywordCheck.keyword : null
    };
  }

  // Vérifier et reclassifier une liste de produits
  async verifyProducts(products) {
    if (!Array.isArray(products)) return products;

    const verifiedProducts = [];
    let reclassifiedCount = 0;
    let sopremaTotal = 0;
    let competitorTotal = 0;

    console.log(`\n🔍 Vérification de ${products.length} produits...`);

    for (const product of products) {
      const match = await this.findBestMatch(product.designation || product.name);
      
      const verifiedProduct = { ...product };
      
      if (match.matched && (product.isCompetitor || product.type === 'competitor')) {
        // Produit mal classifié - c'est un produit Soprema !
        console.log(`✅ Reclassifié comme Soprema: "${product.designation}" → "${match.matchedProduct}" (${match.confidence}%)`);
        
        verifiedProduct.isCompetitor = false;
        verifiedProduct.type = 'soprema';
        verifiedProduct.verificationDetails = {
          reclassified: true,
          originalClassification: 'competitor',
          matchedName: match.matchedProduct,
          confidence: match.confidence,
          method: match.method,
          keywordFound: match.keywordFound
        };
        
        reclassifiedCount++;
        sopremaTotal += (product.totalPrice || 0);
      } else if (!match.matched && !product.isCompetitor && product.type !== 'competitor') {
        // Potentiellement un produit concurrent mal classifié comme Soprema
        if (match.confidence < 50) {
          console.log(`⚠️  Faible correspondance Soprema: "${product.designation}" (${match.confidence}%)`);
          // On pourrait le marquer pour révision manuelle
          verifiedProduct.verificationDetails = {
            lowConfidence: true,
            confidence: match.confidence,
            suggestedReview: true
          };
        }
        sopremaTotal += (product.totalPrice || 0);
      } else {
        // Classification correcte
        if (product.isCompetitor || product.type === 'competitor') {
          competitorTotal += (product.totalPrice || 0);
        } else {
          sopremaTotal += (product.totalPrice || 0);
        }
        
        verifiedProduct.verificationDetails = {
          verified: true,
          confidence: match.confidence
        };
      }

      verifiedProducts.push(verifiedProduct);
    }

    console.log(`\n📊 Résumé de la vérification:`);
    console.log(`   - Produits reclassifiés: ${reclassifiedCount}`);
    console.log(`   - Total Soprema: ${sopremaTotal.toFixed(2)}€`);
    console.log(`   - Total Concurrent: ${competitorTotal.toFixed(2)}€`);

    return {
      products: verifiedProducts,
      summary: {
        totalProducts: products.length,
        reclassifiedCount,
        sopremaTotal,
        competitorTotal,
        verificationCompleted: true
      }
    };
  }
}

// Instance singleton
export const sopremaProductMatcher = new SopremaProductMatcher();