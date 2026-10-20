import React, { useState, useEffect, useRef } from 'react';

export default function App() {
  const [mounted, setMounted] = useState(false);

  // --- STATO AUTENTICAZIONE ---
  const [currentUser, setCurrentUser] = useState(null);
  const [authTab, setAuthTab] = useState('login'); // 'login' | 'register'
  const [activeTab, setActiveTab] = useState('dashboard');
  const [filterType, setFilterType] = useState('Tutte');

  // Campi Form Login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  // Campi Form Registrazione
  const [regName, setRegName] = useState('');
  const [regSurname, setRegSurname] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regInviteCode, setRegInviteCode] = useState('');
  const [regGroup, setRegGroup] = useState('Allievi');

  // Codici di invito ufficiali
  const defaultCodes = {
    coach: 'CO26',
    athlete: 'AT26'
  };
  const [inviteCodes, setInviteCodes] = useState(defaultCodes);

  // Categorie
  const categoriesList = ['Superbaby', 'Baby', 'Cuccioli', 'Ragazzi', 'Allievi', 'Giovani', 'Master'];

  // Utenti / Membri di base
  const defaultMembers = [
    {
      id: '1',
      name: 'Super Admin',
      email: 'superadmin@skirank.it',
      password: 'admin',
      role: 'superadmin',
      group: 'Tutti',
      club: 'Bardonecchia Ski Academy'
    }
  ];
  const [members, setMembers] = useState([]);

  // Attività Programmazione
  const defaultActivities = [
    {
      id: 1,
      title: 'Allenamento Gigante - Pista 23',
      type: 'Allenamento',
      date: '2026-10-22',
      time: '08:30 - 12:00',
      targetGroup: 'Allievi',
      confirmedCount: 0,
      totalCount: 0
    }
  ];
  const [activities, setActivities] = useState([]);
  const [showNewActivityModal, setShowNewActivityModal] = useState(false);
  const [newActTitle, setNewActTitle] = useState('');
  const [newActType, setNewActType] = useState('Allenamento');
  const [newActGroup, setNewActGroup] = useState('Allievi');
  const [newActDate, setNewActDate] = useState('');

  // --- LIBRERIA VIDEO & MODALE UPLOAD ---
  const [videos, setVideos] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [tempVideoFile, setTempVideoFile] = useState(null);
  const [videoSpecialty, setVideoSpecialty] = useState('Slalom Gigante');
  const [videoDate, setVideoDate] = useState('');
  const [videoLocation, setVideoLocation] = useState('Bardonecchia');
  const [videoSlope, setVideoSlope] = useState('');
  const [videoTaggedAthleteId, setVideoTaggedAthleteId] = useState('');
  const [selectedVideoPlayer, setSelectedVideoPlayer] = useState(null);
  const [videoFilterAthlete, setVideoFilterAthlete] = useState('Tutti');

  // Player & Telestrator
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawColor, setDrawColor] = useState('#00d2ff');

  // Gestione Credenziali Super Admin
  const [editAdminEmail, setEditAdminEmail] = useState('');
  const [editAdminPassword, setEditAdminPassword] = useState('');

  useEffect(() => {
    setMounted(true);
    try {
      const savedUser = localStorage.getItem('academy_user');
      if (savedUser) setCurrentUser(JSON.parse(savedUser));

      const savedMembers = localStorage.getItem('academy_members');
      if (savedMembers) {
        setMembers(JSON.parse(savedMembers));
      } else {
        setMembers(defaultMembers);
        localStorage.setItem('academy_members', JSON.stringify(defaultMembers));
      }

      const savedCodes = localStorage.getItem('academy_codes');
      if (savedCodes) {
        setInviteCodes(JSON.parse(savedCodes));
      } else {
        localStorage.setItem('academy_codes', JSON.stringify(defaultCodes));
      }

      const savedActs = localStorage.getItem('academy_acts');
      if (savedActs) setActivities(JSON.parse(savedActs));
      else setActivities(defaultActivities);

      const savedVideos = localStorage.getItem('academy_videos');
      if (savedVideos) setVideos(JSON.parse(savedVideos));
    } catch (e) {}
  }, []);

  const persistMembers = (list) => {
    setMembers(list);
    try { localStorage.setItem('academy_members', JSON.stringify(list)); } catch (e) {}
  };

  const persistActivities = (acts) => {
    setActivities(acts);
    try { localStorage.setItem('academy_acts', JSON.stringify(acts)); } catch (e) {}
  };

  const persistVideos = (vids) => {
    setVideos(vids);
    try { localStorage.setItem('academy_videos', JSON.stringify(vids)); } catch (e) {}
  };

  // --- LOGIN ---
  const handleLogin = (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    const cleanEmail = loginEmail.toLowerCase().trim();
    const user = members.find(m => m.email.toLowerCase() === cleanEmail);

    if (!user) {
      setAuthError('Nessun account registrato con questa email. Registrati prima!');
      return;
    }

    if (user.password !== loginPassword) {
      setAuthError('Password errata. Riprova.');
      return;
    }

    setCurrentUser(user);
    try { localStorage.setItem('academy_user', JSON.stringify(user)); } catch (e) {}
    setLoginPassword('');
  };

  // --- REGISTRAZIONE ---
  const handleRegister = (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    if (!regName.trim() || !regSurname.trim() || !regEmail.trim() || !regPassword.trim() || !regInviteCode.trim()) {
      setAuthError('Compila tutti i campi richiesti.');
      return;
    }

    const cleanEmail = regEmail.toLowerCase().trim();
    if (members.some(m => m.email.toLowerCase() === cleanEmail)) {
      setAuthError('Questa email è già registrata. Effettua l\'accesso.');
      return;
    }

    const cleanCode = regInviteCode.trim().toUpperCase();
    let assignedRole = '';

    if (cleanCode === inviteCodes.coach.toUpperCase()) {
      assignedRole = 'coach';
    } else if (cleanCode === inviteCodes.athlete.toUpperCase()) {
      assignedRole = 'athlete';
    } else {
      setAuthError('Codice di invito non valido! Controlla con il tuo club.');
      return;
    }

    const newUser = {
      id: Date.now().toString(),
      name: `${regName.trim()} ${regSurname.trim()}`,
      email: cleanEmail,
      password: regPassword,
      role: assignedRole,
      group: assignedRole === 'coach' ? 'Tutti' : regGroup,
      club: 'Bardonecchia Ski Academy'
    };

    const updated = [...members, newUser];
    persistMembers(updated);

    setRegName('');
    setRegSurname('');
    setRegEmail('');
    setRegPassword('');
    setRegInviteCode('');
    setLoginEmail(cleanEmail);
    setAuthSuccess('Registrazione avvenuta con successo! Inserisci la password per accedere.');
    setAuthTab('login');
  };

  const logout = () => {
    setCurrentUser(null);
    try { localStorage.removeItem('academy_user'); } catch (e) {}
  };

  // --- GESTIONE VIDEO ---
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setTempVideoFile(url);
      setVideoDate(new Date().toISOString().split('T')[0]);
      setShowUploadModal(true);
    }
  };

  const handleSaveVideo = (e) => {
    e.preventDefault();
    if (!tempVideoFile) return;

    const taggedAthlete = members.find(m => m.id === videoTaggedAthleteId);

    const newVideo = {
      id: Date.now(),
      url: tempVideoFile,
      specialty: videoSpecialty,
      date: videoDate,
      location: videoLocation || 'Bardonecchia',
      slope: videoSlope || 'Pista Standard',
      athleteId: videoTaggedAthleteId,
      athleteName: taggedAthlete ? taggedAthlete.name : 'Non Taggato',
      athleteGroup: taggedAthlete ? taggedAthlete.group : 'Generale',
      uploadedBy: currentUser.name
    };

    const updated = [newVideo, ...videos];
    persistVideos(updated);
    setShowUploadModal(false);
    setTempVideoFile(null);
    setVideoSlope('');
    alert('Video caricato e indicizzato con successo!');
  };

  const deleteVideo = (id) => {
    if (confirm('Vuoi cancellare questo video?')) {
      const updated = videos.filter(v => v.id !== id);
      persistVideos(updated);
      if (selectedVideoPlayer?.id === id) setSelectedVideoPlayer(null);
    }
  };

  // Canvas Video Player Drawing
  const getCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX ?? (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const clientY = e.clientY ?? (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDraw = (e) => {
    // Il disegno è consentito SOLO a Coach e Super Admin
    if (isPlaying || currentUser.role === 'athlete') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoords(e);
    ctx.strokeStyle = drawColor;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing || currentUser.role === 'athlete') return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoords(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  // Modifica e Spostamento Categorie
  const handleMoveCategory = (athleteId, newCat) => {
    const updated = members.map(m => (m.id === athleteId ? { ...m, group: newCat } : m));
    persistMembers(updated);
  };

  const deleteMember = (id) => {
    if (confirm('Sei sicuro di voler eliminare definitivamente questo utente?')) {
      const updated = members.filter(m => m.id !== id);
      persistMembers(updated);
    }
  };

  const deleteActivity = (id) => {
    if (confirm('Vuoi eliminare questa attività?')) {
      const updated = activities.filter(a => a.id !== id);
      persistActivities(updated);
    }
  };

  const handleCreateActivity = (e) => {
    e.preventDefault();
    if (!newActTitle) return;
    const targetAthletes = members.filter(m => m.role === 'athlete' && (newActGroup === 'Tutti' || m.group === newActGroup));
    const newAct = {
      id: Date.now(),
      title: newActTitle,
      type: newActType,
      date: newActDate || new Date().toISOString().split('T')[0],
      time: '09:00 - 12:30',
      targetGroup: newActGroup,
      confirmedCount: 0,
      totalCount: targetAthletes.length
    };
    const updated = [newAct, ...activities];
    persistActivities(updated);
    setShowNewActivityModal(false);
    setNewActTitle('');
  };

  const handleUpdateAdminCredentials = (e) => {
    e.preventDefault();
    const updated = members.map(m => {
      if (m.role === 'superadmin') {
        return {
          ...m,
          email: editAdminEmail || m.email,
          password: editAdminPassword || m.password
        };
      }
      return m;
    });
    persistMembers(updated);
    const me = updated.find(m => m.role === 'superadmin');
    setCurrentUser(me);
    try { localStorage.setItem('academy_user', JSON.stringify(me)); } catch (e) {}
    alert('Credenziali Super Admin aggiornate!');
  };

  if (!mounted) return null;

  // ==========================================
  // SCHERMATA LOGIN & REGISTRAZIONE
  // ==========================================
  if (!currentUser) {
    return (
      <div style={loginContainerStyle}>
        <div style={loginHeroStyle}>
          <div style={{ position: 'absolute', bottom: '40px', left: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <div style={logoIconStyle}>M</div>
              <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>AcademyPro</h2>
            </div>
            <h1 style={{ fontSize: '32px', margin: 0, lineHeight: '1.2' }}>
              Il tuo club sciistico,<br />finalmente organizzato.
            </h1>
          </div>
        </div>

        <div style={loginFormStyle}>
          <div style={{ width: '100%', maxWidth: '380px' }}>
            <div style={{ display: 'flex', borderBottom: '2px solid #1a2742', marginBottom: '24px' }}>
              <button
                type="button"
                onClick={() => { setAuthTab('login'); setAuthError(''); setAuthSuccess(''); }}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'none',
                  border: 'none',
                  borderBottom: authTab === 'login' ? '3px solid #00d2ff' : '3px solid transparent',
                  color: authTab === 'login' ? '#00d2ff' : '#6d83a7',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Accedi
              </button>
              <button
                type="button"
                onClick={() => { setAuthTab('register'); setAuthError(''); setAuthSuccess(''); }}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'none',
                  border: 'none',
                  borderBottom: authTab === 'register' ? '3px solid #00d2ff' : '3px solid transparent',
                  color: authTab === 'register' ? '#00d2ff' : '#6d83a7',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Registrati
              </button>
            </div>

            {authError && (
              <div style={{ backgroundColor: '#2d1518', border: '1px solid #742a2a', color: '#ff6b6b', padding: '10px', borderRadius: '6px', fontSize: '13px', marginBottom: '16px' }}>
                {authError}
              </div>
            )}

            {authSuccess && (
              <div style={{ backgroundColor: '#132e27', border: '1px solid #1e5c4a', color: '#06d6a0', padding: '10px', borderRadius: '6px', fontSize: '13px', marginBottom: '16px' }}>
                {authSuccess}
              </div>
            )}

            {authTab === 'login' && (
              <form onSubmit={handleLogin}>
                <div style={{ marginBottom: '14px' }}>
                  <label style={fieldLabelStyle}>Email</label>
                  <input
                    type="email"
                    required
                    placeholder="tua@email.it"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <div style={{ marginBottom: '22px' }}>
                  <label style={fieldLabelStyle}>Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    style={inputStyle}
                  />
                </div>

                <button type="submit" style={primarySubmitBtn}>
                  Accedi al Club
                </button>
              </form>
            )}

            {authTab === 'register' && (
              <form onSubmit={handleRegister}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                  <div>
                    <label style={fieldLabelStyle}>Nome</label>
                    <input required placeholder="Mario" value={regName} onChange={(e) => setRegName(e.target.value)} style={inputStyle} />
                  </div>
                  <div>
                    <label style={fieldLabelStyle}>Cognome</label>
                    <input required placeholder="Rossi" value={regSurname} onChange={(e) => setRegSurname(e.target.value)} style={inputStyle} />
                  </div>
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <label style={fieldLabelStyle}>Email</label>
                  <input type="email" required placeholder="mario.rossi@email.it" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} style={inputStyle} />
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <label style={fieldLabelStyle}>Password</label>
                  <input type="password" required placeholder="Crea password..." value={regPassword} onChange={(e) => setRegPassword(e.target.value)} style={inputStyle} />
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <label style={{ ...fieldLabelStyle, color: '#00d2ff', fontWeight: 'bold' }}>
                    Codice di invito
                  </label>
                  <input
                    required
                    placeholder="Inserisci il codice fornito dal club..."
                    value={regInviteCode}
                    onChange={(e) => setRegInviteCode(e.target.value)}
                    style={{ ...inputStyle, border: '1px solid #00d2ff', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}
                  />
                </div>

                <div style={{ marginBottom: '18px' }}>
                  <label style={fieldLabelStyle}>Categoria di appartenenza (per Atleti)</label>
                  <select value={regGroup} onChange={(e) => setRegGroup(e.target.value)} style={selectDarkStyle}>
                    {categoriesList.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <button type="submit" style={primarySubmitBtn}>
                  Completa Registrazione
                </button>
              </form>
            )}

          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // APPLICAZIONE PRINCIPALE
  // ==========================================
  const isSuperAdmin = currentUser.role === 'superadmin';
  const isCoach = currentUser.role === 'coach';
  const isAthlete = currentUser.role === 'athlete';
  const canManageAthletes = isSuperAdmin || isCoach;

  // Filtro video per la libreria
  const filteredVideos = videos.filter(v => {
    if (isAthlete) return v.athleteId === currentUser.id;
    if (videoFilterAthlete === 'Tutti') return true;
    return v.athleteId === videoFilterAthlete;
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#090e1a', color: '#fff', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
      
      {/* SIDEBAR */}
      <aside style={sidebarStyle}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px' }}>
            <div style={logoIconStyle}>M</div>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '16px' }}>AcademyPro</div>
              <div style={{ fontSize: '11px', color: '#7e92b3' }}>Bardonecchia Ski Academy</div>
            </div>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <button onClick={() => setActiveTab('dashboard')} style={navBtnStyle(activeTab === 'dashboard')}>
              📊 Dashboard
            </button>
            <button onClick={() => setActiveTab('programmazione')} style={navBtnStyle(activeTab === 'programmazione')}>
              📅 Programmazione
            </button>
            <button onClick={() => setActiveTab('video')} style={navBtnStyle(activeTab === 'video')}>
              🎞️ Libreria Video
            </button>
            <button onClick={() => setActiveTab('atleti')} style={navBtnStyle(activeTab === 'atleti')}>
              👥 Atleti
            </button>

            {!isAthlete && (
              <button onClick={() => setActiveTab('club')} style={navBtnStyle(activeTab === 'club')}>
                ⚙️ Gestione Club
              </button>
            )}

            {isSuperAdmin && (
              <button onClick={() => setActiveTab('admin')} style={navBtnStyle(activeTab === 'admin')}>
                🛡️ Super Admin
              </button>
            )}
          </nav>
        </div>

        <div style={{ borderTop: '1px solid #162238', paddingTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <div style={avatarStyle}>{currentUser.name.substring(0, 2).toUpperCase()}</div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '13px', fontWeight: 'bold' }}>{currentUser.name}</div>
              <div style={{ fontSize: '11px', color: '#6882a9', textTransform: 'capitalize' }}>
                {isSuperAdmin ? 'Super Admin' : isCoach ? 'Allenatore' : `Atleta (${currentUser.group})`}
              </div>
            </div>
          </div>
          <button onClick={logout} style={{ background: 'none', border: 'none', color: '#e63946', fontSize: '12px', cursor: 'pointer', padding: 0 }}>
            🚪 Esci
          </button>
        </div>
      </aside>

      {/* CONTENUTO CENTRALE */}
      <main style={{ flex: 1, padding: '24px 32px', overflowY: 'auto' }}>
        
        {/* 1. DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div>
            <div style={{ fontSize: '12px', color: '#5f759c', letterSpacing: '1px', textTransform: 'uppercase' }}>
              {currentUser.role.toUpperCase()} • 2026/2027
            </div>
            <h1 style={{ fontSize: '28px', margin: '4px 0 20px 0' }}>
              Ciao {currentUser.name.split(' ')[0]} 👋
            </h1>
            <p style={{ color: '#889dbf', marginTop: '-12px', marginBottom: '24px', fontSize: '14px' }}>
              Ecco cosa succede in Bardonecchia Ski Academy.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '32px' }}>
              <div style={statCardStyle}>
                <div style={statIconBox('#00b4d8')}>📅</div>
                <div style={{ fontSize: '26px', fontWeight: 'bold', marginTop: '10px' }}>{activities.length}</div>
                <div style={{ fontSize: '11px', color: '#6d83a7', letterSpacing: '0.5px' }}>ATTIVITÀ</div>
              </div>
              <div style={statCardStyle}>
                <div style={statIconBox('#3a86ff')}>🎞️</div>
                <div style={{ fontSize: '26px', fontWeight: 'bold', marginTop: '10px' }}>{filteredVideos.length}</div>
                <div style={{ fontSize: '11px', color: '#6d83a7', letterSpacing: '0.5px' }}>VIDEO</div>
              </div>
              <div style={statCardStyle}>
                <div style={statIconBox('#8338ec')}>👥</div>
                <div style={{ fontSize: '26px', fontWeight: 'bold', marginTop: '10px' }}>{members.filter(m => m.role === 'athlete').length}</div>
                <div style={{ fontSize: '11px', color: '#6d83a7', letterSpacing: '0.5px' }}>ATLETI</div>
              </div>
              <div style={statCardStyle}>
                <div style={statIconBox('#06d6a0')}>✅</div>
                <div style={{ fontSize: '26px', fontWeight: 'bold', marginTop: '10px' }}>
                  {activities.reduce((sum, a) => sum + (a.confirmedCount || 0), 0)}
                </div>
                <div style={{ fontSize: '11px', color: '#6d83a7', letterSpacing: '0.5px' }}>CONFERME</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
              <div style={sectionBoxStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <h3 style={{ margin: 0, fontSize: '16px' }}>Prossime attività</h3>
                  <span onClick={() => setActiveTab('programmazione')} style={{ color: '#00d2ff', fontSize: '13px', cursor: 'pointer' }}>Tutte &gt;</span>
                </div>
                {activities.length === 0 ? (
                  <p style={{ color: '#5f759c', textAlign: 'center', padding: '30px 0' }}>Nessuna attività in programma.</p>
                ) : (
                  activities.slice(0, 3).map(a => (
                    <div key={a.id} style={{ padding: '12px', backgroundColor: '#0f1a30', borderRadius: '8px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{a.title}</div>
                        <div style={{ fontSize: '12px', color: '#7c94ba', marginTop: '4px' }}>{a.date} • Gruppo {a.targetGroup}</div>
                      </div>
                      {isSuperAdmin && (
                        <button onClick={() => deleteActivity(a.id)} style={deleteBtnStyle}>🗑️</button>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div style={sectionBoxStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <h3 style={{ margin: 0, fontSize: '16px' }}>Ultimi video</h3>
                  <span onClick={() => setActiveTab('video')} style={{ color: '#00d2ff', fontSize: '13px', cursor: 'pointer' }}>Libreria &gt;</span>
                </div>
                {filteredVideos.length === 0 ? (
                  <p style={{ color: '#5f759c', textAlign: 'center', padding: '30px 0' }}>Nessun video ancora.</p>
                ) : (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {filteredVideos.slice(0, 2).map(v => (
                      <div key={v.id} onClick={() => setSelectedVideoPlayer(v)} style={{ cursor: 'pointer', flex: 1, backgroundColor: '#0f1a30', padding: '8px', borderRadius: '6px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 'bold' }}>{v.specialty}</div>
                        <div style={{ fontSize: '11px', color: '#6882a9' }}>{v.athleteName}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 2. PROGRAMMAZIONE */}
        {activeTab === 'programmazione' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h1 style={{ fontSize: '24px', margin: '0 0 4px 0' }}>Programmazione</h1>
                <p style={{ margin: 0, color: '#748cae', fontSize: '14px' }}>Allenamenti, gare e trasferte con presenze.</p>
              </div>
              {canManageAthletes && (
                <button onClick={() => setShowNewActivityModal(true)} style={actionBtnCyan}>
                  + Nuova attività
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              {['Tutte', 'Allenamento', 'Gara', 'Trasferta', 'Stage'].map(t => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    border: '1px solid',
                    borderColor: filterType === t ? '#00d2ff' : '#1e2c47',
                    backgroundColor: filterType === t ? '#00d2ff' : 'transparent',
                    color: filterType === t ? '#000' : '#889ebf',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  {t}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {activities
                .filter(a => filterType === 'Tutte' || a.type === filterType)
                .map(a => (
                  <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f172a', padding: '16px', borderRadius: '8px', border: '1px solid #192642' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#132b45', color: '#00d2ff', fontWeight: 'bold' }}>{a.type}</span>
                        <span style={{ fontWeight: 'bold', fontSize: '15px' }}>{a.title}</span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#728aa9', marginTop: '6px' }}>
                        📅 {a.date} • 🕒 {a.time} • Destinato a: <strong>{a.targetGroup}</strong>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '13px', color: '#06d6a0', fontWeight: 'bold' }}>{a.confirmedCount}/{a.totalCount} Conferme</span>
                      {isSuperAdmin && (
                        <button onClick={() => deleteActivity(a.id)} style={deleteBtnStyle}>🗑️ Elimina</button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* 3. LIBRERIA VIDEO A GRIGLIA / MINIATURE PICCOLE */}
        {activeTab === 'video' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h1 style={{ fontSize: '24px', margin: '0 0 4px 0' }}>Libreria Video</h1>
                <p style={{ margin: 0, color: '#748cae', fontSize: '14px' }}>
                  {isAthlete ? 'I tuoi video di allenamento e gara con analisi tecnica.' : 'Archivio video atleti con video analisi telestrator.'}
                </p>
              </div>

              {/* PULSANTE UPLOAD: SOLO PER COACH E SUPER ADMIN */}
              {!isAthlete && (
                <label style={actionBtnCyan}>
                  📹 Carica e Tagga Video
                  <input type="file" accept="video/*" onChange={handleFileSelect} style={{ display: 'none' }} />
                </label>
              )}
            </div>

            {/* Filtro Cartelle per Atleta */}
            {!isAthlete && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <span style={{ fontSize: '13px', color: '#7e92b3' }}>Filtra per Atleta:</span>
                <select
                  value={videoFilterAthlete}
                  onChange={(e) => setVideoFilterAthlete(e.target.value)}
                  style={{ ...selectDarkStyle, maxWidth: '240px' }}
                >
                  <option value="Tutti">📁 Tutti gli Atleti</option>
                  {members.filter(m => m.role === 'athlete').map(a => (
                    <option key={a.id} value={a.id}>{a.name} ({a.group})</option>
                  ))}
                </select>
              </div>
            )}

            {/* GRIGLIA MINIATURE VIDEO (ICONE COMPATTE) */}
            {filteredVideos.length === 0 ? (
              <div style={{ backgroundColor: '#0e172a', border: '1px dashed #1e2c47', borderRadius: '8px', padding: '40px', textAlign: 'center', color: '#6882a9' }}>
                Nessun video trovato in questa cartella.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '14px' }}>
                {filteredVideos.map(v => (
                  <div
                    key={v.id}
                    style={{
                      backgroundColor: '#0e172a',
                      border: '1px solid #1a2742',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                    }}
                  >
                    {/* Anteprima video con play overlay */}
                    <div
                      onClick={() => setSelectedVideoPlayer(v)}
                      style={{ position: 'relative', width: '100%', height: '120px', backgroundColor: '#000', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <video src={v.url} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }} preload="metadata" />
                      <div style={{ position: 'absolute', width: '38px', height: '38px', borderRadius: '50%', backgroundColor: 'rgba(0, 210, 255, 0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontSize: '16px', fontWeight: 'bold' }}>
                        ▶
                      </div>
                      <span style={{ position: 'absolute', bottom: '6px', right: '6px', fontSize: '10px', backgroundColor: '#000', padding: '2px 5px', borderRadius: '3px', color: '#00d2ff' }}>
                        {v.specialty}
                      </span>
                    </div>

                    {/* Dettagli Cartella Video */}
                    <div style={{ padding: '10px' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        👤 {v.athleteName}
                      </div>
                      <div style={{ fontSize: '11px', color: '#748cae', marginTop: '3px' }}>
                        📍 {v.location} • {v.slope}
                      </div>
                      <div style={{ fontSize: '11px', color: '#556c8f', marginTop: '2px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>📅 {v.date}</span>
                        {!isAthlete && (
                          <button onClick={(e) => { e.stopPropagation(); deleteVideo(v.id); }} style={{ background: 'none', border: 'none', color: '#ff4d4f', cursor: 'pointer', padding: 0, fontSize: '11px' }}>
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 4. ATLETI */}
        {activeTab === 'atleti' && (
          <div>
            <h1 style={{ fontSize: '24px', margin: '0 0 4px 0' }}>Atleti</h1>
            <p style={{ margin: '0 0 20px 0', color: '#748cae', fontSize: '14px' }}>
              Atleti registrati divisi per categoria. {canManageAthletes && 'Puoi spostarli da una categoria all\'altra tramite il menu.'}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {categoriesList.map(catName => {
                const groupAthletes = members.filter(m => m.role === 'athlete' && m.group === catName);
                return (
                  <div key={catName} style={{ backgroundColor: '#0e172a', border: '1px solid #1b2844', borderRadius: '8px', padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{catName} ({groupAthletes.length})</div>
                    </div>

                    {groupAthletes.length === 0 ? (
                      <p style={{ color: '#5f759c', fontSize: '13px', margin: 0 }}>Nessun atleta in questo gruppo.</p>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '8px' }}>
                        {groupAthletes.map(a => (
                          <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#131e36', padding: '8px 12px', borderRadius: '6px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ ...avatarStyle, width: '26px', height: '26px', fontSize: '11px' }}>{a.name.substring(0, 2).toUpperCase()}</div>
                              <span style={{ fontSize: '13px', fontWeight: 500 }}>{a.name}</span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {canManageAthletes && (
                                <select
                                  value={a.group}
                                  onChange={(e) => handleMoveCategory(a.id, e.target.value)}
                                  style={{ backgroundColor: '#090e1a', color: '#00d2ff', border: '1px solid #1f3357', borderRadius: '4px', padding: '3px 6px', fontSize: '11px', cursor: 'pointer' }}
                                >
                                  {categoriesList.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                              )}

                              {isSuperAdmin && (
                                <button onClick={() => deleteMember(a.id)} style={{ background: 'none', border: 'none', color: '#e63946', cursor: 'pointer', fontSize: '12px' }}>
                                  🗑️
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 5. GESTIONE CLUB */}
        {activeTab === 'club' && canManageAthletes && (
          <div>
            <h1 style={{ fontSize: '24px', margin: '0 0 4px 0' }}>Bardonecchia Ski Academy</h1>
            <p style={{ margin: '0 0 20px 0', color: '#748cae', fontSize: '14px' }}>Stagione 2026/2027 • {members.length} membri registrati</p>

            <div style={{ backgroundColor: '#0e172a', border: '1px solid #1b2844', borderRadius: '8px', padding: '16px', marginBottom: '24px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '6px' }}>Codici Invito Attuali</div>
              <p style={{ color: '#6d83a7', fontSize: '13px', marginTop: 0, marginBottom: '12px' }}>
                Condividi questi codici per far registrare i membri:
              </p>
              <div style={{ display: 'flex', gap: '24px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: '#748cae', display: 'block' }}>CODICE ALLENATORI</span>
                  <code style={codeBoxStyle}>{inviteCodes.coach}</code>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#748cae', display: 'block' }}>CODICE ATLETI</span>
                  <code style={codeBoxStyle}>{inviteCodes.athlete}</code>
                </div>
              </div>
            </div>

            <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>Tutti i Membri Registrati</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {members.map(m => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0e172a', padding: '12px 16px', borderRadius: '6px', border: '1px solid #1b2844' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={avatarStyle}>{m.name.substring(0, 2).toUpperCase()}</div>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{m.name}</div>
                      <div style={{ fontSize: '12px', color: '#6882a9' }}>{m.email}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {m.role === 'athlete' && canManageAthletes ? (
                      <select
                        value={m.group}
                        onChange={(e) => handleMoveCategory(m.id, e.target.value)}
                        style={{ backgroundColor: '#090e1a', color: '#00d2ff', border: '1px solid #1f3357', borderRadius: '4px', padding: '4px 8px', fontSize: '12px', cursor: 'pointer' }}
                      >
                        {categoriesList.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    ) : (
                      <span style={{ fontSize: '12px', backgroundColor: '#13233d', padding: '3px 8px', borderRadius: '4px', color: '#00d2ff', textTransform: 'capitalize' }}>
                        {m.role === 'superadmin' ? 'Super Admin' : 'Allenatore'}
                      </span>
                    )}

                    {isSuperAdmin && m.id !== currentUser.id && (
                      <button onClick={() => deleteMember(m.id)} style={deleteBtnStyle}>
                        🗑️ Elimina
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. SUPER ADMIN: RECUPERO PASSWORD E CREDENZIALI */}
        {activeTab === 'admin' && isSuperAdmin && (
          <div>
            <h1 style={{ fontSize: '24px', margin: '0 0 4px 0' }}>Pannello Super Admin</h1>
            <p style={{ margin: '0 0 20px 0', color: '#748cae', fontSize: '14px' }}>Recupero credenziali utenti e gestione del club.</p>

            {/* TABELLA RECUPERO PASSWORD UTENTI */}
            <div style={{ backgroundColor: '#0e172a', border: '1px solid #1b2844', borderRadius: '8px', padding: '18px', marginBottom: '24px' }}>
              <h3 style={{ marginTop: 0, fontSize: '16px', color: '#00d2ff' }}>🔑 Registro Utenti & Recupero Password</h3>
              <p style={{ fontSize: '13px', color: '#748cae', marginBottom: '14px' }}>
                Se un atleta o allenatore dimentica la password, puoi leggerla qui sotto e comunicargliela:
              </p>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #1a2742', color: '#6882a9' }}>
                      <th style={{ padding: '8px' }}>Nome</th>
                      <th style={{ padding: '8px' }}>Email (Login)</th>
                      <th style={{ padding: '8px' }}>Password</th>
                      <th style={{ padding: '8px' }}>Ruolo</th>
                      <th style={{ padding: '8px' }}>Gruppo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map(m => (
                      <tr key={m.id} style={{ borderBottom: '1px solid #131e36' }}>
                        <td style={{ padding: '8px', fontWeight: 'bold' }}>{m.name}</td>
                        <td style={{ padding: '8px', color: '#00d2ff' }}>{m.email}</td>
                        <td style={{ padding: '8px', fontFamily: 'monospace', fontWeight: 'bold', color: '#06d6a0' }}>{m.password}</td>
                        <td style={{ padding: '8px', textTransform: 'capitalize' }}>{m.role}</td>
                        <td style={{ padding: '8px' }}>{m.group}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modifica Credenziali Super Admin */}
            <div style={{ backgroundColor: '#0e172a', border: '1px solid #1b2844', borderRadius: '8px', padding: '18px', maxWidth: '420px' }}>
              <h3 style={{ marginTop: 0, fontSize: '16px' }}>🛡️ Modifica Tue Credenziali</h3>
              <form onSubmit={handleUpdateAdminCredentials}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={fieldLabelStyle}>Nuova Email:</label>
                  <input type="email" placeholder={currentUser.email} value={editAdminEmail} onChange={(e) => setEditAdminEmail(e.target.value)} style={inputStyle} />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={fieldLabelStyle}>Nuova Password:</label>
                  <input type="password" placeholder="Nuova password..." value={editAdminPassword} onChange={(e) => setEditAdminPassword(e.target.value)} style={inputStyle} />
                </div>
                <button type="submit" style={actionBtnCyan}>Aggiorna Credenziali</button>
              </form>
            </div>
          </div>
        )}

      </main>

      {/* MODALE DI TAGGING / CARTELLA VIDEO ALL'UPLOAD */}
      {showUploadModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: '#0e172a', border: '1px solid #1b2844', padding: '24px', borderRadius: '8px', width: '380px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#00d2ff' }}>📁 Scheda Indicizzazione Video</h3>
            <form onSubmit={handleSaveVideo}>
              <div style={{ marginBottom: '12px' }}>
                <label style={fieldLabelStyle}>Specialità:</label>
                <select value={videoSpecialty} onChange={(e) => setVideoSpecialty(e.target.value)} style={selectDarkStyle}>
                  <option value="Slalom Gigante">Slalom Gigante (GS)</option>
                  <option value="Slalom Speciale">Slalom Speciale (SL)</option>
                  <option value="Super-G">Super-G (SG)</option>
                  <option value="Discesa Libera">Discesa Libera (DH)</option>
                  <option value="Campo Libero">Campo Libero</option>
                </select>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={fieldLabelStyle}>Tagga Atleta:</label>
                <select required value={videoTaggedAthleteId} onChange={(e) => setVideoTaggedAthleteId(e.target.value)} style={selectDarkStyle}>
                  <option value="">-- Seleziona Atleta --</option>
                  {members.filter(m => m.role === 'athlete').map(a => (
                    <option key={a.id} value={a.id}>{a.name} ({a.group})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                <div>
                  <label style={fieldLabelStyle}>Luogo:</label>
                  <input value={videoLocation} onChange={(e) => setVideoLocation(e.target.value)} placeholder="Bardonecchia" style={inputStyle} />
                </div>
                <div>
                  <label style={fieldLabelStyle}>Pista:</label>
                  <input value={videoSlope} onChange={(e) => setVideoSlope(e.target.value)} placeholder="es. 23 Olimpica" style={inputStyle} />
                </div>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={fieldLabelStyle}>Data discesa:</label>
                <input type="date" value={videoDate} onChange={(e) => setVideoDate(e.target.value)} style={inputStyle} required />
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="submit" style={{ ...actionBtnCyan, flex: 1 }}>Salva in Cartella</button>
                <button type="button" onClick={() => { setShowUploadModal(false); setTempVideoFile(null); }} style={{ ...controlBtn, flex: 1 }}>Annulla</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP PLAYER VIDEO TELESTRATOR / FRAME-BY-FRAME */}
      {selectedVideoPlayer && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: '#090e1a', border: '1px solid #1a2742', borderRadius: '8px', padding: '16px', maxWidth: '780px', width: '92%' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div>
                <span style={{ fontWeight: 'bold', fontSize: '15px' }}>{selectedVideoPlayer.specialty} • {selectedVideoPlayer.athleteName}</span>
                <span style={{ fontSize: '12px', color: '#748cae', marginLeft: '10px' }}>({selectedVideoPlayer.location} - {selectedVideoPlayer.slope})</span>
              </div>
              <button onClick={() => setSelectedVideoPlayer(null)} style={{ background: 'none', border: 'none', color: '#ff4d4f', fontSize: '18px', cursor: 'pointer' }}>✖</button>
            </div>

            {/* Contenitore Video + Canvas di Disegno Proporzionato */}
            <div style={{ position: 'relative', width: '100%', maxHeight: '480px', backgroundColor: '#000', borderRadius: '6px', overflow: 'hidden' }}>
              <video
                ref={videoRef}
                src={selectedVideoPlayer.url}
                playsInline
                style={{ width: '100%', maxHeight: '480px', display: 'block', margin: '0 auto' }}
                onLoadedMetadata={() => {
                  if (videoRef.current && canvasRef.current) {
                    canvasRef.current.width = videoRef.current.clientWidth;
                    canvasRef.current.height = videoRef.current.clientHeight;
                  }
                }}
              />
              <canvas
                ref={canvasRef}
                onPointerDown={startDraw}
                onPointerMove={draw}
                onPointerUp={() => setIsDrawing(false)}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  touchAction: 'none',
                  cursor: (!isPlaying && !isAthlete) ? 'crosshair' : 'default',
                  pointerEvents: (!isPlaying && !isAthlete) ? 'auto' : 'none'
                }}
              />
            </div>

            {/* Controlli Player */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px', alignItems: 'center' }}>
              <button onClick={() => { if (videoRef.current) { isPlaying ? videoRef.current.pause() : videoRef.current.play(); setIsPlaying(!isPlaying); }}} style={controlBtn}>
                {isPlaying ? '⏸ Pausa' : '▶ Play'}
              </button>
              <button onClick={() => { if (videoRef.current) { videoRef.current.pause(); setIsPlaying(false); videoRef.current.currentTime -= 0.04; }}} style={controlBtn}>⏮ -1 Frame</button>
              <button onClick={() => { if (videoRef.current) { videoRef.current.pause(); setIsPlaying(false); videoRef.current.currentTime += 0.04; }}} style={controlBtn}>⏭ +1 Frame</button>
              
              <div style={{ display: 'flex', gap: '4px', marginLeft: 'auto' }}>
                {[0.2, 0.5, 1.0].map(rate => (
                  <button key={rate} onClick={() => { if (videoRef.current) videoRef.current.playbackRate = rate; }} style={controlBtn}>
                    {rate}×
                  </button>
                ))}
              </div>

              {!isAthlete && (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '100%', marginTop: '6px', borderTop: '1px solid #162238', paddingTop: '8px' }}>
                  <label style={{ fontSize: '11px', color: '#748cae' }}>Colore matita:</label>
                  <input type="color" value={drawColor} onChange={(e) => setDrawColor(e.target.value)} style={{ background: 'none', border: 'none', width: '28px', height: '24px', cursor: 'pointer' }} />
                  <button onClick={() => { if (canvasRef.current) canvasRef.current.getContext('2d').clearRect(0, 0, canvasRef.current.width, canvasRef.current.height); }} style={{ ...controlBtn, backgroundColor: '#2d1518', color: '#ff4d4f', border: '1px solid #5a1c24' }}>
                    Cancella Tratti
                  </button>
                  <span style={{ fontSize: '11px', color: '#6882a9', marginLeft: 'auto' }}>
                    Metti in pausa per analizzare la discesa
                  </span>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* MODAL NUOVA ATTIVITÀ */}
      {showNewActivityModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: '#0e172a', border: '1px solid #1b2844', padding: '24px', borderRadius: '8px', width: '380px' }}>
            <h3 style={{ margin: '0 0 16px 0' }}>Crea Nuova Attività</h3>
            <form onSubmit={handleCreateActivity}>
              <div style={{ marginBottom: '12px' }}>
                <label style={fieldLabelStyle}>Titolo attività:</label>
                <input value={newActTitle} onChange={(e) => setNewActTitle(e.target.value)} placeholder="es. Slalom Gigante" style={inputStyle} required />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={fieldLabelStyle}>Tipo:</label>
                <select value={newActType} onChange={(e) => setNewActType(e.target.value)} style={selectDarkStyle}>
                  <option value="Allenamento">Allenamento</option>
                  <option value="Gara">Gara</option>
                  <option value="Trasferta">Trasferta</option>
                  <option value="Stage">Stage</option>
                </select>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={fieldLabelStyle}>Gruppo di destinazione:</label>
                <select value={newActGroup} onChange={(e) => setNewActGroup(e.target.value)} style={selectDarkStyle}>
                  <option value="Tutti">Tutti i gruppi</option>
                  {categoriesList.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={fieldLabelStyle}>Data:</label>
                <input type="date" value={newActDate} onChange={(e) => setNewActDate(e.target.value)} style={inputStyle} />
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="submit" style={{ ...actionBtnCyan, flex: 1 }}>Crea</button>
                <button type="button" onClick={() => setShowNewActivityModal(false)} style={{ ...controlBtn, flex: 1 }}>Annulla</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// --- STILI GRAFICI ---
const loginContainerStyle = { display: 'flex', minHeight: '100vh', backgroundColor: '#070b14', color: '#fff', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' };
const loginHeroStyle = { flex: 1.2, position: 'relative', backgroundImage: 'url("https://images.unsplash.com/photo-1551698618-1dfe5d97d256?q=80&w=1400&auto=format&fit=crop")', backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' };
const loginFormStyle = { flex: 1, backgroundColor: '#090e1a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' };
const sidebarStyle = { width: '240px', backgroundColor: '#0b1120', borderRight: '1px solid #141e33', padding: '24px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' };
const logoIconStyle = { width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#00d2ff', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '18px' };
const navBtnStyle = (active) => ({ width: '100%', textAlign: 'left', padding: '10px 14px', borderRadius: '6px', border: 'none', backgroundColor: active ? '#101d36' : 'transparent', color: active ? '#00d2ff' : '#889ebf', fontWeight: active ? 'bold' : 'normal', fontSize: '14px', cursor: 'pointer' });
const avatarStyle = { width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#1d2d4c', color: '#00d2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' };
const fieldLabelStyle = { display: 'block', fontSize: '12px', color: '#8b9bb4', marginBottom: '5px' };
const inputStyle = { width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: '6px', border: '1px solid #1d2c4a', backgroundColor: '#0d1527', color: '#fff', fontSize: '14px' };
const selectDarkStyle = { width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #1d2c4a', backgroundColor: '#0d1527', color: '#fff', fontSize: '14px' };
const primarySubmitBtn = { width: '100%', padding: '12px', borderRadius: '6px', border: 'none', backgroundColor: '#00d2ff', color: '#000', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer' };
const actionBtnCyan = { padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: '#00d2ff', color: '#000', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' };
const controlBtn = { padding: '6px 12px', borderRadius: '4px', border: '1px solid #233454', backgroundColor: '#131e36', color: '#fff', fontSize: '12px', cursor: 'pointer' };
const deleteBtnStyle = { padding: '4px 8px', borderRadius: '4px', border: '1px solid #4a1d24', backgroundColor: '#261217', color: '#ff4d4f', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' };
const statCardStyle = { backgroundColor: '#0e172a', border: '1px solid #1a2742', borderRadius: '8px', padding: '18px' };
const statIconBox = (bg) => ({ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: bg + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' });
const sectionBoxStyle = { backgroundColor: '#0e172a', border: '1px solid #1a2742', borderRadius: '8px', padding: '18px' };
const codeBoxStyle = { display: 'inline-block', marginTop: '4px', padding: '6px 10px', backgroundColor: '#132038', color: '#00d2ff', borderRadius: '4px', fontSize: '14px', fontWeight: 'bold' };
