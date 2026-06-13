import { useState, useEffect, useRef, Fragment as Frag } from "react";

// ─── STITCH DESIGN SYSTEM FONTS (injected once) ────────────────────────────
if (typeof document !== "undefined" && !document.getElementById("stitch-fonts")) {
  const link = document.createElement("link");
  link.id = "stitch-fonts";
  link.rel = "stylesheet";
  link.href = "https://fonts.googleapis.com/css2?family=Libre+Caslon+Text:wght@400;700&family=Manrope:wght@400;600;700&family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap";
  document.head.appendChild(link);
  const style = document.createElement("style");
  style.textContent = `
    .material-symbols-outlined { font-family: 'Material Symbols Outlined'; font-weight: normal; font-style: normal; font-size: 24px; line-height: 1; letter-spacing: normal; text-transform: none; display: inline-block; white-space: nowrap; word-wrap: normal; direction: ltr; font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
    .it-glass { background: rgba(32,32,21,0.72); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid rgba(212,175,55,0.18); }
    .it-lesson-card { background: rgba(20,20,21,0.62); border: 1px solid rgba(212,175,55,0.10); }
    .it-roman-border { border: 1px solid rgba(212,175,55,0.22); }
    .it-gold-glow { box-shadow: 0 0 18px rgba(212,175,55,0.08); }
    * { scrollbar-width: none; box-sizing: border-box; } *::-webkit-scrollbar { display: none; }
    html, body { overflow-x: hidden; max-width: 100vw; }
    img, svg { max-width: 100%; }
    input, textarea, button { max-width: 100%; }
    @keyframes it-pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
    @keyframes it-bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }
    @keyframes it-fade-in { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
    .it-fade-in { animation: it-fade-in 0.35s ease both; }
  `;
  document.head.appendChild(style);
}

// ─── CONFIGURACIÓN SUPABASE ────────────────────────────────────────────────
const SUPABASE_URL = "https://hdmowcceetnxlnkpytjd.supabase.co";
const SUPABASE_KEY = "sb_publishable_m82yyTewd2rt4IinvgNiMw_qzP00goJ";

const headers = {
  "apikey": SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
  "Prefer": "return=representation",
};

// ─── API HELPER (Supabase REST) ────────────────────────────────────────────
const api = {
  async list(table, opts = {}) {
    let url = `${SUPABASE_URL}/rest/v1/${table}?select=*`;
    if (opts.filter) url += `&${opts.filter}`;
    if (opts.order) url += `&order=${opts.order}`;
    if (opts.limit) url += `&limit=${opts.limit}`;
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  async create(table, fields) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: "POST", headers, body: JSON.stringify(fields),
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return Array.isArray(data) ? data[0] : data;
  },
  async update(table, id, fields) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
      method: "PATCH", headers, body: JSON.stringify(fields),
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return Array.isArray(data) ? data[0] : data;
  },
  async upsert(table, fields) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: "POST",
      headers: { ...headers, "Prefer": "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify(fields),
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return Array.isArray(data) ? data[0] : data;
  },
  async seed(table, records) {
    for (let i = 0; i < records.length; i += 50) {
      const batch = records.slice(i, i + 50);
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
        method: "POST", headers, body: JSON.stringify(batch),
      });
      if (!res.ok) throw new Error(await res.text());
    }
  },
};

// ─── BACKUP COMPLETO (exporta todas las tablas a JSON) ─────────────────────
const BACKUP_TABLES = [
  "vocabulario", "progreso_usuario", "diario_entradas",
  "conversaciones_speaking", "planes_semanales", "planes_diarios", "lecturas",
];

async function exportarBackupCompleto() {
  const data = {};
  for (const tabla of BACKUP_TABLES) {
    try {
      data[tabla] = await api.list(tabla);
    } catch (e) {
      data[tabla] = { error: String(e) };
    }
  }
  const fecha = new Date().toISOString().slice(0, 10);
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `progetto-italiano-backup-${fecha}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── SEED VOCABULARIO (600+ palabras, 30 semanas A0→B1) ───────────────────
const SEED_VOCAB = [
  // ── SEMANA 1 – Saluti & Fondamenta ──
  { palabra_it:"ciao", traduccion_es:"hola / chao", ejemplo:"Ciao, come stai?", categoria:"saluti", nivel:"A0", semana:1, dia:1, activa:true },
  { palabra_it:"buongiorno", traduccion_es:"buenos días", ejemplo:"Buongiorno signora!", categoria:"saluti", nivel:"A0", semana:1, dia:1, activa:true },
  { palabra_it:"buonasera", traduccion_es:"buenas tardes/noches", ejemplo:"Buonasera a tutti!", categoria:"saluti", nivel:"A0", semana:1, dia:1, activa:true },
  { palabra_it:"piacere", traduccion_es:"mucho gusto", ejemplo:"Piacere di conoscerti!", categoria:"saluti", nivel:"A0", semana:1, dia:1, activa:true },
  { palabra_it:"arrivederci", traduccion_es:"hasta luego", ejemplo:"Arrivederci, a presto!", categoria:"saluti", nivel:"A0", semana:1, dia:1, activa:true },
  { palabra_it:"grazie mille", traduccion_es:"muchísimas gracias", ejemplo:"Grazie mille per l'aiuto!", categoria:"saluti", nivel:"A0", semana:1, dia:1, activa:true },
  { palabra_it:"prego", traduccion_es:"de nada", ejemplo:"Grazie! — Prego!", categoria:"saluti", nivel:"A0", semana:1, dia:1, activa:true },
  { palabra_it:"scusi", traduccion_es:"disculpe (formal)", ejemplo:"Scusi, dov'è la stazione?", categoria:"saluti", nivel:"A0", semana:1, dia:1, activa:true },
  { palabra_it:"mi chiamo", traduccion_es:"me llamo", ejemplo:"Mi chiamo Marco, piacere!", categoria:"saluti", nivel:"A0", semana:1, dia:1, activa:true },
  { palabra_it:"come stai?", traduccion_es:"¿cómo estás?", ejemplo:"Ciao! Come stai oggi?", categoria:"saluti", nivel:"A0", semana:1, dia:1, activa:true },
  { palabra_it:"uno / due / tre", traduccion_es:"uno / dos / tres", ejemplo:"Due biglietti, per favore.", categoria:"numeri", nivel:"A0", semana:1, dia:2, activa:true },
  { palabra_it:"quattro / cinque / sei", traduccion_es:"cuatro / cinco / seis", ejemplo:"Ho cinque euro.", categoria:"numeri", nivel:"A0", semana:1, dia:2, activa:true },
  { palabra_it:"dieci / venti / cento", traduccion_es:"diez / veinte / cien", ejemplo:"Costa dieci euro.", categoria:"numeri", nivel:"A0", semana:1, dia:2, activa:true },
  { palabra_it:"quanto costa?", traduccion_es:"¿cuánto cuesta?", ejemplo:"Quanto costa questa borsa?", categoria:"domande", nivel:"A0", semana:1, dia:2, activa:true },
  { palabra_it:"rosso / blu / verde", traduccion_es:"rojo / azul / verde", ejemplo:"Voglio la maglietta rossa.", categoria:"colori", nivel:"A0", semana:1, dia:2, activa:true },
  { palabra_it:"bianco / nero / giallo", traduccion_es:"blanco / negro / amarillo", ejemplo:"Una camicia bianca, per favore.", categoria:"colori", nivel:"A0", semana:1, dia:2, activa:true },
  { palabra_it:"dove si trova?", traduccion_es:"¿dónde se encuentra?", ejemplo:"Dove si trova la farmacia?", categoria:"domande", nivel:"A0", semana:1, dia:3, activa:true },
  { palabra_it:"a destra / a sinistra", traduccion_es:"a la derecha / izquierda", ejemplo:"Gira a destra al semaforo.", categoria:"orientamento", nivel:"A0", semana:1, dia:3, activa:true },
  { palabra_it:"dritto", traduccion_es:"recto / derecho", ejemplo:"Vai sempre dritto.", categoria:"orientamento", nivel:"A0", semana:1, dia:3, activa:true },
  { palabra_it:"vicino / lontano", traduccion_es:"cerca / lejos", ejemplo:"Il supermercato è vicino.", categoria:"orientamento", nivel:"A0", semana:1, dia:3, activa:true },
  { palabra_it:"non capisco", traduccion_es:"no entiendo", ejemplo:"Mi dispiace, non capisco.", categoria:"domande", nivel:"A0", semana:1, dia:3, activa:true },
  { palabra_it:"può ripetere?", traduccion_es:"¿puede repetir?", ejemplo:"Può ripetere più lentamente?", categoria:"domande", nivel:"A0", semana:1, dia:3, activa:true },
  { palabra_it:"vorrei", traduccion_es:"quisiera", ejemplo:"Vorrei una pasta al pomodoro.", categoria:"ristorante", nivel:"A0", semana:1, dia:4, activa:true },
  { palabra_it:"il menù", traduccion_es:"la carta / el menú", ejemplo:"Il menù, per favore!", categoria:"ristorante", nivel:"A0", semana:1, dia:4, activa:true },
  { palabra_it:"il conto", traduccion_es:"la cuenta", ejemplo:"Il conto, per favore!", categoria:"ristorante", nivel:"A0", semana:1, dia:4, activa:true },
  { palabra_it:"è delizioso", traduccion_es:"está delicioso", ejemplo:"Questo risotto è delizioso!", categoria:"ristorante", nivel:"A0", semana:1, dia:4, activa:true },
  { palabra_it:"senza / con", traduccion_es:"sin / con", ejemplo:"Senza glutine, per favore.", categoria:"ristorante", nivel:"A0", semana:1, dia:4, activa:true },
  { palabra_it:"affittare", traduccion_es:"alquilar", ejemplo:"Vorrei affittare un appartamento.", categoria:"casa", nivel:"A1", semana:1, dia:5, activa:true },
  { palabra_it:"le spese incluse", traduccion_es:"gastos incluidos", ejemplo:"Le spese sono incluse?", categoria:"casa", nivel:"A1", semana:1, dia:5, activa:true },
  { palabra_it:"il contratto", traduccion_es:"el contrato", ejemplo:"Devo firmare il contratto.", categoria:"casa", nivel:"A1", semana:1, dia:5, activa:true },
  // ── SEMANA 2 – Trasporti & Salute ──
  { palabra_it:"la stazione", traduccion_es:"la estación de tren", ejemplo:"La stazione è lontana?", categoria:"trasporti", nivel:"A1", semana:2, dia:1, activa:true },
  { palabra_it:"il biglietto", traduccion_es:"el billete / tiquete", ejemplo:"Un biglietto per Roma.", categoria:"trasporti", nivel:"A1", semana:2, dia:1, activa:true },
  { palabra_it:"a che ora parte?", traduccion_es:"¿a qué hora sale?", ejemplo:"A che ora parte il treno?", categoria:"trasporti", nivel:"A1", semana:2, dia:1, activa:true },
  { palabra_it:"il binario", traduccion_es:"el andén / vía", ejemplo:"Il treno parte dal binario tre.", categoria:"trasporti", nivel:"A1", semana:2, dia:1, activa:true },
  { palabra_it:"andata e ritorno", traduccion_es:"ida y vuelta", ejemplo:"Un biglietto andata e ritorno.", categoria:"trasporti", nivel:"A1", semana:2, dia:1, activa:true },
  { palabra_it:"l'autobus / la metro", traduccion_es:"el autobús / el metro", ejemplo:"Prendo l'autobus ogni giorno.", categoria:"trasporti", nivel:"A1", semana:2, dia:2, activa:true },
  { palabra_it:"ho mal di testa", traduccion_es:"me duele la cabeza", ejemplo:"Oggi ho mal di testa.", categoria:"salute", nivel:"A1", semana:2, dia:2, activa:true },
  { palabra_it:"la farmacia", traduccion_es:"la farmacia", ejemplo:"Dov'è la farmacia più vicina?", categoria:"salute", nivel:"A1", semana:2, dia:2, activa:true },
  { palabra_it:"il medico", traduccion_es:"el médico", ejemplo:"Ho bisogno di vedere un medico.", categoria:"salute", nivel:"A1", semana:2, dia:2, activa:true },
  { palabra_it:"ho la febbre", traduccion_es:"tengo fiebre", ejemplo:"Ho la febbre da ieri.", categoria:"salute", nivel:"A1", semana:2, dia:2, activa:true },
  { palabra_it:"ho bisogno di", traduccion_es:"necesito", ejemplo:"Ho bisogno di aiuto.", categoria:"domande", nivel:"A1", semana:2, dia:3, activa:true },
  { palabra_it:"gli antibiotici", traduccion_es:"los antibióticos", ejemplo:"Il medico mi ha prescritto gli antibiotici.", categoria:"salute", nivel:"A1", semana:2, dia:3, activa:true },
  { palabra_it:"mal di gola / stomaco", traduccion_es:"dolor de garganta / estómago", ejemplo:"Ho mal di gola da tre giorni.", categoria:"salute", nivel:"A1", semana:2, dia:3, activa:true },
  // ── SEMANA 3 – Lavoro & Banca ──
  { palabra_it:"il lavoro", traduccion_es:"el trabajo", ejemplo:"Cerco lavoro a Milano.", categoria:"lavoro", nivel:"A1", semana:3, dia:1, activa:true },
  { palabra_it:"il colloquio", traduccion_es:"la entrevista de trabajo", ejemplo:"Ho un colloquio domani.", categoria:"lavoro", nivel:"A1", semana:3, dia:1, activa:true },
  { palabra_it:"il curriculum", traduccion_es:"el currículum vitae", ejemplo:"Mando il curriculum via email.", categoria:"lavoro", nivel:"A1", semana:3, dia:1, activa:true },
  { palabra_it:"lo stipendio", traduccion_es:"el sueldo / salario", ejemplo:"Qual è lo stipendio mensile?", categoria:"lavoro", nivel:"A1", semana:3, dia:1, activa:true },
  { palabra_it:"l'azienda", traduccion_es:"la empresa", ejemplo:"Lavoro in un'azienda italiana.", categoria:"lavoro", nivel:"A1", semana:3, dia:2, activa:true },
  { palabra_it:"il conto corrente", traduccion_es:"la cuenta corriente", ejemplo:"Voglio aprire un conto corrente.", categoria:"banca", nivel:"A1", semana:3, dia:2, activa:true },
  { palabra_it:"il bancomat", traduccion_es:"el cajero automático", ejemplo:"Dov'è il bancomat più vicino?", categoria:"banca", nivel:"A1", semana:3, dia:2, activa:true },
  { palabra_it:"un bonifico", traduccion_es:"una transferencia bancaria", ejemplo:"Faccio un bonifico domani.", categoria:"banca", nivel:"A1", semana:3, dia:2, activa:true },
  { palabra_it:"la busta paga", traduccion_es:"la nómina", ejemplo:"Ho ricevuto la busta paga.", categoria:"lavoro", nivel:"A1", semana:3, dia:3, activa:true },
  // ── SEMANA 4 – Burocrazia ──
  { palabra_it:"il codice fiscale", traduccion_es:"el código fiscal (NIF)", ejemplo:"Ho bisogno del codice fiscale.", categoria:"burocrazia", nivel:"A1", semana:4, dia:1, activa:true },
  { palabra_it:"il permesso di soggiorno", traduccion_es:"el permiso de residencia", ejemplo:"Devo richiedere il permesso di soggiorno.", categoria:"burocrazia", nivel:"A1", semana:4, dia:1, activa:true },
  { palabra_it:"il municipio", traduccion_es:"el ayuntamiento", ejemplo:"Vado al municipio stamattina.", categoria:"burocrazia", nivel:"A1", semana:4, dia:1, activa:true },
  { palabra_it:"la carta d'identità", traduccion_es:"el carnet de identidad", ejemplo:"Ho dimenticato la carta d'identità.", categoria:"burocrazia", nivel:"A1", semana:4, dia:2, activa:true },
  { palabra_it:"il passaporto", traduccion_es:"el pasaporte", ejemplo:"Il mio passaporto è scaduto.", categoria:"burocrazia", nivel:"A1", semana:4, dia:2, activa:true },
  { palabra_it:"la residenza", traduccion_es:"la residencia (domicilio)", ejemplo:"Devo cambiare la residenza.", categoria:"burocrazia", nivel:"A1", semana:4, dia:2, activa:true },
  { palabra_it:"la spesa", traduccion_es:"la compra / los víveres", ejemplo:"Faccio la spesa ogni sabato.", categoria:"quotidiano", nivel:"A1", semana:4, dia:3, activa:true },
  { palabra_it:"il mercato", traduccion_es:"el mercado", ejemplo:"Il mercato apre alle otto.", categoria:"quotidiano", nivel:"A1", semana:4, dia:3, activa:true },
  // ── SEMANA 5 – Casa & Appartamento ──
  { palabra_it:"il padrone di casa", traduccion_es:"el propietario / casero", ejemplo:"Il padrone di casa è gentile.", categoria:"casa", nivel:"A1", semana:5, dia:1, activa:true },
  { palabra_it:"l'affitto mensile", traduccion_es:"el alquiler mensual", ejemplo:"Quanto è l'affitto mensile?", categoria:"casa", nivel:"A1", semana:5, dia:1, activa:true },
  { palabra_it:"il deposito", traduccion_es:"la fianza / depósito", ejemplo:"Il deposito è due mesi di affitto.", categoria:"casa", nivel:"A1", semana:5, dia:1, activa:true },
  { palabra_it:"il monolocale / bilocale", traduccion_es:"estudio / piso de dos ambientes", ejemplo:"Cerco un bilocale in centro.", categoria:"casa", nivel:"A1", semana:5, dia:2, activa:true },
  { palabra_it:"il riscaldamento", traduccion_es:"la calefacción", ejemplo:"Il riscaldamento è incluso?", categoria:"casa", nivel:"A1", semana:5, dia:2, activa:true },
  { palabra_it:"il condominio", traduccion_es:"el edificio de apartamentos", ejemplo:"Il condominio è molto silenzioso.", categoria:"casa", nivel:"A1", semana:5, dia:2, activa:true },
  { palabra_it:"arredato / non arredato", traduccion_es:"amueblado / sin amueblar", ejemplo:"L'appartamento è già arredato.", categoria:"casa", nivel:"A1", semana:5, dia:3, activa:true },
  { palabra_it:"il vicino di casa", traduccion_es:"el vecino", ejemplo:"Il mio vicino di casa è simpatico.", categoria:"casa", nivel:"A1", semana:5, dia:3, activa:true },
  // ── SEMANA 6 – Cucina Italiana ──
  { palabra_it:"la pasta", traduccion_es:"la pasta", ejemplo:"La pasta al dente è fondamentale.", categoria:"cucina", nivel:"A1", semana:6, dia:1, activa:true },
  { palabra_it:"il pomodoro / la cipolla", traduccion_es:"el tomate / la cebolla", ejemplo:"Taglia il pomodoro e la cipolla.", categoria:"cucina", nivel:"A1", semana:6, dia:1, activa:true },
  { palabra_it:"l'olio d'oliva", traduccion_es:"el aceite de oliva", ejemplo:"Aggiungi un filo d'olio d'oliva.", categoria:"cucina", nivel:"A1", semana:6, dia:1, activa:true },
  { palabra_it:"il sale / il pepe", traduccion_es:"la sal / la pimienta", ejemplo:"Aggiungi sale e pepe a piacere.", categoria:"cucina", nivel:"A1", semana:6, dia:2, activa:true },
  { palabra_it:"cucinare / cuocere", traduccion_es:"cocinar / cocer", ejemplo:"Devo cuocere la pasta per dieci minuti.", categoria:"cucina", nivel:"A1", semana:6, dia:2, activa:true },
  { palabra_it:"la ricetta", traduccion_es:"la receta", ejemplo:"Hai la ricetta della carbonara?", categoria:"cucina", nivel:"A1", semana:6, dia:2, activa:true },
  { palabra_it:"il forno / il frigorifero", traduccion_es:"el horno / el refrigerador", ejemplo:"Metti la pizza nel forno.", categoria:"cucina", nivel:"A1", semana:6, dia:3, activa:true },
  { palabra_it:"il formaggio / la mozzarella", traduccion_es:"el queso / la mozzarella", ejemplo:"La pizza con mozzarella fresca è ottima.", categoria:"cucina", nivel:"A1", semana:6, dia:3, activa:true },
  { palabra_it:"assaggiare / gustare", traduccion_es:"probar / saborear", ejemplo:"Assaggia questa salsa!", categoria:"cucina", nivel:"A1", semana:6, dia:3, activa:true },
  // ── SEMANA 7 – Relazioni Sociali ──
  { palabra_it:"conoscere / incontrare", traduccion_es:"conocer / encontrarse", ejemplo:"Ho incontrato un amico al bar.", categoria:"relazioni", nivel:"A1", semana:7, dia:1, activa:true },
  { palabra_it:"invitare / accettare", traduccion_es:"invitar / aceptar", ejemplo:"Ti invito a cena domani sera.", categoria:"relazioni", nivel:"A1", semana:7, dia:1, activa:true },
  { palabra_it:"rifiutare / declinare", traduccion_es:"rechazar / declinar", ejemplo:"Mi dispiace, non posso venire.", categoria:"relazioni", nivel:"A1", semana:7, dia:2, activa:true },
  { palabra_it:"mi piace / non mi piace", traduccion_es:"me gusta / no me gusta", ejemplo:"Mi piace molto la musica italiana.", categoria:"relazioni", nivel:"A1", semana:7, dia:2, activa:true },
  { palabra_it:"il compleanno / la festa", traduccion_es:"el cumpleaños / la fiesta", ejemplo:"Domani è il mio compleanno!", categoria:"relazioni", nivel:"A1", semana:7, dia:3, activa:true },
  { palabra_it:"simpatico / antipatico", traduccion_es:"simpático / antipático", ejemplo:"Il mio professore è molto simpatico.", categoria:"relazioni", nivel:"A1", semana:7, dia:3, activa:true },
  // ── SEMANA 8 – Media & Cultura ──
  { palabra_it:"il giornale / la notizia", traduccion_es:"el periódico / la noticia", ejemplo:"Leggo il giornale ogni mattina.", categoria:"media", nivel:"A1", semana:8, dia:1, activa:true },
  { palabra_it:"il film / il cinema", traduccion_es:"la película / el cine", ejemplo:"Andiamo al cinema stasera?", categoria:"media", nivel:"A1", semana:8, dia:1, activa:true },
  { palabra_it:"la musica / la canzone", traduccion_es:"la música / la canción", ejemplo:"Conosci questa canzone italiana?", categoria:"media", nivel:"A1", semana:8, dia:2, activa:true },
  { palabra_it:"guardare / ascoltare", traduccion_es:"mirar / escuchar", ejemplo:"Ascolto la radio mentre cucino.", categoria:"media", nivel:"A1", semana:8, dia:2, activa:true },
  { palabra_it:"il telefonino / lo smartphone", traduccion_es:"el móvil / el smartphone", ejemplo:"Ho lasciato il telefonino a casa.", categoria:"tecnologia", nivel:"A1", semana:8, dia:3, activa:true },
  { palabra_it:"mandare un messaggio", traduccion_es:"mandar un mensaje", ejemplo:"Ti mando un messaggio su WhatsApp.", categoria:"tecnologia", nivel:"A1", semana:8, dia:3, activa:true },
  // ── SEMANA 9 – Tempo Libero ──
  { palabra_it:"il tempo libero", traduccion_es:"el tiempo libre", ejemplo:"Nel tempo libero leggo molto.", categoria:"hobby", nivel:"A1", semana:9, dia:1, activa:true },
  { palabra_it:"lo sport / fare sport", traduccion_es:"el deporte / hacer deporte", ejemplo:"Faccio sport tre volte a settimana.", categoria:"hobby", nivel:"A1", semana:9, dia:1, activa:true },
  { palabra_it:"il calcio / il nuoto", traduccion_es:"el fútbol / la natación", ejemplo:"Il calcio è lo sport più popolare.", categoria:"hobby", nivel:"A1", semana:9, dia:2, activa:true },
  { palabra_it:"viaggiare / la vacanza", traduccion_es:"viajar / las vacaciones", ejemplo:"Quest'estate vado in vacanza in Sicilia.", categoria:"hobby", nivel:"A1", semana:9, dia:2, activa:true },
  { palabra_it:"leggere / il libro", traduccion_es:"leer / el libro", ejemplo:"Sto leggendo un romanzo italiano.", categoria:"hobby", nivel:"A1", semana:9, dia:3, activa:true },
  { palabra_it:"disegnare / dipingere", traduccion_es:"dibujar / pintar", ejemplo:"Mi piace dipingere nel fine settimana.", categoria:"hobby", nivel:"A1", semana:9, dia:3, activa:true },
  // ── SEMANA 10 – La Famiglia ──
  { palabra_it:"la famiglia", traduccion_es:"la familia", ejemplo:"La mia famiglia è molto unita.", categoria:"famiglia", nivel:"A1", semana:10, dia:1, activa:true },
  { palabra_it:"il padre / la madre", traduccion_es:"el padre / la madre", ejemplo:"Mia madre cucina molto bene.", categoria:"famiglia", nivel:"A1", semana:10, dia:1, activa:true },
  { palabra_it:"il fratello / la sorella", traduccion_es:"el hermano / la hermana", ejemplo:"Ho un fratello e due sorelle.", categoria:"famiglia", nivel:"A1", semana:10, dia:2, activa:true },
  { palabra_it:"i nonni / i nipoti", traduccion_es:"los abuelos / los nietos", ejemplo:"I miei nonni vivono in campagna.", categoria:"famiglia", nivel:"A1", semana:10, dia:2, activa:true },
  { palabra_it:"sposato / fidanzato", traduccion_es:"casado / novio", ejemplo:"Sei sposato o fidanzato?", categoria:"famiglia", nivel:"A1", semana:10, dia:3, activa:true },
  { palabra_it:"i figli / il figlio unico", traduccion_es:"los hijos / el hijo único", ejemplo:"Hanno due figli piccoli.", categoria:"famiglia", nivel:"A1", semana:10, dia:3, activa:true },
  // ── SEMANA 11 – Il Corpo & Salute Avanzata ──
  { palabra_it:"la testa / il collo", traduccion_es:"la cabeza / el cuello", ejemplo:"Mi fa male il collo.", categoria:"corpo", nivel:"A1", semana:11, dia:1, activa:true },
  { palabra_it:"il braccio / la gamba", traduccion_es:"el brazo / la pierna", ejemplo:"Mi sono fatto male alla gamba.", categoria:"corpo", nivel:"A1", semana:11, dia:1, activa:true },
  { palabra_it:"la schiena / le spalle", traduccion_es:"la espalda / los hombros", ejemplo:"Ho un forte dolore alla schiena.", categoria:"corpo", nivel:"A1", semana:11, dia:2, activa:true },
  { palabra_it:"l'allergia / sono allergico", traduccion_es:"la alergia / soy alérgico", ejemplo:"Sono allergico al lattosio.", categoria:"salute", nivel:"A1", semana:11, dia:2, activa:true },
  { palabra_it:"la ricetta medica", traduccion_es:"la receta médica", ejemplo:"Ho bisogno della ricetta medica.", categoria:"salute", nivel:"A1", semana:11, dia:3, activa:true },
  { palabra_it:"il pronto soccorso", traduccion_es:"las urgencias / emergencias", ejemplo:"Dove si trova il pronto soccorso?", categoria:"salute", nivel:"A1", semana:11, dia:3, activa:true },
  // ── SEMANA 12 – Scuola & Apprendimento ──
  { palabra_it:"la scuola / l'università", traduccion_es:"la escuela / la universidad", ejemplo:"Studio all'università di Milano.", categoria:"istruzione", nivel:"A1", semana:12, dia:1, activa:true },
  { palabra_it:"l'insegnante / il professore", traduccion_es:"el maestro / el profesor", ejemplo:"Il professore spiega molto bene.", categoria:"istruzione", nivel:"A1", semana:12, dia:1, activa:true },
  { palabra_it:"studiare / imparare", traduccion_es:"estudiar / aprender", ejemplo:"Studio l'italiano da sei mesi.", categoria:"istruzione", nivel:"A1", semana:12, dia:2, activa:true },
  { palabra_it:"l'esame / il voto", traduccion_es:"el examen / la nota", ejemplo:"Ho superato l'esame con trenta.", categoria:"istruzione", nivel:"A1", semana:12, dia:2, activa:true },
  { palabra_it:"il compito / la tesina", traduccion_es:"la tarea / el trabajo escrito", ejemplo:"Devo finire il compito per domani.", categoria:"istruzione", nivel:"A1", semana:12, dia:3, activa:true },
  // ── SEMANA 13 – Grammatica in Contesto ──
  { palabra_it:"avere / essere", traduccion_es:"tener / ser-estar", ejemplo:"Ho ventotto anni. Sono italiano.", categoria:"grammatica", nivel:"A1", semana:13, dia:1, activa:true },
  { palabra_it:"fare / andare", traduccion_es:"hacer / ir", ejemplo:"Vado al lavoro in bicicletta.", categoria:"grammatica", nivel:"A1", semana:13, dia:1, activa:true },
  { palabra_it:"potere / volere / dovere", traduccion_es:"poder / querer / deber", ejemplo:"Devo andare, ma voglio restare.", categoria:"grammatica", nivel:"A2", semana:13, dia:2, activa:true },
  { palabra_it:"sapere / conoscere", traduccion_es:"saber / conocer", ejemplo:"Conosco Roma ma non so guidare.", categoria:"grammatica", nivel:"A2", semana:13, dia:2, activa:true },
  { palabra_it:"stare + gerundio", traduccion_es:"estar + gerundio", ejemplo:"Sto mangiando la pizza.", categoria:"grammatica", nivel:"A2", semana:13, dia:3, activa:true },
  // ── SEMANA 14 – Passato Prossimo ──
  { palabra_it:"ieri / l'altro ieri", traduccion_es:"ayer / anteayer", ejemplo:"Ieri sono andato al cinema.", categoria:"tempo", nivel:"A2", semana:14, dia:1, activa:true },
  { palabra_it:"ho mangiato / ho parlato", traduccion_es:"he comido / he hablado", ejemplo:"Stamattina ho mangiato una brioche.", categoria:"grammatica", nivel:"A2", semana:14, dia:1, activa:true },
  { palabra_it:"sono andato/a / sono venuto/a", traduccion_es:"he ido / he venido", ejemplo:"Sono venuto a piedi dal centro.", categoria:"grammatica", nivel:"A2", semana:14, dia:2, activa:true },
  { palabra_it:"la settimana scorsa", traduccion_es:"la semana pasada", ejemplo:"La settimana scorsa ho visitato Venezia.", categoria:"tempo", nivel:"A2", semana:14, dia:2, activa:true },
  { palabra_it:"già / ancora / mai", traduccion_es:"ya / todavía / nunca", ejemplo:"Non sono mai stato a Napoli.", categoria:"grammatica", nivel:"A2", semana:14, dia:3, activa:true },
  // ── SEMANA 15 – Imperfetto & Futuro ──
  { palabra_it:"da bambino/a", traduccion_es:"de niño/a", ejemplo:"Da bambino adoravo il gelato.", categoria:"tempo", nivel:"A2", semana:15, dia:1, activa:true },
  { palabra_it:"abitavo / lavoravo", traduccion_es:"vivía / trabajaba (imperfecto)", ejemplo:"Prima abitavo a Roma.", categoria:"grammatica", nivel:"A2", semana:15, dia:1, activa:true },
  { palabra_it:"il futuro semplice", traduccion_es:"el futuro simple", ejemplo:"Domani andrò a Firenze.", categoria:"grammatica", nivel:"A2", semana:15, dia:2, activa:true },
  { palabra_it:"tra una settimana / un mese", traduccion_es:"dentro de una semana / un mes", ejemplo:"Tra un mese mi trasferisco a Milano.", categoria:"tempo", nivel:"A2", semana:15, dia:2, activa:true },
  { palabra_it:"se + futuro", traduccion_es:"si + futuro (condición)", ejemplo:"Se farà bello, andremo al mare.", categoria:"grammatica", nivel:"A2", semana:15, dia:3, activa:true },
  // ── SEMANA 16 – Opinioni & Preferenze ──
  { palabra_it:"secondo me / a mio parere", traduccion_es:"según yo / en mi opinión", ejemplo:"Secondo me, Roma è la città più bella.", categoria:"opinioni", nivel:"A2", semana:16, dia:1, activa:true },
  { palabra_it:"penso che + congiuntivo", traduccion_es:"pienso que + subjuntivo", ejemplo:"Penso che sia una buona idea.", categoria:"grammatica", nivel:"A2", semana:16, dia:1, activa:true },
  { palabra_it:"preferire / scegliere", traduccion_es:"preferir / elegir", ejemplo:"Preferisco il mare alla montagna.", categoria:"opinioni", nivel:"A2", semana:16, dia:2, activa:true },
  { palabra_it:"sono d'accordo / non sono d'accordo", traduccion_es:"estoy de acuerdo / no estoy de acuerdo", ejemplo:"Non sono d'accordo con te.", categoria:"opinioni", nivel:"A2", semana:16, dia:2, activa:true },
  { palabra_it:"dipende da / comunque", traduccion_es:"depende de / sin embargo", ejemplo:"Dipende dalla situazione, comunque.", categoria:"connettivi", nivel:"A2", semana:16, dia:3, activa:true },
  // ── SEMANA 17 – Il Lavoro Avanzato ──
  { palabra_it:"il contratto a tempo indeterminato", traduccion_es:"el contrato indefinido", ejemplo:"Finalmente ho un contratto a tempo indeterminato!", categoria:"lavoro", nivel:"A2", semana:17, dia:1, activa:true },
  { palabra_it:"le ferie / i giorni di riposo", traduccion_es:"las vacaciones pagadas", ejemplo:"Ho due settimane di ferie l'anno.", categoria:"lavoro", nivel:"A2", semana:17, dia:1, activa:true },
  { palabra_it:"fare gli straordinari", traduccion_es:"hacer horas extra", ejemplo:"Questa settimana devo fare straordinari.", categoria:"lavoro", nivel:"A2", semana:17, dia:2, activa:true },
  { palabra_it:"il collega / la collega", traduccion_es:"el/la colega de trabajo", ejemplo:"La mia collega è molto competente.", categoria:"lavoro", nivel:"A2", semana:17, dia:2, activa:true },
  { palabra_it:"licenziarsi / essere licenziato", traduccion_es:"renunciar / ser despedido", ejemplo:"Si è licenziato per trovare lavoro migliore.", categoria:"lavoro", nivel:"A2", semana:17, dia:3, activa:true },
  // ── SEMANA 18 – La Città & Servizi ──
  { palabra_it:"il centro storico", traduccion_es:"el centro histórico", ejemplo:"Il centro storico di Siena è splendido.", categoria:"citta", nivel:"A2", semana:18, dia:1, activa:true },
  { palabra_it:"la banca / lo sportello", traduccion_es:"el banco / la ventanilla", ejemplo:"Devo andare allo sportello della banca.", categoria:"servizi", nivel:"A2", semana:18, dia:1, activa:true },
  { palabra_it:"l'ufficio postale", traduccion_es:"la oficina de correos", ejemplo:"Devo spedire un pacco all'ufficio postale.", categoria:"servizi", nivel:"A2", semana:18, dia:2, activa:true },
  { palabra_it:"la questura / il commissariato", traduccion_es:"la jefatura de policía", ejemplo:"Devo andare in questura per il permesso.", categoria:"burocrazia", nivel:"A2", semana:18, dia:2, activa:true },
  { palabra_it:"il semaforo / la rotonda", traduccion_es:"el semáforo / la rotonda", ejemplo:"Gira alla rotonda e poi a sinistra.", categoria:"citta", nivel:"A2", semana:18, dia:3, activa:true },
  // ── SEMANA 19 – Emozioni & Psicologia ──
  { palabra_it:"essere felice / triste", traduccion_es:"ser/estar feliz / triste", ejemplo:"Sono molto felice di vivere in Italia.", categoria:"emozioni", nivel:"A2", semana:19, dia:1, activa:true },
  { palabra_it:"avere paura di", traduccion_es:"tener miedo de", ejemplo:"Ho paura di parlare in pubblico.", categoria:"emozioni", nivel:"A2", semana:19, dia:1, activa:true },
  { palabra_it:"annoiarsi / divertirsi", traduccion_es:"aburrirse / divertirse", ejemplo:"Mi diverto molto a cucinare.", categoria:"emozioni", nivel:"A2", semana:19, dia:2, activa:true },
  { palabra_it:"preoccuparsi / rilassarsi", traduccion_es:"preocuparse / relajarse", ejemplo:"Non preoccuparti, va tutto bene.", categoria:"emozioni", nivel:"A2", semana:19, dia:2, activa:true },
  { palabra_it:"emozionante / commovente", traduccion_es:"emocionante / conmovedor", ejemplo:"Il film era molto commovente.", categoria:"emozioni", nivel:"A2", semana:19, dia:3, activa:true },
  // ── SEMANA 20 – Il Condizionale ──
  { palabra_it:"vorrei / potrei / dovrei", traduccion_es:"quisiera / podría / debería", ejemplo:"Vorrei un caffè, per favore.", categoria:"grammatica", nivel:"A2", semana:20, dia:1, activa:true },
  { palabra_it:"al posto tuo / al mio posto", traduccion_es:"en tu lugar / en mi lugar", ejemplo:"Al posto tuo, parlerei con lui.", categoria:"grammatica", nivel:"A2", semana:20, dia:1, activa:true },
  { palabra_it:"sarebbe bello / meglio", traduccion_es:"sería bonito / mejor", ejemplo:"Sarebbe bello vivere al mare.", categoria:"grammatica", nivel:"A2", semana:20, dia:2, activa:true },
  { palabra_it:"mi piacerebbe", traduccion_es:"me gustaría", ejemplo:"Mi piacerebbe imparare a suonare.", categoria:"grammatica", nivel:"A2", semana:20, dia:2, activa:true },
  // ── SEMANA 21 – Connettivi & Argomentazione ──
  { palabra_it:"inoltre / tuttavia", traduccion_es:"además / sin embargo", ejemplo:"È caro, tuttavia è di ottima qualità.", categoria:"connettivi", nivel:"A2", semana:21, dia:1, activa:true },
  { palabra_it:"nonostante / benché", traduccion_es:"a pesar de / aunque", ejemplo:"Nonostante la pioggia, siamo usciti.", categoria:"connettivi", nivel:"A2", semana:21, dia:1, activa:true },
  { palabra_it:"quindi / perciò / dunque", traduccion_es:"entonces / por tanto / así que", ejemplo:"È tardi, quindi devo andare.", categoria:"connettivi", nivel:"A2", semana:21, dia:2, activa:true },
  { palabra_it:"dal momento che / poiché", traduccion_es:"dado que / puesto que", ejemplo:"Poiché piove, resto a casa.", categoria:"connettivi", nivel:"A2", semana:21, dia:2, activa:true },
  { palabra_it:"in conclusione / in breve", traduccion_es:"en conclusión / en resumen", ejemplo:"In conclusione, è stata una buona scelta.", categoria:"connettivi", nivel:"A2", semana:21, dia:3, activa:true },
  // ── SEMANA 22 – Natura & Ambiente ──
  { palabra_it:"il mare / la montagna", traduccion_es:"el mar / la montaña", ejemplo:"Preferisco il mare alla montagna.", categoria:"natura", nivel:"A2", semana:22, dia:1, activa:true },
  { palabra_it:"il lago / il fiume", traduccion_es:"el lago / el río", ejemplo:"Il lago di Como è meraviglioso.", categoria:"natura", nivel:"A2", semana:22, dia:1, activa:true },
  { palabra_it:"il tempo / il clima", traduccion_es:"el tiempo / el clima", ejemplo:"Il clima italiano è molto piacevole.", categoria:"natura", nivel:"A2", semana:22, dia:2, activa:true },
  { palabra_it:"fa caldo / fa freddo", traduccion_es:"hace calor / hace frío", ejemplo:"D'estate fa molto caldo al Sud.", categoria:"natura", nivel:"A2", semana:22, dia:2, activa:true },
  { palabra_it:"piovere / nevicare", traduccion_es:"llover / nevar", ejemplo:"In inverno qui nevica spesso.", categoria:"natura", nivel:"A2", semana:22, dia:3, activa:true },
  // ── SEMANA 23 – Immersione: Input Nativo ──
  { palabra_it:"sfogliare / scorrer", traduccion_es:"hojear / deslizar", ejemplo:"Ho sfogliato il giornale di stamattina.", categoria:"lessico_avanzato", nivel:"B1", semana:23, dia:1, activa:true },
  { palabra_it:"cogliere l'occasione", traduccion_es:"aprovechar la oportunidad", ejemplo:"Ho colto l'occasione per parlare con lui.", categoria:"espressioni", nivel:"B1", semana:23, dia:1, activa:true },
  { palabra_it:"rendersi conto", traduccion_es:"darse cuenta", ejemplo:"Mi sono resa conto del mio errore.", categoria:"espressioni", nivel:"B1", semana:23, dia:2, activa:true },
  { palabra_it:"tenersi aggiornato", traduccion_es:"mantenerse al día", ejemplo:"Mi tengo aggiornato leggendo le notizie.", categoria:"espressioni", nivel:"B1", semana:23, dia:2, activa:true },
  { palabra_it:"a proposito di", traduccion_es:"a propósito de / hablando de", ejemplo:"A proposito di cinema, hai visto quel film?", categoria:"connettivi", nivel:"B1", semana:23, dia:3, activa:true },
  // ── SEMANA 24 – Vita Professionale B1 ──
  { palabra_it:"il settore / il campo", traduccion_es:"el sector / el campo", ejemplo:"Lavoro nel settore informatico.", categoria:"lavoro", nivel:"B1", semana:24, dia:1, activa:true },
  { palabra_it:"candidarsi / fare domanda", traduccion_es:"postularse / hacer una solicitud", ejemplo:"Mi sono candidato per quel posto.", categoria:"lavoro", nivel:"B1", semana:24, dia:1, activa:true },
  { palabra_it:"il referente / il responsabile", traduccion_es:"el referente / el responsable", ejemplo:"Il mio referente è molto disponibile.", categoria:"lavoro", nivel:"B1", semana:24, dia:2, activa:true },
  { palabra_it:"le competenze / le skills", traduccion_es:"las competencias / habilidades", ejemplo:"Ho competenze in marketing digitale.", categoria:"lavoro", nivel:"B1", semana:24, dia:2, activa:true },
  { palabra_it:"il contratto di apprendistato", traduccion_es:"el contrato de aprendizaje", ejemplo:"Ho firmato un contratto di apprendistato.", categoria:"lavoro", nivel:"B1", semana:24, dia:3, activa:true },
  // ── SEMANA 25 – Cultura & Arte ──
  { palabra_it:"il patrimonio culturale", traduccion_es:"el patrimonio cultural", ejemplo:"L'Italia ha un enorme patrimonio culturale.", categoria:"cultura", nivel:"B1", semana:25, dia:1, activa:true },
  { palabra_it:"il Rinascimento", traduccion_es:"el Renacimiento", ejemplo:"Il Rinascimento italiano è unico al mondo.", categoria:"cultura", nivel:"B1", semana:25, dia:1, activa:true },
  { palabra_it:"la mostra / l'esposizione", traduccion_es:"la exposición / la muestra", ejemplo:"C'è una bella mostra agli Uffizi.", categoria:"cultura", nivel:"B1", semana:25, dia:2, activa:true },
  { palabra_it:"il capolavoro", traduccion_es:"la obra maestra", ejemplo:"La Divina Commedia è un capolavoro.", categoria:"cultura", nivel:"B1", semana:25, dia:2, activa:true },
  { palabra_it:"il dipinto / la scultura", traduccion_es:"la pintura / la escultura", ejemplo:"Il dipinto di Botticelli è stupendo.", categoria:"cultura", nivel:"B1", semana:25, dia:3, activa:true },
  // ── SEMANA 26 – Economia & Attualità ──
  { palabra_it:"l'economia / la crisi", traduccion_es:"la economía / la crisis", ejemplo:"L'economia italiana sta crescendo.", categoria:"attualita", nivel:"B1", semana:26, dia:1, activa:true },
  { palabra_it:"il governo / il parlamento", traduccion_es:"el gobierno / el parlamento", ejemplo:"Il governo ha approvato la nuova legge.", categoria:"attualita", nivel:"B1", semana:26, dia:1, activa:true },
  { palabra_it:"le elezioni / votare", traduccion_es:"las elecciones / votar", ejemplo:"Le elezioni si tengono a giugno.", categoria:"attualita", nivel:"B1", semana:26, dia:2, activa:true },
  { palabra_it:"la disoccupazione", traduccion_es:"el desempleo", ejemplo:"La disoccupazione giovanile è alta.", categoria:"attualita", nivel:"B1", semana:26, dia:2, activa:true },
  { palabra_it:"il cambiamento climatico", traduccion_es:"el cambio climático", ejemplo:"Il cambiamento climatico è una sfida globale.", categoria:"attualita", nivel:"B1", semana:26, dia:3, activa:true },
  // ── SEMANA 27 – Salute & Benessere B1 ──
  { palabra_it:"lo stile di vita / il benessere", traduccion_es:"el estilo de vida / el bienestar", ejemplo:"Uno stile di vita sano è fondamentale.", categoria:"salute", nivel:"B1", semana:27, dia:1, activa:true },
  { palabra_it:"l'alimentazione equilibrata", traduccion_es:"la alimentación equilibrada", ejemplo:"Un'alimentazione equilibrata aiuta la salute.", categoria:"salute", nivel:"B1", semana:27, dia:1, activa:true },
  { palabra_it:"la diagnosi / la terapia", traduccion_es:"el diagnóstico / la terapia", ejemplo:"Il medico ha fatto la diagnosi corretta.", categoria:"salute", nivel:"B1", semana:27, dia:2, activa:true },
  { palabra_it:"il medico specialista", traduccion_es:"el médico especialista", ejemplo:"Ho un appuntamento dallo specialista.", categoria:"salute", nivel:"B1", semana:27, dia:2, activa:true },
  { palabra_it:"fare prevenzione", traduccion_es:"hacer prevención", ejemplo:"È importante fare prevenzione ogni anno.", categoria:"salute", nivel:"B1", semana:27, dia:3, activa:true },
  // ── SEMANA 28 – Tecnologia & Digitalizzazione ──
  { palabra_it:"intelligenza artificiale", traduccion_es:"inteligencia artificial", ejemplo:"L'intelligenza artificiale cambia il mondo.", categoria:"tecnologia", nivel:"B1", semana:28, dia:1, activa:true },
  { palabra_it:"il cloud / l'archiviazione", traduccion_es:"la nube / el almacenamiento", ejemplo:"Salvo tutto nel cloud per sicurezza.", categoria:"tecnologia", nivel:"B1", semana:28, dia:1, activa:true },
  { palabra_it:"il software / l'app", traduccion_es:"el software / la app", ejemplo:"Uso un'app per imparare l'italiano.", categoria:"tecnologia", nivel:"B1", semana:28, dia:2, activa:true },
  { palabra_it:"la privacy / i dati personali", traduccion_es:"la privacidad / los datos personales", ejemplo:"La privacy è un diritto fondamentale.", categoria:"tecnologia", nivel:"B1", semana:28, dia:2, activa:true },
  // ── SEMANA 29 – Espressioni Idiomatiche ──
  { palabra_it:"in bocca al lupo!", traduccion_es:"¡buena suerte! (lit: en la boca del lobo)", ejemplo:"In bocca al lupo per l'esame! — Crepi!", categoria:"espressioni", nivel:"B1", semana:29, dia:1, activa:true },
  { palabra_it:"non vedo l'ora", traduccion_es:"no puedo esperar / estoy ansioso por", ejemplo:"Non vedo l'ora di andare in vacanza!", categoria:"espressioni", nivel:"B1", semana:29, dia:1, activa:true },
  { palabra_it:"fare bella figura", traduccion_es:"hacer buena impresión", ejemplo:"Vuole sempre fare bella figura.", categoria:"espressioni", nivel:"B1", semana:29, dia:2, activa:true },
  { palabra_it:"prendere in giro", traduccion_es:"tomar el pelo / burlarse", ejemplo:"Mi stai prendendo in giro?", categoria:"espressioni", nivel:"B1", semana:29, dia:2, activa:true },
  { palabra_it:"cavarsela / farcela", traduccion_es:"arreglárselas / lograrlo", ejemplo:"Ce la faccio sempre a trovare soluzione.", categoria:"espressioni", nivel:"B1", semana:29, dia:3, activa:true },
  { palabra_it:"mettere a fuoco / chiarire", traduccion_es:"enfocar / aclarar", ejemplo:"Dobbiamo mettere a fuoco il problema.", categoria:"espressioni", nivel:"B1", semana:29, dia:3, activa:true },
  // ── SEMANA 30 – Fluenza & Output ──
  { palabra_it:"essere in grado di", traduccion_es:"ser capaz de", ejemplo:"Sono in grado di comunicare in italiano.", categoria:"lessico_avanzato", nivel:"B1", semana:30, dia:1, activa:true },
  { palabra_it:"mettere in pratica", traduccion_es:"poner en práctica", ejemplo:"Devo mettere in pratica ciò che ho imparato.", categoria:"lessico_avanzato", nivel:"B1", semana:30, dia:1, activa:true },
  { palabra_it:"fare progressi", traduccion_es:"hacer progresos / avanzar", ejemplo:"Ho fatto grandi progressi quest'anno!", categoria:"lessico_avanzato", nivel:"B1", semana:30, dia:2, activa:true },
  { palabra_it:"esprimersi chiaramente", traduccion_es:"expresarse claramente", ejemplo:"Riesco ad esprimermi in italiano.", categoria:"lessico_avanzato", nivel:"B1", semana:30, dia:2, activa:true },
  { palabra_it:"sentirsi a proprio agio", traduccion_es:"sentirse cómodo / a gusto", ejemplo:"Mi sento a mio agio quando parlo italiano.", categoria:"espressioni", nivel:"B1", semana:30, dia:3, activa:true },
  { palabra_it:"parlare correntemente", traduccion_es:"hablar con fluidez", ejemplo:"Tra sei mesi parlerò correntemente!", categoria:"lessico_avanzato", nivel:"B1", semana:30, dia:3, activa:true },

  // ════════════════════════════════════════════════════════════════
  // EXPANSIÓN +400 PALABRAS — Ley de Zipf A0→B1 completo
  // ════════════════════════════════════════════════════════════════

  // ── S1 extra – Fondamenta ──
  { palabra_it:"buonanotte", traduccion_es:"buenas noches (despedida)", ejemplo:"Buonanotte, a domani!", categoria:"saluti", nivel:"A0", semana:1, dia:1, activa:true },
  { palabra_it:"per favore", traduccion_es:"por favor", ejemplo:"Un caffè, per favore.", categoria:"saluti", nivel:"A0", semana:1, dia:1, activa:true },
  { palabra_it:"sì / no", traduccion_es:"sí / no", ejemplo:"Sì, grazie! No, grazie.", categoria:"saluti", nivel:"A0", semana:1, dia:1, activa:true },
  { palabra_it:"bene / male", traduccion_es:"bien / mal", ejemplo:"Sto bene, grazie!", categoria:"saluti", nivel:"A0", semana:1, dia:1, activa:true },
  { palabra_it:"settanta / ottanta / novanta", traduccion_es:"setenta / ochenta / noventa", ejemplo:"Costa settanta euro.", categoria:"numeri", nivel:"A0", semana:1, dia:2, activa:true },
  { palabra_it:"mille / un milione", traduccion_es:"mil / un millón", ejemplo:"Guadagno mille euro al mese.", categoria:"numeri", nivel:"A0", semana:1, dia:2, activa:true },
  { palabra_it:"primo / secondo / terzo", traduccion_es:"primero / segundo / tercero", ejemplo:"Abito al terzo piano.", categoria:"numeri", nivel:"A0", semana:1, dia:2, activa:true },
  { palabra_it:"la piazza / la via", traduccion_es:"la plaza / la calle", ejemplo:"Ci vediamo in piazza.", categoria:"orientamento", nivel:"A0", semana:1, dia:3, activa:true },
  { palabra_it:"l'angolo / il semaforo", traduccion_es:"la esquina / el semáforo", ejemplo:"Gira all'angolo a sinistra.", categoria:"orientamento", nivel:"A0", semana:1, dia:3, activa:true },
  { palabra_it:"il primo piatto / il secondo", traduccion_es:"el primer plato / el segundo", ejemplo:"Come primo voglio la pasta.", categoria:"ristorante", nivel:"A0", semana:1, dia:4, activa:true },
  { palabra_it:"l'acqua naturale / frizzante", traduccion_es:"agua sin gas / con gas", ejemplo:"Acqua naturale, per favore.", categoria:"ristorante", nivel:"A0", semana:1, dia:4, activa:true },
  { palabra_it:"il vino / la birra", traduccion_es:"el vino / la cerveza", ejemplo:"Un bicchiere di vino rosso.", categoria:"ristorante", nivel:"A0", semana:1, dia:4, activa:true },
  { palabra_it:"il bagno / la camera", traduccion_es:"el baño / la habitación", ejemplo:"Il bagno è in fondo al corridoio.", categoria:"casa", nivel:"A1", semana:1, dia:5, activa:true },
  { palabra_it:"il piano / l'ascensore", traduccion_es:"el piso / el ascensor", ejemplo:"Abito al quarto piano senza ascensore.", categoria:"casa", nivel:"A1", semana:1, dia:5, activa:true },

  // ── S2 extra – Trasporti & Salute ──
  { palabra_it:"il taxi / la fermata", traduccion_es:"el taxi / la parada", ejemplo:"Dov'è la fermata dell'autobus?", categoria:"trasporti", nivel:"A1", semana:2, dia:1, activa:true },
  { palabra_it:"ritardo / in orario", traduccion_es:"retraso / puntual", ejemplo:"Il treno è in ritardo di dieci minuti.", categoria:"trasporti", nivel:"A1", semana:2, dia:1, activa:true },
  { palabra_it:"la corsia / il marciapiede", traduccion_es:"el carril / la acera", ejemplo:"Cammina sul marciapiede.", categoria:"trasporti", nivel:"A1", semana:2, dia:2, activa:true },
  { palabra_it:"la ricetta / la pasticca", traduccion_es:"la receta / la pastilla", ejemplo:"Ho bisogno della ricetta per questo farmaco.", categoria:"salute", nivel:"A1", semana:2, dia:2, activa:true },
  { palabra_it:"il dolore / fa male", traduccion_es:"el dolor / duele", ejemplo:"Mi fa male qui, sul fianco.", categoria:"salute", nivel:"A1", semana:2, dia:3, activa:true },
  { palabra_it:"prendere appuntamento", traduccion_es:"pedir cita / sacar turno", ejemplo:"Devo prendere appuntamento dal medico.", categoria:"salute", nivel:"A1", semana:2, dia:3, activa:true },

  // ── S3 extra – Lavoro & Banca ──
  { palabra_it:"part-time / full-time", traduccion_es:"media jornada / jornada completa", ejemplo:"Cerco un lavoro part-time.", categoria:"lavoro", nivel:"A1", semana:3, dia:1, activa:true },
  { palabra_it:"il capo / il direttore", traduccion_es:"el jefe / el director", ejemplo:"Il mio capo è molto esigente.", categoria:"lavoro", nivel:"A1", semana:3, dia:1, activa:true },
  { palabra_it:"assumere / licenziare", traduccion_es:"contratar / despedir", ejemplo:"L'azienda ha assunto dieci nuovi dipendenti.", categoria:"lavoro", nivel:"A1", semana:3, dia:2, activa:true },
  { palabra_it:"prelevare / versare", traduccion_es:"sacar dinero / depositar", ejemplo:"Devo prelevare cento euro al bancomat.", categoria:"banca", nivel:"A1", semana:3, dia:2, activa:true },
  { palabra_it:"il tasso d'interesse", traduccion_es:"la tasa de interés", ejemplo:"Qual è il tasso d'interesse del conto?", categoria:"banca", nivel:"A1", semana:3, dia:3, activa:true },
  { palabra_it:"la carta di credito", traduccion_es:"la tarjeta de crédito", ejemplo:"Posso pagare con la carta di credito?", categoria:"banca", nivel:"A1", semana:3, dia:3, activa:true },

  // ── S4 extra – Burocrazia ──
  { palabra_it:"compilare un modulo", traduccion_es:"rellenar un formulario", ejemplo:"Devo compilare questo modulo.", categoria:"burocrazia", nivel:"A1", semana:4, dia:1, activa:true },
  { palabra_it:"la firma / firmare", traduccion_es:"la firma / firmar", ejemplo:"Firmi qui, per favore.", categoria:"burocrazia", nivel:"A1", semana:4, dia:1, activa:true },
  { palabra_it:"la scadenza", traduccion_es:"la fecha de vencimiento", ejemplo:"Il passaporto è scaduto.", categoria:"burocrazia", nivel:"A1", semana:4, dia:2, activa:true },
  { palabra_it:"il supermercato / la cassa", traduccion_es:"el supermercado / la caja", ejemplo:"Faccio la fila alla cassa.", categoria:"quotidiano", nivel:"A1", semana:4, dia:3, activa:true },
  { palabra_it:"lo scontrino / la ricevuta", traduccion_es:"el ticket / el recibo", ejemplo:"Mi può dare lo scontrino?", categoria:"quotidiano", nivel:"A1", semana:4, dia:3, activa:true },

  // ── S5 extra – Casa avanzata ──
  { palabra_it:"il terrazzo / il balcone", traduccion_es:"la terraza / el balcón", ejemplo:"L'appartamento ha un bel balcone.", categoria:"casa", nivel:"A1", semana:5, dia:1, activa:true },
  { palabra_it:"la bolletta / l'utenza", traduccion_es:"la factura / el suministro", ejemplo:"La bolletta della luce è alta.", categoria:"casa", nivel:"A1", semana:5, dia:2, activa:true },
  { palabra_it:"il guasto / il tecnico", traduccion_es:"la avería / el técnico", ejemplo:"C'è un guasto al riscaldamento.", categoria:"casa", nivel:"A1", semana:5, dia:2, activa:true },
  { palabra_it:"traslocare / il trasloco", traduccion_es:"mudarse / la mudanza", ejemplo:"Il mese prossimo mi trasferisco.", categoria:"casa", nivel:"A1", semana:5, dia:3, activa:true },

  // ── S6 extra – Cucina ──
  { palabra_it:"la verdura / la frutta", traduccion_es:"la verdura / la fruta", ejemplo:"Mangio molta verdura ogni giorno.", categoria:"cucina", nivel:"A1", semana:6, dia:1, activa:true },
  { palabra_it:"la carne / il pesce", traduccion_es:"la carne / el pescado", ejemplo:"Preferisco il pesce alla carne.", categoria:"cucina", nivel:"A1", semana:6, dia:1, activa:true },
  { palabra_it:"il pane / i grissini", traduccion_es:"el pan / los palitos de pan", ejemplo:"Il pane fresco è buonissimo.", categoria:"cucina", nivel:"A1", semana:6, dia:2, activa:true },
  { palabra_it:"bollire / friggere / saltare", traduccion_es:"hervir / freír / saltear", ejemplo:"Fai friggere la cipolla nell'olio.", categoria:"cucina", nivel:"A1", semana:6, dia:2, activa:true },
  { palabra_it:"il dolce / il gelato", traduccion_es:"el postre / el helado", ejemplo:"Per dolce prendo un gelato al cioccolato.", categoria:"cucina", nivel:"A1", semana:6, dia:3, activa:true },
  { palabra_it:"le uova / il burro", traduccion_es:"los huevos / la mantequilla", ejemplo:"Per la carbonara servono uova fresche.", categoria:"cucina", nivel:"A1", semana:6, dia:3, activa:true },

  // ── S7 extra – Relazioni ──
  { palabra_it:"il fidanzato / la fidanzata", traduccion_es:"el novio / la novia", ejemplo:"Ti presento la mia fidanzata.", categoria:"relazioni", nivel:"A1", semana:7, dia:1, activa:true },
  { palabra_it:"l'amico / il collega", traduccion_es:"el amigo / el compañero", ejemplo:"Il mio migliore amico si chiama Luigi.", categoria:"relazioni", nivel:"A1", semana:7, dia:1, activa:true },
  { palabra_it:"litigare / fare pace", traduccion_es:"pelear / hacer las paces", ejemplo:"Abbiamo litigato ma poi abbiamo fatto pace.", categoria:"relazioni", nivel:"A1", semana:7, dia:2, activa:true },
  { palabra_it:"confidarsi / fidarsi", traduccion_es:"contarse algo / confiar", ejemplo:"Mi fido molto di te.", categoria:"relazioni", nivel:"A1", semana:7, dia:3, activa:true },

  // ── S8 extra – Media ──
  { palabra_it:"il telegiornale / la notizia", traduccion_es:"el telediario / la noticia", ejemplo:"Guardo il telegiornale ogni sera.", categoria:"media", nivel:"A1", semana:8, dia:1, activa:true },
  { palabra_it:"il podcast / il documentario", traduccion_es:"el podcast / el documental", ejemplo:"Ascolto un podcast italiano ogni mattina.", categoria:"media", nivel:"A1", semana:8, dia:2, activa:true },
  { palabra_it:"la serie / il episodio", traduccion_es:"la serie / el episodio", ejemplo:"Sto guardando una serie italiana bellissima.", categoria:"media", nivel:"A1", semana:8, dia:2, activa:true },
  { palabra_it:"seguire / iscriversi", traduccion_es:"seguir / suscribirse", ejemplo:"Mi sono iscritto al suo canale YouTube.", categoria:"tecnologia", nivel:"A1", semana:8, dia:3, activa:true },

  // ── S9 extra – Tempo Libero ──
  { palabra_it:"la palestra / allenarsi", traduccion_es:"el gimnasio / entrenarse", ejemplo:"Vado in palestra tre volte a settimana.", categoria:"hobby", nivel:"A1", semana:9, dia:1, activa:true },
  { palabra_it:"la bicicletta / pedalare", traduccion_es:"la bicicleta / pedalear", ejemplo:"Vado al lavoro in bicicletta.", categoria:"hobby", nivel:"A1", semana:9, dia:1, activa:true },
  { palabra_it:"il museo / la galleria", traduccion_es:"el museo / la galería", ejemplo:"Ho visitato gli Uffizi ieri.", categoria:"cultura", nivel:"A1", semana:9, dia:2, activa:true },
  { palabra_it:"la passeggiata / camminare", traduccion_es:"el paseo / caminar", ejemplo:"Facciamo una passeggiata sul lungotevere.", categoria:"hobby", nivel:"A1", semana:9, dia:2, activa:true },
  { palabra_it:"la cucina / cucinare", traduccion_es:"cocinar (como hobby)", ejemplo:"Cucinare mi rilassa molto.", categoria:"hobby", nivel:"A1", semana:9, dia:3, activa:true },
  { palabra_it:"la fotografia / scattare", traduccion_es:"la fotografía / tomar fotos", ejemplo:"Mi piace scattare foto in città.", categoria:"hobby", nivel:"A1", semana:9, dia:3, activa:true },

  // ── S10 extra – Famiglia ──
  { palabra_it:"lo zio / la zia", traduccion_es:"el tío / la tía", ejemplo:"Mio zio vive a Napoli.", categoria:"famiglia", nivel:"A1", semana:10, dia:1, activa:true },
  { palabra_it:"il cugino / la cugina", traduccion_es:"el primo / la prima", ejemplo:"Ho tre cugini in Sicilia.", categoria:"famiglia", nivel:"A1", semana:10, dia:1, activa:true },
  { palabra_it:"il genero / la nuora", traduccion_es:"el yerno / la nuera", ejemplo:"Il genero di mia madre è simpaticissimo.", categoria:"famiglia", nivel:"A1", semana:10, dia:2, activa:true },
  { palabra_it:"crescere / educare", traduccion_es:"crecer / educar", ejemplo:"Ho cresciuto in una famiglia numerosa.", categoria:"famiglia", nivel:"A1", semana:10, dia:2, activa:true },
  { palabra_it:"il matrimonio / sposarsi", traduccion_es:"el matrimonio / casarse", ejemplo:"Il loro matrimonio è stato bellissimo.", categoria:"famiglia", nivel:"A1", semana:10, dia:3, activa:true },

  // ── S11 extra – Corpo & Salute ──
  { palabra_it:"il ginocchio / il piede", traduccion_es:"la rodilla / el pie", ejemplo:"Ho il ginocchio gonfio.", categoria:"corpo", nivel:"A1", semana:11, dia:1, activa:true },
  { palabra_it:"gli occhi / le orecchie", traduccion_es:"los ojos / los oídos", ejemplo:"Ho mal d'orecchi da ieri.", categoria:"corpo", nivel:"A1", semana:11, dia:1, activa:true },
  { palabra_it:"la pressione / il polso", traduccion_es:"la presión / el pulso", ejemplo:"Il medico mi misura la pressione.", categoria:"salute", nivel:"A1", semana:11, dia:2, activa:true },
  { palabra_it:"svenire / stare male", traduccion_es:"desmayarse / sentirse mal", ejemplo:"All'improvviso mi sono sentito male.", categoria:"salute", nivel:"A1", semana:11, dia:2, activa:true },
  { palabra_it:"la dieta / a digiuno", traduccion_es:"la dieta / en ayunas", ejemplo:"Devo fare l'analisi del sangue a digiuno.", categoria:"salute", nivel:"A1", semana:11, dia:3, activa:true },

  // ── S12 extra – Istruzione ──
  { palabra_it:"la laurea / laurearsi", traduccion_es:"la licenciatura / licenciarse", ejemplo:"Mi sono laureato in economia.", categoria:"istruzione", nivel:"A1", semana:12, dia:1, activa:true },
  { palabra_it:"il diploma / diplomarsi", traduccion_es:"el diploma / graduarse", ejemplo:"Ho il diploma di liceo classico.", categoria:"istruzione", nivel:"A1", semana:12, dia:1, activa:true },
  { palabra_it:"la borsa di studio", traduccion_es:"la beca", ejemplo:"Ho vinto una borsa di studio Erasmus.", categoria:"istruzione", nivel:"A1", semana:12, dia:2, activa:true },
  { palabra_it:"il tirocinio / lo stage", traduccion_es:"las prácticas profesionales", ejemplo:"Sto facendo uno stage in un'azienda.", categoria:"istruzione", nivel:"A1", semana:12, dia:2, activa:true },
  { palabra_it:"la materia / il programma", traduccion_es:"la asignatura / el programa", ejemplo:"La mia materia preferita è la storia.", categoria:"istruzione", nivel:"A1", semana:12, dia:3, activa:true },

  // ── S13 extra – Grammatica ──
  { palabra_it:"il soggetto / il verbo", traduccion_es:"el sujeto / el verbo", ejemplo:"In italiano il soggetto può essere omesso.", categoria:"grammatica", nivel:"A2", semana:13, dia:1, activa:true },
  { palabra_it:"l'aggettivo / l'avverbio", traduccion_es:"el adjetivo / el adverbio", ejemplo:"Gli avverbi in italiano spesso finiscono in -mente.", categoria:"grammatica", nivel:"A2", semana:13, dia:2, activa:true },
  { palabra_it:"il singolare / il plurale", traduccion_es:"el singular / el plural", ejemplo:"Il plurale di 'libro' è 'libri'.", categoria:"grammatica", nivel:"A2", semana:13, dia:2, activa:true },
  { palabra_it:"maschile / femminile", traduccion_es:"masculino / femenino", ejemplo:"'La mano' è femminile nonostante finisca in -o.", categoria:"grammatica", nivel:"A2", semana:13, dia:3, activa:true },

  // ── S14 extra – Passato ──
  { palabra_it:"l'imperfetto / il passato remoto", traduccion_es:"el imperfecto / el pretérito indefinido", ejemplo:"Dante scrisse la Divina Commedia nel '300.", categoria:"grammatica", nivel:"A2", semana:14, dia:1, activa:true },
  { palabra_it:"appena / quando / mentre", traduccion_es:"apenas / cuando / mientras", ejemplo:"Appena arrivo ti chiamo.", categoria:"grammatica", nivel:"A2", semana:14, dia:2, activa:true },
  { palabra_it:"prima di / dopo di", traduccion_es:"antes de / después de", ejemplo:"Prima di dormire leggo sempre.", categoria:"grammatica", nivel:"A2", semana:14, dia:3, activa:true },

  // ── S15 extra – Futuro & Condizionale ──
  { palabra_it:"forse / probabilmente", traduccion_es:"quizás / probablemente", ejemplo:"Forse verrò alla festa stasera.", categoria:"grammatica", nivel:"A2", semana:15, dia:1, activa:true },
  { palabra_it:"sicuramente / certamente", traduccion_es:"seguramente / ciertamente", ejemplo:"Sicuramente sarà una bella serata.", categoria:"grammatica", nivel:"A2", semana:15, dia:2, activa:true },
  { palabra_it:"entro / tra poco / presto", traduccion_es:"antes de / en poco / pronto", ejemplo:"Entro un'ora arrivo.", categoria:"tempo", nivel:"A2", semana:15, dia:3, activa:true },

  // ── S16 extra – Opinioni ──
  { palabra_it:"avere ragione / torto", traduccion_es:"tener razón / estar equivocado", ejemplo:"Hai ragione, mi dispiace.", categoria:"opinioni", nivel:"A2", semana:16, dia:1, activa:true },
  { palabra_it:"mi sembra / mi pare", traduccion_es:"me parece / me da la impresión", ejemplo:"Mi sembra una buona idea.", categoria:"opinioni", nivel:"A2", semana:16, dia:1, activa:true },
  { palabra_it:"a quanto pare / a quanto sembra", traduccion_es:"al parecer / según parece", ejemplo:"A quanto pare, cambieranno le regole.", categoria:"opinioni", nivel:"A2", semana:16, dia:2, activa:true },
  { palabra_it:"in realtà / in effetti", traduccion_es:"en realidad / en efecto", ejemplo:"In realtà non è così difficile.", categoria:"connettivi", nivel:"A2", semana:16, dia:3, activa:true },

  // ── S17 extra – Lavoro avanzato ──
  { palabra_it:"il sindacato / lo sciopero", traduccion_es:"el sindicato / la huelga", ejemplo:"Il sindacato ha indetto uno sciopero.", categoria:"lavoro", nivel:"A2", semana:17, dia:1, activa:true },
  { palabra_it:"la pensione / andare in pensione", traduccion_es:"la jubilación / jubilarse", ejemplo:"Mio padre va in pensione il prossimo anno.", categoria:"lavoro", nivel:"A2", semana:17, dia:2, activa:true },
  { palabra_it:"il rimborso spese / la nota spese", traduccion_es:"el reembolso de gastos", ejemplo:"Devo compilare la nota spese del viaggio.", categoria:"lavoro", nivel:"A2", semana:17, dia:3, activa:true },

  // ── S18 extra – Città & Servizi ──
  { palabra_it:"il quartiere / il borgo", traduccion_es:"el barrio / el pueblo pequeño", ejemplo:"Abito in un quartiere tranquillo.", categoria:"citta", nivel:"A2", semana:18, dia:1, activa:true },
  { palabra_it:"il marciapiede / l'incrocio", traduccion_es:"la acera / el cruce", ejemplo:"Attraversa solo sulle strisce.", categoria:"citta", nivel:"A2", semana:18, dia:1, activa:true },
  { palabra_it:"la multa / il vigile", traduccion_es:"la multa / el guardia urbano", ejemplo:"Ho preso una multa per divieto di sosta.", categoria:"citta", nivel:"A2", semana:18, dia:2, activa:true },
  { palabra_it:"la biblioteca / la libreria", traduccion_es:"la biblioteca / la librería", ejemplo:"Prendo i libri in biblioteca.", categoria:"servizi", nivel:"A2", semana:18, dia:2, activa:true },
  { palabra_it:"la chiesa / il duomo", traduccion_es:"la iglesia / la catedral", ejemplo:"Il Duomo di Milano è spettacolare.", categoria:"cultura", nivel:"A2", semana:18, dia:3, activa:true },

  // ── S19 extra – Emozioni ──
  { palabra_it:"la nostalgia / sentire la mancanza", traduccion_es:"la nostalgia / echar de menos", ejemplo:"Sento molto la mancanza della mia famiglia.", categoria:"emozioni", nivel:"A2", semana:19, dia:1, activa:true },
  { palabra_it:"la solitudine / sentirsi solo", traduccion_es:"la soledad / sentirse solo", ejemplo:"A volte mi sento solo in questa città.", categoria:"emozioni", nivel:"A2", semana:19, dia:1, activa:true },
  { palabra_it:"la speranza / sperare", traduccion_es:"la esperanza / esperar", ejemplo:"Spero di trovare lavoro presto.", categoria:"emozioni", nivel:"A2", semana:19, dia:2, activa:true },
  { palabra_it:"la delusione / deludersi", traduccion_es:"la decepción / decepcionarse", ejemplo:"Ho avuto una grande delusione.", categoria:"emozioni", nivel:"A2", semana:19, dia:2, activa:true },
  { palabra_it:"la soddisfazione / orgoglioso", traduccion_es:"la satisfacción / orgulloso", ejemplo:"Sono orgoglioso dei miei progressi.", categoria:"emozioni", nivel:"A2", semana:19, dia:3, activa:true },

  // ── S20 extra – Condizionale ──
  { palabra_it:"se potessi / se avessi", traduccion_es:"si pudiera / si tuviera", ejemplo:"Se potessi, vivrei a Firenze.", categoria:"grammatica", nivel:"A2", semana:20, dia:1, activa:true },
  { palabra_it:"nel caso in cui", traduccion_es:"en caso de que", ejemplo:"Nel caso in cui piova, resta a casa.", categoria:"grammatica", nivel:"A2", semana:20, dia:2, activa:true },

  // ── S21 extra – Argomentazione ──
  { palabra_it:"d'altra parte / per contro", traduccion_es:"por otro lado / en cambio", ejemplo:"D'altra parte, capisco il suo punto di vista.", categoria:"connettivi", nivel:"A2", semana:21, dia:1, activa:true },
  { palabra_it:"a meno che / salvo che", traduccion_es:"a menos que / salvo que", ejemplo:"Vengo, a meno che non piova.", categoria:"grammatica", nivel:"A2", semana:21, dia:2, activa:true },
  { palabra_it:"pur / sebbene / anche se", traduccion_es:"aunque / a pesar de que", ejemplo:"Sebbene sia difficile, non mi arrendo.", categoria:"connettivi", nivel:"A2", semana:21, dia:3, activa:true },

  // ── S22 extra – Natura ──
  { palabra_it:"la foresta / il bosco", traduccion_es:"el bosque / el monte", ejemplo:"La foresta dell'Appennino è bellissima.", categoria:"natura", nivel:"A2", semana:22, dia:1, activa:true },
  { palabra_it:"la costa / la spiaggia", traduccion_es:"la costa / la playa", ejemplo:"La costa amalfitana è meravigliosa.", categoria:"natura", nivel:"A2", semana:22, dia:1, activa:true },
  { palabra_it:"il terremoto / l'alluvione", traduccion_es:"el terremoto / la inundación", ejemplo:"L'Italia è un paese sismico.", categoria:"natura", nivel:"A2", semana:22, dia:2, activa:true },
  { palabra_it:"l'ambiente / sostenibile", traduccion_es:"el medioambiente / sostenible", ejemplo:"Dobbiamo proteggere l'ambiente.", categoria:"natura", nivel:"A2", semana:22, dia:3, activa:true },

  // ── S23 extra – Immersione input ──
  { palabra_it:"approfondire / analizzare", traduccion_es:"profundizar / analizar", ejemplo:"Devo approfondire questo argomento.", categoria:"lessico_avanzato", nivel:"B1", semana:23, dia:1, activa:true },
  { palabra_it:"fare riferimento a", traduccion_es:"hacer referencia a", ejemplo:"Faccio riferimento all'articolo di ieri.", categoria:"espressioni", nivel:"B1", semana:23, dia:2, activa:true },
  { palabra_it:"nel complesso / in linea di massima", traduccion_es:"en conjunto / en líneas generales", ejemplo:"Nel complesso, il progetto va bene.", categoria:"connettivi", nivel:"B1", semana:23, dia:3, activa:true },

  // ── S24 extra – Lavoro B1 ──
  { palabra_it:"il budget / il preventivo", traduccion_es:"el presupuesto", ejemplo:"Devo preparare il preventivo entro lunedì.", categoria:"lavoro", nivel:"B1", semana:24, dia:1, activa:true },
  { palabra_it:"la scadenza / la deadline", traduccion_es:"el plazo / la fecha límite", ejemplo:"La scadenza del progetto è venerdì.", categoria:"lavoro", nivel:"B1", semana:24, dia:2, activa:true },
  { palabra_it:"il feedback / la valutazione", traduccion_es:"el feedback / la evaluación", ejemplo:"Il mio responsabile mi ha dato un feedback positivo.", categoria:"lavoro", nivel:"B1", semana:24, dia:3, activa:true },

  // ── S25 extra – Cultura & Arte ──
  { palabra_it:"l'architettura / il monumento", traduccion_es:"la arquitectura / el monumento", ejemplo:"L'architettura italiana è famosa in tutto il mondo.", categoria:"cultura", nivel:"B1", semana:25, dia:1, activa:true },
  { palabra_it:"la letteratura / il romanzo", traduccion_es:"la literatura / la novela", ejemplo:"Sto leggendo un romanzo di Umberto Eco.", categoria:"cultura", nivel:"B1", semana:25, dia:2, activa:true },
  { palabra_it:"la filosofia / il pensiero", traduccion_es:"la filosofía / el pensamiento", ejemplo:"Benedetto Croce fu un grande filosofo italiano.", categoria:"cultura", nivel:"B1", semana:25, dia:3, activa:true },

  // ── S26 extra – Attualità ──
  { palabra_it:"la riforma / riformare", traduccion_es:"la reforma / reformar", ejemplo:"Il governo ha approvato una riforma fiscale.", categoria:"attualita", nivel:"B1", semana:26, dia:1, activa:true },
  { palabra_it:"l'immigrazione / il migrante", traduccion_es:"la inmigración / el migrante", ejemplo:"L'immigrazione è un tema molto dibattuto.", categoria:"attualita", nivel:"B1", semana:26, dia:2, activa:true },
  { palabra_it:"la sostenibilità / rinnovabile", traduccion_es:"la sostenibilidad / renovable", ejemplo:"L'energia rinnovabile è il futuro.", categoria:"attualita", nivel:"B1", semana:26, dia:3, activa:true },

  // ── S27 extra – Salute B1 ──
  { palabra_it:"il medico di base / il SSN", traduccion_es:"el médico de cabecera / la sanidad pública", ejemplo:"Il medico di base mi ha indirizzato allo specialista.", categoria:"salute", nivel:"B1", semana:27, dia:1, activa:true },
  { palabra_it:"la cartella clinica", traduccion_es:"el historial médico", ejemplo:"Il medico ha aggiornato la mia cartella clinica.", categoria:"salute", nivel:"B1", semana:27, dia:2, activa:true },
  { palabra_it:"il check-up / lo screening", traduccion_es:"el chequeo / el screening", ejemplo:"Faccio un check-up completo ogni anno.", categoria:"salute", nivel:"B1", semana:27, dia:3, activa:true },

  // ── S28 extra – Tecnologia ──
  { palabra_it:"la rete / la connessione", traduccion_es:"la red / la conexión", ejemplo:"La connessione internet è lenta.", categoria:"tecnologia", nivel:"B1", semana:28, dia:1, activa:true },
  { palabra_it:"l'algoritmo / i dati", traduccion_es:"el algoritmo / los datos", ejemplo:"L'algoritmo analizza milioni di dati.", categoria:"tecnologia", nivel:"B1", semana:28, dia:2, activa:true },
  { palabra_it:"digitale / analogico", traduccion_es:"digital / analógico", ejemplo:"Viviamo in un'era completamente digitale.", categoria:"tecnologia", nivel:"B1", semana:28, dia:3, activa:true },

  // ── S29 extra – Espressioni idiomatiche ──
  { palabra_it:"avere le mani in pasta", traduccion_es:"estar metido en el asunto / tener mucho poder", ejemplo:"Ha le mani in pasta in molti affari.", categoria:"espressioni", nivel:"B1", semana:29, dia:1, activa:true },
  { palabra_it:"costare un occhio della testa", traduccion_es:"costar un ojo de la cara", ejemplo:"Quell'appartamento costa un occhio della testa.", categoria:"espressioni", nivel:"B1", semana:29, dia:1, activa:true },
  { palabra_it:"non c'è due senza tre", traduccion_es:"no hay dos sin tres", ejemplo:"Non c'è due senza tre — è successo di nuovo!", categoria:"espressioni", nivel:"B1", semana:29, dia:2, activa:true },
  { palabra_it:"prendere la palla al balzo", traduccion_es:"aprovechar la ocasión", ejemplo:"Ho preso la palla al balzo e ho accettato.", categoria:"espressioni", nivel:"B1", semana:29, dia:2, activa:true },
  { palabra_it:"avere il pollice verde", traduccion_es:"tener mano con las plantas", ejemplo:"Mia nonna ha il pollice verde.", categoria:"espressioni", nivel:"B1", semana:29, dia:3, activa:true },
  { palabra_it:"buttarsi acqua addosso", traduccion_es:"echarse agua encima / auto-sabotearse", ejemplo:"Non buttarti acqua addosso, ce la fai!", categoria:"espressioni", nivel:"B1", semana:29, dia:3, activa:true },

  // ── S30 extra – Lessico B1 ──
  { palabra_it:"la consapevolezza", traduccion_es:"la conciencia / la consciencia", ejemplo:"Ho una grande consapevolezza dei miei limiti.", categoria:"lessico_avanzato", nivel:"B1", semana:30, dia:1, activa:true },
  { palabra_it:"il percorso / il tragitto", traduccion_es:"el recorrido / el trayecto", ejemplo:"È stato un percorso lungo ma bellissimo.", categoria:"lessico_avanzato", nivel:"B1", semana:30, dia:1, activa:true },
  { palabra_it:"il traguardo / il risultato", traduccion_es:"la meta / el resultado", ejemplo:"Ho raggiunto il traguardo che sognavo.", categoria:"lessico_avanzato", nivel:"B1", semana:30, dia:2, activa:true },
  { palabra_it:"la motivazione / la determinazione", traduccion_es:"la motivación / la determinación", ejemplo:"La motivazione è il segreto del successo.", categoria:"lessico_avanzato", nivel:"B1", semana:30, dia:2, activa:true },
  { palabra_it:"integrarsi / adattarsi", traduccion_es:"integrarse / adaptarse", ejemplo:"Mi sono integrato bene nella società italiana.", categoria:"lessico_avanzato", nivel:"B1", semana:30, dia:3, activa:true },
  { palabra_it:"la fluidità / la scioltezza", traduccion_es:"la fluidez / la soltura", ejemplo:"Parlo con maggiore fluidità rispetto a un anno fa.", categoria:"lessico_avanzato", nivel:"B1", semana:30, dia:3, activa:true },

  // ════════════════════════════════════════════════════════════════
  // EXPANSIÓN FINAL +262 PALABRAS — llegando a 600 totales
  // ════════════════════════════════════════════════════════════════

  // ── S1 – Pronomi & verbi base ──
  { palabra_it:"io / tu / lui / lei", traduccion_es:"yo / tú / él / ella", ejemplo:"Io sono italiano, tu sei spagnolo.", categoria:"grammatica", nivel:"A0", semana:1, dia:1, activa:true },
  { palabra_it:"noi / voi / loro", traduccion_es:"nosotros / vosotros / ellos", ejemplo:"Noi studiamo insieme ogni sera.", categoria:"grammatica", nivel:"A0", semana:1, dia:1, activa:true },
  { palabra_it:"questo / quello", traduccion_es:"este / aquel", ejemplo:"Questo libro è mio, quello è tuo.", categoria:"grammatica", nivel:"A0", semana:1, dia:2, activa:true },
  { palabra_it:"molto / poco / abbastanza", traduccion_es:"mucho / poco / bastante", ejemplo:"Parlo poco italiano ma capisco molto.", categoria:"grammatica", nivel:"A0", semana:1, dia:2, activa:true },
  { palabra_it:"anche / pure", traduccion_es:"también", ejemplo:"Anch'io voglio un caffè.", categoria:"grammatica", nivel:"A0", semana:1, dia:3, activa:true },
  { palabra_it:"ma / però / e", traduccion_es:"pero / sin embargo / y", ejemplo:"Voglio venire, ma sono stanco.", categoria:"grammatica", nivel:"A0", semana:1, dia:3, activa:true },
  { palabra_it:"o / oppure", traduccion_es:"o / o bien", ejemplo:"Caffè o cappuccino?", categoria:"grammatica", nivel:"A0", semana:1, dia:3, activa:true },
  { palabra_it:"con / senza / per", traduccion_es:"con / sin / para", ejemplo:"Un cornetto con la marmellata, per favore.", categoria:"grammatica", nivel:"A0", semana:1, dia:4, activa:true },
  { palabra_it:"di / da / a / in / su", traduccion_es:"de / desde / a / en / sobre (preposiciones)", ejemplo:"Vengo da Roma, abito a Milano.", categoria:"grammatica", nivel:"A0", semana:1, dia:4, activa:true },
  { palabra_it:"lunedì / martedì / mercoledì", traduccion_es:"lunes / martes / miércoles", ejemplo:"Il colloquio è lunedì mattina.", categoria:"tempo", nivel:"A0", semana:1, dia:5, activa:true },
  { palabra_it:"giovedì / venerdì / sabato / domenica", traduccion_es:"jueves / viernes / sábado / domingo", ejemplo:"Il sabato vado al mercato.", categoria:"tempo", nivel:"A0", semana:1, dia:5, activa:true },
  { palabra_it:"gennaio / febbraio / marzo", traduccion_es:"enero / febrero / marzo", ejemplo:"Sono nato il 3 marzo.", categoria:"tempo", nivel:"A0", semana:1, dia:5, activa:true },
  { palabra_it:"aprile / maggio / giugno", traduccion_es:"abril / mayo / junio", ejemplo:"In giugno fa già molto caldo.", categoria:"tempo", nivel:"A0", semana:1, dia:6, activa:true },
  { palabra_it:"luglio / agosto / settembre", traduccion_es:"julio / agosto / septiembre", ejemplo:"Ad agosto molti italiani vanno in vacanza.", categoria:"tempo", nivel:"A0", semana:1, dia:6, activa:true },
  { palabra_it:"ottobre / novembre / dicembre", traduccion_es:"octubre / noviembre / diciembre", ejemplo:"A dicembre fa freddo al Nord.", categoria:"tempo", nivel:"A0", semana:1, dia:6, activa:true },

  // ── S2 – Orario & Quotidiano ──
  { palabra_it:"che ore sono? / sono le...", traduccion_es:"¿qué hora es? / son las...", ejemplo:"Che ore sono? Sono le otto e mezza.", categoria:"tempo", nivel:"A0", semana:2, dia:1, activa:true },
  { palabra_it:"mattina / pomeriggio / sera / notte", traduccion_es:"mañana / tarde / noche / madrugada", ejemplo:"La mattina bevo sempre un caffè.", categoria:"tempo", nivel:"A0", semana:2, dia:1, activa:true },
  { palabra_it:"oggi / domani / ieri", traduccion_es:"hoy / mañana / ayer", ejemplo:"Oggi non ho lezione.", categoria:"tempo", nivel:"A0", semana:2, dia:2, activa:true },
  { palabra_it:"la settimana / il mese / l'anno", traduccion_es:"la semana / el mes / el año", ejemplo:"Quest'anno vado in Italia.", categoria:"tempo", nivel:"A0", semana:2, dia:2, activa:true },
  { palabra_it:"presto / tardi", traduccion_es:"temprano / tarde", ejemplo:"Mi alzo sempre presto.", categoria:"tempo", nivel:"A0", semana:2, dia:3, activa:true },
  { palabra_it:"adesso / ora / subito", traduccion_es:"ahora / ahora mismo / enseguida", ejemplo:"Arrivo subito, aspetta!", categoria:"tempo", nivel:"A0", semana:2, dia:3, activa:true },

  // ── S3 – Aggettivi frequenti ──
  { palabra_it:"grande / piccolo", traduccion_es:"grande / pequeño", ejemplo:"Ho una piccola casa in centro.", categoria:"aggettivi", nivel:"A0", semana:3, dia:1, activa:true },
  { palabra_it:"bello / brutto", traduccion_es:"hermoso / feo", ejemplo:"Che bella città Roma!", categoria:"aggettivi", nivel:"A0", semana:3, dia:1, activa:true },
  { palabra_it:"nuovo / vecchio", traduccion_es:"nuevo / viejo", ejemplo:"Ho comprato una macchina nuova.", categoria:"aggettivi", nivel:"A0", semana:3, dia:2, activa:true },
  { palabra_it:"caro / economico", traduccion_es:"caro / económico", ejemplo:"L'affitto è caro ma il quartiere è ottimo.", categoria:"aggettivi", nivel:"A0", semana:3, dia:2, activa:true },
  { palabra_it:"facile / difficile", traduccion_es:"fácil / difícil", ejemplo:"L'italiano non è difficile per chi parla spagnolo.", categoria:"aggettivi", nivel:"A0", semana:3, dia:3, activa:true },
  { palabra_it:"veloce / lento", traduccion_es:"rápido / lento", ejemplo:"Parla più lento, per favore!", categoria:"aggettivi", nivel:"A0", semana:3, dia:3, activa:true },
  { palabra_it:"alto / basso", traduccion_es:"alto / bajo", ejemplo:"Il palazzo è molto alto.", categoria:"aggettivi", nivel:"A0", semana:3, dia:3, activa:true },
  { palabra_it:"aperto / chiuso", traduccion_es:"abierto / cerrado", ejemplo:"Il negozio è chiuso il lunedì.", categoria:"aggettivi", nivel:"A1", semana:3, dia:1, activa:true },
  { palabra_it:"pieno / vuoto", traduccion_es:"lleno / vacío", ejemplo:"Il treno è pieno di turisti.", categoria:"aggettivi", nivel:"A1", semana:3, dia:2, activa:true },
  { palabra_it:"pulito / sporco", traduccion_es:"limpio / sucio", ejemplo:"La stanza è sempre pulita.", categoria:"aggettivi", nivel:"A1", semana:3, dia:3, activa:true },

  // ── S4 – Verbi quotidiani ──
  { palabra_it:"alzarsi / svegliarsi", traduccion_es:"levantarse / despertarse", ejemplo:"Mi sveglio alle sette ogni mattina.", categoria:"verbi", nivel:"A1", semana:4, dia:1, activa:true },
  { palabra_it:"lavarsi / vestirsi", traduccion_es:"lavarse / vestirse", ejemplo:"Mi vesto in fretta la mattina.", categoria:"verbi", nivel:"A1", semana:4, dia:1, activa:true },
  { palabra_it:"fare colazione / pranzare / cenare", traduccion_es:"desayunar / almorzar / cenar", ejemplo:"Di solito pranzo in ufficio.", categoria:"verbi", nivel:"A1", semana:4, dia:2, activa:true },
  { palabra_it:"uscire / rientrare", traduccion_es:"salir / volver a casa", ejemplo:"Esco alle otto e rientro alle sette.", categoria:"verbi", nivel:"A1", semana:4, dia:2, activa:true },
  { palabra_it:"camminare / correre", traduccion_es:"caminar / correr", ejemplo:"Corro trenta minuti ogni giorno.", categoria:"verbi", nivel:"A1", semana:4, dia:3, activa:true },
  { palabra_it:"dormire / riposarsi", traduccion_es:"dormir / descansar", ejemplo:"Dormo almeno otto ore per notte.", categoria:"verbi", nivel:"A1", semana:4, dia:3, activa:true },
  { palabra_it:"sedersi / alzarsi", traduccion_es:"sentarse / levantarse", ejemplo:"Siediti qui, prego.", categoria:"verbi", nivel:"A1", semana:4, dia:3, activa:true },
  { palabra_it:"chiamare / rispondere", traduccion_es:"llamar / responder", ejemplo:"Ti chiamo dopo le sei.", categoria:"verbi", nivel:"A1", semana:4, dia:1, activa:true },
  { palabra_it:"aspettare / attendere", traduccion_es:"esperar / aguardar", ejemplo:"Aspetta un attimo, per favore.", categoria:"verbi", nivel:"A1", semana:4, dia:2, activa:true },
  { palabra_it:"cercare / trovare", traduccion_es:"buscar / encontrar", ejemplo:"Cerco le chiavi di casa.", categoria:"verbi", nivel:"A1", semana:4, dia:3, activa:true },

  // ── S5 – Casa: stanze & oggetti ──
  { palabra_it:"il salotto / il soggiorno", traduccion_es:"la sala / el salón", ejemplo:"Il salotto è luminoso e spazioso.", categoria:"casa", nivel:"A1", semana:5, dia:1, activa:true },
  { palabra_it:"la cucina / il bagno", traduccion_es:"la cocina / el baño", ejemplo:"La cucina è moderna e attrezzata.", categoria:"casa", nivel:"A1", semana:5, dia:1, activa:true },
  { palabra_it:"il letto / il divano", traduccion_es:"la cama / el sofá", ejemplo:"Il divano è comodo per guardare la tv.", categoria:"casa", nivel:"A1", semana:5, dia:2, activa:true },
  { palabra_it:"il tavolo / la sedia", traduccion_es:"la mesa / la silla", ejemplo:"Mangio sempre al tavolo.", categoria:"casa", nivel:"A1", semana:5, dia:2, activa:true },
  { palabra_it:"la finestra / la porta", traduccion_es:"la ventana / la puerta", ejemplo:"Apri la finestra, per favore.", categoria:"casa", nivel:"A1", semana:5, dia:3, activa:true },
  { palabra_it:"la lavatrice / la lavastoviglie", traduccion_es:"la lavadora / el lavavajillas", ejemplo:"L'appartamento ha lavatrice e lavastoviglie.", categoria:"casa", nivel:"A1", semana:5, dia:3, activa:true },
  { palabra_it:"l'armadio / il cassetto", traduccion_es:"el armario / el cajón", ejemplo:"I vestiti sono nell'armadio.", categoria:"casa", nivel:"A1", semana:5, dia:3, activa:true },

  // ── S6 – Cibo & Bevande ──
  { palabra_it:"il caffè / il cappuccino", traduccion_es:"el café / el capuchino", ejemplo:"Ogni mattina prendo un cappuccino al bar.", categoria:"cucina", nivel:"A0", semana:6, dia:1, activa:true },
  { palabra_it:"il latte / il succo", traduccion_es:"la leche / el zumo", ejemplo:"Un succo d'arancia fresco.", categoria:"cucina", nivel:"A0", semana:6, dia:1, activa:true },
  { palabra_it:"la pizza / la focaccia", traduccion_es:"la pizza / la focaccia", ejemplo:"La pizza napoletana è la più famosa.", categoria:"cucina", nivel:"A0", semana:6, dia:2, activa:true },
  { palabra_it:"il risotto / la zuppa", traduccion_es:"el risotto / la sopa", ejemplo:"Il risotto alla milanese è buonissimo.", categoria:"cucina", nivel:"A1", semana:6, dia:2, activa:true },
  { palabra_it:"il prosciutto / la salamella", traduccion_es:"el jamón / la salchicha", ejemplo:"Un panino con prosciutto e mozzarella.", categoria:"cucina", nivel:"A1", semana:6, dia:3, activa:true },
  { palabra_it:"l'aceto / lo zucchero", traduccion_es:"el vinagre / el azúcar", ejemplo:"Aggiungi un po' di zucchero.", categoria:"cucina", nivel:"A1", semana:6, dia:3, activa:true },
  { palabra_it:"la farina / il lievito", traduccion_es:"la harina / la levadura", ejemplo:"Per il pane serve farina e lievito.", categoria:"cucina", nivel:"A1", semana:6, dia:3, activa:true },
  { palabra_it:"crudo / cotto / al dente", traduccion_es:"crudo / cocido / al dente", ejemplo:"Gli italiani mangiano la pasta al dente.", categoria:"cucina", nivel:"A1", semana:6, dia:2, activa:true },

  // ── S7 – Abbigliamento ──
  { palabra_it:"la camicia / la maglia", traduccion_es:"la camisa / la camiseta", ejemplo:"Metto una camicia bianca per il colloquio.", categoria:"abbigliamento", nivel:"A1", semana:7, dia:1, activa:true },
  { palabra_it:"i pantaloni / la gonna", traduccion_es:"los pantalones / la falda", ejemplo:"Indosso sempre i pantaloni al lavoro.", categoria:"abbigliamento", nivel:"A1", semana:7, dia:1, activa:true },
  { palabra_it:"il cappotto / la giacca", traduccion_es:"el abrigo / la chaqueta", ejemplo:"In inverno porto sempre il cappotto.", categoria:"abbigliamento", nivel:"A1", semana:7, dia:2, activa:true },
  { palabra_it:"le scarpe / i stivali", traduccion_es:"los zapatos / las botas", ejemplo:"Le scarpe italiane sono famose nel mondo.", categoria:"abbigliamento", nivel:"A1", semana:7, dia:2, activa:true },
  { palabra_it:"la taglia / la misura", traduccion_es:"la talla / la medida", ejemplo:"Che taglia porta? Una media.", categoria:"abbigliamento", nivel:"A1", semana:7, dia:3, activa:true },
  { palabra_it:"provare / stare bene", traduccion_es:"probarse / quedar bien", ejemplo:"Posso provare questa giacca? Le sta benissimo.", categoria:"abbigliamento", nivel:"A1", semana:7, dia:3, activa:true },

  // ── S8 – Tecnologia & Comunicazione ──
  { palabra_it:"il computer / il laptop", traduccion_es:"el ordenador / el portátil", ejemplo:"Lavoro tutto il giorno al computer.", categoria:"tecnologia", nivel:"A1", semana:8, dia:1, activa:true },
  { palabra_it:"la password / il profilo", traduccion_es:"la contraseña / el perfil", ejemplo:"Ho dimenticato la password.", categoria:"tecnologia", nivel:"A1", semana:8, dia:1, activa:true },
  { palabra_it:"scaricare / caricare", traduccion_es:"descargar / subir", ejemplo:"Ho scaricato l'app sul telefono.", categoria:"tecnologia", nivel:"A1", semana:8, dia:2, activa:true },
  { palabra_it:"il wi-fi / la connessione", traduccion_es:"el wifi / la conexión", ejemplo:"C'è il wi-fi gratuito?", categoria:"tecnologia", nivel:"A1", semana:8, dia:2, activa:true },
  { palabra_it:"la videocall / la riunione online", traduccion_es:"la videollamada / la reunión online", ejemplo:"Ho una videocall di lavoro alle dieci.", categoria:"tecnologia", nivel:"A1", semana:8, dia:3, activa:true },
  { palabra_it:"il file / la cartella", traduccion_es:"el archivo / la carpeta", ejemplo:"Salva il file nella cartella giusta.", categoria:"tecnologia", nivel:"A1", semana:8, dia:3, activa:true },

  // ── S9 – Viaggio & Turismo ──
  { palabra_it:"l'aeroporto / il volo", traduccion_es:"el aeropuerto / el vuelo", ejemplo:"Il volo per Milano parte alle sei.", categoria:"trasporti", nivel:"A1", semana:9, dia:1, activa:true },
  { palabra_it:"imbarcarsi / il gate", traduccion_es:"embarcar / la puerta de embarque", ejemplo:"L'imbarco è al gate B7.", categoria:"trasporti", nivel:"A1", semana:9, dia:1, activa:true },
  { palabra_it:"l'albergo / l'ostello", traduccion_es:"el hotel / el hostal", ejemplo:"Ho prenotato una stanza in albergo.", categoria:"turismo", nivel:"A1", semana:9, dia:2, activa:true },
  { palabra_it:"il check-in / il check-out", traduccion_es:"el check-in / el check-out", ejemplo:"Il check-out è entro le dodici.", categoria:"turismo", nivel:"A1", semana:9, dia:2, activa:true },
  { palabra_it:"la guida turistica / la mappa", traduccion_es:"la guía turística / el mapa", ejemplo:"Ho comprato una guida di Firenze.", categoria:"turismo", nivel:"A1", semana:9, dia:3, activa:true },
  { palabra_it:"il monumento / la cattedrale", traduccion_es:"el monumento / la catedral", ejemplo:"Il Duomo di Firenze è straordinario.", categoria:"turismo", nivel:"A1", semana:9, dia:3, activa:true },
  { palabra_it:"la fila / fare la coda", traduccion_es:"la cola / hacer cola", ejemplo:"C'è molta fila ai Musei Vaticani.", categoria:"turismo", nivel:"A1", semana:9, dia:3, activa:true },

  // ── S10 – Descrizione fisica ──
  { palabra_it:"alto / basso / di media statura", traduccion_es:"alto / bajo / de estatura media", ejemplo:"Mio fratello è alto e magro.", categoria:"descrizione", nivel:"A1", semana:10, dia:1, activa:true },
  { palabra_it:"grasso / magro / robusto", traduccion_es:"gordo / delgado / robusto", ejemplo:"È dimagrito molto quest'anno.", categoria:"descrizione", nivel:"A1", semana:10, dia:1, activa:true },
  { palabra_it:"i capelli lisci / ricci / biondi", traduccion_es:"el cabello liso / rizado / rubio", ejemplo:"Ha i capelli ricci e castani.", categoria:"descrizione", nivel:"A1", semana:10, dia:2, activa:true },
  { palabra_it:"gli occhi azzurri / verdi / castani", traduccion_es:"ojos azules / verdes / castaños", ejemplo:"Ha gli occhi verdi bellissimi.", categoria:"descrizione", nivel:"A1", semana:10, dia:2, activa:true },
  { palabra_it:"giovane / anziano / di mezza età", traduccion_es:"joven / anciano / de mediana edad", ejemplo:"Il professore è anziano ma molto energico.", categoria:"descrizione", nivel:"A1", semana:10, dia:3, activa:true },

  // ── S11 – Carattere & Personalità ──
  { palabra_it:"gentile / scortese", traduccion_es:"amable / descortés", ejemplo:"Gli italiani sono molto gentili.", categoria:"carattere", nivel:"A1", semana:11, dia:1, activa:true },
  { palabra_it:"timido / estroverso", traduccion_es:"tímido / extrovertido", ejemplo:"Da bambino ero molto timido.", categoria:"carattere", nivel:"A1", semana:11, dia:1, activa:true },
  { palabra_it:"paziente / impaziente", traduccion_es:"paciente / impaciente", ejemplo:"Devi essere più paziente.", categoria:"carattere", nivel:"A1", semana:11, dia:2, activa:true },
  { palabra_it:"onesto / bugiardo", traduccion_es:"honesto / mentiroso", ejemplo:"Preferisco una persona onesta.", categoria:"carattere", nivel:"A1", semana:11, dia:2, activa:true },
  { palabra_it:"coraggioso / vigliacco", traduccion_es:"valiente / cobarde", ejemplo:"Ci vuole coraggio per cambiare vita.", categoria:"carattere", nivel:"A1", semana:11, dia:3, activa:true },
  { palabra_it:"curioso / indifferente", traduccion_es:"curioso / indiferente", ejemplo:"I bambini sono naturalmente curiosi.", categoria:"carattere", nivel:"A1", semana:11, dia:3, activa:true },

  // ── S12 – Scuola: materie & attività ──
  { palabra_it:"la matematica / la fisica", traduccion_es:"las matemáticas / la física", ejemplo:"La matematica non mi è mai piaciuta.", categoria:"istruzione", nivel:"A1", semana:12, dia:1, activa:true },
  { palabra_it:"la storia / la geografia", traduccion_es:"la historia / la geografía", ejemplo:"Adoro la storia italiana.", categoria:"istruzione", nivel:"A1", semana:12, dia:1, activa:true },
  { palabra_it:"le lingue straniere / la letteratura", traduccion_es:"los idiomas / la literatura", ejemplo:"Studio tre lingue straniere.", categoria:"istruzione", nivel:"A1", semana:12, dia:2, activa:true },
  { palabra_it:"la classe / l'aula", traduccion_es:"la clase / el aula", ejemplo:"La nostra aula ha trenta studenti.", categoria:"istruzione", nivel:"A1", semana:12, dia:2, activa:true },
  { palabra_it:"la lezione / il seminario", traduccion_es:"la lección / el seminario", ejemplo:"La lezione inizia alle nove in punto.", categoria:"istruzione", nivel:"A1", semana:12, dia:3, activa:true },

  // ── S13 – Pronomi relativi & congiunzioni ──
  { palabra_it:"che / cui / il quale", traduccion_es:"que / quien / el cual (relativos)", ejemplo:"Il libro che stai leggendo è bellissimo.", categoria:"grammatica", nivel:"A2", semana:13, dia:1, activa:true },
  { palabra_it:"chi / chiunque", traduccion_es:"quien / cualquiera que", ejemplo:"Chi studia ottiene buoni risultati.", categoria:"grammatica", nivel:"A2", semana:13, dia:2, activa:true },
  { palabra_it:"qualcosa / qualcuno / niente", traduccion_es:"algo / alguien / nada", ejemplo:"C'è qualcosa che non va?", categoria:"grammatica", nivel:"A2", semana:13, dia:3, activa:true },
  { palabra_it:"ogni / tutto / tutti", traduccion_es:"cada / todo / todos", ejemplo:"Ogni giorno imparo qualcosa di nuovo.", categoria:"grammatica", nivel:"A2", semana:13, dia:3, activa:true },

  // ── S14 – Particelle e avverbi ──
  { palabra_it:"ci / vi / ne", traduccion_es:"ahí / allí / de ello (partículas)", ejemplo:"Ci vado domani. Ne voglio due.", categoria:"grammatica", nivel:"A2", semana:14, dia:1, activa:true },
  { palabra_it:"lo / la / li / le (oggetto)", traduccion_es:"lo / la / los / las (pronombres)", ejemplo:"Hai visto Marco? Sì, l'ho visto.", categoria:"grammatica", nivel:"A2", semana:14, dia:2, activa:true },
  { palabra_it:"mi / ti / gli / le (indiretto)", traduccion_es:"me / te / le (pronombres indirectos)", ejemplo:"Gli ho mandato un messaggio.", categoria:"grammatica", nivel:"A2", semana:14, dia:3, activa:true },

  // ── S15 – Espressioni di tempo ──
  { palabra_it:"di solito / spesso / raramente", traduccion_es:"normalmente / a menudo / raramente", ejemplo:"Di solito mangio a casa.", categoria:"avverbi", nivel:"A2", semana:15, dia:1, activa:true },
  { palabra_it:"qualche volta / a volte / ogni tanto", traduccion_es:"alguna vez / a veces / de vez en cuando", ejemplo:"A volte mi manca la Colombia.", categoria:"avverbi", nivel:"A2", semana:15, dia:2, activa:true },
  { palabra_it:"sempre / mai / quasi mai", traduccion_es:"siempre / nunca / casi nunca", ejemplo:"Non arrivo mai in ritardo.", categoria:"avverbi", nivel:"A2", semana:15, dia:3, activa:true },

  // ── S16 – Numeri ordinali & misure ──
  { palabra_it:"il chilometro / il metro / il centimetro", traduccion_es:"el kilómetro / el metro / el centímetro", ejemplo:"Abito a due chilometri dal centro.", categoria:"misure", nivel:"A2", semana:16, dia:1, activa:true },
  { palabra_it:"il chilo / il grammo / il litro", traduccion_es:"el kilo / el gramo / el litro", ejemplo:"Compra un litro di latte.", categoria:"misure", nivel:"A2", semana:16, dia:2, activa:true },
  { palabra_it:"la percentuale / la metà / il doppio", traduccion_es:"el porcentaje / la mitad / el doble", ejemplo:"La metà degli italiani vive al Nord.", categoria:"misure", nivel:"A2", semana:16, dia:3, activa:true },

  // ── S17 – Ufficio & strumenti di lavoro ──
  { palabra_it:"la riunione / il verbale", traduccion_es:"la reunión / el acta", ejemplo:"Ho una riunione importante alle tre.", categoria:"lavoro", nivel:"A2", semana:17, dia:1, activa:true },
  { palabra_it:"la scadenza / la priorità", traduccion_es:"el plazo / la prioridad", ejemplo:"Questa scadenza è prioritaria.", categoria:"lavoro", nivel:"A2", semana:17, dia:2, activa:true },
  { palabra_it:"l'ufficio / la scrivania", traduccion_es:"la oficina / el escritorio", ejemplo:"Il mio ufficio è al secondo piano.", categoria:"lavoro", nivel:"A2", semana:17, dia:3, activa:true },
  { palabra_it:"la stampante / la fotocopiatrice", traduccion_es:"la impresora / la fotocopiadora", ejemplo:"La stampante è esaurita di carta.", categoria:"lavoro", nivel:"A2", semana:17, dia:3, activa:true },

  // ── S18 – Negozi & Acquisti ──
  { palabra_it:"la tabaccheria / l'edicola", traduccion_es:"el estanco / el quiosco", ejemplo:"I biglietti dell'autobus si comprano in tabaccheria.", categoria:"servizi", nivel:"A2", semana:18, dia:1, activa:true },
  { palabra_it:"la farmacia / la parafarmacia", traduccion_es:"la farmacia / la parafarmacia", ejemplo:"Trovi l'aspirina in parafarmacia.", categoria:"servizi", nivel:"A2", semana:18, dia:2, activa:true },
  { palabra_it:"fare shopping / fare acquisti", traduccion_es:"ir de compras / hacer compras", ejemplo:"Il sabato pomeriggio faccio shopping.", categoria:"quotidiano", nivel:"A2", semana:18, dia:3, activa:true },
  { palabra_it:"il saldo / lo sconto / l'offerta", traduccion_es:"las rebajas / el descuento / la oferta", ejemplo:"I saldi invernali iniziano a gennaio.", categoria:"quotidiano", nivel:"A2", semana:18, dia:3, activa:true },

  // ── S19 – Psicologia & Benessere ──
  { palabra_it:"lo stress / stressarsi", traduccion_es:"el estrés / estresarse", ejemplo:"Il lavoro mi stresa troppo.", categoria:"emozioni", nivel:"A2", semana:19, dia:1, activa:true },
  { palabra_it:"la fiducia / fidarsi", traduccion_es:"la confianza / confiar", ejemplo:"Ho molta fiducia in me stesso.", categoria:"emozioni", nivel:"A2", semana:19, dia:2, activa:true },
  { palabra_it:"la pazienza / la calma", traduccion_es:"la paciencia / la calma", ejemplo:"Mantieni la calma in ogni situazione.", categoria:"emozioni", nivel:"A2", semana:19, dia:3, activa:true },
  { palabra_it:"l'autostima / la resilienza", traduccion_es:"la autoestima / la resiliencia", ejemplo:"Imparare una lingua aumenta l'autostima.", categoria:"emozioni", nivel:"A2", semana:19, dia:3, activa:true },

  // ── S20 – Congiuntivo base ──
  { palabra_it:"spero che / voglio che", traduccion_es:"espero que / quiero que (+ subjuntivo)", ejemplo:"Spero che tu stia bene.", categoria:"grammatica", nivel:"A2", semana:20, dia:1, activa:true },
  { palabra_it:"bisogna che / è necessario che", traduccion_es:"es necesario que / hace falta que", ejemplo:"Bisogna che tu studi di più.", categoria:"grammatica", nivel:"A2", semana:20, dia:2, activa:true },
  { palabra_it:"benché / sebbene / nonostante che", traduccion_es:"aunque / a pesar de que (+ subjuntivo)", ejemplo:"Benché piova, esco lo stesso.", categoria:"grammatica", nivel:"A2", semana:20, dia:3, activa:true },

  // ── S21 – Lessico formale scritto ──
  { palabra_it:"si prega di / si chiede di", traduccion_es:"se ruega / se solicita (formal)", ejemplo:"Si prega di non fumare.", categoria:"registro_formale", nivel:"A2", semana:21, dia:1, activa:true },
  { palabra_it:"con riferimento a / in merito a", traduccion_es:"con referencia a / en relación con", ejemplo:"Con riferimento alla sua email del 3 marzo...", categoria:"registro_formale", nivel:"B1", semana:21, dia:2, activa:true },
  { palabra_it:"cordiali saluti / distinti saluti", traduccion_es:"saludos cordiales / atentamente", ejemplo:"Distinti saluti, Marco Bianchi.", categoria:"registro_formale", nivel:"A2", semana:21, dia:3, activa:true },
  { palabra_it:"in allegato / allegare", traduccion_es:"adjunto / adjuntar", ejemplo:"In allegato troverà il documento richiesto.", categoria:"registro_formale", nivel:"B1", semana:21, dia:3, activa:true },

  // ── S22 – Animali & Natura viva ──
  { palabra_it:"il gatto / il cane", traduccion_es:"el gato / el perro", ejemplo:"Gli italiani adorano i gatti.", categoria:"natura", nivel:"A1", semana:22, dia:1, activa:true },
  { palabra_it:"l'uccello / il pesce / il coniglio", traduccion_es:"el pájaro / el pez / el conejo", ejemplo:"Ho un gatto e due pesci rossi.", categoria:"natura", nivel:"A1", semana:22, dia:1, activa:true },
  { palabra_it:"l'albero / il fiore / il prato", traduccion_es:"el árbol / la flor / el prado", ejemplo:"In primavera i fiori sono ovunque.", categoria:"natura", nivel:"A1", semana:22, dia:2, activa:true },
  { palabra_it:"il sole / la luna / le stelle", traduccion_es:"el sol / la luna / las estrellas", ejemplo:"Stasera il cielo è pieno di stelle.", categoria:"natura", nivel:"A0", semana:22, dia:2, activa:true },
  { palabra_it:"il vento / la pioggia / la neve", traduccion_es:"el viento / la lluvia / la nieve", ejemplo:"Oggi c'è molto vento.", categoria:"natura", nivel:"A0", semana:22, dia:3, activa:true },

  // ── S23 – Sinonimi & Registro ──
  { palabra_it:"ottenere / conseguire / raggiungere", traduccion_es:"obtener / conseguir / alcanzar", ejemplo:"Ho conseguito ottimi risultati.", categoria:"lessico_avanzato", nivel:"B1", semana:23, dia:1, activa:true },
  { palabra_it:"aumentare / crescere / incrementare", traduccion_es:"aumentar / crecer / incrementar", ejemplo:"I prezzi sono aumentati del 5%.", categoria:"lessico_avanzato", nivel:"B1", semana:23, dia:2, activa:true },
  { palabra_it:"ridurre / diminuire / calare", traduccion_es:"reducir / disminuir / bajar", ejemplo:"I consumi sono calati quest'anno.", categoria:"lessico_avanzato", nivel:"B1", semana:23, dia:3, activa:true },
  { palabra_it:"affrontare / gestire / risolvere", traduccion_es:"afrontar / gestionar / resolver", ejemplo:"Bisogna affrontare i problemi con calma.", categoria:"lessico_avanzato", nivel:"B1", semana:23, dia:3, activa:true },

  // ── S24 – Comunicazione professionale ──
  { palabra_it:"il progetto / il piano d'azione", traduccion_es:"el proyecto / el plan de acción", ejemplo:"Il progetto è in linea con i tempi.", categoria:"lavoro", nivel:"B1", semana:24, dia:1, activa:true },
  { palabra_it:"implementare / sviluppare", traduccion_es:"implementar / desarrollar", ejemplo:"Dobbiamo sviluppare una nuova strategia.", categoria:"lavoro", nivel:"B1", semana:24, dia:2, activa:true },
  { palabra_it:"monitorare / aggiornare", traduccion_es:"monitorear / actualizar", ejemplo:"Monitoro i risultati ogni settimana.", categoria:"lavoro", nivel:"B1", semana:24, dia:3, activa:true },
  { palabra_it:"il cliente / il fornitore", traduccion_es:"el cliente / el proveedor", ejemplo:"Il cliente è soddisfatto del servizio.", categoria:"lavoro", nivel:"B1", semana:24, dia:3, activa:true },

  // ── S25 – Arte & Letteratura ──
  { palabra_it:"il racconto / il saggio", traduccion_es:"el cuento / el ensayo", ejemplo:"Ho letto un racconto di Calvino.", categoria:"cultura", nivel:"B1", semana:25, dia:1, activa:true },
  { palabra_it:"il verso / la rima / la strofa", traduccion_es:"el verso / la rima / la estrofa", ejemplo:"Dante usa la terzina nella Commedia.", categoria:"cultura", nivel:"B1", semana:25, dia:2, activa:true },
  { palabra_it:"il narratore / il protagonista", traduccion_es:"el narrador / el protagonista", ejemplo:"Il protagonista del romanzo è un giovane migrante.", categoria:"cultura", nivel:"B1", semana:25, dia:3, activa:true },

  // ── S26 – Politica & Società ──
  { palabra_it:"la legge / il decreto / la norma", traduccion_es:"la ley / el decreto / la norma", ejemplo:"Il governo ha approvato un nuovo decreto.", categoria:"attualita", nivel:"B1", semana:26, dia:1, activa:true },
  { palabra_it:"il diritto / il dovere", traduccion_es:"el derecho / el deber", ejemplo:"Ogni cittadino ha diritti e doveri.", categoria:"attualita", nivel:"B1", semana:26, dia:2, activa:true },
  { palabra_it:"la democrazia / la costituzione", traduccion_es:"la democracia / la constitución", ejemplo:"La Costituzione italiana è del 1948.", categoria:"attualita", nivel:"B1", semana:26, dia:3, activa:true },
  { palabra_it:"la solidarietà / l'uguaglianza", traduccion_es:"la solidaridad / la igualdad", ejemplo:"La Costituzione garantisce l'uguaglianza.", categoria:"attualita", nivel:"B1", semana:26, dia:3, activa:true },

  // ── S27 – Medicina & Sistema sanitario ──
  { palabra_it:"la mutua / il ticket", traduccion_es:"el seguro médico / el copago", ejemplo:"Con la mutua pago solo il ticket.", categoria:"salute", nivel:"B1", semana:27, dia:1, activa:true },
  { palabra_it:"l'anamnesi / i sintomi", traduccion_es:"la anamnesis / los síntomas", ejemplo:"Il medico raccoglie l'anamnesi del paziente.", categoria:"salute", nivel:"B1", semana:27, dia:2, activa:true },
  { palabra_it:"il reparto / il ricovero", traduccion_es:"el departamento hospitalario / el ingreso", ejemplo:"È stato ricoverato in cardiologia.", categoria:"salute", nivel:"B1", semana:27, dia:3, activa:true },

  // ── S28 – Innovazione & Futuro ──
  { palabra_it:"la startup / l'innovazione", traduccion_es:"la startup / la innovación", ejemplo:"L'Italia ha molte startup innovative.", categoria:"tecnologia", nivel:"B1", semana:28, dia:1, activa:true },
  { palabra_it:"il robot / l'automazione", traduccion_es:"el robot / la automatización", ejemplo:"L'automazione cambia il mercato del lavoro.", categoria:"tecnologia", nivel:"B1", semana:28, dia:2, activa:true },
  { palabra_it:"la transizione energetica", traduccion_es:"la transición energética", ejemplo:"La transizione energetica è una priorità.", categoria:"attualita", nivel:"B1", semana:28, dia:3, activa:true },

  // ── S29 – Proverbi & Modi di dire ──
  { palabra_it:"chi dorme non piglia pesci", traduccion_es:"al que madruga Dios le ayuda (lit: quien duerme no pesca)", ejemplo:"Svegliati! Chi dorme non piglia pesci.", categoria:"espressioni", nivel:"B1", semana:29, dia:1, activa:true },
  { palabra_it:"meglio tardi che mai", traduccion_es:"mejor tarde que nunca", ejemplo:"Hai finito! Meglio tardi che mai.", categoria:"espressioni", nivel:"B1", semana:29, dia:1, activa:true },
  { palabra_it:"l'abito non fa il monaco", traduccion_es:"el hábito no hace al monje", ejemplo:"L'abito non fa il monaco — aspetta di conoscerlo.", categoria:"espressioni", nivel:"B1", semana:29, dia:2, activa:true },
  { palabra_it:"tutto è bene quel che finisce bene", traduccion_es:"bien está lo que bien acaba", ejemplo:"Abbiamo avuto problemi ma alla fine: tutto è bene quel che finisce bene!", categoria:"espressioni", nivel:"B1", semana:29, dia:2, activa:true },
  { palabra_it:"volere è potere", traduccion_es:"querer es poder", ejemplo:"Non arrenderti: volere è potere!", categoria:"espressioni", nivel:"B1", semana:29, dia:3, activa:true },

  // ── S30 – Riflessione metacognitiva ──
  { palabra_it:"riflettere / meditare", traduccion_es:"reflexionar / meditar", ejemplo:"Rifletto ogni sera sui progressi del giorno.", categoria:"lessico_avanzato", nivel:"B1", semana:30, dia:1, activa:true },
  { palabra_it:"valutare / autovalutarsi", traduccion_es:"evaluar / autoevaluarse", ejemplo:"Mi autovaluto ogni settimana.", categoria:"lessico_avanzato", nivel:"B1", semana:30, dia:1, activa:true },
  { palabra_it:"la strategia / il metodo", traduccion_es:"la estrategia / el método", ejemplo:"Ho trovato il mio metodo di studio.", categoria:"lessico_avanzato", nivel:"B1", semana:30, dia:2, activa:true },
  { palabra_it:"superare / sorpassare", traduccion_es:"superar / sobrepasar", ejemplo:"Ho superato tutte le mie aspettative.", categoria:"lessico_avanzato", nivel:"B1", semana:30, dia:2, activa:true },
  { palabra_it:"la padronanza / la competenza", traduccion_es:"el dominio / la competencia", ejemplo:"Ho acquisito una buona padronanza dell'italiano.", categoria:"lessico_avanzato", nivel:"B1", semana:30, dia:3, activa:true },
  { palabra_it:"conquistare / raggiungere l'obiettivo", traduccion_es:"conquistar / alcanzar el objetivo", ejemplo:"Ho raggiunto il mio obiettivo: parlo italiano!", categoria:"lessico_avanzato", nivel:"B1", semana:30, dia:3, activa:true },
  // ── COMPLETAMENTO 600 – Lessico trasversale A0→B1 ──

  // Verbi ad alta frequenza
  { palabra_it:"capire / comprendere", traduccion_es:"entender / comprender", ejemplo:"Capisco quasi tutto quello che sento.", categoria:"verbi", nivel:"A1", semana:2, dia:3, activa:true },
  { palabra_it:"parlare / dire / raccontare", traduccion_es:"hablar / decir / contar", ejemplo:"Ti racconto una cosa interessante.", categoria:"verbi", nivel:"A0", semana:1, dia:1, activa:true },
  { palabra_it:"dare / prendere / portare", traduccion_es:"dar / tomar / llevar", ejemplo:"Mi puoi portare il sale?", categoria:"verbi", nivel:"A1", semana:3, dia:2, activa:true },
  { palabra_it:"mettere / togliere", traduccion_es:"poner / quitar", ejemplo:"Metti la giacca, fa freddo.", categoria:"verbi", nivel:"A1", semana:4, dia:1, activa:true },
  { palabra_it:"aprire / chiudere", traduccion_es:"abrir / cerrar", ejemplo:"Apri la porta, per favore.", categoria:"verbi", nivel:"A1", semana:4, dia:2, activa:true },
  { palabra_it:"iniziare / finire / smettere", traduccion_es:"empezar / terminar / dejar de", ejemplo:"Ho finito di lavorare alle sei.", categoria:"verbi", nivel:"A1", semana:5, dia:1, activa:true },
  { palabra_it:"tornare / restare / partire", traduccion_es:"volver / quedarse / partir", ejemplo:"Parto domani e torno venerdi.", categoria:"verbi", nivel:"A1", semana:5, dia:2, activa:true },
  { palabra_it:"comprare / vendere / pagare", traduccion_es:"comprar / vender / pagar", ejemplo:"Ho pagato venti euro.", categoria:"verbi", nivel:"A1", semana:4, dia:3, activa:true },
  { palabra_it:"leggere / scrivere / stampare", traduccion_es:"leer / escribir / imprimir", ejemplo:"Leggo in italiano ogni giorno.", categoria:"verbi", nivel:"A1", semana:8, dia:1, activa:true },
  { palabra_it:"pensare / credere / immaginare", traduccion_es:"pensar / creer / imaginar", ejemplo:"Penso che tu abbia ragione.", categoria:"verbi", nivel:"A2", semana:16, dia:1, activa:true },
  { palabra_it:"sentire / ascoltare / odorare", traduccion_es:"sentir / escuchar / oler", ejemplo:"Sento l'odore del caffe.", categoria:"verbi", nivel:"A1", semana:8, dia:2, activa:true },
  { palabra_it:"vedere / guardare / osservare", traduccion_es:"ver / mirar / observar", ejemplo:"Guarda che bello quel tramonto!", categoria:"verbi", nivel:"A1", semana:8, dia:1, activa:true },
  { palabra_it:"chiedere / rispondere / spiegare", traduccion_es:"preguntar / responder / explicar", ejemplo:"Puoi spiegarmi come funziona?", categoria:"verbi", nivel:"A1", semana:7, dia:2, activa:true },
  { palabra_it:"aiutare / supportare / collaborare", traduccion_es:"ayudar / apoyar / colaborar", ejemplo:"Mi puoi aiutare con questa traduzione?", categoria:"verbi", nivel:"A1", semana:7, dia:3, activa:true },
  { palabra_it:"ricordare / dimenticare", traduccion_es:"recordar / olvidar", ejemplo:"Non dimentico mai il vocabolario nuovo.", categoria:"verbi", nivel:"A2", semana:14, dia:2, activa:true },
  { palabra_it:"scegliere / decidere / cambiare", traduccion_es:"elegir / decidir / cambiar", ejemplo:"Ho deciso di vivere in Italia.", categoria:"verbi", nivel:"A2", semana:16, dia:2, activa:true },
  { palabra_it:"migliorare / peggiorare", traduccion_es:"mejorar / empeorar", ejemplo:"Il mio italiano migliora ogni giorno.", categoria:"verbi", nivel:"A2", semana:20, dia:2, activa:true },
  { palabra_it:"provare / tentare / riuscire", traduccion_es:"intentar / tratar / lograr", ejemplo:"Ci provo! Alla fine riesco sempre.", categoria:"verbi", nivel:"A2", semana:20, dia:3, activa:true },
  { palabra_it:"conoscere / sapere / imparare", traduccion_es:"conocer / saber / aprender", ejemplo:"Imparo l'italiano da sei mesi.", categoria:"verbi", nivel:"A1", semana:12, dia:2, activa:true },
  { palabra_it:"continuare / interrompere / riprendere", traduccion_es:"continuar / interrumpir / retomar", ejemplo:"Continua cosi, stai facendo bene!", categoria:"verbi", nivel:"A2", semana:21, dia:2, activa:true },
  // Aggettivi
  { palabra_it:"interessante / noioso", traduccion_es:"interesante / aburrido", ejemplo:"Il corso e molto interessante.", categoria:"aggettivi", nivel:"A1", semana:9, dia:2, activa:true },
  { palabra_it:"utile / inutile", traduccion_es:"util / inutil", ejemplo:"Questo dizionario e molto utile.", categoria:"aggettivi", nivel:"A1", semana:12, dia:1, activa:true },
  { palabra_it:"importante / fondamentale", traduccion_es:"importante / fundamental", ejemplo:"La pronuncia e fondamentale.", categoria:"aggettivi", nivel:"A1", semana:13, dia:1, activa:true },
  { palabra_it:"possibile / impossibile", traduccion_es:"posible / imposible", ejemplo:"Tutto e possibile se ci credi.", categoria:"aggettivi", nivel:"A1", semana:15, dia:1, activa:true },
  { palabra_it:"necessario / opzionale", traduccion_es:"necesario / opcional", ejemplo:"Il codice fiscale e necessario.", categoria:"aggettivi", nivel:"A2", semana:4, dia:2, activa:true },
  { palabra_it:"comune / raro / unico", traduccion_es:"comun / raro / unico", ejemplo:"Questo e un evento unico.", categoria:"aggettivi", nivel:"A2", semana:25, dia:2, activa:true },
  { palabra_it:"attuale / recente / antico", traduccion_es:"actual / reciente / antiguo", ejemplo:"Il centro storico ha molti edifici antichi.", categoria:"aggettivi", nivel:"A2", semana:18, dia:1, activa:true },
  { palabra_it:"diverso / uguale / simile", traduccion_es:"diferente / igual / similar", ejemplo:"Le due culture sono molto diverse.", categoria:"aggettivi", nivel:"A2", semana:22, dia:2, activa:true },
  { palabra_it:"forte / debole / fragile", traduccion_es:"fuerte / debil / fragil", ejemplo:"Devi essere forte in questo momento.", categoria:"aggettivi", nivel:"A2", semana:19, dia:3, activa:true },
  { palabra_it:"preciso / vago / chiaro", traduccion_es:"preciso / vago / claro", ejemplo:"Dammi una risposta piu precisa.", categoria:"aggettivi", nivel:"B1", semana:24, dia:1, activa:true },
  // Sostantivi
  { palabra_it:"il problema / la soluzione", traduccion_es:"el problema / la solucion", ejemplo:"Ogni problema ha una soluzione.", categoria:"sostantivi", nivel:"A1", semana:5, dia:3, activa:true },
  { palabra_it:"l'idea / il concetto", traduccion_es:"la idea / el concepto", ejemplo:"Ho avuto un'ottima idea.", categoria:"sostantivi", nivel:"A1", semana:16, dia:1, activa:true },
  { palabra_it:"il motivo / la ragione", traduccion_es:"el motivo / la razon", ejemplo:"Qual e il motivo del ritardo?", categoria:"sostantivi", nivel:"A2", semana:16, dia:2, activa:true },
  { palabra_it:"l'esempio / il caso", traduccion_es:"el ejemplo / el caso", ejemplo:"Per esempio, in questo caso...", categoria:"sostantivi", nivel:"A2", semana:21, dia:1, activa:true },
  { palabra_it:"il risultato / la conseguenza", traduccion_es:"el resultado / la consecuencia", ejemplo:"I risultati sono stati ottimi.", categoria:"sostantivi", nivel:"A2", semana:17, dia:2, activa:true },
  { palabra_it:"lo scopo / l'obiettivo / la meta", traduccion_es:"el proposito / el objetivo", ejemplo:"Il mio obiettivo e raggiungere il B1.", categoria:"sostantivi", nivel:"A2", semana:20, dia:1, activa:true },
  { palabra_it:"il vantaggio / lo svantaggio", traduccion_es:"la ventaja / la desventaja", ejemplo:"C'e un vantaggio enorme nel parlare italiano.", categoria:"sostantivi", nivel:"A2", semana:21, dia:1, activa:true },
  { palabra_it:"la possibilita / l'opportunita", traduccion_es:"la posibilidad / la oportunidad", ejemplo:"E una grande opportunita di lavoro.", categoria:"sostantivi", nivel:"A2", semana:23, dia:2, activa:true },
  { palabra_it:"la differenza / la somiglianza", traduccion_es:"la diferencia / la semejanza", ejemplo:"Ci sono molte somiglianze tra italiano e spagnolo.", categoria:"sostantivi", nivel:"A2", semana:13, dia:2, activa:true },
  { palabra_it:"il rischio / il pericolo", traduccion_es:"el riesgo / el peligro", ejemplo:"C'e un rischio, ma vale la pena.", categoria:"sostantivi", nivel:"B1", semana:26, dia:2, activa:true },
  { palabra_it:"la notizia / l'informazione", traduccion_es:"la noticia / la informacion", ejemplo:"Ho una buona notizia per te!", categoria:"sostantivi", nivel:"A1", semana:8, dia:1, activa:true },
  { palabra_it:"il contatto / il rapporto", traduccion_es:"el contacto / la relacion", ejemplo:"Manteniamo un buon rapporto.", categoria:"sostantivi", nivel:"B1", semana:24, dia:2, activa:true },
  { palabra_it:"l'accordo / il disaccordo", traduccion_es:"el acuerdo / el desacuerdo", ejemplo:"Siamo d'accordo su tutto.", categoria:"sostantivi", nivel:"A2", semana:16, dia:2, activa:true },
  // Connettivi & avverbi
  { palabra_it:"un po' di / un sacco di", traduccion_es:"un poco de / un monton de", ejemplo:"Ho un sacco di cose da fare.", categoria:"espressioni", nivel:"A1", semana:6, dia:1, activa:true },
  { palabra_it:"entrambi / tutti e due", traduccion_es:"ambos / los dos", ejemplo:"Entrambi i candidati sono validi.", categoria:"grammatica", nivel:"A2", semana:20, dia:2, activa:true },
  { palabra_it:"nessuno / niente / nulla", traduccion_es:"ninguno / nada", ejemplo:"Non ho visto nessuno.", categoria:"grammatica", nivel:"A2", semana:14, dia:3, activa:true },
  { palabra_it:"anzitutto / prima di tutto", traduccion_es:"ante todo / primero de todo", ejemplo:"Anzitutto, devo ringraziarti.", categoria:"connettivi", nivel:"B1", semana:21, dia:1, activa:true },
  { palabra_it:"infine / alla fine / per concludere", traduccion_es:"finalmente / al final / para concluir", ejemplo:"Infine, voglio dire una cosa importante.", categoria:"connettivi", nivel:"B1", semana:21, dia:2, activa:true },
  { palabra_it:"invece / al contrario", traduccion_es:"en cambio / al contrario", ejemplo:"Io preferisco il mare, lei invece la montagna.", categoria:"connettivi", nivel:"A2", semana:16, dia:3, activa:true },
  { palabra_it:"cioe / ovvero / vale a dire", traduccion_es:"o sea / es decir", ejemplo:"Sono bilingue, cioe parlo due lingue.", categoria:"connettivi", nivel:"A2", semana:21, dia:3, activa:true },
  { palabra_it:"soprattutto / in particolare", traduccion_es:"sobre todo / en particular", ejemplo:"Mi piace l'Italia, soprattutto la Toscana.", categoria:"connettivi", nivel:"A2", semana:22, dia:2, activa:true },
  { palabra_it:"probabilmente / eventualmente", traduccion_es:"probablemente / eventualmente", ejemplo:"Probabilmente arrivero tardi.", categoria:"avverbi", nivel:"A2", semana:15, dia:2, activa:true },
  { palabra_it:"sinceramente / onestamente", traduccion_es:"sinceramente / honestamente", ejemplo:"Sinceramente, non lo so.", categoria:"avverbi", nivel:"A2", semana:19, dia:1, activa:true },
  { palabra_it:"assolutamente / decisamente", traduccion_es:"absolutamente / decididamente", ejemplo:"Assolutamente si, vengo!", categoria:"avverbi", nivel:"B1", semana:23, dia:2, activa:true },
  // Viaggio & Turismo
  { palabra_it:"il visto / il permesso di entrata", traduccion_es:"el visado / el permiso de entrada", ejemplo:"Per studiare serve il visto studenti.", categoria:"burocrazia", nivel:"B1", semana:4, dia:2, activa:true },
  { palabra_it:"l'assicurazione sanitaria", traduccion_es:"el seguro medico de salud", ejemplo:"In Italia serve l'assicurazione sanitaria.", categoria:"salute", nivel:"B1", semana:27, dia:1, activa:true },
  { palabra_it:"la compagnia aerea / low cost", traduccion_es:"la aerolinea / vuelo low cost", ejemplo:"Volo con una compagnia low cost.", categoria:"trasporti", nivel:"A2", semana:9, dia:1, activa:true },
  { palabra_it:"il bagaglio a mano / la valigia", traduccion_es:"el equipaje de mano / la maleta", ejemplo:"Ho solo il bagaglio a mano.", categoria:"trasporti", nivel:"A2", semana:9, dia:1, activa:true },
  { palabra_it:"noleggiare una macchina", traduccion_es:"alquilar un coche", ejemplo:"Voglio noleggiare una macchina a Palermo.", categoria:"trasporti", nivel:"A2", semana:9, dia:2, activa:true },
  // Gastronomia
  { palabra_it:"la bruschetta / il crostino", traduccion_es:"la bruschetta / el crostino", ejemplo:"Come antipasto prendo una bruschetta.", categoria:"cucina", nivel:"A1", semana:6, dia:1, activa:true },
  { palabra_it:"il tiramisu / la panna cotta", traduccion_es:"el tiramisu / la panna cotta", ejemplo:"Per dessert voglio il tiramisu.", categoria:"cucina", nivel:"A1", semana:6, dia:3, activa:true },
  { palabra_it:"l'aperitivo / lo spritz", traduccion_es:"el aperitivo / el spritz", ejemplo:"Alle sette facciamo l'aperitivo.", categoria:"cucina", nivel:"A1", semana:7, dia:1, activa:true },
  { palabra_it:"il digestivo / l'amaro", traduccion_es:"el digestivo / el amaro", ejemplo:"Dopo cena prendo un amaro.", categoria:"cucina", nivel:"A2", semana:6, dia:3, activa:true },
  { palabra_it:"la trattoria / l'osteria", traduccion_es:"la trattoria / la osteria", ejemplo:"Preferisco mangiare in trattoria.", categoria:"ristorante", nivel:"A1", semana:1, dia:4, activa:true },
  // Paesaggio urbano
  { palabra_it:"il campanile / il belvedere", traduccion_es:"el campanario / el mirador", ejemplo:"Dal belvedere si vede tutta Firenze.", categoria:"turismo", nivel:"A2", semana:25, dia:1, activa:true },
  { palabra_it:"il vicolo / la stradina", traduccion_es:"el callejon / la callejuela", ejemplo:"Mi perdo sempre nei vicoli di Napoli.", categoria:"citta", nivel:"A2", semana:18, dia:1, activa:true },
  { palabra_it:"la fontana / la scultura pubblica", traduccion_es:"la fuente / la escultura publica", ejemplo:"La Fontana di Trevi e meravigliosa.", categoria:"turismo", nivel:"A1", semana:9, dia:3, activa:true },
  { palabra_it:"il palazzo / la villa / il castello", traduccion_es:"el palacio / la villa / el castillo", ejemplo:"Il castello medievale domina la citta.", categoria:"turismo", nivel:"A2", semana:25, dia:1, activa:true },
  // Economia quotidiana
  { palabra_it:"il budget mensile / le spese fisse", traduccion_es:"el presupuesto mensual / los gastos fijos", ejemplo:"Le spese fisse sono affitto e bollette.", categoria:"banca", nivel:"B1", semana:3, dia:3, activa:true },
  { palabra_it:"risparmiare / mettere da parte", traduccion_es:"ahorrar / guardar dinero", ejemplo:"Cerco di risparmiare duecento euro al mese.", categoria:"banca", nivel:"A2", semana:3, dia:2, activa:true },
  { palabra_it:"l'investimento / investire", traduccion_es:"la inversion / invertir", ejemplo:"E un buon momento per investire.", categoria:"banca", nivel:"B1", semana:26, dia:1, activa:true },
  // Cultura & Identita
  { palabra_it:"la tradizione / il costume", traduccion_es:"la tradicion / la costumbre", ejemplo:"E una tradizione molto antica.", categoria:"cultura", nivel:"A2", semana:10, dia:3, activa:true },
  { palabra_it:"l'identita / le radici", traduccion_es:"la identidad / las raices", ejemplo:"Le mie radici latinoamericane sono parte di me.", categoria:"cultura", nivel:"B1", semana:25, dia:3, activa:true },
  { palabra_it:"il pregiudizio / lo stereotipo", traduccion_es:"el prejuicio / el estereotipo", ejemplo:"Bisogna superare i pregiudizi.", categoria:"attualita", nivel:"B1", semana:26, dia:3, activa:true },
  { palabra_it:"multiculturale / cosmopolita", traduccion_es:"multicultural / cosmopolita", ejemplo:"Milano e una citta molto cosmopolita.", categoria:"attualita", nivel:"B1", semana:26, dia:3, activa:true },
  // Salute mentale
  { palabra_it:"il burnout / l'esaurimento", traduccion_es:"el burnout / el agotamiento", ejemplo:"Ho rischiato il burnout l'anno scorso.", categoria:"salute", nivel:"B1", semana:27, dia:2, activa:true },
  { palabra_it:"fare yoga / meditare", traduccion_es:"hacer yoga / meditar", ejemplo:"Faccio yoga ogni mattina per rilassarmi.", categoria:"salute", nivel:"B1", semana:27, dia:3, activa:true },
  { palabra_it:"l'equilibrio psicofisico", traduccion_es:"el equilibrio psicofisico", ejemplo:"Cerco un equilibrio tra lavoro e vita privata.", categoria:"salute", nivel:"B1", semana:27, dia:3, activa:true },
  // Lavoro B1
  { palabra_it:"implementare / sviluppare", traduccion_es:"implementar / desarrollar", ejemplo:"Dobbiamo sviluppare una nuova strategia.", categoria:"lavoro", nivel:"B1", semana:24, dia:2, activa:true },
  { palabra_it:"il cliente / il fornitore", traduccion_es:"el cliente / el proveedor", ejemplo:"Il cliente e soddisfatto del servizio.", categoria:"lavoro", nivel:"B1", semana:24, dia:3, activa:true },
  // Arte & Letteratura
  { palabra_it:"il racconto / il saggio", traduccion_es:"el cuento / el ensayo", ejemplo:"Ho letto un racconto di Calvino.", categoria:"cultura", nivel:"B1", semana:25, dia:1, activa:true },
  { palabra_it:"il verso / la rima / la strofa", traduccion_es:"el verso / la rima / la estrofa", ejemplo:"Dante usa la terzina nella Commedia.", categoria:"cultura", nivel:"B1", semana:25, dia:2, activa:true },
  // Societa
  { palabra_it:"il diritto / il dovere", traduccion_es:"el derecho / el deber", ejemplo:"Ogni cittadino ha diritti e doveri.", categoria:"attualita", nivel:"B1", semana:26, dia:2, activa:true },
  { palabra_it:"la democrazia / la costituzione", traduccion_es:"la democracia / la constitucion", ejemplo:"La Costituzione italiana e del 1948.", categoria:"attualita", nivel:"B1", semana:26, dia:3, activa:true },
  { palabra_it:"la solidarieta / l'uguaglianza", traduccion_es:"la solidaridad / la igualdad", ejemplo:"La Costituzione garantisce l'uguaglianza.", categoria:"attualita", nivel:"B1", semana:26, dia:3, activa:true },
  // Innovazione
  { palabra_it:"la startup / l'innovazione", traduccion_es:"la startup / la innovacion", ejemplo:"L'Italia ha molte startup innovative.", categoria:"tecnologia", nivel:"B1", semana:28, dia:1, activa:true },
  { palabra_it:"il robot / l'automazione", traduccion_es:"el robot / la automatizacion", ejemplo:"L'automazione cambia il mercato del lavoro.", categoria:"tecnologia", nivel:"B1", semana:28, dia:2, activa:true },
  // Proverbi
  { palabra_it:"chi dorme non piglia pesci", traduccion_es:"al que madruga Dios le ayuda", ejemplo:"Svegliati! Chi dorme non piglia pesci.", categoria:"espressioni", nivel:"B1", semana:29, dia:1, activa:true },
  { palabra_it:"meglio tardi che mai", traduccion_es:"mejor tarde que nunca", ejemplo:"Hai finito! Meglio tardi che mai.", categoria:"espressioni", nivel:"B1", semana:29, dia:1, activa:true },
  { palabra_it:"l'abito non fa il monaco", traduccion_es:"el habito no hace al monje", ejemplo:"L'abito non fa il monaco, aspetta di conoscerlo.", categoria:"espressioni", nivel:"B1", semana:29, dia:2, activa:true },
  { palabra_it:"volere e potere", traduccion_es:"querer es poder", ejemplo:"Non arrenderti: volere e potere!", categoria:"espressioni", nivel:"B1", semana:29, dia:3, activa:true },

  // ── ÚLTIMAS 11 palabras → total 600 ──
  { palabra_it:"alzarsi / addormentarsi", traduccion_es:"levantarse / dormirse", ejemplo:"Mi addormento sempre tardi.", categoria:"verbi", nivel:"A1", semana:4, dia:1, activa:true },
  { palabra_it:"il carattere / la personalita", traduccion_es:"el caracter / la personalidad", ejemplo:"Ha un carattere molto aperto.", categoria:"carattere", nivel:"A2", semana:11, dia:1, activa:true },
  { palabra_it:"la calligrafia / il corsivo", traduccion_es:"la caligrafia / la letra cursiva", ejemplo:"In Italia si insegna ancora il corsivo.", categoria:"cultura", nivel:"B1", semana:25, dia:3, activa:true },
  { palabra_it:"il colloquio informale / la chiacchierata", traduccion_es:"la charla informal / la conversacion", ejemplo:"Facciamo una chiacchierata davanti a un caffe.", categoria:"relazioni", nivel:"A2", semana:7, dia:1, activa:true },
  { palabra_it:"la pallavolo / il tennis / il ciclismo", traduccion_es:"el voleibol / el tenis / el ciclismo", ejemplo:"Il Giro d'Italia e la gara ciclistica piu famosa.", categoria:"hobby", nivel:"A1", semana:9, dia:1, activa:true },
  { palabra_it:"la poesia / il poeta", traduccion_es:"la poesia / el poeta", ejemplo:"Leopardi e uno dei poeti italiani piu grandi.", categoria:"cultura", nivel:"B1", semana:25, dia:2, activa:true },
  { palabra_it:"la puntualita / essere in orario", traduccion_es:"la puntualidad / llegar a tiempo", ejemplo:"In Italia la puntualita non e sempre rispettata.", categoria:"cultura", nivel:"A2", semana:10, dia:3, activa:true },
  { palabra_it:"il dialetto / l'accento regionale", traduccion_es:"el dialecto / el acento regional", ejemplo:"Ogni regione italiana ha il suo dialetto.", categoria:"lingua", nivel:"B1", semana:23, dia:2, activa:true },
  { palabra_it:"fare il tifo / il tifoso", traduccion_es:"hacer barra / el hincha", ejemplo:"Faccio il tifo per la Juventus.", categoria:"hobby", nivel:"A1", semana:9, dia:1, activa:true },
  { palabra_it:"la gratitudine / essere grato", traduccion_es:"la gratitud / ser agradecido", ejemplo:"Sono grato per questa opportunita.", categoria:"emozioni", nivel:"B1", semana:30, dia:1, activa:true },
  { palabra_it:"il sogno / sognare ad occhi aperti", traduccion_es:"el sueno / sonar despierto", ejemplo:"Il mio sogno e vivere a Roma.", categoria:"emozioni", nivel:"A2", semana:19, dia:2, activa:true },

];

// ─── SEED PLANES SEMANALES (30 semanas) ───────────────────────────────────
const SEED_SEMANALES = [
  { semana_num:1, titulo:"Semana 1 – Fondamenta: Primeras palabras", tema_principal:"Sobrevivir en Italia el primer día", objetivo_semana:"Saludar, presentarte, pedir información básica, ir al restaurante y hablar sobre un apartamento", reto_semanal:"Preséntate en italiano a 3 personas reales o en el espejo. Grábate y escucha tu pronunciación.", palabras_meta:30, fase:"Fondamenta", principio_cientifico:"Ley de Zipf: las 30 palabras de esta semana cubren el 40% del italiano oral cotidiano." },
  { semana_num:2, titulo:"Semana 2 – Moverse y estar bien", tema_principal:"Transporte y salud básica", objetivo_semana:"Comprar billetes de tren, orientarse en el transporte público, comunicarse en la farmacia", reto_semanal:"Planifica un viaje imaginario en tren desde tu ciudad a Roma. Escribe el diálogo completo en la taquilla.", palabras_meta:40, fase:"Fondamenta", principio_cientifico:"Input comprensible i+1: añadimos vocabulario situacional sobre la base consolidada de la semana 1." },
  { semana_num:3, titulo:"Semana 3 – Trabajar y gestionar dinero", tema_principal:"Trabajo y banca", objetivo_semana:"Hablar sobre empleo, mandar un CV, abrir una cuenta bancaria y hacer gestiones básicas", reto_semanal:"Escribe tu CV en italiano con 5 campos esenciales. Usa solo vocabulario conocido.", palabras_meta:50, fase:"Fondamenta", principio_cientifico:"Output desde el día 1: producir texto propio consolida vocabulario 3x más que solo leerlo." },
  { semana_num:4, titulo:"Semana 4 – Burocrazia e vita quotidiana", tema_principal:"Trámites y vida diaria", objetivo_semana:"Entender la burocracia italiana básica: codice fiscale, permesso di soggiorno. Compras cotidianas.", reto_semanal:"Simula que vas al municipio a pedir información. Prepara 5 preguntas clave en italiano.", palabras_meta:60, fase:"Fondamenta", principio_cientifico:"Metacognición: reflexiona qué palabras te cuestan más y agrégalas al SRS inmediatamente." },
  { semana_num:5, titulo:"Semana 5 – Vita in Appartamento", tema_principal:"Vivir en un piso", objetivo_semana:"Negociar un contrato de alquiler, hablar con vecinos, gestionar servicios básicos", reto_semanal:"Redacta un email al propietario pidiendo información sobre el piso que viste en un anuncio.", palabras_meta:75, fase:"Vita Quotidiana", principio_cientifico:"Lectura extensiva: con 75 palabras ya puedes entender el 65% de un contrato de alquiler simple." },
  { semana_num:6, titulo:"Semana 6 – Cucina Italiana", tema_principal:"Cocina y alimentación", objetivo_semana:"Ir al mercado, cocinar, hablar de ingredientes y recetas, comer en casa de italianos", reto_semanal:"Explica en italiano cómo se prepara tu plato favorito. Mínimo 10 oraciones.", palabras_meta:90, fase:"Vita Quotidiana", principio_cientifico:"Vocabulario temático: aprender palabras por campo semántico aumenta la retención un 40%." },
  { semana_num:7, titulo:"Semana 7 – Relazioni Sociali", tema_principal:"Relaciones y amistades", objetivo_semana:"Hacer amigos, invitar a alguien, rechazar cortésmente, hablar de gustos y opiniones", reto_semanal:"Inicia una conversación en el módulo Habla sobre 'incontro con un vicino'. Mínimo 10 turnos.", palabras_meta:110, fase:"Vita Quotidiana", principio_cientifico:"Hablar desde el principio: el output activa circuitos emocionales que refuerzan la memoria." },
  { semana_num:8, titulo:"Semana 8 – Media e Cultura Italiana", tema_principal:"Medios y cultura", objetivo_semana:"Hablar de películas, música, noticias. Seguir una conversación sobre actualidad básica.", reto_semanal:"Escucha 3 episodios de Coffee Break Italian y resume cada uno en 3 oraciones en italiano.", palabras_meta:130, fase:"Vita Quotidiana", principio_cientifico:"Input auditivo: el shadowing activa la memoria procedimental y mejora la fluidez oral." },
  { semana_num:9, titulo:"Semana 9 – Tempo Libero & Hobby", tema_principal:"Ocio y actividades de tiempo libre", objetivo_semana:"Hablar de deportes, hobbies, viajes y actividades recreativas habituales", reto_semanal:"Escribe un párrafo sobre cómo pasas tu fin de semana ideal en Italia.", palabras_meta:145, fase:"Vita Quotidiana", principio_cientifico:"Personalización: relacionar el vocabulario con tu vida real triplica las probabilidades de retención." },
  { semana_num:10, titulo:"Semana 10 – La Famiglia", tema_principal:"La familia y las relaciones", objetivo_semana:"Describir tu familia, hablar de relaciones, presentar a familiares", reto_semanal:"Dibuja tu árbol genealógico y descríbelo en italiano en 10 oraciones.", palabras_meta:160, fase:"Vita Quotidiana", principio_cientifico:"Vocabulario emocional: las palabras con carga afectiva se consolidan hasta 5x más rápido." },
  { semana_num:11, titulo:"Semana 11 – Corpo e Salute Avanzata", tema_principal:"El cuerpo y la salud", objetivo_semana:"Describir síntomas, comunicarse en el hospital, hablar de alergias y medicamentos", reto_semanal:"Prepara una lista de tus condiciones médicas y medicamentos en italiano para una cita médica real.", palabras_meta:175, fase:"Vita Quotidiana", principio_cientifico:"Vocabulario de supervivencia: los temas de salud tienen alta prioridad cognitiva." },
  { semana_num:12, titulo:"Semana 12 – Scuola e Istruzione", tema_principal:"Educación y aprendizaje", objetivo_semana:"Hablar sobre estudios, cursos de italiano, universidades y sistemas educativos", reto_semanal:"Escribe una carta de motivación en italiano para un curso de lengua en Florencia.", palabras_meta:190, fase:"Vita Quotidiana", principio_cientifico:"Metacognición aplicada: analiza tus propios errores más frecuentes y crea tarjetas específicas." },
  { semana_num:13, titulo:"Semana 13 – Grammatica in Contesto", tema_principal:"Verbos modales y gerundio", objetivo_semana:"Dominar potere/volere/dovere/sapere, y el gerundio progresivo en conversación fluida", reto_semanal:"Usa 5 verbos modales distintos en oraciones sobre tu vida diaria en Italia.", palabras_meta:205, fase:"Connessione", principio_cientifico:"Gramática inductiva: aprender la regla DESPUÉS del contexto consolida mejor que memorizar tablas." },
  { semana_num:14, titulo:"Semana 14 – Passato Prossimo", tema_principal:"El pasado: passato prossimo", objetivo_semana:"Narrar eventos pasados con essere y avere, usar marcadores temporales correctamente", reto_semanal:"Escribe un diario de 5 días con lo que 'hiciste' en Italia, usando passato prossimo.", palabras_meta:220, fase:"Connessione", principio_cientifico:"Narrativa personal: contar historias activa memorias episódicas más duraderas." },
  { semana_num:15, titulo:"Semana 15 – Imperfetto e Futuro", tema_principal:"El imperfecto y el futuro simple", objetivo_semana:"Contrastar passato prossimo vs imperfetto, y expresar planes futuros con certeza", reto_semanal:"Escribe: 3 párrafos sobre tu infancia (imperfetto) y 3 sobre tus planes en Italia (futuro).", palabras_meta:235, fase:"Connessione", principio_cientifico:"Interleaving: alternar tiempos verbales en una sesión mejora más la retención que practicarlos por separado." },
  { semana_num:16, titulo:"Semana 16 – Opinioni e Dibattito", tema_principal:"Expresar opiniones y debatir", objetivo_semana:"Dar y defender opiniones, estar de acuerdo o no, usar conectores argumentativos", reto_semanal:"Escribe un párrafo defendiendo una posición: '¿Vale la pena vivir en Italia?' en italiano.", palabras_meta:250, fase:"Connessione", principio_cientifico:"Output forzado: argumentar en L2 activa regiones del cerebro distintas a la simple comprensión." },
  { semana_num:17, titulo:"Semana 17 – Lavoro Avanzato", tema_principal:"Vocabulario laboral avanzado", objetivo_semana:"Hablar de contratos, derechos laborales, hacer networking y negociar condiciones", reto_semanal:"Prepara y practica con la IA una negociación salarial en italiano.", palabras_meta:265, fase:"Connessione", principio_cientifico:"Vocabulario especializado: aprender léxico profesional antes de buscarlo actúa como amortiguador de ansiedad." },
  { semana_num:18, titulo:"Semana 18 – Vita in Città", tema_principal:"La ciudad italiana y sus servicios", objetivo_semana:"Navegar por servicios urbanos: correos, comisaría, municipio, banco, calles y orientación avanzada", reto_semanal:"Simula con la IA un día completo de trámites en una ciudad italiana (3 servicios distintos).", palabras_meta:280, fase:"Connessione", principio_cientifico:"Simulación real: replicar situaciones auténticas produce transferencia de aprendizaje directa." },
  { semana_num:19, titulo:"Semana 19 – Emozioni e Relazioni", tema_principal:"Emociones, psicología y bienestar", objetivo_semana:"Expresar emociones complejas, hablar de relaciones, describir estados de ánimo con matiz", reto_semanal:"Escribe un email a un amigo italiano contando cómo te sientes con tu proceso de adaptación.", palabras_meta:295, fase:"Connessione", principio_cientifico:"Vocabulario emocional activa la amígdala, que refuerza la consolidación en la memoria a largo plazo." },
  { semana_num:20, titulo:"Semana 20 – Il Condizionale", tema_principal:"El condicional y los deseos", objetivo_semana:"Usar vorrei/potrei/dovrei con soltura, expresar deseos, hipótesis y sugerencias corteses", reto_semanal:"Prepara 10 oraciones que usarías en tu primer mes en Italia, usando el condizionale.", palabras_meta:310, fase:"Connessione", principio_cientifico:"Cortesía lingüística: el condizionale es la clave para sonar educado y profesional en italiano." },
  { semana_num:21, titulo:"Semana 21 – Argomentazione e Connettivi", tema_principal:"Argumentar y conectar ideas", objetivo_semana:"Usar connettivi avanzados (nonostante, benché, dunque), escribir párrafos argumentativos", reto_semanal:"Escribe una carta de opinión sobre el turismo en Italia. 150 palabras. Sin traducir del español.", palabras_meta:325, fase:"Connessione", principio_cientifico:"Complejidad sintáctica: el uso de conectores es el principal indicador de nivel B1 en el CEFR." },
  { semana_num:22, titulo:"Semana 22 – Natura e Territorio", tema_principal:"Naturaleza, geografía y clima italiano", objetivo_semana:"Hablar del territorio italiano, el clima, viajes a la naturaleza, consejos para visitar regiones", reto_semanal:"Describe en italiano tres regiones italianas que te gustaría visitar y por qué.", palabras_meta:340, fase:"Connessione", principio_cientifico:"Geografía lingüística: asociar palabras con lugares físicos crea anclas espaciales en la memoria." },
  { semana_num:23, titulo:"Semana 23 – Immersione: Input Nativo I", tema_principal:"Consumo de input auténtico", objetivo_semana:"Entender artículos reales, podcasts nativos y conversaciones espontáneas con apoyo mínimo", reto_semanal:"Lee un artículo real en italiano (rai.it o corriere.it) y resume el 70% sin diccionario.", palabras_meta:360, fase:"Immersione", principio_cientifico:"Krashen i+1 en nivel B1: el 5-10% de vocabulario desconocido es el rango óptimo de inmersión." },
  { semana_num:24, titulo:"Semana 24 – Vita Professionale B1", tema_principal:"Mundo laboral en italiano avanzado", objetivo_semana:"Redactar emails profesionales, participar en reuniones, hacer presentaciones cortas", reto_semanal:"Escribe un email formal en italiano solicitando información sobre una oferta de trabajo.", palabras_meta:375, fase:"Immersione", principio_cientifico:"Registro formal vs coloquial: reconocer ambos dobla la comprensión lectora auténtica." },
  { semana_num:25, titulo:"Semana 25 – Cultura e Arte Italiana", tema_principal:"El rico patrimonio cultural de Italia", objetivo_semana:"Hablar de arte, historia, personajes históricos, museos y expresiones culturales italianas", reto_semanal:"Prepara una mini-presentación oral de 2 minutos sobre un artista italiano de tu elección.", palabras_meta:390, fase:"Immersione", principio_cientifico:"Contenido de alta motivación: el interés personal aumenta un 62% la retención de vocabulario nuevo." },
  { semana_num:26, titulo:"Semana 26 – Economia e Attualità", tema_principal:"Economía, política y actualidad italiana", objetivo_semana:"Entender noticias económicas y políticas, opinar sobre temas de actualidad con vocabulario apropiado", reto_semanal:"Escucha 10 minutos de RAI News y escribe 5 cosas que entendiste sobre la actualidad italiana.", palabras_meta:405, fase:"Immersione", principio_cientifico:"Input auténtico: las noticias son el género más eficaz para adquirir vocabulario de alta frecuencia adulta." },
  { semana_num:27, titulo:"Semana 27 – Salute e Benessere B1", tema_principal:"Salud y bienestar en profundidad", objetivo_semana:"Hablar de nutrición, hábitos saludables, diagnósticos, y el sistema sanitario italiano", reto_semanal:"Escribe tu 'plan de vida saludable en Italia' en 150 palabras usando el vocabulario aprendido.", palabras_meta:420, fase:"Immersione", principio_cientifico:"Vocabulario de alta necesidad: la salud es el campo léxico más consultado por inmigrantes." },
  { semana_num:28, titulo:"Semana 28 – Tecnologia e Società", tema_principal:"Tecnología e impacto social", objetivo_semana:"Debatir sobre IA, redes sociales, privacidad y digitalización con vocabulario contemporáneo", reto_semanal:"Debate con la IA sobre las ventajas y desventajas de la IA en la sociedad. Mínimo 15 turnos.", palabras_meta:435, fase:"Immersione", principio_cientifico:"Debate como output: argumentar activa 3x más conexiones neuronales que escuchar la misma información." },
  { semana_num:29, titulo:"Semana 29 – Espressioni Idiomatiche", tema_principal:"Modismos y expresiones auténticas", objetivo_semana:"Dominar 20 expresiones idiomáticas italianas del habla cotidiana para sonar nativo", reto_semanal:"Usa 5 expresiones idiomáticas en conversaciones reales o simuladas. Escríbelas en contexto.", palabras_meta:450, fase:"Immersione", principio_cientifico:"Las expresiones fijas son procesadas en el hemisferio derecho: dominarlas acelera la fluidez global un 30%." },
  { semana_num:30, titulo:"Semana 30 – Traguardo B1! 🎉", tema_principal:"Fluencia y celebración del camino", objetivo_semana:"Demostrar nivel B1 real: narrar, argumentar, improvisar y conversar con fluidez natural en italiano", reto_semanal:"Grábate hablando 3 minutos en italiano sobre tu experiencia de aprendizaje. Compáralo con tu primera grabación.", palabras_meta:600, fase:"Immersione", principio_cientifico:"El output libre al final del programa es la mejor medida del aprendizaje real: activa metacognición y autoevaluación." },
];

// ─── SEED PLANES DIARIOS (90 días, 3 por semana) ──────────────────────────
const SEED_DIARIOS = [
  // SEMANA 1
  { semana_num:1, dia_num:1, titulo_dia:"S1D1 – Saluti e Presentazioni", tema:"Saludos y presentaciones", actividad_srs:"Estudia las 10 tarjetas de saluti. Escúchalas con 🔊 y repite cada una 3 veces en voz alta.", actividad_input:"Escucha 'Italiano In Tre Minuti – Lesson 1: Nice to Meet You' en YouTube (3 min).", actividad_output:"Practica el escenario 'Presentarsi' con la IA. Objetivo: saludar y presentarte naturalmente.", tarea_dia:"Preséntate en voz alta como si conocieras a alguien en Italia. Hazlo 5 veces.", frase_clave_it:"Ciao, mi chiamo... piacere di conoscerti!", frase_clave_es:"Hola, me llamo... ¡encantado de conocerte!" },
  { semana_num:1, dia_num:2, titulo_dia:"S1D2 – Numeri e Colori", tema:"Números y colores", actividad_srs:"Repasa las tarjetas del día 1 + estudia las 6 tarjetas de numeri/colori nuevas.", actividad_input:"Coffee Break Italian – Season 1 Ep.1. Anota 3 palabras nuevas que escuches.", actividad_output:"Di en voz alta: precios en euros (5€, 12€, 35€, 100€). Luego el color de 5 objetos cerca de ti.", tarea_dia:"Mira una tienda online italiana (zalando.it) y practica diciendo precios y colores en voz alta.", frase_clave_it:"Quanto costa? Costa venti euro.", frase_clave_es:"¿Cuánto cuesta? Cuesta veinte euros." },
  { semana_num:1, dia_num:3, titulo_dia:"S1D3 – Orientarsi in Città", tema:"Orientarse en la ciudad", actividad_srs:"Repasa todo el mazo acumulado. Agrega las 6 palabras de orientamento.", actividad_input:"YouTube: 'Italian for Beginners – Directions' (5 min). Activa subtítulos en italiano.", actividad_output:"Escenario 'In Città' con la IA: pregunta cómo llegar a 3 lugares distintos.", tarea_dia:"Abre Google Maps de Florencia y di en italiano dónde están 5 lugares turísticos.", frase_clave_it:"Scusi, dove si trova la stazione? Vai dritto, poi a destra.", frase_clave_es:"Disculpe, ¿dónde está la estación? Vaya recto, luego a la derecha." },
  { semana_num:1, dia_num:4, titulo_dia:"S1D4 – Al Ristorante", tema:"En el restaurante", actividad_srs:"Repaso + 5 tarjetas nuevas de ristorante. Escucha los ejemplos con 🔊.", actividad_input:"Busca en YouTube 'ordinare al ristorante' y mira un video de 5 min.", actividad_output:"Escenario 'Al Ristorante' completo con la IA: pide entrada, plato, bebida y paga.", tarea_dia:"Mira el menú real de 'Da Ivo' en Florencia (online) y pide un plato completo en voz alta.", frase_clave_it:"Vorrei una pasta al pomodoro e acqua naturale. Il conto, per favore!", frase_clave_es:"Quisiera una pasta con tomate y agua sin gas. ¡La cuenta, por favor!" },
  { semana_num:1, dia_num:5, titulo_dia:"S1D5 – Cercare Casa", tema:"Buscar apartamento", actividad_srs:"Repaso + 5 tarjetas de casa. Enfócate en frases completas.", actividad_input:"Lee el texto 'Cerco Casa' en Lecturas. Guarda 3 palabras del glosario.", actividad_output:"Escenario 'Cercare Casa' con la IA: simula llamar al propietario y preguntar por el piso.", tarea_dia:"Busca un anuncio real en immobiliare.it y describe el piso en 5 oraciones en italiano.", frase_clave_it:"Vorrei affittare un appartamento. Quanto è l'affitto mensile?", frase_clave_es:"Quisiera alquilar un apartamento. ¿Cuánto es el alquiler mensual?" },
  { semana_num:1, dia_num:6, titulo_dia:"S1D6 – Revisione Semana 1", tema:"Repaso general semana 1", actividad_srs:"Sesión SRS completa con todas las tarjetas. Sin agregar nuevas hoy.", actividad_input:"Podcast One Minute Italian: escucha 5 episodios (5 min total).", actividad_output:"Haz el Quiz completo. Anota qué palabras fallaste para reforzarlas.", tarea_dia:"Grábate: mini-monólogo de 1 minuto. Preséntate, di dónde vives, pide algo en un restaurante.", frase_clave_it:"Non capisco. Può parlare più lentamente? Ho bisogno di aiuto.", frase_clave_es:"No entiendo. ¿Puede hablar más despacio? Necesito ayuda." },
  // SEMANA 2
  { semana_num:2, dia_num:1, titulo_dia:"S2D1 – In Treno", tema:"En el tren / transporte", actividad_srs:"Repaso semana 1 + 5 tarjetas nuevas de trasporti.", actividad_input:"Lee el texto 'In Treno' en Lecturas. Toca las palabras marcadas.", actividad_output:"Practica comprar un billete de tren con la IA (Florencia → Roma).", tarea_dia:"Busca un horario real en trenitalia.com y di en italiano: hora de salida, destino, binario.", frase_clave_it:"Un biglietto per Firenze, andata e ritorno. A che ora parte?", frase_clave_es:"Un billete para Florencia, ida y vuelta. ¿A qué hora sale?" },
  { semana_num:2, dia_num:2, titulo_dia:"S2D2 – Dal Medico", tema:"En el médico / farmacia", actividad_srs:"Repaso + 5 tarjetas de salute.", actividad_input:"Lee el texto 'Dal Medico' en Lecturas. Guarda todas las palabras del glosario.", actividad_output:"Escenario 'Dal Medico' con la IA: describe tus síntomas y entiende las instrucciones.", tarea_dia:"Prepara 5 oraciones sobre síntomas comunes usando 'Ho mal di...' y 'Ho la febbre...'", frase_clave_it:"Ho mal di gola e la febbre da ieri. Ho bisogno di un medico.", frase_clave_es:"Me duele la garganta y tengo fiebre desde ayer. Necesito un médico." },
  { semana_num:2, dia_num:3, titulo_dia:"S2D3 – L'Autobus e la Metro", tema:"Autobús y metro", actividad_srs:"Repaso acumulado + 4 palabras nuevas de trasporti urbani.", actividad_input:"Coffee Break Italian S1 Ep.3. Escucha y repite las frases de transporte.", actividad_output:"Escenario libre con la IA: cómo ir del Coliseo al Vaticano en metro.", tarea_dia:"Planifica en italiano cómo irías desde el Coliseo al Vaticano usando metro y autobús.", frase_clave_it:"Quale autobus va al centro? Dove devo scendere?", frase_clave_es:"¿Qué autobús va al centro? ¿Dónde debo bajarme?" },
  // SEMANA 3
  { semana_num:3, dia_num:1, titulo_dia:"S3D1 – Cercare Lavoro", tema:"Buscar trabajo en Italia", actividad_srs:"Repaso + 5 tarjetas de lavoro.", actividad_input:"Lee el texto 'Il Colloquio' en Lecturas. Anota frases clave.", actividad_output:"Simula una entrevista de trabajo con la IA. Presenta tus habilidades en italiano.", tarea_dia:"Escribe tu experiencia laboral en 5 oraciones en italiano. Sin traducir del español.", frase_clave_it:"Ho esperienza nel settore informatico. Quando posso iniziare?", frase_clave_es:"Tengo experiencia en el sector informático. ¿Cuándo puedo empezar?" },
  { semana_num:3, dia_num:2, titulo_dia:"S3D2 – In Banca", tema:"En el banco", actividad_srs:"Repaso + 4 tarjetas de banca.", actividad_input:"YouTube: 'Aprire un conto in banca in Italia' – busca un video explicativo.", actividad_output:"Escenario 'In Banca' con la IA: abre una cuenta corriente y pregunta por los servicios.", tarea_dia:"Escribe en italiano los 5 datos que necesitas para abrir una cuenta bancaria en Italia.", frase_clave_it:"Vorrei aprire un conto corrente. Quali documenti servono?", frase_clave_es:"Quisiera abrir una cuenta corriente. ¿Qué documentos necesito?" },
  { semana_num:3, dia_num:3, titulo_dia:"S3D3 – Lo Stipendio e i Colleghi", tema:"El sueldo y compañeros", actividad_srs:"Repaso + 4 tarjetas de lavoro avanzado.", actividad_input:"Lee artículo sobre el mercato del lavoro italiano (cerca en rai.it).", actividad_output:"Habla con la IA sobre tu trabajo ideal en Italia: sector, horario, salario.", tarea_dia:"Calcula en italiano cuánto sería tu presupuesto mensual viviendo en Milano.", frase_clave_it:"Il mio lavoro ideale è nel settore del marketing con un buono stipendio.", frase_clave_es:"Mi trabajo ideal es en el sector del marketing con un buen sueldo." },
  // SEMANA 4
  { semana_num:4, dia_num:1, titulo_dia:"S4D1 – Il Codice Fiscale", tema:"El código fiscal italiano", actividad_srs:"Repaso + 5 tarjetas de burocrazia.", actividad_input:"Busca en YouTube cómo se obtiene el codice fiscale para extranjeros.", actividad_output:"Escenario 'All'Ufficio' con la IA: simula pedir el codice fiscale al municipio.", tarea_dia:"Escribe paso a paso (en italiano) cómo pedirías el codice fiscale.", frase_clave_it:"Ho bisogno del codice fiscale. Come posso richiederlo?", frase_clave_es:"Necesito el código fiscal. ¿Cómo puedo solicitarlo?" },
  { semana_num:4, dia_num:2, titulo_dia:"S4D2 – Il Permesso di Soggiorno", tema:"Permiso de residencia", actividad_srs:"Repaso + 4 tarjetas de documenti.", actividad_input:"Lee el texto 'Burocrazia Italiana' en Lecturas.", actividad_output:"Habla con la IA sobre los documentos que necesita un extranjero en Italia.", tarea_dia:"Prepara una checklist en italiano de todos los documentos para vivir en Italia.", frase_clave_it:"Devo richiedere il permesso di soggiorno. Dove devo andare?", frase_clave_es:"Necesito solicitar el permiso de residencia. ¿Dónde debo ir?" },
  { semana_num:4, dia_num:3, titulo_dia:"S4D3 – La Spesa al Mercato", tema:"Hacer la compra en el mercado", actividad_srs:"Repaso + 5 tarjetas de quotidiano.", actividad_input:"YouTube: recorre virtualmente el Mercato Centrale di Firenze (10 min).", actividad_output:"Escenario 'Al Mercato' con la IA: compra ingredientes para una receta italiana.", tarea_dia:"Escribe tu lista de la compra de la semana completa en italiano.", frase_clave_it:"Quanto costa il chilo di pomodori? Me ne dia due chili, per favore.", frase_clave_es:"¿Cuánto cuesta el kilo de tomates? Deme dos kilos, por favor." },
  // SEMANA 5
  { semana_num:5, dia_num:1, titulo_dia:"S5D1 – Contratto d'Affitto", tema:"Contrato de alquiler", actividad_srs:"Repaso + 5 tarjetas de casa avanzada.", actividad_input:"Busca un contrato de alquiler real en italiano (template online) y lee el primer párrafo.", actividad_output:"Negocia el alquiler con la IA: precio, condiciones, duración del contrato.", tarea_dia:"Escribe 5 cláusulas importantes que pondrías en tu contrato de alquiler ideal.", frase_clave_it:"L'appartamento è arredato? Il deposito è di due mesi?", frase_clave_es:"¿El apartamento está amueblado? ¿La fianza es de dos meses?" },
  { semana_num:5, dia_num:2, titulo_dia:"S5D2 – I Vicini di Casa", tema:"Los vecinos de casa", actividad_srs:"Repaso + 4 tarjetas de relazioni/casa.", actividad_input:"Lee el texto 'Nel Condominio' en Lecturas.", actividad_output:"Escenario con la IA: conoce a tus nuevos vecinos en el condominio.", tarea_dia:"Escribe un correo al administrador del condominio presentándote como nuevo inquilino.", frase_clave_it:"Piacere, sono il nuovo inquilino dell'appartamento al terzo piano.", frase_clave_es:"Mucho gusto, soy el nuevo inquilino del apartamento en el tercer piso." },
  { semana_num:5, dia_num:3, titulo_dia:"S5D3 – Gestire i Servizi", tema:"Gestionar servicios del hogar", actividad_srs:"Sesión SRS completa semana 5.", actividad_input:"Coffee Break Italian S1 Ep.5. Repite cada frase del episodio.", actividad_output:"Habla con la IA sobre problemas típicos en un appartamento (calefacción, agua, luz).", tarea_dia:"Escribe un email al propietario reportando un problema con la calefacción.", frase_clave_it:"Il riscaldamento non funziona. Può chiamare il tecnico?", frase_clave_es:"La calefacción no funciona. ¿Puede llamar al técnico?" },
  // SEMANA 6
  { semana_num:6, dia_num:1, titulo_dia:"S6D1 – La Cucina Italiana", tema:"La cocina italiana", actividad_srs:"Repaso + 5 tarjetas de cucina.", actividad_input:"Lee el texto 'La Ricetta della Carbonara' en Lecturas.", actividad_output:"Explica con la IA cómo preparas tu plato favorito paso a paso.", tarea_dia:"Escribe la receta de un plato latinoamericano en italiano.", frase_clave_it:"Prima soffriggi la cipolla con olio. Poi aggiungi i pomodori.", frase_clave_es:"Primero sofríes la cebolla con aceite. Luego añades los tomates." },
  { semana_num:6, dia_num:2, titulo_dia:"S6D2 – Al Supermercato", tema:"En el supermercado", actividad_srs:"Repaso + 5 tarjetas de alimentazione.", actividad_input:"YouTube: recorre un supermercato italiano online. Anota 10 productos.", actividad_output:"Escenario supermercado con la IA: encuentra productos, pregunta precios.", tarea_dia:"Escribe una lista de la compra completa para preparar una carbonara (ingredientes en italiano).", frase_clave_it:"Scusi, dove trovo la pasta? C'è la mozzarella fresca?", frase_clave_es:"Disculpe, ¿dónde encuentro la pasta? ¿Hay mozzarella fresca?" },
  { semana_num:6, dia_num:3, titulo_dia:"S6D3 – Cibo e Cultura", tema:"Comida y cultura italiana", actividad_srs:"Sesión SRS completa semana 6.", actividad_input:"Lee el texto 'La Gastronomia Italiana' en Lecturas.", actividad_output:"Debate con la IA: ¿la cocina italiana es la mejor del mundo? Defiende tu posición.", tarea_dia:"Escribe un párrafo comparando la gastronomía italiana con la latinoamericana.", frase_clave_it:"La cucina italiana è famosa in tutto il mondo per la sua semplicità.", frase_clave_es:"La cocina italiana es famosa en todo el mundo por su simplicidad." },
  // SEMANA 7
  { semana_num:7, dia_num:1, titulo_dia:"S7D1 – Fare Amicizia", tema:"Hacer amistades", actividad_srs:"Repaso + 5 tarjetas de relazioni sociali.", actividad_input:"Podcast: The Italian Experiment – episodio sobre fare amicizia.", actividad_output:"Escenario con la IA: conoce a alguien nuevo en un bar italiano.", tarea_dia:"Escribe un mensaje de texto en italiano invitando a un amigo nuevo al cine.", frase_clave_it:"Vuoi venire al cinema con me venerdì sera?", frase_clave_es:"¿Quieres venir al cine conmigo el viernes por la noche?" },
  { semana_num:7, dia_num:2, titulo_dia:"S7D2 – Invitare e Declinare", tema:"Invitar y rechazar cortésmente", actividad_srs:"Repaso + 5 tarjetas de espressioni sociali.", actividad_input:"Coffee Break Italian S1 Ep.7 – escuchar frases de invitación.", actividad_output:"Practica con la IA: recibe y declina 3 invitaciones diferentes de forma educada.", tarea_dia:"Escribe 5 formas distintas de rechazar cortésmente una invitación en italiano.", frase_clave_it:"Mi dispiace, non posso venire. Forse un'altra volta?", frase_clave_es:"Lo siento, no puedo venir. ¿Quizás otra vez?" },
  { semana_num:7, dia_num:3, titulo_dia:"S7D3 – Parlare di Gusti", tema:"Hablar de gustos", actividad_srs:"Sesión SRS completa semana 7.", actividad_input:"Lee el texto 'Gli Italiani e la Musica' en Lecturas.", actividad_output:"Habla con la IA sobre tus gustos: música, cine, comida, viajes.", tarea_dia:"Escribe 10 oraciones sobre lo que te gusta y no te gusta de Italia.", frase_clave_it:"Mi piace molto la musica italiana. Non mi piace alzarmi presto.", frase_clave_es:"Me gusta mucho la música italiana. No me gusta levantarme temprano." },
  // SEMANA 8
  { semana_num:8, dia_num:1, titulo_dia:"S8D1 – Il Cinema Italiano", tema:"El cine y los medios", actividad_srs:"Repaso + 5 tarjetas de media/cultura.", actividad_input:"Lee el texto 'Cinema Italiano' en Lecturas.", actividad_output:"Habla con la IA sobre una película italiana que hayas visto o que te gustaría ver.", tarea_dia:"Escribe la sinopsis de tu película favorita en italiano (8 oraciones).", frase_clave_it:"Ho visto un film bellissimo. La trama è emozionante.", frase_clave_es:"Vi una película bellísima. La trama es emocionante." },
  { semana_num:8, dia_num:2, titulo_dia:"S8D2 – La Musica e i Social", tema:"La música y las redes sociales", actividad_srs:"Repaso + 5 tarjetas de tecnologia/media.", actividad_input:"Escucha 'Azzurro' de Adriano Celentano. Lee la letra con traducción.", actividad_output:"Habla con la IA sobre tus redes sociales favoritas y cómo las usas.", tarea_dia:"Escribe un post de Instagram en italiano sobre tu día en Italia (ficticio).", frase_clave_it:"Mi piace ascoltare la musica italiana mentre faccio sport.", frase_clave_es:"Me gusta escuchar música italiana mientras hago deporte." },
  { semana_num:8, dia_num:3, titulo_dia:"S8D3 – Quiz e Revisione Semana 8", tema:"Repaso semanas 5-8", actividad_srs:"Sesión SRS completa. Prioriza tarjetas con calificación 'Mal'.", actividad_input:"News in Slow Italian Beginner Ep.1 (10 min). Anota 5 palabras nuevas.", actividad_output:"Conversación libre con la IA de 5 minutos sobre cualquier tema que quieras.", tarea_dia:"Escribe un párrafo de 8 oraciones sobre tu semana imaginaria en Italia.", frase_clave_it:"Questa settimana ho imparato molto. Posso comunicare meglio in italiano!", frase_clave_es:"Esta semana aprendí mucho. ¡Puedo comunicarme mejor en italiano!" },
  // SEMANAS 9-12 (condensadas)
  { semana_num:9, dia_num:1, titulo_dia:"S9D1 – Lo Sport", tema:"Los deportes", actividad_srs:"Repaso + 5 tarjetas de sport/hobby.", actividad_input:"Lee el texto 'Lo Sport in Italia' en Lecturas.", actividad_output:"Habla con la IA sobre deportes: cuáles practicas, cuáles te gustan.", tarea_dia:"Escribe el calendario de tu semana deportiva ideal en Italia.", frase_clave_it:"Gioco a calcio ogni martedì e giovedì. È il mio sport preferito.", frase_clave_es:"Juego fútbol cada martes y jueves. Es mi deporte favorito." },
  { semana_num:9, dia_num:2, titulo_dia:"S9D2 – Viaggiare in Italia", tema:"Viajar por Italia", actividad_srs:"Repaso + 5 tarjetas de viaggio.", actividad_input:"YouTube: documental sobre las regiones de Italia (10 min).", actividad_output:"Planifica con la IA un viaje de 2 semanas por Italia.", tarea_dia:"Escribe el itinerario de tu viaje soñado por Italia.", frase_clave_it:"Prima vado a Roma, poi a Firenze e infine a Venezia.", frase_clave_es:"Primero voy a Roma, luego a Florencia y finalmente a Venecia." },
  { semana_num:9, dia_num:3, titulo_dia:"S9D3 – Hobby e Passioni", tema:"Hobbies y pasiones", actividad_srs:"Sesión SRS completa semana 9.", actividad_input:"Lee el texto 'Un Fine Settimana Perfetto' en Lecturas.", actividad_output:"Habla con la IA de tus hobbies y cómo los practicarías viviendo en Italia.", tarea_dia:"Describe tu fin de semana ideal en Toscana en 10 oraciones.", frase_clave_it:"Nel tempo libero mi piace leggere e fare passeggiate in campagna.", frase_clave_es:"En mi tiempo libre me gusta leer y pasear por el campo." },
  { semana_num:10, dia_num:1, titulo_dia:"S10D1 – La Famiglia Italiana", tema:"La familia italiana", actividad_srs:"Repaso + 6 tarjetas de famiglia.", actividad_input:"Lee el texto 'Una Famiglia Italiana' en Lecturas.", actividad_output:"Describe tu familia con la IA usando el vocabulario aprendido.", tarea_dia:"Dibuja y describe tu árbol genealógico en italiano (8 oraciones).", frase_clave_it:"Ho due fratelli e una sorella. Mia madre si chiama Elena.", frase_clave_es:"Tengo dos hermanos y una hermana. Mi madre se llama Elena." },
  { semana_num:10, dia_num:2, titulo_dia:"S10D2 – Relazioni e Sentimenti", tema:"Relaciones y sentimientos", actividad_srs:"Repaso + 4 tarjetas de famiglia/relazioni.", actividad_input:"Coffee Break Italian S1 Ep.10. Anota expresiones sobre la familia.", actividad_output:"Habla con la IA sobre las tradiciones familiares italianas vs latinoamericanas.", tarea_dia:"Escribe una carta a un familiar en italiano describiendo cómo va tu vida en Italia.", frase_clave_it:"La mia famiglia mi manca molto. Ma sono felice qui in Italia.", frase_clave_es:"Echo mucho de menos a mi familia. Pero estoy feliz aquí en Italia." },
  { semana_num:10, dia_num:3, titulo_dia:"S10D3 – Le Tradizioni Italiane", tema:"Las tradiciones italianas", actividad_srs:"Sesión SRS completa semana 10.", actividad_input:"Lee sobre el Natale italiano o la Pasqua en rai.it.", actividad_output:"Habla con la IA sobre las diferencias entre las fiestas italianas y las de tu país.", tarea_dia:"Escribe 8 oraciones sobre una tradición italiana que te llame la atención.", frase_clave_it:"In Italia il Natale è una festa molto importante per la famiglia.", frase_clave_es:"En Italia la Navidad es una fiesta muy importante para la familia." },
  { semana_num:11, dia_num:1, titulo_dia:"S11D1 – Il Corpo Umano", tema:"El cuerpo humano", actividad_srs:"Repaso + 6 tarjetas de corpo.", actividad_input:"YouTube: video sobre il corpo umano in italiano (5 min).", actividad_output:"Describe con la IA un dolor o malestar y pregunta qué hacer.", tarea_dia:"Escribe una descripción física de una persona (10 características) en italiano.", frase_clave_it:"Mi fa male il ginocchio. Penso di aver bisogno di un medico.", frase_clave_es:"Me duele la rodilla. Creo que necesito un médico." },
  { semana_num:11, dia_num:2, titulo_dia:"S11D2 – In Ospedale", tema:"En el hospital", actividad_srs:"Repaso + 5 tarjetas de salute avanzata.", actividad_input:"Lee el texto 'All'Ospedale' en Lecturas.", actividad_output:"Escenario 'Pronto Soccorso' con la IA: describe una emergencia médica.", tarea_dia:"Escribe tu historial médico básico en italiano (alergias, enfermedades, medicamentos).", frase_clave_it:"Ho un'allergia ai farmaci. Sono allergico alla penicillina.", frase_clave_es:"Tengo alergia a los medicamentos. Soy alérgico a la penicilina." },
  { semana_num:11, dia_num:3, titulo_dia:"S11D3 – Stare Bene", tema:"Bienestar y salud preventiva", actividad_srs:"Sesión SRS completa semana 11.", actividad_input:"Podcast: Radio3 Scienza – episodio sobre alimentación saludable.", actividad_output:"Debate con la IA: ¿cuál es el secreto de la longevidad de los italianos?", tarea_dia:"Escribe tu plan de hábitos saludables en Italia (dieta, ejercicio, descanso).", frase_clave_it:"Per stare bene bisogna mangiare bene, dormire e fare sport.", frase_clave_es:"Para estar bien hay que comer bien, dormir y hacer deporte." },
  { semana_num:12, dia_num:1, titulo_dia:"S12D1 – La Scuola Italiana", tema:"El sistema educativo italiano", actividad_srs:"Repaso + 5 tarjetas de istruzione.", actividad_input:"Lee el texto 'Studiare in Italia' en Lecturas.", actividad_output:"Habla con la IA sobre el sistema escolar italiano y el tuyo.", tarea_dia:"Escribe una carta de presentación para inscribirte en un curso de italiano.", frase_clave_it:"Voglio iscrivermi a un corso di italiano. Quali documenti servono?", frase_clave_es:"Quiero inscribirme en un curso de italiano. ¿Qué documentos necesito?" },
  { semana_num:12, dia_num:2, titulo_dia:"S12D2 – Studiare e Imparare", tema:"Estudiar y aprender idiomas", actividad_srs:"Repaso + 5 tarjetas de istruzione/grammatica.", actividad_input:"Coffee Break Italian S2 Ep.1. Toma nota de las estructuras gramaticales.", actividad_output:"Habla con la IA sobre tus técnicas de aprendizaje del italiano.", tarea_dia:"Escribe 10 consejos para aprender italiano rápido (según tu experiencia hasta ahora).", frase_clave_it:"Studio l'italiano ogni giorno per trenta minuti. Faccio progressi!", frase_clave_es:"Estudio italiano cada día durante treinta minutos. ¡Estoy progresando!" },
  { semana_num:12, dia_num:3, titulo_dia:"S12D3 – Revisione A1 Completo", tema:"Repaso nivel A1 completo", actividad_srs:"Sesión SRS maratón: todas las tarjetas acumuladas.", actividad_input:"News in Slow Italian Beginner Ep.5. ¿Cuánto entiendes?", actividad_output:"Habla con la IA 10 minutos sobre cualquier tema. Mide tu fluidez.", tarea_dia:"Grábate: 2 minutos hablando sobre tu vida en Italia. Compara con S1D6.", frase_clave_it:"Sono a livello A1! Ho imparato tantissimo. Continuo a studiare!", frase_clave_es:"¡Estoy en nivel A1! Aprendí muchísimo. ¡Sigo estudiando!" },
  // SEMANAS 13-22 (fases Connessione)
  { semana_num:13, dia_num:1, titulo_dia:"S13D1 – Verbi Modali", tema:"Verbos modales en contexto", actividad_srs:"Repaso + 5 tarjetas de grammatica.", actividad_input:"Lee el texto 'Una Giornata con i Modali' en Lecturas.", actividad_output:"Escenario con la IA: usa potere/volere/dovere/sapere en 15 frases distintas.", tarea_dia:"Escribe tu día de mañana usando los 4 verbos modales distintos.", frase_clave_it:"Devo andare al lavoro, ma voglio restare a casa. Posso farlo domani?", frase_clave_es:"Debo ir al trabajo, pero quiero quedarme en casa. ¿Puedo hacerlo mañana?" },
  { semana_num:13, dia_num:2, titulo_dia:"S13D2 – Stare + Gerundio", tema:"El gerundio italiano", actividad_srs:"Repaso + 4 tarjetas de grammatica.", actividad_input:"Coffee Break Italian S2 Ep.3. Ejercicios con il gerundio.", actividad_output:"Describe acciones en curso con la IA usando stare + gerundio.", tarea_dia:"Escribe 10 oraciones describiendo qué estás haciendo a distintas horas del día.", frase_clave_it:"Sto imparando l'italiano e mi sto divertendo molto!", frase_clave_es:"Estoy aprendiendo italiano y ¡me estoy divirtiendo mucho!" },
  { semana_num:13, dia_num:3, titulo_dia:"S13D3 – Grammatica Viva", tema:"Gramática aplicada", actividad_srs:"Sesión SRS completa semana 13.", actividad_input:"Lee el texto 'La Grammatica in Cucina' en Lecturas (usamos verbos modales).", actividad_output:"Quiz gramatical con la IA: ella señala tus errores y los corriges.", tarea_dia:"Escribe un diálogo de 15 líneas entre dos amigos usando verbos modales.", frase_clave_it:"Non so cucinare ma so ballare. Posso insegnarti?", frase_clave_es:"No sé cocinar pero sé bailar. ¿Puedo enseñarte?" },
  { semana_num:14, dia_num:1, titulo_dia:"S14D1 – Ieri e l'Altro Ieri", tema:"El passato prossimo", actividad_srs:"Repaso + 5 tarjetas de tempo/grammatica.", actividad_input:"YouTube: video explicativo sobre passato prossimo (7 min).", actividad_output:"Cuéntale a la IA qué hiciste ayer, usando passato prossimo.", tarea_dia:"Escribe el diario de ayer usando passato prossimo (10 oraciones).", frase_clave_it:"Ieri sono andato al mercato e ho comprato della frutta fresca.", frase_clave_es:"Ayer fui al mercado y compré fruta fresca." },
  { semana_num:14, dia_num:2, titulo_dia:"S14D2 – La Settimana Scorsa", tema:"Narrar el pasado reciente", actividad_srs:"Repaso + 5 tarjetas de passato.", actividad_input:"Coffee Break Italian S2 Ep.5. Escucha cómo hablan del pasado.", actividad_output:"Cuenta a la IA la semana pasada completa: qué hiciste cada día.", tarea_dia:"Escribe un resumen de la semana pasada en 15 oraciones con passato prossimo.", frase_clave_it:"La settimana scorsa ho lavorato molto e poi sono andato al mare.", frase_clave_es:"La semana pasada trabajé mucho y luego fui al mar." },
  { semana_num:14, dia_num:3, titulo_dia:"S14D3 – Mai / Già / Ancora", tema:"Adverbios de tiempo con passato", actividad_srs:"Sesión SRS completa semana 14.", actividad_input:"Lee el texto 'Esperienze di Vita' en Lecturas.", actividad_output:"Habla con la IA sobre experiencias: ¿qué nunca has hecho? ¿Qué ya has hecho en Italia?", tarea_dia:"Escribe una lista: 5 cosas que ya has hecho / 5 que nunca has hecho en Italia.", frase_clave_it:"Non sono mai stato a Venezia. È ancora nella mia lista!", frase_clave_es:"Nunca he estado en Venecia. ¡Todavía está en mi lista!" },
  { semana_num:15, dia_num:1, titulo_dia:"S15D1 – Da Bambino (Imperfetto)", tema:"El imperfecto italiano", actividad_srs:"Repaso + 5 tarjetas de grammatica/tempo.", actividad_input:"YouTube: differenza tra passato prossimo e imperfetto (8 min).", actividad_output:"Cuéntale a la IA tu infancia usando el imperfecto: donde vivías, qué hacías.", tarea_dia:"Escribe un párrafo sobre tu infancia en imperfetto (10 oraciones).", frase_clave_it:"Da bambino abitavo in Colombia. Giocavo sempre fuori con gli amici.", frase_clave_es:"De niño vivía en Colombia. Siempre jugaba afuera con los amigos." },
  { semana_num:15, dia_num:2, titulo_dia:"S15D2 – Il Futuro Semplice", tema:"El futuro en italiano", actividad_srs:"Repaso + 5 tarjetas de futuro.", actividad_input:"Coffee Break Italian S2 Ep.8. Escucha frases en futuro.", actividad_output:"Habla con la IA sobre tus planes para los próximos 6 meses en Italia.", tarea_dia:"Escribe tu plan de vida en Italia para el próximo año (15 oraciones en futuro).", frase_clave_it:"L'anno prossimo parlerò italiano fluentemente e avrò un lavoro stabile.", frase_clave_es:"El año próximo hablaré italiano con fluidez y tendré un trabajo estable." },
  { semana_num:15, dia_num:3, titulo_dia:"S15D3 – Se + Futuro", tema:"Oraciones condicionales con futuro", actividad_srs:"Sesión SRS completa semana 15.", actividad_input:"Lee el texto 'Sogni e Progetti' en Lecturas.", actividad_output:"Debate con la IA: ¿qué harás si consigues un buen trabajo en Italia?", tarea_dia:"Escribe 10 oraciones condicionales sobre tu futuro en Italia.", frase_clave_it:"Se troverò un buon lavoro, mi trasferirò definitivamente in Italia.", frase_clave_es:"Si encuentro un buen trabajo, me mudaré definitivamente a Italia." },
  { semana_num:16, dia_num:1, titulo_dia:"S16D1 – Dare Opinioni", tema:"Expresar opiniones", actividad_srs:"Repaso + 5 tarjetas de opinioni.", actividad_input:"News in Slow Italian Intermediate Ep.1. Anota las opiniones que escuchas.", actividad_output:"Debate con la IA: ¿Cuál es la ciudad italiana más bella? Defiende tu opinión.", tarea_dia:"Escribe un párrafo de opinión sobre el sistema de transporte italiano.", frase_clave_it:"Secondo me, Milano è la città più moderna d'Italia. Sei d'accordo?", frase_clave_es:"Según yo, Milán es la ciudad más moderna de Italia. ¿Estás de acuerdo?" },
  { semana_num:16, dia_num:2, titulo_dia:"S16D2 – Dibattito Libero", tema:"Debate libre en italiano", actividad_srs:"Repaso + 5 tarjetas de connettivi.", actividad_input:"Escucha un debate en italiano en YouTube (política, cultura o deporte).", actividad_output:"Debate de 10 minutos con la IA sobre un tema de tu elección.", tarea_dia:"Escribe un texto argumentativo de 150 palabras sobre vivir en Italia como extranjero.", frase_clave_it:"Da un lato ci sono vantaggi, dall'altro ci sono difficoltà.", frase_clave_es:"Por un lado hay ventajas, por otro hay dificultades." },
  { semana_num:16, dia_num:3, titulo_dia:"S16D3 – Revisione A2 Medio", tema:"Repaso nivel A2", actividad_srs:"Sesión SRS completa semanas 13-16.", actividad_input:"Lee un artículo completo en italiano (corriere.it). Anota 5 palabras nuevas.", actividad_output:"Conversación libre con la IA 15 minutos. Mide cuánto tiempo sin parar.", tarea_dia:"Grábate hablando 3 minutos. ¿Has mejorado desde la última grabación?", frase_clave_it:"Sono a metà del percorso. Continuo con determinazione!", frase_clave_es:"Estoy a mitad del camino. ¡Continúo con determinación!" },
  { semana_num:17, dia_num:1, titulo_dia:"S17D1 – Contratto di Lavoro", tema:"Contrato laboral italiano", actividad_srs:"Repaso + 5 tarjetas de lavoro avanzato.", actividad_input:"Busca y lee un modelo de contratto di lavoro italiano online.", actividad_output:"Simula con la IA la firma de un contrato laboral.", tarea_dia:"Escribe 10 preguntas que harías en una negociación laboral en italiano.", frase_clave_it:"Il contratto prevede quattro settimane di ferie l'anno.", frase_clave_es:"El contrato incluye cuatro semanas de vacaciones al año." },
  { semana_num:17, dia_num:2, titulo_dia:"S17D2 – Networking in Italiano", tema:"Hacer networking profesional", actividad_srs:"Repaso + 5 tarjetas de lavoro/relazioni.", actividad_input:"Lee el texto 'Una Fiera del Lavoro' en Lecturas.", actividad_output:"Simula con la IA un evento de networking: preséntate profesionalmente.", tarea_dia:"Escribe tu presentación profesional de 60 segundos en italiano (elevator pitch).", frase_clave_it:"Sono specializzato in marketing digitale. Lavoro con aziende italiane.", frase_clave_es:"Estoy especializado en marketing digital. Trabajo con empresas italianas." },
  { semana_num:17, dia_num:3, titulo_dia:"S17D3 – Email Professionale", tema:"Emails profesionales en italiano", actividad_srs:"Sesión SRS completa semana 17.", actividad_input:"Lee ejemplos de email formale italiano en internet.", actividad_output:"Escribe con la ayuda de la IA un email formal de presentación para una empresa.", tarea_dia:"Escribe 3 emails diferentes: candidatura, seguimiento, y agradecimiento post-entrevista.", frase_clave_it:"In allegato trovate il mio curriculum e la lettera di presentazione.", frase_clave_es:"Adjunto encontrarán mi currículum y la carta de presentación." },
  { semana_num:18, dia_num:1, titulo_dia:"S18D1 – Servizi della Città", tema:"Servicios urbanos italianos", actividad_srs:"Repaso + 5 tarjetas de citta/servizi.", actividad_input:"Lee sobre il sistema postale italiano en poste.it.", actividad_output:"Simula con la IA ir a la posta para enviar un paquete.", tarea_dia:"Escribe los pasos para pagar una multa o impuesto en Italia.", frase_clave_it:"Devo spedire questo pacco in Colombia. Quanto ci vuole?", frase_clave_es:"Necesito enviar este paquete a Colombia. ¿Cuánto tarda?" },
  { semana_num:18, dia_num:2, titulo_dia:"S18D2 – In Questura", tema:"En la comisaría / jefatura", actividad_srs:"Repaso + 5 tarjetas de burocrazia avanzata.", actividad_input:"Lee el texto 'Alla Questura' en Lecturas.", actividad_output:"Simula con la IA tramitar el permesso di soggiorno en la questura.", tarea_dia:"Escribe un email a la questura preguntando sobre el estado de tu solicitud.", frase_clave_it:"Sono qui per ritirare il mio permesso di soggiorno. È pronto?", frase_clave_es:"Estoy aquí para recoger mi permiso de residencia. ¿Está listo?" },
  { semana_num:18, dia_num:3, titulo_dia:"S18D3 – Revisione Settimane 17-18", tema:"Repaso sesión B1 primera parte", actividad_srs:"Sesión SRS completa semanas 17-18.", actividad_input:"Escucha Radio Rai 3 en directo durante 10 minutos.", actividad_output:"Conversación libre 15 min con la IA sobre cualquier tema cotidiano.", tarea_dia:"Lista los 10 trámites que harías en tu primer mes en Italia y cómo en italiano.", frase_clave_it:"Ho già risolto tutti i problemi burocratici. Mi sento più sicuro!", frase_clave_es:"Ya resolví todos los trámites burocráticos. ¡Me siento más seguro!" },
  { semana_num:19, dia_num:1, titulo_dia:"S19D1 – Le Emozioni", tema:"Las emociones en italiano", actividad_srs:"Repaso + 5 tarjetas de emozioni.", actividad_input:"Lee el texto 'Emozioni di un Immigrato' en Lecturas.", actividad_output:"Habla con la IA sobre cómo te sientes con tu proceso de adaptación a Italia.", tarea_dia:"Escribe una entrada de diario expresando tus emociones sobre vivir en Italia.", frase_clave_it:"Mi sento a volte solitario, ma anche emozionato per questa avventura.", frase_clave_es:"A veces me siento solitario, pero también emocionado por esta aventura." },
  { semana_num:19, dia_num:2, titulo_dia:"S19D2 – Relazioni Complesse", tema:"Relaciones y conflictos", actividad_srs:"Repaso + 5 tarjetas de relazioni avanzate.", actividad_input:"Coffee Break Italian S3 Ep.2. Escucha cómo hablan de relaciones.", actividad_output:"Role-play con la IA: resuelve un conflicto con un vecino de forma educada.", tarea_dia:"Escribe una carta de disculpa a un colega italiano por un malentendido.", frase_clave_it:"Mi dispiace per il malinteso. Non era mia intenzione offenderti.", frase_clave_es:"Lo siento por el malentendido. No era mi intención ofenderte." },
  { semana_num:19, dia_num:3, titulo_dia:"S19D3 – Benessere Emotivo", tema:"Bienestar emocional", actividad_srs:"Sesión SRS completa semana 19.", actividad_input:"Lee artículo sobre la felicità degli italiani en psicologia.it.", actividad_output:"Debate con la IA: ¿qué hace feliz a los italianos?", tarea_dia:"Escribe 10 cosas que te hacen feliz de vivir en Italia.", frase_clave_it:"La cosa che mi rende più felice è parlare con gli italiani ogni giorno.", frase_clave_es:"Lo que más me hace feliz es hablar con los italianos cada día." },
  { semana_num:20, dia_num:1, titulo_dia:"S20D1 – Il Condizionale", tema:"El condicional presente", actividad_srs:"Repaso + 5 tarjetas de condizionale.", actividad_input:"YouTube: video sobre il condizionale italiano (8 min).", actividad_output:"Usa el condizionale con la IA: habla de 10 cosas que harías si vivieras en Roma.", tarea_dia:"Escribe un cuento corto en condizionale: 'Se fossi italiano...'", frase_clave_it:"Se fossi italiano, abiterei a Roma e mangerei la pizza ogni giorno.", frase_clave_es:"Si fuera italiano, viviría en Roma y comería pizza todos los días." },
  { semana_num:20, dia_num:2, titulo_dia:"S20D2 – Desideri e Ipotesi", tema:"Deseos e hipótesis", actividad_srs:"Repaso + 5 tarjetas de condizionale.", actividad_input:"Lee el texto 'La Vita Ideale' en Lecturas.", actividad_output:"Habla con la IA sobre tu vida ideal en Italia usando il condizionale.", tarea_dia:"Escribe 10 deseos para tu vida en Italia con 'mi piacerebbe...' y 'vorrei...'", frase_clave_it:"Mi piacerebbe avere un appartamento con terrazza con vista sul mare.", frase_clave_es:"Me gustaría tener un apartamento con terraza con vista al mar." },
  { semana_num:20, dia_num:3, titulo_dia:"S20D3 – Revisione Settimane 19-20", tema:"Repaso emociones y condizionale", actividad_srs:"Sesión SRS completa semanas 19-20.", actividad_input:"News in Slow Italian Intermediate Ep.5. Comprensión: ¿70%?", actividad_output:"Conversación libre 20 minutos con la IA. ¿Puedes hablar sin parar?", tarea_dia:"Grábate. Habla de tu vida ideal en Italia por 2 minutos sin preparación.", frase_clave_it:"Parlo sempre meglio. Il mio italiano sta migliorando ogni giorno.", frase_clave_es:"Hablo cada vez mejor. Mi italiano mejora cada día." },
  { semana_num:21, dia_num:1, titulo_dia:"S21D1 – Connettivi Avanzati", tema:"Conectores argumentativos", actividad_srs:"Repaso + 6 tarjetas de connettivi.", actividad_input:"Lee un editorial en corriere.it. Subraya todos los connettivi.", actividad_output:"Escribe con la IA un párrafo argumentativo usando tuttavia, nonostante, dunque.", tarea_dia:"Escribe 10 oraciones con conectores distintos sobre el estilo de vida italiano.", frase_clave_it:"Nonostante le difficoltà, sono felice di vivere in Italia.", frase_clave_es:"A pesar de las dificultades, estoy feliz de vivir en Italia." },
  { semana_num:21, dia_num:2, titulo_dia:"S21D2 – Scrivere Testi Formali", tema:"Textos formales en italiano", actividad_srs:"Repaso + 4 tarjetas de registro formale.", actividad_input:"Lee ejemplos de testi formali italiani (lettere, relazioni) online.", actividad_output:"Escribe con la IA una carta formal de reclamación a una empresa italiana.", tarea_dia:"Escribe una carta de opinión de 200 palabras sobre el turismo en tu ciudad italiana favorita.", frase_clave_it:"Scrivo per esprimere la mia opinione riguardo al problema del traffico.", frase_clave_es:"Escribo para expresar mi opinión sobre el problema del tráfico." },
  { semana_num:21, dia_num:3, titulo_dia:"S21D3 – Revisione Connessione", tema:"Repaso fase Connessione completa", actividad_srs:"Sesión SRS maratón: semanas 13-21.", actividad_input:"Escucha Podcast Italiano Vero Ep.1 (40 min). ¿Cuánto entiendes?", actividad_output:"Conversación libre 20 min sobre cualquier tema. Sin preparación.", tarea_dia:"Autoevalúate: ¿estás listo para el nivel B1? Escribe tus puntos fuertes y débiles.", frase_clave_it:"Ho completato la fase intermedia. Sono quasi a livello B1!", frase_clave_es:"Completé la fase intermedia. ¡Casi estoy en nivel B1!" },
  { semana_num:22, dia_num:1, titulo_dia:"S22D1 – La Natura Italiana", tema:"La naturaleza y el territorio", actividad_srs:"Repaso + 5 tarjetas de natura.", actividad_input:"Documental: Italia vista desde el cielo (YouTube, 10 min). Anota topónimos.", actividad_output:"Habla con la IA sobre el paisaje italiano que más te gusta y por qué.", tarea_dia:"Describe en italiano tres regiones naturales de Italia que quieres explorar.", frase_clave_it:"Adoro il paesaggio toscano: colline, vigneti e borghi medievali.", frase_clave_es:"Me encanta el paisaje toscano: colinas, viñedos y pueblos medievales." },
  { semana_num:22, dia_num:2, titulo_dia:"S22D2 – Il Clima e le Stagioni", tema:"El clima y las estaciones", actividad_srs:"Repaso + 4 tarjetas de clima/stagioni.", actividad_input:"Lee el tiempo en 3met.it para distintas ciudades italianas.", actividad_output:"Habla con la IA sobre cómo cambia tu vida en Italia según las estaciones.", tarea_dia:"Escribe una guía de qué hacer en Italia en cada estación del año.", frase_clave_it:"D'estate fa molto caldo al Sud. In inverno nevica sulle Alpi.", frase_clave_es:"En verano hace mucho calor en el Sur. En invierno nieva en los Alpes." },
  { semana_num:22, dia_num:3, titulo_dia:"S22D3 – Revisione A2 Completo", tema:"Repaso nivel A2 completo", actividad_srs:"Sesión SRS completa semanas 1-22.", actividad_input:"Podcast Italiano Vero – Un Caffè con Nick Ep.1.", actividad_output:"Conversación libre 25 minutos con la IA sobre temas variados.", tarea_dia:"Grábate 4 minutos: habla de natura, clima, lavoro y famiglia en italiano.", frase_clave_it:"Ho raggiunto il livello A2. Ora inizio la vera immersione!", frase_clave_es:"Alcancé el nivel A2. ¡Ahora empieza la verdadera inmersión!" },
  // SEMANAS 23-30 (fase Immersione)
  { semana_num:23, dia_num:1, titulo_dia:"S23D1 – Input Nativo I", tema:"Input auténtico: prensa italiana", actividad_srs:"Repaso + 5 tarjetas de lessico_avanzato.", actividad_input:"Lee un artículo completo en la Repubblica o Corriere. 300+ palabras.", actividad_output:"Resume el artículo con la IA. Ella corrige tu resumen.", tarea_dia:"Lee y resume 3 artículos de noticias italianas esta semana.", frase_clave_it:"Mi tengo aggiornato leggendo i giornali italiani ogni mattina.", frase_clave_es:"Me mantengo al día leyendo los periódicos italianos cada mañana." },
  { semana_num:23, dia_num:2, titulo_dia:"S23D2 – Podcast Nativi", tema:"Podcasts italianos auténticos", actividad_srs:"Repaso + 4 tarjetas de espressioni avanzate.", actividad_input:"Escucha 20 minutos de un podcast italiano nativo (Chora Media, Storytel).", actividad_output:"Habla con la IA sobre el contenido que escuchaste. Usa vocabulario nuevo.", tarea_dia:"Escribe un diario de escucha: qué entendiste, qué no entendiste, qué aprendiste.", frase_clave_it:"Ho ascoltato un podcast in italiano per venti minuti senza pause.", frase_clave_es:"Escuché un podcast en italiano por veinte minutos sin pausas." },
  { semana_num:23, dia_num:3, titulo_dia:"S23D3 – Lessico Avanzato", tema:"Vocabulario avanzado en uso", actividad_srs:"Sesión SRS semanas 23.", actividad_input:"Lee el texto 'Vita da Expat' en Lecturas.", actividad_output:"Usa 10 expresiones avanzadas en una conversación fluida con la IA.", tarea_dia:"Escribe un artículo de blog sobre tu experiencia como hispanohablante en Italia.", frase_clave_it:"Rendersi conto della propria crescita è una soddisfazione enorme.", frase_clave_es:"Darse cuenta del propio crecimiento es una enorme satisfacción." },
  { semana_num:24, dia_num:1, titulo_dia:"S24D1 – Email e Comunicazione Pro", tema:"Comunicación profesional avanzada", actividad_srs:"Repaso + 5 tarjetas de lavoro B1.", actividad_input:"Lee 5 email professionali italiani de ejemplo en internet.", actividad_output:"Escribe con la IA una propuesta de proyecto para una empresa italiana.", tarea_dia:"Escribe 3 emails: candidatura, seguimiento y contraoferta salarial.", frase_clave_it:"Ho le competenze necessarie per questo ruolo. La mia candidatura è allegata.", frase_clave_es:"Tengo las competencias necesarias para este rol. Mi candidatura está adjunta." },
  { semana_num:24, dia_num:2, titulo_dia:"S24D2 – Riunione di Lavoro", tema:"Reuniones de trabajo en italiano", actividad_srs:"Repaso + 5 tarjetas de comunicazione professionale.", actividad_input:"YouTube: una reunión de trabajo en italiano simulada.", actividad_output:"Simula con la IA una reunión de equipo: propón ideas y discute resultados.", tarea_dia:"Escribe el acta de una reunión imaginaria en italiano.", frase_clave_it:"Propongo di aumentare il budget per il marketing digitale del 20%.", frase_clave_es:"Propongo aumentar el presupuesto de marketing digital un 20%." },
  { semana_num:24, dia_num:3, titulo_dia:"S24D3 – Presentazione Orale", tema:"Presentaciones orales en italiano", actividad_srs:"Sesión SRS completa semana 24.", actividad_input:"TED Talk in italiano. Anota estructura y vocabulario usado.", actividad_output:"Haz una presentación oral de 3 minutos sobre un tema de tu sector.", tarea_dia:"Prepara y practica una presentación de 5 minutos en italiano.", frase_clave_it:"Il nostro progetto ha l'obiettivo di migliorare la produttività del 30%.", frase_clave_es:"Nuestro proyecto tiene el objetivo de mejorar la productividad un 30%." },
  { semana_num:25, dia_num:1, titulo_dia:"S25D1 – Arte e Storia", tema:"Arte e historia italiana", actividad_srs:"Repaso + 5 tarjetas de cultura.", actividad_input:"Visita virtual degli Uffizi (uffizi.it). Lee las descripciones en italiano.", actividad_output:"Habla con la IA de tu obra de arte italiana favorita y por qué.", tarea_dia:"Escribe la guía de un museo italiano para turistas hispanohablantes.", frase_clave_it:"Il Rinascimento italiano ha cambiato per sempre la storia dell'arte.", frase_clave_es:"El Renacimiento italiano cambió para siempre la historia del arte." },
  { semana_num:25, dia_num:2, titulo_dia:"S25D2 – Personaggi Storici", tema:"Personajes históricos italianos", actividad_srs:"Repaso + 5 tarjetas de historia/cultura.", actividad_input:"Lee la vita di Leonardo da Vinci en italiano (Wikipedia italiano).", actividad_output:"Habla con la IA como si fueras Leonardo da Vinci respondiendo preguntas.", tarea_dia:"Escribe la biografía de un personaje histórico italiano en 200 palabras.", frase_clave_it:"Leonardo da Vinci era un genio: pittore, scienziato e inventore.", frase_clave_es:"Leonardo da Vinci era un genio: pintor, científico e inventor." },
  { semana_num:25, dia_num:3, titulo_dia:"S25D3 – La Cultura Italiana Oggi", tema:"La cultura italiana contemporánea", actividad_srs:"Sesión SRS completa semana 25.", actividad_input:"Lee una reseña de un libro italiano contemporáneo.", actividad_output:"Debate con la IA sobre cómo la cultura italiana ha influido en el mundo.", tarea_dia:"Escribe un ensayo breve: '¿Por qué la cultura italiana es universal?'", frase_clave_it:"La moda, il cibo e il design italiano sono ambasciatori nel mondo.", frase_clave_es:"La moda, la comida y el diseño italiano son embajadores en el mundo." },
  { semana_num:26, dia_num:1, titulo_dia:"S26D1 – Le Notizie del Giorno", tema:"Actualidad italiana", actividad_srs:"Repaso + 5 tarjetas de attualita.", actividad_input:"Escucha 15 min del TG1 o TG3 en rai.it.", actividad_output:"Resume con la IA 3 noticias que entendiste del TG.", tarea_dia:"Escribe un artículo de opinión sobre una noticia italiana actual.", frase_clave_it:"Il governo italiano ha annunciato nuove misure per l'economia.", frase_clave_es:"El gobierno italiano anunció nuevas medidas para la economía." },
  { semana_num:26, dia_num:2, titulo_dia:"S26D2 – Economia e Politica", tema:"Economía y política italiana", actividad_srs:"Repaso + 5 tarjetas de economia/politica.", actividad_input:"Lee un artículo sobre l'economia italiana en sole24ore.com.", actividad_output:"Debate con la IA sobre los desafíos económicos de Italia.", tarea_dia:"Escribe un análisis de 200 palabras sobre la economía italiana en el contexto europeo.", frase_clave_it:"Nonostante le difficoltà, l'economia italiana mostra segnali positivi.", frase_clave_es:"A pesar de las dificultades, la economía italiana muestra señales positivas." },
  { semana_num:26, dia_num:3, titulo_dia:"S26D3 – Parlare di Attualità", tema:"Hablar de actualidad con fluidez", actividad_srs:"Sesión SRS completa semana 26.", actividad_input:"Escucha In Viaggio con Me – Radio Rai (20 min).", actividad_output:"Debate libre de 20 min sobre política, cultura y sociedad italiana.", tarea_dia:"Grábate debatiendo un tema de actualidad en italiano por 3 minutos.", frase_clave_it:"È importante essere informati per partecipare alla vita civile.", frase_clave_es:"Es importante estar informados para participar en la vida cívica." },
  { semana_num:27, dia_num:1, titulo_dia:"S27D1 – La Dieta Mediterranea", tema:"La dieta mediterránea", actividad_srs:"Repaso + 5 tarjetas de salute/alimentazione.", actividad_input:"Lee el texto 'La Dieta Mediterranea' en Lecturas.", actividad_output:"Diseña con la IA tu plan de alimentación saludable siguiendo la dieta mediterránea.", tarea_dia:"Escribe un menú semanal completo italiano saludable.", frase_clave_it:"La dieta mediterranea previene molte malattie e aumenta la longevità.", frase_clave_es:"La dieta mediterránea previene muchas enfermedades y aumenta la longevidad." },
  { semana_num:27, dia_num:2, titulo_dia:"S27D2 – Il Sistema Sanitario", tema:"El sistema sanitario italiano (SSN)", actividad_srs:"Repaso + 5 tarjetas de sistema sanitario.", actividad_input:"Lee sobre el Servizio Sanitario Nazionale en salute.gov.it.", actividad_output:"Habla con la IA sobre cómo funciona la sanidad pública italiana.", tarea_dia:"Escribe una guía del SSN para nuevos inmigrantes hispanohablantes.", frase_clave_it:"Il Servizio Sanitario Nazionale offre cure gratuite a tutti i residenti.", frase_clave_es:"El Servicio Sanitario Nacional ofrece atención gratuita a todos los residentes." },
  { semana_num:27, dia_num:3, titulo_dia:"S27D3 – Benessere e Prevenzione", tema:"Bienestar y prevención", actividad_srs:"Sesión SRS completa semana 27.", actividad_input:"Podcast: Obiettivo Salute RAI (20 min).", actividad_output:"Debate con la IA sobre hábitos de vida sanos y el modelo italiano.", tarea_dia:"Escribe tu manifesto personale di benessere en italiano.", frase_clave_it:"La prevenzione è il miglior investimento per la propria salute.", frase_clave_es:"La prevención es la mejor inversión para la propia salud." },
  { semana_num:28, dia_num:1, titulo_dia:"S28D1 – Intelligenza Artificiale", tema:"Inteligencia artificial y sociedad", actividad_srs:"Repaso + 5 tarjetas de tecnologia.", actividad_input:"Lee un artículo sobre l'IA in Italia en wired.it.", actividad_output:"Debate con la IA sobre el impacto de la IA en el mercado laboral italiano.", tarea_dia:"Escribe un artículo de 250 palabras sobre IA y lavoro in Italia.", frase_clave_it:"L'intelligenza artificiale sta trasformando il modo in cui lavoriamo.", frase_clave_es:"La inteligencia artificial está transformando la forma en que trabajamos." },
  { semana_num:28, dia_num:2, titulo_dia:"S28D2 – Privacy e Diritti Digitali", tema:"Privacidad y derechos digitales", actividad_srs:"Repaso + 4 tarjetas de diritti digitali.", actividad_input:"Lee sobre il GDPR e la privacy in Italia.", actividad_output:"Debate con la IA sobre privacidad digital y sus implicaciones.", tarea_dia:"Escribe un texto argumentativo sobre los pros y contras de la sociedad digital.", frase_clave_it:"La privacy è un diritto fondamentale nell'era digitale.", frase_clave_es:"La privacidad es un derecho fundamental en la era digital." },
  { semana_num:28, dia_num:3, titulo_dia:"S28D3 – Tecnologia e Futuro", tema:"Tecnología y futuro en Italia", actividad_srs:"Sesión SRS completa semana 28.", actividad_input:"TED Talk italiano sobre il futuro della tecnologia.", actividad_output:"Debate libre 20 min sobre tecnología, trabajo e identidad cultural.", tarea_dia:"Escribe tu visión del futuro del trabajo en Italia en 2035.", frase_clave_it:"La tecnologia ci offre opportunità straordinarie se la usiamo bene.", frase_clave_es:"La tecnología nos ofrece oportunidades extraordinarias si la usamos bien." },
  { semana_num:29, dia_num:1, titulo_dia:"S29D1 – Modi di Dire", tema:"Modismos italianos cotidianos", actividad_srs:"Repaso + 6 tarjetas de espressioni idiomatiche.", actividad_input:"Lee el texto 'Il Italiano dei Nonni' en Lecturas (expressions).", actividad_output:"Usa 10 expresiones idiomáticas en una conversación natural con la IA.", tarea_dia:"Escribe un dialogo dove usi 8 espressioni idiomatiche in modo naturale.", frase_clave_it:"In bocca al lupo! Non vedo l'ora di sentire com'è andata.", frase_clave_es:"¡Buena suerte! Estoy ansioso por saber cómo fue." },
  { semana_num:29, dia_num:2, titulo_dia:"S29D2 – Registro Colloquiale", tema:"El registro coloquial italiano", actividad_srs:"Repaso + 5 tarjetas de espressioni informali.", actividad_input:"Escucha una conversazione informale in italiano en YouTube (amigos hablando).", actividad_output:"Practica con la IA una conversación totalmente informal y coloquial.", tarea_dia:"Escribe un diálogo informal entre dos amigos usando 10 expresiones coloquiales.", frase_clave_it:"Dai! Che aspetti? Dobbiamo fare bella figura stasera!", frase_clave_es:"¡Vamos! ¿A qué esperas? ¡Tenemos que hacer buena impresión esta noche!" },
  { semana_num:29, dia_num:3, titulo_dia:"S29D3 – Suonare Come un Nativo", tema:"Sonar como nativo", actividad_srs:"Sesión SRS completa semana 29.", actividad_input:"Podcast Italiano Vero – episodio avanzado (40 min).", actividad_output:"Conversación libre 25 min. Intenta usar sólo expresiones nativas.", tarea_dia:"Grábate 3 min usando expresiones idiomáticas naturalmente.", frase_clave_it:"Ce la faccio! Parlo italiano come se fossi nato qui.", frase_clave_es:"¡Puedo lograrlo! Hablo italiano como si hubiera nacido aquí." },
  { semana_num:30, dia_num:1, titulo_dia:"S30D1 – Traguardo B1! Celebrazione", tema:"Llegada al nivel B1", actividad_srs:"Sesión SRS maratón final: todas las tarjetas.", actividad_input:"Escucha RAI Radio 1 en directo durante 30 minutos seguidos.", actividad_output:"Conversación libre 30 min sobre cualquier tema. Sin preparación.", tarea_dia:"Grábate 3 minutos sin preparación. Escucha y celebra tu progreso.", frase_clave_it:"Ho raggiunto il livello B1! Sono in grado di vivere in italiano.", frase_clave_es:"¡Alcancé el nivel B1! Soy capaz de vivir en italiano." },
  { semana_num:30, dia_num:2, titulo_dia:"S30D2 – Riflessione sul Percorso", tema:"Reflexión sobre el camino recorrido", actividad_srs:"Repaso final de las tarjetas más difíciles.", actividad_input:"Lee tu primera entrada de diario en italiano (S1D1). ¿Qué tan diferente eres?", actividad_output:"Cuenta a la IA todo tu viaje de aprendizaje del italiano en 10 minutos.", tarea_dia:"Escribe una carta a ti mismo del día 1 explicando todo lo que has aprendido.", frase_clave_it:"Ho fatto un viaggio straordinario. Il mio italiano è cambiato completamente.", frase_clave_es:"Hice un viaje extraordinario. Mi italiano cambió completamente." },
  { semana_num:30, dia_num:3, titulo_dia:"S30D3 – Prossimi Passi verso C1", tema:"Próximos pasos hacia el C1", actividad_srs:"Sesión SRS de mantenimiento: las tarjetas con menor facilidad.", actividad_input:"Busca un curso B2 o C1 en italiano para continuar tu viaje.", actividad_output:"Habla con la IA sobre tus metas para el próximo año en italiano.", tarea_dia:"Escribe tu plan de aprendizaje para el próximo año: de B1 a C1.", frase_clave_it:"Il livello B1 è solo l'inizio. Continuo verso il C1 e oltre!", frase_clave_es:"El nivel B1 es solo el comienzo. ¡Continúo hacia el C1 y más allá!" },
  { semana_num:2, dia_num:4, titulo_dia:"S2D4 – In Farmacia", tema:"En la farmacia", actividad_srs:"Repaso + 4 tarjetas de salute/farmacia.", actividad_input:"Busca el video 'Cosa dire in farmacia in italiano' en YouTube (5 min).", actividad_output:"Escenario 'In Farmacia' con la IA: pide un medicamento para el dolor de cabeza.", tarea_dia:"Escribe 5 oraciones describiendo cómo te sientes cuando estás enfermo en italiano.", frase_clave_it:"Ho mal di testa. Ha qualcosa per il dolore?", frase_clave_es:"Me duele la cabeza. ¿Tiene algo para el dolor?" },
  { semana_num:2, dia_num:5, titulo_dia:"S2D5 – L'Orario dei Treni", tema:"Horarios de trenes y puntualidad", actividad_srs:"Repaso + 3 tarjetas de trasporti.", actividad_input:"Navega trenitalia.com en italiano: lee horarios y precios de trenes.", actividad_output:"Habla con la IA sobre un viaje en tren: ciudad de origen, destino, hora y precio.", tarea_dia:"Planifica en italiano un viaje de Roma a Napoli: horario, billete, duración.", frase_clave_it:"Il treno per Napoli parte alle 10:15 dal binario sette. Costa trenta euro.", frase_clave_es:"El tren para Nápoles sale a las 10:15 del andén siete. Cuesta treinta euros." },
  { semana_num:2, dia_num:6, titulo_dia:"S2D6 – Revisione Semana 2", tema:"Repaso general semana 2", actividad_srs:"Sesión SRS completa semana 2. Repasa todas las tarjetas sin agregar nuevas.", actividad_input:"Coffee Break Italian S1 Ep.4. Escucha sin parar y anota lo que entiendes.", actividad_output:"Quiz completo módulo Repasos. ¿Cuántas tarjetas calificas 'Bien' o 'Perfecto'?", tarea_dia:"Grábate: describe un viaje en tren y pide medicamento en la farmacia. 1 minuto.", frase_clave_it:"Mi fa male la testa. Ho bisogno di una medicina. Dov'è la farmacia più vicina?", frase_clave_es:"Me duele la cabeza. Necesito una medicina. ¿Dónde está la farmacia más cercana?" },
  { semana_num:3, dia_num:4, titulo_dia:"S3D4 – Fare un Colloquio", tema:"Prepararse para la entrevista", actividad_srs:"Repaso + 4 tarjetas de lavoro avanzado.", actividad_input:"Lee 'Il Colloquio di Lavoro' en Lecturas. Anota 5 expresiones clave.", actividad_output:"Entrevista de trabajo completa con la IA: preguntas frecuentes, respuestas, cierre.", tarea_dia:"Escribe las respuestas a estas 3 preguntas: 'Parlami di te', 'Punti di forza', 'Aspettative salariali'.", frase_clave_it:"Ho tre anni di esperienza nel settore. Sono motivato e lavoro bene in team.", frase_clave_es:"Tengo tres años de experiencia en el sector. Soy motivado y trabajo bien en equipo." },
  { semana_num:3, dia_num:5, titulo_dia:"S3D5 – Il Mondo del Lavoro", tema:"El mercado laboral italiano", actividad_srs:"Repaso + 3 tarjetas de economia/lavoro.", actividad_input:"Busca en LinkedIn Jobs Italia: lee 3 ofertas de trabajo en tu sector.", actividad_output:"Habla con la IA sobre las diferencias entre buscar trabajo en Italia y en tu país.", tarea_dia:"Escribe una carta de presentación de 80 palabras para una empresa italiana.", frase_clave_it:"Sono interessato a questa posizione perché corrisponde alla mia esperienza.", frase_clave_es:"Estoy interesado en este puesto porque corresponde a mi experiencia." },
  { semana_num:3, dia_num:6, titulo_dia:"S3D6 – Revisione Semana 3", tema:"Repaso general semana 3", actividad_srs:"Sesión SRS completa semana 3. Anota las tarjetas que más te cuestan.", actividad_input:"YouTube: 'Lavorare in Italia da straniero' – mira un testimonio de 10 min.", actividad_output:"Quiz módulo completo: ¿en qué categorías tienes más errores?", tarea_dia:"Grábate presentándote en una entrevista imaginaria en italiano. 1 minuto.", frase_clave_it:"Buongiorno, mi chiamo... sono qui per il colloquio delle undici.", frase_clave_es:"Buenos días, me llamo... estoy aquí para la entrevista de las once." },
  { semana_num:4, dia_num:4, titulo_dia:"S4D4 – In Comune", tema:"En el ayuntamiento italiano", actividad_srs:"Repaso + 4 tarjetas de burocrazia/documenti.", actividad_input:"Lee en comune.firenze.it los servicios para nuevos residentes.", actividad_output:"Escenario 'In Comune' con la IA: registra la residencia como nuevo habitante.", tarea_dia:"Escribe paso a paso cómo registrarías la residencia en un comune italiano.", frase_clave_it:"Devo registrare la mia residenza qui. Quali documenti devo portare?", frase_clave_es:"Necesito registrar mi residencia aquí. ¿Qué documentos debo traer?" },
  { semana_num:4, dia_num:5, titulo_dia:"S4D5 – I Documenti Italiani", tema:"Documentos que necesita un extranjero", actividad_srs:"Repaso + 3 tarjetas de burocrazia.", actividad_input:"Lee el texto 'Burocrazia Italiana' en Lecturas completo.", actividad_output:"Habla con la IA sobre tu situación documental: qué tienes y qué te falta.", tarea_dia:"Crea una checklist completa en italiano: todos los documentos para vivir legalmente en Italia.", frase_clave_it:"Ho già il codice fiscale. Devo ancora richiedere il permesso di soggiorno.", frase_clave_es:"Ya tengo el código fiscal. Todavía debo solicitar el permiso de residencia." },
  { semana_num:4, dia_num:6, titulo_dia:"S4D6 – Revisione Fondamenta", tema:"Repaso fase Fondamenta completa", actividad_srs:"Sesión SRS maratón: todas las tarjetas semanas 1-4.", actividad_input:"One Minute Italian Podcast: escucha 5 episodios seguidos.", actividad_output:"Conversación libre 10 min con la IA: temas variados de las 4 semanas.", tarea_dia:"Grábate: 2 minutos con todo lo que sabes. Saluda, di dónde vives, explica qué necesitas en burocrazia.", frase_clave_it:"Ho imparato molto in un mese! Posso sopravvivere in Italia.", frase_clave_es:"¡Aprendí mucho en un mes! Puedo sobrevivir en Italia." },
  { semana_num:5, dia_num:4, titulo_dia:"S5D4 – Arredare Casa", tema:"Amueblar el apartamento", actividad_srs:"Repaso + 4 tarjetas de casa/mobili.", actividad_input:"Navega ikea.it en italiano: lee nombres de muebles y precios.", actividad_output:"Habla con la IA sobre cómo amueblarias tu piso ideal en Italia con un presupuesto de 2000€.", tarea_dia:"Escribe la lista de muebles y objetos que necesitarías para tu primer piso en Italia.", frase_clave_it:"Ho bisogno di un letto, un divano e un tavolo. Quanto spendo in totale?", frase_clave_es:"Necesito una cama, un sofá y una mesa. ¿Cuánto gasto en total?" },
  { semana_num:5, dia_num:5, titulo_dia:"S5D5 – Il Quartiere", tema:"El barrio y los servicios cercanos", actividad_srs:"Repaso + 3 tarjetas de città/servizi.", actividad_input:"Busca en Google Maps tu barrio ideal en Milán o Florencia. Lee los nombres en italiano.", actividad_output:"Describe con la IA tu barrio ideal: supermercado, farmacia, parque, metro.", tarea_dia:"Escribe 8 oraciones describiendo el barrio ideal para vivir en Italia.", frase_clave_it:"Il mio quartiere ideale ha un supermercato vicino e una fermata della metro.", frase_clave_es:"Mi barrio ideal tiene un supermercado cerca y una parada de metro." },
  { semana_num:5, dia_num:6, titulo_dia:"S5D6 – Revisione Semana 5", tema:"Repaso general semana 5", actividad_srs:"Sesión SRS completa semana 5. Prioriza tarjetas con calificación 'Mal'.", actividad_input:"Coffee Break Italian S1 Ep.5. Repite cada frase en voz alta.", actividad_output:"Quiz módulo: categoría 'casa'. ¿Qué porcentaje logras?", tarea_dia:"Grábate: describe tu piso y barrio en Italia. Menciona muebles, servicios y vecinos.", frase_clave_it:"Abito in un bilocale arredato al terzo piano. Il quartiere è tranquillo.", frase_clave_es:"Vivo en un piso de dos ambientes amueblado en el tercer piso. El barrio es tranquilo." },
  { semana_num:6, dia_num:4, titulo_dia:"S6D4 – Al Supermercato", tema:"En el supermercado italiano", actividad_srs:"Repaso + 4 tarjetas de cibo/spesa.", actividad_input:"Navega esselunga.it en italiano: lee las categorías de productos.", actividad_output:"Escenario 'Al Supermercato' con la IA: haz la compra semanal para 2 personas.", tarea_dia:"Escribe tu lista de la compra de la semana completa con cantidades y precios estimados.", frase_clave_it:"Cerco la passata di pomodoro. È nell'aisle dei sughi o dei condimenti?", frase_clave_es:"Busco el tomate triturado. ¿Está en el pasillo de salsas o condimentos?" },
  { semana_num:6, dia_num:5, titulo_dia:"S6D5 – Cucinare un Piatto Italiano", tema:"Preparar un plato italiano en casa", actividad_srs:"Repaso + 3 tarjetas de cucina.", actividad_input:"Lee la receta completa de un piatto italiano en giallozafferano.it.", actividad_output:"Explica a la IA paso a paso cómo preparar ese plato. Ella te hace preguntas.", tarea_dia:"Escribe la receta de un plato en italiano: título, ingredientes y pasos.", frase_clave_it:"Prima si fa soffriggere la cipolla nell'olio, poi si aggiunge il pomodoro.", frase_clave_es:"Primero se sofríe la cebolla en aceite, luego se añade el tomate." },
  { semana_num:6, dia_num:6, titulo_dia:"S6D6 – Revisione Cucina", tema:"Repaso semana 6: cocina y alimentación", actividad_srs:"Sesión SRS completa semana 6.", actividad_input:"YouTube: video de un chef italiano explicando una receta en 10 min.", actividad_output:"Habla con la IA sobre tus platos italianos favoritos y los que quieres aprender a cocinar.", tarea_dia:"Grábate: describe cómo preparas una ricetta italiana. Usa verbos de cocina.", frase_clave_it:"La cucina italiana è la mia preferita. Adoro cucinare la pasta al pomodoro.", frase_clave_es:"La cocina italiana es mi favorita. Me encanta cocinar pasta con tomate." },
  { semana_num:7, dia_num:4, titulo_dia:"S7D4 – Uscire con gli Amici", tema:"Salir con amigos en Italia", actividad_srs:"Repaso + 4 tarjetas de relazioni/attività.", actividad_input:"Coffee Break Italian S1 Ep.7. Escucha el episodio sobre tiempo libre.", actividad_output:"Planifica con la IA una serata con amici: aperitivo, cena, passeggiata.", tarea_dia:"Escribe un mensaje de WhatsApp a un amigo italiano invitándolo a un aperitivo este viernes.", frase_clave_it:"Ti va di fare l'aperitivo venerdì sera? Ci sono anche Marco e Chiara.", frase_clave_es:"¿Te apetece tomar un aperitivo el viernes por la tarde? También van Marco y Chiara." },
  { semana_num:7, dia_num:5, titulo_dia:"S7D5 – I Complimenti e la Gentilezza", tema:"Dar cumplidos y ser cortés", actividad_srs:"Repaso + 3 tarjetas de espressioni sociali.", actividad_input:"Busca en YouTube 'fare complimenti in italiano': aprende 5 expresiones nuevas.", actividad_output:"Practica con la IA cómo dar y recibir cumplidos en situaciones italianas cotidianas.", tarea_dia:"Escribe 8 cumplidos distintos en italiano para distintas situaciones: trabajo, casa, comida, aspecto.", frase_clave_it:"Che bel appartamento! Lo hai arredato benissimo. Hai un gusto magnifico!", frase_clave_es:"¡Qué bonito apartamento! Lo decoraste muy bien. ¡Tienes un gusto magnífico!" },
  { semana_num:7, dia_num:6, titulo_dia:"S7D6 – Revisione Relazioni", tema:"Repaso semana 7: relaciones sociales", actividad_srs:"Sesión SRS completa semana 7.", actividad_input:"News in Slow Italian Beginner Ep.3. Escucha y anota vocabulario nuevo.", actividad_output:"Conversación libre 10 min sobre relaciones: amigos, compañeros, vecinos.", tarea_dia:"Grábate: habla de tus amigos italianos (reales o imaginarios). ¿Cómo son? ¿Qué hacéis juntos?", frase_clave_it:"Ho un caro amico italiano. Ci vediamo ogni settimana per fare sport.", frase_clave_es:"Tengo un querido amigo italiano. Nos vemos cada semana para hacer deporte." },
  { semana_num:8, dia_num:4, titulo_dia:"S8D4 – Il Cinema e la TV Italiana", tema:"Cine y televisión italiana", actividad_srs:"Repaso + 4 tarjetas de media/cultura.", actividad_input:"Lee la sinopsis de una película italiana reciente en mymovies.it en italiano.", actividad_output:"Recomanda una película italiana a la IA y describe de qué trata.", tarea_dia:"Escribe una mini-reseña de 60 palabras de una película o serie italiana en italiano.", frase_clave_it:"Ieri ho guardato un film italiano bellissimo. Si chiama 'La Vita è Bella'.", frase_clave_es:"Ayer vi una película italiana muy bonita. Se llama 'La Vida es Bella'." },
  { semana_num:8, dia_num:5, titulo_dia:"S8D5 – La Musica Italiana", tema:"La música italiana", actividad_srs:"Repaso + 3 tarjetas de musica/cultura.", actividad_input:"Escucha una canción italiana famosa con subtítulos: Volare, Nel Blu Dipinto di Blu o similar.", actividad_output:"Habla con la IA sobre géneros musicales italianos: pop, opera, cantautorat.", tarea_dia:"Escribe sobre tu canción o cantante italiano/a favorito/a en 8 oraciones.", frase_clave_it:"Mi piace molto la musica italiana. Adoro ascoltare Eros Ramazzotti.", frase_clave_es:"Me gusta mucho la música italiana. Me encanta escuchar a Eros Ramazzotti." },
  { semana_num:8, dia_num:6, titulo_dia:"S8D6 – Revisione Media e Cultura", tema:"Repaso semana 8: medios y cultura", actividad_srs:"Sesión SRS completa semanas 5-8.", actividad_input:"Mira 10 minutos del TG1 o RaiPlay en italiano.", actividad_output:"Quiz completo módulo Vocab: filtro nivel A1.", tarea_dia:"Grábate: habla de cine, música o medios italianos. 2 minutos.", frase_clave_it:"La cultura italiana è ricchissima. Adoro il cinema e la musica italiana.", frase_clave_es:"La cultura italiana es riquísima. Me encanta el cine y la música italiana." },
  { semana_num:9, dia_num:4, titulo_dia:"S9D4 – Lo Sport in Italia", tema:"El deporte italiano", actividad_srs:"Repaso + 4 tarjetas de sport.", actividad_input:"Lee el texto 'Lo Sport in Italia' completo en Lecturas.", actividad_output:"Debate con la IA: ¿calcio o ciclismo? ¿Cuál es más importante para los italianos?", tarea_dia:"Escribe 8 oraciones sobre el deporte más popular de Italia y por qué te gusta.", frase_clave_it:"Il calcio in Italia non è solo uno sport: è una passione, una religione.", frase_clave_es:"El fútbol en Italia no es solo un deporte: es una pasión, una religión." },
  { semana_num:9, dia_num:5, titulo_dia:"S9D5 – Pianificare un Viaggio", tema:"Planificar un viaje por Italia", actividad_srs:"Repaso + 3 tarjetas de turismo/viaggio.", actividad_input:"Lee en tripadvisor.it las atracciones de una ciudad italiana que quieres visitar.", actividad_output:"Planifica con la IA un itinerario de 3 días en Roma: alojamiento, visitas, comidas.", tarea_dia:"Escribe el presupuesto completo de un viaje de 5 días en Italia.", frase_clave_it:"Per il viaggio a Roma ho prenotato un ostello nel centro storico.", frase_clave_es:"Para el viaje a Roma reservé un hostal en el centro histórico." },
  { semana_num:9, dia_num:6, titulo_dia:"S9D6 – Revisione Tempo Libero", tema:"Repaso semana 9: ocio y viajes", actividad_srs:"Sesión SRS completa semana 9.", actividad_input:"Coffee Break Italian S1 Ep.9. Repite las frases de turismo.", actividad_output:"Conversación libre sobre tus planes de viaje y hobbies en Italia.", tarea_dia:"Grábate: cuenta tu viaje imaginario más reciente por Italia en 2 minutos.", frase_clave_it:"Sono stato a Firenze il mese scorso. Ho visitato gli Uffizi e ho mangiato la bistecca.", frase_clave_es:"Estuve en Florencia el mes pasado. Visité los Uffizi y comí el bistec." },
  { semana_num:10, dia_num:4, titulo_dia:"S10D4 – Descrivere le Persone", tema:"Describir a personas", actividad_srs:"Repaso + 4 tarjetas de descrizione.", actividad_input:"Lee el texto 'Una Famiglia Italiana' en Lecturas. Fíjate en las descripciones.", actividad_output:"Describe con la IA a 3 personas de tu familia usando vocabulario de descripción física y carácter.", tarea_dia:"Escribe la descripción completa de una persona (física + personalidad) en italiano.", frase_clave_it:"Mia sorella è alta, ha i capelli ricci e un carattere molto allegro.", frase_clave_es:"Mi hermana es alta, tiene el pelo rizado y un carácter muy alegre." },
  { semana_num:10, dia_num:5, titulo_dia:"S10D5 – Il Carattere degli Italiani", tema:"El carácter y cultura italiana", actividad_srs:"Repaso + 3 tarjetas de cultura/carattere.", actividad_input:"Lee un artículo en italiano sobre los stereotipi italiani (busca en rai.it).", actividad_output:"Debate con la IA: ¿qué caracteriza a los italianos? ¿Son los estereotipos verdaderos?", tarea_dia:"Escribe 10 oraciones comparando el carácter italiano con el colombiano.", frase_clave_it:"Gli italiani sono calorosi, espressivi e molto legati alla famiglia.", frase_clave_es:"Los italianos son cálidos, expresivos y muy apegados a la familia." },
  { semana_num:10, dia_num:6, titulo_dia:"S10D6 – Revisione Famiglia", tema:"Repaso semana 10: familia y personas", actividad_srs:"Sesión SRS completa semana 10.", actividad_input:"Escucha Coffee Break Italian S1 Ep.10 otra vez.", actividad_output:"Habla con la IA 10 min: describe a tu familia y compara costumbres italianas y colombianas.", tarea_dia:"Grábate: presenta a tu familia en italiano. 2 minutos.", frase_clave_it:"La mia famiglia è la cosa più importante per me, anche da lontano.", frase_clave_es:"Mi familia es lo más importante para mí, incluso desde lejos." },
  { semana_num:11, dia_num:4, titulo_dia:"S11D4 – Le Abitudini Salutari", tema:"Hábitos saludables italianos", actividad_srs:"Repaso + 4 tarjetas de salute/abitudini.", actividad_input:"Lee sobre la dieta mediterranea en un artículo de corriere.it salute.", actividad_output:"Habla con la IA sobre tus hábitos de salud actuales y cómo mejorarlos en Italia.", tarea_dia:"Escribe un plan semanal de hábitos saludables en italiano: dieta, ejercicio, descanso.", frase_clave_it:"Mangio molta verdura e faccio jogging ogni mattina. Mi sento benissimo!", frase_clave_es:"Como mucha verdura y hago jogging cada mañana. ¡Me siento muy bien!" },
  { semana_num:11, dia_num:5, titulo_dia:"S11D5 – Dal Dentista e dall'Ottico", tema:"En el dentista y óptico", actividad_srs:"Repaso + 3 tarjetas de salute specialistica.", actividad_input:"Busca en YouTube 'dal dentista in italiano': aprende el vocabulario específico.", actividad_output:"Escenario con la IA: visita al dentista con cita y descripción del problema.", tarea_dia:"Escribe un diálogo de 10 líneas en el dentista en italiano.", frase_clave_it:"Ho mal di denti da tre giorni. Posso avere un appuntamento urgente?", frase_clave_es:"Me duelen los dientes desde hace tres días. ¿Puedo tener una cita urgente?" },
  { semana_num:11, dia_num:6, titulo_dia:"S11D6 – Revisione Corpo e Salute", tema:"Repaso semana 11: cuerpo y salud", actividad_srs:"Sesión SRS completa semana 11.", actividad_input:"Podcast Obiettivo Salute RAI: escucha 10 minutos.", actividad_output:"Quiz categoría 'salute': ¿qué porcentaje correcto?", tarea_dia:"Grábate describiendo un problema de salud y tu visita al médico. 2 minutos.", frase_clave_it:"La salute è la cosa più importante. Bisogna prendersene cura ogni giorno.", frase_clave_es:"La salud es lo más importante. Hay que cuidarla cada día." },
  { semana_num:12, dia_num:4, titulo_dia:"S12D4 – L'Università Italiana", tema:"La universidad y educación superior", actividad_srs:"Repaso + 4 tarjetas de istruzione universitaria.", actividad_input:"Lee en unibo.it (Universidad de Bolonia) sobre los cursos disponibles en italiano.", actividad_output:"Habla con la IA sobre posibilidades de estudiar en una universidad italiana.", tarea_dia:"Escribe una solicitud de información a una universidad italiana sobre un máster.", frase_clave_it:"Sono interessato a iscrivermi a un master presso la vostra università.", frase_clave_es:"Estoy interesado en inscribirme a un máster en su universidad." },
  { semana_num:12, dia_num:5, titulo_dia:"S12D5 – I Corsi di Lingua", tema:"Cursos de italiano para extranjeros", actividad_srs:"Repaso + 3 tarjetas de lingua/corsi.", actividad_input:"Lee sobre i corsi di italiano per stranieri en comune o scuola italiana online.", actividad_output:"Simula con la IA inscribirte en un corso di italiano a Firenze.", tarea_dia:"Escribe un email preguntando por un corso di italiano: horarios, precios, nivel.", frase_clave_it:"Vorrei iscrivermi a un corso di italiano per principianti. Quando inizia il prossimo?", frase_clave_es:"Quisiera inscribirme a un curso de italiano para principiantes. ¿Cuándo empieza el próximo?" },
  { semana_num:12, dia_num:6, titulo_dia:"S12D6 – Revisione Vita Quotidiana", tema:"Repaso fase Vita Quotidiana completa", actividad_srs:"Sesión SRS maratón: semanas 5-12 completas.", actividad_input:"News in Slow Italian Beginner – escucha 2 episodios seguidos.", actividad_output:"Conversación libre 15 min: temas variados de la vida cotidiana.", tarea_dia:"Grábate 3 min: habla de trabajo, casa, familia, salud y ocio en Italia.", frase_clave_it:"Vivo bene in Italia. Ho un lavoro, un appartamento e degli amici.", frase_clave_es:"Vivo bien en Italia. Tengo un trabajo, un apartamento y amigos." },
  { semana_num:13, dia_num:4, titulo_dia:"S13D4 – Potere, Volere, Dovere", tema:"Verbos modales: práctica intensiva", actividad_srs:"Repaso + 4 tarjetas de grammatica modale.", actividad_input:"YouTube: video 'Verbi modali italiani con esempi' (8 min).", actividad_output:"50 oraciones con modales: la IA propone situaciones, tú construyes la oración.", tarea_dia:"Escribe un diario de ayer usando potere, volere, dovere y sapere (mínimo 2 cada uno).", frase_clave_it:"Oggi non posso uscire. Devo studiare perché voglio imparare l'italiano.", frase_clave_es:"Hoy no puedo salir. Debo estudiar porque quiero aprender el italiano." },
  { semana_num:13, dia_num:5, titulo_dia:"S13D5 – Grammatica e Comunicazione", tema:"Gramática como herramienta de comunicación", actividad_srs:"Repaso + 3 tarjetas de grammatica.", actividad_input:"Lee el texto 'Una Giornata con i Modali' en Lecturas por segunda vez.", actividad_output:"Habla con la IA 10 min usando solo oraciones con verbos modales y gerundio.", tarea_dia:"Traduce del español al italiano 10 oraciones cotidianas usando las estructuras aprendidas.", frase_clave_it:"Saper usare i modali è fondamentale per comunicare bene in italiano.", frase_clave_es:"Saber usar los modales es fundamental para comunicarse bien en italiano." },
  { semana_num:13, dia_num:6, titulo_dia:"S13D6 – Revisione Semana 13", tema:"Repaso semana 13: gramática en contexto", actividad_srs:"Sesión SRS completa semana 13.", actividad_input:"Coffee Break Italian S2 Ep.3: segunda escucha sin notas.", actividad_output:"Quiz módulo: categoría 'grammatica'. Mide tu progreso.", tarea_dia:"Grábate: 2 minutos hablando de planes y obligaciones usando los modales.", frase_clave_it:"Devo migliorare il mio italiano. Posso farcela se studio ogni giorno!", frase_clave_es:"Debo mejorar mi italiano. ¡Puedo lograrlo si estudio cada día!" },
  { semana_num:14, dia_num:4, titulo_dia:"S14D4 – Raccontare il Passato", tema:"Narrar el pasado con fluidez", actividad_srs:"Repaso + 4 tarjetas de passato prossimo.", actividad_input:"Escucha Coffee Break Italian S2 Ep.5 por segunda vez. Anota verbos en passato.", actividad_output:"Cuéntale a la IA tu historia de cómo decidiste aprender italiano. Pasado prossimo.", tarea_dia:"Escribe la historia de tu vida en Italia en passato prossimo (15 oraciones).", frase_clave_it:"Ho deciso di imparare l'italiano perché voglio vivere a Roma.", frase_clave_es:"Decidí aprender italiano porque quiero vivir en Roma." },
  { semana_num:14, dia_num:5, titulo_dia:"S14D5 – Il Diario in Italiano", tema:"Escribir un diario en italiano", actividad_srs:"Repaso + 3 tarjetas de espressioni temporali.", actividad_input:"Lee un esempio di diario in italiano en internet.", actividad_output:"Escribe con la IA una entrada de diario completa sobre ayer.", tarea_dia:"Empieza tu diario en italiano: escribe la entrada de hoy (mínimo 10 oraciones).", frase_clave_it:"Oggi ho avuto una giornata intensa. Ho studiato l'italiano per due ore.", frase_clave_es:"Hoy tuve un día intenso. Estudié italiano durante dos horas." },
  { semana_num:14, dia_num:6, titulo_dia:"S14D6 – Revisione Passato", tema:"Repaso semana 14: el pasado", actividad_srs:"Sesión SRS completa semana 14.", actividad_input:"News in Slow Italian Intermediate Ep.1. Escucha cómo usan el passato.", actividad_output:"Conversación libre 10 min sobre eventos del pasado reciente.", tarea_dia:"Grábate: narra tu semana en italiano usando passato prossimo. 2 min.", frase_clave_it:"Questa settimana ho lavorato, ho studiato e ho parlato italiano con la mia IA!", frase_clave_es:"Esta semana trabajé, estudié y hablé italiano con mi IA." },
  { semana_num:15, dia_num:4, titulo_dia:"S15D4 – Imperfetto vs Passato Prossimo", tema:"Cuándo usar cada tiempo verbal", actividad_srs:"Repaso + 4 tarjetas de grammatica/tempo.", actividad_input:"YouTube: video 'imperfetto vs passato prossimo' (10 min). Toma notas.", actividad_output:"La IA narra una historia corta y tú identificas qué tiempo verbal usar en cada hueco.", tarea_dia:"Escribe un cuento corto de 15 oraciones alternando imperfetto y passato prossimo.", frase_clave_it:"Quando ero piccolo, abitavo in Colombia. Un giorno ho deciso di venire in Italia.", frase_clave_es:"Cuando era pequeño, vivía en Colombia. Un día decidí venir a Italia." },
  { semana_num:15, dia_num:5, titulo_dia:"S15D5 – I Sogni e il Futuro", tema:"Hablar del futuro con vocabulario avanzado", actividad_srs:"Repaso + 3 tarjetas de futuro/progetto.", actividad_input:"Lee el texto 'Sogni e Progetti' en Lecturas. Subraya las frases en futuro.", actividad_output:"Habla con la IA: ¿cómo será tu vida en Italia dentro de 3 años? Usa futuro semplice.", tarea_dia:"Escribe una carta al yo del futuro describiendo cómo será tu vida en Italia.", frase_clave_it:"Tra tre anni parlerò italiano fluentemente e avrò un lavoro che mi piace.", frase_clave_es:"En tres años hablaré italiano con fluidez y tendré un trabajo que me gusta." },
  { semana_num:15, dia_num:6, titulo_dia:"S15D6 – Revisione Tempo Verbale", tema:"Repaso semana 15: tiempos verbales", actividad_srs:"Sesión SRS completa semana 15.", actividad_input:"Coffee Break Italian S2 Ep.8: segunda escucha activa.", actividad_output:"Quiz gramatical con la IA: 20 frases para elegir imperfetto, passato o futuro.", tarea_dia:"Grábate: cuenta una historia con passato, imperfetto y futuro en 2 minutos.", frase_clave_it:"Ho imparato molto sul tempo verbale. Ora racconto storie in italiano!", frase_clave_es:"Aprendí mucho sobre los tiempos verbales. ¡Ahora cuento historias en italiano!" },
  { semana_num:16, dia_num:4, titulo_dia:"S16D4 – Argomentare in Italiano", tema:"Argumentar y persuadir en italiano", actividad_srs:"Repaso + 4 tarjetas de argomentazione.", actividad_input:"Lee una lettera al direttore en corriere.it: cómo argumentan los italianos.", actividad_output:"Debate de 15 min con la IA: ¿es mejor vivir en el norte o el sur de Italia?", tarea_dia:"Escribe un testo argomentativo de 120 palabras defendiendo una posición sobre Italia.", frase_clave_it:"Sono convinto che Milano sia la città ideale per lavorare e vivere.", frase_clave_es:"Estoy convencido de que Milán es la ciudad ideal para trabajar y vivir." },
  { semana_num:16, dia_num:5, titulo_dia:"S16D5 – Leggere il Giornale Italiano", tema:"Leer prensa italiana con comprensión", actividad_srs:"Repaso + 3 tarjetas de attualità/media.", actividad_input:"Lee un artículo completo (300+ palabras) de la Repubblica o Corriere.", actividad_output:"Resume el artículo con la IA en italiano. Ella identifica errores de resumen.", tarea_dia:"Escribe un resumen de 80 palabras del artículo que leíste.", frase_clave_it:"Leggo il giornale italiano per migliorare il mio lessico e capire la cultura.", frase_clave_es:"Leo el periódico italiano para mejorar mi léxico y entender la cultura." },
  { semana_num:16, dia_num:6, titulo_dia:"S16D6 – Revisione Opinioni", tema:"Repaso semana 16: opiniones y argumentos", actividad_srs:"Sesión SRS maratón: semanas 13-16.", actividad_input:"News in Slow Italian Intermediate Ep.2.", actividad_output:"Conversación libre 15 min: debates sobre Italia.", tarea_dia:"Grábate debatiendo un tema sobre Italia. 2-3 minutos sin preparación.", frase_clave_it:"Ho molte opinioni sull'Italia. Posso esprimermi in modo chiaro!", frase_clave_es:"Tengo muchas opiniones sobre Italia. ¡Puedo expresarme con claridad!" },
  { semana_num:17, dia_num:4, titulo_dia:"S17D4 – Trattare lo Stipendio", tema:"Negociar el salario en italiano", actividad_srs:"Repaso + 4 tarjetas de lavoro/stipendio.", actividad_input:"Lee en indeed.it o infojobs.it artículos sobre cómo negociar el salario en italiano.", actividad_output:"Simula con la IA una negociación salarial: pide aumento o mejores condiciones.", tarea_dia:"Escribe el diálogo completo de una negociación salarial en italiano.", frase_clave_it:"Apprezzo l'offerta, ma considerando la mia esperienza, mi aspettavo qualcosa di più.", frase_clave_es:"Aprecio la oferta, pero considerando mi experiencia, esperaba algo más." },
  { semana_num:17, dia_num:5, titulo_dia:"S17D5 – Il Mondo delle Startup", tema:"Emprendimiento e innovación en Italia", actividad_srs:"Repaso + 3 tarjetas de lavoro/innovazione.", actividad_input:"Lee sobre il ecosistema startup italiano en startupitalia.eu.", actividad_output:"Presenta a la IA tu idea de startup en Italia. Defiéndela en italiano.", tarea_dia:"Escribe un pitch de 100 palabras en italiano para tu startup imaginaria en Italia.", frase_clave_it:"La mia startup offre un servizio innovativo per gli expat in Italia.", frase_clave_es:"Mi startup ofrece un servicio innovador para los expats en Italia." },
  { semana_num:17, dia_num:6, titulo_dia:"S17D6 – Revisione Lavoro Avanzato", tema:"Repaso semana 17: trabajo profesional", actividad_srs:"Sesión SRS completa semana 17.", actividad_input:"YouTube: TED Talk italiano sobre lavoro e innovazione (15 min).", actividad_output:"Conversación profesional 15 min con la IA: tú eres un profesional en una reunión italiana.", tarea_dia:"Grábate haciendo tu elevator pitch profesional en italiano. 1 minuto.", frase_clave_it:"Sono un professionista motivato con esperienza internazionale. Posso aggiungere valore.", frase_clave_es:"Soy un profesional motivado con experiencia internacional. Puedo añadir valor." },
  { semana_num:18, dia_num:4, titulo_dia:"S18D4 – La Posta Italiana", tema:"La oficina de correos italiana", actividad_srs:"Repaso + 4 tarjetas de servizi pubblici.", actividad_input:"Lee sobre i servizi di Poste Italiane en poste.it.", actividad_output:"Escenario con la IA: envía un paquete a Colombia desde la posta italiana.", tarea_dia:"Escribe los pasos para enviar un paquete desde Italia a Latinoamérica.", frase_clave_it:"Vorrei spedire questo pacco in Colombia. Qual è il servizio più veloce?", frase_clave_es:"Quisiera enviar este paquete a Colombia. ¿Cuál es el servicio más rápido?" },
  { semana_num:18, dia_num:5, titulo_dia:"S18D5 – Diritti e Doveri del Lavoratore", tema:"Derechos laborales en Italia", actividad_srs:"Repaso + 3 tarjetas de diritti/lavoro.", actividad_input:"Lee sobre i diritti del lavoratore en cgil.it o lavoro.gov.it.", actividad_output:"Habla con la IA sobre tus derechos como trabajador extranjero en Italia.", tarea_dia:"Escribe un resumen de los 5 derechos laborales más importantes para un trabajador en Italia.", frase_clave_it:"Ho diritto alle ferie, alla malattia pagata e alla tredicesima mensilità.", frase_clave_es:"Tengo derecho a vacaciones, baja por enfermedad pagada y la paga extra de Navidad." },
  { semana_num:18, dia_num:6, titulo_dia:"S18D6 – Revisione Burocrazia B1", tema:"Repaso semana 18: burocracia avanzada", actividad_srs:"Sesión SRS completa semanas 17-18.", actividad_input:"Podcast: Essere a posto in Italia – busca episodio sobre burocrazia.", actividad_output:"Conversación libre 15 min: simula distintos trámites en Italia.", tarea_dia:"Grábate explicando 3 trámites burocráticos que debes hacer en Italia. 2 minutos.", frase_clave_it:"Ormai conosco bene la burocrazia italiana. Non mi spaventa più!", frase_clave_es:"Ya conozco bien la burocracia italiana. ¡Ya no me asusta!" },
  { semana_num:19, dia_num:4, titulo_dia:"S19D4 – Sentimenti Complessi", tema:"Emociones complejas en italiano", actividad_srs:"Repaso + 4 tarjetas de emozioni avanzate.", actividad_input:"Lee sobre la nostalgia e il senso di appartenenza in italiano.", actividad_output:"Habla con la IA sobre emociones contradictorias de vivir lejos de casa.", tarea_dia:"Escribe una carta emocional (10 oraciones) a alguien que extrañas en español… ¡no, en italiano!", frase_clave_it:"Mi mancate tanto. Ma sono grato per questa esperienza straordinaria.", frase_clave_es:"Os echo mucho de menos. Pero estoy agradecido por esta experiencia extraordinaria." },
  { semana_num:19, dia_num:5, titulo_dia:"S19D5 – L'Identità dell'Expat", tema:"Identidad y pertenencia cultural", actividad_srs:"Repaso + 3 tarjetas de cultura/identità.", actividad_input:"Lee el texto 'Vita da Expat' completo en Lecturas.", actividad_output:"Debate con la IA: ¿cómo cambia tu identidad cuando vives en otro país?", tarea_dia:"Escribe un ensayo de 150 palabras: 'Chi sono io dopo un anno in Italia?'", frase_clave_it:"Sono colombiano ma mi sento anche un po' italiano. Ho due identità.", frase_clave_es:"Soy colombiano pero me siento también un poco italiano. Tengo dos identidades." },
  { semana_num:19, dia_num:6, titulo_dia:"S19D6 – Revisione Emozioni", tema:"Repaso semana 19: emociones e identidad", actividad_srs:"Sesión SRS completa semana 19.", actividad_input:"Coffee Break Italian S3 Ep.2: escucha activa sobre relaciones.", actividad_output:"Conversación emotiva libre 15 min: habla de tu experiencia viviendo en Italia.", tarea_dia:"Grábate describiendo cómo te sientes viviendo en Italia. Sé honesto y usa vocabulario rico.", frase_clave_it:"Vivere in Italia mi ha cambiato. Sono cresciuto come persona.", frase_clave_es:"Vivir en Italia me ha cambiado. He crecido como persona." },
  { semana_num:20, dia_num:4, titulo_dia:"S20D4 – Il Congiuntivo", tema:"El subjuntivo italiano", actividad_srs:"Repaso + 4 tarjetas di congiuntivo.", actividad_input:"YouTube: 'il congiuntivo italiano spiegato bene' (10 min).", actividad_output:"Usa el congiuntivo presente con la IA: deseos, dudas, opiniones subjetivas.", tarea_dia:"Escribe 10 oraciones con el congiuntivo: 'Penso che...', 'Spero che...', 'È importante che...'", frase_clave_it:"Spero che il mio italiano migliori rapidamente. Penso che sia già migliorato!", frase_clave_es:"Espero que mi italiano mejore rápido. ¡Creo que ya mejoró!" },
  { semana_num:20, dia_num:5, titulo_dia:"S20D5 – Ipotesi e Fantasia", tema:"Hipótesis y condicional compuesto", actividad_srs:"Repaso + 3 tarjetas di condizionale/congiuntivo.", actividad_input:"Lee un testo di fantascienza corto in italiano (cerca online).", actividad_output:"Habla con la IA sobre un escenario hipotético: ¿qué habrías hecho si hubieras nacido italiano?", tarea_dia:"Escribe 10 oraciones hipotéticas sobre tu vida alternativa italiana.", frase_clave_it:"Se fossi nato in Italia, avrei studiato alla Bocconi e lavorato a Milano.", frase_clave_es:"Si hubiera nacido en Italia, habría estudiado en la Bocconi y trabajado en Milán." },
  { semana_num:20, dia_num:6, titulo_dia:"S20D6 – Revisione Grammatica Avanzata", tema:"Repaso semana 20: condizionale y congiuntivo", actividad_srs:"Sesión SRS maratón: semanas 17-20.", actividad_input:"News in Slow Italian Intermediate Ep.5: segunda escucha.", actividad_output:"Conversación libre 20 min con mucho condizionale y congiuntivo.", tarea_dia:"Grábate 2 min hablando de deseos, hipótesis e impresiones sobre Italia.", frase_clave_it:"Vorrei che il tempo passasse più lentamente. Amo questa fase dell'apprendimento.", frase_clave_es:"Quisiera que el tiempo pasara más despacio. Amo esta fase del aprendizaje." },
  { semana_num:21, dia_num:4, titulo_dia:"S21D4 – Scrivere Bene in Italiano", tema:"Escritura avanzada en italiano", actividad_srs:"Repaso + 4 tarjetas di connettivi/registro.", actividad_input:"Lee una lettera formale e una informale en italiano: compara registros.", actividad_output:"Escribe con la IA tres versiones del mismo mensaje: formal, neutro e informal.", tarea_dia:"Escribe un párrafo sobre un tema libre usando 5 connettivi distintos naturalmente.", frase_clave_it:"Pertanto, ritengo che imparare a scrivere bene sia fondamentale per integrarsi.", frase_clave_es:"Por tanto, considero que aprender a escribir bien es fundamental para integrarse." },
  { semana_num:21, dia_num:5, titulo_dia:"S21D5 – Il Dibattito Italiano", tema:"Participar en debates italianos", actividad_srs:"Repaso + 3 tarjetas de argomentazione.", actividad_input:"Mira 15 min de un dibattito televisivo italiano en RaiPlay.", actividad_output:"Debate con la IA sobre un tema polémico italiano: immigrazione, ambiente o lavoro.", tarea_dia:"Escribe un testo di opinione de 200 palabras sobre un tema actual en Italia.", frase_clave_it:"Ritengo che l'immigrazione arricchisca la cultura italiana. Ecco le mie ragioni.", frase_clave_es:"Considero que la inmigración enriquece la cultura italiana. Estas son mis razones." },
  { semana_num:21, dia_num:6, titulo_dia:"S21D6 – Revisione Connessione Completa", tema:"Repaso completo fase Connessione", actividad_srs:"Sesión SRS maratón: semanas 13-21.", actividad_input:"Podcast Italiano Vero Ep.1: 40 minutos completos.", actividad_output:"Conversación libre 25 min sobre cualquier tema. Mide tu fluidez.", tarea_dia:"Grábate 4 minutos sobre temas variados: grammatica, emozioni, lavoro, cultura.", frase_clave_it:"Ho completato la fase intermedia! Il mio italiano è diventato vero.", frase_clave_es:"¡Completé la fase intermedia! Mi italiano se volvió real." },
  { semana_num:22, dia_num:4, titulo_dia:"S22D4 – Le Regioni Italiane", tema:"Las regiones de Italia", actividad_srs:"Repaso + 4 tarjetas de geografia/regioni.", actividad_input:"Lee la descrizione delle 20 regioni italiane en it.wikipedia.org.", actividad_output:"Habla con la IA sobre 3 regiones que te gustaría vivir y por qué.", tarea_dia:"Escribe una guía rápida (10 oraciones) de las 5 regiones italianas más conocidas.", frase_clave_it:"La Toscana è famosa per l'arte, il vino e i paesaggi collinari.", frase_clave_es:"La Toscana es famosa por el arte, el vino y los paisajes de colinas." },
  { semana_num:22, dia_num:5, titulo_dia:"S22D5 – Il Turismo Sostenibile", tema:"Turismo sostenible en Italia", actividad_srs:"Repaso + 3 tarjetas de ambiente/turismo.", actividad_input:"Lee sobre il turismo sostenibile in Italia en italia.it.", actividad_output:"Debate con la IA: ¿cómo se puede visitar Italia de forma responsable?", tarea_dia:"Escribe un itinerario de viaje sostenible por Italia: transporte, alojamiento, actividades.", frase_clave_it:"Preferisco viaggiare in treno: inquina meno e vedo il paesaggio italiano.", frase_clave_es:"Prefiero viajar en tren: contamina menos y veo el paisaje italiano." },
  { semana_num:22, dia_num:6, titulo_dia:"S22D6 – Revisione A2 Finale", tema:"Repaso final nivel A2 completo", actividad_srs:"Sesión SRS maratón: semanas 1-22.", actividad_input:"Podcast Italiano Vero – Un Caffè con Nick Ep.1.", actividad_output:"Conversación libre 30 min. Sin preparación. Temas variados.", tarea_dia:"Grábate 5 minutos hablando libre: geografía, natura, sostenibilità, vita in Italia.", frase_clave_it:"Sono al livello A2. Ho un vocabolario ricco e posso esprimermi bene.", frase_clave_es:"Estoy en nivel A2. Tengo un vocabulario rico y puedo expresarme bien." },
  { semana_num:23, dia_num:4, titulo_dia:"S23D4 – Analisi dei Testi", tema:"Analizar textos en italiano", actividad_srs:"Repaso + 4 tarjetas de lessico avanzato.", actividad_input:"Lee un testo letterario corto di Calvino o Pavese (busca online).", actividad_output:"Analiza con la IA el texto: tema, vocabulario, estilo, estructura.", tarea_dia:"Escribe un análisis de 150 palabras de un texto italiano que hayas leído esta semana.", frase_clave_it:"Analizzare un testo mi aiuta a capire meglio la lingua e la cultura.", frase_clave_es:"Analizar un texto me ayuda a entender mejor la lengua y la cultura." },
  { semana_num:23, dia_num:5, titulo_dia:"S23D5 – Il Linguaggio dei Social", tema:"Italiano en redes sociales", actividad_srs:"Repaso + 3 tarjetas di espressioni digitali.", actividad_input:"Sigue 3 account italiani su Instagram o Twitter. Lee sus posts en italiano.", actividad_output:"Habla con la IA sobre el italiano informal en redes: hashtag, abreviaciones, jerga digital.", tarea_dia:"Escribe 5 posts de Instagram sobre tu vida en Italia en italiano auténtico.", frase_clave_it:"Oggi ho visitato il Duomo di Milano. Semplicemente mozzafiato! #Italia #Vita", frase_clave_es:"Hoy visité el Duomo de Milán. ¡Simplemente impresionante! #Italia #Vida" },
  { semana_num:23, dia_num:6, titulo_dia:"S23D6 – Revisione Immersione I", tema:"Repaso semana 23: inmersión inicial", actividad_srs:"Sesión SRS completa semana 23.", actividad_input:"Podcast nativo italiano (Chora Media): 30 min completos.", actividad_output:"Conversación libre 25 min. Objetivo: cero cambios al español.", tarea_dia:"Grábate 3 min leyendo en italiano un artículo. Luego otros 3 min comentándolo.", frase_clave_it:"Riesco a leggere testi autentici in italiano. È una sensazione fantastica!", frase_clave_es:"Soy capaz de leer textos auténticos en italiano. ¡Es una sensación fantástica!" },
  { semana_num:24, dia_num:4, titulo_dia:"S24D4 – Contratti e Accordi", tema:"Contratos y acuerdos en italiano", actividad_srs:"Repaso + 4 tarjetas di lessico giuridico.", actividad_input:"Lee un template de contratto di collaborazione in italiano.", actividad_output:"Simula con la IA la firma de un contrato de colaboración profesional.", tarea_dia:"Escribe un acuerdo informal de colaboración entre dos freelance en italiano.", frase_clave_it:"Il contratto prevede un compenso mensile e una durata di sei mesi.", frase_clave_es:"El contrato contempla una compensación mensual y una duración de seis meses." },
  { semana_num:24, dia_num:5, titulo_dia:"S24D5 – Il Leader Comunicativo", tema:"Comunicar con liderazgo en italiano", actividad_srs:"Repaso + 3 tarjetas di leadership/comunicazione.", actividad_input:"Mira un TED Talk italiano sobre leadership o comunicazione (20 min).", actividad_output:"Practica con la IA el discurso de apertura de una reunión de equipo en italiano.", tarea_dia:"Escribe un discurso motivacional de 150 palabras para tu equipo de trabajo.", frase_clave_it:"Insieme possiamo raggiungere risultati straordinari. Questo è il nostro obiettivo.", frase_clave_es:"Juntos podemos alcanzar resultados extraordinarios. Este es nuestro objetivo." },
  { semana_num:24, dia_num:6, titulo_dia:"S24D6 – Revisione Lavoro B1", tema:"Repaso semana 24: comunicación profesional B1", actividad_srs:"Sesión SRS completa semana 24.", actividad_input:"Podcast: Il lavoro del futuro – busca episodio en Rai o Chora Media.", actividad_output:"Conversación profesional 20 min: temas de trabajo, carrera y futuro en Italia.", tarea_dia:"Grábate haciendo una presentación profesional de 3 minutos en italiano.", frase_clave_it:"Il mio italiano professionale è migliorato enormemente. Mi sento pronto.", frase_clave_es:"Mi italiano profesional mejoró enormemente. Me siento listo." },
  { semana_num:25, dia_num:4, titulo_dia:"S25D4 – Musei e Patrimonio", tema:"Museos y patrimonio cultural italiano", actividad_srs:"Repaso + 4 tarjetas di arte/patrimonio.", actividad_input:"Visita virtual del Museo Nazionale Romano online. Lee las descripciones.", actividad_output:"Actúa como guía turístico italiano con la IA: explica 3 obras de arte.", tarea_dia:"Escribe la audio-guía de una sala de museo italiano imaginario (150 palabras).", frase_clave_it:"Questo affresco risale al Quattrocento. È opera di un artista fiorentino.", frase_clave_es:"Este fresco data del siglo XV. Es obra de un artista florentino." },
  { semana_num:25, dia_num:5, titulo_dia:"S25D5 – La Letteratura Italiana", tema:"Literatura italiana en contexto", actividad_srs:"Repaso + 3 tarjetas di letteratura.", actividad_input:"Lee el primer canto de la Divina Commedia simplificado en italiano moderno.", actividad_output:"Habla con la IA sobre los grandes autores italianos: Dante, Calvino, Moravia.", tarea_dia:"Escribe tu recomendación de un libro italiano en 100 palabras para un amigo hispanohablante.", frase_clave_it:"Dante Alighieri ha inventato la lingua italiana moderna. Un genio assoluto.", frase_clave_es:"Dante Alighieri inventó la lengua italiana moderna. Un genio absoluto." },
  { semana_num:25, dia_num:6, titulo_dia:"S25D6 – Revisione Cultura", tema:"Repaso semana 25: arte y cultura", actividad_srs:"Sesión SRS completa semana 25.", actividad_input:"Lee el texto 'Il Rinascimento Italiano' en Lecturas por segunda vez.", actividad_output:"Conversación cultural 25 min: arte, storia, letteratura italiana.", tarea_dia:"Grábate hablando de la cultura italiana que más te impresiona. 3 minutos.", frase_clave_it:"L'Italia è una nazione straordinaria. Ogni angolo racconta secoli di storia.", frase_clave_es:"Italia es una nación extraordinaria. Cada rincón cuenta siglos de historia." },
  { semana_num:26, dia_num:4, titulo_dia:"S26D4 – Politica Italiana", tema:"El sistema político italiano", actividad_srs:"Repaso + 4 tarjetas di politica/istituzioni.", actividad_input:"Lee sobre il Parlamento italiano y i partiti politici en quirinale.it.", actividad_output:"Explica a la IA cómo funciona el sistema político italiano. Ella te hace preguntas.", tarea_dia:"Escribe un resumen de 150 palabras sobre las instituciones políticas italianas.", frase_clave_it:"L'Italia è una Repubblica parlamentare. Il Presidente della Repubblica è il capo dello Stato.", frase_clave_es:"Italia es una República parlamentaria. El Presidente de la República es el jefe del Estado." },
  { semana_num:26, dia_num:5, titulo_dia:"S26D5 – Cambiamenti Climatici in Italia", tema:"Cambio climático e Italia", actividad_srs:"Repaso + 3 tarjetas di ambiente/clima.", actividad_input:"Lee un artículo sobre i cambiamenti climatici in Italia (corriere.it o repubblica.it).", actividad_output:"Debate con la IA sobre el impacto del cambio climático en el territorio italiano.", tarea_dia:"Escribe un artículo de 200 palabras sobre el cambio climático en Italia.", frase_clave_it:"Il cambiamento climatico minaccia i paesaggi italiani più belli e fragili.", frase_clave_es:"El cambio climático amenaza los paisajes italianos más bellos y frágiles." },
  { semana_num:26, dia_num:6, titulo_dia:"S26D6 – Revisione Attualità", tema:"Repaso semana 26: economía y actualidad", actividad_srs:"Sesión SRS completa semana 26.", actividad_input:"TG1 o TG3: 15 minutos de noticias italianas en directo.", actividad_output:"Conversación libre 25 min: economía, política, sociedad italiana.", tarea_dia:"Grábate comentando 3 noticias italianas actuales. 3 minutos.", frase_clave_it:"Capisco le notizie italiane. Riesco a partecipare alle conversazioni su attualità.", frase_clave_es:"Entiendo las noticias italianas. Puedo participar en conversaciones de actualidad." },
  { semana_num:27, dia_num:4, titulo_dia:"S27D4 – Nutrizione e Stili di Vita", tema:"Nutrición y estilos de vida en Italia", actividad_srs:"Repaso + 4 tarjetas di alimentazione/benessere.", actividad_input:"Lee el texto 'La Dieta Mediterranea' en Lecturas por segunda vez.", actividad_output:"Diseña con la IA tu plan de alimentación italiana para una semana completa.", tarea_dia:"Escribe un menú diario completo (colazione, pranzo, cena, spuntino) en italiano.", frase_clave_it:"La colazione italiana è leggera: un caffè e un cornetto. Il pranzo è il pasto principale.", frase_clave_es:"El desayuno italiano es ligero: un café y un croissant. El almuerzo es la comida principal." },
  { semana_num:27, dia_num:5, titulo_dia:"S27D5 – Lo Sport e la Salute", tema:"Deporte y salud en Italia", actividad_srs:"Repaso + 3 tarjetas di sport/salute.", actividad_input:"Lee sobre i benefici dello sport in italiano en un sitio de medicina sportiva.", actividad_output:"Habla con la IA sobre tu rutina deportiva actual y cómo mejorarla estando en Italia.", tarea_dia:"Escribe tu plan de entrenamiento semanal en italiano con actividades específicas.", frase_clave_it:"Faccio sport quattro volte a settimana. È fondamentale per il benessere fisico e mentale.", frase_clave_es:"Hago deporte cuatro veces a la semana. Es fundamental para el bienestar físico y mental." },
  { semana_num:27, dia_num:6, titulo_dia:"S27D6 – Revisione Salute B1", tema:"Repaso semana 27: salud y bienestar B1", actividad_srs:"Sesión SRS completa semana 27.", actividad_input:"Podcast Obiettivo Salute RAI: episodio sobre bienestar integral.", actividad_output:"Conversación 20 min sobre salud, medicina y estilo de vida sano en Italia.", tarea_dia:"Grábate 3 min explicando tu filosofía personal de salud y bienestar en italiano.", frase_clave_it:"Prendersi cura di sé è un atto d'amore. Mens sana in corpore sano!", frase_clave_es:"Cuidarse es un acto de amor. ¡Mente sana en cuerpo sano!" },
  { semana_num:28, dia_num:4, titulo_dia:"S28D4 – Social Media in Italiano", tema:"Redes sociales en italiano", actividad_srs:"Repaso + 4 tarjetas di media digitali.", actividad_input:"Lee 10 post en italiano de cuentas italianas en Instagram o Twitter/X.", actividad_output:"Habla con la IA sobre el impacto de los social media en la cultura italiana.", tarea_dia:"Escribe un hilo de Twitter de 5 tweets en italiano sobre tecnología y sociedad.", frase_clave_it:"I social media hanno trasformato il modo in cui gli italiani comunicano tra loro.", frase_clave_es:"Las redes sociales transformaron la manera en que los italianos se comunican entre sí." },
  { semana_num:28, dia_num:5, titulo_dia:"S28D5 – Il Futuro del Lavoro", tema:"El futuro del trabajo en Italia", actividad_srs:"Repaso + 3 tarjetas di lavoro futuro/automatizazione.", actividad_input:"Lee un report del World Economic Forum sobre lavoro e automazione in italiano.", actividad_output:"Debate con la IA: ¿qué trabajos desaparecerán en Italia en 10 años? ¿Cuáles surgirán?", tarea_dia:"Escribe un ensayo de 200 palabras sobre el futuro del trabajo en Italia.", frase_clave_it:"L'automazione eliminerà alcuni lavori, ma ne creerà di nuovi e più qualificati.", frase_clave_es:"La automatización eliminará algunos trabajos, pero creará nuevos y más cualificados." },
  { semana_num:28, dia_num:6, titulo_dia:"S28D6 – Revisione Tecnologia e Società", tema:"Repaso semana 28: tecnología e impacto social", actividad_srs:"Sesión SRS completa semana 28.", actividad_input:"TED Talk italiano: scegli uno sull'innovazione o il futuro.", actividad_output:"Conversación libre 25 min: tecnologia, innovazione, società italiana.", tarea_dia:"Grábate 3 minutos debatiendo el impacto de la IA en la sociedad italiana.", frase_clave_it:"La tecnologia è uno strumento potente. Dipende da noi usarla bene.", frase_clave_es:"La tecnología es una herramienta poderosa. Depende de nosotros usarla bien." },
  { semana_num:29, dia_num:4, titulo_dia:"S29D4 – Proverbi e Saggezza", tema:"Proverbios y sabiduría popular italiana", actividad_srs:"Repaso + 4 tarjetas di proverbi/espressioni.", actividad_input:"Lee los 20 proverbi italiani più famosi (busca en internet).", actividad_output:"Usa 8 proverbios italianos con la IA en conversación natural y explica su significado.", tarea_dia:"Escribe 5 proverbi italiani con su equivalente en español y un contexto de uso.", frase_clave_it:"Tra il dire e il fare c'è di mezzo il mare. Ma io ce la faccio!", frase_clave_es:"Del dicho al hecho hay mucho trecho. ¡Pero yo puedo lograrlo!" },
  { semana_num:29, dia_num:5, titulo_dia:"S29D5 – Il Dialetto e l'Accento", tema:"Dialectos y acentos regionales", actividad_srs:"Repaso + 3 tarjetas di dialetti/variazioni.", actividad_input:"Escucha 5 min de dialetto romano, napoletano o milanese en YouTube.", actividad_output:"Habla con la IA sobre los dialectos italianos y por qué son importantes culturalmente.", tarea_dia:"Escribe 8 oraciones sobre las diferencias entre el italiano estándar y los dialectos regionales.", frase_clave_it:"Ogni dialetto italiano è un patrimonio culturale unico e prezioso.", frase_clave_es:"Cada dialecto italiano es un patrimonio cultural único y precioso." },
  { semana_num:29, dia_num:6, titulo_dia:"S29D6 – Revisione Idiomi e Cultura", tema:"Repaso semana 29: idioms y cultura nativa", actividad_srs:"Sesión SRS completa semana 29.", actividad_input:"Podcast Italiano Vero avanzado: 40 minutos. Sin subtítulos.", actividad_output:"Conversación native-like 30 min. Usa todo tu vocabulario idiomático.", tarea_dia:"Grábate 3 min hablando con expresiones idiomáticas. ¿Suenas más natural?", frase_clave_it:"Non vedo l'ora di fare bella figura con i miei amici italiani!", frase_clave_es:"¡No puedo esperar para causar buena impresión con mis amigos italianos!" },
  { semana_num:30, dia_num:4, titulo_dia:"S30D4 – Il Grande Esame B1", tema:"Preparación examen B1 CELI o CILS", actividad_srs:"Sesión SRS final: todas las tarjetas difíciles.", actividad_input:"Descarga y estudia una prueba oficial CELI B1 o CILS Due (busca online).", actividad_output:"Simula con la IA la parte oral del examen B1: 15 min de examen oral.", tarea_dia:"Haz una prueba escrita B1 completa y corrígela con la ayuda de la IA.", frase_clave_it:"Sono pronto per l'esame B1. Ho studiato duramente per sette mesi.", frase_clave_es:"Estoy listo para el examen B1. Estudié arduamente durante siete meses." },
  { semana_num:30, dia_num:5, titulo_dia:"S30D5 – Vivere in Italiano", tema:"La vida plena en italiano", actividad_srs:"Repaso de mantenimiento final.", actividad_input:"Escucha RAI Radio 1: 30 min de contenido cotidiano en directo.", actividad_output:"Conversación de 30 min completamente libre. ¡Celebra tu italiano!", tarea_dia:"Escribe una lettera aperta a futuri studenti di italiano: i tuoi consigli per imparare.", frase_clave_it:"Ora vivo in italiano. Penso, sogno e sento in italiano. Ce l'ho fatta!", frase_clave_es:"Ahora vivo en italiano. Pienso, sueño y siento en italiano. ¡Lo logré!" },
  { semana_num:30, dia_num:6, titulo_dia:"S30D6 – Traguardo! 🎉 Fine del Percorso", tema:"Celebración del nivel B1 alcanzado", actividad_srs:"Repaso libre: estudia lo que más quieras.", actividad_input:"Lee qualcosa per piacere in italiano: un libro, un articolo, una storia.", actividad_output:"Conversazione finale celebrativa: racconta il tuo percorso dall'A0 al B1.", tarea_dia:"Grábate 5 min hablando libre sobre tu viaje de aprendizaje. Guarda el audio para siempre.", frase_clave_it:"Ho trasformato il mio italiano da zero a B1 in 30 settimane. Sono incredibilmente orgoglioso!", frase_clave_es:"Transformé mi italiano de cero a B1 en 30 semanas. ¡Estoy increíblemente orgulloso!" },
];

// ─── SEED LECTURAS (15 textos graduados A0→B1) ────────────────────────────
const SEED_LECTURAS = [
  { titulo:"Al Bar", nivel:"A0", semana_desde:1, emoji:"☕", activa:true,
    texto:"Marco entra nel bar. Il barista sorride e dice: \"Buongiorno! Cosa desidera?\"\n\nMarco risponde: \"Un caffè e un cornetto, per favore.\"\n\n\"Subito!\" dice il barista. Il caffè è caldo e buono. Marco paga due euro e cinquanta. Saluta il barista: \"Grazie, arrivederci!\"\n\n\"Arrivederci!\" risponde il barista.",
    glosario_json:JSON.stringify({"bar":"cafetería","barista":"barista","cornetto":"croissant italiano","caldo":"caliente","buono":"bueno","paga":"paga","saluta":"saluda","subito":"enseguida"}) },
  { titulo:"Cerco Casa", nivel:"A1", semana_desde:1, emoji:"🏠", activa:true,
    texto:"Lucia cerca un appartamento a Milano. Legge gli annunci su internet. Trova un bilocale in centro: due stanze, un bagno e una cucina moderna.\n\nChiama il padrone di casa. \"Buongiorno, chiamo per l'appartamento. È ancora disponibile?\"\n\n\"Sì, certo! L'affitto è novecento euro al mese, spese incluse.\"\n\n\"Quando posso vederlo?\" chiede Lucia.\n\n\"Domani mattina, alle dieci. Va bene?\"\n\n\"Perfetto, grazie!\"\n\nLucia è contenta. L'appartamento sembra ideale per lei.",
    glosario_json:JSON.stringify({"cerca":"busca","annunci":"anuncios","bilocale":"piso de dos ambientes","ancora":"todavía","disponibile":"disponible","al mese":"al mes","posso":"puedo","domani":"mañana","contenta":"contenta","sembra":"parece"}) },
  { titulo:"In Treno", nivel:"A1", semana_desde:2, emoji:"🚂", activa:true,
    texto:"Paolo deve andare a Firenze per lavoro. Va alla stazione e compra un biglietto. \"Un biglietto per Firenze, andata e ritorno, per favore.\"\n\n\"Partenza alle nove e trenta, binario sei. Costa quarantadue euro.\"\n\nPaolo sale sul treno. Il viaggio dura un'ora e mezza. Guarda dal finestrino: la campagna italiana è bellissima. Campi verdi, colline, piccoli paesi.\n\nArriva a Firenze alle undici. Il sole splende e la città è meravigliosa.",
    glosario_json:JSON.stringify({"deve":"debe","lavoro":"trabajo","andata e ritorno":"ida y vuelta","partenza":"salida","binario":"andén","sale":"sube","viaggio":"viaje","dura":"dura","finestrino":"ventanilla","campagna":"campiña","bellissima":"bellísima","splende":"brilla"}) },
  { titulo:"Dal Medico", nivel:"A2", semana_desde:2, emoji:"🏥", activa:true,
    texto:"Carla non si sente bene da tre giorni. Ha la febbre e mal di gola. Decide di andare dal medico.\n\n\"Buongiorno dottore, ho mal di gola e la febbre da giovedì.\"\n\nIl medico la visita con attenzione. \"Apra la bocca, per favore. Dica 'aaah'.\"\n\nDopo la visita, il dottore spiega: \"Ha un'infezione alla gola. Le prescrivo degli antibiotici. Li prenda per sette giorni, mattina e sera.\"\n\n\"Devo stare a riposo?\" chiede Carla.\n\n\"Sì, almeno due giorni. Beva molta acqua e si riposi.\"\n\nCarla ringrazia il medico e va in farmacia.",
    glosario_json:JSON.stringify({"non si sente bene":"no se siente bien","febbre":"fiebre","mal di gola":"dolor de garganta","visita":"examina","apra":"abra","bocca":"boca","spiega":"explica","antibiotici":"antibióticos","almeno":"al menos","beva":"beba","si riposi":"descanse","ringrazia":"agradece"}) },
  { titulo:"La Ricetta della Carbonara", nivel:"A1", semana_desde:6, emoji:"🍝", activa:true,
    texto:"La carbonara è uno dei piatti più famosi d'Italia. Nasce a Roma. Gli ingredienti sono semplici: spaghetti, guanciale, uova, pecorino romano e pepe nero.\n\nPrima si cuoce la pasta in abbondante acqua salata. Intanto si frigge il guanciale in padella fino a renderlo croccante.\n\nSi sbattono le uova con il pecorino grattugiato e molto pepe. Quando la pasta è pronta, si scola e si mescola fuori dal fuoco con le uova e il guanciale.\n\nIl segreto è non usare la panna — non è nella ricetta originale!",
    glosario_json:JSON.stringify({"nasce":"nace","ingredienti":"ingredientes","guanciale":"carrillada de cerdo curada","uova":"huevos","pepe nero":"pimienta negra","cuoce":"cocina","abbondante":"abundante","intanto":"mientras tanto","frigge":"fríe","croccante":"crujiente","sbattono":"baten","grattugiato":"rallado","scola":"escurre","mescola":"mezcla","panna":"nata/crema"}) },
  { titulo:"Una Famiglia Italiana", nivel:"A1", semana_desde:10, emoji:"👨‍👩‍👧‍👦", activa:true,
    texto:"La famiglia Rossi è una famiglia italiana tipica. Il padre si chiama Luca e lavora come ingegnere a Bologna. La madre si chiama Francesca ed è insegnante di matematica.\n\nHanno due figli: Andrea, che ha quindici anni, e Sofia, che ne ha undici. I nonni vivono in un piccolo paese in Toscana.\n\nOgni domenica tutta la famiglia si riunisce a casa dei nonni. La nonna prepara sempre un pranzo abbondante: pasta al forno, arrosto e tiramisù.\n\nAndrea suona la chitarra e Sofia dipinge. Luca e Francesca adorano viaggiare in estate.",
    glosario_json:JSON.stringify({"tipica":"típica","ingegnere":"ingeniero","insegnante":"profesora","si riunisce":"se reúne","abbondante":"abundante","pasta al forno":"pasta al horno","arrosto":"asado","suona":"toca (instrumento)","adorano":"adoran"}) },
  { titulo:"Il Colloquio di Lavoro", nivel:"A2", semana_desde:13, emoji:"💼", activa:true,
    texto:"Giulia ha un colloquio di lavoro in una grande azienda di Milano. Si è preparata molto: ha studiato l'azienda, ha riletto il curriculum e ha preparato le risposte alle domande più comuni.\n\nEntra nell'ufficio. La direttrice del personale le chiede: \"Mi parli di sé.\"\n\n\"Ho una laurea in comunicazione e tre anni di esperienza nel marketing digitale. Sono precisa, creativa e lavoro bene in team.\"\n\n\"Perché vuole lavorare con noi?\"\n\n\"Perché la vostra azienda è innovativa e condivido i vostri valori. Voglio crescere professionalmente qui.\"\n\nAlla fine del colloquio, la direttrice sorride. \"La chiameremo entro la fine della settimana.\"",
    glosario_json:JSON.stringify({"colloquio":"entrevista","si è preparata":"se preparó","riletto":"releído","personale":"personal (RRHH)","Mi parli di sé":"Hábleme de usted","laurea":"licenciatura/grado","precisa":"precisa","condivido":"comparto","valori":"valores","entro":"antes de","La chiameremo":"La llamaremos"}) },
  { titulo:"Sogni e Progetti", nivel:"A2", semana_desde:15, emoji:"✨", activa:true,
    texto:"Marco ha trent'anni e vive a Milano da due anni. È arrivato dalla Colombia con un sogno: costruire una vita nuova in Italia.\n\nOggi Marco lavora in un'agenzia di comunicazione. Parla italiano bene, ha colleghi simpatici e un appartamento in affitto nel quartiere Navigli.\n\nMa Marco ha ancora molti sogni per il futuro. L'anno prossimo vuole ottenere la residenza permanente. Tra due anni vorrebbe aprire la sua agenzia.\n\nMarco sa che la strada non è facile, ma è determinato. \"Ce la farò,\" dice sempre. \"L'Italia è la mia nuova casa.\"",
    glosario_json:JSON.stringify({"sogno":"sueño","costruire":"construir","agenzia":"agencia","colleghi":"colegas","quartiere":"barrio","ottenere":"obtener","residenza permanente":"residencia permanente","vorrebbe":"querría","aprire":"abrir","determinato":"decidido/determinado","Ce la farò":"Lo lograré"}) },
  { titulo:"La Gastronomia Italiana nel Mondo", nivel:"A2", semana_desde:16, emoji:"🌍", activa:true,
    texto:"La cucina italiana è famosa in tutto il mondo. Milioni di persone ogni giorno mangiano pasta, pizza e gelato in ogni angolo del pianeta.\n\nMa cos'è che rende la cucina italiana così speciale? Secondo gli esperti, ci sono tre ragioni principali.\n\nIn primo luogo, gli ingredienti: l'Italia usa prodotti freschi e di alta qualità. In secondo luogo, la semplicità: le ricette italiane usano pochi ingredienti, ma combinati perfettamente. In terzo luogo, la tradizione: ogni regione ha le sue specialità, tramandate di generazione in generazione.\n\nOggi più di 75.000 ristoranti italiani esistono negli Stati Uniti. In tutto il mondo, sono oltre 100.000.",
    glosario_json:JSON.stringify({"angolo":"rincón","pianeta":"planeta","rende":"hace/vuelve","speciale":"especial","esperti":"expertos","in primo luogo":"en primer lugar","semplicità":"simplicidad","tramandate":"transmitidas","generazione":"generación"}) },
  { titulo:"Vita da Expat", nivel:"B1", semana_desde:23, emoji:"🌐", activa:true,
    texto:"Vivere all'estero è un'esperienza che cambia la vita. Lo sa bene Sara, trentadue anni, colombiana, che da tre anni vive a Bologna.\n\n\"All'inizio è stato difficile,\" racconta. \"Non capivo il dialetto bolognese, mi mancava la famiglia, i prezzi mi sembravano altissimi.\"\n\nMa Sara non si è arresa. Ha frequentato un corso di italiano intensivo, si è iscritta in palestra dove ha conosciuto le prime amiche italiane, ha trovato lavoro come grafica freelance.\n\nOggi si sente a casa. \"L'italiano non è più una lingua straniera per me,\" dice sorridendo. \"Lo sogno, lo penso, lo vivo.\"\n\nIl suo consiglio per chi vuole trasferirsi in Italia? \"Buttati. Parla, sbaglia, impara. L'Italia ti aspetta.\"",
    glosario_json:JSON.stringify({"all'estero":"en el extranjero","racconta":"cuenta","dialetto":"dialecto","mi mancava":"echaba de menos","altissimi":"altísimos","non si è arresa":"no se rindió","frequentato":"asistido","si è iscritta":"se inscribió","grafica":"diseñadora gráfica","straniera":"extranjera","Buttati":"Lánzate","sbaglia":"te equivocas"}) },
  { titulo:"La Dieta Mediterranea", nivel:"B1", semana_desde:27, emoji:"🥗", activa:true,
    texto:"La dieta mediterranea è riconosciuta dall'UNESCO come patrimonio culturale immateriale dell'umanità. Non è solo un regime alimentare: è uno stile di vita.\n\nI principi fondamentali sono semplici. Abbondanza di frutta, verdura, legumi, cereali integrali e olio d'oliva come grasso principale. Consumo moderato di pesce, latticini e vino rosso. Poca carne rossa.\n\nGli studi scientifici dimostrano che chi segue questa dieta ha un rischio significativamente inferiore di malattie cardiovascolari, diabete di tipo 2 e alcune forme di cancro.\n\nMa il segreto non è solo nel cibo. È nel modo di mangiare: lentamente, in compagnia, senza fretta. Il pranzo domenicale italiano, lungo e conviviale, è forse il miglior esempio.",
    glosario_json:JSON.stringify({"riconosciuta":"reconocida","patrimonio culturale":"patrimonio cultural","immateriale":"inmaterial","umanità":"humanidad","regime alimentare":"régimen alimentario","legumi":"legumbres","cereali integrali":"cereales integrales","latticini":"lácteos","dimostrano":"demuestran","cardiovascolari":"cardiovasculares","inferiore":"inferior","conviviale":"convivial/festivo"}) },
  { titulo:"Il Rinascimento Italiano", nivel:"B1", semana_desde:25, emoji:"🎨", activa:true,
    texto:"Il Rinascimento è stato uno dei periodi più straordinari della storia umana. Fiorito soprattutto in Italia tra il XIV e il XVII secolo, ha rivoluzionato arte, scienza, letteratura e filosofia.\n\nFirenze fu il cuore di questo movimento. I Medici, la potente famiglia fiorentina, finanziarono artisti come Botticelli, Leonardo da Vinci e Michelangelo. Questi giganti dell'arte hanno creato opere che ancora oggi ci lasciano senza fiato.\n\nMa il Rinascimento non fu solo arte. Galileo Galilei rivoluzionò l'astronomia. Niccolò Machiavelli ridefinì la politica. Dante, Petrarca e Boccaccio trasformarono la letteratura italiana.\n\nL'eredità del Rinascimento è ancora viva. I musei italiani conservano il 60% di tutto il patrimonio artistico mondiale.",
    glosario_json:JSON.stringify({"straordinari":"extraordinarios","Fiorito":"florecido","rivoluzionò":"revolucionó","finanziarono":"financiaron","ci lasciano senza fiato":"nos dejan sin aliento","ridefinì":"redefinió","trasformarono":"transformaron","eredità":"herencia","conservano":"conservan","patrimonio artistico":"patrimonio artístico"}) },
  { titulo:"Lo Sport in Italia", nivel:"A1", semana_desde:9, emoji:"⚽", activa:true,
    texto:"In Italia lo sport più popolare è il calcio. Ogni settimana milioni di italiani guardano le partite in televisione o allo stadio.\n\nLa nazionale italiana di calcio ha vinto quattro campionati del mondo. I tifosi italiani sono molto appassionati.\n\nMa non c'è solo il calcio. Il ciclismo è molto amato: il Giro d'Italia è una delle gare più famose al mondo. Anche la pallavolo e il tennis hanno tantissimi appassionati.\n\nIn inverno, sulle Alpi e sugli Appennini, molti italiani sciare. D'estate il nuoto e il beach volley sono le attività più praticate.",
    glosario_json:JSON.stringify({"calcio":"fútbol","partite":"partidos","nazionale":"selección nacional","campionati del mondo":"campeonatos del mundo","tifosi":"fanáticos/hinchas","appassionati":"apasionados","ciclismo":"ciclismo","gare":"carreras","pallavolo":"voleibol","sciare":"esquiar","praticate":"practicadas"}) },
  { titulo:"Alla Questura", nivel:"A2", semana_desde:18, emoji:"🏛️", activa:true,
    texto:"Ahmed è arrivato in Italia tre mesi fa. Oggi deve andare in questura per il permesso di soggiorno.\n\nArriva alle otto di mattina. C'è già una lunga fila. Aspetta due ore prima di entrare allo sportello.\n\nL'agente gli chiede i documenti: passaporto, contratto di lavoro, codice fiscale e due foto. Ahmed ha tutto in ordine.\n\n\"Ha compilato il modulo?\" chiede l'agente.\n\n\"Sì, eccolo.\" Ahmed è preparato.\n\nL'agente controlla tutto con attenzione. \"Bene. Torni tra quindici giorni per ritirare il permesso.\"\n\n\"Grazie mille,\" risponde Ahmed con un sorriso. È stanco ma soddisfatto.",
    glosario_json:JSON.stringify({"questura":"jefatura de policía","fila":"cola/fila","sportello":"ventanilla","agente":"agente","contratto di lavoro":"contrato de trabajo","compilato":"rellenado/completado","modulo":"formulario","controlla":"revisa","Torni":"Vuelva","ritirare":"recoger","soddisfatto":"satisfecho"}) },
  { titulo:"L'Italiano degli Idiomi", nivel:"B1", semana_desde:29, emoji:"🗣️", activa:true,
    texto:"L'italiano è una lingua ricchissima di espressioni idiomatiche. Capirle e usarle è il segno che si sta davvero imparando la lingua, non solo le regole grammaticali.\n\nAlcune espressioni sono molto usate nel quotidiano. \"In bocca al lupo\" si dice per augurare buona fortuna. La risposta corretta è \"Crepi!\" — non \"Grazie\".\n\n\"Non vedo l'ora\" non significa che non si vede l'ora sull'orologio: significa che si è molto impazienti, che si aspetta qualcosa con entusiasmo.\n\n\"Fare bella figura\" è fondamentale nella cultura italiana: significa fare una buona impressione. Gli italiani ci tengono molto.\n\nE poi c'è \"Ce la faccio\" — forse la frase più ottimista della lingua. Significa che si riesce, che si trova il modo.",
    glosario_json:JSON.stringify({"ricchissima":"riquísima","idiomatiche":"idiomáticas","segno":"señal","augurare":"desear","buona fortuna":"buena suerte","quotidiano":"cotidiano","impazienti":"impacientes","impressione":"impresión","ci tengono molto":"les importa mucho","ottimista":"optimista","si riesce":"se logra"}) },

  // ── TEXTOS B1 AVANZADO – Semanas 25–30 ──────────────────────────────────────

  { titulo:"Il Sistema Politico Italiano", nivel:"B1", semana_desde:26, emoji:"🏛️", activa:true,
    texto:"L'Italia è una repubblica parlamentare fondata nel 1948, dopo la caduta del fascismo e la fine della Seconda Guerra Mondiale. La Costituzione italiana, entrata in vigore il 1° gennaio 1948, è considerata una delle più avanzate al mondo.\n\nIl Parlamento italiano è bicamerale: si compone della Camera dei Deputati e del Senato della Repubblica. I parlamentari vengono eletti ogni cinque anni dai cittadini italiani.\n\nIl Presidente della Repubblica è il capo dello Stato, eletto dal Parlamento ogni sette anni. Ha un ruolo principalmente simbolico e di garanzia costituzionale. Il governo, invece, è guidato dal Presidente del Consiglio — quello che in altri paesi si chiamerebbe primo ministro.\n\nL'Italia è nota per l'instabilità dei suoi governi: dalla nascita della Repubblica, il paese ha avuto oltre sessanta governi diversi. Questo è spesso citato come uno dei principali problemi strutturali del sistema politico italiano.\n\nNonostante ciò, le istituzioni democratiche italiane hanno dimostrato una notevole resilienza nel corso dei decenni.",
    glosario_json:JSON.stringify({"repubblica parlamentare":"república parlamentaria","caduta":"caída","fascismo":"fascismo","entrata in vigore":"entrada en vigor","bicamerale":"bicameral","si compone":"se compone","eletti":"elegidos","capo dello Stato":"jefe de Estado","garanzia costituzionale":"garantía constitucional","Presidente del Consiglio":"Presidente del Consejo (Primer Ministro)","instabilità":"inestabilidad","istituzioni":"instituciones","resilienza":"resiliencia","decenni":"décadas"}) },

  { titulo:"L'Economia Italiana: Forze e Sfide", nivel:"B1", semana_desde:26, emoji:"📊", activa:true,
    texto:"L'Italia è la terza economia dell'eurozona e una delle più grandi al mondo. La sua struttura economica è particolare: da un lato, grandi multinazionali come Ferrari, Fiat e Luxottica; dall'altro, un tessuto diffusissimo di piccole e medie imprese — le famose PMI — che rappresentano il cuore produttivo del paese.\n\nIl Nord Italia — in particolare la Lombardia, il Veneto e l'Emilia-Romagna — è uno dei territori più industrializzati d'Europa. Il Sud, invece, storicamente soffre di un divario economico significativo: tassi di disoccupazione più elevati, minori investimenti e una diffusa emigrazione verso il Nord o l'estero.\n\nLe sfide principali dell'economia italiana sono ben note: un debito pubblico elevato, una burocrazia lenta, un sistema fiscale complesso e una scarsa produttività nel settore pubblico. Eppure l'Italia continua ad essere una potenza nell'industria manifatturiera, nel turismo e nel settore agroalimentare.\n\nIl Made in Italy — simbolo di qualità, design e tradizione artigianale — vale miliardi di euro ogni anno sui mercati internazionali.",
    glosario_json:JSON.stringify({"eurozona":"eurozona","multinazionali":"multinacionales","tessuto diffusissimo":"tejido muy extendido","piccole e medie imprese":"pequeñas y medianas empresas","cuore produttivo":"corazón productivo","divario":"brecha","tassi di disoccupazione":"tasas de desempleo","emigrazione":"emigración","debito pubblico":"deuda pública","burocrazia":"burocracia","produttività":"productividad","manifatturiera":"manufacturera","agroalimentare":"agroalimentario","artigianale":"artesanal"}) },

  { titulo:"Dante e la Lingua Italiana", nivel:"B1", semana_desde:25, emoji:"📜", activa:true,
    texto:"Dante Alighieri è considerato il padre della lingua italiana. Nato a Firenze nel 1265 e morto a Ravenna nel 1321, ha scritto la sua opera più grande — la Divina Commedia — in volgare fiorentino, non in latino come era consuetudine per i testi dotti dell'epoca.\n\nQuesta scelta fu rivoluzionaria. Il latino era la lingua della chiesa, della scienza e della cultura. Scrivere in volgare significava aprire la letteratura al popolo, non solo ai clerici e ai nobili.\n\nLa Divina Commedia è divisa in tre cantiche: Inferno, Purgatorio e Paradiso. Dante immagina un viaggio nell'aldilà, guidato prima dal poeta romano Virgilio e poi da Beatrice, la donna che aveva amato.\n\nL'influenza di Dante sulla lingua italiana è immensa. Molte espressioni del quotidiano moderno derivano direttamente dalle sue terzine. Quando diciamo \"non c'è problema\" o descriviamo qualcuno come \"lasciate ogni speranza\" in modo ironico, stiamo usando echi della sua poesia.\n\nOgni anno il 25 marzo si celebra il Dantedì, la giornata nazionale dedicata al poeta.",
    glosario_json:JSON.stringify({"volgare fiorentino":"toscano vulgar/florentino","consuetudine":"costumbre","dotti":"eruditos","epoca":"época","rivoluzionaria":"revolucionaria","clerici":"clérigos","nobili":"nobles","cantiche":"cánticas","aldilà":"más allá","guidato":"guiado","terzine":"tercetos","echi":"ecos","celebra":"celebra","dedicata":"dedicada"}) },

  { titulo:"Il Cambiamento Climatico e l'Italia", nivel:"B1", semana_desde:27, emoji:"🌊", activa:true,
    texto:"L'Italia è uno dei paesi europei più vulnerabili agli effetti del cambiamento climatico. La sua posizione geografica — protesa nel Mediterraneo, con lunghe coste, alte montagne e pianure fertili — la espone a rischi molto diversificati.\n\nAl Nord, i ghiacciai delle Alpi si stanno riducendo a un ritmo allarmante. Il ghiacciaio della Marmolada, il più grande delle Dolomiti, ha perso oltre il 40% del suo volume negli ultimi cinquant'anni. In estate 2022, un enorme crollo di ghiaccio causò undici vittime.\n\nAl Centro-Sud, il problema principale è la siccità. Estati sempre più lunghe e calde mettono in crisi l'agricoltura, provocano incendi boschivi e riducono le riserve idriche. La Sicilia e la Sardegna hanno subìto negli ultimi anni le temperature più alte mai registrate in Europa.\n\nVenezia, nel frattempo, affronta il problema dell'acqua alta. Il MOSE — un sistema di barriere mobili — è stato completato dopo decenni di lavori e miliardi di euro spesi. Ma gli esperti avvertono che potrebbe non essere sufficiente se il livello del mare continuerà a salire.\n\nIl governo italiano ha investito nel Piano Nazionale di Ripresa e Resilienza fondi significativi per la transizione ecologica. Ma la strada è ancora lunga.",
    glosario_json:JSON.stringify({"vulnerabili":"vulnerables","protesa":"extendida","espone":"expone","ghiacciai":"glaciares","allarmante":"alarmante","crollo":"derrumbe/colapso","vittime":"víctimas","siccità":"sequía","incendi boschivi":"incendios forestales","riserve idriche":"reservas hídricas","acqua alta":"inundación (Venecia)","barriere mobili":"barreras móviles","avvertono":"advierten","transizione ecologica":"transición ecológica"}) },

  { titulo:"L'Arte di Arrangiarsi", nivel:"B1", semana_desde:28, emoji:"🧠", activa:true,
    texto:"C'è una parola nella cultura italiana che non ha un equivalente esatto in spagnolo: arrangiarsi. Significa cavarsela, trovare una soluzione creativa quando le cose non vanno come previsto. È quasi una filosofia di vita.\n\nGli italiani hanno elevato l'arte di arrangiarsi a un livello straordinario. La storia lo dimostra: un paese che ha attraversato invasioni, divisioni politiche, terremoti, due guerre mondiali e crisi economiche ricorrenti, eppure ha sempre trovato il modo di rialzarsi.\n\nNel quotidiano, arrangiarsi può significare molte cose. Riparare qualcosa invece di buttarla via. Trovare una scorciatoia burocratica — legale, naturalmente. Cucinare un pasto delizioso con quello che c'è nel frigorifero. Improvvisare una soluzione tecnica con nastro adesivo e ingegno.\n\nC'è però un lato oscuro. A volte arrangiarsi sconfina nell'elusione delle regole, nella furbizia che penalizza chi segue le norme. Gli italiani stessi ne sono consapevoli e dibattono su dove finisce l'ingegno creativo e dove inizia la mancanza di rispetto per il sistema.\n\nMa nel suo senso migliore, arrangiarsi è un riflesso di resilienza, creatività e ottimismo. E forse, per chi viene da un paese come la Colombia, non è poi così difficile da capire.",
    glosario_json:JSON.stringify({"arrangiarsi":"arreglárselas/ingeniárselas","cavarsela":"salir adelante","previsto":"previsto","elevato":"elevado","attraversato":"atravesado","rialzarsi":"levantarse/recuperarse","scorciatoia":"atajo","ingegno":"ingenio","nastro adesivo":"cinta adhesiva","sconfina":"desborda","elusione":"evasión","furbizia":"astucia/viveza","penalizza":"penaliza","consapevoli":"conscientes","ottimismo":"optimismo"}) },

  { titulo:"Vivere a B1: Il Tuo Italiano Oggi", nivel:"B1", semana_desde:30, emoji:"🎯", activa:true,
    texto:"Sei arrivato qui. Hai letto testi su Dante, sull'economia italiana, sul cambiamento climatico. Hai imparato le differenze tra il congiuntivo e il condizionale, hai discusso di politica con una IA in italiano, hai studiato idiomi e proverbi.\n\nQuesto è il livello B1. Non è la fine — è il inizio del vero italiano.\n\nAl livello B1 puoi fare cose concrete. Puoi aprire un conto in banca a Milano, spiegare i tuoi sintomi a un medico, negoziare un contratto di affitto, discutere di un film con un amico italiano. Non è perfetto, ma è funzionale. E funzionale significa libero.\n\nMa c'è qualcosa che nessun libro di testo ti insegna: la lingua non è solo grammatica e vocabolario. È il modo in cui gli italiani gesticolano mentre parlano, il silenzio carico di significato, il tono che cambia tutto.\n\nQuesta app ti ha dato gli strumenti. Adesso tocca a te. Parla con un madrelingua. Guarda una serie italiana senza sottotitoli. Leggi un giornale. Sorridi quando sbagli — ogni errore è italiano vivo, non italiano sbagliato.\n\nIl tuo sogno è vivere in Italia. Con questo italiano, non sei un turista. Sei qualcuno che appartiene.",
    glosario_json:JSON.stringify({"sei arrivato":"has llegado","congiuntivo":"subjuntivo","condizionale":"condicional","idiomi":"modismos","proverbi":"proverbios","funzionale":"funcional","gesticolano":"gesticulan","carico di significato":"cargado de significado","madrelingua":"hablante nativo","sottotitoli":"subtítulos","sbagli":"te equivocas","appartiene":"pertenece","tocca a te":"te toca a ti"}) },
];

// ─── STORIE — ARCOS NARRATIVOS CON DECISIONES (v21) ────────────────────────
const STORIE_ARCOS = [
  {
    id:"vicino", titulo:"Il Nuovo Vicino", emoji:"🏚️", nivel:"A1-A2", semana_desde:5,
    desc:"Te mudas a Florencia y descubres a un vecino misterioso.",
    capitulos: [
      { id:"vicino_1", num:1,
        texto:"Ti sei appena trasferito in un appartamento a Firenze. È il tuo primo giorno e stai ancora sistemando le scatole.\n\nDi colpo, senti dei rumori strani dall'appartamento accanto: qualcosa che striscia sul pavimento, poi un tonfo. Curioso, esci sul pianerottolo.\n\nLa porta del vicino è aperta. Un uomo anziano, con i capelli bianchi e gli occhiali sulla punta del naso, sta trascinando una grande cassa di legno. Si chiama Sandro. Ti guarda, un po' diffidente.\n\n\"Buongiorno,\" dice, senza fermarsi. \"Scusi il rumore.\"",
        glosario_json:JSON.stringify({"trasferito":"trasladado","sistemando":"organizando","scatole":"cajas","striscia":"se arrastra","tonfo":"golpe sordo","pianerottolo":"rellano/descansillo","trascinando":"arrastrando","cassa":"caja (de madera)","diffidente":"desconfiado","scusi":"disculpe"}),
        decision: {
          pregunta:"Cosa fai?",
          opciones: [
            { texto:"Gli offro il mio aiuto con la cassa.", next:"vicino_2a" },
            { texto:"Torno a casa — non voglio impicciarmi.", next:"vicino_2b" },
          ]
        }
      },
      { id:"vicino_2a", num:2,
        texto:"\"Posso aiutarla?\" chiedi, avvicinandoti.\n\nSandro si ferma, sorpreso. Ti guarda per un momento, poi sorride leggermente. \"Be', se insiste... questa cassa è pesante per le mie ginocchia.\"\n\nInsieme, spingete la cassa dentro l'appartamento. Dentro, tra la carta da imballaggio, vedi pezzi di legno intagliato, ante di armadi antichi, ferramenta dorata.\n\n\"Restauro mobili,\" spiega Sandro, asciugandosi le mani. \"Da quarant'anni. Vuole un caffè? È il minimo che posso offrirle.\"\n\nAccetti. Mentre l'espresso bolle, Sandro ti racconta della sua bottega, chiusa da poco per l'affitto troppo alto. Ora lavora da casa, per pochi clienti fedeli.",
        glosario_json:JSON.stringify({"avvicinandoti":"acercándote","ginocchia":"rodillas","spingete":"empujan","carta da imballaggio":"papel de embalaje","intagliato":"tallado","ante":"puertas (de mueble)","ferramenta":"herrajes","dorata":"dorada","restauro":"restauro (de muebles)","bottega":"taller/tienda pequeña","fedeli":"fieles"}),
        decision: null, next: "vicino_3"
      },
      { id:"vicino_2b", num:2,
        texto:"Torni in casa e chiudi la porta. Per un paio di giorni, non pensi più al vicino — ma i rumori continuano: martellate, il suono di una sega, e a volte una radio che trasmette musica classica a basso volume.\n\nUna mattina, mentre esci per andare al lavoro, trovi un biglietto sotto la tua porta. È scritto a mano, con una grafia elegante e un po' tremolante:\n\n\"Mi scusi per il disturbo dei giorni scorsi. Se le va, mi farebbe piacere offrirle un caffè per farmi perdonare. — Sandro, app. 4B\"\n\nResti sorpreso. Non te lo aspettavi.",
        glosario_json:JSON.stringify({"martellate":"martillazos","sega":"sierra","trasmette":"transmite","a basso volume":"a bajo volumen","biglietto":"nota/papelito","grafia":"caligrafía","tremolante":"tembloroso","disturbo":"molestia","farmi perdonare":"hacerme perdonar","ti aspettavi":"esperabas"}),
        decision: null, next: "vicino_3"
      },
      { id:"vicino_3", num:3,
        texto:"Qualche giorno dopo, Sandro ti racconta di un problema. Un cliente straniero — un collezionista belga — vuole comprare alcuni dei suoi mobili restaurati, ma tutta la corrispondenza è in inglese e Sandro, da buon fiorentino di una certa età, non parla altro che italiano (e un po' di dialetto).\n\n\"Ho un catalogo da preparare,\" dice, mostrandoti un quaderno pieno di descrizioni scritte a mano: dimensioni, epoche, tipi di legno, prezzi. \"Ma non so come si dice 'cassettone Settecento' in inglese, figuriamoci tutto il resto.\"\n\nTi guarda, quasi imbarazzato. \"Lei... per caso parla altre lingue?\"",
        glosario_json:JSON.stringify({"collezionista":"coleccionista","corrispondenza":"correspondencia","quaderno":"cuaderno","cassettone":"cómoda/arcón","epoche":"épocas","figuriamoci":"imagínate","imbarazzato":"avergonzado","per caso":"por casualidad"}),
        decision: {
          pregunta:"Vuoi aiutarlo con il catalogo?",
          opciones: [
            { texto:"Sì, gli dedico il pomeriggio.", next:"vicino_4a" },
            { texto:"Mi dispiace, ho troppo da fare oggi.", next:"vicino_4b" },
          ]
        }
      },
      { id:"vicino_4a", num:4,
        texto:"Passi il pomeriggio nel laboratorio di Sandro, tra odore di legno e cera. Lui descrive ogni pezzo a voce alta — \"questo è un comò del primo Ottocento, intarsi originali, restaurato a mano\" — e tu traduci, cercando le parole giuste, a volte ridendo per gli errori di entrambi.\n\nVerso sera, il catalogo è pronto: dieci pezzi, descritti in italiano e nella lingua del collezionista. Sandro lo guarda, soddisfatto.\n\n\"Lei ha un buon orecchio per le lingue,\" dice. \"E io ho un buon occhio per i mobili. Direi che siamo un'ottima squadra, vicino.\"\n\nDa quel giorno, ogni tanto bussi alla sua porta — e lui alla tua. Non sei più solo il \"nuovo vicino\": sei diventato un amico, e hai imparato un vocabolario che nessun libro di testo ti avrebbe insegnato: legni, epoche, mestieri antichi.",
        glosario_json:JSON.stringify({"cera":"cera","comò":"cómoda","intarsi":"taraceas/incrustaciones","entrambi":"ambos","soddisfatto":"satisfecho","orecchio":"oído","squadra":"equipo","bussi":"tocas (la puerta)","mestieri":"oficios"}),
        decision: null, next: null, final: true,
        resumen: "Ayudaste a Sandro con su catálogo y os hicisteis amigos. Aprendiste vocabulario de restauración de muebles y oficios tradicionales."
      },
      { id:"vicino_4b", num:4,
        texto:"\"Capisco,\" dice Sandro, un po' deluso ma senza insistere. \"Non si preoccupi. Mi arrangerò con il traduttore online — chissà cosa ne uscirà.\"\n\nTorni a casa. Per un po', i vostri rapporti restano cordiali ma distanti: un saluto sulle scale, poco più.\n\nQualche settimana dopo, però, vedi Sandro nel cortile, ridere da solo davanti al telefono. \"Il traduttore ha scritto 'drawer chest' come 'pettorina da cassetto',\" ti dice, mostrandoti lo schermo. \"Il collezionista belga deve aver pensato che vendessi vestiti, non mobili!\"\n\nRidete insieme. Forse è tardi per il catalogo, ma non per una chiacchierata — e magari, la prossima volta che avrà bisogno di una mano, gli risponderai diversamente.",
        glosario_json:JSON.stringify({"deluso":"decepcionado","mi arrangerò":"me las arreglaré","chissà":"quién sabe","cordiali":"cordiales","cortile":"patio","pettorina":"babero/pechera","schermo":"pantalla","chiacchierata":"charla","diversamente":"de manera diferente"}),
        decision: null, next: null, final: true,
        resumen: "No ayudaste con el catálogo, pero un encuentro casual rompió el hielo. La relación con Sandro quedó más distante, aunque con una puerta abierta."
      },
    ]
  },
  {
    id:"valigia", titulo:"La Valigia Perduta", emoji:"🧳", nivel:"A2-B1", semana_desde:9,
    desc:"Aterrizas en Roma y tu maleta no aparece.",
    capitulos: [
      { id:"valigia_1", num:1,
        texto:"Il tuo volo per Roma Fiumicino è atterrato in orario. Sei stanco ma felice: finalmente sei in Italia. Aspetti davanti al nastro bagagli, guardando passare valigie di ogni colore... ma la tua non arriva.\n\nDopo venti minuti, il nastro si ferma. Resti lì, da solo, con il carrello vuoto e un brutto presentimento.\n\nTi avvicini al banco \"Bagagli Smarriti\". Una fila di altri passeggeri, altrettanto stanchi, aspetta davanti a te.",
        glosario_json:JSON.stringify({"atterrato":"aterrizado","nastro bagagli":"cinta de equipajes","carrello":"carrito","presentimento":"presentimiento","banco":"mostrador","bagagli smarriti":"equipaje perdido","fila":"fila/cola","altrettanto":"igualmente"}),
        decision: {
          pregunta:"Come reagisci mentre aspetti in fila?",
          opciones: [
            { texto:"Resto calmo e preparo i documenti del volo.", next:"valigia_2a" },
            { texto:"Mi innervosisco e penso a come protestare.", next:"valigia_2b" },
          ]
        }
      },
      { id:"valigia_2a", num:2,
        texto:"Mentre aspetti, tiri fuori il biglietto aereo, il passaporto e l'etichetta del bagaglio. Quando arriva il tuo turno, l'impiegata — gentile ma evidentemente stanca — ti sorride.\n\n\"Buongiorno. Mi può dare i documenti del volo e l'etichetta della valigia, per favore?\"\n\nGlieli passi subito, ordinati. Lei digita rapidamente al computer. \"Perfetto, è tutto in ordine. La valigia è rimasta a Madrid per un problema di collegamento — arriverà domani con il primo volo. Le lascio un numero di pratica per il tracciamento.\"\n\nTi dà un foglio con un codice e le istruzioni. \"Mi scusi ancora per l'inconveniente. Ha un indirizzo a Roma dove possiamo consegnarla?\"",
        glosario_json:JSON.stringify({"etichetta":"etiqueta","impiegata":"empleada","digita":"teclea","collegamento":"conexión (de vuelo)","numero di pratica":"número de expediente","tracciamento":"seguimiento","foglio":"hoja","inconveniente":"inconveniente","consegnarla":"entregarla"}),
        decision: null, next: "valigia_3"
      },
      { id:"valigia_2b", num:2,
        texto:"Aspetti in fila, sempre più nervoso. Quando arriva il tuo turno, parli velocemente, forse troppo: \"La mia valigia non c'è! Ho aspettato venti minuti! Voglio sapere cosa è successo, subito!\"\n\nL'impiegata, senza scomporsi, alza lo sguardo. \"Capisco la sua frustrazione, signore. Mi dia i documenti del volo, per favore, così posso controllare.\"\n\nTi calmi un po', ma il tono resta teso. Lei controlla il sistema. \"La valigia è rimasta a Madrid per un problema di collegamento. Arriverà domani.\"\n\n\"Domani?! E io cosa faccio stanotte?\" chiedi, alzando di nuovo la voce.\n\n\"Le diamo un kit di emergenza e un numero per il tracciamento,\" risponde lei, con pazienza professionale ma con un tono ormai distante.",
        glosario_json:JSON.stringify({"velocemente":"rápidamente","senza scomporsi":"sin alterarse","alza lo sguardo":"levanta la mirada","controllare":"comprobar","teso":"tenso","stanotte":"esta noche","alzando la voce":"levantando la voz","kit di emergenza":"kit de emergencia","con pazienza":"con paciencia"}),
        decision: null, next: "valigia_3"
      },
      { id:"valigia_3", num:3,
        texto:"Ti danno un piccolo kit: uno spazzolino, un dentifricio da viaggio, una maglietta bianca con il logo della compagnia aerea. La valigia arriverà domani pomeriggio al tuo alloggio.\n\nFuori dall'aeroporto, prendi il treno per il centro di Roma. Sei nella tua stanza, con solo i vestiti che indossi e questo kit improvvisato. È quasi sera.",
        glosario_json:JSON.stringify({"spazzolino":"cepillo de dientes","dentifricio":"pasta de dientes","maglietta":"camiseta","logo":"logo","compagnia aerea":"compañía aérea","alloggio":"alojamiento","indossi":"llevas puesto","improvvisato":"improvisado"}),
        decision: {
          pregunta:"Cosa fai stasera?",
          opciones: [
            { texto:"Esco a comprare vestiti di ricambio.", next:"valigia_4a" },
            { texto:"Esco a esplorare Roma con quello che ho.", next:"valigia_4b" },
          ]
        }
      },
      { id:"valigia_4a", num:4,
        texto:"Cerchi un negozio di abbigliamento aperto la sera. Trovi un piccolo negozio vicino a Termini, ancora aperto.\n\n\"Buonasera, posso aiutarla?\" chiede il commesso.\n\n\"Sì, grazie. Ho perso la valigia e ho bisogno di un cambio: una maglietta, dei pantaloni e... forse dei calzini.\"\n\n\"Certo. Che taglia porta?\" Provi una maglietta — \"Questa è una taglia M, le sta bene?\" — e dei pantaloni leggeri, perfetti per il caldo romano.\n\nAlla cassa, il commesso ti fa uno sconto. \"Capita spesso con i turisti,\" dice ridendo. \"Benvenuto a Roma, comunque!\"\n\nTorni in albergo con una piccola busta e un cambio pulito. Domani la valigia arriverà — ma per ora, il problema è risolto, e hai anche imparato il vocabolario dell'abbigliamento sul campo.",
        glosario_json:JSON.stringify({"abbigliamento":"ropa","commesso":"vendedor (de tienda)","cambio":"cambio (de ropa)","calzini":"calcetines","taglia":"talla","sconto":"descuento","capita spesso":"pasa a menudo","busta":"bolsa","sul campo":"sobre el terreno/en la práctica"}),
        decision: null, next: null, final: true,
        resumen: "Resolviste el problema con calma, practicaste vocabulario de ropa y tallas, y terminaste la noche con un descuento simpático del vendedor."
      },
      { id:"valigia_4b", num:4,
        texto:"Decidi di non perdere tempo. Con la maglietta della compagnia aerea (un po' ridicola, ma va bene) esci a camminare. Roma di sera è magica: le strade illuminate, il rumore delle fontane, il profumo di pizza al taglio.\n\nTi siedi a un piccolo locale e ordini una pizza margherita e una birra. Il cameriere nota la tua maglietta. \"Problemi con i bagagli?\" chiede sorridendo.\n\n\"Sì, la valigia è rimasta a Madrid,\" rispondi, e gli racconti la storia in un italiano un po' incerto ma comprensibile.\n\n\"Capita a tutti, prima o poi,\" dice lui, scrollando le spalle. \"L'importante è non perdere la voglia di goderti la città. Domani avrà i suoi vestiti — stasera ha Roma.\"\n\nFinisci la pizza guardando il Colosseo illuminato in lontananza. Forse, pensi, va bene così.",
        glosario_json:JSON.stringify({"ridicola":"ridícula","illuminate":"iluminadas","fontane":"fuentes","profumo":"aroma/perfume","pizza al taglio":"pizza por porciones","locale":"local/bar","scrollando le spalle":"encogiéndose de hombros","goderti":"disfrutar","in lontananza":"a lo lejos"}),
        decision: null, next: null, final: true,
        resumen: "Te lanzaste a explorar Roma sin esperar, con tono ligero y una conversación espontánea con el camarero. Una primera noche memorable."
      },
    ]
  },
];


function getNextSRS(quality, interval, repetitions, easeFactor) {
  if (quality < 3) return { interval: 1, repetitions: 0, easeFactor: Math.max(1.3, easeFactor - 0.2) };
  const ef = Math.max(1.3, easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  const reps = repetitions + 1;
  const ivl = repetitions === 0 ? 1 : repetitions === 1 ? 3 : Math.round(interval * ef);
  return { interval: ivl, repetitions: reps, easeFactor: ef };
}
function isDue(nextReview) {
  if (!nextReview) return true;
  return new Date() >= new Date(nextReview);
}

// ─── STREAK & ACTIVITY HELPERS ─────────────────────────────────────────────
const STREAK_KEY     = "it_last_active";
const STREAK_LOG_KEY = "it_activity_log";

/** Llama esto en cualquier acción del usuario (guardar vocab, SRS, quiz, speaking) */
function markActivity() {
  const today = new Date().toISOString().split("T")[0];
  const log   = JSON.parse(localStorage.getItem(STREAK_LOG_KEY) || "[]");
  if (!log.includes(today)) {
    log.push(today);
    // Guardar solo los últimos 400 días para no crecer indefinidamente
    if (log.length > 400) log.splice(0, log.length - 400);
    localStorage.setItem(STREAK_LOG_KEY, JSON.stringify(log));
  }
  localStorage.setItem(STREAK_KEY, today);
}

/** Devuelve { streak, hasComodin } */
function calcStreak() {
  const log = JSON.parse(localStorage.getItem(STREAK_LOG_KEY) || "[]");
  if (log.length === 0) return { streak: 0, hasComodin: false };
  const today     = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  let streak = 0;
  let check  = new Date(log.includes(today) ? today : yesterday);
  let comodinUsed = false;
  for (let i = 0; i < 400; i++) {
    const ds = check.toISOString().split("T")[0];
    if (log.includes(ds)) {
      streak++;
      check.setDate(check.getDate() - 1);
    } else if (!comodinUsed && streak > 0) {
      // Un solo día de gracia por racha
      comodinUsed = true;
      check.setDate(check.getDate() - 1);
    } else {
      break;
    }
  }
  return { streak, hasComodin: comodinUsed };
}

// ─── UTILS & THEME (Stitch Design System) ──────────────────────────────────
const C = {
  // Primary brand
  gold:"#D4AF37",        // primary — roman gold
  goldDim:"#e9c349",     // primary-fixed-dim
  goldFaint:"#f2ca50",   // primary (tailwind token)
  // Semantic
  green:"#bed5b3",       // tertiary (sage green)
  greenDark:"#a3b999",   // tertiary-container
  blue:"#6baed6",        // info accent (kept)
  pink:"#d47cb3",        // error/accent (kept)
  // Backgrounds
  bg:"#141409",          // background
  bg2:"#1c1c11",         // surface-container-low
  bg3:"#202015",         // surface-container
  bg4:"#2b2b1e",         // surface-container-high
  bg5:"#363529",         // surface-container-highest
  bgBright:"#3a3a2d",    // surface-bright
  // Borders
  border:"#4d4635",      // outline-variant
  border2:"#99907c",     // outline
  // Text
  text:"#e6e3d0",        // on-background / on-surface
  textMid:"#d0c5af",     // on-surface-variant
  muted:"#99907c",       // outline
  hint:"#4d4635",        // outline-variant (dark)
  // Fonts
  serif:"'Libre Caslon Text', Georgia, serif",
  sans:"'Manrope', system-ui, sans-serif",
};
// ─── ELEVENLABS TTS ────────────────────────────────────────────────────────
// Voces italianas disponibles en ElevenLabs (model: eleven_multilingual_v2)
const EL_VOICES = [
  { id:"IKne3meq5aSn9XLyUdCD", label:"Charlie (hombre, natural)",   gender:"M" },
  { id:"XB0fDUnXU5powFXDhCwa", label:"Charlotte (mujer, cálida)",   gender:"F" },
  { id:"onwK4e9ZLuTAKqWW03F9", label:"Daniel (hombre, profundo)",   gender:"M" },
  { id:"pFZP5JQG7iQjIQuC4Bku", label:"Lily (mujer, suave)",         gender:"F" },
  { id:"nPczCjzI2devNBz1zQrb", label:"Brian (hombre, formal)",      gender:"M" },
];
const EL_MODEL = "eleven_multilingual_v2";

// Audio cache: evita re-descargar el mismo texto
const audioCache = new Map();
let currentAudio = null;

function getELConfig() {
  return {
    apiKey:  localStorage.getItem("el_api_key")      || "",
    voiceId: localStorage.getItem("el_voice_id")     || EL_VOICES[0].id,
    enabled: localStorage.getItem("el_enabled") !== "false", // true por defecto
  };
}

async function speakEL(text) {
  const { apiKey, voiceId, enabled } = getELConfig();
  if (!apiKey || !enabled) { speakFallback(text); return; }

  // Detener audio en curso
  if (currentAudio) { currentAudio.pause(); currentAudio = null; }

  const cacheKey = `${voiceId}::${text}`;
  let url = audioCache.get(cacheKey);

  if (!url) {
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        model_id: EL_MODEL,
        voice_settings: { stability: 0.5, similarity_boost: 0.8, style: 0.2, use_speaker_boost: true },
      }),
    });
    if (!res.ok) { speakFallback(text); return; }
    const blob = await res.blob();
    url = URL.createObjectURL(blob);
    audioCache.set(cacheKey, url);
    // Limitar caché a 80 entradas
    if (audioCache.size > 80) {
      const firstKey = audioCache.keys().next().value;
      URL.revokeObjectURL(audioCache.get(firstKey));
      audioCache.delete(firstKey);
    }
  }

  currentAudio = new Audio(url);
  currentAudio.play().catch(() => speakFallback(text));
}

function speakFallback(text, rate = 0.82) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "it-IT"; u.rate = rate;
  const v = window.speechSynthesis.getVoices().find(v => v.lang.startsWith("it"));
  if (v) u.voice = v;
  window.speechSynthesis.speak(u);
}

// speak() = punto de entrada único (usa EL si hay key, fallback si no)
async function speak(text) {
  const { apiKey } = getELConfig();
  if (apiKey) { await speakEL(text); } else { speakFallback(text); }
}

// ─── SPEAK BUTTON ──────────────────────────────────────────────────────────
function SpeakBtn({ text, color = C.gold, size }) {
  const [state, setState] = useState("idle"); // "idle" | "loading" | "playing"

  async function handleClick(e) {
    e.stopPropagation();
    if (state === "loading") return;
    const { apiKey } = getELConfig();
    if (apiKey) {
      setState("loading");
      await speakEL(text);
      setState("playing");
      setTimeout(() => setState("idle"), 1800);
    } else {
      speakFallback(text);
      setState("playing");
      setTimeout(() => setState("idle"), 1100);
    }
  }

  const btnSize = size || 30;
  const iconSize = size ? size - 6 : 16;
  const isLoading  = state === "loading";
  const isPlaying  = state === "playing";
  const bgColor    = (isPlaying || isLoading) ? color + "22" : "transparent";
  const iconColor  = (isPlaying || isLoading) ? color : C.muted;

  return (
    <button onClick={handleClick} title={isLoading ? "Cargando audio..." : "Escuchar"}
      style={{ background: bgColor, border: `1px solid ${color}55`, borderRadius: "50%",
        width: btnSize, height: btnSize, display: "flex", alignItems: "center",
        justifyContent: "center", cursor: isLoading ? "default" : "pointer",
        fontSize: iconSize, transition: "all 0.15s", flexShrink: 0, padding: 0, color: iconColor }}>
      {isLoading
        ? <span style={{ width: iconSize - 2, height: iconSize - 2, border: `2px solid ${color}44`,
            borderTop: `2px solid ${color}`, borderRadius: "50%",
            animation: "it-pulse 0.7s linear infinite", display: "inline-block" }} />
        : <span className="material-symbols-outlined"
            style={{ fontSize: iconSize, fontVariationSettings: `'FILL' ${isPlaying ? 1 : 0}` }}>
            volume_up
          </span>
      }
    </button>
  );
}

// ─── ELEVENLABS SETTINGS MODAL ─────────────────────────────────────────────
const WEB_SPEECH_AVAILABLE = typeof window !== "undefined" &&
  ("webkitSpeechRecognition" in window || "SpeechRecognition" in window);

function ELSettingsModal({ onClose }) {
  const [apiKey,  setApiKey]  = useState(localStorage.getItem("el_api_key")  || "");
  const [voiceId, setVoiceId] = useState(localStorage.getItem("el_voice_id") || EL_VOICES[0].id);
  const [enabled, setEnabled] = useState(localStorage.getItem("el_enabled") !== "false");
  const [groqKey, setGroqKey] = useState(localStorage.getItem("groq_api_key") || "");
  const [testing, setTesting] = useState(false);
  const [testOk,  setTestOk]  = useState(null);
  const [saved,   setSaved]   = useState(false);
  const [backupBusy, setBackupBusy] = useState(false);
  const [backupOk, setBackupOk] = useState(null);

  async function handleBackup() {
    setBackupBusy(true); setBackupOk(null);
    try {
      await exportarBackupCompleto();
      setBackupOk(true);
    } catch {
      setBackupOk(false);
    }
    setBackupBusy(false);
  }

  async function testVoice() {
    if (!apiKey) return;
    setTesting(true); setTestOk(null);
    const tmpKey     = localStorage.getItem("el_api_key");
    const tmpEnabled = localStorage.getItem("el_enabled");
    localStorage.setItem("el_api_key",  apiKey);
    localStorage.setItem("el_voice_id", voiceId);
    localStorage.setItem("el_enabled",  "true");
    try {
      await speakEL("Ciao! Benvenuto in Progetto Italiano.");
      setTestOk(true);
    } catch {
      setTestOk(false);
    }
    // Restaurar estado previo
    if (!tmpKey) localStorage.removeItem("el_api_key"); else localStorage.setItem("el_api_key", tmpKey);
    if (!tmpEnabled) localStorage.removeItem("el_enabled"); else localStorage.setItem("el_enabled", tmpEnabled);
    setTesting(false);
  }

  function save() {
    if (apiKey) {
      localStorage.setItem("el_api_key",  apiKey.trim());
      localStorage.setItem("el_voice_id", voiceId);
    } else {
      localStorage.removeItem("el_api_key");
      localStorage.removeItem("el_voice_id");
    }
    localStorage.setItem("el_enabled", enabled ? "true" : "false");
    if (groqKey.trim()) {
      localStorage.setItem("groq_api_key", groqKey.trim());
    } else {
      localStorage.removeItem("groq_api_key");
    }
    audioCache.clear();
    setSaved(true);
    setTimeout(onClose, 800);
  }

  const canUseEL = !!apiKey && enabled;

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.72)", zIndex:200,
      display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
      <div className="it-glass it-fade-in" style={{ background:C.bg2, borderRadius:18,
        maxWidth:460, width:"100%", border:`1px solid ${C.gold}33`,
        maxHeight:"90vh", display:"flex", flexDirection:"column", overflow:"hidden" }}>

        {/* Header — fijo */}
        <div style={{ padding:"24px 28px 16px", flexShrink:0 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:0 }}>
          <div>
            <div style={{ fontSize:9, color:C.gold, letterSpacing:"0.3em", fontWeight:700,
              textTransform:"uppercase", marginBottom:4 }}>Audio · ElevenLabs + Groq STT</div>
            <div style={{ fontSize:18, color:C.text, fontFamily:C.serif }}>Configurar voz</div>
          </div>
          <button onClick={onClose} style={{ background:"transparent", border:"none",
            cursor:"pointer", color:C.muted, padding:4 }}>
            <MIcon name="close" size={20} color={C.muted} />
          </button>
        </div>
        </div>

        {/* Scroll area */}
        <div style={{ flex:1, overflowY:"auto", padding:"0 28px 28px" }}>

        {/* Toggle activar/desactivar ElevenLabs */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
          background: enabled ? C.green+"0d" : C.bg3,
          border:`1px solid ${enabled ? C.green+"44" : C.border}`,
          borderRadius:12, padding:"12px 16px", marginBottom:18, transition:"all 0.2s" }}>
          <div>
            <div style={{ fontSize:13, color: enabled ? C.green : C.textMid, fontWeight:600, marginBottom:2 }}>
              {enabled ? "🔊 ElevenLabs activo" : "🔇 Usando voz del navegador"}
            </div>
            <div style={{ fontSize:11, color:C.hint, lineHeight:1.4 }}>
              {enabled ? "Voz nativa italiana de alta calidad" : "Activa para usar voces ElevenLabs"}
            </div>
          </div>
          {/* Toggle switch */}
          <button onClick={()=>{ setEnabled(e=>!e); setSaved(false); }} style={{
            width:44, height:24, borderRadius:12, border:"none", cursor:"pointer", flexShrink:0,
            background: enabled ? C.green : C.bg4, position:"relative", transition:"background 0.2s", padding:0,
          }}>
            <div style={{
              width:18, height:18, borderRadius:"50%", background:"white",
              position:"absolute", top:3, transition:"left 0.2s",
              left: enabled ? 23 : 3, boxShadow:"0 1px 3px rgba(0,0,0,0.3)"
            }} />
          </button>
        </div>

        {/* Descripción */}
        <div style={{ background:C.gold+"0d", border:`1px solid ${C.gold}22`, borderRadius:10,
          padding:"10px 14px", marginBottom:18, fontSize:12, color:C.textMid, lineHeight:1.6 }}>
          Sin API key o con ElevenLabs desactivado, la app usa la voz del navegador automáticamente.{" "}
          <a href="https://elevenlabs.io" target="_blank" rel="noopener"
            style={{ color:C.gold, textDecoration:"none" }}>
            Obtener key gratuita →
          </a>
        </div>

        {/* API Key */}
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:11, color:C.muted, marginBottom:6, fontWeight:600,
            textTransform:"uppercase", letterSpacing:0.5 }}>API Key</div>
          <input
            type="password"
            value={apiKey}
            onChange={e => { setApiKey(e.target.value); setTestOk(null); setSaved(false); }}
            placeholder="sk_xxxxxxxxxxxxxxxxxxxxxxxx"
            style={{ width:"100%", boxSizing:"border-box", background:C.bg3,
              border:`1px solid ${C.border}`, borderRadius:10, padding:"10px 14px",
              color:C.text, fontSize:13, fontFamily:C.sans, outline:"none",
              opacity: enabled ? 1 : 0.5 }}
          />
        </div>

        {/* Selector de voz */}
        <div style={{ marginBottom:20, opacity: enabled ? 1 : 0.5, transition:"opacity 0.2s" }}>
          <div style={{ fontSize:11, color:C.muted, marginBottom:6, fontWeight:600,
            textTransform:"uppercase", letterSpacing:0.5 }}>Voz italiana</div>
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {EL_VOICES.map(v => {
              const active = voiceId === v.id;
              return (
                <button key={v.id} onClick={()=>{ if(enabled){ setVoiceId(v.id); setTestOk(null); } }}
                  style={{ background: active ? C.gold+"18" : "transparent",
                    border:`1px solid ${active ? C.gold : C.border}`,
                    borderRadius:10, padding:"10px 14px", cursor: enabled ? "pointer" : "default",
                    display:"flex", alignItems:"center", gap:10, textAlign:"left",
                    transition:"all 0.15s" }}>
                  <span style={{ fontSize:16 }}>{v.gender === "M" ? "👨" : "👩"}</span>
                  <span style={{ fontSize:13, color: active ? C.gold : C.textMid,
                    fontFamily:C.sans, flex:1 }}>{v.label}</span>
                  {active && <MIcon name="check_circle" fill={1} size={16} color={C.gold} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Feedback */}
        {testOk === true  && <div style={{ fontSize:12, color:C.green,  marginBottom:12 }}>✅ Voz funcionando correctamente</div>}
        {testOk === false && <div style={{ fontSize:12, color:C.pink,   marginBottom:12 }}>❌ Error — verifica tu API key</div>}
        {saved            && <div style={{ fontSize:12, color:C.green,  marginBottom:12 }}>✅ Configuración guardada</div>}

        {/* Botones */}
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={testVoice} disabled={!canUseEL || testing}
            style={{ flex:1, background:"transparent", border:`1px solid ${C.border}`,
              borderRadius:10, padding:"11px", cursor:!canUseEL||testing?"default":"pointer",
              color:!canUseEL||testing?C.hint:C.textMid, fontSize:13, fontFamily:C.sans,
              display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
            {testing
              ? <><span style={{ width:12, height:12, border:`2px solid ${C.hint}44`,
                  borderTop:`2px solid ${C.hint}`, borderRadius:"50%",
                  animation:"it-pulse 0.7s linear infinite", display:"inline-block" }}/> Probando...</>
              : <><MIcon name="play_circle" size={16} color={C.muted} /> Probar voz</>}
          </button>
          <button onClick={save}
            style={{ flex:1, background:`${C.gold}18`, border:`1px solid ${C.gold}55`,
              borderRadius:10, padding:"11px", cursor:"pointer",
              color:C.gold, fontSize:13, fontWeight:700, fontFamily:C.sans,
              display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
            <MIcon name="save" size={16} color={C.gold} />
            Guardar
          </button>
        </div>

        {/* Backup de datos — sección discreta */}
        <div style={{ marginTop:22, paddingTop:16, borderTop:`1px solid ${C.border}` }}>
          <div style={{ fontSize:10, color:C.hint, letterSpacing:"0.2em", fontWeight:700,
            textTransform:"uppercase", marginBottom:8 }}>Datos</div>
          <button onClick={handleBackup} disabled={backupBusy}
            style={{ width:"100%", background:"transparent", border:`1px solid ${C.border}`,
              borderRadius:10, padding:"10px 14px", cursor: backupBusy ? "default" : "pointer",
              color:C.muted, fontSize:12, fontFamily:C.sans,
              display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
            <MIcon name="download" size={15} color={C.muted} />
            {backupBusy ? "Exportando..." : "Exportar mi progreso (JSON)"}
          </button>
          {backupOk === true  && <div style={{ fontSize:11, color:C.green, marginTop:8, textAlign:"center" }}>✅ Backup descargado</div>}
          {backupOk === false && <div style={{ fontSize:11, color:C.pink,  marginTop:8, textAlign:"center" }}>❌ Error al exportar</div>}
          <div style={{ fontSize:11, color:C.hint, marginTop:6, lineHeight:1.5, textAlign:"center" }}>
            Descarga una copia completa de tu progreso, diario, conversaciones y planes.
          </div>
        </div>

        {/* ── SECCIÓN GROQ STT ── */}
        <div style={{ borderTop:`1px solid ${C.border}`, marginTop:20, paddingTop:18 }}>
          <div style={{ fontSize:9, color:C.blue, letterSpacing:"0.3em", fontWeight:700,
            textTransform:"uppercase", marginBottom:4 }}>Voz a texto · Groq Whisper</div>
          <div style={{ fontSize:13, color:C.text, fontFamily:C.serif, marginBottom:14 }}>Reconocimiento de voz</div>

          {/* Info */}
          <div style={{ background:C.blue+"0d", border:`1px solid ${C.blue}22`, borderRadius:10,
            padding:"10px 14px", marginBottom:14, fontSize:12, color:C.textMid, lineHeight:1.6 }}>
            Chrome y Edge reconocen voz gratis sin key. Para Firefox y Safari, Groq Whisper es el fallback — plan gratuito incluye 7200 seg/día.{" "}
            <a href="https://console.groq.com" target="_blank" rel="noopener"
              style={{ color:C.blue, textDecoration:"none" }}>
              Obtener key gratuita →
            </a>
          </div>

          {/* Groq Key input */}
          <div style={{ marginBottom:10 }}>
            <div style={{ fontSize:11, color:C.muted, marginBottom:6, fontWeight:600,
              textTransform:"uppercase", letterSpacing:0.5 }}>API Key de Groq (opcional)</div>
            <input
              type="password"
              value={groqKey}
              onChange={e => { setGroqKey(e.target.value); setSaved(false); }}
              placeholder="gsk_xxxxxxxxxxxxxxxxxxxxxxxx"
              style={{ width:"100%", boxSizing:"border-box", background:C.bg3,
                border:`1px solid ${C.border}`, borderRadius:10, padding:"10px 14px",
                color:C.text, fontSize:13, fontFamily:C.sans, outline:"none" }}
            />
          </div>

          {/* Estado STT */}
          <div style={{ fontSize:11, color:C.hint, lineHeight:1.5, marginBottom:4 }}>
            {WEB_SPEECH_AVAILABLE
              ? <span style={{ color:C.green }}>✅ Web Speech API disponible en este navegador</span>
              : <span style={{ color:C.pink }}>⚠️ Web Speech no disponible — se usará Groq si hay key</span>}
          </div>
        </div>

        {/* Nota privacidad */}
        <div style={{ fontSize:10, color:C.hint, marginTop:14, lineHeight:1.5 }}>
          Las API keys se guardan solo en tu navegador (localStorage). Nunca salen a servidores externos salvo ElevenLabs y Groq respectivamente.
        </div>
        </div>{/* fin scroll area */}
      </div>
    </div>
  );
}
// ─── MODO SOLO ITALIANO — helper + componente de traducción ocultable ──────
function getSoloItaliano() {
  return localStorage.getItem("it_solo_italiano") === "true";
}
function ES({ children, style }) {
  const [solo, setSolo] = useState(getSoloItaliano);
  const [reveal, setReveal] = useState(false);
  useEffect(() => {
    const onChange = () => setSolo(getSoloItaliano());
    window.addEventListener("it-solo-italiano-change", onChange);
    return () => window.removeEventListener("it-solo-italiano-change", onChange);
  }, []);
  if (!solo) return <span style={style}>{children}</span>;
  return (
    <span
      onClick={e => { e.stopPropagation(); setReveal(r=>!r); }}
      style={{
        ...style, cursor:"pointer",
        filter: reveal ? "none" : "blur(5px)",
        opacity: reveal ? 1 : 0.5,
        transition:"filter 0.15s, opacity 0.15s",
        userSelect: reveal ? "auto" : "none",
      }}
      title="Toca para revelar"
    >{children}</span>
  );
}

function Tag({ children, color=C.gold }) {
  return <span style={{ fontSize:10, color, background:color+"18", padding:"3px 9px", borderRadius:20, fontWeight:700, letterSpacing:1, fontFamily:C.sans, border:`1px solid ${color}33` }}>{children}</span>;
}
function Loader() {
  return <div style={{ display:"flex", gap:6, padding:24, justifyContent:"center" }}>
    {[0,1,2].map(i=><div key={i} style={{ width:7, height:7, background:C.gold, borderRadius:"50%", animation:`it-bounce 1s ${i*0.2}s infinite` }}/>)}
  </div>;
}
function MIcon({ name, fill=0, size=20, color=C.gold }) {
  return <span className="material-symbols-outlined" style={{ fontSize:size, color, fontVariationSettings:`'FILL' ${fill}` }}>{name}</span>;
}

// ─── TEST DE NIVEL INICIAL ─────────────────────────────────────────────────
const NIVEL_TEST = [
  { q:"¿Qué significa 'buongiorno'?", opts:["Buenas noches","Buenos días","Hasta luego","Por favor"], correct:1, nivel:"A0" },
  { q:"¿Cómo se dice 'gracias' en italiano?", opts:["Prego","Scusi","Grazie","Ciao"], correct:2, nivel:"A0" },
  { q:"Completa: '__ chiamo Marco.' (me llamo)", opts:["Tu","Mi","Si","Lo"], correct:1, nivel:"A0" },
  { q:"¿Qué significa 'Dove si trova la stazione?'", opts:["¿Cómo estás?","¿Dónde está la estación?","¿Cuánto cuesta el tren?","¿A qué hora sale?"], correct:1, nivel:"A1" },
  { q:"Elige el artículo correcto: '__ libro' (el libro)", opts:["La","Lo","Il","Un"], correct:2, nivel:"A1" },
  { q:"¿Qué tiempo verbal es 'Ho mangiato'? (comí / he comido)", opts:["Futuro","Imperfetto","Passato prossimo","Presente"], correct:2, nivel:"A1" },
  { q:"Traduce: 'Devo andare al lavoro'", opts:["Quiero ir al trabajo","Debo ir al trabajo","Fui al trabajo","Voy a trabajar mañana"], correct:1, nivel:"A2" },
  { q:"¿Qué significa 'Nonostante la pioggia, sono uscito'?", opts:["Porque llovía, salí","A pesar de la lluvia, salí","Cuando dejó de llover, salí","Sin lluvia, hubiera salido"], correct:1, nivel:"A2" },
  { q:"'Se avessi tempo, studierei di più' expresa:", opts:["Un hecho pasado","Una hipótesis real","Una hipótesis irreal en presente","Un deseo cumplido"], correct:2, nivel:"B1" },
  { q:"¿Qué conector usarías para contrastar ideas en italiano?", opts:["Quindi","Tuttavia","Inoltre","Perché"], correct:1, nivel:"B1" },
];

function NivelTest({ onDone }) {
  const [step, setStep] = useState("intro"); // intro | quiz | result
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [confirmed, setConfirmed] = useState(false);

  function calcNivel(ans) {
    const score = ans.filter(Boolean).length;
    const a0correct = ans.slice(0,3).filter(Boolean).length;
    const a1correct = ans.slice(3,6).filter(Boolean).length;
    const a2correct = ans.slice(6,8).filter(Boolean).length;
    const b1correct = ans.slice(8,10).filter(Boolean).length;
    if (score <= 2) return "A0";
    if (a0correct >= 2 && a1correct >= 2 && a2correct < 1) return "A1";
    if (a0correct >= 2 && a1correct >= 2 && a2correct >= 1 && b1correct < 1) return "A2";
    if (score >= 7) return "B1";
    if (score >= 5) return "A2";
    if (score >= 3) return "A1";
    return "A0";
  }

  function handleSelect(idx) { if (!confirmed) setSelected(idx); }

  function handleConfirm() {
    if (selected === null) return;
    setConfirmed(true);
    setTimeout(() => {
      const isCorrect = selected === NIVEL_TEST[current].correct;
      const newAnswers = [...answers, isCorrect];
      if (current + 1 < NIVEL_TEST.length) {
        setAnswers(newAnswers);
        setCurrent(c => c + 1);
        setSelected(null);
        setConfirmed(false);
      } else {
        const nivel = calcNivel(newAnswers);
        localStorage.setItem("it_nivel_detectado", nivel);
        localStorage.setItem("it_nivel_score", newAnswers.filter(Boolean).length);
        setAnswers(newAnswers);
        setStep("result");
      }
    }, 700);
  }

  const nivel = step === "result" ? calcNivel(answers) : null;
  const score = step === "result" ? answers.filter(Boolean).length : 0;

  const nivelDesc = {
    "A0": { label:"Principiante absoluto", desc:"Empezarás desde cero. La app está diseñada exactamente para ti.", color:C.green, emoji:"🌱" },
    "A1": { label:"Principiante con bases", desc:"Conoces saludos y vocab básico. Saltarás las semanas 1-2 en fluidez.", color:C.blue, emoji:"🌿" },
    "A2": { label:"Elemental", desc:"Manejas el presente y algo del pasado. Tu punto de entrada es semana 8-10.", color:C.gold, emoji:"⭐" },
    "B1": { label:"Intermedio", desc:"Ya tienes base sólida. Enfócate en los módulos Habla, Debate y Lecturas B1.", color:C.pink, emoji:"🔥" },
  };

  if (step === "intro") return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.92)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div className="it-glass" style={{ borderRadius:18, padding:"24px 20px", maxWidth:480, width:"100%", boxSizing:"border-box" }}>
        <div style={{ fontSize:10, color:C.gold, letterSpacing:4, marginBottom:8, fontFamily:C.sans, fontWeight:700 }}>TEST DIAGNÓSTICO · 2 MIN</div>
        <h2 style={{ fontSize:22, color:C.text, margin:"0 0 6px", fontWeight:400, fontFamily:C.serif }}>¿Cuánto italiano sabes?</h2>
        <div style={{ width:40, height:1, background:C.gold, marginBottom:16, opacity:0.5 }}/>
        <p style={{ fontSize:13, color:C.textMid, lineHeight:1.7, marginBottom:8, fontFamily:C.sans }}>
          10 preguntas rápidas para detectar tu nivel real: <strong style={{color:C.text}}>A0 / A1 / A2 / B1</strong>.
        </p>
        <p style={{ fontSize:13, color:C.textMid, lineHeight:1.7, marginBottom:24, fontFamily:C.sans }}>
          El resultado personaliza qué semana priorizar y qué módulos aprovechar más. No hay respuestas incorrectas — solo honestidad.
        </p>
        <button onClick={()=>setStep("quiz")} style={{ background:C.gold, border:"none", borderRadius:8, padding:"13px 24px", cursor:"pointer", color:"#241a00", fontWeight:700, fontSize:14, fontFamily:C.sans, width:"100%", letterSpacing:1, marginBottom:10 }}>
          Empezar test →
        </button>
        <button onClick={()=>{ localStorage.setItem("it_nivel_detectado","A0"); onDone("A0"); }} style={{ background:"transparent", border:`1px solid ${C.border}`, borderRadius:8, padding:"10px 24px", cursor:"pointer", color:C.muted, fontSize:12, fontFamily:C.sans, width:"100%" }}>
          Soy principiante absoluto, saltar test
        </button>
      </div>
    </div>
  );

  if (step === "quiz") {
    const q = NIVEL_TEST[current];
    const progress = ((current) / NIVEL_TEST.length) * 100;
    return (
      <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.92)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
        <div className="it-glass" style={{ borderRadius:18, padding:28, maxWidth:480, width:"100%" }}>
          {/* Progress */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <div style={{ fontSize:10, color:C.gold, letterSpacing:3, fontFamily:C.sans, fontWeight:700 }}>PREGUNTA {current+1} / {NIVEL_TEST.length}</div>
            <div style={{ fontSize:10, color:C.muted, fontFamily:C.sans }}>{q.nivel}</div>
          </div>
          <div style={{ height:2, background:C.bg5, borderRadius:2, marginBottom:20 }}>
            <div style={{ height:"100%", background:C.gold, width:`${progress}%`, borderRadius:2, transition:"width 0.3s", boxShadow:`0 0 6px ${C.gold}88` }}/>
          </div>
          {/* Question */}
          <div style={{ fontSize:16, color:C.text, fontFamily:C.serif, lineHeight:1.5, marginBottom:20 }}>{q.q}</div>
          {/* Options */}
          <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:20 }}>
            {q.opts.map((opt, idx) => {
              let bg = "transparent", border = C.border, color = C.textMid;
              if (selected === idx) { bg = C.gold+"18"; border = C.gold; color = C.text; }
              if (confirmed && idx === q.correct) { bg = C.green+"22"; border = C.green; color = C.text; }
              if (confirmed && selected === idx && idx !== q.correct) { bg = C.pink+"18"; border = C.pink; color = C.text; }
              return (
                <button key={idx} onClick={()=>handleSelect(idx)} style={{
                  background:bg, border:`1px solid ${border}`, borderRadius:10,
                  padding:"11px 16px", cursor:confirmed?"default":"pointer",
                  textAlign:"left", color, fontSize:13, fontFamily:C.sans,
                  transition:"all 0.15s", display:"flex", alignItems:"center", gap:10,
                }}>
                  <span style={{ fontSize:11, color:border, fontWeight:700, minWidth:18 }}>{String.fromCharCode(65+idx)}.</span>
                  {opt}
                </button>
              );
            })}
          </div>
          <button onClick={handleConfirm} disabled={selected===null||confirmed} style={{
            background: selected!==null&&!confirmed ? C.gold : C.bg5,
            border:"none", borderRadius:8, padding:"12px 24px",
            cursor: selected!==null&&!confirmed ? "pointer" : "default",
            color: selected!==null&&!confirmed ? "#241a00" : C.hint,
            fontWeight:700, fontSize:13, fontFamily:C.sans, width:"100%",
            transition:"all 0.2s",
          }}>
            {confirmed ? "Siguiente..." : "Confirmar"}
          </button>
        </div>
      </div>
    );
  }

  // Result
  const nd = nivelDesc[nivel];
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.92)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div className="it-glass" style={{ borderRadius:18, padding:"24px 20px", maxWidth:480, width:"100%", boxSizing:"border-box" }}>
        <div style={{ textAlign:"center", marginBottom:20 }}>
          <div style={{ fontSize:48, marginBottom:8 }}>{nd.emoji}</div>
          <div style={{ fontSize:10, color:C.gold, letterSpacing:4, fontFamily:C.sans, fontWeight:700, marginBottom:6 }}>RESULTADO DEL TEST</div>
          <div style={{ fontSize:36, color:nd.color, fontFamily:C.serif, fontWeight:400, marginBottom:4 }}>{nivel}</div>
          <div style={{ fontSize:16, color:C.text, fontFamily:C.serif, marginBottom:6 }}>{nd.label}</div>
          <div style={{ fontSize:11, color:C.muted, fontFamily:C.sans }}>{score} / {NIVEL_TEST.length} respuestas correctas</div>
        </div>
        <div style={{ background:nd.color+"12", border:`1px solid ${nd.color}33`, borderRadius:12, padding:"14px 16px", marginBottom:20 }}>
          <div style={{ fontSize:13, color:C.textMid, lineHeight:1.6, fontFamily:C.sans }}>{nd.desc}</div>
        </div>
        {/* Score bar */}
        <div style={{ marginBottom:20 }}>
          <div style={{ height:6, background:C.bg5, borderRadius:3 }}>
            <div style={{ height:"100%", background:nd.color, width:`${score*10}%`, borderRadius:3, transition:"width 0.8s", boxShadow:`0 0 8px ${nd.color}66` }}/>
          </div>
        </div>
        <button onClick={()=>onDone(nivel)} style={{ background:C.gold, border:"none", borderRadius:8, padding:"13px 24px", cursor:"pointer", color:"#241a00", fontWeight:700, fontSize:14, fontFamily:C.sans, width:"100%", letterSpacing:1 }}>
          Continuar con nivel {nivel} →
        </button>
      </div>
    </div>
  );
}

// ─── SETUP MODAL ───────────────────────────────────────────────────────────
function SetupModal({ onDone }) {
  const [status, setStatus] = useState("idle");
  const [log, setLog] = useState([]);
  const [progress, setProgress] = useState(0);

  async function runSetup() {
    setStatus("loading");
    const addLog = msg => setLog(p => [...p, msg]);
    try {
      addLog("🔍 Verificando base de datos...");
      const existing = await api.list("vocabulario", { limit: 1 });
      if (existing.length > 0) {
        addLog("✅ La base ya tiene datos. Saltando seed.");
        setStatus("done");
        setTimeout(onDone, 1200);
        return;
      }
      addLog(`📝 Poblando Vocabulario (${SEED_VOCAB.length} palabras, 30 semanas)...`);
      setProgress(10);
      await api.seed("vocabulario", SEED_VOCAB);
      addLog("✅ Vocabulario listo.");
      setProgress(35);
      addLog(`📅 Poblando Planes Semanales (30 semanas, A0→B1)...`);
      await api.seed("planes_semanales", SEED_SEMANALES);
      addLog("✅ Planes semanales listos.");
      setProgress(60);
      addLog(`📆 Poblando Planes Diarios (${SEED_DIARIOS.length} días)...`);
      await api.seed("planes_diarios", SEED_DIARIOS);
      addLog("✅ Planes diarios listos.");
      setProgress(80);
      addLog(`📖 Poblando Lecturas (${SEED_LECTURAS.length} textos A0→B1)...`);
      await api.seed("lecturas", SEED_LECTURAS);
      addLog("✅ Lecturas listas.");
      setProgress(100);
      addLog("🎉 ¡Base de datos con 30 semanas completamente configurada!");
      setStatus("done");
      setTimeout(onDone, 2000);
    } catch(e) {
      addLog("❌ Error: " + e.message);
      setStatus("error");
    }
  }

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.88)", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div className="it-glass" style={{ borderRadius:18, padding:"24px 20px", maxWidth:480, width:"100%", boxSizing:"border-box" }}>
        <div style={{ fontSize:10, color:C.gold, letterSpacing:4, marginBottom:8, fontFamily:C.sans, fontWeight:700 }}>PRIMER INICIO · PROGETTO ITALIANO</div>
        <h2 style={{ fontSize:22, color:C.text, margin:"0 0 6px", fontWeight:400, fontFamily:C.serif }}>Configurar Base de Datos</h2>
        <div style={{ width:40, height:1, background:C.gold, marginBottom:16, opacity:0.5 }}/>
        <p style={{ fontSize:13, color:C.textMid, lineHeight:1.7, marginBottom:20, fontFamily:C.sans }}>
          Voy a poblar tu Supabase con <strong style={{color:C.text}}>{SEED_VOCAB.length} palabras (A0→B1)</strong>, <strong style={{color:C.text}}>30 planes semanales</strong>, <strong style={{color:C.text}}>{SEED_DIARIOS.length} días</strong> y <strong style={{color:C.text}}>{SEED_LECTURAS.length} textos graduados</strong>. Solo ocurre una vez.
        </p>
        {status === "idle" && (
          <button onClick={runSetup} style={{ background:C.gold, border:"none", borderRadius:8, padding:"13px 24px", cursor:"pointer", color:"#241a00", fontWeight:700, fontSize:14, fontFamily:C.sans, width:"100%", letterSpacing:1 }}>
            Inicializar 30 Semanas →
          </button>
        )}
        {status === "loading" && (
          <>
            <div style={{ height:2, background:C.bg5, borderRadius:2, marginBottom:12 }}>
              <div style={{ height:"100%", background:C.gold, width:`${progress}%`, borderRadius:2, transition:"width 0.5s", boxShadow:`0 0 8px ${C.gold}88` }}/>
            </div>
            <Loader />
          </>
        )}
        {log.length > 0 && (
          <div style={{ background:C.bg3, borderRadius:10, padding:14, marginTop:16, maxHeight:200, overflowY:"auto", border:`1px solid ${C.border}` }}>
            {log.map((l,i)=><div key={i} style={{ fontSize:12, color:C.textMid, marginBottom:4, fontFamily:C.sans }}>{l}</div>)}
          </div>
        )}
        {status === "error" && (
          <button onClick={runSetup} style={{ background:"transparent", border:`1px solid ${C.pink}`, borderRadius:8, padding:"10px 20px", cursor:"pointer", color:C.pink, fontWeight:700, fontSize:13, fontFamily:C.sans, width:"100%", marginTop:12 }}>
            Reintentar
          </button>
        )}
      </div>
    </div>
  );
}

// ─── HOY MODULE ────────────────────────────────────────────────────────────
function HoyModule({ db, progresoMap, weekNum, dayNum }) {
  const semana     = db.semanales.find(s => s.semana_num === weekNum);
  const dia        = db.diarios.find(d => d.semana_num === weekNum && d.dia_num === dayNum);
  const vocabHoy   = db.vocabulario.filter(w => w.semana === weekNum && w.dia === dayNum);
  const savedToday = vocabHoy.filter(w => progresoMap[w.id]?.guardada).length;
  const dueCount   = Object.values(progresoMap).filter(p => p.guardada && isDue(p.proximo_repaso)).length;
  const { streak } = calcStreak();

  // ── Análisis adaptativo ──────────────────────────────────────────────────
  const allSaved  = Object.values(progresoMap).filter(p => p.guardada);
  const totalSaved = allSaved.length;

  // Palabras difíciles: ease_factor < 2.0 (SM-2: fallas frecuentes lo bajan)
  const dificiles = allSaved
    .filter(p => p.ease_factor < 2.0 && p.repeticiones > 0)
    .sort((a, b) => a.ease_factor - b.ease_factor)
    .slice(0, 3)
    .map(p => db.vocabulario.find(w => w.id === p.palabra_id))
    .filter(Boolean);

  // Palabras dominadas: ≥5 repasos e intervalo ≥21 días
  const dominadas = allSaved.filter(p => p.repeticiones >= 5 && p.intervalo_dias >= 21).length;

  // Tasa de acierto estimada desde ease_factor promedio
  const avgEase     = allSaved.length
    ? allSaved.reduce((s, p) => s + (p.ease_factor || 2.5), 0) / allSaved.length : 2.5;
  const tasaAcierto = Math.min(100, Math.round(((avgEase - 1.3) / (2.5 - 1.3)) * 100));

  const faseColors = { "Fondamenta": C.gold, "Vita Quotidiana": C.green, "Connessione": C.blue, "Immersione": C.pink };
  const faseColor  = faseColors[semana?.fase] || C.gold;

  // Prioridad adaptativa
  const prioridad = dueCount >= 10
    ? { icon:"refresh",      color:C.green, msg:`Tienes ${dueCount} repasos pendientes — empieza por ahí antes de aprender vocab nuevo.` }
    : dificiles.length >= 2
    ? { icon:"fitness_center",color:C.pink,  msg:`${dificiles.length} palabras te están costando. Repásalas en SRS antes de avanzar.` }
    : savedToday === vocabHoy.length && vocabHoy.length > 0
    ? { icon:"check_circle", color:C.gold,  msg:"¡Vocab del día completado! Practica Speaking o lee un texto para consolidar." }
    : { icon:"today",        color:faseColor,msg:"Comienza guardando el vocabulario de hoy y luego haz tus repasos." };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14, fontFamily:C.sans }} className="it-fade-in">

      {/* ── Tarjeta semana ── */}
      {semana && (
        <div className="it-glass" style={{ borderRadius:16, padding:22, background:"linear-gradient(135deg,rgba(20,20,9,0.85),rgba(13,13,26,0.9))" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
            <div style={{ flex:1, paddingRight:16 }}>
              <div style={{ fontSize:10, color:faseColor, letterSpacing:"0.22em", marginBottom:5, fontWeight:700, textTransform:"uppercase" }}>
                Semana {semana.semana_num} · {semana.fase}
              </div>
              <h2 style={{ fontSize:18, color:C.text, margin:"0 0 8px", fontFamily:C.serif, fontWeight:400, lineHeight:1.35 }}>{semana.titulo}</h2>
              <p style={{ fontSize:13, color:C.textMid, lineHeight:1.6, fontStyle:"italic", margin:0 }}>{semana.objetivo_semana}</p>
            </div>
            <div style={{ background:`${C.gold}12`, border:`1px solid ${C.gold}`, borderRadius:10, padding:"10px 14px", textAlign:"center", flexShrink:0 }}>
              <div style={{ fontSize:22, color:C.gold, fontWeight:700, fontFamily:C.serif, lineHeight:1 }}>{semana.palabras_meta}</div>
              <div style={{ fontSize:9, color:C.gold, letterSpacing:1, marginTop:3, fontWeight:700, opacity:0.8 }}>META VOCAB</div>
            </div>
          </div>
          <div style={{ background:`${C.goldDim}0a`, border:`1px solid ${C.gold}28`, borderRadius:10, padding:14, marginBottom:10 }}>
            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
              <MIcon name="emoji_events" fill={1} size={16} color={C.gold} />
              <span style={{ fontSize:10, color:C.gold, letterSpacing:"0.2em", fontWeight:700, textTransform:"uppercase" }}>Reto Semanal</span>
            </div>
            <p style={{ fontSize:12, color:C.textMid, lineHeight:1.6, margin:0, fontStyle:"italic" }}>{semana.reto_semanal}</p>
          </div>
          <div style={{ background:C.bg3, borderRadius:10, padding:12, border:`1px solid ${C.border}` }}>
            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
              <MIcon name="psychology" fill={1} size={16} color={C.goldDim} />
              <span style={{ fontSize:10, color:C.goldDim, letterSpacing:"0.15em", fontWeight:700, textTransform:"uppercase" }}>Principio Científico</span>
            </div>
            <p style={{ fontSize:12, color:C.muted, lineHeight:1.6, margin:0 }}>
              <strong style={{color:C.text}}>{semana.principio_cientifico?.split(":")[0]}:</strong>{" "}
              {semana.principio_cientifico?.split(":").slice(1).join(":")}
            </p>
          </div>
        </div>
      )}

      {/* ── Prioridad adaptativa ── */}
      <div style={{ background:`${prioridad.color}0f`, border:`1px solid ${prioridad.color}44`, borderRadius:12, padding:"12px 16px", display:"flex", alignItems:"flex-start", gap:12 }}>
        <MIcon name={prioridad.icon} fill={1} size={22} color={prioridad.color} />
        <div>
          <div style={{ fontSize:11, color:prioridad.color, fontWeight:700, letterSpacing:"0.15em", textTransform:"uppercase", marginBottom:3 }}>Prioridad de hoy</div>
          <div style={{ fontSize:13, color:C.textMid, lineHeight:1.6 }}>{prioridad.msg}</div>
        </div>
      </div>

      {/* ── Métricas adaptativas ── */}
      {totalSaved > 0 && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,minmax(0,1fr))", gap:8 }}>
          {[
            { v:`${tasaAcierto}%`, label:"tasa acierto", color: tasaAcierto >= 75 ? C.green : tasaAcierto >= 50 ? C.gold : C.pink },
            { v:dominadas,         label:"dominadas",    color:C.blue },
            { v:streak > 0 ? `${streak}🔥` : "0", label:"días racha", color: streak >= 7 ? C.gold : C.textMid },
          ].map(m => (
            <div key={m.label} className="it-roman-border" style={{ background:C.bg3, borderRadius:10, padding:"10px 6px", textAlign:"center", border:`1px solid ${C.border}` }}>
              <div style={{ fontSize:18, color:m.color, fontWeight:700, fontFamily:C.serif }}>{m.v}</div>
              <div style={{ fontSize:9, color:C.muted, textTransform:"uppercase", letterSpacing:0.8, marginTop:2 }}>{m.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Palabras difíciles ── */}
      {dificiles.length > 0 && (
        <div style={{ background:"rgba(26,8,10,0.6)", border:`1px solid ${C.pink}33`, borderRadius:14, padding:16 }}>
          <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:12 }}>
            <MIcon name="fitness_center" fill={1} size={16} color={C.pink} />
            <span style={{ fontSize:10, color:C.pink, letterSpacing:"0.2em", fontWeight:700, textTransform:"uppercase" }}>Palabras que te cuestan</span>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
            {dificiles.map(w => (
              <div key={w.id} style={{ display:"flex", alignItems:"center", gap:10, background:`${C.pink}08`, borderRadius:9, padding:"9px 12px", border:`1px solid ${C.pink}22` }}>
                <SpeakBtn text={w.palabra_it} color={C.pink} />
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, color:C.text, fontStyle:"italic", fontFamily:C.serif }}>{w.palabra_it}</div>
                  <div style={{ fontSize:11, color:C.muted }}><ES>{w.traduccion_es}</ES></div>
                </div>
                <div style={{ fontSize:10, color:C.pink, fontWeight:700 }}>
                  {Math.round((progresoMap[w.id]?.ease_factor || 2.5) * 10) / 10} EF
                </div>
              </div>
            ))}
          </div>
          <div style={{ fontSize:11, color:C.muted, marginTop:10, lineHeight:1.5 }}>
            EF bajo = más difícil para ti. El SRS las mostrará con más frecuencia automáticamente.
          </div>
        </div>
      )}

      {/* ── Plan del día ── */}
      {dia && (
        <div style={{ background:C.bg2, border:`1px solid ${C.border}`, borderRadius:16, padding:20 }}>
          <div style={{ fontSize:10, color:C.gold, letterSpacing:"0.25em", marginBottom:4, fontWeight:700 }}>DÍA {dia.dia_num}</div>
          <h3 style={{ fontSize:17, color:C.text, margin:"0 0 16px", fontFamily:C.serif, fontWeight:400 }}>{dia.titulo_dia}</h3>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {[
              { color:C.green,   icon:"style",     label:"SRS",           text:dia.actividad_srs },
              { color:C.blue,    icon:"headphones", label:"INPUT",         text:dia.actividad_input },
              { color:"#8b80f8", icon:"forum",      label:"OUTPUT",        text:dia.actividad_output },
              { color:C.pink,    icon:"campaign",   label:"TAREA DEL DÍA", text:dia.tarea_dia },
            ].map(a => (
              <div key={a.label} className="it-lesson-card" style={{ borderRadius:10, padding:13, borderLeft:`3px solid ${a.color}88` }}>
                <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:5 }}>
                  <MIcon name={a.icon} size={14} color={a.color} />
                  <span style={{ fontSize:10, color:a.color, letterSpacing:"0.2em", fontWeight:700, textTransform:"uppercase" }}>{a.label}</span>
                </div>
                <div style={{ fontSize:12, color:C.textMid, lineHeight:1.6 }}>{a.text}</div>
              </div>
            ))}
          </div>
          {dia.frase_clave_it && (
            <div className="it-glass" style={{ marginTop:14, borderRadius:12, padding:14 }}>
              <div style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
                <SpeakBtn text={dia.frase_clave_it} />
                <div>
                  <div style={{ fontSize:16, color:C.gold, fontStyle:"italic", fontFamily:C.serif, lineHeight:1.4, marginBottom:4 }}>"{dia.frase_clave_it}"</div>
                  <div style={{ fontSize:12, color:C.muted }}><ES>{dia.frase_clave_es}</ES></div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Vocab del día ── */}
      {vocabHoy.length > 0 && (
        <div style={{ background:C.bg2, border:`1px solid ${C.border}`, borderRadius:16, padding:18 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
            <span style={{ fontSize:10, color:C.gold, letterSpacing:"0.22em", fontWeight:700, textTransform:"uppercase" }}>Vocabulario de Hoy</span>
            <Tag color={savedToday === vocabHoy.length ? C.green : C.gold}>{savedToday}/{vocabHoy.length} guardadas</Tag>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
            {vocabHoy.map(w => {
              const saved = progresoMap[w.id]?.guardada;
              return (
                <div key={w.id} className="it-lesson-card" style={{ display:"flex", alignItems:"center", gap:10, background:saved?"rgba(26,26,10,0.8)":"", border:saved?`1px solid ${C.gold}33`:`1px solid ${C.border}`, borderRadius:10, padding:"10px 14px" }}>
                  <SpeakBtn text={w.palabra_it} color={saved ? C.gold : C.muted} />
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:15, color:saved ? C.gold : C.text, fontStyle:"italic", fontFamily:C.serif }}>{w.palabra_it}</div>
                    <div style={{ fontSize:11, color:C.muted, marginTop:1 }}><ES>{w.traduccion_es}</ES></div>
                  </div>
                  <MIcon name="star" fill={saved ? 1 : 0} size={20} color={saved ? C.gold : C.hint} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Vocab completado ── */}
      {savedToday === vocabHoy.length && vocabHoy.length > 0 && (
        <div style={{ background:`${C.green}0d`, border:`1px solid ${C.green}33`, borderRadius:12, padding:"12px 16px", display:"flex", alignItems:"center", gap:10 }}>
          <MIcon name="check_circle" fill={1} size={20} color={C.green} />
          <div style={{ fontSize:13, color:C.green }}>¡Vocab del día completo! Practica Speaking o adelanta en Vocab.</div>
        </div>
      )}

      {!semana && !dia && (
        <div style={{ textAlign:"center", padding:48, color:C.muted }}>
          <MIcon name="calendar_today" size={40} color={C.hint} />
          <div style={{ fontSize:14, marginTop:12, fontFamily:C.sans }}>No hay plan para Semana {weekNum} · Día {dayNum}</div>
          <div style={{ fontSize:12, marginTop:6, color:C.hint }}>Ajusta los controles S/D en el encabezado</div>
        </div>
      )}
    </div>
  );
}

// ─── VOCAB MODULE ──────────────────────────────────────────────────────────
function VocabModule({ db, progresoMap, refreshProgreso }) {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("todas");
  const [nivelFilter, setNivelFilter] = useState("todos");
  const [semanaFilter, setSemanaFilter] = useState(0);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);

  const cats = ["todas", ...new Set(db.vocabulario.map(w=>w.categoria).filter(Boolean))];
  const niveles = ["todos","A0","A1","A2","B1"];

  const filtered = db.vocabulario.filter(w => {
    const matchCat = catFilter === "todas" || w.categoria === catFilter;
    const matchNivel = nivelFilter === "todos" || w.nivel === nivelFilter;
    const matchSem = semanaFilter === 0 || w.semana === semanaFilter;
    const matchSearch = !search || w.palabra_it?.toLowerCase().includes(search.toLowerCase()) || w.traduccion_es?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchNivel && matchSem && matchSearch;
  });

  const savedCount = Object.values(progresoMap).filter(p=>p.guardada).length;
  const learnedCount = Object.values(progresoMap).filter(p=>p.repeticiones>=3).length;
  const dueCount = Object.values(progresoMap).filter(p=>p.guardada&&isDue(p.proximo_repaso)).length;

  async function toggleSave(word) {
    setSaving(true);
    try {
      const prog = progresoMap[word.id];
      if (prog) {
        await api.update("progreso_usuario", prog.id, { guardada: !prog.guardada });
        markActivity();
      } else {
        await api.create("progreso_usuario", {
          palabra_id: word.id, guardada: true,
          repeticiones: 0, intervalo_dias: 1, ease_factor: 2.5,
          proximo_repaso: new Date().toISOString().split("T")[0],
          ultima_calidad: null,
        });
        markActivity();
      }
      await refreshProgreso();
    } finally { setSaving(false); }
  }

  const inputStyle = { width:"100%", boxSizing:"border-box", background:C.bg3, border:`1px solid ${C.border}`, borderRadius:10, padding:"11px 12px 11px 38px", color:C.text, fontSize:14, outline:"none", fontFamily:C.sans, color:C.text };

  return (
    <div style={{ fontFamily:C.sans }} className="it-fade-in">
      <div style={{ position:"relative", marginBottom:14 }}>
        <span style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)" }}>
          <MIcon name="search" size={18} color={C.muted} />
        </span>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar palabra en italiano o español..."
          style={inputStyle} />
      </div>

      {/* Stats row */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,minmax(0,1fr))", gap:6, marginBottom:16 }}>
        {[{v:db.vocabulario.length,label:"total",color:C.textMid},{v:savedCount,label:"guardadas",color:C.gold},{v:learnedCount,label:"aprendidas",color:C.green},{v:dueCount,label:"para hoy",color:C.blue}].map(s=>(
          <div key={s.label} className="it-roman-border" style={{ background:C.bg3, borderRadius:10, padding:"10px 4px", textAlign:"center" }}>
            <div style={{ fontSize:20, color:s.color, fontWeight:700, fontFamily:C.serif }}>{s.v}</div>
            <div style={{ fontSize:9, color:C.muted, textTransform:"uppercase", letterSpacing:1 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Level filter */}
      <div style={{ display:"flex", gap:6, marginBottom:10, flexWrap:"wrap", alignItems:"center" }}>
        <div style={{ display:"flex", background:C.bg4, borderRadius:20, padding:3, border:`1px solid ${C.border}` }}>
          {niveles.map(n=>(
            <button key={n} onClick={()=>setNivelFilter(n)} style={{ background:nivelFilter===n?C.bg5:"transparent", border:"none", borderRadius:17, padding:"5px 12px", cursor:"pointer", color:nivelFilter===n?C.gold:C.muted, fontSize:11, fontWeight:nivelFilter===n?700:400, fontFamily:C.sans, transition:"all 0.15s" }}>{n}</button>
          ))}
        </div>
        <select value={semanaFilter} onChange={e=>setSemanaFilter(Number(e.target.value))} style={{ background:C.bg3, border:`1px solid ${C.border}`, borderRadius:20, padding:"5px 12px", color:C.muted, fontSize:11, cursor:"pointer", outline:"none", fontFamily:C.sans }}>
          <option value={0}>Todas las semanas</option>
          {Array.from({length:30},(_,i)=><option key={i+1} value={i+1}>Sem. {i+1}</option>)}
        </select>
      </div>

      {/* Category filter */}
      <div style={{ display:"flex", gap:5, marginBottom:16, flexWrap:"wrap" }}>
        {cats.slice(0,12).map(c=>(
          <button key={c} onClick={()=>setCatFilter(c)} style={{ background:catFilter===c?`${C.gold}18`:"transparent", border:`1px solid ${catFilter===c?C.gold:C.border}`, borderRadius:20, padding:"4px 10px", cursor:"pointer", color:catFilter===c?C.gold:C.muted, fontSize:10, fontWeight:catFilter===c?700:400, fontFamily:C.sans, transition:"all 0.15s" }}>{c}</button>
        ))}
      </div>

      {/* Word detail modal */}
      {selected && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", zIndex:50, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }} onClick={()=>setSelected(null)}>
          <div className="it-glass" style={{ borderRadius:18, padding:26, maxWidth:400, width:"100%", position:"relative" }} onClick={e=>e.stopPropagation()}>
            <button onClick={()=>setSelected(null)} style={{ position:"absolute", top:14, right:14, background:"transparent", border:"none", color:C.muted, fontSize:22, cursor:"pointer", lineHeight:1 }}>×</button>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
              <SpeakBtn text={selected.palabra_it} />
              <div>
                <div style={{ fontSize:22, color:C.gold, fontStyle:"italic", fontFamily:C.serif, lineHeight:1.2 }}>{selected.palabra_it}</div>
                <div style={{ fontSize:15, color:C.textMid, marginTop:2, fontFamily:C.sans }}><ES>{selected.traduccion_es}</ES></div>
              </div>
            </div>
            <div style={{ display:"flex", gap:6, marginBottom:14, flexWrap:"wrap" }}>
              <Tag>{selected.nivel || "A0"}</Tag>
              <Tag color={C.blue}>{selected.categoria}</Tag>
              <Tag color={C.green}>Sem. {selected.semana} · Día {selected.dia}</Tag>
            </div>
            {selected.ejemplo && (
              <div style={{ background:C.bg3, borderRadius:10, padding:14, marginBottom:14, border:`1px solid ${C.border}` }}>
                <div style={{ fontSize:10, color:C.muted, marginBottom:6, letterSpacing:1, fontWeight:700, textTransform:"uppercase" }}>Ejemplo</div>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <div style={{ fontSize:13, color:C.textMid, fontStyle:"italic", flex:1, fontFamily:C.serif, lineHeight:1.5 }}>{selected.ejemplo}</div>
                  <SpeakBtn text={selected.ejemplo} />
                </div>
              </div>
            )}
            {progresoMap[selected.id] && (
              <div style={{ background:C.bg3, borderRadius:10, padding:12, marginBottom:14, border:`1px solid ${C.border}` }}>
                <div style={{ fontSize:10, color:C.muted, letterSpacing:1, marginBottom:8, fontWeight:700, textTransform:"uppercase" }}>Progreso SRS</div>
                <div style={{ display:"flex", gap:12 }}>
                  {[
                    { v:progresoMap[selected.id].repeticiones||0, label:"repasos", c:C.gold },
                    { v:(progresoMap[selected.id].intervalo_dias||1)+"d", label:"intervalo", c:C.green },
                    { v:isDue(progresoMap[selected.id].proximo_repaso)?"Hoy":"Luego", label:"próximo", c:C.blue },
                  ].map(x=>(
                    <div key={x.label} style={{ flex:1, textAlign:"center" }}>
                      <div style={{ fontSize:18, color:x.c, fontWeight:700, fontFamily:C.serif }}>{x.v}</div>
                      <div style={{ fontSize:10, color:C.hint, textTransform:"uppercase", letterSpacing:0.5 }}>{x.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <button onClick={()=>{ toggleSave(selected); setSelected(null); }} disabled={saving} style={{
              background:progresoMap[selected.id]?.guardada?"transparent":`${C.gold}15`,
              border:`1px solid ${progresoMap[selected.id]?.guardada?C.pink:C.gold}`,
              borderRadius:8, padding:"11px 18px", cursor:"pointer",
              color:progresoMap[selected.id]?.guardada?C.pink:C.gold,
              fontWeight:700, fontSize:13, fontFamily:C.sans, width:"100%", letterSpacing:0.5,
            }}>
              {progresoMap[selected.id]?.guardada ? "Quitar del vocabulario" : "+ Añadir a mi SRS"}
            </button>
          </div>
        </div>
      )}

      <div style={{ fontSize:11, color:C.hint, marginBottom:10 }}>{filtered.length} palabras · toca una para ver detalles</div>
      <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
        {filtered.map(w => {
          const prog = progresoMap[w.id];
          const saved = prog?.guardada;
          return (
            <div key={w.id} onClick={()=>setSelected(w)} className="it-lesson-card" style={{
              display:"flex", alignItems:"center", gap:12,
              background:saved?"rgba(26,26,10,0.8)":"",
              border:`1px solid ${saved?C.gold+"44":C.border}`,
              borderRadius:10, padding:"11px 14px", cursor:"pointer",
              transition:"border-color 0.15s",
            }}>
              <SpeakBtn text={w.palabra_it} color={saved?C.gold:C.muted} />
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:14, color:saved?C.gold:C.text, fontStyle:"italic", fontFamily:C.serif }}>{w.palabra_it}</div>
                <div style={{ fontSize:12, color:C.muted, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", fontFamily:C.sans }}><ES>{w.traduccion_es}</ES></div>
              </div>
              <div style={{ display:"flex", gap:6, alignItems:"center", flexShrink:0 }}>
                <Tag color={C.blue}>{w.nivel}</Tag>
                {prog && isDue(prog.proximo_repaso) && saved && <span style={{ width:7, height:7, borderRadius:"50%", background:C.green, display:"inline-block" }}/>}
                <MIcon name="star" fill={saved?1:0} size={18} color={saved?C.gold:C.hint} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── SRS MODULE ────────────────────────────────────────────────────────────
function SRSModule({ db, progresoMap, refreshProgreso }) {
  const [session, setSession]         = useState(null);
  const [queue, setQueue]             = useState([]);
  const [idx, setIdx]                 = useState(0);
  const [flipped, setFlipped]         = useState(false);
  const [results, setResults]         = useState([]);
  const [saving, setSaving]           = useState(false);
  const [aiMsg, setAiMsg]             = useState("");
  const [aiLoading, setAiLoading]     = useState(false);

  const dueCards = db.vocabulario.filter(w => {
    const p = progresoMap[w.id];
    return p?.guardada && isDue(p.proximo_repaso);
  });

  async function generateAiSummary(finalResults) {
    setAiLoading(true); setAiMsg("");
    try {
      const total    = finalResults.length;
      const buenos   = finalResults.filter(r => r.quality >= 4).length;
      const regulares= finalResults.filter(r => r.quality === 3).length;
      const malos    = finalResults.filter(r => r.quality <= 2).length;
      const subieron = finalResults.filter(r => r.newInt > r.prevInt).length;
      const bajaron  = finalResults.filter(r => r.newInt < r.prevInt).length;
      const pct      = Math.round((buenos / total) * 100);

      const prompt = `Eres un tutor de italiano entusiasta y conciso. El alumno acaba de completar una sesión SRS de italiano con estos resultados:
- Total tarjetas: ${total}
- Perfectas/Bien: ${buenos} (${pct}%)
- Regular: ${regulares}
- Mal: ${malos}
- Palabras que subieron de nivel (intervalo aumentó): ${subieron}
- Palabras que bajaron de nivel: ${bajaron}

Escribe un mensaje de cierre motivacional en español de exactamente 2 frases. La primera frase resume el rendimiento con un dato concreto. La segunda frase da un consejo específico o anima según el resultado. Incluye una palabra o frase corta en italiano de forma natural. Sé directo, no uses emojis excesivos, máximo 1.`;

      const res  = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 120,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await res.json();
      const txt  = data.content?.map(b => b.text || "").join("").trim();
      if (txt) setAiMsg(txt);
    } catch { /* silencioso — el resumen funciona sin el mensaje IA */ }
    setAiLoading(false);
  }

  function startSession() {
    const q = [...dueCards].sort(()=>Math.random()-0.5).slice(0,20);
    setQueue(q); setIdx(0); setFlipped(false); setResults([]); setSession("running");
  }

  async function rate(quality) {
    const card = queue[idx];
    const prog = progresoMap[card.id];
    const prev = { intervalo_dias: prog?.intervalo_dias||1, repeticiones: prog?.repeticiones||0, ease_factor: prog?.ease_factor||2.5 };
    const next = getNextSRS(quality, prev.intervalo_dias, prev.repeticiones, prev.ease_factor);
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + next.interval);
    setSaving(true);
    try {
      const fields = {
        palabra_id: card.id, guardada: true,
        repeticiones: next.repetitions, intervalo_dias: next.interval,
        ease_factor: Number(next.easeFactor.toFixed(2)),
        proximo_repaso: nextDate.toISOString().split("T")[0],
        ultima_calidad: quality,
      };
      if (prog) await api.update("progreso_usuario", prog.id, fields);
      else await api.upsert("progreso_usuario", fields);
      markActivity();
      await refreshProgreso();
    } finally { setSaving(false); }
    setResults(r => {
      const updated = [...r, {id:card.id, quality, prevEase: progresoMap[card.id]?.ease_factor||2.5, newEase: Number(next.easeFactor.toFixed(2)), prevInt: prev.intervalo_dias, newInt: next.interval }];
      if (idx+1 >= queue.length) generateAiSummary(updated);
      return updated;
    });
    if (idx+1 >= queue.length) setSession("done");
    else { setIdx(i=>i+1); setFlipped(false); }
  }

  if (session === null || session === "done") {
    const good      = results.filter(r => r.quality >= 3).length;
    const perfectos = results.filter(r => r.quality === 5).length;
    const malos     = results.filter(r => r.quality <= 2).length;
    const subieron  = results.filter(r => r.newInt > r.prevInt).length;
    const bajaron   = results.filter(r => r.newInt < r.prevInt).length;
    const pct       = results.length ? Math.round((results.filter(r=>r.quality>=4).length / results.length)*100) : 0;

    return (
      <div style={{ fontFamily:C.sans }} className="it-fade-in">

        {/* ── Pantalla de cierre post-sesión ── */}
        {session === "done" && (
          <div className="it-fade-in" style={{ marginBottom:20 }}>

            {/* Header animado */}
            <div style={{ textAlign:"center", padding:"28px 16px 20px", background:"linear-gradient(135deg,rgba(20,20,9,0.9),rgba(13,13,26,0.95))", borderRadius:18, border:`1px solid ${pct>=80?C.gold:pct>=50?C.green:C.pink}44`, marginBottom:14 }}>
              <div style={{ fontSize:44, marginBottom:8 }}>
                {pct === 100 ? "🏆" : pct >= 80 ? "⭐" : pct >= 50 ? "💪" : "📚"}
              </div>
              <div style={{ fontSize:24, color:pct>=80?C.gold:pct>=50?C.green:C.pink, fontFamily:C.serif, fontWeight:400, marginBottom:4 }}>
                {pct === 100 ? "Perfetto!" : pct >= 80 ? "Molto bene!" : pct >= 50 ? "Bene!" : "Continua così!"}
              </div>
              <div style={{ fontSize:13, color:C.textMid }}>
                {good} de {results.length} correctas · {pct}% de acierto
              </div>
            </div>

            {/* Métricas de la sesión */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:8, marginBottom:14 }}>
              {[
                { v:subieron, label:"subieron de nivel", color:C.green,  icon:"trending_up" },
                { v:bajaron,  label:"bajaron de nivel",  color:C.pink,   icon:"trending_down" },
                { v:perfectos,label:"perfectas",         color:C.gold,   icon:"star" },
                { v:malos,    label:"a repasar mañana",  color:"#d0902a",icon:"refresh" },
              ].map(m => (
                <div key={m.label} style={{ background:C.bg3, border:`1px solid ${C.border}`, borderRadius:12, padding:"12px 14px", display:"flex", alignItems:"center", gap:10 }}>
                  <MIcon name={m.icon} fill={1} size={20} color={m.color} />
                  <div>
                    <div style={{ fontSize:20, color:m.color, fontWeight:700, fontFamily:C.serif, lineHeight:1 }}>{m.v}</div>
                    <div style={{ fontSize:10, color:C.muted, textTransform:"uppercase", letterSpacing:0.6, marginTop:2 }}>{m.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desglose de calidades */}
            <div style={{ background:C.bg2, border:`1px solid ${C.border}`, borderRadius:12, padding:"12px 16px", marginBottom:14 }}>
              <div style={{ fontSize:10, color:C.muted, letterSpacing:"0.2em", fontWeight:700, textTransform:"uppercase", marginBottom:10 }}>Desglose</div>
              <div style={{ display:"flex", gap:6, justifyContent:"space-between" }}>
                {[{q:2,l:"Mal",c:C.pink},{q:3,l:"Regular",c:"#d0902a"},{q:4,l:"Bien",c:C.green},{q:5,l:"Perfecto",c:C.gold}].map(({q,l,c})=>{
                  const count = results.filter(r=>r.quality===q).length;
                  const pctBar = results.length ? (count/results.length)*100 : 0;
                  return (
                    <div key={q} style={{ flex:1, textAlign:"center" }}>
                      <div style={{ fontSize:18, color:c, fontWeight:700, fontFamily:C.serif }}>{count}</div>
                      <div style={{ height:3, background:`${c}22`, borderRadius:2, margin:"4px 0", overflow:"hidden" }}>
                        <div style={{ height:"100%", background:c, width:`${pctBar}%`, borderRadius:2, transition:"width 0.5s" }}/>
                      </div>
                      <div style={{ fontSize:9, color:C.hint, textTransform:"uppercase" }}>{l}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Mensaje IA */}
            <div style={{ background:`${C.blue}0d`, border:`1px solid ${C.blue}22`, borderRadius:12, padding:"12px 16px", marginBottom:4, minHeight:52, display:"flex", alignItems:"center", gap:10 }}>
              <MIcon name="smart_toy" fill={1} size={18} color={C.blue} />
              {aiLoading
                ? <div style={{ display:"flex", gap:4, alignItems:"center" }}>
                    {[0,1,2].map(i=>(
                      <span key={i} style={{ width:6, height:6, borderRadius:"50%", background:C.blue,
                        animation:`it-bounce 0.9s ${i*0.2}s ease-in-out infinite`, display:"inline-block" }}/>
                    ))}
                    <span style={{ fontSize:12, color:C.blue, marginLeft:6 }}>Generando resumen…</span>
                  </div>
                : <div style={{ fontSize:13, color:C.textMid, lineHeight:1.6 }}>{aiMsg || "¡Sesión completada! Vuelve mañana para continuar."}</div>
              }
            </div>
          </div>
        )}

        {/* ── Stats y botón de inicio ── */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,minmax(0,1fr))", gap:8, marginBottom:18 }}>
          {[
            { v:dueCards.length, l:"para hoy", c:C.green },
            { v:Object.values(progresoMap).filter(p=>p.guardada).length, l:"en mazo", c:C.gold },
            { v:Object.values(progresoMap).filter(p=>p.repeticiones>=3).length, l:"aprendidas", c:C.blue },
          ].map(x=>(
            <div key={x.l} className="it-roman-border it-gold-glow" style={{ background:C.bg3, borderRadius:12, padding:"14px 8px", textAlign:"center" }}>
              <div style={{ fontSize:28, color:x.c, fontWeight:700, fontFamily:C.serif }}>{x.v}</div>
              <div style={{ fontSize:10, color:C.muted, textTransform:"uppercase", letterSpacing:1 }}>{x.l}</div>
            </div>
          ))}
        </div>

        <div style={{ background:"rgba(8,14,20,0.8)", border:`1px solid ${C.blue}22`, borderRadius:14, padding:18, marginBottom:18 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
            <MIcon name="psychology" fill={1} size={18} color={C.blue} />
            <span style={{ fontSize:11, color:C.blue, letterSpacing:"0.2em", fontWeight:700, textTransform:"uppercase" }}>Algoritmo SM-2</span>
          </div>
          <p style={{ fontSize:13, color:C.textMid, lineHeight:1.7, margin:0 }}>Las tarjetas aparecen justo antes del momento de olvido. <strong style={{color:C.text}}>150–200% más retención</strong> que el estudio tradicional.</p>
        </div>

        {dueCards.length > 0
          ? <button onClick={startSession} style={{ background:C.gold, border:"none", borderRadius:10, padding:"14px 20px", cursor:"pointer", color:"#241a00", fontWeight:700, fontSize:14, fontFamily:C.sans, width:"100%", letterSpacing:0.5 }}>
              {session === "done" ? "Nueva sesión →" : `Iniciar sesión · ${Math.min(dueCards.length,20)} tarjetas →`}
            </button>
          : <div style={{ textAlign:"center", padding:36, color:C.muted }}>
              <MIcon name="check_circle" fill={1} size={40} color={C.green} />
              <div style={{ fontSize:14, marginTop:12, fontFamily:C.sans }}>
                {Object.values(progresoMap).filter(p=>p.guardada).length === 0
                  ? "Guarda palabras en Vocabulario para crear tu mazo"
                  : "No hay tarjetas pendientes para hoy 🎉"}
              </div>
            </div>
        }
      </div>
    );
  }

  const card = queue[idx];
  const progress = (idx / queue.length) * 100;

  return (
    <div style={{ fontFamily:C.sans }} className="it-fade-in">
      <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:C.muted, marginBottom:6 }}>
        <span style={{ fontWeight:700, color:C.textMid }}>Tarjeta {idx+1} de {queue.length}</span>
        <span style={{ background:`${C.bg4}`, borderRadius:20, padding:"2px 10px", border:`1px solid ${C.border}`, fontSize:11 }}>{queue.length-idx} restantes</span>
      </div>
      <div style={{ height:2, background:C.bg4, borderRadius:2, marginBottom:22, overflow:"hidden" }}>
        <div style={{ height:"100%", background:C.gold, width:`${progress}%`, borderRadius:2, transition:"width 0.35s", boxShadow:`0 0 8px ${C.gold}66` }}/>
      </div>

      <div onClick={()=>!flipped&&setFlipped(true)} className="it-glass" style={{
        borderRadius:18, padding:"40px 24px", textAlign:"center", cursor:flipped?"default":"pointer",
        minHeight:220, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
        gap:14, marginBottom:18, transition:"all 0.25s",
        background:flipped?"rgba(10,26,10,0.7)":"linear-gradient(135deg,rgba(20,20,9,0.85),rgba(13,13,26,0.85))",
        border:flipped?`1px solid ${C.green}55`:`1px solid ${C.gold}33`,
      }}>
        <div style={{ fontSize:10, color:flipped?C.green:C.gold, letterSpacing:"0.25em", fontWeight:700, textTransform:"uppercase" }}>
          {flipped ? "Italiano" : "¿Cómo se dice en italiano?"}
        </div>
        {!flipped ? (
          <>
            <div style={{ fontSize:28, color:C.text, fontFamily:C.serif }}>{card.traduccion_es}</div>
            <div style={{ fontSize:12, color:C.hint, animation:"it-pulse 2s infinite" }}>Toca para revelar</div>
          </>
        ) : (
          <>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ fontSize:30, color:C.gold, fontStyle:"italic", fontFamily:C.serif }}>{card.palabra_it}</div>
              <SpeakBtn text={card.palabra_it} />
            </div>
            {card.ejemplo && (
              <div style={{ background:C.bg3, borderRadius:10, padding:"10px 16px", border:`1px solid ${C.border}`, maxWidth:"100%" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <div style={{ fontSize:13, color:C.textMid, fontStyle:"italic", flex:1, fontFamily:C.serif, lineHeight:1.5 }}>{card.ejemplo}</div>
                  <SpeakBtn text={card.ejemplo} />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {flipped && (
        <div className="it-fade-in">
          <div style={{ fontSize:12, color:C.muted, textAlign:"center", marginBottom:12 }}>¿Qué tan bien lo recordaste?</div>
          <div style={{ display:"flex", gap:8 }}>
            {[{q:2,l:"Mal",c:C.pink,s:"1 día"},{q:3,l:"Regular",c:"#d0902a",s:"pronto"},{q:4,l:"Bien",c:C.green,s:"más tarde"},{q:5,l:"Perfecto",c:C.gold,s:"largo plazo"}].map(({q,l,c,s})=>(
              <button key={q} onClick={()=>!saving&&rate(q)} disabled={saving} style={{
                flex:1, background:`${c}12`, border:`1px solid ${c}44`, borderRadius:10,
                padding:"12px 4px", cursor:saving?"wait":"pointer", color:c, fontFamily:C.sans,
                transition:"all 0.15s",
              }}>
                <div style={{ fontWeight:700, fontSize:13 }}>{l}</div>
                <div style={{ fontSize:10, opacity:0.7, marginTop:2 }}>{s}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── QUIZ MODULE ────────────────────────────────────────────────────────────
// ─── QUIZ HELPERS ─────────────────────────────────────────────────────────
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({length:m+1}, (_,i) => Array.from({length:n+1}, (_,j) => i===0?j:j===0?i:0));
  for (let i=1;i<=m;i++) for (let j=1;j<=n;j++)
    dp[i][j] = a[i-1]===b[j-1] ? dp[i-1][j-1] : 1+Math.min(dp[i-1][j-1],dp[i-1][j],dp[i][j-1]);
  return dp[m][n];
}
function normIT(s) {
  return s.toLowerCase().trim()
    .replace(/[àáâ]/g,"a").replace(/[èéê]/g,"e")
    .replace(/[ìíî]/g,"i").replace(/[òóô]/g,"o")
    .replace(/[ùúû]/g,"u");
}
function matchDictado(input, esperado) {
  const d = normIT(input), e = normIT(esperado);
  if (d === e) return true;
  return levenshtein(d, e) <= Math.max(1, Math.floor(e.length * 0.2));
}

function QuizModule({ db, progresoMap }) {
  const [quiz, setQuiz]           = useState(null);
  const [answers, setAnswers]     = useState({});
  const [submitted, setSubmitted] = useState(false);
  // ── Dictado state ──
  const [dictInputs, setDictInputs]   = useState({});   // {qId: texto}
  const [dictSTT, setDictSTT]         = useState(null);  // qId siendo escuchado
  const dictRecRef                    = useRef(null);
  const dictMediaRef                  = useRef(null);
  const dictChunksRef                 = useRef([]);
  const GROQ_KEY_Q = localStorage.getItem("groq_api_key") || "";

  async function startDictSTT(qId, expectedIT) {
    // Si ya escuchando este → detener
    if (dictSTT === qId) {
      dictRecRef.current?.stop();
      dictMediaRef.current?.stop();
      setDictSTT(null); return;
    }
    setDictSTT(qId);
    // Rama 1: Web Speech
    if (WEB_SPEECH_AVAILABLE) {
      const SR = window.webkitSpeechRecognition || window.SpeechRecognition;
      const rec = new SR();
      rec.lang = "it-IT"; rec.interimResults = false; rec.maxAlternatives = 1;
      dictRecRef.current = rec;
      rec.onend  = () => setDictSTT(null);
      rec.onerror = () => { setDictSTT(null); if (GROQ_KEY_Q) startGroqDictSTT(qId); };
      rec.onresult = (e) => {
        const t = e.results[0][0].transcript;
        setDictInputs(p => ({...p, [qId]: t}));
        if (!submitted) setAnswers(p => ({...p, [qId]: matchDictado(t, expectedIT) ? "correct" : "wrong_" + t}));
      };
      rec.start(); return;
    }
    // Rama 2: Groq
    if (GROQ_KEY_Q) { startGroqDictSTT(qId, expectedIT); return; }
    setDictSTT(null);
  }

  async function startGroqDictSTT(qId, expectedIT) {
    try {
      const stream  = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime    = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const recorder = new MediaRecorder(stream, { mimeType: mime });
      dictMediaRef.current = recorder; dictChunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size>0) dictChunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach(t=>t.stop());
        const blob = new Blob(dictChunksRef.current, { type: mime });
        const form = new FormData();
        form.append("file", blob, `audio.${mime.includes("mp4")?"mp4":"webm"}`);
        form.append("model","whisper-large-v3"); form.append("language","it");
        try {
          const res  = await fetch("https://api.groq.com/openai/v1/audio/transcriptions",
            { method:"POST", headers:{ Authorization:`Bearer ${GROQ_KEY_Q}` }, body:form });
          const data = await res.json();
          if (data.text) {
            setDictInputs(p => ({...p, [qId]: data.text}));
            if (!submitted) setAnswers(p => ({...p, [qId]: matchDictado(data.text, expectedIT) ? "correct" : "wrong_" + data.text}));
          }
        } catch {}
        setDictSTT(null);
      };
      recorder.start();
      setTimeout(() => { if (recorder.state==="recording") recorder.stop(); }, 15000);
    } catch { setDictSTT(null); }
  }

  const pool = db.vocabulario.filter(w => progresoMap[w.id]?.guardada);

  function buildQuiz() {
    if (pool.length < 4) return null;
    const shuffled = [...pool].sort(()=>Math.random()-0.5).slice(0,8);
    return shuffled.map((word, i) => {
      const distractors = pool.filter(w=>w.id!==word.id).sort(()=>Math.random()-0.5).slice(0,3);
      const types = ["translate_to_it","translate_to_es","audio_pick","fill_blank","dictado"];
      const type = types[i%5];
      const options = [word,...distractors].sort(()=>Math.random()-0.5);
      const blank = word.ejemplo?.replace(new RegExp(word.palabra_it,"i"),"______") || null;
      return { id:i, word, type:(type==="fill_blank"&&!blank)?"translate_to_it":(type==="dictado")?"dictado":type, options, blank, correct:word.id };
    });
  }

  function start() {
    const q = buildQuiz();
    if (q) { setQuiz(q); setAnswers({}); setSubmitted(false); setDictInputs({}); }
  }

  if (!quiz) return (
    <div style={{ fontFamily:C.sans }} className="it-fade-in">
      <div style={{ background:"rgba(8,14,20,0.8)", border:`1px solid ${C.blue}22`, borderRadius:14, padding:18, marginBottom:18 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
          <MIcon name="quiz" fill={1} size={18} color={C.blue} />
          <span style={{ fontSize:11, color:C.blue, letterSpacing:"0.2em", fontWeight:700, textTransform:"uppercase" }}>Quiz Diario Personal</span>
        </div>
        <p style={{ fontSize:13, color:C.textMid, lineHeight:1.7, margin:0 }}>Las preguntas se generan desde <strong style={{color:C.text}}>tu vocabulario guardado</strong>. 4 tipos: traducción, audio y frases con huecos.</p>
      </div>
      {pool.length < 4
        ? <div style={{ textAlign:"center", padding:36, color:C.muted }}>
            <MIcon name="lock" fill={1} size={36} color={C.hint} />
            <div style={{ fontSize:14, marginTop:12 }}>Necesitas al menos <strong style={{color:C.text}}>4 palabras guardadas</strong> para el quiz.</div>
          </div>
        : <><div style={{ fontSize:12, color:C.hint, marginBottom:14 }}>{pool.length} palabras disponibles · Quiz de {Math.min(pool.length,8)} preguntas</div>
           <button onClick={start} style={{ background:`${C.blue}18`, border:`1px solid ${C.blue}`, borderRadius:10, padding:"13px 20px", cursor:"pointer", color:C.blue, fontWeight:700, fontSize:14, fontFamily:C.sans, width:"100%", letterSpacing:0.5 }}>Generar Quiz del Día</button></>
      }
    </div>
  );

  const score = submitted ? quiz.filter(q => {
    if (q.type === "dictado") return answers[q.id] === "correct";
    return answers[q.id] === q.correct;
  }).length : null;
  const pct = submitted ? Math.round((score/quiz.length)*100) : null;

  return (
    <div style={{ fontFamily:C.sans }} className="it-fade-in">
      {!submitted && (
        <div style={{ marginBottom:16 }}>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:C.muted, marginBottom:6 }}>
            <span style={{ fontWeight:700, color:C.textMid }}>Respondidas: {Object.keys(answers).length}/{quiz.length}</span>
            {Object.keys(answers).length===quiz.length && <span style={{color:C.green, fontWeight:700}}>Listo ✓</span>}
          </div>
          <div style={{ height:2, background:C.bg4, borderRadius:2, overflow:"hidden" }}>
            <div style={{ height:"100%", background:C.blue, width:`${(Object.keys(answers).length/quiz.length)*100}%`, borderRadius:2, transition:"width 0.3s" }}/>
          </div>
        </div>
      )}
      {submitted && (
        <div style={{ background:pct>=70?"rgba(10,26,10,0.7)":"rgba(26,8,10,0.7)", border:`1px solid ${pct>=70?C.green:C.pink}44`, borderRadius:16, padding:24, marginBottom:20, textAlign:"center" }}>
          <div style={{ fontSize:40, color:pct>=70?C.green:C.pink, fontWeight:700, fontFamily:C.serif }}>{pct}%</div>
          <div style={{ fontSize:14, color:C.textMid, marginTop:4 }}>{score} de {quiz.length} correctas · {pct===100?"¡Perfetto! 🏆":pct>=70?"Molto bene!":"Repasa las rojas"}</div>
        </div>
      )}
      <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:16 }}>
        {quiz.map((q,qi)=>{
          const userAns = answers[q.id];
          const isRight = submitted && (q.type==="dictado" ? userAns==="correct" : userAns===q.correct);
          const isWrong = submitted && userAns && !isRight;
          return (
            <div key={q.id} className="it-lesson-card" style={{ border:`1px solid ${submitted?(isRight?C.green+"55":isWrong?C.pink+"55":C.border):C.border}`, borderRadius:14, padding:16 }}>
              <div style={{ fontSize:10, color:C.muted, letterSpacing:1, marginBottom:8, fontWeight:700, textTransform:"uppercase" }}>Pregunta {qi+1}</div>
              {q.type==="audio_pick"
                ? <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
                    <button onClick={()=>speak(q.word.palabra_it)} style={{ background:`${C.gold}18`, border:`1px solid ${C.gold}44`, borderRadius:8, padding:"8px 14px", cursor:"pointer", color:C.gold, fontFamily:C.sans, fontWeight:700, display:"flex", alignItems:"center", gap:6 }}>
                      <MIcon name="volume_up" fill={1} size={16} color={C.gold} /> Escuchar
                    </button>
                    <span style={{ fontSize:13, color:C.muted }}>¿Cuál es esta palabra?</span>
                  </div>
                : q.type==="fill_blank"
                ? <div style={{ fontSize:14, color:C.text, fontStyle:"italic", marginBottom:12, fontFamily:C.serif }}>Completa: <span style={{color:C.gold}}>{q.blank}</span></div>
                : q.type==="translate_to_it"
                ? <div style={{ fontSize:14, color:C.text, marginBottom:12 }}>¿En italiano? <em style={{color:C.gold, fontFamily:C.serif}}>"{q.word.traduccion_es}"</em></div>
                : q.type==="dictado"
                ? <div style={{ marginBottom:12 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                      <button onClick={()=>speak(q.word.palabra_it)} style={{ background:`${C.gold}18`, border:`1px solid ${C.gold}44`, borderRadius:8, padding:"8px 12px", cursor:"pointer", color:C.gold, fontFamily:C.sans, fontWeight:700, display:"flex", alignItems:"center", gap:5 }}>
                        <MIcon name="volume_up" fill={1} size={15} color={C.gold} /> Escuchar
                      </button>
                      <span style={{ fontSize:13, color:C.muted }}>Escribe lo que oyes en italiano</span>
                    </div>
                    <div style={{ display:"flex", gap:7 }}>
                      <input
                        value={dictInputs[q.id]||""}
                        onChange={e => {
                          const v = e.target.value;
                          setDictInputs(p=>({...p,[q.id]:v}));
                          if (!submitted) setAnswers(p=>({...p,[q.id]: v.trim() ? (matchDictado(v,q.word.palabra_it)?"correct":"wrong_"+v) : undefined}));
                        }}
                        disabled={submitted}
                        placeholder="Scrivi la parola..."
                        style={{ flex:1, background:submitted?(isRight?`${C.green}12`:`${C.pink}12`):C.bg3,
                          border:`1px solid ${submitted?(isRight?C.green+"66":C.pink+"55"):C.border}`,
                          borderRadius:9, padding:"10px 12px", color:C.text, fontSize:14,
                          fontFamily:C.serif, outline:"none" }}
                      />
                      {(WEB_SPEECH_AVAILABLE||!!GROQ_KEY_Q) && !submitted && (
                        <button onClick={()=>startDictSTT(q.id, q.word.palabra_it)}
                          title={dictSTT===q.id?"Detener":"Dictar en italiano"}
                          style={{ background: dictSTT===q.id?`${C.pink}22`:C.bg3,
                            border:`1px solid ${dictSTT===q.id?C.pink:C.border}`,
                            borderRadius:9, padding:"0 12px", cursor:"pointer",
                            display:"flex", alignItems:"center", justifyContent:"center", minWidth:40 }}>
                          {dictSTT===q.id
                            ? <span style={{ display:"flex", gap:2, alignItems:"center", height:18 }}>
                                {[0,1,2].map(i=>(
                                  <span key={i} style={{ width:3, borderRadius:2, background:C.pink,
                                    height:[8,14,10][i], animation:`it-bounce 0.8s ${i*0.15}s ease-in-out infinite` }}/>
                                ))}
                              </span>
                            : <MIcon name="mic" size={17} color={WEB_SPEECH_AVAILABLE?C.textMid:C.gold}/>}
                        </button>
                      )}
                    </div>
                    {submitted && (
                      <div style={{ marginTop:7, fontSize:12 }}>
                        {isRight
                          ? <span style={{color:C.green}}>✓ {dictInputs[q.id]||"—"}</span>
                          : <span style={{color:C.pink}}>✗ Escribiste: <em>"{dictInputs[q.id]||"(vacío)"}"</em></span>}
                      </div>
                    )}
                  </div>
                : <div style={{ fontSize:14, color:C.text, marginBottom:12 }}>¿Qué significa? <em style={{color:C.gold, fontFamily:C.serif}}>"{q.word.palabra_it}"</em></div>
              }
              {/* Opciones solo para tipos no-dictado */}
              {q.type !== "dictado" && (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:7 }}>
                {q.options.map(opt=>{
                  const sel = userAns===opt.id;
                  const right2 = submitted&&opt.id===q.correct;
                  const wrong2 = submitted&&sel&&!right2;
                  return (
                    <button key={opt.id} onClick={()=>!submitted&&setAnswers(p=>({...p,[q.id]:opt.id}))} style={{
                      background:right2?`${C.green}20`:wrong2?`${C.pink}20`:sel?`${C.blue}20`:C.bg3,
                      border:`1px solid ${right2?C.green+"66":wrong2?C.pink+"66":sel?C.blue+"66":C.border}`,
                      borderRadius:9, padding:"10px 12px", cursor:submitted?"default":"pointer",
                      color:right2?C.green:wrong2?C.pink:sel?C.blue:C.text, fontFamily:C.sans, fontSize:13, textAlign:"left",
                      transition:"all 0.15s",
                    }}>
                      {q.type==="translate_to_es" ? opt.traduccion_es : opt.palabra_it}
                    </button>
                  );
                })}
              </div>
              )}
              {submitted&&!isRight&&userAns&&q.type!=="dictado"&&<div style={{ marginTop:8, fontSize:12, color:C.muted }}>Correcto: <em style={{color:C.green, fontFamily:C.serif}}>{q.word.palabra_it}</em> = {q.word.traduccion_es}</div>}
              {submitted&&!isRight&&q.type==="dictado"&&<div style={{ marginTop:4, fontSize:12, color:C.muted }}>Correcto: <em style={{color:C.green, fontFamily:C.serif}}>{q.word.palabra_it}</em></div>}
            </div>
          );
        })}
      </div>
      {!submitted
        ? <button onClick={()=>Object.keys(answers).length===quiz.length&&setSubmitted(true)} disabled={Object.keys(answers).length<quiz.length} style={{ background:Object.keys(answers).length===quiz.length?`${C.blue}20`:C.bg3, border:`1px solid ${Object.keys(answers).length===quiz.length?C.blue:C.border}`, borderRadius:10, padding:"13px 20px", cursor:Object.keys(answers).length===quiz.length?"pointer":"default", color:Object.keys(answers).length===quiz.length?C.blue:C.hint, fontWeight:700, fontSize:14, fontFamily:C.sans, width:"100%", transition:"all 0.2s" }}>Enviar respuestas</button>
        : <button onClick={()=>setQuiz(null)} style={{ background:`${C.blue}18`, border:`1px solid ${C.blue}`, borderRadius:10, padding:"13px 20px", cursor:"pointer", color:C.blue, fontWeight:700, fontSize:14, fontFamily:C.sans, width:"100%" }}>Nuevo Quiz</button>
      }
    </div>
  );
}

// ─── READING MODULE ────────────────────────────────────────────────────────
// ─── READING MODULE ────────────────────────────────────────────────────────
function ReadingModule({ db, progresoMap, refreshProgreso }) {
  const [sel, setSel] = useState(null);
  const [tooltip, setTooltip] = useState(null);
  const [savedFromHere, setSavedFromHere] = useState({});
  const nivelOrder = { "A0":0,"A1":1,"A2":2,"B1":3,"B2":4 };

  async function saveWord(wordIT) {
    const match = db.vocabulario.find(w => w.palabra_it?.toLowerCase() === wordIT.toLowerCase());
    if (!match) return;
    const prog = progresoMap[match.id];
    if (prog?.guardada) return;
    if (prog) {
      await api.update("progreso_usuario", prog.id, { guardada: true });
    } else {
      await api.create("progreso_usuario", {
        palabra_id: match.id, guardada: true,
        repeticiones: 0, intervalo_dias: 1, ease_factor: 2.5,
        proximo_repaso: new Date().toISOString().split("T")[0],
        ultima_calidad: null,
      });
    }
    await refreshProgreso();
    setSavedFromHere(p=>({...p,[wordIT]:true}));
    setTooltip(null);
  }

  const sorted = [...db.lecturas.filter(r=>r.activa)].sort((a,b)=>(nivelOrder[a.nivel]||0)-(nivelOrder[b.nivel]||0));

  const nivelColors = { "A0":C.green, "A1":C.gold, "A2":C.blue, "B1":C.pink };

  if (!sel) return (
    <div style={{ fontFamily:C.sans }} className="it-fade-in">
      <div style={{ background:"rgba(8,10,20,0.8)", border:`1px solid ${C.blue}22`, borderRadius:14, padding:18, marginBottom:18 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
          <MIcon name="menu_book" fill={1} size={18} color={C.blue} />
          <span style={{ fontSize:11, color:C.blue, letterSpacing:"0.2em", fontWeight:700, textTransform:"uppercase" }}>Lectura Graduada · Krashen i+1</span>
        </div>
        <p style={{ fontSize:13, color:C.textMid, lineHeight:1.7, margin:0 }}>Toca cualquier palabra subrayada para ver su significado y guardarla en tu SRS con un toque.</p>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {sorted.map(r=>(
          <div key={r.id} onClick={()=>{ setSel(r); setSavedFromHere({}); }} className="it-lesson-card" style={{ border:`1px solid ${C.border}`, borderRadius:14, padding:16, cursor:"pointer", display:"flex", gap:14, alignItems:"center", transition:"border-color 0.15s" }}>
            <div style={{ fontSize:34 }}>{r.emoji}</div>
            <div style={{ flex:1 }}>
              <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:5, flexWrap:"wrap" }}>
                <div style={{ fontSize:15, color:C.text, fontFamily:C.serif }}>{r.titulo}</div>
                <Tag color={nivelColors[r.nivel]||C.blue}>{r.nivel}</Tag>
                <Tag color={C.muted}>Sem. {r.semana_desde}+</Tag>
              </div>
              <div style={{ fontSize:11, color:C.hint }}>
                {(() => { try { return Object.keys(JSON.parse(r.glosario_json||"{}")).length; } catch{return 0;} })()} palabras con glosario
              </div>
            </div>
            <MIcon name="chevron_right" size={22} color={C.muted} />
          </div>
        ))}
      </div>
    </div>
  );

  let glossary = {};
  try { glossary = JSON.parse(sel.glosario_json || "{}"); } catch {}
  const paragraphs = (sel.texto||"").split("\n\n");

  return (
    <div onClick={()=>setTooltip(null)} style={{ fontFamily:C.sans }} className="it-fade-in">
      <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:16 }}>
        <button onClick={()=>setSel(null)} style={{ background:"transparent", border:`1px solid ${C.border}`, borderRadius:8, padding:"7px 14px", cursor:"pointer", color:C.textMid, fontSize:12, fontFamily:C.sans, display:"flex", alignItems:"center", gap:5 }}>
          <MIcon name="arrow_back" size={16} color={C.muted} /> Volver
        </button>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:16, color:C.text, fontFamily:C.serif }}>{sel.emoji} {sel.titulo}</div>
          <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>Toca palabras subrayadas para ver significado</div>
        </div>
        <Tag color={nivelColors[sel.nivel]||C.blue}>{sel.nivel}</Tag>
      </div>

      {Object.keys(savedFromHere).length > 0 && (
        <div style={{ background:"rgba(10,26,10,0.7)", border:`1px solid ${C.green}33`, borderRadius:10, padding:"9px 14px", marginBottom:14, fontSize:12, color:C.green, display:"flex", alignItems:"center", gap:8 }}>
          <MIcon name="star" fill={1} size={14} color={C.green} />
          {Object.keys(savedFromHere).length} palabra(s) guardadas en tu SRS
        </div>
      )}

      <div className="it-glass" style={{ borderRadius:14, padding:22, marginBottom:16, lineHeight:2, fontSize:15, fontFamily:C.serif }}>
        {paragraphs.map((para,pi)=>(
          <p key={pi} style={{ margin:pi>0?"16px 0 0":0, color:C.text }}>
            {para.split(/(\s+)/).map((token,ti)=>{
              const clean = token.replace(/[.,!?¡¿"«»\n;:'"()\-]/g,"").toLowerCase();
              const hasG = glossary[clean];
              if (!hasG) return <span key={ti}>{token}</span>;
              const active = tooltip===`${pi}-${ti}`;
              return (
                <span key={ti} style={{ position:"relative", display:"inline" }}>
                  <span onClick={e=>{ e.stopPropagation(); setTooltip(active?null:`${pi}-${ti}`); }}
                    style={{ borderBottom:`1px dotted ${C.gold}`, color:C.gold, cursor:"pointer" }}>
                    {token}
                  </span>
                  {active && (
                    <span onClick={e=>e.stopPropagation()} style={{
                      position:"absolute", bottom:"110%", left:"50%", transform:"translateX(-50%)",
                      background:"#1e1c0e", border:`1px solid ${C.gold}55`, borderRadius:12,
                      padding:"12px 16px", zIndex:20, minWidth:170, maxWidth:250, boxShadow:"0 6px 24px #0009",
                    }}>
                      <div style={{ fontSize:14, color:C.gold, fontStyle:"italic", marginBottom:4, fontFamily:C.serif }}>{clean}</div>
                      <div style={{ fontSize:13, color:C.text, marginBottom:10, fontFamily:C.sans, lineHeight:1.5 }}><ES>{hasG}</ES></div>
                      <button onClick={()=>saveWord(clean)} style={{
                        background:savedFromHere[clean]?`${C.green}20`:`${C.gold}12`,
                        border:`1px solid ${savedFromHere[clean]?C.green:C.gold}55`,
                        borderRadius:7, padding:"5px 12px", cursor:"pointer",
                        color:savedFromHere[clean]?C.green:C.gold, fontSize:11, fontFamily:C.sans, fontWeight:700,
                      }}>
                        {savedFromHere[clean]?"✓ Guardada":"+ Guardar en SRS"}
                      </button>
                    </span>
                  )}
                </span>
              );
            })}
          </p>
        ))}
      </div>

      <div style={{ background:C.bg2, border:`1px solid ${C.border}`, borderRadius:14, padding:16 }}>
        <div style={{ fontSize:10, color:C.gold, letterSpacing:"0.22em", marginBottom:12, fontWeight:700, textTransform:"uppercase" }}>Glosario</div>
        <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
          {Object.entries(glossary).map(([it,es])=>(
            <div key={it} style={{ display:"flex", gap:10, alignItems:"center" }}>
              <SpeakBtn text={it} />
              <span style={{ fontSize:13, color:C.gold, fontStyle:"italic", minWidth:100, fontFamily:C.serif }}>{it}</span>
              <span style={{ fontSize:13, color:C.textMid, fontFamily:C.sans }}>→ {es}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


// ─── STORIE MODULE (v21) ────────────────────────────────────────────────────
function getStorieProgreso() {
  try { return JSON.parse(localStorage.getItem("it_storie_progreso") || "{}"); }
  catch { return {}; }
}
function setStorieProgreso(p) {
  try { localStorage.setItem("it_storie_progreso", JSON.stringify(p)); } catch {}
}

function StorieModule({ db, progresoMap, refreshProgreso }) {
  const [arcoSel, setArcoSel] = useState(null);
  const [capActual, setCapActual] = useState(null);
  const [tooltip, setTooltip] = useState(null);
  const [savedFromHere, setSavedFromHere] = useState({});
  const [progreso, setProgreso] = useState(getStorieProgreso);

  async function saveWord(wordIT) {
    const match = db.vocabulario.find(w => w.palabra_it?.toLowerCase() === wordIT.toLowerCase());
    if (!match) return;
    const prog = progresoMap[match.id];
    if (prog?.guardada) return;
    if (prog) {
      await api.update("progreso_usuario", prog.id, { guardada: true });
    } else {
      await api.create("progreso_usuario", {
        palabra_id: match.id, guardada: true,
        repeticiones: 0, intervalo_dias: 1, ease_factor: 2.5,
        proximo_repaso: new Date().toISOString().split("T")[0],
        ultima_calidad: null,
      });
    }
    await refreshProgreso();
    setSavedFromHere(p=>({...p,[wordIT]:true}));
    setTooltip(null);
  }

  function abrirArco(arco) {
    setArcoSel(arco);
    const guardado = progreso[arco.id];
    const startId = guardado?.capActual || arco.capitulos[0].id;
    const cap = arco.capitulos.find(c=>c.id===startId) || arco.capitulos[0];
    setCapActual(cap);
    setSavedFromHere({});
  }

  function elegirOpcion(opcion) {
    const arco = arcoSel;
    const nextCap = arco.capitulos.find(c=>c.id===opcion.next);
    const prev = progreso[arco.id] || { decisiones:[] };
    const updated = {
      ...progreso,
      [arco.id]: {
        capActual: nextCap.id,
        decisiones: [...prev.decisiones, { capitulo:capActual.id, elegida:opcion.texto }],
        completado: !!nextCap.final,
      }
    };
    setProgreso(updated);
    setStorieProgreso(updated);
    setCapActual(nextCap);
    setSavedFromHere({});
  }

  function avanzar() {
    const arco = arcoSel;
    const nextCap = arco.capitulos.find(c=>c.id===capActual.next);
    const prev = progreso[arco.id] || { decisiones:[] };
    const updated = {
      ...progreso,
      [arco.id]: { ...prev, capActual: nextCap.id, completado: !!nextCap.final }
    };
    setProgreso(updated);
    setStorieProgreso(updated);
    setCapActual(nextCap);
    setSavedFromHere({});
  }

  function reiniciarArco() {
    const arco = arcoSel;
    const updated = { ...progreso };
    delete updated[arco.id];
    setProgreso(updated);
    setStorieProgreso(updated);
    setCapActual(arco.capitulos[0]);
    setSavedFromHere({});
  }

  const nivelColors = { "A0":C.green, "A1":C.gold, "A2":C.blue, "B1":C.pink, "A1-A2":C.gold, "A2-B1":C.blue };

  // ── SELECTOR DE ARCOS ──
  if (!arcoSel) return (
    <div style={{ fontFamily:C.sans }} className="it-fade-in">
      <div style={{ background:"rgba(8,10,20,0.8)", border:`1px solid ${C.pink}22`, borderRadius:14, padding:18, marginBottom:18 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
          <MIcon name="auto_stories" fill={1} size={18} color={C.pink} />
          <span style={{ fontSize:11, color:C.pink, letterSpacing:"0.2em", fontWeight:700, textTransform:"uppercase" }}>Storie · Narrativa interattiva</span>
        </div>
        <p style={{ fontSize:13, color:C.textMid, lineHeight:1.7, margin:0 }}>
          Vive pequeñas historias de la vida cotidiana en italiano. Tus decisiones cambian cómo se desarrolla la trama.
        </p>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {STORIE_ARCOS.map(arco=>{
          const prog = progreso[arco.id];
          const capIdx = prog ? arco.capitulos.findIndex(c=>c.id===prog.capActual) : 0;
          const total = arco.capitulos.filter(c=>!c.id.match(/_\d+[ab]$/) || true).length; // approx total path
          const completado = prog?.completado;
          return (
            <div key={arco.id} onClick={()=>abrirArco(arco)} className="it-lesson-card" style={{ border:`1px solid ${C.border}`, borderRadius:14, padding:16, cursor:"pointer", display:"flex", gap:14, alignItems:"center", transition:"border-color 0.15s" }}>
              <div style={{ fontSize:34 }}>{arco.emoji}</div>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:5, flexWrap:"wrap" }}>
                  <div style={{ fontSize:15, color:C.text, fontFamily:C.serif }}>{arco.titulo}</div>
                  <Tag color={nivelColors[arco.nivel]||C.pink}>{arco.nivel}</Tag>
                  {completado && <Tag color={C.green}>✓ Completado</Tag>}
                </div>
                <div style={{ fontSize:12, color:C.textMid, marginBottom:4 }}>{arco.desc}</div>
                <div style={{ fontSize:11, color:C.hint }}>
                  {prog ? (completado ? "Historia completada — toca para volver a leer o explorar otra rama" : `En curso · capítulo ${capIdx+1}`) : `${arco.capitulos.length} capítulos · 2 decisiones`}
                </div>
              </div>
              <MIcon name="chevron_right" size={22} color={C.muted} />
            </div>
          );
        })}
      </div>
    </div>
  );

  // ── LECTOR DE CAPÍTULO ──
  let glossary = {};
  try { glossary = capActual.glosario_json ? JSON.parse(capActual.glosario_json) : {}; } catch {}
  const paragraphs = (capActual.texto||"").split("\n\n");

  return (
    <div onClick={()=>setTooltip(null)} style={{ fontFamily:C.sans }} className="it-fade-in">
      <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:16 }}>
        <button onClick={()=>setArcoSel(null)} style={{ background:"transparent", border:`1px solid ${C.border}`, borderRadius:8, padding:"7px 14px", cursor:"pointer", color:C.textMid, fontSize:12, fontFamily:C.sans, display:"flex", alignItems:"center", gap:5 }}>
          <MIcon name="arrow_back" size={16} color={C.muted} /> Volver
        </button>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:16, color:C.text, fontFamily:C.serif }}>{arcoSel.emoji} {arcoSel.titulo}</div>
          <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>Capítulo {capActual.num} · Toca palabras subrayadas para ver significado</div>
        </div>
        <Tag color={nivelColors[arcoSel.nivel]||C.pink}>{arcoSel.nivel}</Tag>
      </div>

      {Object.keys(savedFromHere).length > 0 && (
        <div style={{ background:"rgba(10,26,10,0.7)", border:`1px solid ${C.green}33`, borderRadius:10, padding:"9px 14px", marginBottom:14, fontSize:12, color:C.green, display:"flex", alignItems:"center", gap:8 }}>
          <MIcon name="star" fill={1} size={14} color={C.green} />
          {Object.keys(savedFromHere).length} palabra(s) guardadas en tu SRS
        </div>
      )}

      <div className="it-glass" style={{ borderRadius:14, padding:22, marginBottom:16, lineHeight:2, fontSize:15, fontFamily:C.serif }}>
        {paragraphs.map((para,pi)=>(
          <p key={pi} style={{ margin:pi>0?"16px 0 0":0, color:C.text }}>
            {para.split(/(\s+)/).map((token,ti)=>{
              const clean = token.replace(/[.,!?¡¿"«»\n;:'"()\-]/g,"").toLowerCase();
              const hasG = glossary[clean];
              if (!hasG) return <span key={ti}>{token}</span>;
              const active = tooltip===`${pi}-${ti}`;
              return (
                <span key={ti} style={{ position:"relative", display:"inline" }}>
                  <span onClick={e=>{ e.stopPropagation(); setTooltip(active?null:`${pi}-${ti}`); }}
                    style={{ borderBottom:`1px dotted ${C.pink}`, color:C.pink, cursor:"pointer" }}>
                    {token}
                  </span>
                  {active && (
                    <span onClick={e=>e.stopPropagation()} style={{
                      position:"absolute", bottom:"110%", left:"50%", transform:"translateX(-50%)",
                      background:"#1e0e16", border:`1px solid ${C.pink}55`, borderRadius:12,
                      padding:"12px 16px", zIndex:20, minWidth:170, maxWidth:250, boxShadow:"0 6px 24px #0009",
                    }}>
                      <div style={{ fontSize:14, color:C.pink, fontStyle:"italic", marginBottom:4, fontFamily:C.serif }}>{clean}</div>
                      <div style={{ fontSize:13, color:C.text, marginBottom:10, fontFamily:C.sans, lineHeight:1.5 }}><ES>{hasG}</ES></div>
                      <button onClick={()=>saveWord(clean)} style={{
                        background:savedFromHere[clean]?`${C.green}20`:`${C.pink}12`,
                        border:`1px solid ${savedFromHere[clean]?C.green:C.pink}55`,
                        borderRadius:7, padding:"5px 12px", cursor:"pointer",
                        color:savedFromHere[clean]?C.green:C.pink, fontSize:11, fontFamily:C.sans, fontWeight:700,
                      }}>
                        {savedFromHere[clean]?"✓ Guardada":"+ Guardar en SRS"}
                      </button>
                    </span>
                  )}
                </span>
              );
            })}
          </p>
        ))}
      </div>

      {/* Decisión */}
      {capActual.decision && (
        <div className="it-glass" style={{ borderRadius:14, padding:18, border:`1px solid ${C.pink}33` }}>
          <div style={{ fontSize:10, color:C.pink, letterSpacing:"0.2em", fontWeight:700, textTransform:"uppercase", marginBottom:10 }}>Decisione</div>
          <div style={{ fontSize:15, color:C.text, fontFamily:C.serif, marginBottom:14 }}>{capActual.decision.pregunta}</div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {capActual.decision.opciones.map((op,i)=>(
              <button key={i} onClick={()=>elegirOpcion(op)} style={{
                background:"transparent", border:`1px solid ${C.pink}44`, borderRadius:10,
                padding:"12px 14px", cursor:"pointer", color:C.text, fontSize:13, fontFamily:C.sans,
                textAlign:"left", lineHeight:1.5, transition:"border-color 0.15s, background 0.15s" }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=C.pink; e.currentTarget.style.background=`${C.pink}10`;}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=`${C.pink}44`; e.currentTarget.style.background="transparent";}}
              >
                <span style={{ color:C.pink, fontWeight:700, marginRight:6 }}>{["A","B"][i]}.</span> {op.texto}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Capítulo intermedio sin decisión — continuar */}
      {!capActual.decision && !capActual.final && (
        <button onClick={avanzar} style={{
          width:"100%", background:`${C.pink}14`, border:`1px solid ${C.pink}44`, borderRadius:10,
          padding:"13px", cursor:"pointer", color:C.pink, fontSize:13, fontWeight:700, fontFamily:C.sans,
          display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
          Continúa la historia <MIcon name="arrow_forward" size={16} color={C.pink} />
        </button>
      )}

      {/* Final del arco */}
      {capActual.final && (
        <div style={{ background:`${C.green}0d`, border:`1px solid ${C.green}33`, borderRadius:14, padding:18 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
            <MIcon name="flag" fill={1} size={18} color={C.green} />
            <span style={{ fontSize:11, color:C.green, letterSpacing:"0.2em", fontWeight:700, textTransform:"uppercase" }}>Fine dell'arco</span>
          </div>
          <p style={{ fontSize:13, color:C.textMid, lineHeight:1.7, margin:"0 0 14px" }}>{capActual.resumen}</p>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            <button onClick={()=>setArcoSel(null)} style={{
              flex:1, background:`${C.gold}14`, border:`1px solid ${C.gold}44`, borderRadius:10,
              padding:"11px", cursor:"pointer", color:C.gold, fontSize:13, fontWeight:700, fontFamily:C.sans }}>
              Otras historias
            </button>
            <button onClick={reiniciarArco} style={{
              flex:1, background:"transparent", border:`1px solid ${C.border}`, borderRadius:10,
              padding:"11px", cursor:"pointer", color:C.textMid, fontSize:13, fontFamily:C.sans,
              display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
              <MIcon name="refresh" size={15} color={C.muted} /> Explorar otra rama
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatsModule({ db, progresoMap }) {
  const prog = Object.values(progresoMap);
  const saved = prog.filter(p => p.guardada);
  const totalVocab = db.vocabulario.length;
  const savedCount = saved.length;
  const learnedCount = saved.filter(p => p.repeticiones >= 3).length;
  const masteredCount = saved.filter(p => p.repeticiones >= 6).length;
  const dueCount = saved.filter(p => isDue(p.proximo_repaso)).length;
  const pctSaved = totalVocab > 0 ? Math.round((savedCount / totalVocab) * 100) : 0;
  const pctLearned = savedCount > 0 ? Math.round((learnedCount / savedCount) * 100) : 0;

  const weekMap = {};
  for (let w = 1; w <= 30; w++) weekMap[w] = { total: 0, saved: 0 };
  db.vocabulario.forEach(v => {
    if (v.semana && weekMap[v.semana]) {
      weekMap[v.semana].total++;
      if (progresoMap[v.id]?.guardada) weekMap[v.semana].saved++;
    }
  });
  const weekData = Object.entries(weekMap).map(([w, d]) => ({ week: Number(w), ...d }));

  const intervals = saved.map(p => p.intervalo_dias || 1);
  const buckets = [
    { label: "1-2d", min: 1, max: 2 },
    { label: "3-7d", min: 3, max: 7 },
    { label: "1-2sem", min: 8, max: 14 },
    { label: "2-4sem", min: 15, max: 28 },
    { label: "+4sem", min: 29, max: 999 },
  ];
  const bucketCounts = buckets.map(b => ({
    ...b, count: intervals.filter(i => i >= b.min && i <= b.max).length,
  }));
  const maxBucket = Math.max(...bucketCounts.map(b => b.count), 1);

  const qualities = saved.filter(p => p.ultima_calidad).map(p => p.ultima_calidad);
  const avgQuality = qualities.length > 0 ? (qualities.reduce((a, b) => a + b, 0) / qualities.length).toFixed(1) : null;
  const qualityLabel = avgQuality ? (avgQuality >= 4.5 ? "Excellent" : avgQuality >= 3.5 ? "Good" : avgQuality >= 2.5 ? "Regular" : "Needs work") : "Sin datos";
  const qualityColor = avgQuality ? (avgQuality >= 4.5 ? C.gold : avgQuality >= 3.5 ? C.green : avgQuality >= 2.5 ? "#d0902a" : C.pink) : C.hint;

  const levelOrder = { A0: 0, A1: 1, A2: 2, B1: 3 };
  const highestLevel = saved.length > 0
    ? [...saved].map(p => { const word = db.vocabulario.find(v => v.id === p.palabra_id); return word?.nivel || "A0"; })
        .reduce((best, lvl) => levelOrder[lvl] > levelOrder[best] ? lvl : best, "A0")
    : "A0";

  const currentWeek = weekData.reduce((best, w) => w.saved > best.saved ? w : best, weekData[0])?.week || 1;
  const semanaPlan = db.semanales.find(s => s.semana_num === currentWeek);

  const reviewedDates = saved
    .filter(p => p.proximo_repaso)
    .map(p => {
      const d = new Date(p.proximo_repaso);
      d.setDate(d.getDate() - (p.intervalo_dias || 1));
      return d.toISOString().split("T")[0];
    });
  const uniqueDates = [...new Set(reviewedDates)].sort();
  let streak = 0;
  if (uniqueDates.length > 0) {
    const today = new Date().toISOString().split("T")[0];
    let check = new Date(today);
    for (let i = 0; i < 365; i++) {
      const ds = check.toISOString().split("T")[0];
      if (uniqueDates.includes(ds)) { streak++; check.setDate(check.getDate() - 1); }
      else break;
    }
  }

  const levelDist = { A0: 0, A1: 0, A2: 0, B1: 0 };
  saved.forEach(p => {
    const word = db.vocabulario.find(v => v.id === p.palabra_id);
    if (word?.nivel && levelDist[word.nivel] !== undefined) levelDist[word.nivel]++;
  });

  const StatCard = ({ icon, value, label, color=C.gold, sub }) => (
    <div className="it-roman-border" style={{ background:C.bg3, borderRadius:12, padding:"14px 8px", textAlign:"center", flex:1 }}>
      <div style={{ fontSize:20 }}>{icon}</div>
      <div style={{ fontSize:22, color, fontWeight:700, margin:"4px 0 2px", fontFamily:C.serif }}>{value}</div>
      <div style={{ fontSize:9, color:C.muted, lineHeight:1.3, textTransform:"uppercase", letterSpacing:0.5 }}>{label}</div>
      {sub && <div style={{ fontSize:10, color, marginTop:3 }}>{sub}</div>}
    </div>
  );

  const ProgressBar = ({ value, max, color=C.gold, label, sub }) => {
    const pct = max > 0 ? Math.round((value/max)*100) : 0;
    return (
      <div style={{ marginBottom:12 }}>
        <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:C.muted, marginBottom:5 }}>
          <span style={{ fontWeight:600, color:C.textMid }}>{label}</span>
          <span style={{color}}>{value}/{max} <span style={{color:C.hint, fontWeight:400}}>({pct}%)</span></span>
        </div>
        <div style={{ height:3, background:C.bg4, borderRadius:2, overflow:"hidden" }}>
          <div style={{ height:"100%", width:`${pct}%`, background:color, borderRadius:2, transition:"width 0.6s ease", boxShadow:`0 0 6px ${color}66` }} />
        </div>
        {sub && <div style={{ fontSize:10, color:C.hint, marginTop:3 }}>{sub}</div>}
      </div>
    );
  };

  const faseColors = { Fondamenta:C.gold, "Vita Quotidiana":C.green, Connessione:C.blue, Immersione:C.pink };

  const nivelTest = localStorage.getItem("it_nivel_detectado");
  const nivelScore = localStorage.getItem("it_nivel_score");
  const [retestVisible, setRetestVisible] = useState(false);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      {retestVisible && <NivelTest onDone={(n)=>{ setRetestVisible(false); }} />}
      <div className="it-glass" style={{ borderRadius:14, padding:18, background:"linear-gradient(135deg,rgba(20,20,9,0.85),rgba(13,13,26,0.9))" }}>
        <div style={{ fontSize:9, color:C.gold, letterSpacing:"0.3em", marginBottom:6, fontWeight:700, textTransform:"uppercase" }}>Tu Progreso · Progetto Italiano</div>
        <div style={{ display:"flex", gap:10, alignItems:"center" }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:16, color:C.text, marginBottom:4 }}>
              Nivel actual: <span style={{ color:C.gold, fontWeight:700 }}>{highestLevel}</span>
              {semanaPlan && <span style={{ fontSize:12, color:C.muted }}> · {semanaPlan.fase}</span>}
            </div>
            <div style={{ fontSize:12, color:C.muted }}>
              Semana activa: <span style={{color:C.text}}>{currentWeek}</span>
              {semanaPlan && <span style={{color:C.hint}}> — {semanaPlan.titulo?.split("–")[1]?.trim()}</span>}
            </div>
            {nivelTest && (
              <div style={{ marginTop:6, display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                <span style={{ fontSize:10, color:C.muted }}>Test diagnóstico:</span>
                <span style={{ fontSize:10, color:C.blue, background:C.blue+"18", border:`1px solid ${C.blue}44`, borderRadius:20, padding:"2px 8px", fontWeight:700, letterSpacing:1 }}>{nivelTest}</span>
                {nivelScore && <span style={{ fontSize:10, color:C.hint }}>{nivelScore}/10 correctas</span>}
                <button onClick={()=>setRetestVisible(true)} style={{ fontSize:10, color:C.muted, background:"transparent", border:"none", cursor:"pointer", textDecoration:"underline", fontFamily:C.sans, padding:0 }}>repetir test</button>
              </div>
            )}
          </div>
          <div style={{ background:C.gold+"22", border:`1px solid ${C.gold}44`, borderRadius:12, padding:"10px 14px", textAlign:"center", fontSize:28 }}>
            {highestLevel==="B1"?"🏆":highestLevel==="A2"?"🌟":highestLevel==="A1"?"📈":"🌱"}
          </div>
        </div>
      </div>

      <div style={{ display:"flex", gap:8 }}>
        <StatCard icon="🔥" value={streak>0?streak:"—"} label="dias racha" color={streak>=7?C.gold:streak>=3?"#d0902a":C.muted} sub={streak>=7?"Excelente!":streak>=3?"Sigue asi":streak===1?"Hoy":""} />
        <StatCard icon="📚" value={savedCount} label="guardadas" color={C.gold} sub={`${pctSaved}% del total`} />
        <StatCard icon="🧠" value={learnedCount} label="aprendidas" color={C.green} sub={`${pctLearned}% mazo`} />
        <StatCard icon="⭐" value={masteredCount} label="dominadas" color={C.blue} />
      </div>

      <div style={{ background:C.bg2, border:`1px solid ${C.border}`, borderRadius:14, padding:18 }}>
        <div style={{ fontSize:11, color:C.gold, letterSpacing:"0.14em", marginBottom:14 }}>PROGRESO GENERAL</div>
        <ProgressBar value={savedCount} max={totalVocab} color={C.gold} label="Vocabulario guardado" sub="Palabras en tu mazo SRS" />
        <ProgressBar value={learnedCount} max={savedCount||1} color={C.green} label="Aprendidas (3+ repasos)" sub="Consolidadas en memoria media" />
        <ProgressBar value={masteredCount} max={savedCount||1} color={C.blue} label="Dominadas (6+ repasos)" sub="En memoria a largo plazo" />
        <ProgressBar value={totalVocab-dueCount} max={totalVocab} color="#9a70c8" label="Al dia en repasos" sub={dueCount>0?`${dueCount} tarjetas pendientes`:"Al dia! Perfetto!"} />
      </div>

      <div style={{ background:C.bg2, border:`1px solid ${C.border}`, borderRadius:14, padding:18 }}>
        <div style={{ fontSize:11, color:C.gold, letterSpacing:"0.14em", marginBottom:14 }}>CALIDAD SRS · SM-2</div>
        <div style={{ display:"flex", gap:10, marginBottom:14 }}>
          <div style={{ flex:1, background:C.bg3, borderRadius:10, padding:14, textAlign:"center" }}>
            <div style={{ fontSize:28, color:qualityColor, fontWeight:700 }}>{avgQuality||"—"}</div>
            <div style={{ fontSize:11, color:C.hint, marginTop:2 }}>calidad promedio</div>
            <div style={{ fontSize:12, color:qualityColor, marginTop:4 }}>{qualityLabel}</div>
          </div>
          <div style={{ flex:2, display:"flex", flexDirection:"column", gap:6 }}>
            <div style={{ fontSize:11, color:C.muted, marginBottom:2 }}>Intervalos SRS</div>
            {bucketCounts.map(b => (
              <div key={b.label} style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:11, color:C.hint, minWidth:42 }}>{b.label}</span>
                <div style={{ flex:1, height:8, background:C.bg3, borderRadius:4, overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${(b.count/maxBucket)*100}%`, background:C.gold, borderRadius:4 }} />
                </div>
                <span style={{ fontSize:11, color:C.gold, minWidth:18, textAlign:"right" }}>{b.count}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background:"#080e14", border:`1px solid ${C.blue}22`, borderRadius:10, padding:12 }}>
          <div style={{ fontSize:11, color:C.blue, letterSpacing:1, marginBottom:4 }}>Como leer esto</div>
          <div style={{ fontSize:12, color:"#7a8aab", lineHeight:1.6 }}>Intervalos mas largos = mayor consolidacion. Apunta a tener la mayoria en "2-4sem" o "+4sem".</div>
        </div>
      </div>

      <div style={{ background:C.bg2, border:`1px solid ${C.border}`, borderRadius:14, padding:18 }}>
        <div style={{ fontSize:11, color:C.gold, letterSpacing:"0.14em", marginBottom:14 }}>VOCAB POR NIVEL (guardado)</div>
        <div style={{ display:"flex", gap:8 }}>
          {[["A0",C.hint],["A1",C.green],["A2",C.blue],["B1",C.gold]].map(([lvl,clr]) => {
            const total = db.vocabulario.filter(v=>v.nivel===lvl).length;
            const sv = levelDist[lvl]||0;
            const pct = total>0?Math.round((sv/total)*100):0;
            return (
              <div key={lvl} style={{ flex:1, background:C.bg3, border:`1px solid ${clr}33`, borderRadius:10, padding:"12px 8px", textAlign:"center" }}>
                <div style={{ fontSize:16, color:clr, fontWeight:700 }}>{lvl}</div>
                <div style={{ fontSize:20, color:clr, fontWeight:700, margin:"4px 0" }}>{sv}</div>
                <div style={{ fontSize:10, color:C.hint }}>de {total}</div>
                <div style={{ height:3, background:C.bg3, borderRadius:2, margin:"8px 0 4px" }}>
                  <div style={{ height:"100%", width:`${pct}%`, background:clr, borderRadius:2 }} />
                </div>
                <div style={{ fontSize:10, color:clr }}>{pct}%</div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ background:C.bg2, border:`1px solid ${C.border}`, borderRadius:14, padding:18 }}>
        <div style={{ fontSize:11, color:C.gold, letterSpacing:"0.14em", marginBottom:12 }}>COBERTURA POR SEMANA</div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginBottom:10 }}>
          {weekData.map(w => {
            const pct = w.total>0 ? w.saved/w.total : 0;
            const splan = db.semanales.find(s=>s.semana_num===w.week);
            const fc = splan ? (faseColors[splan.fase]||C.gold) : C.gold;
            const hexAlpha = Math.round(pct*200+30).toString(16).padStart(2,"0");
            return (
              <div key={w.week} title={`S${w.week}: ${w.saved}/${w.total}`}
                style={{ width:28, height:28, background:pct>0?fc+hexAlpha:"#1a1a1a", border:`1px solid ${pct>0?fc+"66":C.border}`, borderRadius:6, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, color:pct>0.6?"#000":C.hint, fontWeight:700 }}>
                {w.week}
              </div>
            );
          })}
        </div>
        <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
          {[["Fondamenta","#C8A96E","1-4"],["Vita Quotidiana","#6dbf7a","5-12"],["Connessione","#6baed6","13-22"],["Immersione","#d47cb3","23-30"]].map(([fase,color,rng]) => (
            <div key={fase} style={{ display:"flex", alignItems:"center", gap:5 }}>
              <div style={{ width:10, height:10, background:color, borderRadius:3 }} />
              <span style={{ fontSize:10, color:C.hint }}>{fase} ({rng})</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background:savedCount===0?"#0a0a1a":"linear-gradient(135deg,#1a1208,#081a08)", border:`1px solid ${savedCount===0?C.blue:C.green}33`, borderRadius:14, padding:18 }}>
        {savedCount===0 ? (
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:32, marginBottom:8 }}>🚀</div>
            <div style={{ fontSize:14, color:C.text, marginBottom:6 }}>Empieza hoy!</div>
            <div style={{ fontSize:12, color:C.muted, lineHeight:1.6 }}>Guarda tus primeras palabras en Vocab para ver tus estadisticas aqui.</div>
          </div>
        ) : (
          <>
            <div style={{ fontSize:11, color:C.green, letterSpacing:"0.14em", marginBottom:10 }}>ANALISIS PERSONALIZADO</div>
            <div style={{ fontSize:13, color:C.muted, lineHeight:2 }}>
              {savedCount>=100 && <div>✅ <span style={{color:C.text}}>+100 palabras</span> — ya puedes sobrevivir en Italia.</div>}
              {learnedCount>=50 && <div>✅ <span style={{color:C.text}}>+50 palabras consolidadas</span> — memoria a largo plazo activa.</div>}
              {dueCount>10 && <div>⚠️ <span style={{color:C.gold}}>{dueCount} repasos pendientes</span> — dedica 10 min al SRS hoy.</div>}
              {dueCount===0&&savedCount>0 && <div>🎉 <span style={{color:C.green}}>Al dia en todos los repasos!</span></div>}
              {avgQuality&&avgQuality<3 && <div>💡 <span style={{color:C.pink}}>Calidad baja ({avgQuality})</span> — reduce el mazo y repasa los dificiles.</div>}
              {streak>=7 && <div>🔥 <span style={{color:C.gold}}>{streak} dias seguidos!</span> La consistencia es tu superpoder.</div>}
              {masteredCount>0 && <div>⭐ <span style={{color:C.blue}}>{masteredCount} dominadas</span> — en memoria a largo plazo.</div>}
              {savedCount<20 && <div>💡 Guarda al menos <span style={{color:C.gold}}>20 palabras</span> para desbloquear Quiz y SRS completo.</div>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── SPEAKING MODULE ────────────────────────────────────────────────────────
// ─── ESCENARIOS DE CONVERSACIÓN ────────────────────────────────────────────
const ESCENARIOS = [
  {
    id:"libre", emoji:"💬", label:"Libre",
    desc:"Conversación abierta sobre cualquier tema",
    nivel:"A0+", color:C.gold,
    system:`Sei un tutor di italiano per ispanofoni di livello A0-B1. Obiettivo: aiutare l'utente a parlare liberamente.
REGOLE:
1. Rispondi SEMPRE in italiano (testo principale)
2. Aggiungi: "ES: [traduzione spagnola della tua risposta]"
3. Se ci sono errori: "💡 Correzione: [frase corretta] — [spiegazione breve in spagnolo]"
4. Tono amichevole, incoraggiante. Adatta complessità al livello dell'utente.
5. Fai UNA domanda finale per continuare la conversazione.
6. Massimo 4-5 frasi in italiano.`,
    intro:"Ciao! Sono il tuo assistente italiano. Parliamo di qualsiasi argomento tu voglia — lavoro, viaggi, cultura... Come stai oggi? 🇮🇹",
  },
  {
    id:"ristorante", emoji:"🍝", label:"Ristorante",
    desc:"Pide, pregunta por el menú, paga la cuenta",
    nivel:"A0", color:"#e07840",
    system:`Sei il cameriere di un ristorante italiano tipico a Firenze chiamato "Da Beppe". L'utente è un cliente ispanofono che sta imparando l'italiano.
CONTESTO: Ristorante con pasta fresca, secondi di carne e pesce, vino della casa.
REGOLE:
1. Gioca il ruolo del cameriere in italiano. Sii cordiale e professionale.
2. Dopo ogni tuo intervento aggiungi: "ES: [traduzione spagnola]"
3. Se l'utente fa errori: "💡 Correzione: [frase corretta] — [spiegazione in spagnolo]"
4. Proponi piatti, chiedi preferenze, gestisci l'ordine completo.
5. Usa frasi tipiche: "Cosa prende?", "Ha prenotato?", "Vuole il coperto?", etc.
6. Massimo 3-4 frasi per risposta.`,
    intro:"Buonasera! Benvenuto da Beppe. Ha la prenotazione? Le do subito il menù. Vuole dell'acqua mentre aspetta?",
  },
  {
    id:"lavoro", emoji:"💼", label:"Colloquio",
    desc:"Entrevista de trabajo con un recruiter italiano",
    nivel:"A1", color:C.blue,
    system:`Sei un recruiter italiano di una media azienda a Milano che intervista un candidato ispanofono.
REGOLE:
1. Fai domande classiche del colloquio: "Parlami di te", "Punti di forza", "Aspettative salariali?", etc.
2. Dopo ogni turno: "ES: [traduzione spagnola]"
3. Correggi errori: "💡 Correzione: [frase corretta] — [spiegazione]"
4. Valuta positivamente con feedback costruttivo. Una domanda alla volta.`,
    intro:"Buongiorno! Si accomodi. Ho letto il suo curriculum con interesse. Come mai è interessato a lavorare in Italia?",
  },
  {
    id:"casa", emoji:"🏠", label:"Cercare Casa",
    desc:"Habla con el agente inmobiliario en Florencia",
    nivel:"A1", color:C.green,
    system:`Sei un agente immobiliare italiano che mostra appartamenti in affitto a Firenze.
CONTESTO: Appartamenti da 600€ a 1.200€/mese. Zone: Centro storico, Oltrarno, Campo di Marte.
REGOLE:
1. Descrivi appartamenti, zona, prezzo, servizi inclusi.
2. Dopo ogni risposta: "ES: [traduzione spagnola]"
3. Correggi errori: "💡 Correzione: [frase corretta] — [spiegazione]"
4. Fai domande: "Quante camere cerca?", "Ha animali?", "Per quanto tempo?", etc.`,
    intro:"Buongiorno! Sono Marco dell'agenzia Toscana Casa. Ho diversi appartamenti disponibili. Che zona preferisce e qual è il suo budget mensile?",
  },
  {
    id:"medico", emoji:"🏥", label:"Dal Medico",
    desc:"Visita médica: describe síntomas, entiende el diagnóstico",
    nivel:"A1", color:C.pink,
    system:`Sei un medico di base italiano che visita un paziente straniero ispanofono in Italia.
REGOLE:
1. Fai domande tipiche: "Dove le fa male?", "Da quando?", "Ha febbre?", "Ha allergie?", etc.
2. Dopo ogni risposta: "ES: [traduzione spagnola]"
3. Correggi errori: "💡 Correzione: [frase corretta] — [spiegazione]"
4. Usa il registro formale (Lei). Sii professionale ma rassicurante.`,
    intro:"Buongiorno. Si accomodi. Sono il dottor Rossi. Come si sente oggi? Mi dica pure, cosa l'ha portata qui?",
  },
  {
    id:"treno", emoji:"🚂", label:"In Treno",
    desc:"Compra billete, encuentra tu asiento, conversa",
    nivel:"A0", color:"#9b7fe8",
    system:`Gestisci DUE ruoli: prima sei il bigliettaio alla stazione, poi un passeggero sul treno.
CONTESTO: Stazione Termini di Roma. Treno per Firenze, binario 7, ore 10:15.
REGOLE:
1. Come bigliettaio: vendi biglietti, dai info su orari e binari.
2. Come passeggero: chiacchiera del viaggio, di dove viene, cosa visita.
3. Dopo ogni risposta: "ES: [traduzione spagnola]"
4. Correggi errori: "💡 Correzione: [frase corretta] — [spiegazione]"
5. Indica il ruolo: (Bigliettaio) / (Passeggero).`,
    intro:"(Bigliettaio) Buongiorno! Prego, mi dica. Dove desidera andare?",
  },
  {
    id:"burocrazia", emoji:"📋", label:"Burocrazia",
    desc:"Comune, questura, documentos: sobrevive los trámites",
    nivel:"A2", color:"#c0904a",
    system:`Sei un impiegato dello Sportello Stranieri del Comune di Firenze.
CONTESTO: Servizi: residenza, codice fiscale, permesso di soggiorno, certificati vari.
REGOLE:
1. Gestisci pratiche burocratiche: chiedi documenti, spiega procedure.
2. Usa linguaggio burocratico: "Ha il documento in originale?", "Deve compilare questo modulo", etc.
3. Dopo ogni risposta: "ES: [traduzione spagnola]"
4. Correggi errori: "💡 Correzione: [frase corretta] — [spiegazione]"
5. Sii formale ma paziente.`,
    intro:"Buongiorno. Sportello stranieri, si accomodi. Che pratica deve fare oggi? Ha un appuntamento?",
  },
  {
    id:"amici", emoji:"☕", label:"Con Amici",
    desc:"Café informal con amigos italianos: planes, vida cotidiana",
    nivel:"A1", color:"#6dbf8a",
    system:`Sei Giulia, una ragazza italiana di 28 anni di Firenze, amica dell'utente. Siete al bar.
REGOLE:
1. Parla in italiano colloquiale: "dai!", "sai com'è", "figurati", contrazioni naturali.
2. Dopo ogni risposta: "ES: [traduzione spagnola]"
3. Correggi errori amichevolmente: "💡 Si dice meglio: [frase] — [spiegazione]"
4. Sii spontanea, curiosa, usa l'umorismo. Fai domande personali.
5. Massimo 3-4 frasi.`,
    intro:"Ciao! Finalmente! È un sacco che non ci vediamo. Come va? Hai sentito di Marco e Chiara? Roba da matti! Cosa hai fatto questo weekend?",
  },
  {
    id:"viaggio", emoji:"✈️", label:"Pianificare Viaggio",
    desc:"Organiza tu itinerario por Italia con experto local",
    nivel:"A1", color:"#4ab0d4",
    system:`Sei una guida turistica italiana esperta in viaggi per ispanofoni.
REGOLE:
1. Consiglia itinerari, ristoranti, musei. Dai insider tips.
2. Usa vocabolario turistico: "vale la pena", "imperdibile", "fuori dai percorsi turistici".
3. Dopo ogni risposta: "ES: [traduzione spagnola]"
4. Correggi errori: "💡 Correzione: [frase corretta] — [spiegazione]"
5. Personalizza con domande: "Preferisce arte o natura?", "Quanti giorni ha?", etc.`,
    intro:"Benvenuto! Dove vuoi andare in Italia? Dimmi quanti giorni hai e che tipo di viaggiatore sei — arte, cibo, avventura, relax?",
  },
  {
    id:"debate", emoji:"🗣️", label:"Dibattito",
    desc:"Debate sobre temas italianos y europeos nivel B1",
    nivel:"B1", color:"#d47cb3",
    system:`Sei un intellettuale italiano appassionato di politica, cultura e società.
TEMI: immigrazione, futuro Europa, cucina, calcio, Nord vs Sud Italia, tecnologia e lavoro.
REGOLE:
1. Esprimi opinioni con connettivi: "tuttavia", "nonostante", "d'altra parte", "a mio avviso".
2. Dopo ogni risposta: "ES: [traduzione spagnola]"
3. Correggi errori: "💡 Correzione: [frase corretta] — [spiegazione]"
4. Sfida gentilmente le opinioni per stimolare la discussione.
5. Usa strutture B1: congiuntivo, condizionale quando appropriato.`,
    intro:"Ciao! Su cosa vuoi discutere oggi? Politica italiana, cultura, sport, economia europea... Difendi la tua posizione — non mi arrendo facilmente!",
  },
];

// ─── SPEAKING: HISTORIAL HELPERS ────────────────────────────────────────────
async function saveConversacion(escenario, messages, summary) {
  const userMsgs = messages.filter(m => m.role === "user");
  if (userMsgs.length === 0) return null;
  try {
    return await api.create("conversaciones_speaking", {
      escenario_id: escenario.id,
      escenario_label: escenario.label,
      escenario_emoji: escenario.emoji,
      escenario_nivel: escenario.nivel,
      mensajes_json: JSON.stringify(messages),
      resumen_json: JSON.stringify(summary),
      total_intercambios: userMsgs.length,
      fecha: new Date().toISOString(),
    });
  } catch(e) {
    console.error("Error guardando conversación:", e);
    return null;
  }
}

async function generateSummary(escenario, messages) {
  const transcript = messages
    .filter(m => m.role !== "system")
    .map(m => `${m.role === "user" ? "Alumno" : "Tutor"}: ${m.content}`)
    .join("\n\n");

  const prompt = `Analiza esta conversación de práctica de italiano y extrae un resumen de aprendizaje en JSON.

ESCENARIO: ${escenario.label} (${escenario.nivel})
TRANSCRIPCIÓN:
${transcript}

Responde SOLO con un objeto JSON válido, sin markdown ni texto extra:
{
  "frases_nuevas": ["frase italiana aprendida o usada bien 1", "frase 2", ...],
  "errores": [{"error": "lo que dijo el alumno", "correcto": "forma correcta", "explicacion": "por qué"}],
  "temas_cubiertos": ["tema 1", "tema 2"],
  "nivel_evaluacion": "A0|A1|A2|B1",
  "puntos_fuertes": "texto breve en español sobre lo que hizo bien",
  "para_mejorar": "texto breve en español sobre qué practicar más",
  "palabras_clave": ["parola1", "parola2", "parola3"]
}`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const data = await res.json();
    const text = data.content?.[0]?.text || "{}";
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch(e) {
    return { frases_nuevas:[], errores:[], temas_cubiertos:[], puntos_fuertes:"", para_mejorar:"", palabras_clave:[] };
  }
}

// ─── HISTORIAL PANEL ────────────────────────────────────────────────────────
function HistorialPanel({ onClose }) {
  const [sesiones, setSesiones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandida, setExpandida] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.list("conversaciones_speaking", { order:"fecha.desc", limit:50 });
        setSesiones(data);
      } catch(e) { setSesiones([]); }
      setLoading(false);
    })();
  }, []);

  function formatFecha(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString("es-CO", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" });
  }

  if (loading) return (
    <div style={{ display:"flex", flexDirection:"column", gap:16, fontFamily:C.sans }} className="it-fade-in">
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
        <button onClick={onClose} style={{ background:"transparent", border:"none", cursor:"pointer", color:C.muted, padding:0, display:"flex" }}>
          <MIcon name="arrow_back" size={20} color={C.muted} />
        </button>
        <div style={{ fontSize:9, color:C.gold, letterSpacing:"0.3em", fontWeight:700, textTransform:"uppercase" }}>Historial de Conversaciones</div>
      </div>
      <div style={{ display:"flex", justifyContent:"center", padding:"40px 0" }}><Loader /></div>
    </div>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14, fontFamily:C.sans }} className="it-fade-in">
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <button onClick={onClose} style={{ background:"transparent", border:"none", cursor:"pointer", color:C.muted, padding:0, display:"flex", alignItems:"center" }}>
          <MIcon name="arrow_back" size={20} color={C.muted} />
        </button>
        <div>
          <div style={{ fontSize:9, color:C.gold, letterSpacing:"0.3em", fontWeight:700, textTransform:"uppercase" }}>Historial · {sesiones.length} sesión{sesiones.length!==1?"es":""}</div>
          <div style={{ fontSize:16, color:C.text, fontFamily:C.serif }}>Conversaciones guardadas</div>
        </div>
      </div>

      {sesiones.length === 0 ? (
        <div style={{ textAlign:"center", padding:"48px 0", color:C.muted }}>
          <div style={{ fontSize:32, marginBottom:12 }}>📭</div>
          <div style={{ fontSize:14, color:C.textMid, marginBottom:6 }}>Sin conversaciones guardadas</div>
          <div style={{ fontSize:12 }}>Completa una sesión de Habla y se guardará automáticamente.</div>
        </div>
      ) : sesiones.map(s => {
        const resumen = (() => { try { return typeof s.resumen_json === "string" ? JSON.parse(s.resumen_json) : s.resumen_json; } catch { return {}; } })();
        const isOpen = expandida === s.id;
        const errCount = resumen.errores?.length || 0;
        const frasesCount = resumen.frases_nuevas?.length || 0;

        return (
          <div key={s.id} className="it-roman-border" style={{ background:C.bg2, borderRadius:14, overflow:"hidden" }}>
            {/* Cabecera de sesión */}
            <button onClick={()=>setExpandida(isOpen ? null : s.id)} style={{
              width:"100%", background:"transparent", border:"none", cursor:"pointer",
              padding:"14px 16px", display:"flex", gap:12, alignItems:"flex-start", textAlign:"left",
            }}>
              <div style={{ fontSize:26, flexShrink:0, lineHeight:1 }}>{s.escenario_emoji}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:"flex", gap:7, alignItems:"center", marginBottom:3, flexWrap:"wrap" }}>
                  <span style={{ fontSize:14, color:C.text, fontFamily:C.serif }}>{s.escenario_label}</span>
                  <span style={{ fontSize:9, color:C.blue, background:C.blue+"18", border:`1px solid ${C.blue}33`, borderRadius:20, padding:"2px 7px", fontWeight:700, letterSpacing:1, textTransform:"uppercase" }}>{s.escenario_nivel}</span>
                  <span style={{ fontSize:10, color:C.muted }}>{s.total_intercambios} intercambios</span>
                </div>
                <div style={{ fontSize:11, color:C.hint }}>{formatFecha(s.fecha)}</div>
                {!isOpen && (
                  <div style={{ display:"flex", gap:10, marginTop:5, flexWrap:"wrap" }}>
                    {frasesCount > 0 && <span style={{ fontSize:10, color:C.green }}>✨ {frasesCount} frases nuevas</span>}
                    {errCount > 0 && <span style={{ fontSize:10, color:C.pink }}>💡 {errCount} corrección{errCount!==1?"es":""}</span>}
                    {resumen.nivel_evaluacion && <span style={{ fontSize:10, color:C.gold }}>📊 {resumen.nivel_evaluacion}</span>}
                  </div>
                )}
              </div>
              <MIcon name={isOpen ? "expand_less" : "expand_more"} size={18} color={C.hint} />
            </button>

            {/* Detalle expandido */}
            {isOpen && (
              <div style={{ padding:"0 16px 16px", display:"flex", flexDirection:"column", gap:12 }} className="it-fade-in">
                <div style={{ height:1, background:C.border }} />

                {/* Evaluación general */}
                {(resumen.puntos_fuertes || resumen.para_mejorar) && (
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {resumen.puntos_fuertes && (
                      <div style={{ background:C.green+"0d", border:`1px solid ${C.green}33`, borderRadius:10, padding:"10px 14px" }}>
                        <div style={{ fontSize:10, color:C.green, fontWeight:700, marginBottom:4, textTransform:"uppercase", letterSpacing:0.5 }}>✅ Puntos fuertes</div>
                        <div style={{ fontSize:12, color:C.textMid, lineHeight:1.6 }}>{resumen.puntos_fuertes}</div>
                      </div>
                    )}
                    {resumen.para_mejorar && (
                      <div style={{ background:C.gold+"0d", border:`1px solid ${C.gold}33`, borderRadius:10, padding:"10px 14px" }}>
                        <div style={{ fontSize:10, color:C.gold, fontWeight:700, marginBottom:4, textTransform:"uppercase", letterSpacing:0.5 }}>🎯 Para mejorar</div>
                        <div style={{ fontSize:12, color:C.textMid, lineHeight:1.6 }}>{resumen.para_mejorar}</div>
                      </div>
                    )}
                  </div>
                )}

                {/* Frases nuevas */}
                {resumen.frases_nuevas?.length > 0 && (
                  <div>
                    <div style={{ fontSize:10, color:C.green, fontWeight:700, marginBottom:7, textTransform:"uppercase", letterSpacing:0.5 }}>✨ Frases aprendidas</div>
                    <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                      {resumen.frases_nuevas.map((f,i) => (
                        <div key={i} style={{ display:"flex", alignItems:"center", gap:8, background:C.bg3, borderRadius:8, padding:"7px 12px" }}>
                          <SpeakBtn text={f} color={C.green} />
                          <span style={{ fontSize:13, color:C.text, fontFamily:C.serif, flex:1 }}>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Errores y correcciones */}
                {resumen.errores?.length > 0 && (
                  <div>
                    <div style={{ fontSize:10, color:C.pink, fontWeight:700, marginBottom:7, textTransform:"uppercase", letterSpacing:0.5 }}>💡 Correcciones</div>
                    <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                      {resumen.errores.map((e,i) => (
                        <div key={i} style={{ background:`${C.pink}08`, border:`1px solid ${C.pink}22`, borderRadius:10, padding:"10px 14px" }}>
                          <div style={{ display:"flex", gap:6, alignItems:"baseline", flexWrap:"wrap", marginBottom:4 }}>
                            <span style={{ fontSize:12, color:C.pink, textDecoration:"line-through" }}>{e.error}</span>
                            <span style={{ fontSize:10, color:C.hint }}>→</span>
                            <span style={{ fontSize:12, color:C.green, fontWeight:600 }}>{e.correcto}</span>
                          </div>
                          {e.explicacion && <div style={{ fontSize:11, color:C.muted, lineHeight:1.5 }}>{e.explicacion}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Palabras clave */}
                {resumen.palabras_clave?.length > 0 && (
                  <div>
                    <div style={{ fontSize:10, color:C.muted, fontWeight:700, marginBottom:7, textTransform:"uppercase", letterSpacing:0.5 }}>🔑 Vocabulario clave</div>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                      {resumen.palabras_clave.map((p,i) => (
                        <div key={i} style={{ display:"flex", alignItems:"center", gap:5, background:C.gold+"10", border:`1px solid ${C.gold}33`, borderRadius:20, padding:"4px 10px" }}>
                          <SpeakBtn text={p} color={C.gold} size={14} />
                          <span style={{ fontSize:12, color:C.gold, fontFamily:C.serif }}>{p}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Temas cubiertos */}
                {resumen.temas_cubiertos?.length > 0 && (
                  <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                    {resumen.temas_cubiertos.map((t,i) => (
                      <span key={i} style={{ fontSize:10, color:C.blue, background:C.blue+"14", border:`1px solid ${C.blue}33`, borderRadius:20, padding:"3px 9px" }}>{t}</span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── DIARIO MODULE (v16) ────────────────────────────────────────────────────
// Tabla requerida en Supabase:
// CREATE TABLE diario_entradas (
//   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
//   texto_usuario text NOT NULL,
//   correccion_json jsonb,
//   fecha timestamptz DEFAULT now()
// );
function DiarioModule() {
  const [vista, setVista] = useState("editor"); // "editor" | "historial" | "resultado"
  const [texto, setTexto] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [entradas, setEntradas] = useState([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [charCount, setCharCount] = useState(0);
  const MIN_CHARS = 30;
  const MAX_CHARS = 800;

  function handleTexto(val) {
    if (val.length <= MAX_CHARS) { setTexto(val); setCharCount(val.length); }
  }

  async function corregir() {
    if (texto.trim().length < MIN_CHARS || loading) return;
    setLoading(true);
    const prompt = `Eres un profesor de italiano experto. El estudiante (hispanohablante, nivel A0→B1) ha escrito lo siguiente en italiano:

"${texto.trim()}"

Analiza el texto y responde SOLO con un objeto JSON válido, sin markdown ni texto extra:
{
  "nivel_estimado": "A0|A1|A2|B1",
  "evaluacion_general": "frase motivacional breve en español (1 oración)",
  "errores": [
    {
      "original": "fragmento exacto del texto con error",
      "correcto": "forma correcta en italiano",
      "tipo": "gramática|vocabulario|ortografía|concordancia|tiempo verbal",
      "explicacion": "explicación breve en español (max 15 palabras)"
    }
  ],
  "texto_corregido": "el texto completo reescrito correctamente en italiano",
  "frases_bien": ["frase o construcción que usó correctamente 1", "frase 2"],
  "sugerencia": "un consejo concreto para mejorar (1 oración en español)",
  "palabras_nuevas": [{"it": "palabra italiana nueva sugerida", "es": "traducción", "ejemplo": "frase ejemplo"}]
}

Si el texto tiene menos de 2 errores, el array errores puede estar vacío. Sé preciso y pedagógico.`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1200,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await res.json();
      const raw = data.content?.[0]?.text || "{}";
      const clean = raw.replace(/```json|```/g, "").trim();
      const json = JSON.parse(clean);
      setResultado(json);
      // Guardar en Supabase
      try {
        await api.create("diario_entradas", {
          texto_usuario: texto.trim(),
          correccion_json: json,
        });
      } catch(e) { console.error("No se pudo guardar en Supabase:", e); }
      setVista("resultado");
    } catch(e) {
      console.error("Error corrigiendo:", e);
      setResultado({ evaluacion_general: "Hubo un error al corregir. Intenta de nuevo.", errores: [], texto_corregido: texto, frases_bien: [], sugerencia: "", palabras_nuevas: [], nivel_estimado: "?" });
      setVista("resultado");
    }
    setLoading(false);
  }

  async function cargarHistorial() {
    setLoadingHistorial(true);
    try {
      const data = await api.list("diario_entradas", { order: "fecha.desc", limit: 30 });
      setEntradas(data);
    } catch(e) { setEntradas([]); }
    setLoadingHistorial(false);
  }

  function formatFecha(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString("es-CO", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" });
  }

  function nivelColor(n) {
    return n==="B1"?C.gold:n==="A2"?"#4ab0d4":n==="A1"?C.green:C.muted;
  }

  // ── VISTA RESULTADO ──
  if (vista === "resultado" && resultado) return (
    <div style={{ fontFamily:C.sans }} className="it-fade-in">
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:18 }}>
        <button onClick={()=>{ setVista("editor"); setTexto(""); setCharCount(0); setResultado(null); }}
          style={{ background:"transparent", border:"none", cursor:"pointer", color:C.muted, padding:0, display:"flex" }}>
          <MIcon name="arrow_back" size={20} color={C.muted} />
        </button>
        <div>
          <div style={{ fontSize:9, color:C.gold, letterSpacing:"0.3em", fontWeight:700, textTransform:"uppercase" }}>Corrección · IA</div>
          <div style={{ fontSize:16, color:C.text, fontFamily:C.serif }}>Tu diario corregido</div>
        </div>
        {resultado.nivel_estimado && (
          <span style={{ marginLeft:"auto", fontSize:10, color:nivelColor(resultado.nivel_estimado),
            background:nivelColor(resultado.nivel_estimado)+"18",
            border:`1px solid ${nivelColor(resultado.nivel_estimado)}44`,
            borderRadius:20, padding:"3px 10px", fontWeight:700, letterSpacing:1 }}>
            {resultado.nivel_estimado}
          </span>
        )}
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

        {/* Evaluación general */}
        <div style={{ background:`${C.gold}0d`, border:`1px solid ${C.gold}33`, borderRadius:14, padding:"14px 16px" }}>
          <div style={{ fontSize:10, color:C.gold, fontWeight:700, marginBottom:6, textTransform:"uppercase", letterSpacing:0.5 }}>✨ Evaluación</div>
          <div style={{ fontSize:14, color:C.text, lineHeight:1.6 }}>{resultado.evaluacion_general}</div>
        </div>

        {/* Texto corregido */}
        {resultado.texto_corregido && (
          <div style={{ background:C.bg2, border:`1px solid ${C.green}33`, borderRadius:14, padding:"14px 16px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
              <div style={{ fontSize:10, color:C.green, fontWeight:700, textTransform:"uppercase", letterSpacing:0.5 }}>✅ Texto corregido</div>
              <SpeakBtn text={resultado.texto_corregido} color={C.green} />
            </div>
            <div style={{ fontSize:14, color:C.text, fontFamily:C.serif, lineHeight:1.8 }}>{resultado.texto_corregido}</div>
          </div>
        )}

        {/* Errores */}
        {resultado.errores?.length > 0 ? (
          <div>
            <div style={{ fontSize:10, color:C.pink, fontWeight:700, marginBottom:8, textTransform:"uppercase", letterSpacing:0.5 }}>💡 {resultado.errores.length} corrección{resultado.errores.length!==1?"es":""}</div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {resultado.errores.map((e, i) => (
                <div key={i} style={{ background:`${C.pink}08`, border:`1px solid ${C.pink}22`, borderRadius:12, padding:"12px 14px" }}>
                  <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap", marginBottom:6 }}>
                    <span style={{ fontSize:9, color:C.hint, background:C.bg3, borderRadius:20, padding:"2px 8px", fontWeight:700, letterSpacing:0.5, textTransform:"uppercase" }}>{e.tipo}</span>
                    <span style={{ fontSize:13, color:C.pink, textDecoration:"line-through", fontFamily:C.serif }}>{e.original}</span>
                    <span style={{ fontSize:11, color:C.hint }}>→</span>
                    <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                      <span style={{ fontSize:13, color:C.green, fontWeight:600, fontFamily:C.serif }}>{e.correcto}</span>
                      <SpeakBtn text={e.correcto} color={C.green} />
                    </div>
                  </div>
                  <div style={{ fontSize:12, color:C.muted, lineHeight:1.5 }}>{e.explicacion}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ background:`${C.green}0d`, border:`1px solid ${C.green}33`, borderRadius:12, padding:"12px 16px", fontSize:13, color:C.green, textAlign:"center" }}>
            🎉 ¡Sin errores! Excelente escritura.
          </div>
        )}

        {/* Lo que hizo bien */}
        {resultado.frases_bien?.length > 0 && (
          <div>
            <div style={{ fontSize:10, color:C.blue, fontWeight:700, marginBottom:8, textTransform:"uppercase", letterSpacing:0.5 }}>👍 Usaste bien</div>
            <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
              {resultado.frases_bien.map((f, i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:8, background:`${C.blue}0d`, border:`1px solid ${C.blue}22`, borderRadius:8, padding:"8px 12px" }}>
                  <SpeakBtn text={f} color={C.blue} />
                  <span style={{ fontSize:13, color:C.text, fontFamily:C.serif }}>{f}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Palabras nuevas sugeridas */}
        {resultado.palabras_nuevas?.length > 0 && (
          <div>
            <div style={{ fontSize:10, color:C.gold, fontWeight:700, marginBottom:8, textTransform:"uppercase", letterSpacing:0.5 }}>📚 Vocabulario para aprender</div>
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {resultado.palabras_nuevas.map((p, i) => (
                <div key={i} style={{ background:C.bg2, border:`1px solid ${C.border}`, borderRadius:10, padding:"10px 14px" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
                    <SpeakBtn text={p.it} color={C.gold} />
                    <span style={{ fontSize:14, color:C.gold, fontFamily:C.serif, fontWeight:600 }}>{p.it}</span>
                    <span style={{ fontSize:12, color:C.muted }}>— {p.es}</span>
                  </div>
                  {p.ejemplo && <div style={{ fontSize:11, color:C.textMid, fontStyle:"italic", marginLeft:28 }}>{p.ejemplo}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sugerencia final */}
        {resultado.sugerencia && (
          <div style={{ background:C.bg2, border:`1px solid ${C.border}`, borderRadius:12, padding:"12px 16px" }}>
            <div style={{ fontSize:10, color:C.muted, fontWeight:700, marginBottom:4, textTransform:"uppercase", letterSpacing:0.5 }}>🎯 Consejo</div>
            <div style={{ fontSize:13, color:C.textMid, lineHeight:1.6 }}>{resultado.sugerencia}</div>
          </div>
        )}

        {/* Botones */}
        <div style={{ display:"flex", gap:10, marginTop:4 }}>
          <button onClick={()=>{ setVista("historial"); cargarHistorial(); }} style={{ flex:1, background:"transparent", border:`1px solid ${C.border}`, borderRadius:10, padding:"11px", cursor:"pointer", color:C.muted, fontSize:13, fontFamily:C.sans, display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
            <MIcon name="history" size={16} color={C.muted} /> Ver historial
          </button>
          <button onClick={()=>{ setVista("editor"); setTexto(""); setCharCount(0); setResultado(null); }} style={{ flex:1, background:`${C.gold}18`, border:`1px solid ${C.gold}55`, borderRadius:10, padding:"11px", cursor:"pointer", color:C.gold, fontSize:13, fontWeight:700, fontFamily:C.sans, display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
            <MIcon name="edit" size={16} color={C.gold} /> Nueva entrada
          </button>
        </div>
      </div>
    </div>
  );

  // ── VISTA HISTORIAL ──
  if (vista === "historial") return (
    <div style={{ fontFamily:C.sans }} className="it-fade-in">
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:18 }}>
        <button onClick={()=>setVista("editor")} style={{ background:"transparent", border:"none", cursor:"pointer", color:C.muted, padding:0, display:"flex" }}>
          <MIcon name="arrow_back" size={20} color={C.muted} />
        </button>
        <div>
          <div style={{ fontSize:9, color:C.gold, letterSpacing:"0.3em", fontWeight:700, textTransform:"uppercase" }}>Diario · Historial</div>
          <div style={{ fontSize:16, color:C.text, fontFamily:C.serif }}>Tus entradas guardadas</div>
        </div>
      </div>

      {loadingHistorial ? (
        <div style={{ display:"flex", justifyContent:"center", padding:"40px 0" }}><Loader /></div>
      ) : entradas.length === 0 ? (
        <div style={{ textAlign:"center", color:C.muted, fontSize:14, padding:"40px 0" }}>
          <div style={{ fontSize:32, marginBottom:10 }}>📖</div>
          No hay entradas guardadas aún.<br/>
          <span style={{ fontSize:12 }}>Escribe tu primera entrada en italiano.</span>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {entradas.map(e => {
            const cor = e.correccion_json || {};
            const isOpen = expandedId === e.id;
            return (
              <div key={e.id} style={{ background:C.bg2, border:`1px solid ${isOpen ? C.gold+"55" : C.border}`, borderRadius:14, overflow:"hidden", transition:"border-color 0.15s" }}>
                <button onClick={()=>setExpandedId(isOpen ? null : e.id)} style={{ width:"100%", background:"transparent", border:"none", padding:"13px 16px", cursor:"pointer", display:"flex", alignItems:"center", gap:12, textAlign:"left" }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:3, flexWrap:"wrap" }}>
                      <span style={{ fontSize:11, color:C.hint }}>{formatFecha(e.fecha)}</span>
                      {cor.nivel_estimado && (
                        <span style={{ fontSize:9, color:nivelColor(cor.nivel_estimado), background:nivelColor(cor.nivel_estimado)+"18", border:`1px solid ${nivelColor(cor.nivel_estimado)}44`, borderRadius:20, padding:"1px 7px", fontWeight:700, letterSpacing:0.5 }}>{cor.nivel_estimado}</span>
                      )}
                      {cor.errores?.length === 0 && <span style={{ fontSize:9, color:C.green }}>🎉 sin errores</span>}
                      {cor.errores?.length > 0 && <span style={{ fontSize:9, color:C.pink }}>{cor.errores.length} corrección{cor.errores.length!==1?"es":""}</span>}
                    </div>
                    <div style={{ fontSize:13, color:C.text, fontFamily:C.serif, lineHeight:1.4, overflow:"hidden", textOverflow:"ellipsis", whiteSpace: isOpen?"normal":"nowrap" }}>
                      {e.texto_usuario}
                    </div>
                  </div>
                  <MIcon name={isOpen?"expand_less":"expand_more"} size={18} color={C.hint} />
                </button>

                {isOpen && cor.texto_corregido && (
                  <div style={{ borderTop:`1px solid ${C.border}`, padding:"12px 16px", display:"flex", flexDirection:"column", gap:10 }}>
                    <div style={{ background:`${C.green}0d`, border:`1px solid ${C.green}22`, borderRadius:10, padding:"10px 14px" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:5 }}>
                        <span style={{ fontSize:9, color:C.green, fontWeight:700, textTransform:"uppercase", letterSpacing:0.5 }}>Texto corregido</span>
                        <SpeakBtn text={cor.texto_corregido} color={C.green} />
                      </div>
                      <div style={{ fontSize:13, color:C.text, fontFamily:C.serif, lineHeight:1.7 }}>{cor.texto_corregido}</div>
                    </div>
                    {cor.errores?.length > 0 && (
                      <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                        {cor.errores.map((err, i) => (
                          <div key={i} style={{ fontSize:12, color:C.muted, display:"flex", gap:8, alignItems:"baseline", flexWrap:"wrap" }}>
                            <span style={{ color:C.pink, textDecoration:"line-through", fontFamily:C.serif }}>{err.original}</span>
                            <span style={{ color:C.hint }}>→</span>
                            <span style={{ color:C.green, fontFamily:C.serif }}>{err.correcto}</span>
                            <span style={{ fontSize:11, color:C.hint }}>({err.tipo})</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {cor.evaluacion_general && (
                      <div style={{ fontSize:12, color:C.textMid, fontStyle:"italic", borderTop:`1px solid ${C.border}`, paddingTop:8 }}>{cor.evaluacion_general}</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // ── VISTA EDITOR (default) ──
  return (
    <div style={{ fontFamily:C.sans }} className="it-fade-in">
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:18 }}>
        <div>
          <div style={{ fontSize:9, color:C.gold, letterSpacing:"0.3em", fontWeight:700, textTransform:"uppercase", marginBottom:4 }}>Diario · Anthropic AI</div>
          <h2 style={{ fontSize:20, color:C.text, margin:"0 0 6px", fontFamily:C.serif, fontWeight:400 }}>Scrivi in italiano</h2>
          <div style={{ width:36, height:1, background:C.gold, opacity:0.5, marginBottom:10 }}/>
          <p style={{ fontSize:13, color:C.textMid, lineHeight:1.6, margin:0 }}>
            Escribe 3–5 frases sobre tu día, pensamientos o cualquier tema.<br/>
            La IA corregirá cada error con explicación en contexto.
          </p>
        </div>
        <button onClick={()=>{ setVista("historial"); cargarHistorial(); }}
          style={{ background:`${C.blue}14`, border:`1px solid ${C.blue}44`, borderRadius:10, padding:"8px 14px", cursor:"pointer", color:C.blue, fontSize:12, fontFamily:C.sans, display:"flex", alignItems:"center", gap:5, flexShrink:0, marginLeft:12 }}>
          <MIcon name="history" size={16} color={C.blue} />
          Historial
        </button>
      </div>

      {/* Prompts de inspiración */}
      <div style={{ marginBottom:12 }}>
        <div style={{ fontSize:10, color:C.hint, marginBottom:7, letterSpacing:0.3 }}>💡 Ideas para escribir:</div>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {[
            "Oggi ho...",
            "Il mio cibo preferito è...",
            "Questo fine settimana...",
            "La mia città si chiama...",
            "Mi piace... perché...",
          ].map(p => (
            <button key={p} onClick={()=>handleTexto(texto ? texto : p)}
              style={{ background:C.bg2, border:`1px solid ${C.border}`, borderRadius:20, padding:"4px 12px", cursor:"pointer", color:C.textMid, fontSize:11, fontFamily:C.serif, transition:"border-color 0.15s" }}
              onMouseEnter={e=>e.currentTarget.style.borderColor=C.gold+"66"}
              onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}
            >{p}</button>
          ))}
        </div>
      </div>

      {/* Textarea */}
      <div style={{ position:"relative", marginBottom:10 }}>
        <textarea
          value={texto}
          onChange={e=>handleTexto(e.target.value)}
          placeholder="Scrivi qui in italiano... (almeno 3 frases)"
          rows={6}
          style={{
            width:"100%", boxSizing:"border-box",
            background:C.bg2, border:`1px solid ${texto.length >= MIN_CHARS ? C.gold+"55" : C.border}`,
            borderRadius:14, padding:"14px 16px", color:C.text,
            fontSize:15, fontFamily:C.serif, lineHeight:1.8,
            outline:"none", resize:"vertical", transition:"border-color 0.2s",
          }}
        />
        <div style={{ position:"absolute", bottom:10, right:12, fontSize:10, color: charCount > MAX_CHARS*0.9 ? C.pink : C.hint }}>
          {charCount}/{MAX_CHARS}
        </div>
      </div>

      {/* Indicador mínimo */}
      {texto.length > 0 && texto.length < MIN_CHARS && (
        <div style={{ fontSize:11, color:C.muted, marginBottom:8, display:"flex", alignItems:"center", gap:5 }}>
          <MIcon name="info" size={14} color={C.muted} /> Escribe un poco más para corregir ({MIN_CHARS - texto.length} caracteres mínimo)
        </div>
      )}

      {/* Botón corregir */}
      <button onClick={corregir} disabled={texto.trim().length < MIN_CHARS || loading}
        style={{
          width:"100%", padding:"14px", borderRadius:14, border:"none", cursor: texto.trim().length < MIN_CHARS || loading ? "default" : "pointer",
          background: texto.trim().length < MIN_CHARS || loading ? C.bg4 : `linear-gradient(135deg, ${C.gold}22, ${C.gold}10)`,
          border: `1px solid ${texto.trim().length < MIN_CHARS || loading ? C.border : C.gold+"66"}`,
          color: texto.trim().length < MIN_CHARS || loading ? C.hint : C.gold,
          fontSize:15, fontWeight:700, fontFamily:C.sans,
          display:"flex", alignItems:"center", justifyContent:"center", gap:10,
          transition:"all 0.2s",
        }}>
        {loading ? (
          <>
            <div style={{ display:"flex", gap:4 }}>
              {[0,1,2].map(i=><div key={i} style={{ width:6,height:6,background:C.gold,borderRadius:"50%",animation:`it-bounce 1s ${i*0.18}s infinite` }}/>)}
            </div>
            Corrigiendo con IA...
          </>
        ) : (
          <><MIcon name="auto_fix_high" size={18} color={texto.trim().length < MIN_CHARS ? C.hint : C.gold} /> Corregir con IA</>
        )}
      </button>

      {/* Info */}
      <div style={{ marginTop:12, display:"flex", gap:16, justifyContent:"center" }}>
        {[
          { icon:"psychology", text:"Errores explicados en contexto" },
          { icon:"save", text:"Guardado automáticamente" },
          { icon:"trending_up", text:"Ve tu progreso en historial" },
        ].map(item => (
          <div key={item.text} style={{ display:"flex", alignItems:"center", gap:4, fontSize:10, color:C.hint }}>
            <MIcon name={item.icon} size={12} color={C.hint} />
            {item.text}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SPEAKING MODULE (v8 con historial) ─────────────────────────────────────
// ─── SHADOWING (v20) ────────────────────────────────────────────────────────
function extractSentences(text) {
  if (!text) return [];
  return text
    .replace(/\n+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 8 && s.length < 160);
}

function ShadowingView({ db, onBack }) {
  const [fuente, setFuente] = useState("lectura"); // "lectura" | "nuevas"
  const [lecturaSel, setLecturaSel] = useState(null);
  const [frases, setFrases] = useState([]);
  const [idx, setIdx] = useState(0);
  const [practicadas, setPracticadas] = useState({});
  const [rate, setRate] = useState(0.8);
  const [loadingNuevas, setLoadingNuevas] = useState(false);
  const [genError, setGenError] = useState(null);

  const lecturas = (db?.lecturas || []).filter(r => r.activa);

  function elegirLectura(r) {
    setLecturaSel(r);
    const sents = extractSentences(r.texto);
    setFrases(sents);
    setIdx(0);
    setPracticadas({});
  }

  async function generarFrasesNuevas() {
    setLoadingNuevas(true); setGenError(null);
    const cacheKey = `it_shadow_nuevas_${new Date().toISOString().slice(0,10)}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const arr = JSON.parse(cached);
        setFrases(arr); setLecturaSel({ titulo:"Frases nuevas", emoji:"✨" });
        setIdx(0); setPracticadas({});
        setLoadingNuevas(false);
        return;
      } catch {}
    }
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:500,
          messages:[{ role:"user", content:
            `Genera 6 frases cortas en italiano (8-15 palabras cada una), nivel A2-B1, naturales y útiles para practicar pronunciación (shadowing). Responde SOLO con un array JSON de strings, sin markdown ni texto extra. Ejemplo: ["Frase uno.", "Frase due."]` }],
        }),
      });
      const data = await res.json();
      const text = data.content?.[0]?.text || "[]";
      const clean = text.replace(/```json|```/g,"").trim();
      const arr = JSON.parse(clean);
      localStorage.setItem(cacheKey, JSON.stringify(arr));
      setFrases(arr); setLecturaSel({ titulo:"Frases nuevas", emoji:"✨" });
      setIdx(0); setPracticadas({});
    } catch {
      setGenError("No se pudieron generar frases. Intenta de nuevo.");
    }
    setLoadingNuevas(false);
  }

  async function playCurrent() {
    const frase = frases[idx];
    if (!frase) return;
    const { apiKey } = getELConfig();
    if (apiKey) {
      await speakEL(frase);
    } else {
      speakFallback(frase, rate);
    }
  }

  function marcarPracticada() {
    setPracticadas(p => ({ ...p, [idx]: true }));
    if (idx < frases.length - 1) setIdx(idx+1);
  }

  // ── Selector de fuente ──
  if (!lecturaSel) return (
    <div style={{ fontFamily:C.sans }} className="it-fade-in">
      <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:14 }}>
        <button onClick={onBack} style={{ background:"transparent", border:`1px solid ${C.border}`, borderRadius:8, padding:"7px 14px", cursor:"pointer", color:C.textMid, fontSize:12, fontFamily:C.sans, display:"flex", alignItems:"center", gap:5 }}>
          <MIcon name="arrow_back" size={16} color={C.muted} /> Volver
        </button>
        <div>
          <div style={{ fontSize:9, color:C.gold, letterSpacing:"0.3em", fontWeight:700, textTransform:"uppercase", marginBottom:2 }}>Shadowing</div>
          <div style={{ fontSize:15, color:C.text, fontFamily:C.serif }}>Escucha y repite en voz alta</div>
        </div>
      </div>

      <p style={{ fontSize:13, color:C.textMid, lineHeight:1.7, marginBottom:16 }}>
        Elige un texto de Lectura: cada frase se reproduce en audio nativo, repítela en voz alta tantas veces como quieras hasta que te salga natural, y marca como practicada para pasar a la siguiente.
      </p>

      <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:18 }}>
        {lecturas.map(r => (
          <button key={r.id} onClick={()=>elegirLectura(r)} style={{
            background:"transparent", border:`1px solid ${C.border}`, borderRadius:14,
            padding:"14px 16px", cursor:"pointer", display:"flex", alignItems:"center", gap:14,
            textAlign:"left", width:"100%", transition:"border-color 0.15s" }}
            onMouseEnter={e=>e.currentTarget.style.borderColor=C.gold+"88"}
            onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}
          >
            <div style={{ fontSize:26, flexShrink:0 }}>{r.emoji}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:14, color:C.text, fontFamily:C.serif }}>{r.titulo}</div>
              <div style={{ fontSize:11, color:C.hint }}>{extractSentences(r.texto).length} frases · {r.nivel}</div>
            </div>
            <MIcon name="chevron_right" size={20} color={C.hint} />
          </button>
        ))}
      </div>

      <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:14 }}>
        <div style={{ fontSize:10, color:C.muted, letterSpacing:"0.2em", fontWeight:700, textTransform:"uppercase", marginBottom:8 }}>Opcional</div>
        <button onClick={generarFrasesNuevas} disabled={loadingNuevas} style={{
          width:"100%", background:`${C.gold}10`, border:`1px solid ${C.gold}33`, borderRadius:10,
          padding:"11px 14px", cursor:loadingNuevas?"default":"pointer", color:C.gold, fontSize:13,
          fontFamily:C.sans, display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
          {loadingNuevas ? <><Loader size={14}/> Generando...</> : <><MIcon name="auto_awesome" size={16} color={C.gold} /> Generar frases nuevas con IA</>}
        </button>
        {genError && <div style={{ fontSize:11, color:C.pink, marginTop:6, textAlign:"center" }}>{genError}</div>}
      </div>
    </div>
  );

  // ── Sesión de shadowing ──
  const frase = frases[idx];
  const totalPracticadas = Object.keys(practicadas).length;
  return (
    <div style={{ fontFamily:C.sans }} className="it-fade-in">
      <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:16 }}>
        <button onClick={()=>setLecturaSel(null)} style={{ background:"transparent", border:`1px solid ${C.border}`, borderRadius:8, padding:"7px 14px", cursor:"pointer", color:C.textMid, fontSize:12, fontFamily:C.sans, display:"flex", alignItems:"center", gap:5 }}>
          <MIcon name="arrow_back" size={16} color={C.muted} /> Volver
        </button>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:14, color:C.text, fontFamily:C.serif }}>{lecturaSel.emoji} {lecturaSel.titulo}</div>
          <div style={{ fontSize:11, color:C.muted }}>{idx+1} / {frases.length} · {totalPracticadas} practicada{totalPracticadas!==1?"s":""}</div>
        </div>
      </div>

      {!frase ? (
        <div style={{ textAlign:"center", color:C.muted, fontSize:13, padding:"32px 0" }}>
          No hay frases disponibles en este texto.
        </div>
      ) : (
        <>
          <div className="it-glass" style={{ borderRadius:14, padding:24, marginBottom:16, textAlign:"center" }}>
            <div style={{ fontSize:18, color:C.text, fontFamily:C.serif, lineHeight:1.6, marginBottom:18 }}>{frase}</div>
            <button onClick={playCurrent} style={{
              background:`${C.gold}18`, border:`1px solid ${C.gold}55`, borderRadius:"50%",
              width:56, height:56, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto" }}>
              <MIcon name="volume_up" fill={1} size={26} color={C.gold} />
            </button>
          </div>

          <div style={{ display:"flex", gap:6, justifyContent:"center", marginBottom:16 }}>
            {[0.7, 0.85, 1].map(r => (
              <button key={r} onClick={()=>setRate(r)} style={{
                background: rate===r ? C.gold : "transparent",
                color: rate===r ? C.bg : C.muted,
                border:`1px solid ${rate===r ? C.gold : C.border}`,
                borderRadius:20, padding:"4px 13px", fontSize:11, fontWeight:700,
                cursor:"pointer", fontFamily:C.sans }}>{r}x</button>
            ))}
          </div>

          <div style={{ display:"flex", gap:8 }}>
            <button onClick={()=>setIdx(i=>Math.max(0,i-1))} disabled={idx===0} style={{
              background:"transparent", border:`1px solid ${C.border}`, borderRadius:10,
              padding:"11px 16px", cursor:idx===0?"default":"pointer", color:idx===0?C.hint:C.muted,
              fontSize:13, fontFamily:C.sans }}>
              <MIcon name="chevron_left" size={18} color={idx===0?C.hint:C.muted} />
            </button>
            <button onClick={marcarPracticada} style={{
              flex:1, background: practicadas[idx] ? `${C.green}18` : `${C.gold}18`,
              border:`1px solid ${practicadas[idx] ? C.green+"55" : C.gold+"55"}`, borderRadius:10,
              padding:"11px", cursor:"pointer", color: practicadas[idx] ? C.green : C.gold,
              fontWeight:700, fontSize:13, fontFamily:C.sans,
              display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
              <MIcon name="check_circle" size={16} color={practicadas[idx] ? C.green : C.gold} />
              {idx < frases.length-1 ? "Practicada — siguiente" : "Practicada — fin"}
            </button>
            <button onClick={()=>setIdx(i=>Math.min(frases.length-1,i+1))} disabled={idx===frases.length-1} style={{
              background:"transparent", border:`1px solid ${C.border}`, borderRadius:10,
              padding:"11px 16px", cursor:idx===frases.length-1?"default":"pointer", color:idx===frases.length-1?C.hint:C.muted,
              fontSize:13, fontFamily:C.sans }}>
              <MIcon name="chevron_right" size={18} color={idx===frases.length-1?C.hint:C.muted} />
            </button>
          </div>

          {totalPracticadas === frases.length && (
            <div style={{ marginTop:14, background:`${C.green}0d`, border:`1px solid ${C.green}33`, borderRadius:10, padding:"10px 14px", fontSize:12, color:C.green, textAlign:"center" }}>
              🎉 ¡Sesión completa! Practicaste {frases.length} frases.
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SpeakingModule({ db }) {
  const [vista, setVista] = useState("selector"); // "selector" | "chat" | "historial" | "resumen" | "shadowing"
  const [escenario, setEscenario] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [msgCount, setMsgCount] = useState(0);
  const [savingResumen, setSavingResumen] = useState(false);
  const [resumenActual, setResumenActual] = useState(null);
  const bottomRef = useRef(null);

  // ─── STT STATE ───────────────────────────────────────────────────────────
  const [sttMode, setSttMode]       = useState("idle"); // "idle"|"listening"|"processing"
  const [sttError, setSttError]     = useState(null);
  const recognitionRef              = useRef(null);
  const mediaRecorderRef            = useRef(null);
  const audioChunksRef              = useRef([]);
  const GROQ_KEY                    = localStorage.getItem("groq_api_key") || "";
  const STT_AVAILABLE               = WEB_SPEECH_AVAILABLE || !!GROQ_KEY;

  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:"smooth"}); },[messages]);

  function startEscenario(esc) {
    setEscenario(esc);
    setMessages([{ role:"assistant", content:esc.intro }]);
    setInput(""); setMsgCount(0); setResumenActual(null);
    setVista("chat");
  }

  async function terminarSesion() {
    if (msgCount === 0) { setVista("selector"); return; }
    setSavingResumen(true);
    const summary = await generateSummary(escenario, messages);
    await saveConversacion(escenario, messages, summary);
    setResumenActual(summary);
    setSavingResumen(false);
    setVista("resumen");
  }

  async function sendMessage() {
    if (!input.trim() || loading || !escenario) return;
    markActivity();
    const userMsg = { role:"user", content:input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages); setInput(""); setLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:1000,
          system: escenario.system,
          messages: newMessages.map(m=>({ role:m.role, content:m.content })),
        }),
      });
      const data = await res.json();
      const text = data.content?.[0]?.text || "Mi dispiace, ho avuto un problema. Riprova!";
      setMessages(m=>[...m,{ role:"assistant", content:text }]);
      setMsgCount(c=>c+1);
    } catch(e) {
      setMessages(m=>[...m,{ role:"assistant", content:"Connessione fallita. Riprova tra un momento!" }]);
    }
    setLoading(false);
  }

  // ─── STT: FUNCIÓN PRINCIPAL HÍBRIDA ────────────────────────────────────────
  async function startSTT() {
    if (sttMode !== "idle") {
      recognitionRef.current?.stop();
      if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.stop();
      setSttMode("idle");
      return;
    }
    setSttError(null);

    // RAMA 1 — Web Speech API (Chrome/Edge, gratis, sin key)
    if (WEB_SPEECH_AVAILABLE) {
      const SR = window.webkitSpeechRecognition || window.SpeechRecognition;
      const rec = new SR();
      rec.lang = "it-IT";
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      recognitionRef.current = rec;
      rec.onstart  = () => setSttMode("listening");
      rec.onend    = () => setSttMode("idle");
      rec.onerror  = (e) => {
        setSttMode("idle");
        // Si falla en Safari/otro, caer a Groq si hay key
        if (GROQ_KEY) { startGroqSTT(); }
        else { setSttError("Micrófono no disponible en este navegador"); }
      };
      rec.onresult = (e) => {
        const texto = e.results[0][0].transcript;
        setInput(prev => prev ? prev + " " + texto : texto);
      };
      rec.start();
      return;
    }

    // RAMA 2 — Groq Whisper (Firefox / Safari sin Web Speech, necesita key)
    if (GROQ_KEY) { startGroqSTT(); return; }

    setSttError("Navegador no compatible. Agrega una key de Groq en ajustes de audio.");
  }

  async function startGroqSTT() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      audioChunksRef.current   = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstart  = () => setSttMode("listening");
      recorder.onstop   = async () => {
        setSttMode("processing");
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        const form = new FormData();
        form.append("file", blob, `audio.${mimeType.includes("mp4") ? "mp4" : "webm"}`);
        form.append("model", "whisper-large-v3");
        form.append("language", "it");
        try {
          const res  = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${GROQ_KEY}` },
            body: form,
          });
          const data = await res.json();
          if (data.text) setInput(prev => prev ? prev + " " + data.text : data.text);
          else setSttError("No se detectó voz — intenta de nuevo");
        } catch { setSttError("Error conectando con Groq Whisper"); }
        setSttMode("idle");
      };
      recorder.start();
      // Auto-stop a los 30 s para no dejar grabando indefinidamente
      setTimeout(() => { if (recorder.state === "recording") recorder.stop(); }, 30000);
    } catch {
      setSttError("Permiso de micrófono denegado");
      setSttMode("idle");
    }
  }

  function parseMsg(text) {
    const parts = { main:"", es:"", correction:"" };
    const esMatch = text.match(/ES:\s*([\s\S]*?)(?=💡|$)/);
    const corrMatch = text.match(/💡\s*(?:Correzione|Si dice meglio):\s*([\s\S]*?)$/);
    parts.main = text.replace(/ES:\s*[\s\S]*$/,"").replace(/💡[\s\S]*$/,"").trim();
    if (esMatch) parts.es = esMatch[1].trim();
    if (corrMatch) parts.correction = corrMatch[1].trim();
    return parts;
  }

  const [filtroNivel, setFiltroNivel] = useState("Todos");
  const [busqueda, setBusqueda] = useState("");
  const NIVELES_FILTRO = ["Todos", "A0", "A1", "A2", "B1"];
  const escenariosFiltrados = ESCENARIOS.filter(esc => {
    const matchNivel = filtroNivel === "Todos" || esc.nivel.startsWith(filtroNivel);
    const q = busqueda.toLowerCase();
    const matchBusqueda = !q || esc.label.toLowerCase().includes(q) || esc.desc.toLowerCase().includes(q);
    return matchNivel && matchBusqueda;
  });

  // ── VISTA: SHADOWING ──
  if (vista === "shadowing") return <ShadowingView db={db} onBack={()=>setVista("selector")} />;

  // ── VISTA: HISTORIAL ──
  if (vista === "historial") return <HistorialPanel onClose={()=>setVista("selector")} />;

  // ── VISTA: RESUMEN POST-SESIÓN ──
  if (vista === "resumen" && resumenActual) {
    const r = resumenActual;
    return (
      <div style={{ display:"flex", flexDirection:"column", gap:14, fontFamily:C.sans }} className="it-fade-in">
        <div style={{ textAlign:"center", padding:"8px 0 4px" }}>
          <div style={{ fontSize:32, marginBottom:8 }}>🎉</div>
          <div style={{ fontSize:9, color:C.gold, letterSpacing:"0.3em", fontWeight:700, textTransform:"uppercase", marginBottom:4 }}>Sesión completada</div>
          <div style={{ fontSize:19, color:C.text, fontFamily:C.serif, marginBottom:2 }}>
            {escenario.emoji} {escenario.label}
          </div>
          <div style={{ fontSize:12, color:C.muted }}>{msgCount} intercambios · {r.nivel_evaluacion || escenario.nivel}</div>
        </div>

        {(r.puntos_fuertes || r.para_mejorar) && (
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {r.puntos_fuertes && (
              <div style={{ background:C.green+"0d", border:`1px solid ${C.green}33`, borderRadius:12, padding:"12px 16px" }}>
                <div style={{ fontSize:10, color:C.green, fontWeight:700, marginBottom:5, textTransform:"uppercase", letterSpacing:0.5 }}>✅ Lo hiciste bien</div>
                <div style={{ fontSize:13, color:C.textMid, lineHeight:1.6 }}>{r.puntos_fuertes}</div>
              </div>
            )}
            {r.para_mejorar && (
              <div style={{ background:C.gold+"0d", border:`1px solid ${C.gold}33`, borderRadius:12, padding:"12px 16px" }}>
                <div style={{ fontSize:10, color:C.gold, fontWeight:700, marginBottom:5, textTransform:"uppercase", letterSpacing:0.5 }}>🎯 Practica esto</div>
                <div style={{ fontSize:13, color:C.textMid, lineHeight:1.6 }}>{r.para_mejorar}</div>
              </div>
            )}
          </div>
        )}

        {r.frases_nuevas?.length > 0 && (
          <div style={{ background:C.bg2, borderRadius:12, padding:"12px 16px", border:`1px solid ${C.border}` }}>
            <div style={{ fontSize:10, color:C.green, fontWeight:700, marginBottom:9, textTransform:"uppercase", letterSpacing:0.5 }}>✨ Frases que practicaste</div>
            {r.frases_nuevas.map((f,i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:8, paddingBottom:7, marginBottom:i<r.frases_nuevas.length-1?7:0, borderBottom:i<r.frases_nuevas.length-1?`1px solid ${C.border}`:"none" }}>
                <SpeakBtn text={f} color={C.green} />
                <span style={{ fontSize:13, color:C.text, fontFamily:C.serif }}>{f}</span>
              </div>
            ))}
          </div>
        )}

        {r.errores?.length > 0 && (
          <div style={{ background:C.bg2, borderRadius:12, padding:"12px 16px", border:`1px solid ${C.border}` }}>
            <div style={{ fontSize:10, color:C.pink, fontWeight:700, marginBottom:9, textTransform:"uppercase", letterSpacing:0.5 }}>💡 {r.errores.length} corrección{r.errores.length!==1?"es":""}</div>
            {r.errores.map((e,i) => (
              <div key={i} style={{ paddingBottom:9, marginBottom:i<r.errores.length-1?9:0, borderBottom:i<r.errores.length-1?`1px solid ${C.border}`:"none" }}>
                <div style={{ display:"flex", gap:6, alignItems:"baseline", flexWrap:"wrap", marginBottom:3 }}>
                  <span style={{ fontSize:13, color:C.pink, textDecoration:"line-through" }}>{e.error}</span>
                  <span style={{ fontSize:11, color:C.hint }}>→</span>
                  <span style={{ fontSize:13, color:C.green, fontWeight:600 }}>{e.correcto}</span>
                </div>
                {e.explicacion && <div style={{ fontSize:11, color:C.muted, lineHeight:1.5 }}>{e.explicacion}</div>}
              </div>
            ))}
          </div>
        )}

        {r.palabras_clave?.length > 0 && (
          <div>
            <div style={{ fontSize:10, color:C.muted, fontWeight:700, marginBottom:8, textTransform:"uppercase", letterSpacing:0.5 }}>🔑 Vocabulario clave</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
              {r.palabras_clave.map((p,i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:5, background:C.gold+"10", border:`1px solid ${C.gold}33`, borderRadius:20, padding:"5px 12px" }}>
                  <SpeakBtn text={p} color={C.gold} size={14} />
                  <span style={{ fontSize:12, color:C.gold, fontFamily:C.serif }}>{p}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display:"flex", gap:8, marginTop:4 }}>
          <button onClick={()=>setVista("historial")} style={{ flex:1, background:"transparent", border:`1px solid ${C.border}`, borderRadius:10, padding:"11px", cursor:"pointer", color:C.muted, fontSize:13, fontFamily:C.sans, display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
            <MIcon name="history" size={16} color={C.muted} /> Ver historial
          </button>
          <button onClick={()=>setVista("selector")} style={{ flex:1, background:`${C.gold}18`, border:`1px solid ${C.gold}55`, borderRadius:10, padding:"11px", cursor:"pointer", color:C.gold, fontSize:13, fontWeight:700, fontFamily:C.sans, display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
            <MIcon name="add_circle" size={16} color={C.gold} /> Nueva sesión
          </button>
        </div>
      </div>
    );
  }

  // ── VISTA: SELECTOR DE ESCENARIO ──
  if (vista === "selector") return (
    <div style={{ fontFamily:C.sans }} className="it-fade-in">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14, flexWrap:"wrap", gap:10 }}>
        <div>
          <div style={{ fontSize:9, color:C.gold, letterSpacing:"0.3em", fontWeight:700, textTransform:"uppercase", marginBottom:4 }}>Conversazione · Anthropic AI</div>
          <h2 style={{ fontSize:20, color:C.text, margin:"0 0 6px", fontFamily:C.serif, fontWeight:400 }}>Elige tu escenario</h2>
          <div style={{ width:36, height:1, background:C.gold, opacity:0.5, marginBottom:10 }}/>
          <p style={{ fontSize:13, color:C.textMid, lineHeight:1.6, margin:0 }}>
            Habla en italiano — cada sesión se guarda con correcciones y resumen.
          </p>
        </div>
        <div style={{ display:"flex", gap:8, flexShrink:0 }}>
          <button onClick={()=>setVista("shadowing")} style={{ background:`${C.gold}14`, border:`1px solid ${C.gold}44`, borderRadius:10, padding:"8px 14px", cursor:"pointer", color:C.gold, fontSize:12, fontFamily:C.sans, display:"flex", alignItems:"center", gap:5 }}>
            <MIcon name="record_voice_over" size={16} color={C.gold} />
            Shadowing
          </button>
          <button onClick={()=>setVista("historial")} style={{ background:`${C.blue}14`, border:`1px solid ${C.blue}44`, borderRadius:10, padding:"8px 14px", cursor:"pointer", color:C.blue, fontSize:12, fontFamily:C.sans, display:"flex", alignItems:"center", gap:5 }}>
            <MIcon name="history" size={16} color={C.blue} />
            Historial
          </button>
        </div>
      </div>

      <div style={{ position:"relative", marginBottom:10 }}>
        <span className="material-symbols-outlined" style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", fontSize:16, color:C.muted, pointerEvents:"none", fontVariationSettings:"'FILL' 0" }}>search</span>
        <input
          value={busqueda} onChange={e=>setBusqueda(e.target.value)}
          placeholder="Buscar escenario..."
          style={{ width:"100%", boxSizing:"border-box", background:C.bg2, border:`1px solid ${C.border}`, borderRadius:10, padding:"8px 12px 8px 34px", color:C.text, fontSize:13, fontFamily:C.sans, outline:"none" }}
        />
        {busqueda && (
          <button onClick={()=>setBusqueda("")} style={{ position:"absolute", right:8, top:"50%", transform:"translateY(-50%)", background:"transparent", border:"none", cursor:"pointer", color:C.muted, padding:2, display:"flex", alignItems:"center" }}>
            <span className="material-symbols-outlined" style={{ fontSize:16 }}>close</span>
          </button>
        )}
      </div>

      <div style={{ display:"flex", gap:6, marginBottom:14, flexWrap:"wrap" }}>
        {NIVELES_FILTRO.map(n => {
          const active = filtroNivel === n;
          return (
            <button key={n} onClick={()=>setFiltroNivel(n)} style={{
              background: active ? C.gold : "transparent",
              color: active ? C.bg : C.muted,
              border: `1px solid ${active ? C.gold : C.border}`,
              borderRadius:20, padding:"4px 13px", fontSize:11, fontWeight:700,
              letterSpacing:"0.05em", cursor:"pointer", fontFamily:C.sans,
              transition:"all 0.15s",
            }}>{n}</button>
          );
        })}
        <span style={{ fontSize:11, color:C.hint, alignSelf:"center", marginLeft:4 }}>
          {escenariosFiltrados.length} escenario{escenariosFiltrados.length!==1?"s":""}
        </span>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {escenariosFiltrados.length === 0 ? (
          <div style={{ textAlign:"center", color:C.muted, fontSize:13, padding:"32px 0" }}>
            Nessun escenario trovato — prova un altro filtro 🤷
          </div>
        ) : escenariosFiltrados.map(esc => (
          <button key={esc.id} onClick={()=>startEscenario(esc)} style={{
            background:"transparent", border:`1px solid ${C.border}`,
            borderRadius:14, padding:"14px 16px", cursor:"pointer",
            display:"flex", alignItems:"center", gap:14, textAlign:"left", width:"100%",
            transition:"border-color 0.15s",
          }}
          onMouseEnter={e=>e.currentTarget.style.borderColor=esc.color+"88"}
          onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}
          >
            <div style={{ fontSize:28, flexShrink:0 }}>{esc.emoji}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:3, flexWrap:"wrap" }}>
                <span style={{ fontSize:15, color:C.text, fontFamily:C.serif }}>{esc.label}</span>
                <span style={{ fontSize:9, color:esc.color, background:esc.color+"18", border:`1px solid ${esc.color}44`, borderRadius:20, padding:"2px 8px", fontWeight:700, letterSpacing:1, textTransform:"uppercase" }}>{esc.nivel}</span>
              </div>
              <div style={{ fontSize:12, color:C.muted, lineHeight:1.4 }}>{esc.desc}</div>
            </div>
            <MIcon name="chevron_right" size={20} color={C.hint} />
          </button>
        ))}
      </div>
    </div>
  );

  // ── VISTA: CHAT ──
  return (
    <div style={{ display:"flex", flexDirection:"column", height:"calc(100vh - 180px)", minHeight:460, fontFamily:C.sans }} className="it-fade-in">
      {/* Header del escenario */}
      <div style={{ background:C.bg2, border:`1px solid ${escenario.color}33`, borderRadius:14, padding:"12px 16px", marginBottom:12, display:"flex", alignItems:"center", gap:12 }}>
        <div style={{ fontSize:24, flexShrink:0 }}>{escenario.emoji}</div>
        <div style={{ flex:1 }}>
          <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:2 }}>
            <span style={{ fontSize:14, color:C.text, fontFamily:C.serif }}>{escenario.label}</span>
            <span style={{ fontSize:9, color:escenario.color, background:escenario.color+"18", border:`1px solid ${escenario.color}44`, borderRadius:20, padding:"2px 8px", fontWeight:700, letterSpacing:1, textTransform:"uppercase" }}>{escenario.nivel}</span>
            {msgCount > 0 && <span style={{ fontSize:10, color:C.muted }}>{msgCount} intercambios</span>}
          </div>
          <div style={{ fontSize:11, color:C.hint }}>{escenario.desc}</div>
        </div>
        <button onClick={terminarSesion} disabled={savingResumen} style={{
          background: savingResumen ? C.bg4 : `${C.green}18`,
          border:`1px solid ${savingResumen ? C.border : C.green}55`,
          borderRadius:8, padding:"5px 10px", cursor:savingResumen?"default":"pointer",
          color:savingResumen?C.hint:C.green, fontSize:11, fontFamily:C.sans,
          flexShrink:0, display:"flex", alignItems:"center", gap:4, transition:"all 0.15s",
        }}>
          {savingResumen
            ? <><Loader size={12}/> Generando...</>
            : <><MIcon name="check_circle" size={14} color={C.green} /> Terminar</>
          }
        </button>
      </div>

      {/* Mensajes */}
      <div style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column", gap:10, paddingBottom:8 }}>
        {messages.map((m,i)=>{
          const isUser = m.role==="user";
          if (isUser) return (
            <div key={i} style={{ alignSelf:"flex-end", maxWidth:"85%", minWidth:0 }}>
              <div style={{ background:escenario.color+"14", border:`1px solid ${escenario.color}44`, borderRadius:"14px 14px 4px 14px", padding:"12px 16px" }}>
                <div style={{ fontSize:14, color:C.text, lineHeight:1.6, fontFamily:C.serif }}>{m.content}</div>
              </div>
            </div>
          );
          const parts = parseMsg(m.content);
          return (
            <div key={i} style={{ alignSelf:"flex-start", maxWidth:"88%", minWidth:0 }}>
              <div className="it-lesson-card" style={{ border:`1px solid ${C.gold}28`, borderRadius:"14px 14px 14px 4px", padding:"14px 16px" }}>
                <div style={{ display:"flex", alignItems:"flex-start", gap:8, marginBottom:(parts.es||parts.correction)?8:0 }}>
                  <div style={{ fontSize:14, color:C.text, lineHeight:1.7, flex:1 }}>{parts.main||m.content}</div>
                  <SpeakBtn text={parts.main||m.content} color={C.gold} />
                </div>
                {parts.es && (
                  <div style={{ fontSize:12, color:C.textMid, fontStyle:"italic", borderTop:`1px solid ${C.border}`, paddingTop:7, marginTop:4, lineHeight:1.5 }}>
                    🇪🇸 {parts.es}
                  </div>
                )}
                {parts.correction && (
                  <div style={{ background:`${C.pink}0d`, border:`1px solid ${C.pink}33`, borderRadius:8, padding:"8px 12px", marginTop:8, fontSize:12, color:C.pink, lineHeight:1.5 }}>
                    💡 {parts.correction}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {loading && (
          <div style={{ alignSelf:"flex-start" }}>
            <div className="it-lesson-card" style={{ border:`1px solid ${C.gold}22`, borderRadius:"14px 14px 14px 4px", padding:"14px 18px" }}>
              <div style={{ display:"flex", gap:5 }}>
                {[0,1,2].map(i=><div key={i} style={{ width:6,height:6,background:C.gold,borderRadius:"50%",animation:`it-bounce 1s ${i*0.18}s infinite` }}/>)}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>

      {/* Input con STT híbrido */}
      <div style={{ paddingTop:10, borderTop:`1px solid ${C.border}`, marginTop:4 }}>
        {sttError && (
          <div style={{ fontSize:11, color:C.pink, marginBottom:6, display:"flex", alignItems:"center", gap:5 }}>
            <MIcon name="error" size={14} color={C.pink} /> {sttError}
          </div>
        )}
        <div style={{ display:"flex", gap:8 }}>
          {/* Botón micrófono — solo aparece si hay soporte */}
          {STT_AVAILABLE && (
            <button onClick={startSTT} title={
                sttMode === "listening"  ? "Toca para detener" :
                sttMode === "processing" ? "Procesando audio..." :
                "Hablar en italiano"
              } style={{
              background:
                sttMode === "listening"  ? `${C.pink}22`  :
                sttMode === "processing" ? `${C.gold}18`  : C.bg3,
              border:`1px solid ${
                sttMode === "listening"  ? C.pink :
                sttMode === "processing" ? C.gold : C.border}`,
              borderRadius:10, padding:"0 14px", minWidth:46,
              cursor: sttMode === "processing" ? "default" : "pointer",
              display:"flex", alignItems:"center", justifyContent:"center",
              transition:"all 0.15s", flexShrink:0,
            }}>
              {sttMode === "listening" ? (
                <span style={{ display:"flex", gap:2, alignItems:"center", height:20 }}>
                  {[0,1,2,3].map(i => (
                    <span key={i} style={{
                      width:3, borderRadius:2, background:C.pink,
                      height:[10,16,12,8][i],
                      animation:`it-bounce 0.8s ${i*0.12}s ease-in-out infinite`,
                    }}/>
                  ))}
                </span>
              ) : sttMode === "processing" ? (
                <span style={{ width:14, height:14, border:`2px solid ${C.gold}44`,
                  borderTop:`2px solid ${C.gold}`, borderRadius:"50%",
                  animation:"it-pulse 0.7s linear infinite", display:"inline-block" }}/>
              ) : (
                <MIcon name="mic" size={18} color={WEB_SPEECH_AVAILABLE ? C.textMid : C.gold} />
              )}
            </button>
          )}

          <input value={input} onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&sendMessage()}
            placeholder={
              sttMode === "listening"  ? "Escuchando… habla en italiano 🎙️" :
              sttMode === "processing" ? "Procesando tu voz..." :
              "Scrivi o parla in italiano..."
            }
            style={{ flex:1, background:C.bg3, border:`1px solid ${C.border}`, borderRadius:10,
              padding:"11px 14px", color:C.text, fontSize:14, outline:"none", fontFamily:C.sans,
              opacity: sttMode === "processing" ? 0.6 : 1 }}
          />
          <button onClick={sendMessage} disabled={loading||!input.trim()} style={{
            background:loading||!input.trim()?C.bg4:`${escenario.color}20`,
            border:`1px solid ${loading||!input.trim()?C.border:escenario.color}`,
            borderRadius:10, padding:"11px 16px", cursor:loading||!input.trim()?"default":"pointer",
            color:loading||!input.trim()?C.hint:escenario.color,
            fontWeight:700, fontSize:18, transition:"all 0.15s",
          }}>›</button>
        </div>

        {/* Indicador modo Groq (solo cuando no hay Web Speech) */}
        {!WEB_SPEECH_AVAILABLE && !!GROQ_KEY && sttMode === "idle" && (
          <div style={{ fontSize:10, color:C.gold, marginTop:5, textAlign:"center", opacity:0.7 }}>
            🎙️ Usando Groq Whisper como reconocedor de voz
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MEZCLA MODULE (v17) ────────────────────────────────────────────────────
// Sesión guiada de interleaving: mezcla SRS + Lectura + Diario + Cierre IA en ~20 min
function MezclaModule({ db, progresoMap, refreshProgreso }) {
  const [fase, setFase] = useState("intro"); // intro | srs | lectura | diario | cierre
  const [srsIdx, setSrsIdx] = useState(0);
  const [srsCards, setSrsCards] = useState([]);
  const [srsFlipped, setSrsFlipped] = useState(false);
  const [srsDone, setSrsDone] = useState([]);
  const [saving, setSaving] = useState(false);
  const [lecturaIdx, setLecturaIdx] = useState(0);
  const [lecturaWord, setLecturaWord] = useState(null);
  const [lecturaQuiz, setLecturaQuiz] = useState(null);
  const [lecturaAns, setLecturaAns] = useState(null);
  const [diarioTexto, setDiarioTexto] = useState("");
  const [diarioResultado, setDiarioResultado] = useState(null);
  const [diarioLoading, setDiarioLoading] = useState(false);
  const [cierreMsg, setCierreMsg] = useState("");
  const [cierreLoading, setCierreLoading] = useState(false);
  const [tiempoInicio] = useState(Date.now());

  // ── Preparar sesión ──
  function iniciarSesion() {
    // SRS: hasta 5 tarjetas urgentes
    const due = db.vocabulario.filter(w => {
      const p = progresoMap[w.id];
      return p?.guardada && isDue(p.proximo_repaso);
    }).sort(() => Math.random() - 0.5).slice(0, 5);
    // Si hay menos de 2, completar con palabras guardadas recientes
    const extras = due.length < 2
      ? db.vocabulario.filter(w => progresoMap[w.id]?.guardada && !isDue(progresoMap[w.id]?.proximo_repaso))
          .slice(0, 3 - due.length)
      : [];
    setSrsCards([...due, ...extras]);
    setSrsIdx(0); setSrsFlipped(false); setSrsDone([]);
    setFase("srs");
  }

  // ── SRS: calificar y avanzar ──
  async function srsRate(quality) {
    const card = srsCards[srsIdx];
    const prog = progresoMap[card.id];
    const prev = { intervalo_dias: prog?.intervalo_dias||1, repeticiones: prog?.repeticiones||0, ease_factor: prog?.ease_factor||2.5 };
    const next = getNextSRS(quality, prev.intervalo_dias, prev.repeticiones, prev.ease_factor);
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + next.interval);
    setSaving(true);
    try {
      const fields = {
        palabra_id: card.id, guardada: true,
        repeticiones: next.repetitions, intervalo_dias: next.interval,
        ease_factor: Number(next.easeFactor.toFixed(2)),
        proximo_repaso: nextDate.toISOString().split("T")[0],
        ultima_calidad: quality,
      };
      if (prog) await api.update("progreso_usuario", prog.id, fields);
      else await api.upsert("progreso_usuario", fields);
      markActivity();
      await refreshProgreso();
    } catch(e) { console.error(e); }
    setSaving(false);
    setSrsDone(d => [...d, { word: card, quality }]);
    if (srsIdx + 1 >= srsCards.length) {
      // Avanzar a lectura
      prepararLectura();
    } else {
      setSrsIdx(i => i + 1);
      setSrsFlipped(false);
    }
  }

  // ── Preparar lectura + quiz ──
  function prepararLectura() {
    // Escoger texto del nivel más bajo disponible
    const textos = db.lecturas.filter(l => l.activa);
    if (textos.length === 0) { setFase("diario"); return; }
    const idx = Math.floor(Math.random() * Math.min(3, textos.length));
    const texto = textos[idx];
    // Extraer palabras del glosario para quiz
    let glosario = {};
    try { glosario = JSON.parse(texto.glosario_json || "{}"); } catch {}
    const entries = Object.entries(glosario);
    if (entries.length > 0) {
      const [it, es] = entries[Math.floor(Math.random() * entries.length)];
      // Generar 4 opciones (1 correcta + 3 distractores)
      const distractores = entries.filter(([k]) => k !== it).sort(() => Math.random()-0.5).slice(0,3).map(([,v])=>v);
      const opciones = [...distractores, es].sort(() => Math.random()-0.5);
      setLecturaQuiz({ it, es, opciones, textoId: texto.id, texto });
    } else {
      setLecturaQuiz({ texto, noQuiz: true });
    }
    setLecturaIdx(idx);
    setLecturaAns(null);
    setFase("lectura");
  }

  // ── Corrección de diario ──
  async function corregirDiario() {
    if (diarioTexto.trim().length < 20 || diarioLoading) return;
    setDiarioLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:500,
          messages:[{ role:"user", content:`Eres un profesor de italiano. El alumno (hispanohablante A0→B1) escribió:
"${diarioTexto.trim()}"

Responde SOLO con JSON válido:
{"nivel_estimado":"A0|A1|A2|B1","evaluacion_general":"frase breve en español","texto_corregido":"versión corregida completa","errores":[{"original":"fragmento","correcto":"corrección","explicacion":"max 10 palabras en español"}]}` }],
        }),
      });
      const data = await res.json();
      const txt = data.content?.map(b=>b.text||"").join("").trim();
      const clean = txt.replace(/```json|```/g,"").trim();
      setDiarioResultado(JSON.parse(clean));
      // Guardar en Supabase si es posible
      try {
        await api.create("diario_entradas", {
          texto_usuario: diarioTexto.trim(),
          correccion_json: JSON.parse(clean),
        });
      } catch(_) {}
      markActivity();
    } catch(e) { setDiarioResultado({ error: true }); }
    setDiarioLoading(false);
  }

  // ── Cierre con IA ──
  async function generarCierre() {
    setFase("cierre");
    setCierreLoading(true);
    const mins = Math.round((Date.now() - tiempoInicio) / 60000);
    const srsAciertos = srsDone.filter(r => r.quality >= 4).length;
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:150,
          messages:[{ role:"user", content:`Eres un tutor entusiasta de italiano. El alumno completó una sesión de práctica mixta:
- Repasos SRS: ${srsDone.length} tarjetas, ${srsAciertos} acertadas
- Lectura: completó un texto graduado con quiz
- Diario: escribió en italiano y recibió corrección
- Tiempo total: ~${mins} minutos

Escribe un mensaje de cierre motivacional en español de 3 frases máximo. Incluye UNA frase corta en italiano al final como despedida. Sé cálido y específico con los logros de hoy.` }],
        }),
      });
      const data = await res.json();
      const txt = data.content?.map(b=>b.text||"").join("").trim();
      if (txt) setCierreMsg(txt);
    } catch { setCierreMsg("¡Sessione completata! Ogni giorno in italiano ti acerca más a tu meta. Forza!"); }
    setCierreLoading(false);
  }

  const tiempoMin = Math.round((Date.now() - tiempoInicio) / 60000);

  // ── FASE INTRO ──
  if (fase === "intro") return (
    <div style={{ fontFamily:C.sans }} className="it-fade-in">
      <div style={{ marginBottom:22 }}>
        <div style={{ fontSize:9, color:C.gold, letterSpacing:"0.3em", fontWeight:700, textTransform:"uppercase", marginBottom:6 }}>Sesión Mezcla · Interleaving</div>
        <h2 style={{ fontSize:22, color:C.text, margin:"0 0 6px", fontFamily:C.serif, fontWeight:400 }}>La Sesión Perfecta</h2>
        <div style={{ width:36, height:1, background:C.gold, opacity:0.5, marginBottom:12 }}/>
        <p style={{ fontSize:13, color:C.textMid, lineHeight:1.7, margin:0 }}>
          La ciencia demuestra que <strong style={{color:C.gold}}>mezclar habilidades en una sesión</strong> produce mejor retención que practicar una sola cosa.
          Esta sesión combina las 4 actividades más efectivas en ~20 minutos.
        </p>
      </div>

      {/* Fases de la sesión */}
      <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:24 }}>
        {[
          { n:1, icon:"refresh", color:C.green, label:"Repasos SRS", desc:"Revisa hasta 5 tarjetas con algoritmo SM-2" },
          { n:2, icon:"menu_book", color:C.blue, label:"Lectura + Quiz", desc:"Lee un texto graduado y responde una pregunta de vocabulario" },
          { n:3, icon:"edit_note", color:C.gold, label:"Mini Diario", desc:"Escribe 2-3 frases en italiano · corrección inmediata por IA" },
          { n:4, icon:"celebration", color:C.pink, label:"Cierre con IA", desc:"Resumen personalizado de tu sesión de hoy" },
        ].map(f => (
          <div key={f.n} style={{ display:"flex", gap:14, alignItems:"center", background:C.bg2, border:`1px solid ${f.color}22`, borderRadius:13, padding:"13px 16px" }}>
            <div style={{ width:32, height:32, borderRadius:"50%", background:f.color+"18", border:`1px solid ${f.color}44`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <MIcon name={f.icon} size={16} color={f.color} />
            </div>
            <div>
              <div style={{ fontSize:13, color:C.text, fontWeight:600 }}>{f.n}. {f.label}</div>
              <div style={{ fontSize:11, color:C.hint, marginTop:2 }}>{f.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Principio científico */}
      <div style={{ background:`${C.gold}08`, border:`1px solid ${C.gold}22`, borderRadius:12, padding:"12px 16px", marginBottom:24 }}>
        <div style={{ fontSize:10, color:C.gold, fontWeight:700, marginBottom:4, textTransform:"uppercase", letterSpacing:0.5 }}>🔬 Ciencia detrás</div>
        <div style={{ fontSize:12, color:C.textMid, lineHeight:1.6 }}>
          El <em>interleaving</em> (práctica intercalada) produce hasta <strong style={{color:C.gold}}>2x mejor retención</strong> a largo plazo que practicar un solo tema en bloque — Kornell & Bjork, 2008.
        </div>
      </div>

      <button onClick={iniciarSesion} style={{ width:"100%", background:`${C.gold}18`, border:`1px solid ${C.gold}55`, borderRadius:12, padding:"15px", cursor:"pointer", color:C.gold, fontSize:15, fontWeight:700, fontFamily:C.sans, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
        <MIcon name="play_circle" fill={1} size={20} color={C.gold} />
        Iniciar sesión · ~20 min
      </button>
    </div>
  );

  // ── FASE SRS ──
  if (fase === "srs") {
    if (srsCards.length === 0) {
      return (
        <div style={{ fontFamily:C.sans, textAlign:"center", padding:"40px 0" }} className="it-fade-in">
          <div style={{ fontSize:36, marginBottom:12 }}>✅</div>
          <div style={{ fontSize:15, color:C.green, fontFamily:C.serif }}>No hay repasos pendientes hoy</div>
          <div style={{ fontSize:13, color:C.muted, marginTop:6 }}>¡Tu SRS está al día! Pasamos a lectura.</div>
          <button onClick={prepararLectura} style={{ marginTop:20, background:`${C.blue}18`, border:`1px solid ${C.blue}`, borderRadius:10, padding:"11px 24px", cursor:"pointer", color:C.blue, fontWeight:700, fontFamily:C.sans }}>Continuar → Lectura</button>
        </div>
      );
    }
    const card = srsCards[srsIdx];
    const prog = progresoMap[card.id];
    return (
      <div style={{ fontFamily:C.sans }} className="it-fade-in">
        {/* Progress bar de la sesión */}
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:18 }}>
          <div style={{ flex:1 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
              <span style={{ fontSize:10, color:C.green, fontWeight:700, textTransform:"uppercase", letterSpacing:0.5 }}>Fase 1/4 · Repasos</span>
              <span style={{ fontSize:10, color:C.muted }}>{srsIdx+1}/{srsCards.length}</span>
            </div>
            <div style={{ height:4, background:C.bg4, borderRadius:2 }}>
              <div style={{ height:"100%", background:C.green, borderRadius:2, width:`${((srsIdx)/(srsCards.length))*100}%`, transition:"width 0.3s" }}/>
            </div>
          </div>
        </div>

        <div className="it-glass" style={{ borderRadius:18, padding:28, marginBottom:16, textAlign:"center", minHeight:180, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:12 }}>
          {!srsFlipped ? (
            <>
              <div style={{ fontSize:11, color:C.muted, letterSpacing:1, textTransform:"uppercase", marginBottom:4 }}>¿En italiano?</div>
              <div style={{ fontSize:22, color:C.text, fontFamily:C.serif, lineHeight:1.4 }}>{card.traduccion_es}</div>
              {card.categoria && <Tag color={C.blue}>{card.categoria}</Tag>}
              <button onClick={()=>setSrsFlipped(true)} style={{ marginTop:8, background:`${C.gold}18`, border:`1px solid ${C.gold}44`, borderRadius:10, padding:"10px 24px", cursor:"pointer", color:C.gold, fontWeight:700, fontFamily:C.sans }}>
                Ver respuesta
              </button>
            </>
          ) : (
            <>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ fontSize:22, color:C.gold, fontStyle:"italic", fontFamily:C.serif }}>{card.palabra_it}</div>
                <SpeakBtn text={card.palabra_it} color={C.gold} />
              </div>
              {card.ejemplo && (
                <div style={{ fontSize:13, color:C.textMid, fontStyle:"italic", fontFamily:C.serif, borderTop:`1px solid ${C.border}`, paddingTop:10 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6, justifyContent:"center" }}>
                    <span>{card.ejemplo}</span>
                    <SpeakBtn text={card.ejemplo} size={24} />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {srsFlipped && (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,minmax(0,1fr))", gap:6 }}>
            {[
              { q:2, label:"Mal", color:C.pink },
              { q:3, label:"Regular", color:"#e07840" },
              { q:4, label:"Bien", color:C.blue },
              { q:5, label:"Perfecto", color:C.green },
            ].map(btn => (
              <button key={btn.q} onClick={()=>!saving&&srsRate(btn.q)} disabled={saving} style={{
                background:`${btn.color}14`, border:`1px solid ${btn.color}55`,
                borderRadius:10, padding:"11px 2px", cursor:saving?"default":"pointer",
                color:btn.color, fontWeight:700, fontSize:11, fontFamily:C.sans, transition:"all 0.15s",
                whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis",
              }}>{btn.label}</button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── FASE LECTURA ──
  if (fase === "lectura" && lecturaQuiz) {
    const { texto, it, es, opciones, noQuiz } = lecturaQuiz;
    const paragraphs = (texto?.texto || "").split("\n\n").slice(0,2); // Solo primeros 2 párrafos
    return (
      <div style={{ fontFamily:C.sans }} className="it-fade-in">
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
          <div style={{ flex:1 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
              <span style={{ fontSize:10, color:C.blue, fontWeight:700, textTransform:"uppercase", letterSpacing:0.5 }}>Fase 2/4 · Lectura</span>
            </div>
            <div style={{ height:4, background:C.bg4, borderRadius:2 }}>
              <div style={{ height:"100%", background:C.blue, borderRadius:2, width:"50%" }}/>
            </div>
          </div>
        </div>

        <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:12 }}>
          <div style={{ fontSize:24 }}>{texto?.emoji}</div>
          <div>
            <div style={{ fontSize:15, color:C.text, fontFamily:C.serif }}>{texto?.titulo}</div>
            <Tag color={C.blue}>{texto?.nivel}</Tag>
          </div>
        </div>

        <div className="it-glass" style={{ borderRadius:14, padding:20, marginBottom:16, lineHeight:2, fontSize:14, fontFamily:C.serif, color:C.text }}>
          {paragraphs.map((p, i) => <p key={i} style={{ margin:i>0?"12px 0 0":0 }}>{p}</p>)}
          {(texto?.texto||"").split("\n\n").length > 2 && (
            <div style={{ fontSize:11, color:C.hint, marginTop:8, fontStyle:"italic", fontFamily:C.sans }}>Texto completo disponible en módulo Leer →</div>
          )}
        </div>

        {!noQuiz && (
          <div style={{ background:C.bg2, border:`1px solid ${C.border}`, borderRadius:14, padding:16, marginBottom:16 }}>
            <div style={{ fontSize:11, color:C.gold, fontWeight:700, marginBottom:10, textTransform:"uppercase", letterSpacing:0.5 }}>🧠 Quiz rápido</div>
            <div style={{ fontSize:14, color:C.text, marginBottom:12 }}>¿Qué significa <em style={{color:C.gold, fontFamily:C.serif}}>{it}</em>?</div>
            <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
              {opciones.map((op, i) => {
                const sel = lecturaAns === op;
                const correct = lecturaAns && op === es;
                const wrong = lecturaAns && sel && op !== es;
                return (
                  <button key={i} onClick={()=>!lecturaAns&&setLecturaAns(op)} style={{
                    background:correct?`${C.green}18`:wrong?`${C.pink}18`:sel?`${C.blue}18`:C.bg3,
                    border:`1px solid ${correct?C.green:wrong?C.pink:sel?C.blue:C.border}`,
                    borderRadius:9, padding:"10px 14px", cursor:lecturaAns?"default":"pointer",
                    color:correct?C.green:wrong?C.pink:sel?C.blue:C.text, fontSize:13, fontFamily:C.sans, textAlign:"left",
                    transition:"all 0.15s",
                  }}>{op}</button>
                );
              })}
            </div>
            {lecturaAns && (
              <div style={{ marginTop:10, fontSize:12, color:lecturaAns===es?C.green:C.pink }}>
                {lecturaAns===es ? "✅ ¡Correcto!" : `❌ Era: "${es}"`}
              </div>
            )}
          </div>
        )}

        <button onClick={()=>setFase("diario")} disabled={!noQuiz && !lecturaAns} style={{
          width:"100%", background:(!noQuiz && !lecturaAns)?C.bg3:`${C.gold}18`,
          border:`1px solid ${(!noQuiz && !lecturaAns)?C.border:C.gold}55`,
          borderRadius:12, padding:"13px", cursor:(!noQuiz && !lecturaAns)?"default":"pointer",
          color:(!noQuiz && !lecturaAns)?C.hint:C.gold, fontWeight:700, fontSize:14, fontFamily:C.sans,
          display:"flex", alignItems:"center", justifyContent:"center", gap:8,
        }}>
          Continuar → Mini Diario
          <MIcon name="arrow_forward" size={16} color={(!noQuiz && !lecturaAns)?C.hint:C.gold} />
        </button>
      </div>
    );
  }

  // ── FASE DIARIO ──
  if (fase === "diario") return (
    <div style={{ fontFamily:C.sans }} className="it-fade-in">
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:18 }}>
        <div style={{ flex:1 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
            <span style={{ fontSize:10, color:C.gold, fontWeight:700, textTransform:"uppercase", letterSpacing:0.5 }}>Fase 3/4 · Mini Diario</span>
          </div>
          <div style={{ height:4, background:C.bg4, borderRadius:2 }}>
            <div style={{ height:"100%", background:C.gold, borderRadius:2, width:"75%" }}/>
          </div>
        </div>
      </div>

      <div style={{ background:`${C.gold}08`, border:`1px solid ${C.gold}22`, borderRadius:12, padding:"11px 14px", marginBottom:14 }}>
        <div style={{ fontSize:13, color:C.textMid }}>✍️ Escribe 2-3 frases en italiano sobre cualquier tema — tu día, algo que aprendiste, lo que te gusta de Italia.</div>
      </div>

      {!diarioResultado ? (
        <>
          <textarea
            value={diarioTexto}
            onChange={e=>setDiarioTexto(e.target.value.slice(0,400))}
            placeholder="Oggi ho... / Mi piace... / In Italia voglio..."
            style={{ width:"100%", boxSizing:"border-box", background:C.bg3, border:`1px solid ${C.border}`,
              borderRadius:12, padding:"14px 16px", color:C.text, fontSize:14, fontFamily:C.serif,
              lineHeight:1.8, resize:"none", outline:"none", minHeight:120, marginBottom:10 }}
          />
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {["Oggi ho...", "Mi piace...", "Questo weekend..."].map(p => (
                <button key={p} onClick={()=>!diarioTexto&&setDiarioTexto(p)}
                  style={{ background:C.bg2, border:`1px solid ${C.border}`, borderRadius:20, padding:"3px 10px", cursor:"pointer", color:C.hint, fontSize:11, fontFamily:C.serif }}>
                  {p}
                </button>
              ))}
            </div>
            <span style={{ fontSize:11, color:diarioTexto.length<20?C.pink:C.hint }}>{diarioTexto.length}/400</span>
          </div>
          <button onClick={corregirDiario} disabled={diarioTexto.trim().length < 20 || diarioLoading} style={{
            width:"100%", background:diarioTexto.trim().length>=20?`${C.gold}18`:C.bg3,
            border:`1px solid ${diarioTexto.trim().length>=20?C.gold+"55":C.border}`,
            borderRadius:12, padding:"13px", cursor:diarioTexto.trim().length<20||diarioLoading?"default":"pointer",
            color:diarioTexto.trim().length>=20?C.gold:C.hint, fontWeight:700, fontSize:14, fontFamily:C.sans,
            display:"flex", alignItems:"center", justifyContent:"center", gap:8,
          }}>
            {diarioLoading ? <><Loader size={14}/> Corrigiendo...</> : <><MIcon name="check_circle" size={16} color={diarioTexto.trim().length>=20?C.gold:C.hint} /> Corregir y continuar</>}
          </button>
        </>
      ) : diarioResultado.error ? (
        <div style={{ textAlign:"center", padding:"20px 0" }}>
          <div style={{ color:C.muted, marginBottom:16 }}>No se pudo conectar con la IA. ¡Pero tu escritura cuenta igual!</div>
          <button onClick={generarCierre} style={{ background:`${C.pink}18`, border:`1px solid ${C.pink}`, borderRadius:10, padding:"11px 24px", cursor:"pointer", color:C.pink, fontWeight:700, fontFamily:C.sans }}>
            Continuar → Cierre
          </button>
        </div>
      ) : (
        <div className="it-fade-in">
          <div style={{ background:C.bg2, border:`1px solid ${C.gold}33`, borderRadius:14, padding:16, marginBottom:12 }}>
            <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:10 }}>
              <Tag color={C.gold}>{diarioResultado.nivel_estimado || "A1"}</Tag>
              <span style={{ fontSize:13, color:C.textMid }}>{diarioResultado.evaluacion_general}</span>
            </div>
            {diarioResultado.texto_corregido && (
              <div style={{ background:C.bg3, borderRadius:10, padding:12, marginBottom:10 }}>
                <div style={{ fontSize:10, color:C.green, fontWeight:700, marginBottom:6, textTransform:"uppercase", letterSpacing:0.5 }}>✅ Versión corregida</div>
                <div style={{ fontSize:13, color:C.text, fontFamily:C.serif, lineHeight:1.7 }}>{diarioResultado.texto_corregido}</div>
              </div>
            )}
            {diarioResultado.errores?.length > 0 && (
              <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                {diarioResultado.errores.map((e, i) => (
                  <div key={i} style={{ background:`${C.pink}08`, border:`1px solid ${C.pink}22`, borderRadius:9, padding:"9px 12px" }}>
                    <div style={{ display:"flex", gap:6, alignItems:"center", flexWrap:"wrap", marginBottom:3 }}>
                      <span style={{ fontSize:12, color:C.pink, textDecoration:"line-through", fontFamily:C.serif }}>{e.original}</span>
                      <span style={{ fontSize:10, color:C.hint }}>→</span>
                      <span style={{ fontSize:12, color:C.green, fontFamily:C.serif }}>{e.correcto}</span>
                    </div>
                    <div style={{ fontSize:11, color:C.muted }}>{e.explicacion}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button onClick={generarCierre} style={{ width:"100%", background:`${C.pink}18`, border:`1px solid ${C.pink}55`, borderRadius:12, padding:"13px", cursor:"pointer", color:C.pink, fontWeight:700, fontSize:14, fontFamily:C.sans, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
            <MIcon name="celebration" size={16} color={C.pink} />
            Finalizar sesión
          </button>
        </div>
      )}
    </div>
  );

  // ── FASE CIERRE ──
  if (fase === "cierre") return (
    <div style={{ fontFamily:C.sans, textAlign:"center" }} className="it-fade-in">
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
        <div style={{ flex:1 }}>
          <div style={{ height:4, background:C.gold, borderRadius:2 }}/>
        </div>
      </div>

      <div style={{ fontSize:44, marginBottom:12 }}>🏆</div>
      <div style={{ fontSize:22, color:C.gold, fontFamily:C.serif, marginBottom:6 }}>Sessione completata!</div>
      <div style={{ fontSize:13, color:C.muted, marginBottom:24 }}>{tiempoMin} min · 4 fases completadas</div>

      {/* Resumen de la sesión */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(2,minmax(0,1fr))", gap:8, marginBottom:20, textAlign:"left" }}>
        {[
          { icon:"refresh", color:C.green, label:"Repasos SRS", val:`${srsDone.filter(r=>r.quality>=4).length}/${srsDone.length} correctas` },
          { icon:"menu_book", color:C.blue, label:"Lectura", val:lecturaQuiz?.texto?.titulo ? "Completada ✓" : "Sin texto" },
          { icon:"edit_note", color:C.gold, label:"Diario", val:diarioResultado && !diarioResultado.error ? `${diarioResultado.errores?.length||0} correcciones` : "Escrito ✓" },
          { icon:"timer", color:C.pink, label:"Tiempo", val:`~${tiempoMin} minutos` },
        ].map(s => (
          <div key={s.label} style={{ background:C.bg2, border:`1px solid ${s.color}22`, borderRadius:12, padding:"12px 14px", minWidth:0 }}>
            <div style={{ display:"flex", gap:6, alignItems:"center", marginBottom:4, minWidth:0 }}>
              <MIcon name={s.icon} size={14} color={s.color} />
              <span style={{ fontSize:10, color:s.color, fontWeight:700, textTransform:"uppercase", letterSpacing:0.5, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{s.label}</span>
            </div>
            <div style={{ fontSize:13, color:C.textMid, overflow:"hidden", textOverflow:"ellipsis" }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Mensaje IA */}
      <div className="it-glass" style={{ borderRadius:14, padding:20, marginBottom:20, textAlign:"left" }}>
        {cierreLoading ? (
          <div style={{ display:"flex", alignItems:"center", gap:8, color:C.muted }}>
            <Loader size={14}/> <span style={{fontSize:13}}>Generando tu resumen...</span>
          </div>
        ) : (
          <div style={{ fontSize:14, color:C.text, lineHeight:1.7, fontFamily:C.serif }}>{cierreMsg}</div>
        )}
      </div>

      <button onClick={()=>{ setFase("intro"); setSrsDone([]); setDiarioTexto(""); setDiarioResultado(null); setCierreMsg(""); }} style={{ width:"100%", background:`${C.gold}18`, border:`1px solid ${C.gold}55`, borderRadius:12, padding:"13px", cursor:"pointer", color:C.gold, fontWeight:700, fontSize:14, fontFamily:C.sans }}>
        Nueva sesión mañana 🌅
      </button>
    </div>
  );

  return null;
}


// ─── MEZCLA AVANZADA MODULE (v22) ──────────────────────────────────────────────
function MezclaAvanzadaModule({ db, progresoMap, refreshProgreso }) {
  const [fase, setFase] = useState("intro"); // intro | srs | gramatica | lectura | diario | cierre
  const [srsIdx, setSrsIdx] = useState(0);
  const [srsCards, setSrsCards] = useState([]);
  const [srsFlipped, setSrsFlipped] = useState(false);
  const [srsDone, setSrsDone] = useState([]);
  const [saving, setSaving] = useState(false);
  const [lecturaIdx, setLecturaIdx] = useState(0);
  const [lecturaWord, setLecturaWord] = useState(null);
  const [lecturaQuiz, setLecturaQuiz] = useState(null);
  const [lecturaAns, setLecturaAns] = useState(null);
  const [diarioTexto, setDiarioTexto] = useState("");
  const [diarioResultado, setDiarioResultado] = useState(null);
  const [diarioLoading, setDiarioLoading] = useState(false);
  const [cierreMsg, setCierreMsg] = useState("");
  const [cierreLoading, setCierreLoading] = useState(false);
  const [tiempoInicio] = useState(Date.now());
  const [gramEjercicio, setGramEjercicio] = useState(null);
  const [gramInput, setGramInput] = useState("");
  const [gramChecked, setGramChecked] = useState(false);

  // ── Preparar sesión ──
  function iniciarSesion() {
    // SRS: hasta 5 tarjetas urgentes
    const due = db.vocabulario.filter(w => {
      const p = progresoMap[w.id];
      return p?.guardada && isDue(p.proximo_repaso);
    }).sort(() => Math.random() - 0.5).slice(0, 5);
    // Si hay menos de 2, completar con palabras guardadas recientes
    const extras = due.length < 2
      ? db.vocabulario.filter(w => progresoMap[w.id]?.guardada && !isDue(progresoMap[w.id]?.proximo_repaso))
          .slice(0, 3 - due.length)
      : [];
    setSrsCards([...due, ...extras]);
    setSrsIdx(0); setSrsFlipped(false); setSrsDone([]);
    setFase("srs");
  }

  // ── SRS: calificar y avanzar ──
  async function srsRate(quality) {
    const card = srsCards[srsIdx];
    const prog = progresoMap[card.id];
    const prev = { intervalo_dias: prog?.intervalo_dias||1, repeticiones: prog?.repeticiones||0, ease_factor: prog?.ease_factor||2.5 };
    const next = getNextSRS(quality, prev.intervalo_dias, prev.repeticiones, prev.ease_factor);
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + next.interval);
    setSaving(true);
    try {
      const fields = {
        palabra_id: card.id, guardada: true,
        repeticiones: next.repetitions, intervalo_dias: next.interval,
        ease_factor: Number(next.easeFactor.toFixed(2)),
        proximo_repaso: nextDate.toISOString().split("T")[0],
        ultima_calidad: quality,
      };
      if (prog) await api.update("progreso_usuario", prog.id, fields);
      else await api.upsert("progreso_usuario", fields);
      markActivity();
      await refreshProgreso();
    } catch(e) { console.error(e); }
    setSaving(false);
    setSrsDone(d => [...d, { word: card, quality }]);
    if (srsIdx + 1 >= srsCards.length) {
      // Avanzar a gramática
      prepararGramatica();
    } else {
      setSrsIdx(i => i + 1);
      setSrsFlipped(false);
    }
  }

  // ── Preparar ejercicio de gramática ──
  function prepararGramatica() {
    const ej = GRAMMAR_EXERCISES[Math.floor(Math.random() * GRAMMAR_EXERCISES.length)];
    const verbo = GRAMMAR_VERBS.find(v => v.infinitive === ej.verb);
    setGramEjercicio({ ...ej, verbo });
    setGramInput(""); setGramChecked(false);
    setFase("gramatica");
  }

  // ── Preparar lectura + quiz ──
  function prepararLectura() {
    // Escoger texto del nivel más bajo disponible
    const textos = db.lecturas.filter(l => l.activa);
    if (textos.length === 0) { setFase("diario"); return; }
    const idx = Math.floor(Math.random() * Math.min(3, textos.length));
    const texto = textos[idx];
    // Extraer palabras del glosario para quiz
    let glosario = {};
    try { glosario = JSON.parse(texto.glosario_json || "{}"); } catch {}
    const entries = Object.entries(glosario);
    if (entries.length > 0) {
      const [it, es] = entries[Math.floor(Math.random() * entries.length)];
      // Generar 4 opciones (1 correcta + 3 distractores)
      const distractores = entries.filter(([k]) => k !== it).sort(() => Math.random()-0.5).slice(0,3).map(([,v])=>v);
      const opciones = [...distractores, es].sort(() => Math.random()-0.5);
      setLecturaQuiz({ it, es, opciones, textoId: texto.id, texto });
    } else {
      setLecturaQuiz({ texto, noQuiz: true });
    }
    setLecturaIdx(idx);
    setLecturaAns(null);
    setFase("lectura");
  }

  // ── Corrección de diario ──
  async function corregirDiario() {
    if (diarioTexto.trim().length < 20 || diarioLoading) return;
    setDiarioLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:500,
          messages:[{ role:"user", content:`Eres un profesor de italiano. El alumno (hispanohablante A0→B1) escribió:
"${diarioTexto.trim()}"
${gramEjercicio ? `\nEl reto de esta sesión era usar el verbo "${gramEjercicio.verb}" (ej. forma "${gramEjercicio.answer}"). Indica en "uso_verbo_objetivo" si lo usó correctamente (true/false) y en "nota_verbo_objetivo" una frase breve en español al respecto (o null si no aplica).` : ''}

Responde SOLO con JSON válido:
{"nivel_estimado":"A0|A1|A2|B1","evaluacion_general":"frase breve en español","texto_corregido":"versión corregida completa","errores":[{"original":"fragmento","correcto":"corrección","explicacion":"max 10 palabras en español"}]${gramEjercicio ? ',"uso_verbo_objetivo":true,"nota_verbo_objetivo":"texto o null"' : ''}}` }],
        }),
      });
      const data = await res.json();
      const txt = data.content?.map(b=>b.text||"").join("").trim();
      const clean = txt.replace(/```json|```/g,"").trim();
      setDiarioResultado(JSON.parse(clean));
      // Guardar en Supabase si es posible
      try {
        await api.create("diario_entradas", {
          texto_usuario: diarioTexto.trim(),
          correccion_json: JSON.parse(clean),
        });
      } catch(_) {}
      markActivity();
    } catch(e) { setDiarioResultado({ error: true }); }
    setDiarioLoading(false);
  }

  // ── Cierre con IA ──
  async function generarCierre() {
    setFase("cierre");
    setCierreLoading(true);
    const mins = Math.round((Date.now() - tiempoInicio) / 60000);
    const srsAciertos = srsDone.filter(r => r.quality >= 4).length;
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:150,
          messages:[{ role:"user", content:`Eres un tutor entusiasta de italiano. El alumno completó una sesión avanzada de práctica mixta:
- Repasos SRS: ${srsDone.length} tarjetas, ${srsAciertos} acertadas
- Gramática: ejercicio sobre el verbo "${gramEjercicio?.verb||""}" — ${gramInput.trim().toLowerCase()===gramEjercicio?.answer?.toLowerCase() ? "respondido correctamente" : "con un pequeño error, corregido al instante"}
- Lectura: completó un texto graduado con quiz
- Diario: escribió en italiano${diarioResultado?.uso_verbo_objetivo ? ` y logró usar el verbo "${gramEjercicio?.verb}" como se pidió` : ""}, y recibió corrección
- Tiempo total: ~${mins} minutos

Escribe un mensaje de cierre motivacional en español de 3 frases máximo. Incluye UNA frase corta en italiano al final como despedida. Sé cálido y específico con los logros de hoy, mencionando la conexión entre la gramática practicada y su uso en el diario si fue exitosa.` }],
        }),
      });
      const data = await res.json();
      const txt = data.content?.map(b=>b.text||"").join("").trim();
      if (txt) setCierreMsg(txt);
    } catch { setCierreMsg("¡Sessione completata! Ogni giorno in italiano ti acerca más a tu meta. Forza!"); }
    setCierreLoading(false);
  }

  const tiempoMin = Math.round((Date.now() - tiempoInicio) / 60000);

  // ── FASE INTRO ──
  if (fase === "intro") return (
    <div style={{ fontFamily:C.sans }} className="it-fade-in">
      <div style={{ marginBottom:22 }}>
        <div style={{ fontSize:9, color:C.gold, letterSpacing:"0.3em", fontWeight:700, textTransform:"uppercase", marginBottom:6 }}>Mezcla Avanzada · Interleaving + Gramática</div>
        <h2 style={{ fontSize:22, color:C.text, margin:"0 0 6px", fontFamily:C.serif, fontWeight:400 }}>La Sesión Completa</h2>
        <div style={{ width:36, height:1, background:C.gold, opacity:0.5, marginBottom:12 }}/>
        <p style={{ fontSize:13, color:C.textMid, lineHeight:1.7, margin:0 }}>
          La ciencia demuestra que <strong style={{color:C.gold}}>mezclar habilidades en una sesión</strong> produce mejor retención que practicar una sola cosa.
          Esta versión avanzada combina 5 actividades — incluyendo gramática — en ~25 minutos.
        </p>
      </div>

      {/* Fases de la sesión */}
      <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:24 }}>
        {[
          { n:1, icon:"refresh", color:C.green, label:"Repasos SRS", desc:"Revisa hasta 5 tarjetas con algoritmo SM-2" },
          { n:2, icon:"rule", color:"#a78bfa", label:"Gramática", desc:"Un ejercicio de conjugación de los verbos core" },
          { n:3, icon:"menu_book", color:C.blue, label:"Lectura + Quiz", desc:"Lee un texto graduado y responde una pregunta de vocabulario" },
          { n:4, icon:"edit_note", color:C.gold, label:"Mini Diario", desc:"Escribe usando el verbo/tiempo de gramática · corrección por IA" },
          { n:5, icon:"celebration", color:C.pink, label:"Cierre con IA", desc:"Resumen personalizado de tu sesión de hoy" },
        ].map(f => (
          <div key={f.n} style={{ display:"flex", gap:14, alignItems:"center", background:C.bg2, border:`1px solid ${f.color}22`, borderRadius:13, padding:"13px 16px" }}>
            <div style={{ width:32, height:32, borderRadius:"50%", background:f.color+"18", border:`1px solid ${f.color}44`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <MIcon name={f.icon} size={16} color={f.color} />
            </div>
            <div>
              <div style={{ fontSize:13, color:C.text, fontWeight:600 }}>{f.n}. {f.label}</div>
              <div style={{ fontSize:11, color:C.hint, marginTop:2 }}>{f.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Principio científico */}
      <div style={{ background:`${C.gold}08`, border:`1px solid ${C.gold}22`, borderRadius:12, padding:"12px 16px", marginBottom:24 }}>
        <div style={{ fontSize:10, color:C.gold, fontWeight:700, marginBottom:4, textTransform:"uppercase", letterSpacing:0.5 }}>🔬 Ciencia detrás</div>
        <div style={{ fontSize:12, color:C.textMid, lineHeight:1.6 }}>
          El <em>interleaving</em> (práctica intercalada) produce hasta <strong style={{color:C.gold}}>2x mejor retención</strong> a largo plazo que practicar un solo tema en bloque — Kornell & Bjork, 2008.
        </div>
      </div>

      <button onClick={iniciarSesion} style={{ width:"100%", background:`${C.gold}18`, border:`1px solid ${C.gold}55`, borderRadius:12, padding:"15px", cursor:"pointer", color:C.gold, fontSize:15, fontWeight:700, fontFamily:C.sans, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
        <MIcon name="play_circle" fill={1} size={20} color={C.gold} />
        Iniciar sesión avanzada · ~25 min
      </button>
    </div>
  );

  // ── FASE SRS ──
  if (fase === "srs") {
    if (srsCards.length === 0) {
      return (
        <div style={{ fontFamily:C.sans, textAlign:"center", padding:"40px 0" }} className="it-fade-in">
          <div style={{ fontSize:36, marginBottom:12 }}>✅</div>
          <div style={{ fontSize:15, color:C.green, fontFamily:C.serif }}>No hay repasos pendientes hoy</div>
          <div style={{ fontSize:13, color:C.muted, marginTop:6 }}>¡Tu SRS está al día! Pasamos a lectura.</div>
          <button onClick={prepararGramatica} style={{ marginTop:20, background:`${C.blue}18`, border:`1px solid ${C.blue}`, borderRadius:10, padding:"11px 24px", cursor:"pointer", color:C.blue, fontWeight:700, fontFamily:C.sans }}>Continuar → Gramática</button>
        </div>
      );
    }
    const card = srsCards[srsIdx];
    const prog = progresoMap[card.id];
    return (
      <div style={{ fontFamily:C.sans }} className="it-fade-in">
        {/* Progress bar de la sesión */}
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:18 }}>
          <div style={{ flex:1 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
              <span style={{ fontSize:10, color:C.green, fontWeight:700, textTransform:"uppercase", letterSpacing:0.5 }}>Fase 1/5 · Repasos</span>
              <span style={{ fontSize:10, color:C.muted }}>{srsIdx+1}/{srsCards.length}</span>
            </div>
            <div style={{ height:4, background:C.bg4, borderRadius:2 }}>
              <div style={{ height:"100%", background:C.green, borderRadius:2, width:`${((srsIdx)/(srsCards.length))*100}%`, transition:"width 0.3s" }}/>
            </div>
          </div>
        </div>

        <div className="it-glass" style={{ borderRadius:18, padding:28, marginBottom:16, textAlign:"center", minHeight:180, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:12 }}>
          {!srsFlipped ? (
            <>
              <div style={{ fontSize:11, color:C.muted, letterSpacing:1, textTransform:"uppercase", marginBottom:4 }}>¿En italiano?</div>
              <div style={{ fontSize:22, color:C.text, fontFamily:C.serif, lineHeight:1.4 }}>{card.traduccion_es}</div>
              {card.categoria && <Tag color={C.blue}>{card.categoria}</Tag>}
              <button onClick={()=>setSrsFlipped(true)} style={{ marginTop:8, background:`${C.gold}18`, border:`1px solid ${C.gold}44`, borderRadius:10, padding:"10px 24px", cursor:"pointer", color:C.gold, fontWeight:700, fontFamily:C.sans }}>
                Ver respuesta
              </button>
            </>
          ) : (
            <>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ fontSize:22, color:C.gold, fontStyle:"italic", fontFamily:C.serif }}>{card.palabra_it}</div>
                <SpeakBtn text={card.palabra_it} color={C.gold} />
              </div>
              {card.ejemplo && (
                <div style={{ fontSize:13, color:C.textMid, fontStyle:"italic", fontFamily:C.serif, borderTop:`1px solid ${C.border}`, paddingTop:10 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6, justifyContent:"center" }}>
                    <span>{card.ejemplo}</span>
                    <SpeakBtn text={card.ejemplo} size={24} />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {srsFlipped && (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,minmax(0,1fr))", gap:6 }}>
            {[
              { q:2, label:"Mal", color:C.pink },
              { q:3, label:"Regular", color:"#e07840" },
              { q:4, label:"Bien", color:C.blue },
              { q:5, label:"Perfecto", color:C.green },
            ].map(btn => (
              <button key={btn.q} onClick={()=>!saving&&srsRate(btn.q)} disabled={saving} style={{
                background:`${btn.color}14`, border:`1px solid ${btn.color}55`,
                borderRadius:10, padding:"11px 2px", cursor:saving?"default":"pointer",
                color:btn.color, fontWeight:700, fontSize:11, fontFamily:C.sans, transition:"all 0.15s",
                whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis",
              }}>{btn.label}</button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── FASE GRAMÁTICA ──
  if (fase === "gramatica" && gramEjercicio) {
    const correcto = gramInput.trim().toLowerCase() === gramEjercicio.answer.toLowerCase();
    return (
      <div style={{ fontFamily:C.sans }} className="it-fade-in">
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:18 }}>
          <div style={{ flex:1 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
              <span style={{ fontSize:10, color:"#a78bfa", fontWeight:700, textTransform:"uppercase", letterSpacing:0.5 }}>Fase 2/5 · Gramática</span>
            </div>
            <div style={{ height:4, background:C.bg4, borderRadius:2 }}>
              <div style={{ height:"100%", background:"#a78bfa", borderRadius:2, width:"40%" }}/>
            </div>
          </div>
        </div>

        <div className="it-glass" style={{ borderRadius:14, padding:24, marginBottom:16 }}>
          <div style={{ fontSize:11, color:"#a78bfa", fontWeight:700, marginBottom:10, textTransform:"uppercase", letterSpacing:0.5 }}>
            Verbo: <em style={{fontFamily:C.serif}}>{gramEjercicio.verb}</em> ({gramEjercicio.verbo?.es})
          </div>
          <div style={{ fontSize:17, color:C.text, fontFamily:C.serif, lineHeight:1.8, marginBottom:16 }}>
            {gramEjercicio.sentence.split("___").map((part,i,arr)=>(
              <Frag key={i}>
                {part}
                {i < arr.length-1 && (
                  <input
                    value={gramInput}
                    onChange={e=>!gramChecked && setGramInput(e.target.value)}
                    disabled={gramChecked}
                    style={{
                      width:110, textAlign:"center", fontFamily:C.serif, fontSize:16, fontStyle:"italic",
                      background:C.bg3, border:`1px solid ${gramChecked ? (correcto?C.green:C.pink) : "#a78bfa55"}`,
                      borderRadius:8, padding:"4px 8px", color:gramChecked?(correcto?C.green:C.pink):C.text, outline:"none",
                    }}
                  />
                )}
              </Frag>
            ))}
          </div>

          {gramChecked && (
            <div style={{ background:correcto?`${C.green}0d`:`${C.pink}0d`, border:`1px solid ${correcto?C.green:C.pink}33`, borderRadius:10, padding:"10px 14px", fontSize:13, color:correcto?C.green:C.pink, lineHeight:1.6 }}>
              {correcto ? "✅ ¡Correcto! " : `❌ Era "${gramEjercicio.answer}". `}{gramEjercicio.why}
            </div>
          )}
        </div>

        {!gramChecked ? (
          <button onClick={()=>setGramChecked(true)} disabled={!gramInput.trim()} style={{
            width:"100%", background:gramInput.trim()?`${"#a78bfa"}18`:C.bg3,
            border:`1px solid ${gramInput.trim()?"#a78bfa55":C.border}`,
            borderRadius:12, padding:"13px", cursor:gramInput.trim()?"pointer":"default",
            color:gramInput.trim()?"#a78bfa":C.hint, fontWeight:700, fontSize:14, fontFamily:C.sans,
          }}>Comprobar</button>
        ) : (
          <button onClick={prepararLectura} style={{
            width:"100%", background:`${C.gold}18`, border:`1px solid ${C.gold}55`, borderRadius:12,
            padding:"13px", cursor:"pointer", color:C.gold, fontWeight:700, fontSize:14, fontFamily:C.sans,
            display:"flex", alignItems:"center", justifyContent:"center", gap:8,
          }}>
            Continuar → Lectura <MIcon name="arrow_forward" size={16} color={C.gold} />
          </button>
        )}
      </div>
    );
  }

  // ── FASE LECTURA ──
  if (fase === "lectura" && lecturaQuiz) {
    const { texto, it, es, opciones, noQuiz } = lecturaQuiz;
    const paragraphs = (texto?.texto || "").split("\n\n").slice(0,2); // Solo primeros 2 párrafos
    return (
      <div style={{ fontFamily:C.sans }} className="it-fade-in">
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
          <div style={{ flex:1 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
              <span style={{ fontSize:10, color:C.blue, fontWeight:700, textTransform:"uppercase", letterSpacing:0.5 }}>Fase 3/5 · Lectura</span>
            </div>
            <div style={{ height:4, background:C.bg4, borderRadius:2 }}>
              <div style={{ height:"100%", background:C.blue, borderRadius:2, width:"60%" }}/>
            </div>
          </div>
        </div>

        <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:12 }}>
          <div style={{ fontSize:24 }}>{texto?.emoji}</div>
          <div>
            <div style={{ fontSize:15, color:C.text, fontFamily:C.serif }}>{texto?.titulo}</div>
            <Tag color={C.blue}>{texto?.nivel}</Tag>
          </div>
        </div>

        <div className="it-glass" style={{ borderRadius:14, padding:20, marginBottom:16, lineHeight:2, fontSize:14, fontFamily:C.serif, color:C.text }}>
          {paragraphs.map((p, i) => <p key={i} style={{ margin:i>0?"12px 0 0":0 }}>{p}</p>)}
          {(texto?.texto||"").split("\n\n").length > 2 && (
            <div style={{ fontSize:11, color:C.hint, marginTop:8, fontStyle:"italic", fontFamily:C.sans }}>Texto completo disponible en módulo Leer →</div>
          )}
        </div>

        {!noQuiz && (
          <div style={{ background:C.bg2, border:`1px solid ${C.border}`, borderRadius:14, padding:16, marginBottom:16 }}>
            <div style={{ fontSize:11, color:C.gold, fontWeight:700, marginBottom:10, textTransform:"uppercase", letterSpacing:0.5 }}>🧠 Quiz rápido</div>
            <div style={{ fontSize:14, color:C.text, marginBottom:12 }}>¿Qué significa <em style={{color:C.gold, fontFamily:C.serif}}>{it}</em>?</div>
            <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
              {opciones.map((op, i) => {
                const sel = lecturaAns === op;
                const correct = lecturaAns && op === es;
                const wrong = lecturaAns && sel && op !== es;
                return (
                  <button key={i} onClick={()=>!lecturaAns&&setLecturaAns(op)} style={{
                    background:correct?`${C.green}18`:wrong?`${C.pink}18`:sel?`${C.blue}18`:C.bg3,
                    border:`1px solid ${correct?C.green:wrong?C.pink:sel?C.blue:C.border}`,
                    borderRadius:9, padding:"10px 14px", cursor:lecturaAns?"default":"pointer",
                    color:correct?C.green:wrong?C.pink:sel?C.blue:C.text, fontSize:13, fontFamily:C.sans, textAlign:"left",
                    transition:"all 0.15s",
                  }}>{op}</button>
                );
              })}
            </div>
            {lecturaAns && (
              <div style={{ marginTop:10, fontSize:12, color:lecturaAns===es?C.green:C.pink }}>
                {lecturaAns===es ? "✅ ¡Correcto!" : `❌ Era: "${es}"`}
              </div>
            )}
          </div>
        )}

        <button onClick={()=>setFase("diario")} disabled={!noQuiz && !lecturaAns} style={{
          width:"100%", background:(!noQuiz && !lecturaAns)?C.bg3:`${C.gold}18`,
          border:`1px solid ${(!noQuiz && !lecturaAns)?C.border:C.gold}55`,
          borderRadius:12, padding:"13px", cursor:(!noQuiz && !lecturaAns)?"default":"pointer",
          color:(!noQuiz && !lecturaAns)?C.hint:C.gold, fontWeight:700, fontSize:14, fontFamily:C.sans,
          display:"flex", alignItems:"center", justifyContent:"center", gap:8,
        }}>
          Continuar → Mini Diario
          <MIcon name="arrow_forward" size={16} color={(!noQuiz && !lecturaAns)?C.hint:C.gold} />
        </button>
      </div>
    );
  }

  // ── FASE DIARIO ──
  if (fase === "diario") return (
    <div style={{ fontFamily:C.sans }} className="it-fade-in">
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:18 }}>
        <div style={{ flex:1 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
            <span style={{ fontSize:10, color:C.gold, fontWeight:700, textTransform:"uppercase", letterSpacing:0.5 }}>Fase 4/5 · Mini Diario</span>
          </div>
          <div style={{ height:4, background:C.bg4, borderRadius:2 }}>
            <div style={{ height:"100%", background:C.gold, borderRadius:2, width:"80%" }}/>
          </div>
        </div>
      </div>

      <div style={{ background:`${C.gold}08`, border:`1px solid ${C.gold}22`, borderRadius:12, padding:"11px 14px", marginBottom:14 }}>
        <div style={{ fontSize:13, color:C.textMid }}>✍️ Escribe 2-3 frases en italiano sobre cualquier tema — tu día, algo que aprendiste, lo que te gusta de Italia.</div>
        {gramEjercicio && (
          <div style={{ fontSize:12, color:"#a78bfa", marginTop:8, paddingTop:8, borderTop:`1px solid ${C.gold}15` }}>
            🎯 Reto: usa el verbo <em style={{fontFamily:C.serif}}>{gramEjercicio.verb}</em> (ej. <em style={{fontFamily:C.serif}}>{gramEjercicio.answer}</em>) en alguna frase.
          </div>
        )}
      </div>

      {!diarioResultado ? (
        <>
          <textarea
            value={diarioTexto}
            onChange={e=>setDiarioTexto(e.target.value.slice(0,400))}
            placeholder="Oggi ho... / Mi piace... / In Italia voglio..."
            style={{ width:"100%", boxSizing:"border-box", background:C.bg3, border:`1px solid ${C.border}`,
              borderRadius:12, padding:"14px 16px", color:C.text, fontSize:14, fontFamily:C.serif,
              lineHeight:1.8, resize:"none", outline:"none", minHeight:120, marginBottom:10 }}
          />
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {["Oggi ho...", "Mi piace...", "Questo weekend..."].map(p => (
                <button key={p} onClick={()=>!diarioTexto&&setDiarioTexto(p)}
                  style={{ background:C.bg2, border:`1px solid ${C.border}`, borderRadius:20, padding:"3px 10px", cursor:"pointer", color:C.hint, fontSize:11, fontFamily:C.serif }}>
                  {p}
                </button>
              ))}
            </div>
            <span style={{ fontSize:11, color:diarioTexto.length<20?C.pink:C.hint }}>{diarioTexto.length}/400</span>
          </div>
          <button onClick={corregirDiario} disabled={diarioTexto.trim().length < 20 || diarioLoading} style={{
            width:"100%", background:diarioTexto.trim().length>=20?`${C.gold}18`:C.bg3,
            border:`1px solid ${diarioTexto.trim().length>=20?C.gold+"55":C.border}`,
            borderRadius:12, padding:"13px", cursor:diarioTexto.trim().length<20||diarioLoading?"default":"pointer",
            color:diarioTexto.trim().length>=20?C.gold:C.hint, fontWeight:700, fontSize:14, fontFamily:C.sans,
            display:"flex", alignItems:"center", justifyContent:"center", gap:8,
          }}>
            {diarioLoading ? <><Loader size={14}/> Corrigiendo...</> : <><MIcon name="check_circle" size={16} color={diarioTexto.trim().length>=20?C.gold:C.hint} /> Corregir y continuar</>}
          </button>
        </>
      ) : diarioResultado.error ? (
        <div style={{ textAlign:"center", padding:"20px 0" }}>
          <div style={{ color:C.muted, marginBottom:16 }}>No se pudo conectar con la IA. ¡Pero tu escritura cuenta igual!</div>
          <button onClick={generarCierre} style={{ background:`${C.pink}18`, border:`1px solid ${C.pink}`, borderRadius:10, padding:"11px 24px", cursor:"pointer", color:C.pink, fontWeight:700, fontFamily:C.sans }}>
            Continuar → Cierre
          </button>
        </div>
      ) : (
        <div className="it-fade-in">
          <div style={{ background:C.bg2, border:`1px solid ${C.gold}33`, borderRadius:14, padding:16, marginBottom:12 }}>
            <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:10, flexWrap:"wrap" }}>
              <Tag color={C.gold}>{diarioResultado.nivel_estimado || "A1"}</Tag>
              <span style={{ fontSize:13, color:C.textMid }}>{diarioResultado.evaluacion_general}</span>
            </div>
            {gramEjercicio && diarioResultado.nota_verbo_objetivo && (
              <div style={{ background:diarioResultado.uso_verbo_objetivo?`${C.green}0d`:`${"#a78bfa"}0d`, border:`1px solid ${diarioResultado.uso_verbo_objetivo?C.green:"#a78bfa"}33`, borderRadius:9, padding:"8px 12px", marginBottom:10, fontSize:12, color:diarioResultado.uso_verbo_objetivo?C.green:"#a78bfa" }}>
                🎯 {diarioResultado.nota_verbo_objetivo}
              </div>
            )}
            {diarioResultado.texto_corregido && (
              <div style={{ background:C.bg3, borderRadius:10, padding:12, marginBottom:10 }}>
                <div style={{ fontSize:10, color:C.green, fontWeight:700, marginBottom:6, textTransform:"uppercase", letterSpacing:0.5 }}>✅ Versión corregida</div>
                <div style={{ fontSize:13, color:C.text, fontFamily:C.serif, lineHeight:1.7 }}>{diarioResultado.texto_corregido}</div>
              </div>
            )}
            {diarioResultado.errores?.length > 0 && (
              <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                {diarioResultado.errores.map((e, i) => (
                  <div key={i} style={{ background:`${C.pink}08`, border:`1px solid ${C.pink}22`, borderRadius:9, padding:"9px 12px" }}>
                    <div style={{ display:"flex", gap:6, alignItems:"center", flexWrap:"wrap", marginBottom:3 }}>
                      <span style={{ fontSize:12, color:C.pink, textDecoration:"line-through", fontFamily:C.serif }}>{e.original}</span>
                      <span style={{ fontSize:10, color:C.hint }}>→</span>
                      <span style={{ fontSize:12, color:C.green, fontFamily:C.serif }}>{e.correcto}</span>
                    </div>
                    <div style={{ fontSize:11, color:C.muted }}>{e.explicacion}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button onClick={generarCierre} style={{ width:"100%", background:`${C.pink}18`, border:`1px solid ${C.pink}55`, borderRadius:12, padding:"13px", cursor:"pointer", color:C.pink, fontWeight:700, fontSize:14, fontFamily:C.sans, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
            <MIcon name="celebration" size={16} color={C.pink} />
            Finalizar sesión
          </button>
        </div>
      )}
    </div>
  );

  // ── FASE CIERRE ──
  if (fase === "cierre") return (
    <div style={{ fontFamily:C.sans, textAlign:"center" }} className="it-fade-in">
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
        <div style={{ flex:1 }}>
          <div style={{ height:4, background:C.gold, borderRadius:2 }}/>
        </div>
      </div>

      <div style={{ fontSize:44, marginBottom:12 }}>🏆</div>
      <div style={{ fontSize:22, color:C.gold, fontFamily:C.serif, marginBottom:6 }}>Sessione completata!</div>
      <div style={{ fontSize:13, color:C.muted, marginBottom:24 }}>{tiempoMin} min · 5 fases completadas</div>

      {/* Resumen de la sesión */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(2,minmax(0,1fr))", gap:8, marginBottom:20, textAlign:"left" }}>
        {[
          { icon:"refresh", color:C.green, label:"Repasos SRS", val:`${srsDone.filter(r=>r.quality>=4).length}/${srsDone.length} correctas` },
          { icon:"rule", color:"#a78bfa", label:"Gramática", val:gramEjercicio ? (gramChecked ? (gramInput.trim().toLowerCase()===gramEjercicio.answer.toLowerCase() ? "Correcto ✓" : `Era: ${gramEjercicio.answer}`) : "Completado") : "—" },
          { icon:"menu_book", color:C.blue, label:"Lectura", val:lecturaQuiz?.texto?.titulo ? "Completada ✓" : "Sin texto" },
          { icon:"edit_note", color:C.gold, label:"Diario", val:diarioResultado && !diarioResultado.error ? `${diarioResultado.errores?.length||0} correcciones` : "Escrito ✓" },
          { icon:"timer", color:C.pink, label:"Tiempo", val:`~${tiempoMin} minutos` },
        ].map(s => (
          <div key={s.label} style={{ background:C.bg2, border:`1px solid ${s.color}22`, borderRadius:12, padding:"12px 14px", minWidth:0 }}>
            <div style={{ display:"flex", gap:6, alignItems:"center", marginBottom:4, minWidth:0 }}>
              <MIcon name={s.icon} size={14} color={s.color} />
              <span style={{ fontSize:10, color:s.color, fontWeight:700, textTransform:"uppercase", letterSpacing:0.5, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{s.label}</span>
            </div>
            <div style={{ fontSize:13, color:C.textMid, overflow:"hidden", textOverflow:"ellipsis" }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Mensaje IA */}
      <div className="it-glass" style={{ borderRadius:14, padding:20, marginBottom:20, textAlign:"left" }}>
        {cierreLoading ? (
          <div style={{ display:"flex", alignItems:"center", gap:8, color:C.muted }}>
            <Loader size={14}/> <span style={{fontSize:13}}>Generando tu resumen...</span>
          </div>
        ) : (
          <div style={{ fontSize:14, color:C.text, lineHeight:1.7, fontFamily:C.serif }}>{cierreMsg}</div>
        )}
      </div>

      <button onClick={()=>{ setFase("intro"); setSrsDone([]); setDiarioTexto(""); setDiarioResultado(null); setCierreMsg(""); }} style={{ width:"100%", background:`${C.gold}18`, border:`1px solid ${C.gold}55`, borderRadius:12, padding:"13px", cursor:"pointer", color:C.gold, fontWeight:700, fontSize:14, fontFamily:C.sans }}>
        Nueva sesión mañana 🌅
      </button>
    </div>
  );

  return null;
}


// ─── IMMERSIONE MODULE (v17) ─────────────────────────────────────────────────
// Recursos externos curados por nivel para micro-inmersión diaria
const IMMERSIONE_RECURSOS = [
  // ── A0 ──
  {
    nivel:"A0", color:C.green,
    items:[
      { emoji:"🎵", tipo:"Música", titulo:"Azzurro – Adriano Celentano", desc:"La canción italiana más icónica. Escucha y lee la letra (busca en YouTube).", link:"https://www.youtube.com/results?search_query=azzurro+adriano+celentano", tag:"Escucha" },
      { emoji:"📺", tipo:"Video", titulo:"Italiano In 3 Minuti – YT", desc:"Serie de videos de 3 min con frases cotidianas. Perfecta para A0.", link:"https://www.youtube.com/results?search_query=italiano+in+3+minuti+a0", tag:"Video" },
      { emoji:"📖", tipo:"Lectura", titulo:"Italian Children's Books Online", desc:"Cuentos infantiles italianos gratuitos — ideal como primer input real.", link:"https://www.youtube.com/results?search_query=italian+childrens+books+read+aloud", tag:"Leer" },
    ]
  },
  // ── A1 ──
  {
    nivel:"A1", color:C.blue,
    items:[
      { emoji:"🎙️", tipo:"Podcast", titulo:"Coffee Break Italian – Temporada 1", desc:"El podcast más recomendado para A1. Episodios de 20 min, presentador escocés-italiano.", link:"https://coffeebreaklanguages.com/coffeebreakitalian/", tag:"Podcast" },
      { emoji:"📺", tipo:"Series", titulo:"Extra Italian (YouTube)", desc:"Serie de comedia educativa tipo sitcom para principiantes. Subtítulos en italiano.", link:"https://www.youtube.com/results?search_query=extra+italian+episode+1", tag:"Series" },
      { emoji:"📰", tipo:"Noticias", titulo:"Newsitaliano.it – noticias lentas", desc:"Noticias leídas despacio con vocabulario A1-A2. Audio + transcripción.", link:"https://www.newsitaliano.it/", tag:"Leer" },
      { emoji:"📱", tipo:"App", titulo:"Clozemaster – A1", desc:"Rellena huecos en frases reales italianas. Complementa tu SRS perfectamente.", link:"https://www.clozemaster.com/l/ita-spa", tag:"Practicar" },
    ]
  },
  // ── A2 ──
  {
    nivel:"A2", color:"#9b7fe8",
    items:[
      { emoji:"🎙️", tipo:"Podcast", titulo:"Coffee Break Italian – Temporada 2", desc:"Continúa con la temporada 2 cuando hayas consolidado A1. Gramática en contexto.", link:"https://coffeebreaklanguages.com/coffeebreakitalian/", tag:"Podcast" },
      { emoji:"📺", tipo:"Series", titulo:"Suburra: Sangue sul Tevere (Netflix)", desc:"Serie italiana de crimen ambientada en Roma. Ideal A2 con subtítulos en italiano.", link:"https://www.netflix.com/search?q=suburra", tag:"Series" },
      { emoji:"🌐", tipo:"Web", titulo:"Italiano Bello – Blog y videos", desc:"Blog y canal de YouTube con explicaciones claras de gramática A2.", link:"https://www.italianobello.com/", tag:"Web" },
      { emoji:"📖", tipo:"Lectura", titulo:"Diario di una schiappa (Libro)", desc:"'Diario de Greg' en italiano — lectura graduada divertida para A2.", link:"https://www.amazon.it/s?k=diario+di+una+schiappa", tag:"Libro" },
    ]
  },
  // ── B1 ──
  {
    nivel:"B1", color:C.gold,
    items:[
      { emoji:"🎙️", tipo:"Podcast", titulo:"Italiano con Amore – avanzado", desc:"Podcast para B1/B2 sobre cultura, vida cotidiana y actualidad italiana.", link:"https://www.youtube.com/results?search_query=italiano+con+amore+podcast", tag:"Podcast" },
      { emoji:"📰", tipo:"Periódico", titulo:"La Repubblica", desc:"Periódico italiano de referencia. Lee titulares y noticias cortas cada día.", link:"https://www.repubblica.it/", tag:"Leer" },
      { emoji:"📺", tipo:"Series", titulo:"Boris (Serie RAI)", desc:"La mejor serie de comedia italiana sobre el mundo del cine. Acento romano auténtico.", link:"https://www.raiplay.it/programmi/boris", tag:"Series" },
      { emoji:"📺", tipo:"Series", titulo:"Baby (Netflix)", desc:"Drama adolescente italiano ambientado en Roma. Diálogos naturales B1.", link:"https://www.netflix.com/search?q=baby+italian", tag:"Series" },
      { emoji:"🌐", tipo:"Web", titulo:"Treccani – Vocabolario", desc:"El diccionario italiano más completo y autorizado. Consulta desde B1.", link:"https://www.treccani.it/vocabolario/", tag:"Referencia" },
    ]
  },
];

function ImmersioneModule() {
  const [nivelFiltro, setNivelFiltro] = useState("todos");
  const niveles = ["todos","A0","A1","A2","B1"];
  const nivelColors = { A0:C.green, A1:C.blue, A2:"#9b7fe8", B1:C.gold };
  const tagColors = { Podcast:C.gold, Series:C.pink, Video:C.blue, Leer:C.green, Libro:C.green, Practicar:C.blue, Web:"#9b7fe8", Referencia:C.muted };

  const grupos = nivelFiltro === "todos"
    ? IMMERSIONE_RECURSOS
    : IMMERSIONE_RECURSOS.filter(g => g.nivel === nivelFiltro);

  return (
    <div style={{ fontFamily:C.sans }} className="it-fade-in">
      {/* Header */}
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:9, color:C.gold, letterSpacing:"0.3em", fontWeight:700, textTransform:"uppercase", marginBottom:6 }}>Immersione · Micro-inmersión</div>
        <h2 style={{ fontSize:20, color:C.text, margin:"0 0 6px", fontFamily:C.serif, fontWeight:400 }}>Recursos Curados</h2>
        <div style={{ width:36, height:1, background:C.gold, opacity:0.5, marginBottom:10 }}/>
        <p style={{ fontSize:13, color:C.textMid, lineHeight:1.6, margin:0 }}>
          20-30 min de estudio formal + <strong style={{color:C.gold}}>inmersión diaria</strong> = progreso 2x más rápido. Estos recursos están seleccionados específicamente para hispanohablantes aprendiendo italiano.
        </p>
      </div>

      {/* Banner científico */}
      <div style={{ background:`${C.blue}08`, border:`1px solid ${C.blue}22`, borderRadius:12, padding:"11px 14px", marginBottom:18, display:"flex", gap:10, alignItems:"flex-start" }}>
        <MIcon name="science" size={16} color={C.blue} />
        <div style={{ fontSize:12, color:C.textMid, lineHeight:1.6 }}>
          <strong style={{color:C.blue}}>Krashen (1982):</strong> El input comprensible auténtico — series, podcasts, periódicos — activa la adquisición subconsciente del idioma. Estudiar con la app + consumir contenido real es la combinación óptima.
        </div>
      </div>

      {/* Filtro de nivel */}
      <div style={{ display:"flex", background:C.bg4, borderRadius:20, padding:3, border:`1px solid ${C.border}`, marginBottom:20, alignSelf:"flex-start" }}>
        {niveles.map(n => (
          <button key={n} onClick={()=>setNivelFiltro(n)} style={{
            background:nivelFiltro===n?C.bg5:"transparent", border:"none", borderRadius:17,
            padding:"5px 14px", cursor:"pointer",
            color:nivelFiltro===n?(nivelColors[n]||C.gold):C.muted,
            fontSize:11, fontWeight:nivelFiltro===n?700:400, fontFamily:C.sans, transition:"all 0.15s",
          }}>{n}</button>
        ))}
      </div>

      {/* Grupos por nivel */}
      <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
        {grupos.map(grupo => (
          <div key={grupo.nivel}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
              <div style={{ height:1, flex:1, background:`${grupo.color}33` }}/>
              <span style={{ fontSize:10, color:grupo.color, fontWeight:700, letterSpacing:"0.2em" }}>NIVEL {grupo.nivel}</span>
              <div style={{ height:1, flex:1, background:`${grupo.color}33` }}/>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {grupo.items.map((item, i) => (
                <a key={i} href={item.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration:"none" }}>
                  <div style={{
                    background:C.bg2, border:`1px solid ${C.border}`, borderRadius:13,
                    padding:"14px 16px", display:"flex", gap:14, alignItems:"flex-start",
                    transition:"border-color 0.15s", cursor:"pointer",
                  }}
                  onMouseEnter={e=>e.currentTarget.style.borderColor=grupo.color+"66"}
                  onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}
                  >
                    <div style={{ fontSize:26, flexShrink:0, marginTop:2 }}>{item.emoji}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:"flex", gap:7, alignItems:"center", marginBottom:4, flexWrap:"wrap" }}>
                        <span style={{ fontSize:14, color:C.text, fontFamily:C.serif }}>{item.titulo}</span>
                        <span style={{
                          fontSize:9, fontWeight:700, letterSpacing:0.5, textTransform:"uppercase",
                          color:tagColors[item.tag]||C.muted,
                          background:(tagColors[item.tag]||C.muted)+"18",
                          border:`1px solid ${(tagColors[item.tag]||C.muted)}44`,
                          borderRadius:20, padding:"2px 7px",
                        }}>{item.tag}</span>
                      </div>
                      <div style={{ fontSize:12, color:C.hint, lineHeight:1.5 }}>{item.desc}</div>
                    </div>
                    <MIcon name="open_in_new" size={16} color={C.hint} style={{ flexShrink:0, marginTop:2 }} />
                  </div>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Consejo final */}
      <div style={{ marginTop:24, background:`${C.gold}08`, border:`1px solid ${C.gold}22`, borderRadius:12, padding:"13px 16px", fontSize:12, color:C.textMid, lineHeight:1.7 }}>
        <strong style={{color:C.gold}}>💡 Rutina sugerida:</strong> Usa la app 20-30 min por la mañana (Repasos + Hoy). Por la tarde/noche, 15-20 min con uno de estos recursos según tu nivel. Ese doble contacto diario acelera la adquisición de forma exponencial.
      </div>
    </div>
  );
}

// ─── GRAMMATICA VIVA (v18) ──────────────────────────────────────────────────
const GRAMMAR_VERBS = [
  {
    infinitive:"essere", es:"ser / estar", level:"A0", core:"identidad, origen, estado y descripción",
    pattern:"Irregular total. Es el verbo base para decir quién eres, dónde estás y cómo estás.",
    forms:[
      { pronoun:"io", form:"sono", example:"Io sono colombiano.", es:"Yo soy colombiano." },
      { pronoun:"tu", form:"sei", example:"Tu sei molto gentile.", es:"Tú eres muy amable." },
      { pronoun:"lui/lei", form:"è", example:"Lei è a Milano.", es:"Ella está en Milán." },
      { pronoun:"noi", form:"siamo", example:"Noi siamo pronti.", es:"Nosotros estamos listos." },
      { pronoun:"voi", form:"siete", example:"Voi siete amici.", es:"Ustedes son amigos." },
      { pronoun:"loro", form:"sono", example:"Loro sono italiani.", es:"Ellos son italianos." },
    ],
  },
  {
    infinitive:"avere", es:"tener / haber", level:"A0", core:"edad, posesión, necesidad y passato prossimo",
    pattern:"En italiano la edad se tiene: ho ventotto anni. También aparece en ho bisogno di.",
    forms:[
      { pronoun:"io", form:"ho", example:"Io ho bisogno di aiuto.", es:"Yo necesito ayuda." },
      { pronoun:"tu", form:"hai", example:"Tu hai tempo oggi?", es:"¿Tienes tiempo hoy?" },
      { pronoun:"lui/lei", form:"ha", example:"Marco ha trent'anni.", es:"Marco tiene treinta años." },
      { pronoun:"noi", form:"abbiamo", example:"Noi abbiamo una domanda.", es:"Tenemos una pregunta." },
      { pronoun:"voi", form:"avete", example:"Voi avete il biglietto?", es:"¿Ustedes tienen el billete?" },
      { pronoun:"loro", form:"hanno", example:"Loro hanno fame.", es:"Ellos tienen hambre." },
    ],
  },
  {
    infinitive:"andare", es:"ir", level:"A1", core:"movimiento, planes y desplazamientos",
    pattern:"Irregular: vado, vai, va. Se usa con a/in/da según destino o persona.",
    forms:[
      { pronoun:"io", form:"vado", example:"Io vado al lavoro.", es:"Voy al trabajo." },
      { pronoun:"tu", form:"vai", example:"Tu vai in centro?", es:"¿Vas al centro?" },
      { pronoun:"lui/lei", form:"va", example:"Lei va alla stazione.", es:"Ella va a la estación." },
      { pronoun:"noi", form:"andiamo", example:"Noi andiamo a Roma.", es:"Vamos a Roma." },
      { pronoun:"voi", form:"andate", example:"Voi andate al cinema?", es:"¿Ustedes van al cine?" },
      { pronoun:"loro", form:"vanno", example:"Loro vanno in Italia.", es:"Ellos van a Italia." },
    ],
  },
  {
    infinitive:"fare", es:"hacer", level:"A1", core:"acciones cotidianas, trabajo, compras y clima",
    pattern:"Irregular en singular y loro: faccio, fai, fa, fanno.",
    forms:[
      { pronoun:"io", form:"faccio", example:"Io faccio la spesa.", es:"Hago la compra." },
      { pronoun:"tu", form:"fai", example:"Tu fai colazione?", es:"¿Desayunas?" },
      { pronoun:"lui/lei", form:"fa", example:"Oggi fa freddo.", es:"Hoy hace frío." },
      { pronoun:"noi", form:"facciamo", example:"Noi facciamo una pausa.", es:"Hacemos una pausa." },
      { pronoun:"voi", form:"fate", example:"Voi fate sport?", es:"¿Ustedes hacen deporte?" },
      { pronoun:"loro", form:"fanno", example:"Loro fanno una domanda.", es:"Ellos hacen una pregunta." },
    ],
  },
  {
    infinitive:"volere", es:"querer", level:"A1", core:"deseos, pedidos y decisiones",
    pattern:"Verbo modal. Después suele venir otro verbo en infinitivo: voglio restare.",
    forms:[
      { pronoun:"io", form:"voglio", example:"Io voglio imparare italiano.", es:"Quiero aprender italiano." },
      { pronoun:"tu", form:"vuoi", example:"Tu vuoi un caffè?", es:"¿Quieres un café?" },
      { pronoun:"lui/lei", form:"vuole", example:"Lei vuole lavorare qui.", es:"Ella quiere trabajar aquí." },
      { pronoun:"noi", form:"vogliamo", example:"Noi vogliamo andare a Firenze.", es:"Queremos ir a Florencia." },
      { pronoun:"voi", form:"volete", example:"Voi volete mangiare?", es:"¿Ustedes quieren comer?" },
      { pronoun:"loro", form:"vogliono", example:"Loro vogliono capire tutto.", es:"Ellos quieren entender todo." },
    ],
  },
  {
    infinitive:"potere", es:"poder", level:"A1", core:"permiso, posibilidad y capacidad práctica",
    pattern:"Modal: posso parlare, puoi ripetere, possiamo entrare.",
    forms:[
      { pronoun:"io", form:"posso", example:"Io posso aiutarti.", es:"Puedo ayudarte." },
      { pronoun:"tu", form:"puoi", example:"Puoi ripetere, per favore?", es:"¿Puedes repetir, por favor?" },
      { pronoun:"lui/lei", form:"può", example:"Lei può entrare.", es:"Ella puede entrar." },
      { pronoun:"noi", form:"possiamo", example:"Noi possiamo parlare italiano.", es:"Podemos hablar italiano." },
      { pronoun:"voi", form:"potete", example:"Voi potete aspettare qui.", es:"Ustedes pueden esperar aquí." },
      { pronoun:"loro", form:"possono", example:"Loro possono venire domani.", es:"Ellos pueden venir mañana." },
    ],
  },
  {
    infinitive:"dovere", es:"deber / tener que", level:"A1", core:"obligación, trámites y responsabilidades",
    pattern:"Modal: devo firmare, devi studiare, dobbiamo aspettare.",
    forms:[
      { pronoun:"io", form:"devo", example:"Io devo firmare il contratto.", es:"Tengo que firmar el contrato." },
      { pronoun:"tu", form:"devi", example:"Tu devi studiare oggi.", es:"Tienes que estudiar hoy." },
      { pronoun:"lui/lei", form:"deve", example:"Lei deve andare in banca.", es:"Ella tiene que ir al banco." },
      { pronoun:"noi", form:"dobbiamo", example:"Noi dobbiamo aspettare.", es:"Tenemos que esperar." },
      { pronoun:"voi", form:"dovete", example:"Voi dovete compilare il modulo.", es:"Ustedes deben rellenar el formulario." },
      { pronoun:"loro", form:"devono", example:"Loro devono pagare l'affitto.", es:"Ellos deben pagar el alquiler." },
    ],
  },
  {
    infinitive:"sapere", es:"saber", level:"A2", core:"habilidad aprendida, información y conocimiento",
    pattern:"Sapere + infinitivo expresa saber hacer algo: so guidare, sai cucinare.",
    forms:[
      { pronoun:"io", form:"so", example:"Io so cucinare la pasta.", es:"Sé cocinar pasta." },
      { pronoun:"tu", form:"sai", example:"Tu sai dov'è la farmacia?", es:"¿Sabes dónde está la farmacia?" },
      { pronoun:"lui/lei", form:"sa", example:"Lui sa guidare.", es:"Él sabe conducir." },
      { pronoun:"noi", form:"sappiamo", example:"Noi sappiamo la risposta.", es:"Sabemos la respuesta." },
      { pronoun:"voi", form:"sapete", example:"Voi sapete parlare italiano?", es:"¿Ustedes saben hablar italiano?" },
      { pronoun:"loro", form:"sanno", example:"Loro sanno tutto.", es:"Ellos saben todo." },
    ],
  },
  {
    infinitive:"venire", es:"venir", level:"A1", core:"llegadas, invitaciones y movimiento hacia el hablante",
    pattern:"Irregular: vengo, vieni, viene, vengono.",
    forms:[
      { pronoun:"io", form:"vengo", example:"Io vengo con te.", es:"Voy contigo / vengo contigo." },
      { pronoun:"tu", form:"vieni", example:"Tu vieni alla festa?", es:"¿Vienes a la fiesta?" },
      { pronoun:"lui/lei", form:"viene", example:"Marco viene domani.", es:"Marco viene mañana." },
      { pronoun:"noi", form:"veniamo", example:"Noi veniamo da Bogotá.", es:"Venimos de Bogotá." },
      { pronoun:"voi", form:"venite", example:"Voi venite in Italia?", es:"¿Ustedes vienen a Italia?" },
      { pronoun:"loro", form:"vengono", example:"Loro vengono alle otto.", es:"Ellos vienen a las ocho." },
    ],
  },
  {
    infinitive:"stare", es:"estar / quedarse", level:"A1", core:"estado físico, ubicación temporal y gerundio",
    pattern:"Base de stare + gerundio: sto mangiando, stai studiando.",
    forms:[
      { pronoun:"io", form:"sto", example:"Io sto bene.", es:"Estoy bien." },
      { pronoun:"tu", form:"stai", example:"Tu stai studiando?", es:"¿Estás estudiando?" },
      { pronoun:"lui/lei", form:"sta", example:"Lei sta a casa.", es:"Ella está en casa." },
      { pronoun:"noi", form:"stiamo", example:"Noi stiamo imparando.", es:"Estamos aprendiendo." },
      { pronoun:"voi", form:"state", example:"Voi state tranquilli.", es:"Ustedes estén tranquilos." },
      { pronoun:"loro", form:"stanno", example:"Loro stanno parlando.", es:"Ellos están hablando." },
    ],
  },
];

const GRAMMAR_EXERCISES = [
  { verb:"essere", sentence:"Io ___ colombiano e vivo a Milano.", answer:"sono", why:"Con io, essere usa sono. Sirve para identidad u origen." },
  { verb:"avere", sentence:"Marco ___ trent'anni.", answer:"ha", why:"La edad en italiano se expresa con avere: ha trent'anni." },
  { verb:"andare", sentence:"Noi ___ alla stazione alle otto.", answer:"andiamo", why:"Con noi, andare cambia a andiamo." },
  { verb:"fare", sentence:"Tu ___ colazione al bar?", answer:"fai", why:"Con tu, fare usa fai." },
  { verb:"volere", sentence:"Loro ___ imparare l'italiano.", answer:"vogliono", why:"Con loro, volere usa vogliono y después va infinitivo." },
  { verb:"potere", sentence:"Scusi, ___ ripetere più lentamente?", answer:"può", why:"Con Lei formal, potere usa può." },
  { verb:"dovere", sentence:"Voi ___ compilare questo modulo.", answer:"dovete", why:"Con voi, dovere usa dovete." },
  { verb:"sapere", sentence:"Io non ___ guidare.", answer:"so", why:"Sapere + infinitivo expresa una habilidad: so guidare." },
  { verb:"venire", sentence:"Tu ___ con me al mercato?", answer:"vieni", why:"Con tu, venire usa vieni." },
  { verb:"stare", sentence:"Noi ___ studiando italiano.", answer:"stiamo", why:"Stare + gerundio forma el progresivo: stiamo studiando." },
  { verb:"essere", sentence:"Voi ___ pronti per il colloquio?", answer:"siete", why:"Con voi, essere usa siete." },
  { verb:"avere", sentence:"Loro ___ fame dopo il viaggio.", answer:"hanno", why:"Con loro, avere usa hanno." },
  { verb:"potere", sentence:"Noi ___ parlare in italiano oggi.", answer:"possiamo", why:"Con noi, potere usa possiamo." },
  { verb:"dovere", sentence:"Lei ___ andare in questura domani.", answer:"deve", why:"Con lei, dovere usa deve." },
  { verb:"fare", sentence:"Oggi ___ molto caldo.", answer:"fa", why:"Para el clima se usa fare en tercera persona: fa caldo." },
];

function GrammarModule() {
  const [selected, setSelected] = useState(GRAMMAR_VERBS[0].infinitive);
  const [mode, setMode] = useState("tabella");
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [savedStats, setSavedStats] = useState(() => {
    try { return JSON.parse(localStorage.getItem("it_grammar_stats") || "{}"); }
    catch { return {}; }
  });
  const verb = GRAMMAR_VERBS.find(v => v.infinitive === selected) || GRAMMAR_VERBS[0];
  const activeExercises = selected === "tutti"
    ? GRAMMAR_EXERCISES
    : GRAMMAR_EXERCISES.filter(e => e.verb === selected);
  const answeredCount = activeExercises.filter((_, i) => (answers[i] || "").trim()).length;
  const correctCount = submitted ? activeExercises.filter((e, i) => normIT(answers[i] || "") === normIT(e.answer)).length : 0;
  const pct = submitted ? Math.round((correctCount / activeExercises.length) * 100) : 0;

  function saveSession() {
    const next = {
      ...savedStats,
      sessions:(savedStats.sessions || 0) + 1,
      answered:(savedStats.answered || 0) + activeExercises.length,
      correct:(savedStats.correct || 0) + correctCount,
      lastPct:pct,
      lastVerb:selected,
      lastDate:new Date().toISOString(),
    };
    localStorage.setItem("it_grammar_stats", JSON.stringify(next));
    setSavedStats(next);
    markActivity();
  }

  function submit() {
    if (answeredCount < activeExercises.length) return;
    setSubmitted(true);
    setTimeout(saveSession, 0);
  }

  function restartPractice() {
    setAnswers({});
    setSubmitted(false);
  }

  return (
    <div style={{ fontFamily:C.sans }} className="it-fade-in">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:14, marginBottom:18 }}>
        <div>
          <div style={{ fontSize:9, color:C.gold, letterSpacing:"0.3em", fontWeight:700, textTransform:"uppercase", marginBottom:4 }}>v18 · Grammatica viva</div>
          <h2 style={{ fontSize:20, color:C.text, margin:"0 0 6px", fontFamily:C.serif, fontWeight:400 }}>Verbi core in contesto</h2>
          <div style={{ width:36, height:1, background:C.gold, opacity:0.5, marginBottom:10 }}/>
          <p style={{ fontSize:13, color:C.textMid, lineHeight:1.6, margin:0 }}>
            Conjuga, escucha y completa frases reales con los 10 verbos que sostienen casi toda conversación inicial.
          </p>
        </div>
        <div style={{ background:C.bg2, border:`1px solid ${C.border}`, borderRadius:12, padding:"10px 12px", minWidth:92, textAlign:"center" }}>
          <div style={{ fontSize:18, color:C.gold, fontFamily:C.serif }}>{savedStats.sessions || 0}</div>
          <div style={{ fontSize:9, color:C.hint, textTransform:"uppercase", letterSpacing:0.5 }}>sesiones</div>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:14 }}>
        {[
          { id:"tabella", icon:"table", label:"Conjugar" },
          { id:"pratica", icon:"edit_note", label:"Practicar" },
        ].map(m => {
          const active = mode === m.id;
          return (
            <button key={m.id} onClick={()=>{ setMode(m.id); if (m.id === "tabella" && selected === "tutti") setSelected(GRAMMAR_VERBS[0].infinitive); restartPractice(); }} style={{
              background:active?`${C.gold}18`:C.bg2, border:`1px solid ${active?C.gold+"66":C.border}`,
              borderRadius:10, padding:"11px 12px", cursor:"pointer", color:active?C.gold:C.textMid,
              display:"flex", alignItems:"center", justifyContent:"center", gap:7, fontWeight:700, fontFamily:C.sans,
            }}>
              <MIcon name={m.icon} size={16} color={active?C.gold:C.muted} />
              {m.label}
            </button>
          );
        })}
      </div>

      <div style={{ display:"flex", gap:7, overflowX:"auto", marginBottom:16, paddingBottom:2 }}>
        {mode === "pratica" && (
          <button onClick={()=>{ setSelected("tutti"); restartPractice(); }} style={{
            flexShrink:0, background:selected==="tutti"?`${C.blue}18`:C.bg2,
            border:`1px solid ${selected==="tutti"?C.blue+"66":C.border}`, borderRadius:999,
            padding:"7px 12px", color:selected==="tutti"?C.blue:C.textMid, cursor:"pointer", fontSize:12, fontWeight:700,
          }}>tutti</button>
        )}
        {GRAMMAR_VERBS.map(v => {
          const active = selected === v.infinitive;
          return (
            <button key={v.infinitive} onClick={()=>{ setSelected(v.infinitive); restartPractice(); }} style={{
              flexShrink:0, background:active?`${C.gold}18`:C.bg2,
              border:`1px solid ${active?C.gold+"66":C.border}`, borderRadius:999,
              padding:"7px 12px", color:active?C.gold:C.textMid, cursor:"pointer", fontSize:12, fontWeight:700,
              fontFamily:C.serif,
            }}>{v.infinitive}</button>
          );
        })}
      </div>

      {mode === "tabella" ? (
        <>
          <div style={{ background:`${C.gold}0d`, border:`1px solid ${C.gold}33`, borderRadius:14, padding:"14px 16px", marginBottom:14 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:10, marginBottom:8 }}>
              <div>
                <div style={{ fontSize:24, color:C.gold, fontFamily:C.serif }}>{verb.infinitive}</div>
                <div style={{ fontSize:13, color:C.textMid }}>{verb.es} · <span style={{ color:C.green }}>{verb.level}</span></div>
              </div>
              <SpeakBtn text={verb.infinitive} color={C.gold} size={34} />
            </div>
            <div style={{ fontSize:13, color:C.text, lineHeight:1.6, marginBottom:6 }}>{verb.core}</div>
            <div style={{ fontSize:12, color:C.muted, lineHeight:1.6 }}>{verb.pattern}</div>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr", gap:9 }}>
            {verb.forms.map(f => (
              <div key={`${verb.infinitive}-${f.pronoun}`} className="it-lesson-card" style={{
                border:`1px solid ${C.border}`, borderRadius:12, padding:"12px 14px",
                display:"grid", gridTemplateColumns:"minmax(60px,72px) 1fr auto", gap:8, alignItems:"center",
              }}>
                <div style={{ fontSize:12, color:C.hint, fontWeight:700 }}>{f.pronoun}</div>
                <div>
                  <div style={{ display:"flex", alignItems:"baseline", gap:8, flexWrap:"wrap" }}>
                    <span style={{ fontSize:19, color:C.text, fontFamily:C.serif }}>{f.form}</span>
                    <span style={{ fontSize:12, color:C.muted }}>{f.es}</span>
                  </div>
                  <div style={{ fontSize:13, color:C.textMid, marginTop:5, lineHeight:1.5 }}>
                    <em style={{ color:C.gold, fontFamily:C.serif }}>{f.example}</em>
                  </div>
                </div>
                <SpeakBtn text={`${f.form}. ${f.example}`} color={C.gold} />
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <div style={{ background:"rgba(8,14,20,0.8)", border:`1px solid ${C.blue}22`, borderRadius:14, padding:16, marginBottom:14 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:7 }}>
              <MIcon name="psychology" fill={1} size={18} color={C.blue} />
              <span style={{ fontSize:11, color:C.blue, letterSpacing:"0.2em", fontWeight:700, textTransform:"uppercase" }}>Corrección inteligente</span>
            </div>
            <div style={{ fontSize:13, color:C.textMid, lineHeight:1.6 }}>
              Completa cada hueco. Al enviar, el tutor te explica la regla detrás de cada forma verbal.
            </div>
          </div>

          {submitted && (
            <div style={{ background:pct>=75?"rgba(10,26,10,0.7)":"rgba(26,8,10,0.7)", border:`1px solid ${pct>=75?C.green:C.pink}44`, borderRadius:16, padding:20, marginBottom:14, textAlign:"center" }}>
              <div style={{ fontSize:38, color:pct>=75?C.green:C.pink, fontWeight:700, fontFamily:C.serif }}>{pct}%</div>
              <div style={{ fontSize:14, color:C.textMid }}>{correctCount} de {activeExercises.length} correctas · {pct>=90?"Ottimo controllo":pct>=75?"Buona base":"Repasa las formas en voz alta"}</div>
            </div>
          )}

          <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:16 }}>
            {activeExercises.map((e, i) => {
              const val = answers[i] || "";
              const ok = submitted && normIT(val) === normIT(e.answer);
              const vMeta = GRAMMAR_VERBS.find(v => v.infinitive === e.verb);
              return (
                <div key={`${e.verb}-${i}`} className="it-lesson-card" style={{
                  border:`1px solid ${submitted?(ok?C.green+"55":C.pink+"55"):C.border}`,
                  borderRadius:14, padding:16,
                }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:10, marginBottom:10 }}>
                    <span style={{ fontSize:10, color:C.muted, letterSpacing:1, fontWeight:700, textTransform:"uppercase" }}>Pregunta {i+1} · {e.verb}</span>
                    <SpeakBtn text={e.sentence.replace("___", e.answer)} color={ok?C.green:C.gold} />
                  </div>
                  <div style={{ fontSize:16, color:C.text, fontFamily:C.serif, lineHeight:1.7, marginBottom:10 }}>
                    {e.sentence.split("___")[0]}
                    <input
                      value={val}
                      onChange={ev=>!submitted&&setAnswers(p=>({...p,[i]:ev.target.value.slice(0,18)}))}
                      disabled={submitted}
                      placeholder="..."
                      style={{
                        width:110, margin:"0 6px", background:submitted?(ok?`${C.green}12`:`${C.pink}12`):C.bg3,
                        border:`1px solid ${submitted?(ok?C.green+"66":C.pink+"55"):C.border}`,
                        borderRadius:8, padding:"7px 9px", color:C.text, fontSize:15, fontFamily:C.serif,
                        textAlign:"center", outline:"none",
                      }}
                    />
                    {e.sentence.split("___")[1]}
                  </div>
                  {submitted && (
                    <div style={{ background:ok?`${C.green}10`:`${C.pink}10`, border:`1px solid ${ok?C.green+"22":C.pink+"22"}`, borderRadius:10, padding:"10px 12px" }}>
                      <div style={{ fontSize:13, color:ok?C.green:C.pink, marginBottom:5, fontWeight:700 }}>
                        {ok ? "Correcto" : `Correcto: ${e.answer}`}
                      </div>
                      <div style={{ fontSize:12, color:C.textMid, lineHeight:1.6 }}>{e.why}</div>
                      {vMeta && <div style={{ fontSize:11, color:C.hint, marginTop:5 }}>Idea clave: {vMeta.core}</div>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {!submitted ? (
            <button onClick={submit} disabled={answeredCount < activeExercises.length} style={{
              width:"100%", background:answeredCount===activeExercises.length?`${C.blue}20`:C.bg3,
              border:`1px solid ${answeredCount===activeExercises.length?C.blue:C.border}`,
              borderRadius:10, padding:"13px 20px", cursor:answeredCount===activeExercises.length?"pointer":"default",
              color:answeredCount===activeExercises.length?C.blue:C.hint, fontWeight:700, fontSize:14, fontFamily:C.sans,
            }}>Corregir ejercicios</button>
          ) : (
            <button onClick={restartPractice} style={{
              width:"100%", background:`${C.blue}18`, border:`1px solid ${C.blue}`, borderRadius:10,
              padding:"13px 20px", cursor:"pointer", color:C.blue, fontWeight:700, fontSize:14, fontFamily:C.sans,
            }}>Nueva práctica</button>
          )}
        </>
      )}
    </div>
  );
}

// ─── COACH MODULE (v19) ─────────────────────────────────────────────────────
// Coach IA Semanal + Índice de Fluidez Estimado (IFE 0-100)

// ── Calcula el IFE desde progresoMap ──
function calcIFE(progresoMap, totalVocab) {
  const prog = Object.values(progresoMap);
  const saved = prog.filter(p => p.guardada);
  if (saved.length === 0) return 0;

  // Factor 1: cobertura vocab (0-30 pts) — qué % del vocab total está guardado
  const coberturaVocab = Math.min(saved.length / Math.max(totalVocab, 1), 1);
  const f1 = coberturaVocab * 30;

  // Factor 2: calidad retención SRS (0-30 pts) — ease_factor promedio (rango 1.3-2.9)
  const avgEase = saved.reduce((s, p) => s + (p.ease_factor || 2.5), 0) / saved.length;
  const easeNorm = Math.min(Math.max((avgEase - 1.3) / (2.9 - 1.3), 0), 1);
  const f2 = easeNorm * 30;

  // Factor 3: palabras dominadas (0-20 pts) — intervalo > 21 días
  const dominadas = saved.filter(p => (p.intervalo_dias || 1) > 21).length;
  const f3 = Math.min(dominadas / Math.max(saved.length, 1), 1) * 20;

  // Factor 4: hábito (0-20 pts) — racha actual
  const { streak } = calcStreak();
  const f4 = Math.min(streak / 30, 1) * 20;

  return Math.round(f1 + f2 + f3 + f4);
}

function ifeLabel(ife) {
  if (ife >= 80) return { label:"Fluente", color:"#e8c84a" };
  if (ife >= 60) return { label:"Comunicativo", color:"#4ab5e8" };
  if (ife >= 40) return { label:"Intermedio", color:"#6ecf8a" };
  if (ife >= 20) return { label:"Básico", color:"#b09060" };
  return { label:"Principiante", color:"#7a7a7a" };
}

function CoachModule({ db, progresoMap }) {
  const [coachMsg, setCoachMsg]     = useState("");
  const [loading, setLoading]       = useState(false);
  const [loaded, setLoaded]         = useState(false);
  const [historial, setHistorial]   = useState(() => {
    try { return JSON.parse(localStorage.getItem("it_coach_historial") || "[]"); }
    catch { return []; }
  });
  const [tab, setTab] = useState("coach"); // "coach" | "ife" | "historial"

  const prog    = Object.values(progresoMap);
  const saved   = prog.filter(p => p.guardada);
  const due     = saved.filter(p => isDue(p.proximo_repaso));
  const learned = saved.filter(p => (p.repeticiones || 0) >= 3);
  const dominated = saved.filter(p => (p.intervalo_dias || 1) > 21);
  const totalVocab = db.vocabulario.length;
  const { streak } = calcStreak();
  const avgEase = saved.length
    ? (saved.reduce((s, p) => s + (p.ease_factor || 2.5), 0) / saved.length).toFixed(2)
    : "2.50";
  const avgInterval = saved.length
    ? Math.round(saved.reduce((s, p) => s + (p.intervalo_dias || 1), 0) / saved.length)
    : 0;

  // IFE
  const ife = calcIFE(progresoMap, totalVocab);
  const { label: ifeTag, color: ifeColor } = ifeLabel(ife);

  // Top 5 palabras más débiles (ease_factor más bajo entre guardadas)
  const debiles = [...saved]
    .filter(p => p.palabra_id)
    .sort((a, b) => (a.ease_factor || 2.5) - (b.ease_factor || 2.5))
    .slice(0, 5)
    .map(p => {
      const word = db.vocabulario.find(w => w.id === p.palabra_id);
      return word ? { ...word, ease: p.ease_factor } : null;
    })
    .filter(Boolean);

  async function generarCoach() {
    setLoading(true); setLoaded(false); setCoachMsg("");
    const debilesStr = debiles.map(w => `"${w.palabra_it}" (${w.traduccion_es})`).join(", ");
    const semanaActual = Math.ceil(saved.length / 28) || 1;
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 350,
          messages: [{ role: "user", content:
`Eres el coach personal de italiano de Pablo, un colombiano aprendiendo italiano para vivir en Italia. Analiza su progreso real y da un análisis semanal personalizado.

DATOS REALES DE ESTA SEMANA:
- Racha actual: ${streak} días consecutivos
- Vocabulario guardado: ${saved.length} de ${totalVocab} palabras (${Math.round(saved.length/totalVocab*100)}%)
- Palabras con repaso pendiente hoy: ${due.length}
- Palabras aprendidas (≥3 repasos): ${learned.length}
- Palabras dominadas (intervalo >21 días): ${dominated.length}
- Ease factor promedio: ${avgEase} (escala 1.3-2.9; más alto = mejor retención)
- Intervalo promedio SRS: ${avgInterval} días
- Índice de Fluidez Estimado (IFE): ${ife}/100 — nivel ${ifeTag}
- Semana estimada del plan: ${semanaActual}
- Palabras más débiles: ${debilesStr || "ninguna identificada aún"}

Escribe un análisis semanal en español con esta estructura EXACTA (usa estos encabezados en negrita):
**Lo que lograste esta semana**
(2 frases específicas con los datos reales más destacados)

**Tu punto más débil ahora mismo**
(1 frase directa — identifica el gap más importante)

**Prioridad para los próximos 7 días**
(2-3 acciones concretas y específicas, no genéricas)

**Frase motivacional en italiano**
(1 frase en italiano relacionada con su meta de vivir en Italia, con traducción)

Sé directo, específico y usa los números reales. Máximo 180 palabras total.` }],
        }),
      });
      const data = await res.json();
      const txt = data.content?.map(b => b.text || "").join("").trim();
      if (txt) {
        setCoachMsg(txt);
        // Guardar en historial local
        const entry = { fecha: new Date().toISOString(), ife, streak, saved: saved.length, msg: txt };
        const newHistorial = [entry, ...historial].slice(0, 8);
        setHistorial(newHistorial);
        localStorage.setItem("it_coach_historial", JSON.stringify(newHistorial));
      }
    } catch { setCoachMsg("No se pudo conectar con la IA. Revisa tu conexión e inténtalo de nuevo."); }
    setLoading(false); setLoaded(true);
  }

  // Renderiza el mensaje del coach con negritas markdown básicas
  function renderCoachMsg(txt) {
    return txt.split("\n").map((line, i) => {
      const parts = line.split(/\*\*(.*?)\*\*/g);
      return (
        <div key={i} style={{ marginBottom: line.trim() === "" ? 8 : 4 }}>
          {parts.map((part, j) =>
            j % 2 === 1
              ? <strong key={j} style={{ color: C.gold, fontWeight: 700 }}>{part}</strong>
              : <span key={j}>{part}</span>
          )}
        </div>
      );
    });
  }

  // ── IFE Tab ──
  const ifeFactors = [
    { label: "Cobertura vocab", val: Math.round((saved.length / Math.max(totalVocab,1)) * 30), max: 30, color: C.green, desc: `${saved.length}/${totalVocab} palabras guardadas` },
    { label: "Calidad retención", val: Math.round(Math.min(Math.max((parseFloat(avgEase)-1.3)/(2.9-1.3),0),1)*30), max: 30, color: C.blue, desc: `Ease factor promedio: ${avgEase}` },
    { label: "Palabras dominadas", val: Math.round(Math.min(dominated.length/Math.max(saved.length,1),1)*20), max: 20, color: "#9b7fe8", desc: `${dominated.length} palabras con intervalo >21 días` },
    { label: "Hábito (racha)", val: Math.round(Math.min(streak/30,1)*20), max: 20, color: C.gold, desc: `Racha actual: ${streak} días` },
  ];

  return (
    <div style={{ fontFamily: C.sans }} className="it-fade-in">
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 9, color: C.gold, letterSpacing: "0.3em", fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>v19 · Coach IA + IFE</div>
        <h2 style={{ fontSize: 20, color: C.text, margin: "0 0 6px", fontFamily: C.serif, fontWeight: 400 }}>Tu entrenador personal</h2>
        <div style={{ width: 36, height: 1, background: C.gold, opacity: 0.5, marginBottom: 10 }} />
      </div>

      {/* IFE Card destacada */}
      <div style={{ background: `linear-gradient(135deg, ${ifeColor}12, ${ifeColor}06)`, border: `1px solid ${ifeColor}44`, borderRadius: 16, padding: "18px 20px", marginBottom: 16, display: "flex", alignItems: "center", gap: 18 }}>
        <div style={{ textAlign: "center", flexShrink: 0 }}>
          <div style={{ fontSize: 44, fontWeight: 700, color: ifeColor, fontFamily: C.serif, lineHeight: 1 }}>{ife}</div>
          <div style={{ fontSize: 9, color: ifeColor, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", marginTop: 4 }}>IFE</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, color: C.text, fontFamily: C.serif, marginBottom: 4 }}>{ifeTag}</div>
          <div style={{ height: 6, background: C.bg4, borderRadius: 3, marginBottom: 8, overflow: "hidden" }}>
            <div style={{ height: "100%", background: `linear-gradient(90deg, ${ifeColor}88, ${ifeColor})`, borderRadius: 3, width: `${ife}%`, transition: "width 0.8s ease" }} />
          </div>
          <div style={{ fontSize: 11, color: C.hint }}>Índice de Fluidez Estimado · 0–100</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", background: C.bg4, borderRadius: 20, padding: 3, border: `1px solid ${C.border}`, marginBottom: 18 }}>
        {[
          { id: "coach", icon: "psychology", label: "Coach IA" },
          { id: "ife", icon: "insights", label: "Desglose IFE" },
          { id: "historial", icon: "history", label: "Historial" },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, background: tab === t.id ? C.bg5 : "transparent", border: "none", borderRadius: 17,
            padding: "7px 8px", cursor: "pointer", color: tab === t.id ? C.gold : C.muted,
            fontSize: 11, fontWeight: tab === t.id ? 700 : 400, fontFamily: C.sans,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 5, transition: "all 0.15s",
          }}>
            <MIcon name={t.icon} size={13} color={tab === t.id ? C.gold : C.muted} />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: COACH IA ── */}
      {tab === "coach" && (
        <div>
          {/* Métricas rápidas */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 8, marginBottom: 16 }}>
            {[
              { label: "Racha", val: `${streak}d`, color: streak >= 7 ? C.gold : C.hint, icon: "local_fire_department" },
              { label: "Vocab", val: `${saved.length}`, color: C.green, icon: "book_2" },
              { label: "Pendientes", val: `${due.length}`, color: due.length > 10 ? C.pink : C.blue, icon: "refresh" },
            ].map(m => (
              <div key={m.label} style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 12, padding: "11px 10px", textAlign: "center" }}>
                <MIcon name={m.icon} size={16} color={m.color} />
                <div style={{ fontSize: 18, color: m.color, fontFamily: C.serif, fontWeight: 700, marginTop: 3 }}>{m.val}</div>
                <div style={{ fontSize: 9, color: C.hint, textTransform: "uppercase", letterSpacing: 0.5 }}>{m.label}</div>
              </div>
            ))}
          </div>

          {/* Palabras débiles */}
          {debiles.length > 0 && (
            <div style={{ background: `${C.pink}08`, border: `1px solid ${C.pink}22`, borderRadius: 12, padding: "12px 14px", marginBottom: 16 }}>
              <div style={{ fontSize: 10, color: C.pink, fontWeight: 700, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>⚠️ Tus 5 palabras más débiles</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {debiles.map(w => (
                  <div key={w.id} style={{ display: "flex", alignItems: "center", gap: 6, background: C.bg3, border: `1px solid ${C.border}`, borderRadius: 8, padding: "5px 10px" }}>
                    <SpeakBtn text={w.palabra_it} color={C.pink} size={22} />
                    <span style={{ fontSize: 12, color: C.gold, fontFamily: C.serif }}>{w.palabra_it}</span>
                    <span style={{ fontSize: 11, color: C.muted }}>— {w.traduccion_es}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Botón generar / resultado */}
          {!loaded && !loading && (
            <button onClick={generarCoach} style={{ width: "100%", background: `${C.gold}18`, border: `1px solid ${C.gold}55`, borderRadius: 12, padding: "14px", cursor: "pointer", color: C.gold, fontWeight: 700, fontSize: 14, fontFamily: C.sans, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <MIcon name="psychology" fill={1} size={18} color={C.gold} />
              Generar análisis semanal
            </button>
          )}

          {loading && (
            <div className="it-glass" style={{ borderRadius: 14, padding: 20, display: "flex", alignItems: "center", gap: 10 }}>
              <Loader size={16} />
              <span style={{ fontSize: 13, color: C.muted }}>Analizando tu semana...</span>
            </div>
          )}

          {loaded && coachMsg && (
            <div className="it-fade-in">
              <div className="it-glass" style={{ borderRadius: 14, padding: 20, marginBottom: 12, fontSize: 13, color: C.text, lineHeight: 1.8 }}>
                {renderCoachMsg(coachMsg)}
              </div>
              <button onClick={() => { setLoaded(false); setCoachMsg(""); }} style={{ width: "100%", background: "transparent", border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px", cursor: "pointer", color: C.muted, fontSize: 12, fontFamily: C.sans }}>
                Regenerar análisis
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: IFE DESGLOSE ── */}
      {tab === "ife" && (
        <div>
          <div style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: C.hint, marginBottom: 14, lineHeight: 1.6 }}>
              El IFE combina 4 factores reales de tu progreso en una escala 0–100. No es una métrica de fluidez oral, sino un indicador de la solidez de tu base de vocabulario y hábito.
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {ifeFactors.map(f => (
                <div key={f.label}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                    <span style={{ fontSize: 12, color: C.text, fontWeight: 600 }}>{f.label}</span>
                    <span style={{ fontSize: 13, color: f.color, fontWeight: 700 }}>{f.val}<span style={{ fontSize: 10, color: C.hint }}>/{f.max}</span></span>
                  </div>
                  <div style={{ height: 6, background: C.bg4, borderRadius: 3, marginBottom: 4, overflow: "hidden" }}>
                    <div style={{ height: "100%", background: f.color, borderRadius: 3, width: `${(f.val / f.max) * 100}%`, transition: "width 0.6s ease" }} />
                  </div>
                  <div style={{ fontSize: 11, color: C.hint }}>{f.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Escala IFE */}
          <div style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16 }}>
            <div style={{ fontSize: 10, color: C.hint, fontWeight: 700, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>Escala IFE</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { range: "80–100", nivel: "Fluente", color: "#e8c84a", desc: "Vocabulario sólido, alta retención, hábito consolidado" },
                { range: "60–79", nivel: "Comunicativo", color: "#4ab5e8", desc: "Puedes desenvolverte en situaciones cotidianas" },
                { range: "40–59", nivel: "Intermedio", color: "#6ecf8a", desc: "Base construida, en proceso de consolidación" },
                { range: "20–39", nivel: "Básico", color: "#b09060", desc: "Fundamentos en construcción" },
                { range: "0–19", nivel: "Principiante", color: "#7a7a7a", desc: "Inicio del camino" },
              ].map(s => (
                <div key={s.nivel} style={{ display: "flex", gap: 12, alignItems: "center", background: ife >= parseInt(s.range) ? `${s.color}10` : "transparent", border: `1px solid ${ife >= parseInt(s.range) ? s.color+"33" : "transparent"}`, borderRadius: 9, padding: "8px 12px" }}>
                  <span style={{ fontSize: 11, color: s.color, fontWeight: 700, minWidth: 40 }}>{s.range}</span>
                  <span style={{ fontSize: 12, color: C.text, fontWeight: 600, minWidth: 90 }}>{s.nivel}</span>
                  <span style={{ fontSize: 11, color: C.hint }}>{s.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: HISTORIAL ── */}
      {tab === "historial" && (
        <div>
          {historial.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: C.muted }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>📊</div>
              <div style={{ fontSize: 14 }}>Aún no hay análisis guardados.</div>
              <div style={{ fontSize: 12, marginTop: 6 }}>Genera tu primer análisis en la pestaña Coach IA.</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {historial.map((h, i) => {
                const d = new Date(h.fecha);
                const fecha = d.toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" });
                const { label, color } = ifeLabel(h.ife || 0);
                return (
                  <div key={i} style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 13, padding: "14px 16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <span style={{ fontSize: 11, color: C.hint }}>{fecha}</span>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <span style={{ fontSize: 10, color: C.gold }}>🔥 {h.streak}d</span>
                        <span style={{ fontSize: 10, color: C.green }}>📚 {h.saved}</span>
                        <span style={{ fontSize: 11, color, fontWeight: 700, background: color+"18", border: `1px solid ${color}44`, borderRadius: 20, padding: "2px 8px" }}>IFE {h.ife} · {label}</span>
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: C.textMid, lineHeight: 1.7 }}>
                      {h.msg.slice(0, 180)}{h.msg.length > 180 ? "..." : ""}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── ROOT APP ──────────────────────────────────────────────────────────────
export default function App() {
  const [section, setSection] = useState("hoy");
  const [db, setDb] = useState({ vocabulario:[], semanales:[], diarios:[], lecturas:[] });
  const [progresoMap, setProgresoMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [setupNeeded, setSetupNeeded] = useState(false);
  const [weekNum, setWeekNum] = useState(1);
  const [dayNum, setDayNum] = useState(1);
  const [nivelDetectado, setNivelDetectado] = useState(() => localStorage.getItem("it_nivel_detectado") || null);
  const [showNivelTest, setShowNivelTest] = useState(() => !localStorage.getItem("it_nivel_detectado"));
  const [showELSettings, setShowELSettings] = useState(false);
  const [offlineMode, setOfflineMode]       = useState(false);
  const [soloItaliano, setSoloItaliano]     = useState(getSoloItaliano);
  const elConfigured = !!localStorage.getItem("el_api_key") && localStorage.getItem("el_enabled") !== "false";

  const DB_CACHE_KEY = "it_db_cache";

  async function loadData() {
    setLoading(true);
    setOfflineMode(false);
    try {
      const [vocab, semanales, diarios, lecturas] = await Promise.all([
        api.list("vocabulario", { order:"semana.asc,dia.asc" }),
        api.list("planes_semanales", { order:"semana_num.asc" }),
        api.list("planes_diarios", { order:"semana_num.asc,dia_num.asc" }),
        api.list("lecturas"),
      ]);
      if (vocab.length === 0) { setSetupNeeded(true); setLoading(false); return; }
      const progreso = await api.list("progreso_usuario");
      const pMap = {};
      progreso.forEach(p => { if(p.palabra_id) pMap[p.palabra_id] = p; });
      const dbData = { vocabulario:vocab, semanales, diarios, lecturas };
      setDb(dbData);
      setProgresoMap(pMap);
      // ── Actualizar caché local tras carga exitosa ──
      try { localStorage.setItem(DB_CACHE_KEY, JSON.stringify(dbData)); } catch(_) {}
    } catch(e) {
      console.error("Supabase error:", e);
      // ── Fallback a caché local si Supabase no responde ──
      try {
        const cached = localStorage.getItem(DB_CACHE_KEY);
        if (cached) {
          setDb(JSON.parse(cached));
          setOfflineMode(true);
        }
      } catch(_) {}
    }
    setLoading(false);
  }

  async function refreshProgreso() {
    try {
      const progreso = await api.list("progreso_usuario");
      const pMap = {};
      progreso.forEach(p => { if(p.palabra_id) pMap[p.palabra_id] = p; });
      setProgresoMap(pMap);
    } catch(e) { console.error(e); }
  }

  useEffect(() => { loadData(); }, []);

  const dueCount   = Object.values(progresoMap).filter(p=>p.guardada&&isDue(p.proximo_repaso)).length;
  const savedCount = Object.values(progresoMap).filter(p=>p.guardada).length;
  const { streak, hasComodin } = calcStreak();
  const streakColor = streak >= 14 ? C.gold : streak >= 7 ? "#d0902a" : streak >= 3 ? C.green : C.hint;
  const ife = calcIFE(progresoMap, db.vocabulario.length);
  const { label: ifeTag, color: ifeColor } = ifeLabel(ife);

  // ── Navegación: fila principal + drawer lateral ──
  const navMain = [
    { id:"hoy",      msIcon:"today",      label:"Hoy"    },
    { id:"mezcla",   msIcon:"shuffle",    label:"Mezcla" },
    { id:"srs",      msIcon:"refresh",    label:"Repasos", badge:dueCount },
    { id:"speaking", msIcon:"mic",        label:"Habla"  },
    { id:"diario",   msIcon:"edit_note",  label:"Diario" },
    { id:"coach",    msIcon:"psychology", label:"Coach"  },
  ];
  const navDrawer = [
    { id:"mezclaAv",   msIcon:"auto_fix_high", label:"Mezcla Avanzada", desc:"Interleaving + Gramática" },
    { id:"vocab",      msIcon:"book_2",        label:"Vocabulario",  desc:"861 palabras A0→B1" },
    { id:"quiz",       msIcon:"quiz",           label:"Quiz",         desc:"Practica con preguntas" },
    { id:"grammar",    msIcon:"school",         label:"Gramática",    desc:"10 verbos core" },
    { id:"reading",    msIcon:"menu_book",      label:"Lectura",      desc:"Textos graduados" },
    { id:"storie",     msIcon:"auto_stories",   label:"Storie",       desc:"Historias con decisiones" },
    { id:"stats",      msIcon:"bar_chart",      label:"Estadísticas", desc:"Tu progreso completo" },
    { id:"immersione", msIcon:"travel_explore", label:"Mundo",        desc:"Recursos externos" },
  ];
  const drawerHasActive = navDrawer.some(n => n.id === section);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const headerRef = useRef(null);
  const [headerHeight, setHeaderHeight] = useState(120);
  useEffect(() => {
    if (!headerRef.current) return;
    const obs = new ResizeObserver(entries => {
      for (const e of entries) setHeaderHeight(e.contentRect.height);
    });
    obs.observe(headerRef.current);
    setHeaderHeight(headerRef.current.offsetHeight);
    return () => obs.disconnect();
  }, []);

  if (loading) return (
    <div style={{ background:C.bg, minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:16, fontFamily:C.sans }}>
      <div style={{ fontSize:10, color:C.gold, letterSpacing:4, marginBottom:4 }}>PROGETTO ITALIANO · 30 SETTIMANE</div>
      <Loader />
      <div style={{ color:C.muted, fontSize:13 }}>Cargando desde Supabase...</div>
    </div>
  );

  return (
    <div style={{ fontFamily:C.sans, background:C.bg, minHeight:"100vh", color:C.text, overflowX:"hidden" }}>
      {showNivelTest && <NivelTest onDone={(nivel)=>{ setNivelDetectado(nivel); setShowNivelTest(false); }} />}
      {!showNivelTest && setupNeeded && <SetupModal onDone={()=>{ setSetupNeeded(false); loadData(); }} />}
      {showELSettings && <ELSettingsModal onClose={()=>setShowELSettings(false)} />}

      {/* ── Header ── */}
      <header ref={headerRef} style={{
        background:`${C.bg}ee`, backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)",
        borderBottom:`1px solid ${C.border}`,
        position:"sticky", top:0, zIndex:40,
        padding:"14px 16px 0",
      }}>
        {/* Banner offline */}
        {offlineMode && (
          <div style={{ margin:"-14px -16px 12px", padding:"7px 16px",
            background:`${C.gold}12`, borderBottom:`1px solid ${C.gold}33`,
            display:"flex", alignItems:"center", justifyContent:"space-between", gap:8 }}>
            <span style={{ fontSize:11, color:C.gold }}>
              📦 Sin conexión — mostrando datos guardados localmente
            </span>
            <button onClick={loadData} style={{ fontSize:10, color:C.gold, background:"transparent",
              border:`1px solid ${C.gold}44`, borderRadius:6, padding:"2px 8px", cursor:"pointer" }}>
              Reintentar
            </button>
          </div>
        )}
        <div style={{ maxWidth:720, margin:"0 auto" }}>
          {/* Top row */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12, gap:8, flexWrap:"nowrap", minWidth:0 }}>
            <div style={{ minWidth:0, flexShrink:1 }}>
              <div style={{ fontSize:8, color:`${C.gold}99`, letterSpacing:"0.28em", marginBottom:2, fontWeight:700, textTransform:"uppercase", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>Progetto Italiano · 30 Settimane</div>
              <div style={{ fontSize:16, color:C.gold, fontFamily:C.serif, letterSpacing:"0.04em", textTransform:"uppercase", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>Impara l'Italiano 🇮🇹</div>
            </div>
            <div style={{ display:"flex", gap:6, alignItems:"center", flexShrink:0 }}>
              {/* Solo Italiano toggle */}
              <button onClick={()=>{
                  const next = !soloItaliano;
                  localStorage.setItem("it_solo_italiano", next ? "true":"false");
                  setSoloItaliano(next);
                  window.dispatchEvent(new Event("it-solo-italiano-change"));
                }} title="Modo Solo Italiano — oculta traducciones al español"
                style={{ background: soloItaliano ? C.green+"18" : C.bg3,
                  border:`1px solid ${soloItaliano ? C.green+"55" : C.border}`,
                  borderRadius:8, padding:"5px 8px", cursor:"pointer",
                  display:"flex", alignItems:"center", gap:4 }}>
                <span style={{ fontSize:14, lineHeight:1 }}>🇮🇹</span>
                {soloItaliano && <span style={{ fontSize:8, color:C.green, fontWeight:700, letterSpacing:0.5 }}>SOLO</span>}
              </button>
              {/* Audio settings */}
              <button onClick={()=>setShowELSettings(true)} title="Configurar audio"
                style={{ background: elConfigured ? C.gold+"18" : C.bg3,
                  border:`1px solid ${elConfigured ? C.gold+"55" : C.border}`,
                  borderRadius:8, padding:"5px 8px", cursor:"pointer",
                  display:"flex", alignItems:"center", gap:4 }}>
                <MIcon name="graphic_eq" size={16} color={elConfigured ? C.gold : C.muted} />
                {elConfigured && <span style={{ fontSize:8, color:C.gold, fontWeight:700, letterSpacing:0.5 }}>EL</span>}
              </button>
              {/* Streak chip */}
              <div title={hasComodin ? "Racha activa (comodín usado hoy)" : streak > 0 ? `${streak} días seguidos` : "Sin racha aún"}
                style={{ background: streak > 0 ? `${streakColor}18` : C.bg3,
                  border:`1px solid ${streak > 0 ? streakColor+"55" : C.border}`,
                  borderRadius:8, padding:"5px 8px", textAlign:"center",
                  minWidth:38, cursor:"default" }}>
                <div style={{ fontSize:13, color: streak > 0 ? streakColor : C.hint,
                  fontWeight:700, fontFamily:C.serif, lineHeight:1 }}>
                  {streak > 0 ? `${streak}` : "—"}
                  {hasComodin && <span style={{ fontSize:10, marginLeft:2 }}>🛡️</span>}
                </div>
                <div style={{ fontSize:8, color:C.hint, letterSpacing:0.5 }}>
                  {streak > 0 ? "🔥 racha" : "racha"}
                </div>
              </div>
              {/* IFE chip */}
              <div onClick={()=>setSection("coach")} title={`IFE ${ife}/100 · ${ifeTag} — tap para ver desglose`}
                style={{ background:`${ifeColor}18`, border:`1px solid ${ifeColor}44`,
                  borderRadius:8, padding:"5px 8px", textAlign:"center",
                  minWidth:38, cursor:"pointer", transition:"border-color 0.15s" }}>
                <div style={{ fontSize:13, color:ifeColor, fontWeight:700, fontFamily:C.serif, lineHeight:1 }}>{ife}</div>
                <div style={{ fontSize:8, color:C.hint, letterSpacing:0.5 }}>IFE</div>
              </div>
              {/* S/D selectors */}
              <div style={{ display:"flex", gap:2, alignItems:"center", background:C.bg3, border:`1px solid ${C.border}`, borderRadius:8, padding:"5px 7px" }}>
                <span style={{ fontSize:8, color:C.muted, fontWeight:700 }}>S</span>
                <input type="number" min="1" max="30" value={weekNum} onChange={e=>setWeekNum(Math.min(30,Math.max(1,Number(e.target.value))))}
                  style={{ width:24, background:"transparent", border:"none", color:C.gold, fontSize:13, fontWeight:700, textAlign:"center", outline:"none", fontFamily:C.serif }} />
                <span style={{ fontSize:8, color:C.muted, fontWeight:700 }}>D</span>
                <input type="number" min="1" max="6" value={dayNum} onChange={e=>setDayNum(Math.min(6,Math.max(1,Number(e.target.value))))}
                  style={{ width:24, background:"transparent", border:"none", color:C.gold, fontSize:13, fontWeight:700, textAlign:"center", outline:"none", fontFamily:C.serif }} />
              </div>
              <div style={{ background:C.bg3, border:`1px solid ${C.border}`, borderRadius:8, padding:"5px 8px", textAlign:"center" }}>
                <div style={{ fontSize:13, color:C.gold, fontWeight:700, fontFamily:C.serif }}>{savedCount}</div>
                <div style={{ fontSize:8, color:C.hint, letterSpacing:0.5 }}>vocab</div>
              </div>
            </div>
          </div>

          {/* Gold thread divider */}
          <div style={{ height:1, background:`linear-gradient(90deg,transparent,${C.gold}44,transparent)`, marginBottom:0 }}/>

          {/* Navigation — fila principal + botón ··· */}
          <nav style={{ display:"flex" }}>
            {navMain.map(n => {
              const active = section === n.id;
              return (
                <button key={n.id} onClick={()=>{ setSection(n.id); setDrawerOpen(false); }} style={{
                  flex:1, padding:"9px 4px 10px",
                  background:"transparent", border:"none",
                  borderBottom: active ? `2px solid ${C.gold}` : "2px solid transparent",
                  cursor:"pointer",
                  display:"flex", flexDirection:"column", alignItems:"center", gap:2,
                  position:"relative", transition:"color 0.15s, border-color 0.15s",
                }}>
                  <span className="material-symbols-outlined" style={{
                    fontSize:18, color:active ? C.gold : C.hint,
                    fontVariationSettings:`'FILL' ${active?1:0}`,
                  }}>{n.msIcon}</span>
                  <span style={{
                    fontSize:9, fontWeight:active?700:400, letterSpacing:0.3,
                    textTransform:"uppercase", color:active ? C.gold : C.hint,
                  }}>{n.label}</span>
                  {n.badge > 0 && (
                    <span style={{
                      position:"absolute", top:5, right:"50%", transform:"translateX(10px)",
                      background:C.green, color:C.bg, borderRadius:"50%",
                      width:14, height:14, fontSize:8, fontWeight:700,
                      display:"flex", alignItems:"center", justifyContent:"center",
                    }}>{n.badge > 9 ? "9+" : n.badge}</span>
                  )}
                </button>
              );
            })}

            {/* Botón ··· — abre/cierra drawer */}
            <button onClick={()=>setDrawerOpen(o=>!o)} style={{
              width:46, flexShrink:0, padding:"9px 4px 10px",
              background:"transparent", border:"none",
              borderBottom: drawerHasActive
                ? `2px solid ${C.gold}`
                : drawerOpen ? `2px solid ${C.gold}66` : "2px solid transparent",
              cursor:"pointer",
              display:"flex", flexDirection:"column", alignItems:"center", gap:2,
              transition:"border-color 0.15s",
            }}>
              <span className="material-symbols-outlined" style={{
                fontSize:18,
                color: drawerHasActive ? C.gold : drawerOpen ? C.gold : C.hint,
                fontVariationSettings:`'FILL' ${drawerHasActive?1:0}`,
                transition:"color 0.15s",
              }}>{drawerOpen ? "close" : "apps"}</span>
              <span style={{
                fontSize:9, letterSpacing:0.3, textTransform:"uppercase",
                color: drawerHasActive ? C.gold : drawerOpen ? C.gold : C.hint,
                fontWeight: drawerHasActive || drawerOpen ? 700 : 400,
                transition:"color 0.15s",
              }}>{drawerOpen ? "Cerrar" : "Más"}</span>
            </button>
          </nav>
        </div>

        {/* ── Drawer — anclado al header, arranca justo debajo de la nav ── */}
        {drawerOpen && (
          <>
            {/* Backdrop */}
            <div onClick={()=>setDrawerOpen(false)} style={{
              position:"fixed", inset:0, zIndex:38,
              background:"rgba(0,0,0,0.45)",
              backdropFilter:"blur(2px)", WebkitBackdropFilter:"blur(2px)",
            }}/>
            {/* Panel — position absolute dentro del header sticky */}
            <div className="it-fade-in" style={{
              position:"absolute", top:"100%", right:0, zIndex:39,
              width: Math.min(280, window.innerWidth * 0.82),
              maxHeight:"75vh",
              background:C.bg2,
              borderLeft:`1px solid ${C.gold}33`,
              borderBottom:`1px solid ${C.gold}22`,
              display:"flex", flexDirection:"column",
              boxShadow:"-8px 8px 32px rgba(0,0,0,0.6)",
            }}>
              {/* Drawer items */}
              <div style={{ flex:1, overflowY:"auto", padding:"10px 10px", display:"flex", flexDirection:"column", gap:5 }}>
                {navDrawer.map(n => {
                  const active = section === n.id;
                  return (
                    <button key={n.id} onClick={()=>{ setSection(n.id); setDrawerOpen(false); }} style={{
                      background: active ? `${C.gold}12` : "transparent",
                      border:`1px solid ${active ? C.gold+"55" : C.border}`,
                      borderRadius:12, padding:"11px 14px", cursor:"pointer",
                      display:"flex", alignItems:"center", gap:12, textAlign:"left",
                      transition:"all 0.15s", width:"100%", boxSizing:"border-box",
                    }}
                    onMouseEnter={e=>{ if(!active) e.currentTarget.style.borderColor=C.gold+"33"; }}
                    onMouseLeave={e=>{ if(!active) e.currentTarget.style.borderColor=C.border; }}
                    >
                      <div style={{
                        width:34, height:34, borderRadius:9, flexShrink:0,
                        background: active ? `${C.gold}20` : C.bg3,
                        border:`1px solid ${active ? C.gold+"44" : C.border}`,
                        display:"flex", alignItems:"center", justifyContent:"center",
                      }}>
                        <span className="material-symbols-outlined" style={{
                          fontSize:18, color: active ? C.gold : C.hint,
                          fontVariationSettings:`'FILL' ${active?1:0}`,
                        }}>{n.msIcon}</span>
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:13, color: active ? C.gold : C.text, fontWeight: active ? 700 : 400 }}>{n.label}</div>
                        <div style={{ fontSize:10, color:C.hint, marginTop:1 }}>{n.desc}</div>
                      </div>
                      {active && <MIcon name="chevron_right" size={15} color={C.gold} />}
                    </button>
                  );
                })}
              </div>
              {/* Footer */}
              <div style={{ padding:"8px 14px", borderTop:`1px solid ${C.border}`, fontSize:10, color:C.hint, textAlign:"center", letterSpacing:0.3 }}>
                Progetto Italiano · v19
              </div>
            </div>
          </>
        )}
      </header>

      {/* ── Drawer overlay antiguo — eliminado, ahora está dentro del header ── */}

      {/* ── Content ── */}
      <main style={{ maxWidth:720, margin:"0 auto", padding:"20px 14px 80px" }}>
        {section==="hoy" && <HoyModule db={db} progresoMap={progresoMap} weekNum={weekNum} dayNum={dayNum} />}
        {section==="mezcla" && <MezclaModule db={db} progresoMap={progresoMap} refreshProgreso={refreshProgreso} />}
        {section==="mezclaAv" && <MezclaAvanzadaModule db={db} progresoMap={progresoMap} refreshProgreso={refreshProgreso} />}
        {section==="vocab" && <VocabModule db={db} progresoMap={progresoMap} refreshProgreso={refreshProgreso} />}
        {section==="srs" && <SRSModule db={db} progresoMap={progresoMap} refreshProgreso={refreshProgreso} />}
        {section==="quiz" && <QuizModule db={db} progresoMap={progresoMap} />}
        {section==="grammar" && <GrammarModule />}
        {section==="reading" && <ReadingModule db={db} progresoMap={progresoMap} refreshProgreso={refreshProgreso} />}
        {section==="storie" && <StorieModule db={db} progresoMap={progresoMap} refreshProgreso={refreshProgreso} />}
        {section==="speaking" && <SpeakingModule db={db} />}
        {section==="diario" && <DiarioModule />}
        {section==="stats" && <StatsModule db={db} progresoMap={progresoMap} />}
        {section==="coach" && <CoachModule db={db} progresoMap={progresoMap} />}
        {section==="immersione" && <ImmersioneModule />}
      </main>
    </div>
  );
}

/*
════════════════════════════════════════════════════════════════════════════════
  CONTEXTO COMPLETO PARA EL PRÓXIMO CHAT
  Copia todo este bloque y pégalo al inicio del próximo chat junto con el archivo
════════════════════════════════════════════════════════════════════════════════

PROYECTO: App de aprendizaje de italiano conectada a Supabase
ARCHIVO BASE: italiano-v17.tsx  ← este mismo archivo
ESTADO ACTUAL: v17 completa y funcional

════════════════════════════════════
  STACK TÉCNICO
════════════════════════════════════
- React JSX (artifact Claude.ai)
- Supabase REST API con fetch directo (sin librería cliente)
- Web Speech API para TTS en italiano
- Anthropic API (claude-sonnet-4-20250514) en módulo Speaking

Supabase:
  URL: https://hdmowcceetnxlnkpytjd.supabase.co
  KEY: sb_publishable_m82yyTewd2rt4IinvgNiMw_qzP00goJ
  RLS: deshabilitado en todas las tablas

════════════════════════════════════
  5 TABLAS EN SUPABASE
════════════════════════════════════
vocabulario      → id(uuid), palabra_it, traduccion_es, ejemplo, categoria, nivel, semana, dia, activa
planes_semanales → id, semana_num, titulo, tema_principal, objetivo_semana, reto_semanal,
                   palabras_meta, fase, principio_cientifico
planes_diarios   → id, semana_num, dia_num, titulo_dia, tema, actividad_srs,
                   actividad_input, actividad_output, tarea_dia, frase_clave_it, frase_clave_es
progreso_usuario → id, palabra_id(uuid→vocabulario.id), guardada, repeticiones,
                   ease_factor, intervalo_dias, proximo_repaso(date), ultima_calidad
lecturas         → id, titulo, nivel, semana_desde, emoji, texto, glosario_json, activa
conversaciones_speaking → id(uuid), escenario_id, escenario_label, escenario_emoji,
                   escenario_nivel, mensajes_json, resumen_json, total_intercambios, fecha

IMPORTANTE – progreso_usuario:
  - palabra_id es UUID generado por Supabase (no un string externo)
  - Al guardar: api.create con { palabra_id: word.id, ... }
  - Al actualizar: api.update con id del registro de progreso
  - Campos exactos: intervalo_dias, ease_factor, ultima_calidad, proximo_repaso (date string YYYY-MM-DD)
  - Todos los campos en snake_case

════════════════════════════════════
  DATOS SEED ACTUALES (v2)
════════════════════════════════════
SEED_VOCAB       → 600 palabras, semanas 1–30, niveles A0→B1
SEED_SEMANALES   → 30 semanas completas (4 fases)
SEED_DIARIOS     → 93 días (≥3 por semana)
SEED_LECTURAS    → 21 textos graduados A0→B1 (6 nuevos B1 avanzado sem. 25–30)

4 Fases:
  Fondamenta     (sem. 1–4)   A0       Saluti, numeri, ristorante, casa, trasporti, burocrazia
  Vita Quotidiana(sem. 5–12)  A0→A1    Cucina, lavoro, relazioni, media, famiglia, salute
  Connessione    (sem. 13–22) A1→A2    Gramática, passato, futuro, opinioni, connettivi
  Immersione     (sem. 23–30) A2→B1    Input nativo, lavoro B1, cultura, attualità, idioms

════════════════════════════════════
  6 MÓDULOS DE LA APP
════════════════════════════════════
📅 Hoy (HoyModule)
  - Muestra plan semanal: objetivo, reto, principio científico
  - Plan diario: actividades SRS / Input / Output / Tarea / Frase clave con 🔊
  - Vocabulario del día con ★ guardado
  - Controles S(1-30) / D(1-6) en el header

📚 Vocab (VocabModule)
  - Lista completa con búsqueda + filtros por nivel (A0/A1/A2/B1), categoría, semana
  - Modal de detalle: nivel, categoría, ejemplo con 🔊, progreso SRS
  - Botón guardar → escribe en progreso_usuario

🔁 Repasos (SRSModule)
  - Algoritmo SM-2 real: muestra español → adivina italiano
  - Califica: Mal(2)/Regular(3)/Bien(4)/Perfecto(5)
  - Actualiza progreso_usuario con UUID correcto

✏️ Quiz (QuizModule)
  - Generado desde vocab guardado del usuario
  - 4 tipos: translate_to_it, translate_to_es, audio_pick, fill_blank
  - Score con % y colores verde/rojo

📖 Leer (ReadingModule)
  - Textos graduados ordenados por nivel
  - Palabras del glosario subrayadas → tooltip con significado + botón "Guardar en SRS"
  - Glosario completo al pie de cada texto

🗣️ Habla (SpeakingModule)
  - Chat con Anthropic API (claude-sonnet-4-20250514)
  - IA responde: italiano + ES: traducción + 💡 Corrección si hay errores
  - Botón 🔊 TTS en cada respuesta

📊 Stats (StatsModule) ← NUEVO en v3
  - KPIs: racha de días, palabras guardadas/aprendidas/dominadas
  - 4 barras de progreso general (guardado, aprendido, dominado, al día)
  - Calidad promedio SRS + histograma de intervalos SM-2
  - Distribución de vocab por nivel (A0/A1/A2/B1) con barras
  - Heatmap 6x5 de cobertura por semana (coloreado por fase)
  - Análisis personalizado con recomendaciones automáticas

════════════════════════════════════
  PRINCIPIOS CIENTÍFICOS (guían el contenido)
════════════════════════════════════
- Ley de Zipf: vocabulario de alta frecuencia primero
- Krashen i+1: input comprensible ligeramente sobre el nivel actual
- SM-2: repetición espaciada con intervalos adaptativos
- Output desde el día 1: hablar aunque sea básico
- Consistencia > intensidad: 20-30 min diarios
- Metacognición: el usuario monitorea su propio progreso

════════════════════════════════════
  PERFIL DEL USUARIO
════════════════════════════════════
- Principiante absoluto italiano (nivel A0 → meta B1)
- 20–30 min/día disponibles
- Motivación principal: vivir en Italia
- Habla español como lengua nativa

════════════════════════════════════
  LO QUE ESTÁ LISTO (no tocar)
════════════════════════════════════
✅ Todas las constantes SUPABASE_URL / SUPABASE_KEY
✅ api helper: list, create, update, upsert, seed
✅ Algoritmo SM-2 (getNextSRS / isDue)
✅ Sistema de colores C{}
✅ Componentes: SpeakBtn, Tag, Loader, speak()
✅ SetupModal con barra de progreso y detección de DB vacía
✅ Los 6 módulos completamente funcionales
✅ Root App con navegación, controles S/D, badge de repasos

════════════════════════════════════
  POSIBLES MEJORAS PARA PRÓXIMO CHAT
════════════════════════════════════
[x] Vocab completado: 861 palabras A0→B1 (días 1-6 en todas las semanas)
[x] Módulo Stats: progreso SRS, racha, cobertura por semana, análisis personalizado
[x] Agregar días 4, 5 y 6 para todas las semanas (completo: 861 palabras)
[x] Añadir 5+ textos de lectura nivel B1 avanzado (sem. 25-30) → 6 textos nuevos
[x] Selector de escenario en SpeakingModule (filtro por nivel + búsqueda)
[x] Historial + resumen de conversaciones Speaking (errores, correcciones, frases nuevas)
     → Nueva tabla: conversaciones_speaking (crear manualmente en Supabase)
     → Resumen IA post-sesión: frases aprendidas, errores, puntos fuertes, vocabulario clave
     → Panel Historial: lista de sesiones expandibles con todos los detalles
     → Vista Resumen: aparece al terminar cada sesión antes de volver al selector
[x] Test de nivel inicial (diagnóstico A0/A1/A2) para setup personalizado
[x] Diario en italiano con corrección IA → implementado en v16
     → Textarea libre: usuario escribe 3-5 frases sobre su día en italiano
     → Claude analiza, marca errores en contexto y explica cada corrección
     → Entradas guardadas en Supabase con fecha para ver evolución semana a semana
     → Reutiliza la misma llamada Anthropic API del SpeakingModule
     → Diferenciador clave: output libre corregido en tiempo real, ninguna app gratis lo tiene
[x] Resumen post-sesión SRS con animación → implementado en v15
[x] Módulo de gramática interactiva → implementado en v18
     → Tablas de conjugación para 10 verbos core: essere, avere, andare, fare, volere, potere, dovere, sapere, venire, stare
     → Cada forma verbal tiene ejemplo contextual + SpeakBtn con ElevenLabs/fallback
     → Ejercicios fill-in-the-blank con corrección inteligente y explicación gramatical
     → Datos 100% estáticos en el código (como los SEED del vocab), sin Supabase nueva
     → Progreso ligero en localStorage: sesiones, respuestas, aciertos, último porcentaje
     → Dobla el valor educativo: el usuario entiende el "por qué" detrás del vocab que ya tiene
[x] Integración con ElevenLabs para TTS de mayor calidad
     → speakEL() con modelo eleven_multilingual_v2
     → 5 voces italianas nativas seleccionables
     → Caché de audio (hasta 80 clips) para no re-descargar
     → Fallback automático a Web Speech si no hay API key
     → Modal de configuración con prueba de voz en vivo
     → Botón 🔊 en header: dorado si EL activo, gris si básico
[x] STT híbrido en módulo Habla (v10)
     → Web Speech API como primera opción (Chrome/Edge/Safari, sin key, instantáneo)
     → Groq Whisper como fallback (Firefox/Safari problemático, necesita key gsk_...)
     → Botón 🎙️ con animación de ondas al grabar y spinner al procesar
     → Key de Groq configurable desde el mismo modal de audio (⚙️ en header)
     → Auto-stop a los 30 segundos de grabación
     → Indicador visual según modo activo (idle / listening / processing)
     → Si ninguna opción disponible, el botón no aparece y el input sigue funcionando
[x] Racha con comodín (v11)
     → markActivity() llamado en: guardar vocab, calificar SRS, enviar mensaje Speaking
     → calcStreak() con lógica de comodín: 1 día de gracia por racha activa
     → Log de actividad en localStorage (it_activity_log) — funciona offline, sin Supabase
     → Chip 🔥 visible en el header con color dinámico: verde ≥3, naranja ≥7, dorado ≥14
     → Escudo 🛡️ cuando el comodín está activo ese día
     → Historial de hasta 400 días guardados
[x] Modo offline con caché localStorage (v12)
     → loadData() guarda vocab+planes+lecturas en it_db_cache tras cada carga exitosa
     → Si Supabase falla, carga el caché silenciosamente en lugar de mostrar error
     → Banner dorado discreto "Sin conexión" con botón Reintentar visible en el header
     → progresoMap NO se cachea — siempre viene de Supabase cuando hay conexión
     → Cache pesa ~300KB, dentro del límite de 5MB de localStorage
     → Primera vez sin internet y sin cache: comportamiento original (error normal)
[x] Resumen post-sesión SRS con IA (v15)
     → Pantalla de cierre completa al terminar todos los repasos del día
     → Emoji + título dinámico según % de acierto (🏆 100%, ⭐ ≥80%, 💪 ≥50%, 📚 resto)
     → 4 métricas de sesión: palabras subidas/bajadas de nivel, perfectas, a repasar mañana
     → Barra de desglose visual por calidad (Mal/Regular/Bien/Perfecto) con mini-barras
     → Mensaje motivacional de 2 frases generado por Claude con dato concreto de la sesión
     → Spinner de puntos mientras genera el mensaje, fallback silencioso si falla la API
     → Reutiliza Anthropic API ya existente, max_tokens:120 para respuesta instantánea
     → Análisis en tiempo real del progresoMap: ease_factor, repeticiones, intervalo_dias
     → Bloque "Prioridad de hoy" con 4 estados: repasos urgentes, palabras difíciles, vocab completado, inicio normal
     → Sección "Palabras que te cuestan": top-3 con ease_factor < 2.0, con EF visible y audio
     → Métricas adaptativas: tasa de acierto estimada, palabras dominadas, racha activa
     → Banner verde al completar todo el vocab del día
     → Sin APIs externas — 100% calculado desde progresoMap local
     → Quinto tipo de pregunta: escuchas el audio → escribes la palabra italiana
     → Input de texto con corrección flexible via Levenshtein (normaliza acentos italianos)
     → Botón 🎙️ opcional al lado del input si hay Web Speech o Groq disponible
     → STT reutiliza la misma arquitectura híbrida del SpeakingModule
     → Al corregir: ✓ verde si correcto, ✗ rosa con tu respuesta + la correcta
     → buildQuiz() cicla ahora entre 5 tipos en vez de 4

════════════════════════════════════
  CÓMO USAR ESTE ARCHIVO
════════════════════════════════════
1. Abrir Claude.ai → New Artifact → React
2. Pegar el contenido de este archivo completo (sin este bloque de comentario)
3. La primera vez aparece SetupModal → pulsar "Inicializar 30 Semanas"
4. Esperar ~30 segundos mientras puebla Supabase (solo una vez)
5. La app funciona sola a partir de ahí

Si Supabase ya tiene datos y quieres reiniciar:
  DELETE FROM progreso_usuario;
  DELETE FROM vocabulario;
  DELETE FROM planes_semanales;
  DELETE FROM planes_diarios;
  DELETE FROM lecturas;
  → Luego recargar la app y el SetupModal aparecerá de nuevo

════════════════════════════════════════════════════════════════════════════════
*/
