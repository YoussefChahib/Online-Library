from ibm_watson import DiscoveryV2
from ibm_cloud_sdk_core.authenticators import IAMAuthenticator
from flask import Flask, request, jsonify
from flask_cors import CORS
import fitz  
import requests


discovery_apikey = ""
url_discovery = ""
project_id = ""
collection_id = ""


authenticator = IAMAuthenticator(discovery_apikey)
watson_discovery = DiscoveryV2(version="2023-03-31", authenticator=authenticator)
watson_discovery.set_service_url(url_discovery)


app = Flask(__name__)
CORS(app)


try:
    collection_list = watson_discovery.list_collections(project_id=project_id).get_result()["collections"]
    if not collection_list:
        raise ValueError("Collection list is empty.")
except Exception as e:
    print(f"Error fetching collections: {e}")
    collection_list = []

@app.route('/get_relevant_info', methods=['POST'])
def get_relevant_info():
    try:
        data = request.get_json()
        document_id = data.get("document_id")
        if not document_id:
            return jsonify({"error": "No document_id provided"}), 400


        for _ in range(5):  
            
            status_response = requests.get(
                f"{url_discovery}/projects/{project_id}/collections/{collection_id}/documents/{document_id}",
                headers={"Authorization": f"Bearer {discovery_apikey}"}
            )
            if status_response.status_code == 200:
                status = status_response.json().get("status")
                if status == "available":
                    break
                time.sleep(10)  
            else:
                return jsonify({"error": "Failed to check document status", "details": status_response.json()}), status_response.status_code


        if status != "available":
            return jsonify({"error": "Document not yet indexed in the collection."}), 202


        query_response = requests.post(
            f"{url_discovery}/query",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {discovery_apikey}",
            },
            json={
                "collection_ids": [collection_id],
                "natural_language_query": "Extract the three most relevant pieces of information from the document.",
                "count": 3,
                "passages": True,
                "filter": f'document_id:"{document_id}"'
            }
        )
        if query_response.status_code != 200:
            return jsonify({"error": "Failed to retrieve relevant information", "details": query_response.json()}), query_response.status_code

        passages = query_response.json().get('passages', [])
        relevant_info = [p['passage_text'] for p in passages] if passages else []
        return jsonify({"document_id": document_id, "relevant_info": relevant_info}), 200

    except Exception as e:
        return jsonify({"error": "An unexpected error occurred.", "details": str(e)}), 500


@app.route('/upload_document2', methods=['POST'])
def upload_document2():
    file = request.files.get('file')
    if not file:
        return jsonify({"error": "Please provide a file in your request body"}), 400

    try:

        file_content = file.read()


        response = watson_discovery.add_document(
            project_id=project_id,
            collection_id=collection_id,
            file=file_content,
            filename=file.filename
        ).get_result()


        document_id = response.get("document_id")
        if not document_id:
            return jsonify({
                "error": "Failed to retrieve document ID after upload"
            }), 500

 
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {discovery_apikey}",
        }
        payload = {
            "collection_ids": [collection_id],
            "natural_language_query": "Extract the three most relevant pieces of information from the document.",
            "count": 3,
            "passages": True,
            "filter": f'document_id:"{document_id}"'
        }


        url_discovery_query = f"{url_discovery}/query"
        query_response = requests.post(url_discovery_query, headers=headers, json=payload)

        if query_response.status_code == 404:
            return jsonify({
                "message": "Document uploaded successfully, but no relevant information found.",
                "document_id": document_id,
                "error": "Document not found in the collection."
            }), 404

        if query_response.status_code != 200:
            return jsonify({
                "message": "Document uploaded successfully, but failed to retrieve relevant information.",
                "document_id": document_id,
                "error": query_response.json()
            }), query_response.status_code

        query_result = query_response.json()
        passages = query_result.get('passages', [])
        relevant_info = [passage['passage_text'] for passage in passages] if passages else []

        return jsonify({
            "message": "Document uploaded successfully",
            "document_id": document_id,
            "relevant_info": relevant_info
        }), 200

    except requests.exceptions.RequestException as e:
        return jsonify({
            "error": "An error occurred while connecting to Watson Discovery.",
            "details": str(e)
        }), 500

    except Exception as e:
        return jsonify({"error": f"Problem uploading document: {str(e)}"}), 500


def clean_text(input_text, max_length=1000):
    import re

    input_text = re.sub(r"[^\x20-\x7E]+", " ", input_text)

    input_text = re.sub(r"\s+", " ", input_text)

    return input_text[:max_length].strip()

@app.route("/summarize_document", methods=["POST"])
def summarize_document():
    try:

        file = request.files.get("file")
        if not file:
            return jsonify({"error": "No file provided"}), 400


        pdf_data = file.read()
        document = fitz.open(stream=pdf_data, filetype="pdf")
        text = "".join([page.get_text() for page in document])

        if not text.strip():
            return jsonify({"error": "The PDF contains no extractable text."}), 400


        cleaned_text = clean_text(text)


        print("Cleaned Text for Watson Query:", cleaned_text)


        payload = {
            "project_id": project_id,
            "collection_ids": [collection_id],
            "natural_language_query": cleaned_text,
            "count": 3,
            "passages": True
        }
        print("Payload sent to Watson Discovery:", payload)


        response = watson_discovery.query(
            project_id=payload["project_id"],
            collection_ids=payload["collection_ids"],
            natural_language_query=payload["natural_language_query"],
            count=payload["count"],
            passages=payload["passages"]
        ).get_result()


        print("Watson Discovery Response:", response)

        passages = response.get("passages", [])
        summaries = [p.get("passage_text", "").strip() for p in passages if p.get("passage_text")]

        if not summaries:
            return jsonify({"error": "No summaries could be generated."}), 400

        return jsonify({"summaries": summaries}), 200

    except Exception as e:
        print("Error in summarize_document API:", str(e))
        return jsonify({
            "error": "Failed to query Watson Discovery.",
            "details": str(e)
        }), 500



@app.route("/extract_relevant_info", methods=["POST"])
def extract_relevant_info():
    try:

        data = request.get_json()
        document_id = data.get("document_id")

        if not document_id:
            return jsonify({"error": "No document_id provided"}), 400


        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {discovery_apikey}",
        }
        payload = {
            "collection_ids": [collection_id],
            "natural_language_query": "Extract the three most relevant pieces of information from the document.",
            "count": 3,
            "passages": True,
            "filter": f'document_id:"{document_id}"'
        }

        response = requests.post(url_discovery, headers=headers, json=payload)

        if response.status_code == 404:
            return jsonify({
                "error": "Document not found in the collection.",
                "details": response.json()
            }), 404

        if response.status_code != 200:
            return jsonify({
                "error": "Failed to retrieve information from Watson Discovery.",
                "details": response.json()
            }), response.status_code

        query_response = response.json()
        if 'passages' not in query_response or not query_response['passages']:
            return jsonify({"error": "No relevant information found in the document"}), 404

        passages = query_response['passages']
        relevant_info = [passage['passage_text'] for passage in passages]

        return jsonify({"relevant_info": relevant_info}), 200

    except requests.exceptions.RequestException as e:
        return jsonify({
            "error": "An error occurred while connecting to Watson Discovery.",
            "details": str(e)
        }), 500

    except Exception as e:
        return jsonify({
            "error": "An unexpected error occurred.",
            "details": str(e)
        }), 500


@app.route("/search", methods=["POST"])
def search():
    try:
        query = request.json.get("query")
        if not query:
            return jsonify({"error": "Query parameter is missing"}), 400
        
        response = watson_discovery.query(
            project_id=project_id,
            natural_language_query=query,
            count=5
        ).get_result()

        matching_files = [
            doc.get("metadata", {}).get("file_name") or doc.get("document_id")
            for doc in response.get("results", [])
        ]
        return jsonify({"matching_files": matching_files})

    except Exception as e:
        return jsonify({"error": str(e)}), 500





@app.route('/get_collection_id_by_name', methods=['GET'])
def get_collection_id_by_name():
    collection_name = request.args.get('collection_name')
    
    if not collection_name:
        return jsonify({"error": "Please provide a collection_name parameter"}), 400
    
    for collection in collection_list:

        if collection["name"] == collection_name:
            return jsonify({"collection_id": collection["collection_id"]}), 200

    return jsonify({"error": f"No collection found with the name '{collection_name}'"}), 404



@app.route('/get_document_id', methods=['GET'])
def get_document_id():
    document_name = request.args.get('document_name')  
    
    if not document_name:
        return jsonify({"error": "Missing document_name"}), 400

    try:
        query_response = watson_discovery.query(
            project_id=project_id,
            collection_ids=[collection_id],  
            query=f'extracted_metadata.filename:"{document_name}"',  
            count=1  
        ).get_result()


        results = query_response.get('results', [])
        if not results:
            return jsonify({"error": "Document not found"}), 404

  
        document_id = results[0].get('document_id')
        return jsonify({"document_id": document_id}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500



@app.route('/')
def home():
    return "Hiloooo" 



@app.route('/upload_document', methods=['POST'])
def upload_document():
    file = request.files.get('file')
    if not file:
        return jsonify({"error": "Please provide a file in your request body"}), 400

    try:

        file_content = file.read()

        response = watson_discovery.add_document(
            project_id=project_id,
            collection_id=collection_id,
            file=file_content,
            filename=file.filename
        ).get_result()


        document_id = response.get("document_id")
        return jsonify({
            "message": "Document uploaded successfully",
            "document_id": document_id
        }), 200
    except Exception as e:
        return jsonify({"error": f"Problem uploading document: {str(e)}"}), 500

def get_document_id(document_name):
    if not document_name:
        raise ValueError("Missing document_name")

    try:
        query_response = watson_discovery.query(
            project_id=project_id,
            collection_ids=[collection_id],
            query=f'extracted_metadata.filename:"{document_name}"',
            count=1
        ).get_result()


        results = query_response.get('results', [])
        if not results:
            raise ValueError("Document not found")


        document_id = results[0].get('document_id')
        return document_id

    except Exception as e:
        raise RuntimeError(f"Error retrieving document ID: {e}")

@app.route('/delete_document', methods=['DELETE'])
def delete_document():

    document_name = request.args.get('document_name')
    if not document_name:
        return jsonify({"error": "Please provide a document_name parameter"}), 400

    try:

        document_id = get_document_id(document_name)
        print(f"Document ID: {document_id}")  


        response = watson_discovery.delete_document(
            project_id=project_id,
            collection_id=collection_id,
            document_id=document_id
        )

        return jsonify({"message": "Document deleted successfully", "details": response.get_result()}), 200

    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except RuntimeError as re:
        return jsonify({"error": str(re)}), 500
    except Exception as e:
        return jsonify({"error": f"Problem when deleting document: {str(e)}"}), 500
if __name__ == '__main__':
    app.run(debug=True)
