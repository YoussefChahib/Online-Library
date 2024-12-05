import React, { useState, useEffect } from "react";
import {
  Container,
  Form,
  Row,
  Col,
  Card,
  Button,
  Alert
} from "react-bootstrap";
import { createClient } from "@supabase/supabase-js";
import { BsTrash, BsEye } from "react-icons/bs";

const supabase = createClient(
  "",
  ""
);

const CDN_URL =
  "https://wlllfudciegasxbvryci.supabase.co/storage/v1/object/public/Livre/";

function Uploadbook() {
  const [book, setbook] = useState([]);
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [category, setCategory] = useState("");
  const [theme, setTheme] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);const [expandedCard, setExpandedCard] = useState(null);

  const toggleCard = (fileName) => {
    setExpandedCard(expandedCard === fileName ? null : fileName);
  };

  async function handleSearch() {
    if (!searchQuery) {
      alert('Entrez une requête de recherche.');
      return;
    }
  
    setLoading(true);
  
    try {
      // Étape 1 : Requête à l'API Watson Discovery
      const response = await fetch('http://127.0.0.1:5000/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery }),
      });
  
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la recherche.');
      }
  
      console.log('Données Watson Discovery:', data);
  
      // Étape 2 : Extraire les document_id des résultats de Watson Discovery
      const documentIds = data.matching_files || [];
      console.log('Document IDs:', documentIds);
  
      if (documentIds.length === 0) {
        setSearchResults([]);
        setLoading(false);
        return;
      }
  
      // Étape 3 : Requête à Supabase pour récupérer les noms de fichiers associés
      const { data: files, error } = await supabase
        .from('book') // Remplacez par le nom de votre table
        .select('file_name') // Assurez-vous que le nom correspond à votre colonne
        .in('watson_document_id', documentIds); // Remplacez par le nom exact de votre colonne contenant les IDs Watson
  
      console.log('Fichiers récupérés depuis Supabase:', files);
  
      if (error) {
        console.error('Erreur lors de la requête Supabase:', error);
        alert(`Erreur lors de la récupération des fichiers : ${error.message}`);
        setLoading(false);
        return;
      }
  
      // Mise à jour des résultats de recherche
      setSearchResults(files.map((file) => file.file_name));
    } catch (error) {
      console.error(error);
      alert('Erreur avec la recherche.');
    } finally {
      setLoading(false);
    }
  }
  


  // Récupérer les fichiers existants avec leurs catégories et thèmes
  async function getbook() {
    const { data, error } = await supabase.from("book").select("*"); // Récupérer toutes les données
    if (error) {
      console.error(error);
      alert("Erreur lors de la récupération des livres.");
    } else {
      setbook(data);
    }
  }

  // Téléversement de fichier
  async function uploadFile() {
    if (!file || !fileName || !category || !theme) {
      setAlertMessage("assurer vous que vou s avez remplie tous les fields.");
      return;
    }
    setAlertMessage("");

    const extension = file.name.split(".").pop();
    if (extension.toLowerCase() !== "pdf") {
      alert("svp choisis un fichier pdf.");
      return;
    }

    const fileNameWithExtension = `${fileName}.${extension}`;

    try {
      // step1: upload to Supabase storage !!!!!!!!!!!!!!!!!!!!!!! atentionn
      const { error: uploadError } = await supabase.storage
        .from("Livre")
        .upload(fileNameWithExtension, file);
      if (uploadError) {
        console.error(uploadError);
        alert("probleme lors de l'upload à supabase.");
        return;
      }

      //step 2: upload to Watson Discovery
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("http://127.0.0.1:5000/upload_document", {
        method: "POST",
        body: formData
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data.error || "probleme lors de l'upload à Watson Discovery"
        );
      }

      const watsonDocumentId = data.document_id;

      // Step 3: Save metadata and Watson document ID in Supabase db !!!!!!!!!!!!!!!!!!!!!!! atentionn
      const { error: insertError } = await supabase.from("book").insert([
        {
          file_name: fileNameWithExtension,
          name: fileName,
          category: category,
          theme: theme,
          watson_document_id: watsonDocumentId // save Watson document_id bach nmappewhom
        }
      ]);

      if (insertError) {
        console.error(insertError);
        alert("probleme lors de l'ajout des metadata a supabase.");
      } else {
        alert("fichier ajoute ave c succes a Supabase et watson Discovery!");
        getbook(); // refresh the file list
      }
    } catch (error) {
      console.error(error);
      alert("probelem avec Watson Discovery.");
    }
  }

  // Supprimer un fichier
  const deleteFile = async fileNameToDelete => {
    if (
      window.confirm(
        `Êtes-vous sûr de vouloir supprimer le fichier ${fileNameToDelete} ?`
      )
    ) {
      try {
        const { error: deleteError } = await supabase.storage
          .from("Livre")
          .remove([fileNameToDelete]);
        if (deleteError) throw deleteError;

        await supabase
          .from("book")
          .delete()
          .match({ file_name: fileNameToDelete });
        alert("Fichier supprimé avec succès !");
        getbook();
      } catch (error) {
        console.error(error);
        alert("Erreur lors de la suppression du fichier.");
      }
    }
  };

  // Voir un PDF
  const viewPDF = fileName => {
    const pdfUrl = `${CDN_URL}${fileName}`;
    window.open(pdfUrl, "_blank");
  };

  useEffect(() => {
    getbook();
  }, []);

  return (
    <Container className="mt-5">
      {/* Titre principal */}
      <h1
        className="text-center mb-4"
        style={{ color: "#0046A5", fontFamily: "Arial, sans-serif" }}
      >
        Téléversez vos livres PDF
      </h1>

      {/* Section de recherche */}
      <Form className="mb-4">
        <Form.Group className="mb-3">
          <Form.Label>Rechercher des documents</Form.Label>
          <Form.Control
            type="text"
            placeholder="Entrez une requête"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </Form.Group>
        <Button
          variant="primary"
          onClick={handleSearch}
          className="mt-2"
          disabled={loading}
        >
          {loading ? "Recherche en cours..." : "Rechercher"}
        </Button>
      </Form>

      {/* Affichage des résultats */}
      <div className="mt-4">
        {loading && <p>Recherche en cours...</p>} {/* Indicateur de chargement */}

        {!loading && searchResults.length === 0 && searchQuery && (
          <p>Aucun résultat trouvé pour "{searchQuery}".</p>
        )}

        {!loading && searchResults.length > 0 && (
          <div>
            <h2>Résultats de la recherche</h2>
            <Row>
              {searchResults.map((fileName, index) => (
                <Col key={index} xs={12} md={6} lg={4} className="mb-4">
                  <Card
                    style={{
                      borderRadius: "10px",
                      boxShadow: "0 2px 8px rgba(0, 70, 165, 0.1)"
                    }}
                  >
                    <Card.Body>
                      <Card.Title>{fileName}</Card.Title>
                      <div className="d-flex justify-content-center">
                        <Button
                          variant="success"
                          onClick={() => viewPDF(fileName)}
                          style={{
                            borderRadius: "10px",
                            backgroundColor: "#0046A5"
                          }}
                        >
                          <BsEye /> Voir
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        )}
      </div>

      {/* Message en cas d'erreur ou d'alerte */}
      {alertMessage && (
        <Alert variant="danger" className="mt-4">
          {alertMessage}
        </Alert>
      )}

      {/* Formulaire pour téléverser un fichier */}
      <Form className="mt-4">
        <Form.Group className="mb-3">
          <Form.Label>Nom du fichier</Form.Label>
          <Form.Control
            type="text"
            placeholder="Entrez un nom pour votre fichier"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            style={{ borderRadius: "10px", border: "1px solid #0046A5" }}
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Catégorie</Form.Label>
          <Form.Control
            as="select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{ borderRadius: "10px", border: "1px solid #0046A5" }}
          >
            <option value="">Sélectionner une catégorie</option>
            <option value="Science">Science</option>
            <option value="Histoire">Histoire</option>
            <option value="Littérature">Littérature</option>
            <option value="Technologie">Technologie</option>
          </Form.Control>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Thème</Form.Label>
          <Form.Control
            as="select"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            style={{ borderRadius: "10px", border: "1px solid #0046A5" }}
          >
            <option value="">Sélectionner un thème</option>
            <option value="Innovation">Innovation</option>
            <option value="Recherche">Recherche</option>
            <option value="Éducation">Éducation</option>
            <option value="Écologie">Écologie</option>
          </Form.Control>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Choisissez un fichier PDF</Form.Label>
          <Form.Control
            type="file"
            accept=".pdf"
            onChange={(e) => setFile(e.target.files[0])}
            style={{ borderRadius: "10px", border: "1px solid #0046A5" }}
          />
        </Form.Group>

        <Button
          variant="primary"
          onClick={uploadFile}
          style={{ borderRadius: "10px", marginTop: "10px" }}
        >
          Téléverser le fichier
        </Button>
      </Form>

      {/* Liste des fichiers téléversés */}
      <div className="mt-5">
        <h2>Fichiers Téléversés</h2>
        <Row>
          {book.map((book) => (
            <Col key={book.file_name} xs={12} md={6} lg={4} className="mb-4">
              <Card
                style={{
                  borderRadius: "10px",
                  boxShadow: "0 2px 8px rgba(0, 70, 165, 0.1)"
                }}
              >
                <Card.Body>
                  {/* Toggle between basic details and most_tree_relevent_infos */}
                  {expandedCard === book.file_name ? (
                    <div>
                      <Card.Text>
                        <strong>Informations Importantes : </strong>
                        {book.most_tree_relevent_infos}
                      </Card.Text>
                      <Button
                        variant="secondary"
                        onClick={() => toggleCard(book.file_name)}
                        style={{
                          borderRadius: "10px",
                          marginTop: "10px"
                        }}
                      >
                        Retour
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <Card.Title>{book.name}</Card.Title>
                      <Card.Text>
                        <strong>Catégorie : </strong>
                        {book.category}
                      </Card.Text>
                      <Card.Text>
                        <strong>Thème : </strong>
                        {book.theme}
                      </Card.Text>
                      <div className="d-flex justify-content-center gap-2">
                        <Button
                          variant="success"
                          onClick={() => viewPDF(book.file_name)}
                          style={{
                            borderRadius: "10px",
                            backgroundColor: "#0046A5"
                          }}
                        >
                          <BsEye /> Voir
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => deleteFile(book.file_name)}
                          style={{
                            borderRadius: "10px",
                            backgroundColor: "#D9534F"
                          }}
                        >
                          <BsTrash /> Supprimer
                        </Button>
                        <Button
                          variant="info"
                          onClick={() => toggleCard(book.file_name)}
                          style={{
                            borderRadius: "10px",
                            backgroundColor: "#17a2b8"
                          }}
                        >
                          Plus d'infos
                        </Button>
                      </div>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </Container>
  );


};


export default Uploadbook;
