import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Inizializzazione Client Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;

// Account Super Admin di Emergenza (Fallback)
const SUPER_ADMIN = {
  id: 'super-admin-id',
  email: 'superadmin@skirank.it',
  name: 'Super Admin',
  role: 'admin',
  category: 'Tutti'
};

export default function Home() {
  // --- STATI DI AUTENTICAZIONE E UTENTE ---
  const [currentUser, setCurrentUser] = useState(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // --- DATI REPO (MEMBRI E VIDEO) ---
  const [members, setMembers] = useState([]);
  const [videos, setVideos] = useState([]);

  // --- STATI FORM DI REGISTRAZIONE ---
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState('athlete');
  const [regCategory, setRegCategory] = useState('Baby / Cuccioli');

  // --- STATI MODALI ED INTERFACCIA ---
  const [activeTab, setActiveTab] = useState('videos'); // 'videos', 'presence', 'members'
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showRegModal, setShowRegModal] = useState(false);

  // --- STATI FORM UPLOAD VIDEO ---
  const [selectedRawFile, setSelectedRawFile] = useState(null);
  const [videoSpecialty, setVideoSpecialty] = useState('Gigante');
  const [videoDate, setVideoDate] = useState(new Date().toISOString().split('T')[0]);
  const [videoLocation, setVideoLocation] = useState('Bardonecchia');
  const [videoSlope, setVideoSlope] = useState('Pista Standard');
  const [videoTaggedAthleteId, setVideoTaggedAthleteId] = useState('');
  const [uploading, setUploading] = useState(false);

  // --- STATI FILTRI VIDEO ---
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('Tutti');
  const [selectedAthleteFilter, setSelectedAthleteFilter] = useState('Tutti');

  // --- STATO APPELLO PRESENZE ---
  const [attendance, setAttendance] = useState({});

  // 1. CARICAMENTO INIZIALE DATI DA SUPABASE
  useEffect(() => {
    if (!supabase) return;

    const fetchData = async () => {
      // Carica Membri
      const { data: membersData, error: mErr } = await supabase.from('club_members').select('*');
      if (!mErr && membersData) setMembers(membersData);

      // Carica Video
      const { data: videoData, error: vErr } = await supabase.from('video_library').select('*').order('created_at', { ascending: false });
      if (!vErr && videoData) setVideos(videoData);
    };

    fetchData();
  }, []);

  // 2. GESTIONE LOGIN
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');

    // Accesso Super Admin di Emergenza
    if (loginEmail === 'superadmin@skirank.it' && loginPassword === 'admin') {
      setCurrentUser(SUPER_ADMIN);
      return;
    }

    if (!supabase) {
      setAuthError('Database non collegato.');
      return;
    }

    const { data, error } = await supabase
      .from('club_members')
      .select('*')
      .eq('email', loginEmail)
      .eq('password', loginPassword)
      .single();

    if (error || !data) {
      setAuthError('Email o password non corretti.');
    } else {
      setCurrentUser(data);
    }
  };

  // 3. GESTIONE REGISTRAZIONE NUOVO UTENTE
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPassword) return;

    const newUser = {
      name: regName,
      email: regEmail,
      password: regPassword,
      role: regRole,
      category: regRole === 'athlete' ? regCategory : 'Staff'
    };

    if (supabase) {
      const { data, error } = await supabase.from('club_members').insert([newUser]).select();
      if (error) {
        alert(`Errore registrazione: ${error.message}`);
        return;
      }
      if (data) {
        setMembers([...members, data[0]]);
        alert('Account registrato con successo! Ora puoi effettuare il login.');
        setShowRegModal(false);
      }
    }
  };

  // 4. CARICAMENTO VIDEO SU CLOUDFLARE R2 TRAMITE PRESIGNED URL
  const handleUploadToCloudflare = async (e) => {
    e.preventDefault();
    if (!selectedRawFile) return;

    setUploading(true);
    try {
      // Step A: Richiesta Presigned URL al backend Vercel
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: selectedRawFile.name || 'video.mp4',
          contentType: selectedRawFile.type || 'video/mp4',
        }),
      });

      const dataRes = await res.json();
      if (!res.ok || !dataRes.uploadUrl) {
        throw new Error(dataRes.error || 'Impossibile ottenere autorizzazione di upload');
      }

      // Step B: Upload Diretto su Cloudflare R2
      const uploadRes = await fetch(dataRes.uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': selectedRawFile.type || 'video/mp4',
        },
        body: selectedRawFile,
      });

      if (!uploadRes.ok) {
        throw new Error(`Errore trasferimento Cloudflare: HTTP ${uploadRes.status}`);
      }

      const taggedAthlete = members.find(m => String(m.id) === String(videoTaggedAthleteId));

      const newVideo = {
        video_url: dataRes.publicUrl,
        specialty: videoSpecialty,
        date: videoDate,
        location: videoLocation || 'Bardonecchia',
        slope: videoSlope || 'Pista Standard',
        athlete_id: videoTaggedAthleteId,
        athlete_name: taggedAthlete ? taggedAthlete.name : 'Non Taggato',
        athlete_group: taggedAthlete ? taggedAthlete.category : 'Generale',
        uploaded_by: currentUser.name,
      };

      // Step C: Salvataggio metadati su Supabase
      if (supabase) {
        const { data, error: sbErr } = await supabase.from('video_library').insert([newVideo]).select();
        if (sbErr) throw sbErr;
        if (data) setVideos([data[0], ...videos]);
      }

      setShowUploadModal(false);
      setSelectedRawFile(null);
      alert('Video caricato con successo!');
    } catch (err) {
      console.error(err);
      alert(`Errore: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  // 5. FILTRO RISERVATO VIDEO (PRIVACY ATLETI)
  const visibleVideos = videos.filter(video => {
    // Se l'utente è un Atleta, vede SOLTANTO i video in cui è taggato
    if (currentUser?.role === 'athlete' || currentUser?.role === 'atleta') {
      return String(video.athlete_id) === String(currentUser.id);
    }

    // Se è Coach o Admin, applica i filtri di selezione manuale
    if (selectedCategoryFilter !== 'Tutti' && video.athlete_group !== selectedCategoryFilter) {
      return false;
    }
    if (selectedAthleteFilter !== 'Tutti' && String(video.athlete_id) !== String(selectedAthleteFilter)) {
      return false;
    }

    return true;
  });

  // --- SCHERMATA LOGIN SE NON AUTENTICATO ---
  if (!currentUser) {
    return (
      <div style={styles.loginContainer}>
        <div style={styles.loginCard}>
          <h1 style={styles.logoTitle}>SKICLUB <span style={{ color: '#00d2ff' }}>PRO</span></h1>
          <p style={styles.subTitle}>Piattaforma Video & Gestione Sci Club</p>

          <form onSubmit={handleLogin} style={styles.form}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              style={styles.input}
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              placeholder="atleta@skirank.it"
              required
            />

            <label style={styles.label}>Password</label>
            <input
              type="password"
              style={styles.input}
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            {authError && <p style={styles.errorText}>{authError}</p>}

            <button type="submit" style={styles.btnPrimary}>Accedi</button>
          </form>

          <button onClick={() => setShowRegModal(true)} style={styles.btnSecondary}>
            Registra Nuovo Atleta / Allenatore
          </button>
        </div>

        {/* MODALE REGISTRAZIONE */}
        {showRegModal && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalCard}>
              <h3 style={styles.modalTitle}>Crea Nuovo Account</h3>
              <form onSubmit={handleRegister} style={styles.form}>
                <label style={styles.label}>Nome e Cognome</label>
                <input
                  type="text"
                  style={styles.input}
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  required
                />

                <label style={styles.label}>Email</label>
                <input
                  type="email"
                  style={styles.input}
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  required
                />

                <label style={styles.label}>Password</label>
                <input
                  type="password"
                  style={styles.input}
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  required
                />

                <label style={styles.label}>Ruolo</label>
                <select
                  style={styles.input}
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value)}
                >
                  <option value="athlete">Atleta / Allievo</option>
                  <option value="coach">Allenatore / Coach</option>
                </select>

                {regRole === 'athlete' && (
                  <>
                    <label style={styles.label}>Categoria</label>
                    <select
                      style={styles.input}
                      value={regCategory}
                      onChange={(e) => setRegCategory(e.target.value)}
                    >
                      <option value="Superbaby">Superbaby</option>
                      <option value="Baby / Cuccioli">Baby / Cuccioli</option>
                      <option value="Ragazzi / Allievi">Ragazzi / Allievi</option>
                      <option value="Giovani / Senior">Giovani / Senior</option>
                      <option value="Master">Master</option>
                    </select>
                  </>
                )}

                <div style={styles.modalActions}>
                  <button type="submit" style={styles.btnPrimary}>Conferma Registrazione</button>
                  <button type="button" onClick={() => setShowRegModal(false)} style={styles.btnCancel}>Annulla</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- DASHBOARD PRINCIPALE ---
  return (
    <div style={styles.dashboardContainer}>
      {/* HEADER */}
      <header style={styles.header}>
        <div>
          <h2 style={styles.headerTitle}>SKICLUB <span style={{ color: '#00d2ff' }}>PRO</span></h2>
          <p style={styles.headerUser}>Utente: <strong>{currentUser.name}</strong> ({currentUser.role.toUpperCase()})</p>
        </div>
        <button onClick={() => setCurrentUser(null)} style={styles.btnLogout}>Esci</button>
      </header>

      {/* NAVIGAZIONE TABS */}
      <nav style={styles.tabBar}>
        <button
          style={activeTab === 'videos' ? styles.tabActive : styles.tab}
          onClick={() => setActiveTab('videos')}
        >
          📹 Video Library
        </button>
        {currentUser.role !== 'athlete' && (
          <>
            <button
              style={activeTab === 'presence' ? styles.tabActive : styles.tab}
              onClick={() => setActiveTab('presence')}
            >
              📋 Appello Presenze
            </button>
            <button
              style={activeTab === 'members' ? styles.tabActive : styles.tab}
              onClick={() => setActiveTab('members')}
            >
              👥 Atleti & Staff
            </button>
          </>
        )}
      </nav>

      {/* SEZIONE VIDEO LIBRARY */}
      {activeTab === 'videos' && (
        <main style={styles.mainContent}>
          <div style={styles.sectionHeader}>
            <h3>
              {currentUser.role === 'athlete' ? 'I Miei Video' : 'Libreria Video Squadra'}
            </h3>
            {currentUser.role !== 'athlete' && (
              <button onClick={() => setShowUploadModal(true)} style={styles.btnPrimarySmall}>
                + Carica Nuovo Video
              </button>
            )}
          </div>

          {/* FILTRI (Visibili solo a Coach / Admin) */}
          {currentUser.role !== 'athlete' && (
            <div style={styles.filterRow}>
              <div>
                <label style={styles.filterLabel}>Filtra Categoria: </label>
                <select
                  style={styles.filterSelect}
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                >
                  <option value="Tutti">Tutte le Categorie</option>
                  <option value="Baby / Cuccioli">Baby / Cuccioli</option>
                  <option value="Ragazzi / Allievi">Ragazzi / Allievi</option>
                  <option value="Giovani / Senior">Giovani / Senior</option>
                  <option value="Master">Master</option>
                </select>
              </div>

              <div>
                <label style={styles.filterLabel}>Filtra Atleta: </label>
                <select
                  style={styles.filterSelect}
                  value={selectedAthleteFilter}
                  onChange={(e) => setSelectedAthleteFilter(e.target.value)}
                >
                  <option value="Tutti">Tutti gli Atleti</option>
                  {members.filter(m => m.role === 'athlete').map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* GRIGLIA VIDEO */}
          {visibleVideos.length === 0 ? (
            <div style={styles.emptyState}>
              <p>Nessun video trovato per i criteri selezionati.</p>
            </div>
          ) : (
            <div style={styles.videoGrid}>
              {visibleVideos.map((video) => (
                <div key={video.id} style={styles.videoCard}>
                  <video src={video.video_url} controls style={styles.videoPlayer} preload="metadata" />
                  <div style={styles.videoMeta}>
                    <span style={styles.badgeSpecialty}>{video.specialty}</span>
                    <h4 style={styles.videoTitle}>{video.athlete_name}</h4>
                    <p style={styles.videoSub}>📍 {video.location} - {video.slope}</p>
                    <p style={styles.videoDate}>📅 {video.date} | Coach: {video.uploaded_by}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      )}

      {/* SEZIONE APPELLO PRESENZE */}
      {activeTab === 'presence' && (
        <main style={styles.mainContent}>
          <h3>Registro Presenze Allenamento</h3>
          <p style={styles.subTitle}>Seleziona la data e spunta i presenti.</p>
          <div style={styles.membersList}>
            {members.filter(m => m.role === 'athlete').map(athlete => (
              <div key={athlete.id} style={styles.memberRow}>
                <div>
                  <strong>{athlete.name}</strong> ({athlete.category})
                </div>
                <button
                  style={attendance[athlete.id] ? styles.btnPresent : styles.btnAbsent}
                  onClick={() => setAttendance({ ...attendance, [athlete.id]: !attendance[athlete.id] })}
                >
                  {attendance[athlete.id] ? 'PRESENTES ✅' : 'ASSENTE ❌'}
                </button>
              </div>
            ))}
          </div>
        </main>
      )}

      {/* SEZIONE ELENCO MEMBRI */}
      {activeTab === 'members' && (
        <main style={styles.mainContent}>
          <h3>Elenco Iscritti Sci Club</h3>
          <div style={styles.membersList}>
            {members.map(m => (
              <div key={m.id} style={styles.memberRow}>
                <div>
                  <strong>{m.name}</strong> — <span>{m.email}</span>
                </div>
                <span style={styles.roleBadge}>{m.role.toUpperCase()} ({m.category})</span>
              </div>
            ))}
          </div>
        </main>
      )}

      {/* MODALE UPLOAD VIDEO */}
      {showUploadModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <h3 style={styles.modalTitle}>Carica Video su Cloudflare R2</h3>
            <form onSubmit={handleUploadToCloudflare} style={styles.form}>
              <label style={styles.label}>Seleziona File Video</label>
              <input
                type="file"
                accept="video/*"
                onChange={(e) => setSelectedRawFile(e.target.files[0])}
                style={styles.input}
                required
              />

              <label style={styles.label}>Atleta Taggato</label>
              <select
                style={styles.input}
                value={videoTaggedAthleteId}
                onChange={(e) => setVideoTaggedAthleteId(e.target.value)}
                required
              >
                <option value="">-- Seleziona Atleta --</option>
                {members.filter(m => m.role === 'athlete').map(m => (
                  <option key={m.id} value={m.id}>{m.name} ({m.category})</option>
                ))}
              </select>

              <label style={styles.label}>Specialità</label>
              <select
                style={styles.input}
                value={videoSpecialty}
                onChange={(e) => setVideoSpecialty(e.target.value)}
              >
                <option value="Gigante">Gigante (GS)</option>
                <option value="Special">Special (SL)</option>
                <option value="SuperG">SuperG (SG)</option>
                <option value="Campo Libero">Campo Libero</option>
              </select>

              <label style={styles.label}>Data Allenamento</label>
              <input
                type="date"
                style={styles.input}
                value={videoDate}
                onChange={(e) => setVideoDate(e.target.value)}
              />

              <label style={styles.label}>Località e Pista</label>
              <input
                type="text"
                style={styles.input}
                value={videoSlope}
                onChange={(e) => setVideoSlope(e.target.value)}
                placeholder="Es. Pista 23 - Melezet"
              />

              <div style={styles.modalActions}>
                <button type="submit" disabled={uploading} style={styles.btnPrimary}>
                  {uploading ? 'Caricamento in corso...' : 'Inizia Upload'}
                </button>
                <button type="button" onClick={() => setShowUploadModal(false)} style={styles.btnCancel}>Annulla</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// STILI CSS-IN-JS
const styles = {
  loginContainer: { minHeight: '100vh', backgroundColor: '#0f172a', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' },
  loginCard: { backgroundColor: '#1e293b', padding: '30px', borderRadius: '16px', width: '100%', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', color: '#fff' },
  logoTitle: { margin: 0, textAlign: 'center', fontSize: '28px', fontWeight: '800' },
  subTitle: { textAlign: 'center', color: '#94a3b8', fontSize: '14px', marginBottom: '24px' },
  form: { display: 'flex', flexDirection: 'column', gap: '12px' },
  label: { color: '#cbd5e1', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' },
  input: { padding: '12px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff', fontSize: '14px' },
  btnPrimary: { padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: '#00d2ff', color: '#0f172a', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' },
  btnSecondary: { padding: '10px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: 'transparent', color: '#94a3b8', marginTop: '12px', cursor: 'pointer', width: '100%' },
  btnCancel: { padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: '#475569', color: '#fff', cursor: 'pointer' },
  errorText: { color: '#ef4444', fontSize: '13px', margin: '4px 0' },

  dashboardContainer: { minHeight: '100vh', backgroundColor: '#0f172a', color: '#fff', fontFamily: 'sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', backgroundColor: '#1e293b', borderBottom: '1px solid #334155' },
  headerTitle: { margin: 0, fontSize: '20px' },
  headerUser: { margin: 0, fontSize: '12px', color: '#94a3b8' },
  btnLogout: { backgroundColor: '#ef4444', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' },

  tabBar: { display: 'flex', gap: '10px', padding: '12px 24px', backgroundColor: '#0f172a', borderBottom: '1px solid #1e293b' },
  tab: { padding: '10px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#1e293b', color: '#94a3b8', cursor: 'pointer' },
  tabActive: { padding: '10px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#00d2ff', color: '#0f172a', fontWeight: 'bold', cursor: 'pointer' },

  mainContent: { padding: '24px', maxWidth: '1200px', margin: '0 auto' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  btnPrimarySmall: { padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: '#00d2ff', color: '#0f172a', fontWeight: 'bold', cursor: 'pointer' },

  filterRow: { display: 'flex', gap: '20px', marginBottom: '20px', backgroundColor: '#1e293b', padding: '12px 16px', borderRadius: '8px' },
  filterLabel: { fontSize: '13px', color: '#cbd5e1', marginRight: '8px' },
  filterSelect: { padding: '6px 10px', borderRadius: '6px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff' },

  videoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' },
  videoCard: { backgroundColor: '#1e293b', borderRadius: '12px', overflow: 'hidden', border: '1px solid #334155' },
  videoPlayer: { width: '100%', height: '180px', backgroundColor: '#000' },
  videoMeta: { padding: '12px' },
  badgeSpecialty: { backgroundColor: '#00d2ff', color: '#0f172a', fontSize: '10px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px' },
  videoTitle: { margin: '8px 0 4px 0', fontSize: '16px' },
  videoSub: { margin: 0, fontSize: '12px', color: '#cbd5e1' },
  videoDate: { margin: '8px 0 0 0', fontSize: '11px', color: '#64748b' },

  membersList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  memberRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: '#1e293b', borderRadius: '8px' },
  btnPresent: { padding: '6px 12px', borderRadius: '6px', border: 'none', backgroundColor: '#22c55e', color: '#fff', fontWeight: 'bold', cursor: 'pointer' },
  btnAbsent: { padding: '6px 12px', borderRadius: '6px', border: 'none', backgroundColor: '#ef4444', color: '#fff', fontWeight: 'bold', cursor: 'pointer' },
  roleBadge: { fontSize: '11px', backgroundColor: '#334155', padding: '4px 8px', borderRadius: '4px' },

  emptyState: { textAlign: 'center', padding: '40px', color: '#64748b' },

  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalCard: { backgroundColor: '#1e293b', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '450px', border: '1px solid #334155' },
  modalTitle: { margin: '0 0 16px 0', fontSize: '18px', color: '#00d2ff' },
  modalActions: { display: 'flex', gap: '10px', marginTop: '16px' }
};
