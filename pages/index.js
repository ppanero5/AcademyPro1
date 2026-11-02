import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Supabase Init
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;

// Super Admin Emergency Account
const SUPER_ADMIN = {
  id: 'super-admin-id',
  email: 'superadmin@skirank.it',
  name: 'Super Admin',
  role: 'admin',
  coach_group: 'Tutti',
  category: 'Tutti'
};

export default function Home() {
  // --- AUTENTICAZIONE E UTENTE ---
  const [currentUser, setCurrentUser] = useState(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // --- DATI ---
  const [members, setMembers] = useState([]);
  const [videos, setVideos] = useState([]);
  const [dailyNotes, setDailyNotes] = useState([]);
  const [attendanceLogs, setAttendanceLogs] = useState([]);

  // --- REGISTRAZIONE ---
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState('athlete');
  const [regCategory, setRegCategory] = useState('Baby / Cuccioli');
  const [regCoachGroup, setRegCoachGroup] = useState('Piccoli'); // 'Piccoli' o 'Grandi'

  // --- NAVEGAZIONE E MODALI ---
  const [activeTab, setActiveTab] = useState('videos'); // 'videos', 'presence', 'stats', 'members'
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showRegModal, setShowRegModal] = useState(false);
  const [selectedAthleteForStats, setSelectedAthleteForStats] = useState(null);

  // --- RICERCA E FILTRI ---
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('Tutti');
  const [selectedAthleteFilter, setSelectedAthleteFilter] = useState('Tutti');

  // --- FORM UPLOAD VIDEO ---
  const [selectedRawFile, setSelectedRawFile] = useState(null);
  const [videoSpecialty, setVideoSpecialty] = useState('Gigante');
  const [videoDate, setVideoDate] = useState(new Date().toISOString().split('T')[0]);
  const [videoLocation, setVideoLocation] = useState('Bardonecchia');
  const [videoSlope, setVideoSlope] = useState('Pista Standard');
  const [videoTaggedAthleteId, setVideoTaggedAthleteId] = useState('');
  const [uploading, setUploading] = useState(false);

  // --- FORM APPELLO & NOTE ---
  const [presenceDate, setPresenceDate] = useState(new Date().toISOString().split('T')[0]);
  const [presenceSpecialty, setPresenceSpecialty] = useState('Gigante');
  const [dailyNoteText, setDailyNoteText] = useState('');
  const [attendance, setAttendance] = useState({});

  // 1. CARICAMENTO DATI
  useEffect(() => {
    if (!supabase) return;

    const fetchData = async () => {
      const { data: membersData } = await supabase.from('club_members').select('*');
      if (membersData) setMembers(membersData);

      const { data: videoData } = await supabase.from('video_library').select('*').order('created_at', { ascending: false });
      if (videoData) setVideos(videoData);

      const { data: notesData } = await supabase.from('daily_notes').select('*').order('created_at', { ascending: false });
      if (notesData) setDailyNotes(notesData || []);

      const { data: attData } = await supabase.from('attendance_history').select('*');
      if (attData) setAttendanceLogs(attData || []);
    };

    fetchData();
  }, []);

  // 2. LOGIN
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');

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
      setAuthError('Email o password errati.');
    } else {
      setCurrentUser(data);
    }
  };

  // 3. REGISTRAZIONE
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPassword) return;

    const newUser = {
      name: regName,
      email: regEmail,
      password: regPassword,
      role: regRole,
      category: regRole === 'athlete' ? regCategory : 'Staff',
      coach_group: regRole === 'coach' ? regCoachGroup : null
    };

    if (supabase) {
      const { data, error } = await supabase.from('club_members').insert([newUser]).select();
      if (error) {
        alert(`Errore registrazione: ${error.message}`);
        return;
      }
      if (data) {
        setMembers([...members, data[0]]);
        alert('Account registrato con successo!');
        setShowRegModal(false);
      }
    }
  };

  // 4. UPLOAD VIDEO
  const handleUploadToCloudflare = async (e) => {
    e.preventDefault();
    if (!selectedRawFile) return;

    setUploading(true);
    try {
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
        throw new Error(dataRes.error || 'Errore autorizzazione upload');
      }

      const uploadRes = await fetch(dataRes.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': selectedRawFile.type || 'video/mp4' },
        body: selectedRawFile,
      });

      if (!uploadRes.ok) {
        throw new Error(`Errore trasferimento R2: HTTP ${uploadRes.status}`);
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

      if (supabase) {
        const { data, error: sbErr } = await supabase.from('video_library').insert([newVideo]).select();
        if (sbErr) throw sbErr;
        if (data) setVideos([data[0], ...videos]);
      }

      setShowUploadModal(false);
      setSelectedRawFile(null);
      alert('Video caricato con successo!');
    } catch (err) {
      alert(`Errore: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  // 5. SALVA APPELLO E NOTE
  const handleSaveAttendanceAndNotes = async () => {
    if (!supabase) return;

    try {
      // Salva nota del giorno se presente
      if (dailyNoteText.trim()) {
        const newNote = {
          date: presenceDate,
          category: currentUser.coach_group || 'Generale',
          author_name: currentUser.name,
          content: dailyNoteText
        };
        const { data: nData } = await supabase.from('daily_notes').insert([newNote]).select();
        if (nData) setDailyNotes([nData[0], ...dailyNotes]);
      }

      // Salva presenze
      const newEntries = [];
      Object.keys(attendance).forEach(athleteId => {
        if (attendance[athleteId]) {
          newEntries.push({
            date: presenceDate,
            athlete_id: athleteId,
            specialty: presenceSpecialty,
            status: 'present'
          });
        }
      });

      if (newEntries.length > 0) {
        const { data: aData } = await supabase.from('attendance_history').insert(newEntries).select();
        if (aData) setAttendanceLogs([...attendanceLogs, ...aData]);
      }

      alert('Appello e Note salvati con successo!');
      setDailyNoteText('');
      setAttendance({});
    } catch (err) {
      alert(`Errore nel salvataggio: ${err.message}`);
    }
  };

  // HELPER GRUPPI (Piccoli vs Grandi)
  const isPiccoli = (cat) => ['Superbaby', 'Baby / Cuccioli'].includes(cat);

  const canEditCategory = (category) => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    if (currentUser.role === 'athlete') return false;
    if (!currentUser.coach_group || currentUser.coach_group === 'Tutti') return true;
    if (currentUser.coach_group === 'Piccoli' && isPiccoli(category)) return true;
    if (currentUser.coach_group === 'Grandi' && !isPiccoli(category)) return true;
    return false;
  };

  // FILTRO ATLETI SEARCH BAR
  const filteredMembers = members.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // FILTRO VIDEO VISIBILI
  const visibleVideos = videos.filter(video => {
    if (currentUser?.role === 'athlete') {
      return String(video.athlete_id) === String(currentUser.id);
    }
    if (selectedCategoryFilter !== 'Tutti' && video.athlete_group !== selectedCategoryFilter) return false;
    if (selectedAthleteFilter !== 'Tutti' && String(video.athlete_id) !== String(selectedAthleteFilter)) return false;
    return true;
  });

  // SCHERMATA LOGIN
  if (!currentUser) {
    return (
      <div style={styles.loginContainer}>
        <div style={styles.loginCard}>
          <h1 style={styles.logoTitle}>SKICLUB <span style={{ color: '#1e3a8a' }}>PRO</span></h1>
          <p style={styles.subTitle}>Piattaforma Video & Gestione Sci Club</p>

          <form onSubmit={handleLogin} style={styles.form}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              style={styles.input}
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              placeholder="utente@skiclub.it"
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
            Registra Account
          </button>
        </div>

        {/* MODALE REGISTRAZIONE */}
        {showRegModal && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalCard}>
              <h3 style={styles.modalTitle}>Nuovo Utente</h3>
              <form onSubmit={handleRegister} style={styles.form}>
                <label style={styles.label}>Nome e Cognome</label>
                <input type="text" style={styles.input} value={regName} onChange={(e) => setRegName(e.target.value)} required />

                <label style={styles.label}>Email</label>
                <input type="email" style={styles.input} value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required />

                <label style={styles.label}>Password</label>
                <input type="password" style={styles.input} value={regPassword} onChange={(e) => setRegPassword(e.target.value)} required />

                <label style={styles.label}>Ruolo</label>
                <select style={styles.input} value={regRole} onChange={(e) => setRegRole(e.target.value)}>
                  <option value="athlete">Atleta</option>
                  <option value="coach">Allenatore</option>
                </select>

                {regRole === 'athlete' ? (
                  <>
                    <label style={styles.label}>Categoria Atleta</label>
                    <select style={styles.input} value={regCategory} onChange={(e) => setRegCategory(e.target.value)}>
                      <option value="Superbaby">Superbaby</option>
                      <option value="Baby / Cuccioli">Baby / Cuccioli</option>
                      <option value="Ragazzi / Allievi">Ragazzi / Allievi</option>
                      <option value="Giovani / Senior">Giovani / Senior</option>
                      <option value="Master">Master</option>
                    </select>
                  </>
                ) : (
                  <>
                    <label style={styles.label}>Gruppo Allenatore</label>
                    <select style={styles.input} value={regCoachGroup} onChange={(e) => setRegCoachGroup(e.target.value)}>
                      <option value="Piccoli">Piccoli (Superbaby / Baby / Cuccioli)</option>
                      <option value="Grandi">Grandi (Ragazzi / Allievi / Giovani / Master)</option>
                    </select>
                  </>
                )}

                <div style={styles.modalActions}>
                  <button type="submit" style={styles.btnPrimary}>Conferma</button>
                  <button type="button" onClick={() => setShowRegModal(false)} style={styles.btnCancel}>Annulla</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={styles.dashboardContainer}>
      {/* HEADER BIANCO E BLU SCURO */}
      <header style={styles.header}>
        <div>
          <h2 style={styles.headerTitle}>SKICLUB <span style={{ color: '#2563eb' }}>PRO</span></h2>
          <p style={styles.headerUser}>Utente: <strong>{currentUser.name}</strong> ({currentUser.role.toUpperCase()} {currentUser.coach_group ? `- Gruppo ${currentUser.coach_group}` : ''})</p>
        </div>
        <button onClick={() => setCurrentUser(null)} style={styles.btnLogout}>Esci</button>
      </header>

      {/* TABS */}
      <nav style={styles.tabBar}>
        <button style={activeTab === 'videos' ? styles.tabActive : styles.tab} onClick={() => setActiveTab('videos')}>
          📹 Video Library
        </button>
        {currentUser.role !== 'athlete' && (
          <button style={activeTab === 'presence' ? styles.tabActive : styles.tab} onClick={() => setActiveTab('presence')}>
            📋 Appello & Note
          </button>
        )}
        <button style={activeTab === 'stats' ? styles.tabActive : styles.tab} onClick={() => setActiveTab('stats')}>
          📊 Schede & Grafici
        </button>
        {currentUser.role !== 'athlete' && (
          <button style={activeTab === 'members' ? styles.tabActive : styles.tab} onClick={() => setActiveTab('members')}>
            👥 Atleti & Staff
          </button>
        )}
      </nav>

      {/* VISTA 1: VIDEO */}
      {activeTab === 'videos' && (
        <main style={styles.mainContent}>
          <div style={styles.sectionHeader}>
            <h3>{currentUser.role === 'athlete' ? 'I Miei Video' : 'Libreria Video Squadra'}</h3>
            {currentUser.role !== 'athlete' && (
              <button onClick={() => setShowUploadModal(true)} style={styles.btnPrimarySmall}>+ Carica Video</button>
            )}
          </div>

          {currentUser.role !== 'athlete' && (
            <div style={styles.filterRow}>
              <div>
                <label style={styles.filterLabel}>Categoria: </label>
                <select style={styles.filterSelect} value={selectedCategoryFilter} onChange={(e) => setSelectedCategoryFilter(e.target.value)}>
                  <option value="Tutti">Tutte</option>
                  <option value="Superbaby">Superbaby</option>
                  <option value="Baby / Cuccioli">Baby / Cuccioli</option>
                  <option value="Ragazzi / Allievi">Ragazzi / Allievi</option>
                  <option value="Giovani / Senior">Giovani / Senior</option>
                  <option value="Master">Master</option>
                </select>
              </div>
              <div>
                <label style={styles.filterLabel}>Atleta: </label>
                <select style={styles.filterSelect} value={selectedAthleteFilter} onChange={(e) => setSelectedAthleteFilter(e.target.value)}>
                  <option value="Tutti">Tutti</option>
                  {members.filter(m => m.role === 'athlete').map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {visibleVideos.length === 0 ? (
            <div style={styles.emptyState}><p>Nessun video trovato.</p></div>
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

      {/* VISTA 2: APPELLO & NOTE */}
      {activeTab === 'presence' && (
        <main style={styles.mainContent}>
          <h3>Registro Appello & Note Giornaliere</h3>
          <div style={styles.formRow}>
            <div>
              <label style={styles.filterLabel}>Data Allenamento: </label>
              <input type="date" style={styles.input} value={presenceDate} onChange={(e) => setPresenceDate(e.target.value)} />
            </div>
            <div>
              <label style={styles.filterLabel}>Specialità del Giorno: </label>
              <select style={styles.filterSelect} value={presenceSpecialty} onChange={(e) => setPresenceSpecialty(e.target.value)}>
                <option value="Gigante">Gigante (GS)</option>
                <option value="Special">Special (SL)</option>
                <option value="SuperG">SuperG (SG)</option>
                <option value="Campo Libero">Campo Libero</option>
              </select>
            </div>
          </div>

          <div style={{ marginTop: '20px' }}>
            <label style={styles.label}>Note di Allenamento (Condizioni neve, tracciato, correzioni):</label>
            <textarea
              style={styles.textArea}
              value={dailyNoteText}
              onChange={(e) => setDailyNoteText(e.target.value)}
              placeholder="Scrivi qui i dettagli della giornata..."
            />
          </div>

          {/* SEARCH BAR PER ATLETI */}
          <div style={{ marginTop: '20px', marginBottom: '10px' }}>
            <input
              type="text"
              style={styles.searchInput}
              placeholder="🔍 Cerca atleta per nome..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={styles.membersList}>
            {filteredMembers.filter(m => m.role === 'athlete').map(athlete => {
              const editable = canEditCategory(athlete.category);
              return (
                <div key={athlete.id} style={styles.memberRow}>
                  <div>
                    <strong>{athlete.name}</strong> ({athlete.category})
                    {!editable && <span style={styles.readOnlyTag}> (Sola Lettura)</span>}
                  </div>
                  <button
                    disabled={!editable}
                    style={attendance[athlete.id] ? styles.btnPresent : styles.btnAbsent}
                    onClick={() => editable && setAttendance({ ...attendance, [athlete.id]: !attendance[athlete.id] })}
                  >
                    {attendance[athlete.id] ? 'PRESENTE ✅' : 'ASSENTE ❌'}
                  </button>
                </div>
              );
            })}
          </div>

          <button onClick={handleSaveAttendanceAndNotes} style={{ ...styles.btnPrimary, marginTop: '20px', width: '100%' }}>
            Salva Appello & Note del Giorno
          </button>

          {/* STORICO NOTE */}
          <div style={{ marginTop: '40px' }}>
            <h4>Note Recenti Allenamenti</h4>
            {dailyNotes.map(note => (
              <div key={note.id} style={styles.noteCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong>📅 {note.date} - Gruppo {note.category}</strong>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Coach: {note.author_name}</span>
                </div>
                <p style={{ margin: '8px 0 0 0', color: '#334155' }}>{note.content}</p>
              </div>
            ))}
          </div>
        </main>
      )}

      {/* VISTA 3: SCHEDE ATLETI & GRAFICO A TORTA */}
      {activeTab === 'stats' && (
        <main style={styles.mainContent}>
          <h3>Schede Atleti & Statistiche Stagionali</h3>
          <p style={styles.subTitle}>Seleziona un atleta per visualizzare presenze e grafico delle attività.</p>

          <div style={{ marginBottom: '20px' }}>
            <select
              style={styles.input}
              value={selectedAthleteForStats ? selectedAthleteForStats.id : ''}
              onChange={(e) => {
                const found = members.find(m => String(m.id) === String(e.target.value));
                setSelectedAthleteForStats(found || null);
              }}
            >
              <option value="">-- Seleziona Atleta --</option>
              {members.filter(m => m.role === 'athlete').map(m => (
                <option key={m.id} value={m.id}>{m.name} ({m.category})</option>
              ))}
            </select>
          </div>

          {selectedAthleteForStats && (() => {
            const athleteLogs = attendanceLogs.filter(l => String(l.athlete_id) === String(selectedAthleteForStats.id));
            const totalPresences = athleteLogs.length;

            const gsCount = athleteLogs.filter(l => l.specialty === 'Gigante').length;
            const slCount = athleteLogs.filter(l => l.specialty === 'Special').length;
            const sgCount = athleteLogs.filter(l => l.specialty === 'SuperG').length;
            const clCount = athleteLogs.filter(l => l.specialty === 'Campo Libero').length;

            const gsDeg = totalPresences ? (gsCount / totalPresences) * 360 : 0;
            const slDeg = totalPresences ? (slCount / totalPresences) * 360 : 0;
            const sgDeg = totalPresences ? (sgCount / totalPresences) * 360 : 0;

            const pieConic = `conic-gradient(
              #2563eb 0deg ${gsDeg}deg,
              #0284c7 ${gsDeg}deg ${gsDeg + slDeg}deg,
              #059669 ${gsDeg + slDeg}deg ${gsDeg + slDeg + sgDeg}deg,
              #d97706 ${gsDeg + slDeg + sgDeg}deg 360deg
            )`;

            return (
              <div style={styles.statsCard}>
                <h4>{selectedAthleteForStats.name} — Categoria {selectedAthleteForStats.category}</h4>
                <p>Presenze Totali in Pista: <strong>{totalPresences} giornate</strong></p>

                <div style={styles.statsLayout}>
                  {/* GRAFICO A TORTA CONIC-GRADIENT */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ ...styles.pieChart, background: totalPresences > 0 ? pieConic : '#e2e8f0' }} />
                    <p style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>Ripartizione Specialità</p>
                  </div>

                  {/* LEGENDA E NUMERI */}
                  <div style={styles.legendList}>
                    <div><span style={{ ...styles.legendDot, backgroundColor: '#2563eb' }} /> Gigante: {gsCount} ({totalPresences ? Math.round((gsCount/totalPresences)*100) : 0}%)</div>
                    <div><span style={{ ...styles.legendDot, backgroundColor: '#0284c7' }} /> Speciale: {slCount} ({totalPresences ? Math.round((slCount/totalPresences)*100) : 0}%)</div>
                    <div><span style={{ ...styles.legendDot, backgroundColor: '#059669' }} /> SuperG: {sgCount} ({totalPresences ? Math.round((sgCount/totalPresences)*100) : 0}%)</div>
                    <div><span style={{ ...styles.legendDot, backgroundColor: '#d97706' }} /> Campo Libero: {clCount} ({totalPresences ? Math.round((clCount/totalPresences)*100) : 0}%)</div>
                  </div>
                </div>
              </div>
            );
          })()}
        </main>
      )}

      {/* VISTA 4: ISCRITTI & SEARCH BAR */}
      {activeTab === 'members' && (
        <main style={styles.mainContent}>
          <h3>Elenco Iscritti Sci Club</h3>

          <div style={{ marginBottom: '16px' }}>
            <input
              type="text"
              style={styles.searchInput}
              placeholder="🔍 Cerca per nome o email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={styles.membersList}>
            {filteredMembers.map(m => (
              <div key={m.id} style={styles.memberRow}>
                <div>
                  <strong>{m.name}</strong> — <span style={{ color: '#64748b' }}>{m.email}</span>
                </div>
                <span style={styles.roleBadge}>
                  {m.role.toUpperCase()} ({m.role === 'coach' ? `Gruppo ${m.coach_group || 'Grandi'}` : m.category})
                </span>
              </div>
            ))}
          </div>
        </main>
      )}

      {/* MODALE UPLOAD VIDEO */}
      {showUploadModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <h3 style={styles.modalTitle}>Carica Video</h3>
            <form onSubmit={handleUploadToCloudflare} style={styles.form}>
              <label style={styles.label}>File Video</label>
              <input type="file" accept="video/*" onChange={(e) => setSelectedRawFile(e.target.files[0])} style={styles.input} required />

              <label style={styles.label}>Atleta Taggato</label>
              <select style={styles.input} value={videoTaggedAthleteId} onChange={(e) => setVideoTaggedAthleteId(e.target.value)} required>
                <option value="">-- Seleziona Atleta --</option>
                {members.filter(m => m.role === 'athlete').map(m => (
                  <option key={m.id} value={m.id}>{m.name} ({m.category})</option>
                ))}
              </select>

              <label style={styles.label}>Specialità</label>
              <select style={styles.input} value={videoSpecialty} onChange={(e) => setVideoSpecialty(e.target.value)}>
                <option value="Gigante">Gigante (GS)</option>
                <option value="Special">Special (SL)</option>
                <option value="SuperG">SuperG (SG)</option>
                <option value="Campo Libero">Campo Libero</option>
              </select>

              <label style={styles.label}>Data</label>
              <input type="date" style={styles.input} value={videoDate} onChange={(e) => setVideoDate(e.target.value)} />

              <label style={styles.label}>Pista</label>
              <input type="text" style={styles.input} value={videoSlope} onChange={(e) => setVideoSlope(e.target.value)} placeholder="Es. Pista 23" />

              <div style={styles.modalActions}>
                <button type="submit" disabled={uploading} style={styles.btnPrimary}>
                  {uploading ? 'Caricamento...' : 'Avvia Upload'}
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

// NUOVO TEMA GRAFICO: SFONDO BIANCO E DETTAGLI BLU SCURO
const styles = {
  loginContainer: { minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' },
  loginCard: { backgroundColor: '#ffffff', padding: '32px', borderRadius: '16px', width: '100%', maxWidth: '400px', boxShadow: '0 10px 25px rgba(15,23,42,0.08)', color: '#0f172a', border: '1px solid #e2e8f0' },
  logoTitle: { margin: 0, textAlign: 'center', fontSize: '28px', fontWeight: '800', color: '#0f172a' },
  subTitle: { textAlign: 'center', color: '#64748b', fontSize: '14px', marginBottom: '24px' },
  form: { display: 'flex', flexDirection: 'column', gap: '12px' },
  label: { color: '#475569', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' },
  input: { padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', color: '#0f172a', fontSize: '14px' },
  textArea: { padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', color: '#0f172a', fontSize: '14px', minHeight: '80px', width: '100%' },
  searchInput: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '14px' },
  btnPrimary: { padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: '#1e3a8a', color: '#ffffff', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' },
  btnSecondary: { padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: 'transparent', color: '#475569', marginTop: '12px', cursor: 'pointer', width: '100%' },
  btnCancel: { padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: '#94a3b8', color: '#ffffff', cursor: 'pointer' },
  errorText: { color: '#ef4444', fontSize: '13px', margin: '4px 0' },

  dashboardContainer: { minHeight: '100vh', backgroundColor: '#ffffff', color: '#0f172a', fontFamily: 'sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', backgroundColor: '#0f172a', color: '#ffffff' },
  headerTitle: { margin: 0, fontSize: '20px', color: '#ffffff' },
  headerUser: { margin: 0, fontSize: '12px', color: '#94a3b8' },
  btnLogout: { backgroundColor: '#ef4444', border: 'none', color: '#ffffff', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' },

  tabBar: { display: 'flex', gap: '10px', padding: '12px 24px', backgroundColor: '#f1f5f9', borderBottom: '1px solid #e2e8f0' },
  tab: { padding: '10px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#ffffff', color: '#475569', cursor: 'pointer', fontWeight: '600', border: '1px solid #e2e8f0' },
  tabActive: { padding: '10px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#1e3a8a', color: '#ffffff', fontWeight: 'bold', cursor: 'pointer' },

  mainContent: { padding: '24px', maxWidth: '1200px', margin: '0 auto' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  btnPrimarySmall: { padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: '#1e3a8a', color: '#ffffff', fontWeight: 'bold', cursor: 'pointer' },

  filterRow: { display: 'flex', gap: '20px', marginBottom: '20px', backgroundColor: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' },
  filterLabel: { fontSize: '13px', color: '#475569', marginRight: '8px', fontWeight: '600' },
  filterSelect: { padding: '6px 10px', borderRadius: '6px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a' },
  formRow: { display: 'flex', gap: '20px', backgroundColor: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' },

  videoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' },
  videoCard: { backgroundColor: '#ffffff', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.03)' },
  videoPlayer: { width: '100%', height: '180px', backgroundColor: '#000000' },
  videoMeta: { padding: '12px' },
  badgeSpecialty: { backgroundColor: '#2563eb', color: '#ffffff', fontSize: '10px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px' },
  videoTitle: { margin: '8px 0 4px 0', fontSize: '16px', color: '#0f172a' },
  videoSub: { margin: 0, fontSize: '12px', color: '#475569' },
  videoDate: { margin: '8px 0 0 0', fontSize: '11px', color: '#94a3b8' },

  membersList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  memberRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' },
  btnPresent: { padding: '6px 12px', borderRadius: '6px', border: 'none', backgroundColor: '#16a34a', color: '#ffffff', fontWeight: 'bold', cursor: 'pointer' },
  btnAbsent: { padding: '6px 12px', borderRadius: '6px', border: 'none', backgroundColor: '#dc2626', color: '#ffffff', fontWeight: 'bold', cursor: 'pointer' },
  roleBadge: { fontSize: '11px', backgroundColor: '#e2e8f0', color: '#334155', padding: '4px 8px', borderRadius: '4px', fontWeight: '600' },
  readOnlyTag: { fontSize: '12px', color: '#94a3b8', italic: 'true' },

  emptyState: { textAlign: 'center', padding: '40px', color: '#94a3b8' },
  noteCard: { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', marginTop: '10px' },

  statsCard: { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', marginTop: '16px' },
  statsLayout: { display: 'flex', gap: '40px', alignItems: 'center', marginTop: '20px', flexWrap: 'wrap' },
  pieChart: { width: '140px', height: '140px', borderRadius: '50%', border: '2px solid #ffffff', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' },
  legendList: { display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: '#334155' },
  legendDot: { display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', marginRight: '8px' },

  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,23,42,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalCard: { backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '450px', border: '1px solid #e2e8f0' },
  modalTitle: { margin: '0 0 16px 0', fontSize: '18px', color: '#1e3a8a' },
  modalActions: { display: 'flex', gap: '10px', marginTop: '16px' }
};
