// UNIBEN matriculation numbers are prefixed with a 3-letter faculty code
// (e.g. "ENG2102992" for Engineering). Codes are sourced from UNIBEN's own
// WAeUP student portal (waeup.uniben.edu/faculties/<CODE>).
//
// Two pairs are deliberately dual-mapped: Education/Vocational Education
// (VTE is administratively a department under Education in UNIBEN's own
// system, but is modeled as its own top-level faculty here) and
// Dentistry/Medicine and Dentistry (Dentistry sits under the combined
// Medicine and Dentistry college). Students in either faculty of a pair may
// legitimately carry either prefix, so both are accepted for both.
export const FACULTY_CODES: Record<string, string[]> = {
  "Agriculture": ["AGR"],
  "Arts": ["ART"],
  "Basic Medical Sciences": ["BMS"],
  "Computing & Information Sciences": ["CIS"],
  "Dentistry": ["DEN", "MED"],
  "Education": ["EDU", "VTE"],
  "Engineering": ["ENG"],
  "Environmental Sciences": ["ENV"],
  "General Studies": ["GST"],
  "Law": ["LAW"],
  "Life Sciences": ["LSC"],
  "Management Sciences": ["MGS"],
  "Medicine and Dentistry": ["MED", "DEN"],
  "Pharmacy": ["PHA"],
  "Physical Sciences": ["PSC"],
  "Social Sciences": ["SSC"],
  "Veterinary Medicine": ["VNM"],
  "Vocational Education": ["EDU", "VTE"],
};

// 3-letter faculty code + exactly 7 digits (e.g. "ENG2102992" = 10 chars
// total). Matches every conforming record in the live DB.
const MATRIC_FORMAT_RE = /^([A-Za-z]{3})(\d{7})$/;

export function getValidCodesForFaculty(facultyName: string): string[] {
  return FACULTY_CODES[facultyName] ?? [];
}

/**
 * Validates a matric number's shape (3 letters + 7 digits) and, when
 * enforcePrefix is true, that its prefix matches the given faculty.
 * enforcePrefix is admin-controlled (systemSettings.matricFacultyCheckEnabled)
 * -- it starts off because there aren't enough onboarded users yet to be
 * confident the FACULTY_CODES map won't false-reject legitimate signups.
 * Faculties absent from FACULTY_CODES (shouldn't happen among the known 18,
 * but a new faculty could be added before this map is updated) skip the
 * prefix check either way -- we validate what we know, we don't invent
 * rejections for what we don't.
 */
export function validateMatricNo(
  matricNo: string,
  facultyName: string,
  enforcePrefix: boolean,
): { valid: boolean; reason?: string } {
  const trimmed = matricNo.trim();
  const match = trimmed.match(MATRIC_FORMAT_RE);
  if (!match) {
    return {
      valid: false,
      reason: "Matric number must be 3 letters followed by 7 digits, e.g. ENG2102992.",
    };
  }

  if (!enforcePrefix) return { valid: true };

  const validCodes = getValidCodesForFaculty(facultyName);
  if (validCodes.length === 0) return { valid: true };

  const prefix = match[1].toUpperCase();
  if (!validCodes.includes(prefix)) {
    return {
      valid: false,
      reason: `That matric number doesn't look right for ${facultyName}. It should start with ${validCodes.join(" or ")}.`,
    };
  }

  return { valid: true };
}
