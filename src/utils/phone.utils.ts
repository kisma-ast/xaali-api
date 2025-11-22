/**
 * Normalise un numéro de téléphone pour assurer la cohérence dans la base de données.
 * Supprime les espaces, tirets et autres caractères non numériques.
 * Ajoute le préfixe +221 si absent et si le numéro semble être sénégalais (9 chiffres).
 * 
 * @param phone Le numéro de téléphone à normaliser
 * @returns Le numéro normalisé ou la chaîne originale si vide
 */
export function normalizePhoneNumber(phone: string): string {
    if (!phone) return phone;

    // Supprimer tous les caractères non numériques sauf le +
    let cleaned = phone.replace(/[^\d+]/g, '');

    // Si le numéro commence par 00, remplacer par +
    if (cleaned.startsWith('00')) {
        cleaned = '+' + cleaned.substring(2);
    }

    // Gestion spécifique Sénégal (si pas de préfixe et 9 chiffres)
    // Ex: 771234567 -> +221771234567
    if (!cleaned.startsWith('+') && cleaned.length === 9 && (cleaned.startsWith('7') || cleaned.startsWith('3'))) {
        cleaned = '+221' + cleaned;
    }

    // Si le numéro a 9 chiffres et commence par 221 (sans +), ajouter +
    if (!cleaned.startsWith('+') && cleaned.startsWith('221') && cleaned.length === 12) {
        cleaned = '+' + cleaned;
    }

    return cleaned;
}
