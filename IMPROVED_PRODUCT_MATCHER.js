import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Classe améliorée pour matcher les produits Soprema
export class ImprovedSopremaProductMatcher {
  constructor() {
    this.sopremaProducts = [];
    this.sopremaKeywordsIndex = new Map(); // Index pour recherche rapide
    this.loaded = false;
  }

  // Charger la base de données et créer l'index
  async loadDatabase() {
    if (this.loaded) return;

    try {
      const filteredPath = path.join(__dirname, 'Produits_Soprema_France_Final.json');
      const data = await fs.readFile(filteredPath, 'utf8');
      const jsonData = JSON.parse(data);
      this.sopremaProducts = jsonData.produits || jsonData;
      
      // Créer un index de mots-clés pour recherche rapide
      await this.createKeywordIndex();
      
      this.loaded = true;
      console.log(`✅ Base Soprema AMÉLIORÉE chargée: ${this.sopremaProducts.length} produits`);
      console.log(`📚 Index de mots-clés créé: ${this.sopremaKeywordsIndex.size} entrées`);
    } catch (error) {
      console.error('❌ Erreur chargement base Soprema:', error);
      throw new Error('Impossible de charger la base de produits Soprema');
    }
  }

  // Créer un index de mots-clés pour recherche rapide
  async createKeywordIndex() {
    for (const product of this.sopremaProducts) {
      const productName = product.nom_complet || product.nom || product.name || product;
      const words = this.extractKeywords(productName);
      
      for (const word of words) {
        if (!this.sopremaKeywordsIndex.has(word)) {
          this.sopremaKeywordsIndex.set(word, []);
        }
        this.sopremaKeywordsIndex.get(word).push(product);
      }
    }
  }

  // Extraire les mots-clés significatifs d'un nom de produit
  extractKeywords(productName) {
    if (!productName) return [];
    
    return productName
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length >= 3) // Mots de 3+ caractères
      .filter(word => !this.isStopWord(word)); // Exclure mots vides
  }

  // Mots vides à ignorer
  isStopWord(word) {
    const stopWords = ['THE', 'AND', 'FOR', 'WITH', 'FROM', 'PAR', 'POUR', 'AVEC', 'SANS'];
    return stopWords.includes(word);
  }

  // Normaliser un nom de produit (version améliorée)
  normalizeProductName(name) {
    if (!name) return '';
    return name
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Vérifier si le produit contient des mots-clés Soprema (version étendue)
  checkSopremaKeywords(productName) {
    const sopremaKeywords = [
      // Marques principales
      'SOPRA', 'SOPREMA', 'ELASTOPHENE', 'SOPRALENE', 'SOPRAFIX', 'SOPRFIX',
      'MAMMOUTH', 'ALSAN', 'CURAL', 'EFISARKING', 'SOPRASOLAR', 'EFISOL',
      'SARNAVAP', 'PAVAFLEX', 'PAVATEX', 'SOPRASMART', 'SOPRADUR',
      
      // Gammes spécialisées
      'FLASHING', 'VAPOR', 'PRIMER', 'DEPCO', 'FLAG', 'VERASOL', 'TEXSELF',
      'COLPHENE', 'BANDALU', 'SOPRALOOP', 'SOPRAWALL', 'SOPRAFIX',
      
      // Références techniques courantes
      'ELASTOPHENE', 'COLPOR', 'VEDAFLEX', 'VEDATOP', 'MASTERTOP',
      'SOPRALITHE', 'SOPRAJOINT', 'SOPRACOUCHE'
    ];

    const normalized = this.normalizeProductName(productName);
    
    for (const keyword of sopremaKeywords) {
      if (normalized.includes(keyword)) {
        return { found: true, keyword, confidence: 'high' };
      }
    }
    
    return { found: false };
  }

  // Recherche rapide par index de mots-clés
  async findByKeywordIndex(productName) {
    const keywords = this.extractKeywords(productName);
    const candidateProducts = new Set();
    
    // Trouver tous les produits qui partagent des mots-clés
    for (const keyword of keywords) {
      if (this.sopremaKeywordsIndex.has(keyword)) {
        const products = this.sopremaKeywordsIndex.get(keyword);
        products.forEach(p => candidateProducts.add(p));
      }
    }
    
    return Array.from(candidateProducts);
  }

  // Calculer un score de correspondance avancé
  calculateAdvancedScore(inputName, productName, inputKeywords, productKeywords) {
    // Score basé sur la similarité de Levenshtein
    const maxLen = Math.max(inputName.length, productName.length);
    const distance = this.levenshteinDistance(inputName, productName);
    let levenshteinScore = Math.round((1 - distance / maxLen) * 100);
    
    // Score basé sur les mots-clés partagés
    const sharedKeywords = inputKeywords.filter(k => productKeywords.includes(k));
    const keywordScore = sharedKeywords.length > 0 
      ? (sharedKeywords.length / Math.max(inputKeywords.length, productKeywords.length)) * 100
      : 0;
    
    // Score basé sur l'inclusion
    let inclusionScore = 0;
    if (inputName.includes(productName) || productName.includes(inputName)) {
      inclusionScore = 90;
    }
    
    // Score final pondéré
    const finalScore = Math.max(
      levenshteinScore * 0.4 + keywordScore * 0.6, // Privilégier les mots-clés
      inclusionScore,
      keywordScore > 80 ? keywordScore : 0 // Score élevé si beaucoup de mots partagés
    );
    
    return Math.min(Math.round(finalScore), 100);
  }

  // Distance de Levenshtein optimisée
  levenshteinDistance(str1, str2) {
    const m = str1.length;
    const n = str2.length;
    
    if (m === 0) return n;
    if (n === 0) return m;
    
    const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
    
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = Math.min(
            dp[i - 1][j] + 1,
            dp[i][j - 1] + 1,
            dp[i - 1][j - 1] + 1
          );
        }
      }
    }
    return dp[m][n];
  }

  // Trouver la meilleure correspondance (version optimisée)
  async findBestMatch(productName) {
    if (!this.loaded) {
      await this.loadDatabase();
    }

    const normalizedInput = this.normalizeProductName(productName);
    const inputKeywords = this.extractKeywords(productName);
    
    // 1. Vérification mot-clé Soprema prioritaire
    const keywordCheck = this.checkSopremaKeywords(productName);
    if (keywordCheck.found) {
      console.log(`🎯 Mot-clé Soprema détecté: "${keywordCheck.keyword}" dans "${productName}"`);
    }
    
    // 2. Recherche rapide par index si on a des mots-clés
    let candidates = [];
    if (inputKeywords.length > 0) {
      candidates = await this.findByKeywordIndex(productName);
      console.log(`🔍 ${candidates.length} candidats trouvés par index pour "${productName}"`);
    }
    
    // 3. Si peu de candidats, recherche dans toute la base
    if (candidates.length < 10) {
      candidates = this.sopremaProducts;
    }
    
    // 4. Évaluation des candidats
    let bestMatch = null;
    let bestScore = 0;
    let bestMethod = 'none';

    for (const sopremaProduct of candidates) {
      const sopremaName = sopremaProduct.nom_complet || sopremaProduct.nom || sopremaProduct.name || sopremaProduct;
      const sopremaNorm = this.normalizeProductName(sopremaName);
      const sopremaKeywords = this.extractKeywords(sopremaName);
      
      // Correspondance exacte (priorité maximale)
      if (normalizedInput === sopremaNorm) {
        return {
          matched: true,
          confidence: 100,
          matchedProduct: sopremaName,
          method: 'exact',
          details: 'Correspondance exacte'
        };
      }
      
      // Score avancé
      let score = this.calculateAdvancedScore(normalizedInput, sopremaNorm, inputKeywords, sopremaKeywords);
      
      // Bonus pour mot-clé Soprema
      if (keywordCheck.found) {
        score = Math.min(score + 15, 100);
      }
      
      // Bonus pour correspondance partielle de mots-clés critiques
      const criticalMatches = inputKeywords.filter(k => 
        sopremaKeywords.includes(k) && k.length >= 4
      );
      if (criticalMatches.length >= 2) {
        score = Math.min(score + 10, 100);
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatch = sopremaName;
        bestMethod = score >= 95 ? 'high-confidence' : 'fuzzy';
      }
    }

    // 5. Déterminer si c'est un match valide
    const isMatched = bestScore >= 85 || (keywordCheck.found && bestScore >= 70);

    return {
      matched: isMatched,
      confidence: bestScore,
      matchedProduct: bestMatch,
      method: bestMethod,
      keywordFound: keywordCheck.found ? keywordCheck.keyword : null,
      details: `Score: ${bestScore}%, Méthode: ${bestMethod}${keywordCheck.found ? ', Mot-clé Soprema: ' + keywordCheck.keyword : ''}`
    };
  }

  // Créer un échantillon de produits pour enrichir le prompt Claude
  async getTopProductsForPrompt(limit = 500) {
    if (!this.loaded) {
      await this.loadDatabase();
    }

    // Sélectionner les produits les plus représentatifs
    const topProducts = this.sopremaProducts
      .filter(p => {
        const name = p.nom_complet || p.nom || p.name || p;
        return name && name.length > 10; // Exclure les noms trop courts
      })
      .sort((a, b) => {
        // Prioriser les produits avec des mots-clés Soprema
        const aName = a.nom_complet || a.nom || a.name || a;
        const bName = b.nom_complet || b.nom || b.name || b;
        const aHasKeyword = this.checkSopremaKeywords(aName).found;
        const bHasKeyword = this.checkSopremaKeywords(bName).found;
        
        if (aHasKeyword && !bHasKeyword) return -1;
        if (!aHasKeyword && bHasKeyword) return 1;
        return aName.localeCompare(bName);
      })
      .slice(0, limit);

    return topProducts.map(p => p.nom_complet || p.nom || p.name || p);
  }

  // Vérifier et reclassifier une liste de produits (version améliorée)
  async verifyProducts(products) {
    if (!Array.isArray(products)) return products;

    const verifiedProducts = [];
    let reclassifiedCount = 0;
    let sopremaTotal = 0;
    let competitorTotal = 0;
    let uncertainCount = 0;

    console.log(`\n🔍 Vérification AMÉLIORÉE de ${products.length} produits...`);

    for (const product of products) {
      const match = await this.findBestMatch(product.designation || product.name);
      const verifiedProduct = { ...product };
      
      // Classification selon la confiance et les mots-clés
      if (match.matched && match.confidence >= 85) {
        if (product.isCompetitor || product.type === 'competitor') {
          // Reclassification vers Soprema
          console.log(`✅ RECLASSIFIÉ: "${product.designation}" → Soprema (${match.confidence}%)`);
          console.log(`   📝 Détails: ${match.details}`);
          
          verifiedProduct.isCompetitor = false;
          verifiedProduct.type = 'soprema';
          verifiedProduct.verificationDetails = {
            reclassified: true,
            originalClassification: 'competitor',
            matchedName: match.matchedProduct,
            confidence: match.confidence,
            method: match.method,
            details: match.details
          };
          
          reclassifiedCount++;
          sopremaTotal += (product.totalPrice || 0);
        } else {
          // Confirmation Soprema
          console.log(`✅ CONFIRMÉ Soprema: "${product.designation}" (${match.confidence}%)`);
          verifiedProduct.verificationDetails = {
            confirmed: true,
            confidence: match.confidence,
            details: match.details
          };
          sopremaTotal += (product.totalPrice || 0);
        }
      } else if (match.confidence >= 50 && match.confidence < 85) {
        // Zone d'incertitude - nécessite révision
        console.log(`⚠️  INCERTAIN: "${product.designation}" (${match.confidence}%)`);
        console.log(`   📝 Détails: ${match.details}`);
        
        verifiedProduct.verificationDetails = {
          uncertain: true,
          confidence: match.confidence,
          suggestedReview: true,
          details: match.details,
          originalClassification: product.isCompetitor ? 'competitor' : 'soprema'
        };
        
        uncertainCount++;
        
        // Garder la classification originale
        if (product.isCompetitor || product.type === 'competitor') {
          competitorTotal += (product.totalPrice || 0);
        } else {
          sopremaTotal += (product.totalPrice || 0);
        }
      } else {
        // Faible correspondance - probablement concurrent
        if (product.isCompetitor || product.type === 'competitor') {
          console.log(`✅ CONFIRMÉ Concurrent: "${product.designation}" (${match.confidence}%)`);
          competitorTotal += (product.totalPrice || 0);
        } else {
          // Potentiel concurrent mal classifié
          console.log(`⚠️  POTENTIEL Concurrent: "${product.designation}" (${match.confidence}%)`);
        }
        
        verifiedProduct.verificationDetails = {
          lowMatch: true,
          confidence: match.confidence,
          details: match.details
        };
        
        if (product.isCompetitor || product.type === 'competitor') {
          competitorTotal += (product.totalPrice || 0);
        } else {
          sopremaTotal += (product.totalPrice || 0);
        }
      }

      verifiedProducts.push(verifiedProduct);
    }

    console.log(`\n📊 RÉSUMÉ VÉRIFICATION AMÉLIORÉE:`);
    console.log(`   ✅ Produits reclassifiés: ${reclassifiedCount}`);
    console.log(`   ⚠️  Produits incertains: ${uncertainCount}`);
    console.log(`   💰 Total Soprema: ${sopremaTotal.toFixed(2)}€`);
    console.log(`   💰 Total Concurrent: ${competitorTotal.toFixed(2)}€`);

    return {
      products: verifiedProducts,
      summary: {
        totalProducts: products.length,
        reclassifiedCount,
        uncertainCount,
        sopremaTotal,
        competitorTotal,
        verificationCompleted: true,
        accuracyImproved: true
      }
    };
  }
}

// Instance singleton améliorée
export const improvedSopremaProductMatcher = new ImprovedSopremaProductMatcher();