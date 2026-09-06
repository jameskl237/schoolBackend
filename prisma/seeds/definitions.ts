import { SchoolType } from "../../src/generated/prisma/enums.js";

export interface PermissionDefinition {
  code: string;
  name: string;
  description?: string;
}

export interface RoleDefinition {
  name: string;
  description?: string;
  permissions: string[];
}

export const permissions: PermissionDefinition[] = [
  { code: "dashboard.view", name: "Voir le tableau de bord" },

  { code: "users.view", name: "Voir les utilisateurs" },
  { code: "users.manage", name: "Gérer les utilisateurs" },
  { code: "roles.manage", name: "Gérer les rôles et permissions" },

  { code: "establishments.manage", name: "Gérer les établissements" },
  { code: "academic-years.manage", name: "Gérer les années scolaires" },
  { code: "periods.manage", name: "Gérer les périodes" },
  { code: "school-levels.manage", name: "Gérer les niveaux scolaires" },
  { code: "cycles.manage", name: "Gérer les cycles" },
  { code: "classes.manage", name: "Gérer les classes" },

  { code: "teachers.manage", name: "Gérer les enseignants" },
  { code: "subjects.manage", name: "Gérer les matières" },
  { code: "classrooms.manage", name: "Gérer les salles de classe" },
  { code: "class-subjects.manage", name: "Gérer les affectations matière/classe" },
  { code: "timetables.manage", name: "Gérer les emplois du temps" },
  { code: "timetables.view", name: "Consulter les emplois du temps" },

  { code: "students.view", name: "Voir les élèves" },
  { code: "students.manage", name: "Gérer les élèves" },
  { code: "parents.manage", name: "Gérer les parents" },
  { code: "guardians.manage", name: "Gérer les tuteurs" },
  { code: "enrollments.manage", name: "Gérer les inscriptions" },

  { code: "evaluations.manage", name: "Gérer les évaluations" },
  { code: "grades.manage", name: "Saisir les notes" },
  { code: "grades.view", name: "Consulter les notes" },
  { code: "report-cards.view", name: "Consulter les bulletins" },
  { code: "report-cards.manage", name: "Publier les bulletins" },

  { code: "attendances.manage", name: "Gérer les présences" },
  { code: "disciplines.manage", name: "Gérer la discipline" },

  { code: "fees.manage", name: "Gérer les frais" },
  { code: "invoices.manage", name: "Gérer les factures" },
  { code: "payments.manage", name: "Gérer les paiements" },

  { code: "medical-records.manage", name: "Gérer les dossiers médicaux" },
  { code: "vaccinations.manage", name: "Gérer les vaccinations" },
  { code: "infirmary.manage", name: "Gérer l'infirmerie" },

  { code: "books.manage", name: "Gérer les livres" },
  { code: "loans.manage", name: "Gérer les emprunts" },

  { code: "orientations.manage", name: "Gérer les orientations" },
  { code: "counseling.manage", name: "Gérer les séances de conseil" },
];

const ALL_PERMISSIONS = permissions.map((permission) => permission.code);

export const primaryRoles: RoleDefinition[] = [
  {
    name: "DIRECTEUR",
    description: "Chef d'établissement de l'école primaire",
    permissions: ALL_PERMISSIONS,
  },
  {
    name: "ENSEIGNANT",
    description: "Instituteur chargé de classe",
    permissions: [
      "dashboard.view",
      "students.view",
      "timetables.view",
      "evaluations.manage",
      "grades.manage",
      "grades.view",
      "attendances.manage",
      "report-cards.view",
      "disciplines.manage",
    ],
  },
  {
    name: "COMPTABLE",
    description: "Gère les frais, factures et paiements",
    permissions: [
      "dashboard.view",
      "students.view",
      "fees.manage",
      "invoices.manage",
      "payments.manage",
    ],
  },
  {
    name: "SECRETAIRE",
    description: "Accueil, gestion des élèves et inscriptions",
    permissions: [
      "dashboard.view",
      "users.view",
      "students.manage",
      "parents.manage",
      "guardians.manage",
      "enrollments.manage",
      "classes.manage",
    ],
  },
  {
    name: "BIBLIOTHECAIRE",
    description: "Gère la bibliothèque et les emprunts",
    permissions: ["dashboard.view", "students.view", "books.manage", "loans.manage"],
  },
  {
    name: "INFIRMIER",
    description: "Gère le dossier médical des élèves",
    permissions: [
      "dashboard.view",
      "students.view",
      "medical-records.manage",
      "vaccinations.manage",
      "infirmary.manage",
    ],
  },
  {
    name: "ELEVE",
    description: "Compte élève",
    permissions: ["dashboard.view", "grades.view", "report-cards.view"],
  },
  {
    name: "PARENT",
    description: "Compte parent ou tuteur",
    permissions: ["dashboard.view", "students.view", "grades.view", "report-cards.view"],
  },
];

export const secondaryRoles: RoleDefinition[] = [
  {
    name: "PROVISEUR",
    description: "Chef d'établissement de l'école secondaire",
    permissions: ALL_PERMISSIONS,
  },
  {
    name: "CENSEUR",
    description: "Adjoint pédagogique, discipline et bulletins",
    permissions: [
      "dashboard.view",
      "students.view",
      "timetables.view",
      "evaluations.manage",
      "grades.view",
      "report-cards.view",
      "attendances.manage",
      "disciplines.manage",
    ],
  },
  {
    name: "SURVEILLANT_GENERAL",
    description: "Surveillance, présence et discipline",
    permissions: [
      "dashboard.view",
      "students.view",
      "attendances.manage",
      "disciplines.manage",
    ],
  },
  {
    name: "ENSEIGNANT",
    description: "Professeur chargé de matière",
    permissions: [
      "dashboard.view",
      "students.view",
      "timetables.view",
      "evaluations.manage",
      "grades.manage",
      "grades.view",
      "attendances.manage",
      "report-cards.view",
      "disciplines.manage",
    ],
  },
  {
    name: "COMPTABLE",
    description: "Gère les frais, factures et paiements",
    permissions: [
      "dashboard.view",
      "students.view",
      "fees.manage",
      "invoices.manage",
      "payments.manage",
    ],
  },
  {
    name: "INTENDANT",
    description: "Gestion matérielle et logistique",
    permissions: [
      "dashboard.view",
      "students.view",
      "fees.manage",
      "invoices.manage",
      "payments.manage",
    ],
  },
  {
    name: "SECRETAIRE",
    description: "Accueil, gestion des élèves et inscriptions",
    permissions: [
      "dashboard.view",
      "users.view",
      "students.manage",
      "parents.manage",
      "guardians.manage",
      "enrollments.manage",
      "classes.manage",
    ],
  },
  {
    name: "BIBLIOTHECAIRE",
    description: "Gère la bibliothèque et les emprunts",
    permissions: ["dashboard.view", "students.view", "books.manage", "loans.manage"],
  },
  {
    name: "INFIRMIER",
    description: "Gère le dossier médical des élèves",
    permissions: [
      "dashboard.view",
      "students.view",
      "medical-records.manage",
      "vaccinations.manage",
      "infirmary.manage",
    ],
  },
  {
    name: "CONSEILLER_ORIENTATION",
    description: "Gère l'orientation scolaire et les conseils",
    permissions: [
      "dashboard.view",
      "students.view",
      "report-cards.view",
      "orientations.manage",
      "counseling.manage",
    ],
  },
  {
    name: "ELEVE",
    description: "Compte élève",
    permissions: ["dashboard.view", "grades.view", "report-cards.view"],
  },
  {
    name: "PARENT",
    description: "Compte parent ou tuteur",
    permissions: ["dashboard.view", "students.view", "grades.view", "report-cards.view"],
  },
];

export function getRolesForType(type: SchoolType): RoleDefinition[] {
  if (type === SchoolType.PRIMARY) {
    return primaryRoles;
  }

  if (type === SchoolType.SECONDARY) {
    return secondaryRoles;
  }

  const merged = [...primaryRoles];
  const names = new Set(merged.map((role) => role.name));

  for (const role of secondaryRoles) {
    if (!names.has(role.name)) {
      merged.push(role);
    }
  }

  return merged;
}