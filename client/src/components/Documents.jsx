
import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;

function Documents() {
  const [file, setFile] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const loadDocuments = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/documents`,
        {
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not load documents");
      }

      setDocuments(data.documents || []);
    } catch (error) {
      setMessage(error.message);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleUpload = async (event) => {
    event.preventDefault();

    if (!file) {
      setMessage("Please select a file first");
      return;
    }

    const formData = new FormData();
    formData.append("document", file);

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/api/documents/upload`,
        {
          method: "POST",
          credentials: "include",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Upload failed");
      }

      setMessage("Document uploaded successfully!");
      setFile(null);

      event.target.reset();

      await loadDocuments();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch(
        `${API_URL}/api/documents/${id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Delete failed");
      }

      setMessage("Document deleted successfully");
      await loadDocuments();
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <div className="documents-page">
      <h2>Enterprise Knowledge Base</h2>

      <form onSubmit={handleUpload}>
        <input
          type="file"
          accept=".pdf,.txt"
          onChange={(event) =>
            setFile(event.target.files[0] || null)
          }
        />

        <button type="submit" disabled={loading}>
          {loading ? "Uploading..." : "Upload Document"}
        </button>
      </form>

      {message && <p>{message}</p>}

      <h3>Uploaded Documents</h3>

      {documents.length === 0 ? (
        <p>No documents uploaded yet.</p>
      ) : (
        documents.map((doc) => (
          <div key={doc._id} className="document-item">
            <div>
              <strong>{doc.originalName}</strong>
              <p>Status: {doc.status}</p>
              <p>Chunks: {doc.chunkCount}</p>
              <p>Department: {doc.department}</p>
            </div>

            <button
              type="button"
              onClick={() => handleDelete(doc._id)}
            >
              Delete
            </button>
          </div>
        ))
      )}
    </div>
  );
}

export default Documents;
