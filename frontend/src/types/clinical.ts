export interface ClinicalSummary {
  Document_ID: string;
  Clinical_Summary: string;
}

export interface ClinicalEntity {
  Document_ID: string;
  Entity_Text: string;
  Category: string;
  Confidence_Score: number;
}

export interface PatientRecord {
  summary: string | null;
  symptoms: string[];
  diagnoses: string[];
  medications: string[];
}