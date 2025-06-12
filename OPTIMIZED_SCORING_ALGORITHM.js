/**
 * ALGORITHMES DE SCORING OPTIMISÉS POUR SOPREMA
 * 
 * Combines multiples techniques pour maximiser la précision:
 * 1. Levenshtein optimisé avec early exit
 * 2. Jaccard similarity sur les mots
 * 3. Longest Common Subsequence (LCS)
 * 4. N-grams similarity
 * 5. Scoring pondéré intelligent
 */

export class OptimizedScoringAlgorithms {
  
  // Normalisation de texte spécialement optimisée pour les produits bâtiment
  static normalizeProductText(text) {
    if (!text) return '';
    
    return text
      .toUpperCase()
      .replace(/[^\w\s]/g, ' ')                    // Supprimer ponctuation
      .replace(/\b\d+([.,]\d+)?\s*(MM|CM|M|KG|G|L|M2|M3)\b/g, '') // Supprimer dimensions/unités
      .replace(/\b(ROULEAU|PLAQUE|SAC|BIDON|TUBE)\b/g, '')        // Supprimer types conditionnement
      .replace(/\b(GRIS|NOIR|BLANC|ROUGE|VERT|BLEU)\b/g, '')      // Supprimer couleurs basiques
      .replace(/\s+/g, ' ')                        // Normaliser espaces
      .trim();
  }

  // Distance de Levenshtein avec optimisations performance
  static levenshteinOptimized(str1, str2, maxDistance = null) {
    const m = str1.length;
    const n = str2.length;
    
    // Early exits
    if (m === 0) return n;
    if (n === 0) return m;
    if (str1 === str2) return 0;
    
    // Si différence de taille trop importante, skip
    if (maxDistance && Math.abs(m - n) > maxDistance) {
      return maxDistance + 1;
    }
    
    // Optimisation: si une chaîne est beaucoup plus courte, limiter la zone de calcul
    const [shorter, longer] = m < n ? [str1, str2] : [str2, str1];
    if (longer.length > shorter.length * 2) {
      // Rechercher la meilleure zone d'alignement
      let minDist = Infinity;
      const windowSize = shorter.length + (maxDistance || Math.floor(shorter.length * 0.5));
      
      for (let start = 0; start <= longer.length - shorter.length; start += Math.floor(shorter.length / 4)) {
        const window = longer.substring(start, start + windowSize);
        const dist = this.levenshteinBasic(shorter, window);
        minDist = Math.min(minDist, dist);
        
        if (maxDistance && minDist <= maxDistance) break;
      }
      return minDist;
    }
    
    return this.levenshteinBasic(str1, str2, maxDistance);
  }

  // Levenshtein de base avec early exit par ligne
  static levenshteinBasic(str1, str2, maxDistance = null) {
    const m = str1.length;
    const n = str2.length;
    
    // Utilisation de deux lignes seulement pour optimiser la mémoire
    let prev = Array(n + 1);
    let curr = Array(n + 1);
    
    // Initialisation
    for (let j = 0; j <= n; j++) prev[j] = j;
    
    for (let i = 1; i <= m; i++) {
      curr[0] = i;
      let minInRow = i;
      
      for (let j = 1; j <= n; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          curr[j] = prev[j - 1];
        } else {
          curr[j] = Math.min(
            prev[j] + 1,      // deletion
            curr[j - 1] + 1,  // insertion
            prev[j - 1] + 1   // substitution
          );
        }
        minInRow = Math.min(minInRow, curr[j]);
      }
      
      // Early exit si toute la ligne dépasse maxDistance
      if (maxDistance && minInRow > maxDistance) {
        return maxDistance + 1;
      }
      
      // Swap arrays
      [prev, curr] = [curr, prev];
    }
    
    return prev[n];
  }

  // Jaccard similarity sur les mots (très efficace pour les noms de produits)
  static jaccardSimilarity(str1, str2) {
    const words1 = new Set(this.normalizeProductText(str1).split(' ').filter(w => w.length >= 2));
    const words2 = new Set(this.normalizeProductText(str2).split(' ').filter(w => w.length >= 2));
    
    if (words1.size === 0 && words2.size === 0) return 100;
    if (words1.size === 0 || words2.size === 0) return 0;
    
    const intersection = new Set([...words1].filter(w => words2.has(w)));
    const union = new Set([...words1, ...words2]);
    
    return Math.round((intersection.size / union.size) * 100);
  }

  // N-grams similarity (efficace pour détecter variantes d'orthographe)
  static ngramSimilarity(str1, str2, n = 3) {
    const text1 = this.normalizeProductText(str1);
    const text2 = this.normalizeProductText(str2);
    
    if (text1.length < n || text2.length < n) {
      // Fallback sur character-level pour textes courts
      return this.jaccardSimilarity(str1, str2);
    }
    
    const ngrams1 = new Set();
    const ngrams2 = new Set();
    
    for (let i = 0; i <= text1.length - n; i++) {
      ngrams1.add(text1.substring(i, i + n));
    }
    
    for (let i = 0; i <= text2.length - n; i++) {
      ngrams2.add(text2.substring(i, i + n));
    }
    
    const intersection = new Set([...ngrams1].filter(ng => ngrams2.has(ng)));
    const union = new Set([...ngrams1, ...ngrams2]);
    
    return union.size > 0 ? Math.round((intersection.size / union.size) * 100) : 0;
  }

  // Longest Common Subsequence ratio
  static lcsRatio(str1, str2) {
    const text1 = this.normalizeProductText(str1);
    const text2 = this.normalizeProductText(str2);
    
    const lcs = this.longestCommonSubsequence(text1, text2);
    const maxLen = Math.max(text1.length, text2.length);
    
    return maxLen > 0 ? Math.round((lcs / maxLen) * 100) : 0;
  }

  static longestCommonSubsequence(str1, str2) {
    const m = str1.length;
    const n = str2.length;
    const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
    
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }
    
    return dp[m][n];
  }

  // Détection de mots-clés critiques Soprema
  static detectSopremaKeywords(text) {
    const normalized = this.normalizeProductText(text);
    
    const criticalKeywords = {
      'ALSAN': 25,      // Gamme principale
      'ELASTOPHENE': 20,
      'SOPRALENE': 20,
      'SOPRAXPS': 20,
      'SOPRAFIX': 15,
      'SOPRAFLOR': 15,
      'PAVATEX': 15,
      'SOPRA': 10,      // Générique mais important
      'SOPREMA': 10
    };

    let keywordScore = 0;
    const foundKeywords = [];

    for (const [keyword, score] of Object.entries(criticalKeywords)) {
      if (normalized.includes(keyword)) {
        keywordScore += score;
        foundKeywords.push(keyword);
      }
    }

    return {
      score: Math.min(keywordScore, 40), // Plafonner à 40% du score total
      keywords: foundKeywords
    };
  }

  // Score composite optimisé pour les produits Soprema
  static calculateCompositeScore(inputText, sopremaText) {
    // 1. Correspondance exacte = score parfait
    const normalized1 = this.normalizeProductText(inputText);
    const normalized2 = this.normalizeProductText(sopremaText);
    
    if (normalized1 === normalized2) return 100;
    
    // 2. Calcul des différents scores
    const maxLen = Math.max(normalized1.length, normalized2.length);
    const levenshteinDist = this.levenshteinOptimized(normalized1, normalized2, Math.floor(maxLen * 0.4));
    const levenshteinScore = maxLen > 0 ? Math.max(0, (1 - levenshteinDist / maxLen) * 100) : 0;
    
    const jaccardScore = this.jaccardSimilarity(inputText, sopremaText);
    const ngramScore = this.ngramSimilarity(inputText, sopremaText);
    const lcsScore = this.lcsRatio(inputText, sopremaText);
    
    // 3. Bonus d'inclusion (un texte dans l'autre)
    let inclusionBonus = 0;
    if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
      inclusionBonus = 20;
    }
    
    // 4. Bonus mots-clés Soprema
    const keywordAnalysis = this.detectSopremaKeywords(inputText);
    let keywordBonus = keywordAnalysis.score;
    
    // 5. Pondération intelligente selon la longueur et complexité
    let finalScore;
    
    if (maxLen <= 15) {
      // Textes courts: privilégier Levenshtein et inclusion
      finalScore = levenshteinScore * 0.6 + jaccardScore * 0.4 + inclusionBonus + keywordBonus;
    } else if (maxLen <= 30) {
      // Textes moyens: équilibrer les méthodes
      finalScore = levenshteinScore * 0.3 + jaccardScore * 0.3 + ngramScore * 0.2 + lcsScore * 0.2 + inclusionBonus + keywordBonus;
    } else {
      // Textes longs: privilégier mots et n-grams
      finalScore = levenshteinScore * 0.2 + jaccardScore * 0.4 + ngramScore * 0.3 + lcsScore * 0.1 + inclusionBonus + keywordBonus;
    }
    
    // 6. Bonus pour correspondance de mots critiques
    const inputWords = normalized1.split(' ').filter(w => w.length >= 4);
    const sopremaWords = normalized2.split(' ').filter(w => w.length >= 4);
    const criticalMatches = inputWords.filter(w => sopremaWords.includes(w) && w.length >= 5);
    
    if (criticalMatches.length >= 2) {
      finalScore += 10;
    }
    
    // 7. Malus si trop de différences fondamentales
    const sizeDifference = Math.abs(normalized1.length - normalized2.length);
    if (sizeDifference > maxLen * 0.7) {
      finalScore -= 10;
    }
    
    return Math.min(Math.max(Math.round(finalScore), 0), 100);
  }

  // Méthode de test pour comparer les algorithmes
  static testAlgorithms(inputText, sopremaText) {
    console.log(`\n🧪 TEST ALGORITHMES DE SCORING`);
    console.log(`Input: "${inputText}"`);
    console.log(`Soprema: "${sopremaText}"`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    
    const normalized1 = this.normalizeProductText(inputText);
    const normalized2 = this.normalizeProductText(sopremaText);
    
    console.log(`Normalisé 1: "${normalized1}"`);
    console.log(`Normalisé 2: "${normalized2}"`);
    
    const maxLen = Math.max(normalized1.length, normalized2.length);
    const levenshteinDist = this.levenshteinOptimized(normalized1, normalized2);
    const levenshteinScore = maxLen > 0 ? Math.round((1 - levenshteinDist / maxLen) * 100) : 0;
    
    const jaccardScore = this.jaccardSimilarity(inputText, sopremaText);
    const ngramScore = this.ngramSimilarity(inputText, sopremaText);
    const lcsScore = this.lcsRatio(inputText, sopremaText);
    const compositeScore = this.calculateCompositeScore(inputText, sopremaText);
    
    const keywordAnalysis = this.detectSopremaKeywords(inputText);
    
    console.log(`\n📊 RÉSULTATS:`);
    console.log(`   Levenshtein: ${levenshteinScore}% (distance: ${levenshteinDist})`);
    console.log(`   Jaccard:     ${jaccardScore}%`);
    console.log(`   N-grams:     ${ngramScore}%`);
    console.log(`   LCS:         ${lcsScore}%`);
    console.log(`   Keywords:    ${keywordAnalysis.score}% ${keywordAnalysis.keywords.join(', ')}`);
    console.log(`   ────────────────────────────────────────`);
    console.log(`   🎯 COMPOSITE: ${compositeScore}%`);
    
    return {
      levenshtein: levenshteinScore,
      jaccard: jaccardScore,
      ngram: ngramScore,
      lcs: lcsScore,
      composite: compositeScore,
      keywords: keywordAnalysis
    };
  }
}