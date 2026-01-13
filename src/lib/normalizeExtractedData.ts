/**
 * Normalizes extracted data from AI analysis to flat fields
 * The AI sometimes returns nested objects (site_visit.date) that need to be flattened
 * to match the database schema (site_visit_date)
 */
export function normalizeExtractedData(data: Record<string, unknown>): Record<string, unknown> {
  const normalized = { ...data };
  
  // Normalize site_visit object to flat fields
  if (normalized.site_visit && typeof normalized.site_visit === 'object') {
    const siteVisit = normalized.site_visit as Record<string, unknown>;
    if (siteVisit.required !== undefined) normalized.site_visit_required = siteVisit.required;
    if (siteVisit.date) {
      let dateStr = siteVisit.date as string;
      if (siteVisit.time) dateStr = `${dateStr}T${siteVisit.time}`;
      normalized.site_visit_date = dateStr;
    }
    if (siteVisit.location) normalized.site_visit_location = siteVisit.location;
    if (siteVisit.contact_name) normalized.site_visit_contact_name = siteVisit.contact_name;
    if (siteVisit.contact_email) normalized.site_visit_contact_email = siteVisit.contact_email;
    if (siteVisit.contact_phone) normalized.site_visit_contact_phone = siteVisit.contact_phone;
  }
  
  // Normalize deadlines object
  if (normalized.deadlines && typeof normalized.deadlines === 'object') {
    const deadlines = normalized.deadlines as Record<string, unknown>;
    if (deadlines.submission) {
      let dateStr = deadlines.submission as string;
      if (deadlines.submission_time) dateStr = `${dateStr}T${deadlines.submission_time}`;
      normalized.submission_deadline = dateStr;
    }
    if (deadlines.jury) normalized.jury_date = deadlines.jury;
    if (deadlines.results) normalized.results_date = deadlines.results;
    if (deadlines.questions_deadline) normalized.questions_deadline = deadlines.questions_deadline;
  }
  
  // Normalize client object
  if (normalized.client && typeof normalized.client === 'object') {
    const client = normalized.client as Record<string, unknown>;
    if (client.name) normalized.client_name = client.name;
    if (client.type) normalized.client_type = client.type;
    if (client.direction) normalized.client_direction = client.direction;
    if (client.address) normalized.client_address = client.address;
    if (client.contact_name) normalized.client_contact_name = client.contact_name;
    if (client.contact_email) normalized.client_contact_email = client.contact_email;
    if (client.contact_phone) normalized.client_contact_phone = client.contact_phone;
  }
  
  // Normalize project object
  if (normalized.project && typeof normalized.project === 'object') {
    const project = normalized.project as Record<string, unknown>;
    if (project.location) normalized.location = project.location;
    if (project.city) normalized.city = project.city;
    if (project.region) normalized.region = project.region;
    if (project.department) normalized.department = project.department;
    if (project.surface) normalized.surface_area = project.surface;
    if (project.description) normalized.description = project.description;
    if (project.work_nature) normalized.work_nature_tags = project.work_nature;
  }
  
  // Normalize budget object
  if (normalized.budget && typeof normalized.budget === 'object') {
    const budget = normalized.budget as Record<string, unknown>;
    if (budget.amount) normalized.estimated_budget = budget.amount;
    if (budget.disclosed !== undefined) normalized.budget_disclosed = budget.disclosed;
  }
  
  // Normalize consultation object
  if (normalized.consultation && typeof normalized.consultation === 'object') {
    const consultation = normalized.consultation as Record<string, unknown>;
    if (consultation.number) normalized.consultation_number = consultation.number;
    if (consultation.reference) normalized.reference = consultation.reference;
    if (consultation.object) normalized.market_object = consultation.object;
    if (consultation.group_code) normalized.group_code = consultation.group_code;
  }
  
  // Normalize procedure object
  if (normalized.procedure && typeof normalized.procedure === 'object') {
    const procedure = normalized.procedure as Record<string, unknown>;
    if (procedure.type) normalized.procedure_type = procedure.type;
    if (procedure.allows_variants !== undefined) normalized.allows_variants = procedure.allows_variants;
    if (procedure.allows_joint_venture !== undefined) normalized.allows_joint_venture = procedure.allows_joint_venture;
    if (procedure.joint_venture_type) normalized.joint_venture_type = procedure.joint_venture_type;
    if (procedure.mandataire_solidary !== undefined) normalized.mandataire_must_be_solidary = procedure.mandataire_solidary;
    if (procedure.offer_validity_days) normalized.offer_validity_days = procedure.offer_validity_days;
    if (procedure.negotiation !== undefined) normalized.allows_negotiation = procedure.negotiation;
  }
  
  return normalized;
}

/**
 * Merges extracted data from multiple documents and normalizes the result
 */
export function mergeAndNormalizeExtractedData(
  documents: Array<{ extracted_data?: unknown }>
): Record<string, unknown> {
  const merged = documents.reduce((acc, doc) => {
    if (doc.extracted_data && typeof doc.extracted_data === 'object') {
      const normalized = normalizeExtractedData(doc.extracted_data as Record<string, unknown>);
      return { ...acc, ...normalized };
    }
    return acc;
  }, {} as Record<string, unknown>);
  
  return merged;
}
