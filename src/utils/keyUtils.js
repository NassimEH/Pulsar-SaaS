/**
 * Utilitaires pour le calcul des clés musicales (majeure et mineure)
 */

const KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/**
 * Obtenir la mineure relative d'une clé majeure (3 semitones en dessous)
 * @param {string} majorKey - La clé majeure (ex: "C", "D#")
 * @returns {string} - La clé mineure relative (ex: "Am", "Bm")
 */
export const getRelativeMinor = (majorKey) => {
    const index = KEYS.indexOf(majorKey);
    if (index === -1) return "?";
    const minorIndex = (index - 3 + 12) % 12;
    return KEYS[minorIndex];
};

/**
 * Calculer la nouvelle clé en fonction de la clé originale et du nombre de semitones
 * Retourne un objet avec les clés majeure et mineure
 * @param {string} originalKey - La clé originale
 * @param {number} semitones - Le nombre de semitones de transposition
 * @returns {{major: string, minor: string}} - Objet avec les clés majeure et mineure
 */
export const calculateNewKey = (originalKey, semitones) => {
    if (!originalKey) return { major: "?", minor: "?" };
    
    const currentIndex = KEYS.indexOf(originalKey);
    
    if (currentIndex === -1) {
        // Si la clé n'est pas trouvée, retourner les deux possibilités
        return { major: originalKey, minor: getRelativeMinor(originalKey) };
    }
    
    const newIndex = (currentIndex + semitones) % 12;
    // Gérer les indices négatifs
    const finalIndex = newIndex < 0 ? newIndex + 12 : newIndex;
    const majorKey = KEYS[finalIndex];
    const minorKey = getRelativeMinor(majorKey);
    
    return { major: majorKey, minor: minorKey };
};

/**
 * Formater l'affichage d'une clé avec sa mineure relative
 * @param {string} key - La clé majeure
 * @returns {string} - Format "C/Am" par exemple
 */
export const formatKeyWithMinor = (key) => {
    if (!key) return "?/?m";
    const minor = getRelativeMinor(key);
    return `${key}/${minor}m`;
};



