import { BlobServiceClient } from '@azure/storage-blob';
import Papa from 'papaparse';
import { ClinicalSummary, ClinicalEntity, PatientRecord } from '@/types/clinical';

const connStr = process.env.AZURE_STORAGE_CONNECTION_STRING || '';
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'clinical-outbox';

async function streamToString(readableStream: NodeJS.ReadableStream): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: string[] = [];
    readableStream.on('data', (data) => chunks.push(data.toString()));
    readableStream.on('end', () => resolve(chunks.join('')));
    readableStream.on('error', reject);
  });
}

export async function fetchPatientData(recordId: string): Promise<PatientRecord | null> {
  if (!connStr) throw new Error('Azure Storage Connection String is missing.');

  const blobServiceClient = BlobServiceClient.fromConnectionString(connStr);
  const containerClient = blobServiceClient.getContainerClient(containerName);

  try {
    const summaryBlob = containerClient.getBlobClient(`summaries_${recordId}.csv`);
    const entityBlob = containerClient.getBlobClient(`entities_${recordId}.csv`);

    const summaryResponse = await summaryBlob.download();
    const entityResponse = await entityBlob.download();

    const summaryCsv = await streamToString(summaryResponse.readableStreamBody!);
    const entityCsv = await streamToString(entityResponse.readableStreamBody!);

    const parsedSummaries = Papa.parse<ClinicalSummary>(summaryCsv, { header: true }).data;
    const parsedEntities = Papa.parse<ClinicalEntity>(entityCsv, { header: true }).data;

    const mainSummary = parsedSummaries.length > 0 ? parsedSummaries[0].Clinical_Summary : null;
    
    const symptoms = [...new Set(parsedEntities.filter(e => e.Category === 'SymptomOrSign').map(e => e.Entity_Text))];
    const diagnoses = [...new Set(parsedEntities.filter(e => e.Category === 'Diagnosis').map(e => e.Entity_Text))];
    const medications = [...new Set(parsedEntities.filter(e => e.Category === 'MedicationName').map(e => e.Entity_Text))];

    return {
      summary: mainSummary,
      symptoms: symptoms.filter(Boolean),
      diagnoses: diagnoses.filter(Boolean),
      medications: medications.filter(Boolean),
    };

  } catch (error) {
    console.error("Blob fetch error:", error);
    return null; 
  }
}