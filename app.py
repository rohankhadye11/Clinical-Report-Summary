import streamlit as st
import pandas as pd
from azure.storage.blob import BlobServiceClient
import io
import plotly.express as px

# --- Configuration ---
st.set_page_config(page_title="Clinical Report Dashboard", page_icon="🏥", layout="wide")

# 1. Config & Auth
STORAGE_CONNECTION_STRING = "KEY"
CONTAINER_NAME = "clinical-outbox"

# --- Data Loading (Cached for performance) ---
@st.cache_data(ttl=60) # Refreshes data every 60 seconds
def load_data():
    try:
        blob_service_client = BlobServiceClient.from_connection_string(STORAGE_CONNECTION_STRING)
        container_client = blob_service_client.get_container_client(CONTAINER_NAME)
        
        summary_list, entity_list = [], []
        
        # Pull all processed CSVs from the Azure outbox
        blobs = container_client.list_blobs()
        for blob in blobs:
            blob_client = container_client.get_blob_client(blob.name)
            data = blob_client.download_blob().readall()
            df = pd.read_csv(io.BytesIO(data))
            
            if blob.name.startswith("summaries_"):
                summary_list.append(df)
            elif blob.name.startswith("entities_"):
                entity_list.append(df)
                
        # Combine all files into master DataFrames
        df_summaries = pd.concat(summary_list, ignore_index=True) if summary_list else pd.DataFrame()
        df_entities = pd.concat(entity_list, ignore_index=True) if entity_list else pd.DataFrame()
        
        return df_summaries, df_entities
    except Exception as e:
        st.error(f"Error connecting to Azure: {e}")
        return pd.DataFrame(), pd.DataFrame()

df_summaries, df_entities = load_data()

# --- App Layout ---
st.title("🏥 Clinical NLP Dashboard")

if df_summaries.empty or df_entities.empty:
    st.warning("No data found in the outbox. Please upload clinical notes to the inbox.")
    st.stop()

# --- Sidebar: Dynamic Search ---
st.sidebar.header("🔍 Filter Records")
search_query = st.sidebar.text_input("Search Document ID:")

# Apply the search filter if the user types something
if search_query:
    df_summaries = df_summaries[df_summaries['Document_ID'].str.contains(search_query, case=False, na=False)]
    valid_docs = df_summaries['Document_ID'].tolist()
    df_entities = df_entities[df_entities['Document_ID'].isin(valid_docs)]

# --- Main Dashboard Visuals ---
col1, col2 = st.columns(2)

with col1:
    st.subheader("Extracted Entity Breakdown")
    category_counts = df_entities['Category'].value_counts().reset_index()
    category_counts.columns = ['Category', 'Count']
    # Create an interactive Bar Chart
    fig_cat = px.bar(category_counts, x='Category', y='Count', color='Category')
    st.plotly_chart(fig_cat, use_container_width=True)

with col2:
    st.subheader("Symptom Distribution")
    symptoms = df_entities[df_entities['Category'] == 'SymptomOrSign']
    if not symptoms.empty:
        # Create an interactive Donut Chart
        fig_symp = px.pie(symptoms, names='Entity_Text', hole=0.4)
        st.plotly_chart(fig_symp, use_container_width=True)
    else:
        st.info("No symptoms found in the current dataset.")

# --- Data Table ---
st.subheader("📄 AI-Generated Clinical Summaries")
# Display the master summaries table
st.dataframe(df_summaries, use_container_width=True, hide_index=True)