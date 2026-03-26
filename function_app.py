import azure.functions as func
import logging
import pandas as pd
import os
import io
from azure.core.credentials import AzureKeyCredential
from azure.ai.textanalytics import TextAnalyticsClient, AnalyzeHealthcareEntitiesAction, ExtractiveSummaryAction
from azure.ai.formrecognizer import DocumentAnalysisClient
from azure.storage.blob import BlobServiceClient

app = func.FunctionApp()

# --- Cloud Credentials ---
AI_ENDPOINT = os.environ.get("KEY")
AI_KEY = os.environ.get("KEY")
DOC_INTEL_ENDPOINT = os.environ.get("KEY")
DOC_INTEL_KEY = os.environ.get("KEY")
STORAGE_CONN_STR = os.environ.get("KEY")

@app.blob_trigger(arg_name="myblob", path="clinical-inbox/{name}", connection="STORAGE_CONNECTION_STRING")
def ProcessClinicalNote(myblob: func.InputStream):
    document_id = myblob.name.split('/')[-1]
    logging.info(f"Processing new file: {document_id}")

    raw_text = ""
    file_extension = document_id.split('.')[-1].lower()

    # ==========================================
    # ROUTING LOGIC: Extract text based on type
    # ==========================================
    if file_extension == 'txt':
        # Text files can be read directly
        raw_text = myblob.read().decode('utf-8')
        logging.info("Detected .txt file. Reading directly.")
        
    elif file_extension in ['pdf', 'jpg', 'jpeg', 'png']:
        # PDFs and Images must go through OCR first
        logging.info(f"Detected .{file_extension} file. Routing to Document Intelligence for OCR...")
        blob_bytes = myblob.read()
        
        doc_client = DocumentAnalysisClient(endpoint=DOC_INTEL_ENDPOINT, credential=AzureKeyCredential(DOC_INTEL_KEY))
        # 'prebuilt-read' is Microsoft's engine for extracting raw text and handwriting
        poller = doc_client.begin_analyze_document("prebuilt-read", document=blob_bytes)
        ocr_result = poller.result()
        
        raw_text = ocr_result.content
        logging.info("OCR Extraction complete.")
        
    else:
        logging.warning(f"Unsupported file type: {file_extension}. Aborting.")
        return

    # ==========================================
    # NLP LOGIC: Analyze the extracted text
    # ==========================================
    if not raw_text.strip():
        logging.warning("No text extracted from document. Aborting NLP.")
        return

    logging.info("Sending text to Text Analytics for health...")
    ai_client = TextAnalyticsClient(endpoint=AI_ENDPOINT, credential=AzureKeyCredential(AI_KEY))
    documents = [{"id": document_id, "text": raw_text}]
    
    nlp_poller = ai_client.begin_analyze_actions(
        documents,
        actions=[AnalyzeHealthcareEntitiesAction(), ExtractiveSummaryAction(max_sentence_count=1)]
    )
    result = nlp_poller.result()

    summary_data, entity_data, relation_data = [], [], []

    for doc_results in result:
        for action_result in doc_results:
            if action_result.is_error:
                logging.error(f"AI Action Error: {action_result.error}")
                continue
            
            if action_result.kind == "ExtractiveSummarization":
                summary_text = " ".join([sentence.text for sentence in action_result.sentences])
                summary_data.append({"Document_ID": action_result.id, "Clinical_Summary": summary_text})
                
            elif action_result.kind == "Healthcare":
                for entity in action_result.entities:
                    entity_data.append({"Document_ID": action_result.id, "Entity_Text": entity.text, "Category": entity.category, "Confidence_Score": round(entity.confidence_score, 2)})
                for rel in action_result.entity_relations:
                    relation_data.append({"Document_ID": action_result.id, "Relation_Type": rel.relation_type, "Source_Entity": rel.roles[0].entity.text, "Target_Entity": rel.roles[1].entity.text})

    # ==========================================
    # STORAGE LOGIC: Save the relational tables
    # ==========================================
    df_summaries = pd.DataFrame(summary_data)
    df_entities = pd.DataFrame(entity_data)
    df_relations = pd.DataFrame(relation_data)

    blob_service_client = BlobServiceClient.from_connection_string(STORAGE_CONN_STR)
    outbox_container = "clinical-outbox"
    
    upload_to_blob(blob_service_client, outbox_container, f"summaries_{document_id}.csv", df_summaries)
    upload_to_blob(blob_service_client, outbox_container, f"entities_{document_id}.csv", df_entities)
    upload_to_blob(blob_service_client, outbox_container, f"relations_{document_id}.csv", df_relations)

    logging.info(f"Successfully processed {document_id} and uploaded relational tables to outbox.")

def upload_to_blob(service_client, container_name, file_name, dataframe):
    if not dataframe.empty:
        blob_client = service_client.get_blob_client(container=container_name, blob=file_name)
        csv_data = dataframe.to_csv(index=False)
        blob_client.upload_blob(csv_data, overwrite=True)