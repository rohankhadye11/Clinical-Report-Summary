import { NextResponse } from 'next/server';
import { fetchPatientData } from '@/lib/azureStorage';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const recordId = searchParams.get('id');

  if (!recordId) {
    return NextResponse.json({ error: 'Record ID is required' }, { status: 400 });
  }

  try {
    const data = await fetchPatientData(recordId);
    
    if (!data) {
      return NextResponse.json({ error: 'Record not found. Please check the ID.' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}