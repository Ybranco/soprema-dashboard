import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * MÉTHODE HYBRIDE OPTIMISÉE POUR SOPREMA
 * 
 * Combine :
 * 1. Prompt Claude enrichi avec gammes principales 
 * 2. Scoring de similarité textuelle précis
 * 3. Seuil de décision à 80%+
 */
export class HybridSopremaMethod {
  constructor() {
    this.sopremaProducts = [];
    this.normalizedIndex = new Map(); // Index produits normalisés pour recherche rapide
    this.loaded = false;
    this.SIMILARITY_THRESHOLD = 65; // Seuil pour considérer un match Soprema
    
    // 🚫 MOTS-CLÉS POUR DÉTECTER LES FRAIS PARASITES (à exclure)
    this.EXCLUDED_KEYWORDS = [
      // Frais de transport et livraison
      'frais de port', 'transport', 'livraison', 'acheminement', 'fret',
      'surcharge carburant', 'surcharge gazole', 'surcharge énergie',
      
      // Taxes et contributions
      'tva', 'écotaxe', 'deee', 'taxe', 'contribution',
      
      // Frais administratifs
      'frais de dossier', 'frais administratif', 'frais de gestion',
      'commission', 'courtage',
      
      // Services et main d'œuvre pure
      'main d\'œuvre', 'pose', 'installation', 'montage', 'démontage',
      'étude', 'conseil', 'formation', 'audit', 'expertise',
      
      // Emballage et conditionnement
      'emballage', 'conditionnement', 'palette', 'caisse', 'carton',
      
      // Assurances et garanties
      'assurance', 'garantie',
      
      // Remises et ristournes
      'remise', 'ristourne', 'escompte', 'rabais',
      
      // Acomptes et avances
      'acompte', 'avance', 'provision'
    ];
  }

  async loadDatabase() {
    if (this.loaded) return;

    try {
      const filteredPath = path.join(__dirname, 'Produits_Soprema_France_Final.json');
      const data = await fs.readFile(filteredPath, 'utf8');
      const jsonData = JSON.parse(data);
      this.sopremaProducts = jsonData.produits || jsonData;
      
      // Créer l'index normalisé pour comparaison rapide
      await this.createNormalizedIndex();
      
      this.loaded = true;
      console.log(`✅ Base Soprema HYBRIDE chargée: ${this.sopremaProducts.length} produits`);
      console.log(`📊 Index normalisé créé: ${this.normalizedIndex.size} entrées`);
    } catch (error) {
      console.error('❌ Erreur chargement base Soprema:', error);
      throw new Error('Impossible de charger la base de produits Soprema');
    }
  }

  // Créer un index des produits normalisés pour recherche rapide
  async createNormalizedIndex() {
    for (const product of this.sopremaProducts) {
      const productName = product.nom_complet || product.nom || product.name || product;
      const normalized = this.normalizeText(productName);
      
      if (!this.normalizedIndex.has(normalized)) {
        this.normalizedIndex.set(normalized, []);
      }
      this.normalizedIndex.get(normalized).push({
        original: productName,
        product: product
      });
    }
  }

  // Normalisation de texte optimisée pour la comparaison
  normalizeText(text) {
    if (!text) return '';
    
    return text
      .toUpperCase()
      .replace(/[^\w\s]/g, ' ')          // Remplacer ponctuation par espaces
      .replace(/\s+/g, ' ')              // Normaliser espaces multiples
      .replace(/\b(MM|CM|M|KG|G)\b/g, '') // Supprimer unités courantes
      .trim();
  }

  // Distance de Levenshtein optimisée avec early exit
  levenshteinDistance(str1, str2, maxDistance = null) {
    const m = str1.length;
    const n = str2.length;
    
    // Early exit si différence de taille trop importante
    if (maxDistance && Math.abs(m - n) > maxDistance) {
      return maxDistance + 1;
    }
    
    if (m === 0) return n;
    if (n === 0) return m;
    
    const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
    
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    
    for (let i = 1; i <= m; i++) {
      let minInRow = Infinity;
      for (let j = 1; j <= n; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = Math.min(
            dp[i - 1][j] + 1,     // deletion
            dp[i][j - 1] + 1,     // insertion
            dp[i - 1][j - 1] + 1  // substitution
          );
        }
        minInRow = Math.min(minInRow, dp[i][j]);
      }
      
      // Early exit si la ligne entière dépasse maxDistance
      if (maxDistance && minInRow > maxDistance) {
        return maxDistance + 1;
      }
    }
    
    return dp[m][n];
  }

  // Calculer le score de similarité avec pondérations
  calculateSimilarityScore(inputText, sopremaText) {
    const input = this.normalizeText(inputText);
    const soprema = this.normalizeText(sopremaText);
    
    // 1. Score Levenshtein de base
    const maxLen = Math.max(input.length, soprema.length);
    if (maxLen === 0) return 100;
    
    const distance = this.levenshteinDistance(input, soprema, Math.floor(maxLen * 0.3));
    const baseScore = Math.max(0, (1 - distance / maxLen) * 100);
    
    // 2. Bonus pour correspondance exacte
    if (input === soprema) return 100;
    
    // 3. Bonus pour inclusion (un texte contient l'autre)
    let inclusionBonus = 0;
    if (input.includes(soprema) || soprema.includes(input)) {
      inclusionBonus = 15;
    }
    
    // 4. Analyse des mots individuels
    const inputWords = input.split(' ').filter(w => w.length >= 3);
    const sopremaWords = soprema.split(' ').filter(w => w.length >= 3);
    
    let wordScore = 0;
    if (inputWords.length > 0 && sopremaWords.length > 0) {
      const commonWords = inputWords.filter(w => sopremaWords.includes(w));
      const totalWords = Math.max(inputWords.length, sopremaWords.length);
      wordScore = (commonWords.length / totalWords) * 100;
    }
    
    // 5. Bonus pour mots-clés Soprema spécifiques
    let keywordBonus = 0;
    const sopremaKeywords = ['ALSAN', 'ELASTOPHENE', 'SOPRALENE', 'SOPRAXPS', 'SOPRAFIX', 'SOPRAFLOR', 'PAVATEX'];
    
    // Détection directe du mot "SOPREMA" dans le nom du produit - PRIORITÉ MAXIMALE
    if (input.includes('SOPREMA')) {
      keywordBonus += 40; // Bonus très élevé pour produits explicitement Soprema
    }
    
    // Bonus pour autres mots-clés Soprema dans les deux textes
    for (const keyword of sopremaKeywords) {
      if (input.includes(keyword) && soprema.includes(keyword)) {
        keywordBonus += 10;
      }
    }
    
    // Score final pondéré avec priorité aux mots-clés SOPREMA
    let finalScore;
    
    if (input.includes('SOPREMA')) {
      // Si le produit contient "SOPREMA", score minimum de 80%
      finalScore = Math.max(
        80, // Score minimum garanti pour produits Soprema explicites
        baseScore * 0.6 + wordScore * 0.4 + inclusionBonus + Math.min(keywordBonus, 50)
      );
    } else {
      // Logique normale pour autres produits
      finalScore = Math.max(
        baseScore * 0.6 + wordScore * 0.4 + inclusionBonus + Math.min(keywordBonus, 30),
        wordScore > 70 ? wordScore + inclusionBonus : 0,
        baseScore > 90 ? baseScore + inclusionBonus : 0
      );
    }
    
    return Math.min(Math.round(finalScore), 100);
  }

  // 🚫 Détecter si un produit est un frais parasite à exclure
  isExcludedItem(productName) {
    if (!productName || typeof productName !== 'string') return false;
    
    const normalizedProduct = productName.toLowerCase().trim();
    
    // Vérifier chaque mot-clé d'exclusion
    for (const keyword of this.EXCLUDED_KEYWORDS) {
      if (normalizedProduct.includes(keyword.toLowerCase())) {
        console.log(`🚫 Frais parasite détecté: "${productName}" (contient: "${keyword}")`);
        return true;
      }
    }
    
    // Vérifications supplémentaires par pattern
    // Pourcentages (TVA, remises)
    if (/\b\d+%|\btva\b|remise/i.test(normalizedProduct)) {
      console.log(`🚫 Frais parasite détecté: "${productName}" (pourcentage/TVA/remise)`);
      return true;
    }
    
    // Montants négatifs (remises, ristournes)
    if (/^-\d+|^-\s*\d+|ristourne|crédit/i.test(normalizedProduct)) {
      console.log(`🚫 Frais parasite détecté: "${productName}" (montant négatif/ristourne)`);
      return true;
    }
    
    return false;
  }

  // Recherche du meilleur match avec scoring optimisé
  async findBestMatch(productName, returnTop5 = false) {
    if (!this.loaded) {
      await this.loadDatabase();
    }

    const normalizedInput = this.normalizeText(productName);
    
    // 1. Recherche exacte d'abord
    if (this.normalizedIndex.has(normalizedInput)) {
      const exactMatches = this.normalizedIndex.get(normalizedInput);
      return {
        matched: true,
        confidence: 100,
        score: 100,
        matchedProduct: exactMatches[0].original,
        method: 'exact',
        details: 'Correspondance exacte dans l\'index'
      };
    }

    // 2. Vérification spéciale pour produits contenant "SOPREMA"
    if (normalizedInput.includes('SOPREMA')) {
      console.log(`🎯 Produit contenant "SOPREMA" détecté - application de règle spéciale`);
      
      // Chercher une correspondance proche ou retourner un match générique
      let bestSopremaMatch = null;
      let bestScore = 0;
      
      for (const product of this.sopremaProducts.slice(0, 1000)) { // Limiter pour performance
        const sopremaName = product.nom_complet || product.nom || product.name || product;
        const score = this.calculateSimilarityScore(productName, sopremaName);
        
        if (score > bestScore) {
          bestScore = score;
          bestSopremaMatch = sopremaName;
        }
      }
      
      // Garantir un score minimum de 80% pour tout produit contenant "SOPREMA"
      const finalScore = Math.max(80, bestScore);
      
      return {
        matched: true,
        confidence: finalScore,
        score: finalScore,
        matchedProduct: bestSopremaMatch || 'Produit SOPREMA générique',
        method: 'soprema_keyword_priority',
        details: `Produit explicitement SOPREMA (score garanti: ${finalScore}%)`
      };
    }

    // 3. Scoring de similarité standard pour autres produits
    const results = [];
    let processed = 0;
    
    console.log(`🔍 Recherche par scoring pour: "${productName}"`);
    
    for (const product of this.sopremaProducts) {
      const sopremaName = product.nom_complet || product.nom || product.name || product;
      const score = this.calculateSimilarityScore(productName, sopremaName);
      
      if (score >= 60) { // Seuil minimum pour éviter trop de bruit
        results.push({
          score,
          matchedProduct: sopremaName,
          product: product
        });
      }
      
      processed++;
      if (processed % 2000 === 0) {
        console.log(`   📊 Traité ${processed}/${this.sopremaProducts.length} produits...`);
      }
    }

    // 3. Trier par score décroissant
    results.sort((a, b) => b.score - a.score);
    
    console.log(`   ✅ ${results.length} candidats trouvés, meilleur score: ${results[0]?.score || 0}%`);

    if (results.length === 0) {
      return {
        matched: false,
        confidence: 0,
        score: 0,
        matchedProduct: null,
        method: 'no_match',
        details: 'Aucune correspondance trouvée'
      };
    }

    const bestResult = results[0];
    const isMatched = bestResult.score >= this.SIMILARITY_THRESHOLD;

    const result = {
      matched: isMatched,
      confidence: bestResult.score,
      score: bestResult.score,
      matchedProduct: bestResult.matchedProduct,
      method: bestResult.score >= 95 ? 'high_similarity' : 'fuzzy_match',
      details: `Score: ${bestResult.score}% (seuil: ${this.SIMILARITY_THRESHOLD}%)`
    };

    // Optionnel : retourner le top 5 pour debug
    if (returnTop5) {
      result.top5Matches = results.slice(0, 5).map(r => ({
        product: r.matchedProduct,
        score: r.score
      }));
    }

    return result;
  }

  // Méthode principale : vérifier une liste de produits
  async verifyProducts(products, showDetails = false) {
    if (!Array.isArray(products)) return products;

    const verifiedProducts = [];
    let reclassifiedCount = 0;
    let highConfidenceMatches = 0;
    let sopremaTotal = 0;
    let competitorTotal = 0;
    let excludedCount = 0;

    console.log(`\n🎯 VÉRIFICATION HYBRIDE de ${products.length} produits (seuil: ${this.SIMILARITY_THRESHOLD}%)`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const productName = product.designation || product.name;
      
      console.log(`\n[${i + 1}/${products.length}] 🔍 "${productName}"`);
      
      // 🚫 ÉTAPE 1: Vérifier si c'est un frais parasite à exclure
      if (this.isExcludedItem(productName)) {
        console.log(`❌ EXCLU: Frais parasite détecté - "${productName}"`);
        excludedCount++;
        continue; // Ne pas inclure ce produit dans les résultats
      }
      
      const match = await this.findBestMatch(productName, showDetails);
      const verifiedProduct = { ...product };
      
      // Classification basée sur le score
      if (match.matched && match.score >= this.SIMILARITY_THRESHOLD) {
        
        if (product.isCompetitor || product.type === 'competitor') {
          // 🔄 RECLASSIFICATION: Concurrent → Soprema
          console.log(`   ✅ RECLASSIFIÉ: Concurrent → SOPREMA (${match.score}%)`);
          console.log(`   📝 Match: "${match.matchedProduct}"`);
          
          verifiedProduct.isCompetitor = false;
          verifiedProduct.type = 'soprema';
          verifiedProduct.reclassified = true;
          reclassifiedCount++;
          sopremaTotal += (product.totalPrice || 0);
          
        } else {
          // ✅ CONFIRMATION Soprema
          console.log(`   ✅ CONFIRMÉ Soprema (${match.score}%)`);
          console.log(`   📝 Match: "${match.matchedProduct}"`);
          sopremaTotal += (product.totalPrice || 0);
        }
        
        if (match.score >= 95) highConfidenceMatches++;
        
      } else {
        // ❌ Pas de match Soprema suffisant
        if (product.isCompetitor || product.type === 'competitor') {
          console.log(`   ❌ CONFIRMÉ Concurrent (${match.score}% < ${this.SIMILARITY_THRESHOLD}%)`);
          competitorTotal += (product.totalPrice || 0);
        } else {
          console.log(`   ⚠️  POTENTIEL Concurrent (${match.score}% < ${this.SIMILARITY_THRESHOLD}%)`);
          console.log(`   📝 Meilleur match Soprema: "${match.matchedProduct || 'Aucun'}"`);
          sopremaTotal += (product.totalPrice || 0); // Garde classification originale
        }
      }

      // Ajouter les détails de vérification
      verifiedProduct.verification = {
        score: match.score,
        matched: match.matched,
        matchedProduct: match.matchedProduct,
        method: match.method,
        threshold: this.SIMILARITY_THRESHOLD,
        details: match.details
      };

      if (showDetails && match.top5Matches) {
        verifiedProduct.verification.top5Matches = match.top5Matches;
      }

      verifiedProducts.push(verifiedProduct);
    }

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📊 RÉSUMÉ VÉRIFICATION HYBRIDE:`);
    console.log(`   🚫 Frais parasites exclus: ${excludedCount}`);
    console.log(`   ✅ Produits analysés: ${verifiedProducts.length}`);
    console.log(`   🔄 Reclassifiés (Concurrent → Soprema): ${reclassifiedCount}`);
    console.log(`   🎯 Matches haute confiance (≥95%): ${highConfidenceMatches}`);
    console.log(`   💰 Total Soprema: ${sopremaTotal.toFixed(2)}€`);
    console.log(`   💰 Total Concurrent: ${competitorTotal.toFixed(2)}€`);
    console.log(`   📈 Précision estimée: ${Math.round((highConfidenceMatches / verifiedProducts.length) * 100)}%`);

    return {
      products: verifiedProducts,
      summary: {
        totalProducts: products.length,
        excludedCount,
        analyzedProducts: verifiedProducts.length,
        reclassifiedCount,
        highConfidenceMatches,
        sopremaTotal,
        competitorTotal,
        threshold: this.SIMILARITY_THRESHOLD,
        estimatedAccuracy: Math.round((highConfidenceMatches / Math.max(verifiedProducts.length, 1)) * 100)
      }
    };
  }

  // Générer un prompt Claude enrichi avec les vraies gammes Soprema
  async generateEnhancedPrompt() {
    const promptAddition = `
RÉFÉRENCES SOPREMA PRINCIPALES (validées par scoring à ${this.SIMILARITY_THRESHOLD}%+):

🏆 GAMMES MAJEURES SOPREMA:
1. ALSAN (1,448 produits) - RÉSINES LIQUIDES - GAMME PHARE
   • ALSAN 500 (Polyuréthane monocomposant)
   • ALSAN 970 (PMMA acrylique)  
   • ALSAN EPOXY (Résine époxy)
   • ALSAN FLASHING (Détails étanchéité)

2. ÉTANCHÉITÉ BITUMINEUSE (318 produits)
   • ELASTOPHENE FLAM (Soudables)
   • SOPRALENE (Collées)

3. ISOLATION (201 produits)
   • SOPRAXPS (Polystyrène extrudé)
   • PAVATEX (Fibres de bois)

4. ACCESSOIRES (273 produits)
   • SOPRAFIX (Fixations)
   • SOPRASOLIN (Solins)
   • SOPRAJOINT (Joints)

MÉTHODE D'IDENTIFICATION:
- Si le produit ressemble à >82% à une référence Soprema → isCompetitor = false
- Sinon → isCompetitor = true
- Utilise le contexte fournisseur pour les cas limites`;

    return promptAddition;
  }

  // Test avec un exemple de produit
  async testProduct(productName, showTop5 = true) {
    console.log(`\n🧪 TEST PRODUIT: "${productName}"`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    
    const result = await this.findBestMatch(productName, showTop5);
    
    console.log(`🎯 RÉSULTAT:`);
    console.log(`   Score: ${result.score}%`);
    console.log(`   Match: ${result.matched ? '✅ OUI' : '❌ NON'} (seuil: ${this.SIMILARITY_THRESHOLD}%)`);
    console.log(`   Produit Soprema: "${result.matchedProduct || 'Aucun'}"`);
    console.log(`   Méthode: ${result.method}`);
    
    if (showTop5 && result.top5Matches) {
      console.log(`\n📋 TOP 5 CORRESPONDANCES:`);
      result.top5Matches.forEach((match, index) => {
        console.log(`   ${index + 1}. ${match.score}% - "${match.product}"`);
      });
    }
    
    return result;
  }
}

// Instance singleton
export const hybridSopremaMethod = new HybridSopremaMethod();