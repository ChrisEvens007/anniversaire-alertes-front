const baseURL = "https://anniversaire-alertes-api.onrender.com";

// ✅ Vérifie que les notifications sont disponibles
if ("Notification" in window) {
  Notification.requestPermission().then(permission => {
    console.log("Permission de notification :", permission);
  });
}

// ✅ Calcule la date de demain au format JJ/MM
function calculerDateDemain() {
  const aujourdHui = new Date();
  aujourdHui.setDate(aujourdHui.getDate() + 1);
  const jour = String(aujourdHui.getDate()).padStart(2, "0");
  const mois = String(aujourdHui.getMonth() + 1).padStart(2, "0");
  return `${jour}/${mois}`;  
}

// ✅ Vérifie les anniversaires dans les données
function verifierAnniversaires(donnees) {
  const dateDemain = calculerDateDemain();
  const aujourdHui = new Date();
  const jourActuel = String(aujourdHui.getDate()).padStart(2, "0");
  const moisActuel = String(aujourdHui.getMonth() + 1).padStart(2, "0");
  const dateAujourdhui = `${jourActuel}/${moisActuel}`;

  let alertesTrouvees = false;

  donnees.forEach(personne => {
    if (!personne.date_naissance) return;

    const [jour, mois] = personne.date_naissance.split("/");
    if (!jour || !mois) return;

    const datePersonne = `${jour.padStart(2, "0")}/${mois.padStart(2, "0")}`;

    if (datePersonne === dateAujourdhui) {
      afficherAlerte(personne, true);
      alertesTrouvees = true;
    } else if (datePersonne === dateDemain) {
      afficherAlerte(personne, false);
      alertesTrouvees = true;
    }
  });

  if (!alertesTrouvees) {
    afficherMessage("✅ Aucun anniversaire aujourd’hui ni demain.");
    console.log("Aucun anniversaire pour aujourd’hui ni demain.");
  }
}

// ✅ Affiche une alerte HTML + notification système
function afficherAlerte(personne, aujourdhui = false) {
  const zoneAlertes = document.getElementById("alertes");
  if (!zoneAlertes) return;

  const alerte = document.createElement("div");
  alerte.className = "alerte";

  const titre = aujourdhui
    ? `🎂 Aujourd’hui c’est l’anniversaire de <strong>${personne.prenom} ${personne.nom}</strong> !`
    : `🎉 Demain c’est l’anniversaire de <strong>${personne.prenom} ${personne.nom}</strong> !`;

  alerte.innerHTML = `
    <p>${titre}</p>
    ${personne.contact_personnel ? `<p>📱 Personnel : <a href="tel:${personne.contact_personnel}">${personne.contact_personnel}</a></p>` : ""}
    ${personne.contact_parent ? `<p>👨‍👩‍👧 Parent : <a href="tel:${personne.contact_parent}">${personne.contact_parent}</a></p>` : ""}
  `;

  zoneAlertes.appendChild(alerte);

  if (Notification.permission === "granted") {
    new Notification(
      aujourdhui ? "🎂 Anniversaire aujourd’hui !" : "🎉 Anniversaire demain !",
      { body: `${personne.prenom} ${personne.nom}`, icon: "icone.png" }
    );
  }
}

// ✅ Affiche un message informatif
function afficherMessage(message) {
  const zoneAlertes = document.getElementById("alertes");
  if (zoneAlertes) zoneAlertes.innerHTML = `<p style="color:green;">${message}</p>`;
}

// ✅ Affiche une erreur
function afficherErreur(message) {
  const zoneAlertes = document.getElementById("alertes");
  if (zoneAlertes) zoneAlertes.innerHTML = `<p style="color:red;">${message}</p>`;
}

// ✅ Affiche les anniversaires de la semaine
function afficherAnniversairesSemaine(donnees) {
  const aujourdHui = new Date();
  const jourSemaine = aujourdHui.getDay();
  const debutSemaine = new Date(aujourdHui);
  debutSemaine.setDate(aujourdHui.getDate() - (jourSemaine === 0 ? 6 : jourSemaine - 1));
  const finSemaine = new Date(debutSemaine);
  finSemaine.setDate(debutSemaine.getDate() + 6);

  const alertesSemaine = donnees.filter(p => {
    if (!p.date_naissance) return false;
    const [jour, mois] = p.date_naissance.split("/");
    const date = new Date(new Date().getFullYear(), mois - 1, jour);
    return date >= debutSemaine && date <= finSemaine;
  });

  const zone = document.getElementById("semaines");
  zone.innerHTML = alertesSemaine.length
    ? alertesSemaine.map(p => `
        <div class="alerte">
          <p>🎂 ${p.prenom} ${p.nom} — ${p.date_naissance}</p>
          ${p.contact_personnel ? `<p>📱 ${p.contact_personnel}</p>` : ""}
        </div>
      `).join("")
    : "<p>Aucun anniversaire cette semaine.</p>";
}

// ✅ Affiche les anniversaires du mois
function afficherAnniversairesMois(donnees) {
  const moisActuel = new Date().getMonth() + 1;
  const alertesMois = donnees.filter(p => {
    if (!p.date_naissance) return false;
    const [, mois] = p.date_naissance.split("/");
    return parseInt(mois) === moisActuel;
  });

  const zone = document.getElementById("mois");
  zone.innerHTML = alertesMois.length
    ? alertesMois.map(p => `
        <div class="alerte">
          <p>🎉 ${p.prenom} ${p.nom} — ${p.date_naissance}</p>
        </div>
      `).join("")
    : "<p>Aucun anniversaire ce mois-ci.</p>";
}

// ✅ Téléchargement ICS filtré
function telechargerICS() {
  const date = prompt("Entrez la date de mise à jour (YYYY-MM-DD) :", "2025-10-01");
  if (!date) return;

  const url = `${baseURL}/telecharger?depuis=${date}`;
  const lien = document.createElement("a");
  lien.href = url;
  lien.download = "anniversaires.ics";
  document.body.appendChild(lien);
  lien.click();
  document.body.removeChild(lien);
}

// ✅ Chargement automatique depuis l’API Render
let donneesAnniversaires = [];

fetch(`${baseURL}/anniversaires`)
  .then(response => response.json())
  .then(data => {
    donneesAnniversaires = data;
    verifierAnniversaires(donneesAnniversaires);
    afficherAnniversairesSemaine(donneesAnniversaires);
    afficherAnniversairesMois(donneesAnniversaires);
  })
  .catch((error) => {
    console.error("Erreur de chargement depuis l'API :", error);
    afficherErreur("❌ Impossible de charger les données depuis le serveur.");
  });