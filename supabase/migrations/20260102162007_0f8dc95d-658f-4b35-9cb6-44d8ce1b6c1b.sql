
-- Delete all existing data
DELETE FROM meeting_attention_items;
DELETE FROM meeting_report_versions;
DELETE FROM project_meetings;
DELETE FROM project_observations;
DELETE FROM project_deliverables;
DELETE FROM project_lots;
DELETE FROM project_phases;
DELETE FROM project_moe_team;
DELETE FROM project_members;
DELETE FROM projects;
DELETE FROM lead_activities;
DELETE FROM leads;
DELETE FROM contacts;
DELETE FROM crm_companies;

-- Insert CRM Companies
INSERT INTO crm_companies (id, workspace_id, name, industry, email, phone, address, city, postal_code, website, notes)
SELECT 
  gen_random_uuid(), w.id, c.name, c.industry, c.email, c.phone, c.address, c.city, c.postal_code, c.website, c.notes
FROM workspaces w, (VALUES
  ('Groupe Immobilier Nexity', 'client_prive', 'contact@nexity.fr', '01 44 77 53 00', '19 rue de Vienne', 'Paris', '75008', 'https://www.nexity.fr', 'Grand groupe immobilier'),
  ('Ville de Lyon', 'client_public', 'contact@mairie-lyon.fr', '04 72 10 30 30', '1 place de la Comédie', 'Lyon', '69001', 'https://www.lyon.fr', 'Collectivité territoriale'),
  ('Hôtel Marriott France', 'client_prive', 'direction@marriott.fr', '01 53 93 55 00', '70 avenue des Champs-Élysées', 'Paris', '75008', 'https://www.marriott.fr', 'Chaîne hôtelière'),
  ('Musée Art Contemporain Bordeaux', 'client_public', 'contact@capc-bordeaux.fr', '05 56 00 81 50', '7 rue Ferrère', 'Bordeaux', '33000', 'https://www.capc-bordeaux.fr', 'Institution culturelle'),
  ('SCI Les Jardins du Lac', 'client_prive', 'contact@jardins-lac.fr', '04 50 45 00 00', '15 avenue Albigny', 'Annecy', '74000', NULL, 'Société civile immobilière'),
  ('BET Sigma Structure', 'bet_structure', 'contact@sigma-structure.fr', '01 45 67 89 00', '25 rue de la Paix', 'Paris', '75002', 'https://www.sigma-structure.fr', 'Bureau études structure'),
  ('Fluides Conseil', 'bet_fluides', 'info@fluides-conseil.fr', '04 78 92 34 00', '10 place Bellecour', 'Lyon', '69002', 'https://www.fluides-conseil.fr', 'Spécialiste CVC'),
  ('Enertech Solutions', 'bet_thermique', 'contact@enertech.fr', '04 76 87 65 00', '5 rue Ampère', 'Grenoble', '38000', 'https://www.enertech.fr', 'Performance énergétique'),
  ('Acoustibel', 'bet_acoustique', 'contact@acoustibel.fr', '02 40 35 67 00', '8 quai de la Fosse', 'Nantes', '44000', 'https://www.acoustibel.fr', 'Acoustique architecturale'),
  ('VRD Ingénierie', 'bet_vrd', 'contact@vrd-ingenierie.fr', '04 91 55 00 00', '45 La Canebière', 'Marseille', '13001', 'https://www.vrd-ingenierie.fr', 'Voirie et réseaux'),
  ('Atelier Paysage Urbanisme', 'paysagiste', 'contact@atelier-paysage.fr', '01 42 33 44 00', '12 rue Faubourg St-Antoine', 'Paris', '75012', 'https://www.atelier-paysage.fr', 'Paysagiste DPLG'),
  ('Économie Construction', 'economiste', 'contact@eco-construction.fr', '04 72 77 88 00', '30 rue de la République', 'Lyon', '69002', 'https://www.eco-construction.fr', 'Économiste construction'),
  ('OPC Coordination', 'opc', 'contact@opc-coordination.fr', '01 40 20 30 00', '50 boulevard Haussmann', 'Paris', '75009', 'https://www.opc-coordination.fr', 'Pilotage coordination'),
  ('Bouygues Bâtiment IDF', 'entreprise_generale', 'contact@bouygues-construction.com', '01 30 60 33 00', '1 avenue Freyssinet', 'Guyancourt', '78280', 'https://www.bouygues-batiment.com', 'Entreprise générale'),
  ('Artisans Réunis du Rhône', 'artisan', 'contact@artisans-rhone.fr', '04 78 60 70 00', '15 rue Garibaldi', 'Lyon', '69006', NULL, 'Groupement artisans'),
  ('Menuiserie Lefebvre', 'entreprise_second_oeuvre', 'contact@menuiserie-lefebvre.fr', '02 40 89 00 00', 'ZA des Sorinières', 'Nantes', '44840', 'https://www.menuiserie-lefebvre.fr', 'Menuiserie intérieure'),
  ('Maçonnerie Provence', 'entreprise_gros_oeuvre', 'contact@maconnerie-provence.fr', '04 91 78 00 00', '12 avenue du Prado', 'Marseille', '13008', NULL, 'Maçonnerie traditionnelle'),
  ('Électricité Générale Martin', 'entreprise_second_oeuvre', 'contact@elec-martin.fr', '05 61 55 00 00', '8 rue de Metz', 'Toulouse', '31000', 'https://www.elec-martin.fr', 'Électricité courant fort/faible')
) AS c(name, industry, email, phone, address, city, postal_code, website, notes)
LIMIT 18;
