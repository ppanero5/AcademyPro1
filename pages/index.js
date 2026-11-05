import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Supabase Init
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;

// Account Super Admin Fallback
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
  const [activities, setActivities] = useState([]);
  const [attendanceLogs, setAttendanceLogs] = useState([]);

  // --- REGISTRAZIONE ---
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState('athlete');
  const [regCategory, setRegCategory] = useState('Cuccioli');
  const [regCoachGroup, setRegCoachGroup] = useState('Piccoli');

  // --- NAVIGAZIONE E MODALI ---
  const [activeTab, setActiveTab] = useState('videos');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showRegModal, setShowRegModal] = useState(false);
  const [selectedAthleteForStats, setSelectedAthleteForStats] = useState(null);

  // --- FORM NUOVA ATTIVITÀ ---
  const [actType, setActType] = useState('Allenamento');
  const [actSpecialty, setActSpecialty] = useState('Gigante');
  const [actDate, setActDate] = useState(new Date().toISOString().split('T')[0]);
  const [actNotes, setActNotes] = useState('');
  const [actCategoryTarget, setActCategoryTarget] = useState('Cuccioli');

  // --- SELEZIONE ATTIVITÀ PER APPELLO ---
  const [selectedActivityId, setSelectedActivityId] = useState('');
  const [attendance, setAttendance] = useState({});

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

  // HELPER CATEGORIE (PICCOLI VS GRANDI)
  const isPiccoli = (cat) => ['Superbaby', 'Baby', 'Cuccioli'].includes(cat);

  const canEditCategory = (category) => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin' || currentUser.role === 'superadmin') return true;
    if (currentUser.role === 'athlete') return false;
    if (!currentUser.coach_group || currentUser.coach_group === 'Tutti') return true;
    if (currentUser.coach_group === 'Piccoli' && isPiccoli(category)) return true;
    if (currentUser.coach_group === 'Grandi' && !isPiccoli(category)) return true;
    return false;
  };

  // 1. RIPRISTINO SESSIONE DI LOGIN E CARICAMENTO DATI SUPABASE
  useEffect(() => {
    // Ripristina la sessione dell'utente dal localStorage se presente
    const savedUser = localStorage.getItem('skiclub_user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Errore nel caricamento della sessione salvata:', e);
      }
    }

    if (!supabase) return;

    const fetchData = async () => {
      const { data: membersData } = await supabase.from('club_members').select('*');
      if (membersData) setMembers(membersData);

      const { data: videoData } = await supabase.from('video_library').select('*').order('created_at', { ascending: false });
      if (videoData) setVideos(videoData);

      const { data: actData } = await supabase.from('daily_notes').select('*').order('created_at', { ascending: false });
      if (actData) setActivities(actData || []);

      const { data: attData } = await supabase.from('attendance_history').select('*');
      if (attData) setAttendanceLogs(attData || []);
    };

    fetchData();
  }, []);

  // SELEZIONE AUTOMATICA ATTIVITÀ DI OGGI SE PRESENTE
  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayAct = activities.find(a => a.date === todayStr && isActivityVisibleForUser(a));
    if (todayAct) {
      setSelectedActivityId(String(todayAct.id));
    }
  }, [activities, currentUser]);

  // HELPER VISIBILITÀ ATTIVITÀ PER IL COACH
  const isActivityVisibleForUser = (act) => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin' || currentUser.role === 'superadmin' || currentUser.coach_group === 'Tutti') return true;
    
    const catTarget = act.category || '';
    if (catTarget.includes('Tutti')) return true;

    if (currentUser.coach_group === 'Piccoli') {
      return ['Superbaby', 'Baby', 'Cuccioli', 'Piccoli'].some(c => catTarget.includes(c));
    }
    if (currentUser.coach_group === 'Grandi') {
      return ['Ragazzi', 'Allievi', 'Giovani', 'Senior', 'Master', 'Grandi'].some(c => catTarget.includes(c));
    }
    return true;
  };

  // 2. LOGIN (CON SALVATAGGIO IN LOCALSTORAGE)
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');

    if (loginEmail === 'superadmin@skirank.it' && loginPassword === 'admin') {
      setCurrentUser(SUPER_ADMIN);
      localStorage.setItem('skiclub_user', JSON.stringify(SUPER_ADMIN));
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
      localStorage.setItem('skiclub_user', JSON.stringify(data));
    }
  };

  // LOGOUT (PULIZIA LOCALSTORAGE)
  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('skiclub_user');
  };

  // 3. REGISTRAZIONE UTENTE
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

  // 4. NUOVA ATTIVITÀ CON CATEGORIA
  const handleCreateActivity = async (e) => {
    e.preventDefault();
    if (!supabase) return;

    const formattedCategory = `${actType} | ${actSpecialty} | ${actCategoryTarget}`;

    const newAct = {
      date: actDate,
      category: formattedCategory,
      author_name: currentUser.name,
      content: actNotes || 'Nessuna nota inserita.'
    };

    const { data, error } = await supabase.from('daily_notes').insert([newAct]).select();
    if (error) {
      alert(`Errore creazione attività: ${error.message}`);
      return;
    }

    if (data) {
      setActivities([data[0], ...activities]);
      setShowActivityModal(false);
      setActNotes('');
      setSelectedActivityId(String(data[0].id));
      alert('Attività creata e selezionata per l\'appello!');
    }
  };

  // 5. CANCELLAZIONE ATTIVITÀ
  const handleDeleteActivity = async (actId) => {
    if (!confirm('Sei sicuro di voler eliminare questa attività?')) return;
    if (!supabase) return;

    const { error } = await supabase.from('daily_notes').delete().eq('id', actId);
    if (error) {
      alert(`Errore eliminazione attività: ${error.message}`);
    } else {
      setActivities(activities.filter(a => a.id !== actId));
      if (String(selectedActivityId) === String(actId)) {
        setSelectedActivityId('');
      }
      alert('Attività eliminata con successo.');
    }
  };

  // 6. CANCELLAZIONE VIDEO
  const handleDeleteVideo = async (videoId) => {
    if (!confirm('Sei sicuro di voler eliminare questo video?')) return;
    if (!supabase) return;

    const { error } = await supabase.from('video_library').delete().eq('id', videoId);
    if (error) {
      alert(`Errore eliminazione video: ${error.message}`);
    } else {
      setVideos(videos.filter(v => v.id !== videoId));
      alert('Video eliminato con successo.');
    }
  };

  // 7. CANCELLAZIONE MEMBRO/ISCRITTO (SUPER ADMIN / ADMIN)
  const handleDeleteMember = async (memberId) => {
    if (!confirm('Sei sicuro di voler eliminare questo iscritto?')) return;
    if (!supabase) return;

    const { error } = await supabase.from('club_members').delete().eq('id', memberId);
    if (error) {
      alert(`Errore eliminazione iscritto: ${error.message}`);
    } else {
      setMembers(members.filter(m => m.id !== memberId));
      alert('Iscritto eliminato con successo.');
    }
  };

  // 8. SALVA PRESENZE ATTIVITÀ
  const handleSaveAttendance = async () => {
    if (!supabase || !selectedActivityId) {
      alert('Seleziona prima un\'attività dal banner o dal menu a tendina!');
      return;
    }

    const selectedAct = activities.find(a => String(a.id) === String(selectedActivityId));
    if (!selectedAct) return;

    const parts = selectedAct.category.split('|');
    const specialtyName = parts[1] ? parts[1].trim() : 'Generale';

    try {
      const newEntries = [];
      Object.keys(attendance).forEach(athleteId => {
        if (attendance[athleteId]) {
          newEntries.push({
            date: selectedAct.date,
            athlete_id: athleteId,
            specialty: specialtyName,
            status: 'present'
          });
        }
      });

      if (newEntries.length > 0) {
        const { data: aData } = await supabase.from('attendance_history').insert(newEntries).select();
        if (aData) setAttendanceLogs([...attendanceLogs, ...aData]);
      }

      alert('Presenze salvate con successo per l\'attività!');
      setAttendance({});
    } catch (err) {
      alert(`Errore nel salvataggio presenze: ${err.message}`);
    }
  };

  // 9. UPLOAD VIDEO SU CLOUDFLARE R2
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

  // ESTRAZIONE ATTIVITÀ SELEZIONATA PER FILTRARE LA CATEGORIA DEGLI ATLETI
  const selectedActivityObject = activities.find(a => String(a.id) === String(selectedActivityId));
  const selectedActivityCategoryTarget = selectedActivityObject ? selectedActivityObject.category.split('|')[2]?.trim() || 'Tutti' : 'Tutti';

  // ATLETI FILTRATI ESCLUSIVAMENTE PER LA CATEGORIA DELL'ATTIVITÀ E PER LA BARRA DI RICERCA
  const filteredMembers = members.filter(m => {
    if (m.role !== 'athlete') return false;
    
    if (selectedActivityCategoryTarget !== 'Tutti' && selectedActivityCategoryTarget !== '') {
      if (m.category !== selectedActivityCategoryTarget) return false;
    }

    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // VIDEO VISIBILI
  const visibleVideos = videos.filter(video => {
    if (currentUser?.role === 'athlete' || currentUser?.role === 'atleta') {
      return String(video.athlete_id) === String(currentUser.id);
    }
    if (selectedCategoryFilter !== 'Tutti') {
      const group = (video.athlete_group || '').toLowerCase();
      const filter = selectedCategoryFilter.toLowerCase();
      if (!group.includes(filter)) return false;
    }
    if (selectedAthleteFilter !== 'Tutti' && String(video.athlete_id) !== String(selectedAthleteFilter)) {
      return false;
    }
    return true;
  });

  const groupVisibleActivities = activities.filter(isActivityVisibleForUser);
  const todayStr = new Date().toISOString().split('T')[0];
  const todayActivities = groupVisibleActivities.filter(a => a.date === todayStr);

  // SCHERMATA LOGIN
  if (!currentUser) {
    return (
      <div style={styles.loginContainer}>
        <div style={styles.loginCard}>
          <h1 style={styles.logoTitle}>SKICLUB <span style={{ color: '#1e3a8a' }}>PRO</span></h1>
          <p style={styles.subTitle}>Piattaforma Video & Gestione Sci Club</p>

          <form onSubmit={handleLogin} style={styles.form}>
            <label style={styles.label}>Email</label>
            <input type="email" style={styles.input} value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="utente@skiclub.it" required />

            <label style={styles.label}>Password</label>
            <input type="password" style={styles.input} value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="••••••••" required />

            {authError && <p style={styles.errorText}>{authError}</p>}
            <button type="submit" style={styles.btnPrimary}>Accedi</button>
          </form>

          <button onClick={() => setShowRegModal(true)} style={styles.btnSecondary}>Registra Account</button>
        </div>

        {/* MODALE REGISTRAZIONE */}
        {showRegModal && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalCard}>
              <h3 style={styles.modalTitle}>Nuovo Account</h3>
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
                      <option value="Baby">Baby</option>
                      <option value="Cuccioli">Cuccioli</option>
                      <option value="Ragazzi">Ragazzi</option>
                      <option value="Allievi">Allievi</option>
                      <option value="Giovani">Giovani</option>
                      <option value="Senior">Senior</option>
                      <option value="Master">Master</option>
                    </select>
                  </>
                ) : (
                  <>
                    <label style={styles.label}>Gruppo Allenatore</label>
                    <select style={styles.input} value={regCoachGroup} onChange={(e) => setRegCoachGroup(e.target.value)}>
                      <option value="Piccoli">Piccoli (Superbaby / Baby / Cuccioli)</option>
                      <option value="Grandi">Grandi (Ragazzi / Allievi / Giovani / Senior / Master)</option>
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
        <button onClick={handleLogout} style={styles.btnLogout}>Esci</button>
      </header>

      {/* TABS DESKTOP */}
      <nav style={styles.tabBarDesktop}>
        <button style={activeTab === 'videos' ? styles.tabActive : styles.tab} onClick={() => setActiveTab('videos')}>
          📹 Video Library
        </button>
        {currentUser.role !== 'athlete' && (
          <>
            <button style={activeTab === 'activities' ? styles.tabActive : styles.tab} onClick={() => setActiveTab('activities')}>
              📅 Attività & Note
            </button>
            <button style={activeTab === 'presence' ? styles.tabActive : styles.tab} onClick={() => setActiveTab('presence')}>
              📋 Presenze
            </button>
          </>
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

      {/* TAB 1: VIDEO LIBRARY */}
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
                  <option value="Tutti">Tutte le Categorie</option>
                  <option value="Superbaby">Superbaby</option>
                  <option value="Baby">Baby</option>
                  <option value="Cuccioli">Cuccioli</option>
                  <option value="Ragazzi">Ragazzi</option>
                  <option value="Allievi">Allievi</option>
                  <option value="Giovani">Giovani</option>
                  <option value="Senior">Senior</option>
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={styles.badgeSpecialty}>{video.specialty}</span>
                      {currentUser.role !== 'athlete' && (
                        <button onClick={() => handleDeleteVideo(video.id)} style={styles.btnDeleteInline}>🗑️ Elimina</button>
                      )}
                    </div>
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

      {/* TAB 2: ATTIVITÀ & NOTE */}
      {activeTab === 'activities' && (
        <main style={styles.mainContent}>
          <div style={styles.sectionHeader}>
            <h3>Attività & Programmazione ({currentUser.coach_group || 'Tutti'})</h3>
            <button onClick={() => setShowActivityModal(true)} style={styles.btnPrimarySmall}>+ Nuova Attività</button>
          </div>

          <div style={{ marginTop: '20px' }}>
            {groupVisibleActivities.length === 0 ? (
              <p style={{ color: '#94a3b8' }}>Nessuna attività programmata per il tuo gruppo.</p>
            ) : (
              groupVisibleActivities.map(act => (
                <div key={act.id} style={styles.noteCard}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong>📅 {act.date} — {act.category}</strong>
                    <div>
                      <span style={{ fontSize: '12px', color: '#64748b', marginRight: '10px' }}>Coach: {act.author_name}</span>
                      <button onClick={() => handleDeleteActivity(act.id)} style={styles.btnDeleteInline}>🗑️ Elimina</button>
                    </div>
                  </div>
                  <p style={{ margin: '8px 0', color: '#334155', whiteSpace: 'pre-wrap' }}>{act.content}</p>
                </div>
              ))
            )}
          </div>
        </main>
      )}

      {/* TAB 3: PRESENZE */}
      {activeTab === 'presence' && (
        <main style={styles.mainContent}>
          <h3>Registro Appello Presenze ({currentUser.coach_group || 'Generale'})</h3>

          {/* BANNER ATTIVITÀ DI OGGI */}
          {todayActivities.length > 0 ? (
            <div style={styles.todayBannerContainer}>
              <h4 style={{ margin: '0 0 10px 0', color: '#1e3a8a' }}>⚡ ATTIVITÀ DI OGGI IN PROGRAMMA:</h4>
              <div style={styles.todayGrid}>
                {todayActivities.map(tAct => {
                  const isSelected = String(selectedActivityId) === String(tAct.id);
                  return (
                    <div
                      key={tAct.id}
                      onClick={() => setSelectedActivityId(String(tAct.id))}
                      style={{
                        ...styles.todayCard,
                        borderColor: isSelected ? '#2563eb' : '#cbd5e1',
                        backgroundColor: isSelected ? '#eff6ff' : '#ffffff'
                      }}
                    >
                      <strong>{tAct.category}</strong>
                      <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>Note: {tAct.content}</p>
                      {isSelected && <span style={styles.activeTag}>SELEZIONATA PER APPELLO ✅</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div style={styles.noTodayBanner}>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>ℹ️ Nessuna attività per oggi. Selezionane una dal menu sotto o creane una nuova.</p>
            </div>
          )}

          {/* MENU A TENDINA STORICO ATTIVITÀ */}
          <div style={{ marginBottom: '20px', marginTop: '16px' }}>
            <label style={styles.filterLabel}>Seleziona Attività dal Registro: </label>
            <select
              style={{ ...styles.input, width: '100%', marginTop: '6px' }}
              value={selectedActivityId}
              onChange={(e) => setSelectedActivityId(e.target.value)}
            >
              <option value="">-- Seleziona Attività --</option>
              {groupVisibleActivities.map(act => (
                <option key={act.id} value={act.id}>
                  📅 {act.date} — {act.category}
                </option>
              ))}
            </select>
          </div>

          {/* BADGE DI CONFERMA CATEGORIA FILTRATA */}
          {selectedActivityId && (
            <div style={styles.categoryBadgeInfo}>
              <span>Mostrando gli atleti della categoria: <strong>{selectedActivityCategoryTarget}</strong></span>
            </div>
          )}

          {/* SEARCH BAR ATLETI */}
          <div style={{ marginBottom: '16px' }}>
            <input
              type="text"
              style={styles.searchInput}
              placeholder="🔍 Cerca atleta per nome..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* LISTA ATLETI MOSTRANDO SOLO QUELLI DELLA CATEGORIA SELEZIONATA */}
          <div style={styles.membersList}>
            {filteredMembers.length === 0 ? (
              <div style={styles.emptyState}>
                <p>Nessun atleta trovato per la categoria <strong>{selectedActivityCategoryTarget}</strong>.</p>
              </div>
            ) : (
              filteredMembers.map(athlete => {
                const editable = canEditCategory(athlete.category);
                return (
                  <div key={athlete.id} style={{ ...styles.memberRow, opacity: editable ? 1 : 0.6 }}>
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
              })
            )}
          </div>

          <button onClick={handleSaveAttendance} style={{ ...styles.btnPrimary, marginTop: '20px', width: '100%' }}>
            Conferma Presenze Attività
          </button>
        </main>
      )}

      {/* TAB 4: SCHEDE & GRAFICI A TORTA */}
      {activeTab === 'stats' && (
        <main style={styles.mainContent}>
          <h3>Schede Atleti & Statistiche Stagionali</h3>
          <p style={styles.subTitle}>Seleziona un atleta per visualizzare il resoconto completo delle attività svolte.</p>

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
            const slCount = athleteLogs.filter(l => l.specialty === 'Slalom' || l.specialty === 'Special').length;
            const sgCount = athleteLogs.filter(l => l.specialty === 'SuperG').length;
            const clCount = athleteLogs.filter(l => ['Campo Libero', 'Esercizi', 'Neve Fresca'].includes(l.specialty)).length;

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
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ ...styles.pieChart, background: totalPresences > 0 ? pieConic : '#e2e8f0' }} />
                    <p style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>Ripartizione Disciplina</p>
                  </div>

                  <div style={styles.legendList}>
                    <div><span style={{ ...styles.legendDot, backgroundColor: '#2563eb' }} /> Gigante: {gsCount} ({totalPresences ? Math.round((gsCount/totalPresences)*100) : 0}%)</div>
                    <div><span style={{ ...styles.legendDot, backgroundColor: '#0284c7' }} /> Slalom: {slCount} ({totalPresences ? Math.round((slCount/totalPresences)*100) : 0}%)</div>
                    <div><span style={{ ...styles.legendDot, backgroundColor: '#059669' }} /> SuperG: {sgCount} ({totalPresences ? Math.round((sgCount/totalPresences)*100) : 0}%)</div>
                    <div><span style={{ ...styles.legendDot, backgroundColor: '#d97706' }} /> Campo Libero / Altro: {clCount} ({totalPresences ? Math.round((clCount/totalPresences)*100) : 0}%)</div>
                  </div>
                </div>
              </div>
            );
          })()}
        </main>
      )}

      {/* TAB 5: ISCRITTI */}
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
            {members.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase())).map(m => (
              <div key={m.id} style={styles.memberRow}>
                <div>
                  <strong>{m.name}</strong> — <span style={{ color: '#64748b' }}>{m.email}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={styles.roleBadge}>
                    {m.role.toUpperCase()} ({m.role === 'coach' ? `Gruppo ${m.coach_group || 'Grandi'}` : m.category})
                  </span>
                  {(currentUser.role === 'admin' || currentUser.role === 'superadmin') && (
                    <button onClick={() => handleDeleteMember(m.id)} style={styles.btnDeleteInline}>🗑️ Elimina</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </main>
      )}

      {/* BOTTOM BAR MOBILE */}
      <nav style={styles.bottomBarMobile}>
        <button style={activeTab === 'videos' ? styles.bottomTabActive : styles.bottomTab} onClick={() => setActiveTab('videos')}>
          <span>📹</span>
          <span style={styles.bottomTabLabel}>Video</span>
        </button>

        {currentUser.role !== 'athlete' && (
          <>
            <button style={activeTab === 'activities' ? styles.bottomTabActive : styles.bottomTab} onClick={() => setActiveTab('activities')}>
              <span>📅</span>
              <span style={styles.bottomTabLabel}>Attività</span>
            </button>
            <button style={activeTab === 'presence' ? styles.bottomTabActive : styles.bottomTab} onClick={() => setActiveTab('presence')}>
              <span>📋</span>
              <span style={styles.bottomTabLabel}>Presenze</span>
            </button>
          </>
        )}

        <button style={activeTab === 'stats' ? styles.bottomTabActive : styles.bottomTab} onClick={() => setActiveTab('stats')}>
          <span>📊</span>
          <span style={styles.bottomTabLabel}>Schede</span>
        </button>

        {currentUser.role !== 'athlete' && (
          <button style={activeTab === 'members' ? styles.bottomTabActive : styles.bottomTab} onClick={() => setActiveTab('members')}>
            <span>👥</span>
            <span style={styles.bottomTabLabel}>Iscritti</span>
          </button>
        )}
      </nav>

      {/* MODALE NUOVA ATTIVITÀ */}
      {showActivityModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <h3 style={styles.modalTitle}>Crea Nuova Attività</h3>
            <form onSubmit={handleCreateActivity} style={styles.form}>
              <label style={styles.label}>Tipo Evento</label>
              <select style={styles.input} value={actType} onChange={(e) => setActType(e.target.value)}>
                <option value="Allenamento">Allenamento</option>
                <option value="Gara">Gara</option>
                <option value="Stage">Stage</option>
                <option value="Trasferta">Trasferta</option>
              </select>

              <label style={styles.label}>Specialità / Disciplina</label>
              <select style={styles.input} value={actSpecialty} onChange={(e) => setActSpecialty(e.target.value)}>
                <option value="Gigante">Gigante</option>
                <option value="Slalom">Slalom</option>
                <option value="SuperG">SuperG</option>
                <option value="Campo Libero">Campo Libero</option>
                <option value="Esercizi">Esercizi</option>
                <option value="Neve Fresca">Neve Fresca</option>
              </select>

              <label style={styles.label}>Categoria Destinataria</label>
              <select style={styles.input} value={actCategoryTarget} onChange={(e) => setActCategoryTarget(e.target.value)}>
                <option value="Cuccioli">Cuccioli</option>
                <option value="Superbaby">Superbaby</option>
                <option value="Baby">Baby</option>
                <option value="Ragazzi">Ragazzi</option>
                <option value="Allievi">Allievi</option>
                <option value="Giovani">Giovani</option>
                <option value="Senior">Senior</option>
                <option value="Master">Master</option>
                <option value="Tutti">Tutte le Categorie</option>
              </select>

              <label style={styles.label}>Data</label>
              <input type="date" style={styles.input} value={actDate} onChange={(e) => setActDate(e.target.value)} required />

              <label style={styles.label}>Note (Opzionale)</label>
              <textarea
                style={styles.textArea}
                value={actNotes}
                onChange={(e) => setActNotes(e.target.value)}
                placeholder="Dettagli tracciato, orario ritrovo o programma..."
              />

              <div style={styles.modalActions}>
                <button type="submit" style={styles.btnPrimary}>Crea Attività</button>
                <button type="button" onClick={() => setShowActivityModal(false)} style={styles.btnCancel}>Annulla</button>
              </div>
            </form>
          </div>
        </div>
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
                <option value="Gigante">Gigante</option>
                <option value="Slalom">Slalom</option>
                <option value="SuperG">SuperG</option>
                <option value="Campo Libero">Campo Libero</option>
                <option value="Esercizi">Esercizi</option>
                <option value="Neve Fresca">Neve Fresca</option>
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

// DEFINIZIONE STILI GRAFICI
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
  btnDeleteInline: { backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', padding: '4px 8px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' },
  errorText: { color: '#ef4444', fontSize: '13px', margin: '4px 0' },

  dashboardContainer: { minHeight: '100vh', backgroundColor: '#ffffff', color: '#0f172a', fontFamily: 'sans-serif', paddingBottom: '70px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', backgroundColor: '#0f172a', color: '#ffffff' },
  headerTitle: { margin: 0, fontSize: '20px', color: '#ffffff' },
  headerUser: { margin: 0, fontSize: '12px', color: '#94a3b8' },
  btnLogout: { backgroundColor: '#ef4444', border: 'none', color: '#ffffff', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' },

  tabBarDesktop: { display: 'flex', gap: '10px', padding: '12px 24px', backgroundColor: '#f1f5f9', borderBottom: '1px solid #e2e8f0' },
  tab: { padding: '10px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#ffffff', color: '#475569', cursor: 'pointer', fontWeight: '600', border: '1px solid #e2e8f0' },
  tabActive: { padding: '10px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#1e3a8a', color: '#ffffff', fontWeight: 'bold', cursor: 'pointer' },

  bottomBarMobile: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    display: 'flex',
    justify: 'space-around',
    alignItems: 'center',
    padding: '8px 0',
    borderTop: '1px solid #e2e8f0',
    boxShadow: '0 -2px 10px rgba(0,0,0,0.05)',
    zIndex: 999
  },
  bottomTab: { display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'none', border: 'none', color: '#64748b', fontSize: '18px', cursor: 'pointer' },
  bottomTabActive: { display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'none', border: 'none', color: '#1e3a8a', fontWeight: 'bold', fontSize: '18px', cursor: 'pointer' },
  bottomTabLabel: { fontSize: '10px', marginTop: '2px' },

  mainContent: { padding: '24px', maxWidth: '1200px', margin: '0 auto' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  btnPrimarySmall: { padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: '#1e3a8a', color: '#ffffff', fontWeight: 'bold', cursor: 'pointer' },

  filterRow: { display: 'flex', gap: '20px', marginBottom: '20px', backgroundColor: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' },
  filterLabel: { fontSize: '13px', color: '#475569', marginRight: '8px', fontWeight: '600' },
  filterSelect: { padding: '6px 10px', borderRadius: '6px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a' },
  formRow: { display: 'flex', gap: '20px', backgroundColor: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' },

  todayBannerContainer: { backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', padding: '16px', borderRadius: '12px', marginBottom: '20px' },
  todayGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px', marginTop: '8px' },
  todayCard: { padding: '12px', borderRadius: '8px', border: '2px solid', cursor: 'pointer', transition: 'all 0.2s ease' },
  activeTag: { display: 'inline-block', marginTop: '8px', fontSize: '10px', fontWeight: 'bold', color: '#2563eb' },
  noTodayBanner: { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px' },
  categoryBadgeInfo: { backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', color: '#1e40af' },

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
  readOnlyTag: { fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' },

  emptyState: { textAlign: 'center', padding: '40px', color: '#94a3b8' },
  noteCard: { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', marginTop: '12px' },

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
