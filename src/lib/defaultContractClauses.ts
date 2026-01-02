// Default contract clauses inspired by Ordre des Architectes

export const DEFAULT_PAYMENT_TERMS = `Les honoraires sont payables selon l'échéancier suivant :
- 30% à la signature du présent contrat
- Solde au prorata de l'avancement des phases

Les factures sont payables à réception, sans escompte. Tout retard de paiement entraînera l'application de pénalités de retard au taux légal en vigueur, ainsi qu'une indemnité forfaitaire de 40€ pour frais de recouvrement.`;

export const DEFAULT_GENERAL_CONDITIONS_ARCHITECTURE = `ARTICLE 1 - OBJET DU CONTRAT
Le présent contrat a pour objet de définir les conditions dans lesquelles le Maître d'œuvre s'engage à réaliser les missions de maîtrise d'œuvre définies au présent contrat.

ARTICLE 2 - DOCUMENTS CONTRACTUELS
Les documents contractuels sont, par ordre de priorité décroissante :
- Le présent contrat et ses annexes
- Le programme établi par le Maître d'ouvrage
- Les études réalisées par le Maître d'œuvre

ARTICLE 3 - OBLIGATIONS DU MAÎTRE D'ŒUVRE
Le Maître d'œuvre s'engage à :
- Exécuter sa mission avec diligence et conformément aux règles de l'art
- Respecter le programme et l'enveloppe financière prévisionnelle
- Informer régulièrement le Maître d'ouvrage de l'avancement des études et des travaux
- Vérifier que les documents qu'il établit sont conformes à la réglementation en vigueur

ARTICLE 4 - OBLIGATIONS DU MAÎTRE D'OUVRAGE
Le Maître d'ouvrage s'engage à :
- Fournir au Maître d'œuvre tous les renseignements et documents nécessaires à sa mission
- Désigner un représentant unique habilité à prendre les décisions
- Régler les honoraires dans les conditions prévues au contrat
- Prendre les décisions dans les délais convenus

ARTICLE 5 - PROPRIÉTÉ INTELLECTUELLE
Conformément au Code de la propriété intellectuelle, le Maître d'œuvre conserve les droits de propriété intellectuelle sur ses créations. Le Maître d'ouvrage acquiert le droit d'utiliser les études pour la réalisation du projet défini au contrat.

ARTICLE 6 - RESPONSABILITÉ
Le Maître d'œuvre est responsable de ses études et du contrôle de leur bonne exécution dans la limite de sa mission. Il est couvert par une assurance responsabilité civile professionnelle.

ARTICLE 7 - RÉSILIATION
En cas de manquement grave de l'une des parties à ses obligations, l'autre partie pourra résilier le contrat après mise en demeure restée sans effet pendant 30 jours.

ARTICLE 8 - LITIGES
En cas de litige, les parties s'engagent à rechercher une solution amiable. À défaut, les tribunaux compétents seront ceux du ressort du lieu d'exécution du contrat.`;

export const DEFAULT_GENERAL_CONDITIONS_INTERIOR = `ARTICLE 1 - OBJET
Le présent contrat définit les conditions de réalisation d'une mission de conception et de suivi de réalisation d'un projet d'architecture d'intérieur.

ARTICLE 2 - MISSION
La mission comprend les phases décrites dans le présent document. Toute modification du programme en cours de mission pourra donner lieu à avenant.

ARTICLE 3 - DÉLAIS
Les délais indicatifs de réalisation sont mentionnés pour chaque phase. Ils ne pourront courir qu'à compter de la réception par l'Architecte d'Intérieur de tous les éléments nécessaires.

ARTICLE 4 - HONORAIRES
Les honoraires sont calculés selon les modalités définies au contrat. Ils ne comprennent pas :
- Les frais de déplacement hors agglomération
- Les reproductions de documents
- Les prestations non incluses dans la mission

ARTICLE 5 - PROPRIÉTÉ INTELLECTUELLE
L'Architecte d'Intérieur conserve l'intégralité des droits de propriété intellectuelle sur ses créations. Le client acquiert un droit d'usage limité au projet concerné.

ARTICLE 6 - MODIFICATIONS
Toute modification substantielle du projet demandée par le client après validation d'une phase donnera lieu à facturation complémentaire.

ARTICLE 7 - RESPONSABILITÉ
L'Architecte d'Intérieur est responsable de la conformité de ses études aux règles de l'art. Sa responsabilité est limitée au montant garanti par son assurance professionnelle.

ARTICLE 8 - CONFIDENTIALITÉ
Les parties s'engagent à garder confidentielles les informations échangées dans le cadre du présent contrat.`;

export const DEFAULT_GENERAL_CONDITIONS_SCENOGRAPHY = `ARTICLE 1 - OBJET
Le présent contrat a pour objet la conception et le suivi de réalisation d'un projet scénographique tel que décrit au présent document.

ARTICLE 2 - MISSION
La mission du scénographe comprend les phases détaillées dans le présent contrat. Elle exclut :
- La production des contenus (textes, images, films) sauf mention contraire
- La fabrication des éléments scénographiques
- L'exploitation du lieu après inauguration

ARTICLE 3 - DOCUMENTATION
Le client s'engage à fournir au scénographe l'ensemble des documents et informations nécessaires à la réalisation de sa mission, notamment :
- Les plans et relevés des espaces
- Les contenus à intégrer
- Les contraintes techniques et réglementaires

ARTICLE 4 - VALIDATION
Chaque phase fait l'objet d'une validation formelle par le client. Cette validation engage le client sur les choix effectués et permet le passage à la phase suivante.

ARTICLE 5 - HONORAIRES
Les honoraires sont forfaitaires et correspondent aux phases définies. Toute prestation supplémentaire fera l'objet d'un avenant.

ARTICLE 6 - PROPRIÉTÉ INTELLECTUELLE
Le scénographe conserve les droits d'auteur sur ses créations. Le client acquiert le droit d'exploiter le projet dans le cadre défini au contrat.

ARTICLE 7 - DROIT MORAL
Le scénographe dispose d'un droit de paternité sur son œuvre. Son nom devra être mentionné sur les supports de communication du projet.

ARTICLE 8 - CRÉDIT PHOTOGRAPHIQUE
Le client autorise le scénographe à utiliser les images du projet réalisé pour sa communication, avec mention du crédit photographique.`;

export const DEFAULT_CLAUSES_BY_PROJECT_TYPE = {
  architecture: {
    general_conditions: DEFAULT_GENERAL_CONDITIONS_ARCHITECTURE,
    payment_terms: DEFAULT_PAYMENT_TERMS
  },
  interior: {
    general_conditions: DEFAULT_GENERAL_CONDITIONS_INTERIOR,
    payment_terms: DEFAULT_PAYMENT_TERMS
  },
  scenography: {
    general_conditions: DEFAULT_GENERAL_CONDITIONS_SCENOGRAPHY,
    payment_terms: DEFAULT_PAYMENT_TERMS
  }
};

export const MISSION_DESCRIPTIONS = {
  architecture: {
    full: "Mission complète de maîtrise d'œuvre comprenant la conception, le suivi des autorisations, la consultation des entreprises et la direction de l'exécution des travaux.",
    conception: "Mission de conception limitée aux études préliminaires, avant-projet et projet, sans suivi de réalisation.",
    execution: "Mission d'exécution comprenant la consultation des entreprises, la direction des travaux et l'assistance aux opérations de réception."
  },
  interior: {
    full: "Mission complète d'architecture d'intérieur comprenant la conception, les études techniques, la consultation et le suivi de chantier.",
    conception: "Mission de conception comprenant le brief, l'esquisse et l'avant-projet définitif.",
    execution: "Mission de suivi de réalisation comprenant la consultation des artisans et le suivi de chantier."
  },
  scenography: {
    full: "Mission complète de scénographie comprenant la conception, le design, le suivi de production et le montage.",
    conception: "Mission de conception scénographique jusqu'au design détaillé.",
    execution: "Mission de suivi de réalisation comprenant le suivi de production et le montage."
  }
};
