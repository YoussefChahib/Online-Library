const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

admin.initializeApp();

// Configurez un transporteur d'email avec un service comme Gmail
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "your-email@gmail.com", // Remplacez par votre adresse Gmail
    pass: "your-password",
  },
});

exports.sendPasswordResetCode = functions.https.onRequest(async (req, res) => {
  const email = req.body.email;

  // Générer un code aléatoire
  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

  // Enregistrer le code dans Firestore
  const resetRef = admin.firestore().collection("passwordResets").doc(email);
  await resetRef.set({
    code: resetCode,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Envoyer l'email avec le code de vérification
  const mailOptions = {
    from: "your-email@gmail.com", // Utilisation de votre adresse Gmail
    to: email,
    subject: "Code de Réinitialisation de Mot de Passe",
    text: `Votre code de réinitialisation de mot de passe est : ${resetCode}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).send("Code envoyé par email.");
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email :", error);
    res.status(500).send("Erreur lors de l'envoi de l'email.");
  }
});
