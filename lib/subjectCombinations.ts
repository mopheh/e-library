export type SubjectCombination = {
  jamb: string[];
  postUtme: string[];
  requirements?: string;
};

export const subjectCombinations: Record<string, SubjectCombination> = {
  // Sciences & Computing
  "Computer Science": {
    jamb: ["English", "Mathematics", "Physics", "Chemistry"],
    postUtme: ["English", "Mathematics", "Physics", "Chemistry"],
    requirements: "Five O'Level credit passes including English Language, Mathematics, Physics, Chemistry and any other Science subject."
  },
  "Software Engineering": {
    jamb: ["English", "Mathematics", "Physics", "Chemistry"],
    postUtme: ["English", "Mathematics", "Physics", "Chemistry"],
    requirements: "Five O'Level credit passes including English Language, Mathematics, Physics, Chemistry and one other Science/Technical subject."
  },
  "Information Technology": {
    jamb: ["English", "Mathematics", "Physics", "Chemistry or Biology"],
    postUtme: ["English", "Mathematics", "Physics", "Chemistry or Biology"],
  },
  "Cyber Security": {
    jamb: ["English", "Mathematics", "Physics", "Chemistry or Biology"],
    postUtme: ["English", "Mathematics", "Physics", "Chemistry or Biology"],
  },
  
  // Engineering
  "Mechanical Engineering": {
    jamb: ["English", "Mathematics", "Physics", "Chemistry"],
    postUtme: ["English", "Mathematics", "Physics", "Chemistry"],
  },
  "Electrical/Electronic Engineering": {
    jamb: ["English", "Mathematics", "Physics", "Chemistry"],
    postUtme: ["English", "Mathematics", "Physics", "Chemistry"],
  },
  "Civil Engineering": {
    jamb: ["English", "Mathematics", "Physics", "Chemistry"],
    postUtme: ["English", "Mathematics", "Physics", "Chemistry"],
  },
  "Mechatronics Engineering": {
    jamb: ["English", "Mathematics", "Physics", "Chemistry"],
    postUtme: ["English", "Mathematics", "Physics", "Chemistry"],
  },

  // Basic Medical & Health Sciences
  "Medicine and Surgery": {
    jamb: ["English", "Biology", "Physics", "Chemistry"],
    postUtme: ["English", "Biology", "Physics", "Chemistry"],
    requirements: "Five O'Level credit passes in English Language, Mathematics, Physics, Chemistry and Biology."
  },
  "Nursing Science": {
    jamb: ["English", "Biology", "Physics", "Chemistry"],
    postUtme: ["English", "Biology", "Physics", "Chemistry"],
  },
  "Pharmacy": {
    jamb: ["English", "Biology", "Physics", "Chemistry"],
    postUtme: ["English", "Biology", "Physics", "Chemistry"],
  },
  "Medical Laboratory Science": {
    jamb: ["English", "Biology", "Physics", "Chemistry"],
    postUtme: ["English", "Biology", "Physics", "Chemistry"],
  },
  "Public Health": {
    jamb: ["English", "Biology", "Chemistry", "Physics or Mathematics"],
    postUtme: ["English", "Biology", "Chemistry", "Physics/Maths"],
  },

  // Arts & Humanities
  "Law": {
    jamb: ["English", "Literature in English", "CRK/IRK", "Government or History"],
    postUtme: ["English", "Literature in English", "CRK/IRK", "Government"],
  },
  "English Language": {
    jamb: ["English", "Literature in English", "Any two Arts subjects"],
    postUtme: ["English", "Literature in English", "General Paper"],
  },
  "History and International Studies": {
    jamb: ["English", "History or Government", "Any two Arts/Social Science subjects"],
    postUtme: ["English", "History/Government", "General Paper"],
  },

  // Social & Management Sciences
  "Accounting": {
    jamb: ["English", "Mathematics", "Economics", "Any other Social Science subject"],
    postUtme: ["English", "Mathematics", "Economics", "General Paper"],
  },
  "Business Administration": {
    jamb: ["English", "Mathematics", "Economics", "Any other Social Science subject"],
    postUtme: ["English", "Mathematics", "Economics", "General Paper"],
  },
  "Economics": {
    jamb: ["English", "Mathematics", "Economics", "Any other Social Science/Arts subject"],
    postUtme: ["English", "Mathematics", "Economics", "General Paper"],
  },
  "Mass Communication": {
    jamb: ["English", "Literature in English", "Any two Arts/Social Science subjects"],
    postUtme: ["English", "Literature in English", "Government", "General/Current Affairs"],
  },
  "Political Science": {
    jamb: ["English", "Government or History", "Any two Arts/Social Science subjects"],
    postUtme: ["English", "Government/History", "Economics/Maths", "General Paper"],
  },
  
  // Physical/Life Sciences
  "Microbiology": {
    jamb: ["English", "Biology", "Chemistry", "Physics or Mathematics"],
    postUtme: ["English", "Biology", "Chemistry", "Physics/Maths"],
  },
  "Biochemistry": {
    jamb: ["English", "Biology", "Chemistry", "Physics or Mathematics"],
    postUtme: ["English", "Biology", "Chemistry", "Physics/Maths"],
  },

  // Default Fallback mapping based on keywords if exact match isn't found
  "DEFAULT_SCIENCE": {
    jamb: ["English", "Mathematics", "Physics", "Chemistry"],
    postUtme: ["English", "Mathematics", "Physics", "Chemistry"],
    requirements: "Consult the university admission brochure for specific requirements."
  },
  "DEFAULT_ARTS": {
    jamb: ["English", "Literature in English", "Any two Arts subjects"],
    postUtme: ["English", "Literature", "General Paper"],
    requirements: "Consult the university admission brochure for specific requirements."
  },
  "DEFAULT_SOCIAL": {
    jamb: ["English", "Mathematics", "Economics", "Any other Social Science subject"],
    postUtme: ["English", "Mathematics", "Economics", "General Paper"],
    requirements: "Consult the university admission brochure for specific requirements."
  }
};

export function getSubjectCombination(departmentName: string): SubjectCombination | null {
  if (!departmentName) return null;
  
  const exactMatch = subjectCombinations[departmentName];
  if (exactMatch) return exactMatch;
  
  // Try fuzzy matching
  const nameLower = departmentName.toLowerCase();
  
  const entries = Object.entries(subjectCombinations);
  for (const [key, value] of entries) {
    if (key.includes("DEFAULT")) continue;
    if (nameLower.includes(key.toLowerCase()) || key.toLowerCase().includes(nameLower)) {
      return value;
    }
  }
  
  // Return intelligent defaults based on keywords
  if (nameLower.includes("engineering") || nameLower.includes("tech") || nameLower.includes("computer") || nameLower.includes("science")) {
    return subjectCombinations["DEFAULT_SCIENCE"];
  }
  
  if (nameLower.includes("art") || nameLower.includes("history") || nameLower.includes("english") || nameLower.includes("language") || nameLower.includes("law")) {
    return subjectCombinations["DEFAULT_ARTS"];
  }
  
  if (nameLower.includes("business") || nameLower.includes("management") || nameLower.includes("eco") || nameLower.includes("social") || nameLower.includes("politic")) {
    return subjectCombinations["DEFAULT_SOCIAL"];
  }
  
  return null;
}
