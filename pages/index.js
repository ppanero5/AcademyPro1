import React, { useState, useEffect, useRef } from 'react';

export default function App() {
  const [mounted, setMounted] = useState(false);

  // --- STATO AUTENTICAZIONE ---
  const [currentUser, setCurrentUser] = useState(null);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [activeTab, setActiveTab] = useState('dashboard');
  const [filterType, setFilterType] = useState('Tutte');

  // Campi Form Login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Campi Form Registrazione
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regInviteCode, setRegInviteCode] = useState('');
  const [regGroup, setRegGroup] = useState('Allievi');

  // --- CODICI INVITO PREDEFINITI RICHIESTI ---
  const defaultCodes = {
    coach: 'CO26',
    athlete: 'BRAT26'
  };
  const [inviteCodes, setInviteCodes] = useState(defaultCodes);

  // --- GRUPPI CATEGORIE ---
  const categoriesList = ['Superbaby', 'Baby', 'Cuccioli', 'Ragazzi', 'Allievi', 'Giovani', 'Master'];

  const [groups, setGroups] = useState([
    { id: 'superbaby', name: 'Superbaby', coaches: [] },
    { id: 'baby', name: 'Baby', coaches: [] },
    { id: 'cuccioli', name: 'Cuccioli', coaches: [] },
    { id: 'ragazzi', name: 'Ragazzi', coaches: [] },
    { id: 'allievi', name: 'Allievi', coaches: ['Pietro Panero'] },
    { id: 'giovani', name: 'Giovani', coaches: [] },
    { id: 'master', name: 'Master', coaches: [] },
  ]);

  // Membri di default
  const defaultMembers = [
    { id: '1', name: 'Super Admin', email: 'superadmin@skirank.it', password: 'admin', role: 'superadmin', group: 'Tutti', club: 'Bardonecchia Ski Academy' },
    { id: '2', name: 'Pietro Panero', email: 'pietro@panero.biz', password: 'coach', role: 'coach', group: 'Allievi', club: 'Bardonecchia Ski Academy' }
  ];

  const [members, setMembers] = useState([]);

  // Attività
  const defaultActivities = [
    {
      id: 1,
      title: 'Allenamento Gigante - Pista 23',
      type: 'Allenamento',
      date: '2026-10-22',
      time: '08:30 - 12:00',
      targetGroup: 'Allievi',
      confirmedCount: 1,
      totalCount: 1
    }
  ];
  const [activities, setActivities] = useState([]);
  const [showNewActivityModal, setShowNewActivityModal] = useState(false);
  const [newActTitle, setNewActTitle] = useState('');
  const [newActType, setNewActType] = useState('Allenamento');
  const [newActGroup, setNewActGroup] = useState('Allievi');
  const [newActDate, setNewActDate] = useState('');

  // Modifica Admin
  const [editAdminEmail, setEditAdminEmail] = useState('');
  const [editAdminPassword, setEditAdminPassword] = useState('');
  const [newCoachCode, setNewCoachCode] = useState('');
  const [newAthleteCode, setNewAthleteCode] = useState('');

  // Video Analyzer
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [currentVideoSrc, setCurrentVideoSrc] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);

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

  const persistCodes = (codes) => {
    setInviteCodes(codes);
    try { localStorage.setItem('academy_codes', JSON.stringify(codes)); } catch (e) {}
  };

  // --- LOGIN ---
  const handleLogin = (e) => {
    e.preventDefault();
    setAuthError('');

    const user = members.find(m => m.email.toLowerCase() === loginEmail.toLowerCase().trim());
    if (!user) {
      setAuthError('Nessun account trovato con questa email.');
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

  // --- REGISTRAZIONE CON CODICI BRAT26 E CO26 ---
  const handleRegister = (e) => {
    e.preventDefault();
    setAuthError('');

    if (!regName.trim() || !regEmail.trim() || !regPassword.trim() || !regInviteCode.trim()) {
      setAuthError('Compila tutti i campi.');
      return;
    }

    if (members.some(m => m.email.toLowerCase() === regEmail.toLowerCase().trim())) {
      setAuthError('Esiste già un account con questa email.');
      return;
    }

    let assignedRole = '';
    const cleanCode = regInviteCode.trim().toUpperCase();

    if (cleanCode === inviteCodes.coach.toUpperCase()) {
      assignedRole = 'coach';
    } else if (cleanCode === inviteCodes.athlete.toUpperCase()) {
      assignedRole = 'athlete';
    } else {
      setAuthError('Codice invito non valido! Usa BRAT26 per atleta o CO26 per allenatore.');
      return;
    }

    const newUser = {
      id: Date.now().toString(),
      name: regName.trim(),
      email: regEmail.trim(),
      password: regPassword,
      role: assignedRole,
      group: assignedRole === 'coach' ? 'Tutti' : regGroup,
      club: 'Bardonecchia Ski Academy'
    };

    const updated = [...members, newUser];
    persistMembers(updated);
    setCurrentUser(newUser);
    try { localStorage.setItem('academy_user', JSON.stringify(newUser)); } catch (e) {}
    alert(`Registrazione completata! Benvenuto nel club.`);
  };

  const logout = () => {
    setCurrentUser(null);
    try { localStorage.removeItem('academy_user'); } catch (e) {}
  };

  // --- SPOSTAMENTO ATLETA TRA LE CATEGORIE (ALLENATORI E SUPER ADMIN) ---
  const handleMoveCategory = (athleteId, newCategory) => {
    const updated = members.map(m => {
      if (m.id === athleteId) {
        return { ...m, group: newCategory };
      }
      return m;
    });
    persistMembers(updated);
  };

  // --- ELIMINAZIONE ACCOUNT (SOLO SUPER ADMIN) ---
  const deleteMember = (id) => {
    if (confirm('Sei sicuro di voler eliminare definitivamente questo account?')) {
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

  const handleUpdateCodes = (e) => {
    e.preventDefault();
    const newCodes = {
      coach: newCoachCode.trim().toUpperCase() || inviteCodes.coach,
      athlete: newAthleteCode.trim().toUpperCase() || inviteCodes.athlete
    };
    persistCodes(newCodes);
    alert('Codici invito aggiornati!');
  };

  // Canvas Video Player
  const getCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX ?? (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const clientY = e.clientY ?? (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDraw = (e) => {
    if (isPlaying) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoords(e);
    ctx.strokeStyle = '#00d2ff';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoords(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  if (!mounted) return null;

  // --- SCHERMATA LOGIN & REGISTRAZIONE ---
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
            {authError && (
              <div style={{ backgroundColor: '#2d1518', border: '1px solid #742a2a', color: '#ff6b6b', padding: '10px', borderRadius: '6px', fontSize: '13px', marginBottom: '16px' }}>
                {authError}
              </div>
            )}

            {authMode === 'login' ? (
              <div>
                <h2 style={{ fontSize: '26px', margin: '0 0 6px 0', fontWeight: 'bold' }}>Accedi</h2>
                <p style={{ color: '#8b9bb4', fontSize: '14px', margin: '0 0 20px 0' }}>Inserisci le tue credenziali per entrare nel club.</p>

                <form onSubmit={handleLogin}>
                  <div style={{ marginBottom: '14px' }}>
                    <label style={fieldLabelStyle}>Email</label>
                    <input
                      type="email"
                      required
                      placeholder="nome@skiclub.it"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ marginBottom: '20px' }}>
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

                  <button type="submit" style={primarySubmitBtn}>Accedi</button>
                </form>

                <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '13px', color: '#889ebf' }}>
                  Non hai un account?{' '}
                  <span onClick={() => { setAuthMode('register'); setAuthError(''); }} style={{ color: '#00d2ff', cursor: 'pointer', fontWeight: 'bold' }}>
                    Registrati con codice invito
                  </span>
                </div>
              </div>
            ) : (
              <div>
                <h2 style={{ fontSize: '26px', margin: '0 0 6px 0', fontWeight: 'bold' }}>Registrati</h2>
                <p style={{ color: '#8b9bb4', fontSize: '14px', margin: '0 0 16px 0' }}>Unisciti a Bardonecchia Ski Academy.</p>

                <form onSubmit={handleRegister}>
                  <div style={{ marginBottom: '10px' }}>
                    <label style={fieldLabelStyle}>Nome e Cognome</label>
                    <input required placeholder="es. Mario Rossi" value={regName} onChange={(e) => setRegName(e.target.value)} style={inputStyle} />
                  </div>

                  <div style={{ marginBottom: '10px' }}>
                    <label style={fieldLabelStyle}>Email</label>
                    <input type="email" required placeholder="mario@email.it" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} style={inputStyle} />
                  </div>

                  <div style={{ marginBottom: '10px' }}>
                    <label style={fieldLabelStyle}>Password</label>
                    <input type="password" required placeholder="Crea una password..." value={regPassword} onChange={(e) => setRegPassword(e.target.value)} style={inputStyle} />
                  </div>

                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ ...fieldLabelStyle, color: '#00d2ff', fontWeight: 'bold' }}>
                      🔑 Codice Invito Club (es. BRAT26 o CO26)
                    </label>
                    <input
                      required
                      placeholder="BRAT26 / CO26"
                      value={regInviteCode}
                      onChange={(e) => setRegInviteCode(e.target.value)}
                      style={{ ...inputStyle, border: '1px solid #00d2ff', letterSpacing: '1px', textTransform: 'uppercase' }}
                    />
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={fieldLabelStyle}>Categoria / Gruppo di appartenenza</label>
                    <select value={regGroup} onChange={(e) => setRegGroup(e.target.value)} style={selectDarkStyle}>
                      {categoriesList.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <small style={{ fontSize: '11px', color: '#6d83a7', marginTop: '3px', display: 'block' }}>
                      (Se sei un allenatore con codice CO26 gestirai tutti i gruppi)
                    </small>
                  </div>

                  <button type="submit" style={primarySubmitBtn}>Crea Account</button>
                </form>

                <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '13px', color: '#889ebf' }}>
                  Hai già un account?{' '}
                  <span onClick={() => { setAuthMode('login'); setAuthError(''); }} style={{ color: '#00d2ff', cursor: 'pointer', fontWeight: 'bold' }}>
                    Accedi qui
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- APP PRINCIPALE ---
  const isSuperAdmin = currentUser.role === 'superadmin';
  const isCoach = currentUser.role === 'coach';
  const canManageAthletes = isSuperAdmin || isCoach;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#090e1a', color: '#fff', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
      
      {/* SIDEBAR LATERALE */}
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

            {/* GESTIONE CLUB: VISIBILE SOLO AD ALLENATORI E SUPER ADMIN (NON AGLI ATLETI) */}
            {(isCoach || isSuperAdmin) && (
              <button onClick={() => setActiveTab('club')} style={navBtnStyle(activeTab === 'club')}>
                ⚙️ Gestione Club
              </button>
            )}

            {/* SUPER ADMIN: VISIBILE SOLO AL SUPER ADMIN */}
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

      {/* CONTENUTO PRINCIPALE */}
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
                <div style={{ fontSize: '26px', fontWeight: 'bold', marginTop: '10px' }}>0</div>
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
                <p style={{ color: '#5f759c', textAlign: 'center', padding: '30px 0' }}>Nessun video ancora.</p>
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

        {/* 3. LIBRERIA VIDEO */}
        {activeTab === 'video' && (
          <div>
            <h1 style={{ fontSize: '24px', margin: '0 0 4px 0' }}>Libreria Video</h1>
            <p style={{ margin: '0 0 20px 0', color: '#748cae', fontSize: '14px' }}>Video con slow-motion e telestratore per analisi tecnica.</p>

            <div style={{ marginBottom: '20px' }}>
              <label style={actionBtnCyan}>
                📁 Carica Video Discesa
                <input type="file" accept="video/*" onChange={(e) => {
                  if (e.target.files[0]) setCurrentVideoSrc(URL.createObjectURL(e.target.files[0]));
                }} style={{ display: 'none' }} />
              </label>
            </div>

            {currentVideoSrc && (
              <div style={{ backgroundColor: '#000', borderRadius: '8px', overflow: 'hidden', position: 'relative', maxWidth: '750px' }}>
                <video
                  ref={videoRef}
                  src={currentVideoSrc}
                  playsInline
                  onLoadedMetadata={() => {
                    if (videoRef.current && canvasRef.current) {
                      canvasRef.current.width = videoRef.current.clientWidth;
                      canvasRef.current.height = videoRef.current.clientHeight;
                    }
                  }}
                  style={{ width: '100%', display: 'block' }}
                />
                <canvas
                  ref={canvasRef}
                  onPointerDown={startDraw}
                  onPointerMove={draw}
                  onPointerUp={() => setIsDrawing(false)}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', touchAction: 'none', cursor: 'crosshair', pointerEvents: !isPlaying ? 'auto' : 'none' }}
                />
                <div style={{ padding: '10px', backgroundColor: '#0f172a', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button onClick={() => { if (videoRef.current) { isPlaying ? videoRef.current.pause() : videoRef.current.play(); setIsPlaying(!isPlaying); }}} style={controlBtn}>
                    {isPlaying ? '⏸' : '▶'}
                  </button>
                  <button onClick={() => { if (videoRef.current) videoRef.current.currentTime -= 0.04; }} style={controlBtn}>⏮ Frame</button>
                  <button onClick={() => { if (videoRef.current) videoRef.current.currentTime += 0.04; }} style={controlBtn}>⏭ Frame</button>
                  <button onClick={() => { if (videoRef.current) videoRef.current.playbackRate = 0.2; }} style={controlBtn}>0.2×</button>
                  <button onClick={() => { if (videoRef.current) videoRef.current.playbackRate = 1.0; }} style={controlBtn}>1.0×</button>
                  <button onClick={() => { if (canvasRef.current) canvasRef.current.getContext('2d').clearRect(0, 0, canvasRef.current.width, canvasRef.current.height); }} style={{ ...controlBtn, marginLeft: 'auto', backgroundColor: '#e63946' }}>Cancella Disegno</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4. ATLETI (CON SPOSTAMENTO CATEGORIE PER COACH E ADMIN) */}
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
                              {/* MENU SPOSTAMENTO CATEGORIA (COACH E SUPER ADMIN) */}
                              {canManageAthletes && (
                                <select
                                  value={a.group}
                                  onChange={(e) => handleMoveCategory(a.id, e.target.value)}
                                  style={{ backgroundColor: '#090e1a', color: '#00d2ff', border: '1px solid #1f3357', borderRadius: '4px', padding: '3px 6px', fontSize: '11px', cursor: 'pointer' }}
                                >
                                  {categoriesList.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                              )}

                              {/* TASTO ELIMINA (SOLO SUPER ADMIN) */}
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

        {/* 5. GESTIONE CLUB (VISIBILE SOLO AD ALLENATORI E SUPER ADMIN) */}
        {activeTab === 'club' && canManageAthletes && (
          <div>
            <h1 style={{ fontSize: '24px', margin: '0 0 4px 0' }}>Bardonecchia Ski Academy</h1>
            <p style={{ margin: '0 0 20px 0', color: '#748cae', fontSize: '14px' }}>Stagione 2026/2027 • {members.length} membri registrati</p>

            <div style={{ backgroundColor: '#0e172a', border: '1px solid #1b2844', borderRadius: '8px', padding: '16px', marginBottom: '24px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '6px' }}>Codici Invito Attuali</div>
              <p style={{ color: '#6d83a7', fontSize: '13px', marginTop: 0, marginBottom: '12px' }}>
                Condividi questi codici per far registrare gli utenti:
              </p>
              <div style={{ display: 'flex', gap: '24px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: '#748cae', display: 'block' }}>ALLENATORI</span>
                  <code style={codeBoxStyle}>{inviteCodes.coach}</code>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#748cae', display: 'block' }}>ATLETI</span>
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

                    {/* L'ELIMINAZIONE È RISERVATA ESCLUSIVAMENTE AL SUPER ADMIN */}
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

        {/* 6. SUPER ADMIN (SOLO SUPER ADMIN) */}
        {activeTab === 'admin' && isSuperAdmin && (
          <div>
            <h1 style={{ fontSize: '24px', margin: '0 0 4px 0' }}>Pannello Super Admin</h1>
            <p style={{ margin: '0 0 20px 0', color: '#748cae', fontSize: '14px' }}>Gestione riservata delle credenziali e dei codici di sicurezza.</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
              <div style={{ backgroundColor: '#0e172a', border: '1px solid #1b2844', borderRadius: '8px', padding: '18px' }}>
                <h3 style={{ marginTop: 0, fontSize: '16px' }}>🔑 Modifica Codici Invito Club</h3>
                <form onSubmit={handleUpdateCodes}>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={fieldLabelStyle}>Codice Allenatori:</label>
                    <input placeholder={inviteCodes.coach} value={newCoachCode} onChange={(e) => setNewCoachCode(e.target.value)} style={inputStyle} />
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={fieldLabelStyle}>Codice Atleti:</label>
                    <input placeholder={inviteCodes.athlete} value={newAthleteCode} onChange={(e) => setNewAthleteCode(e.target.value)} style={inputStyle} />
                  </div>
                  <button type="submit" style={actionBtnCyan}>Salva Codici</button>
                </form>
              </div>

              <div style={{ backgroundColor: '#0e172a', border: '1px solid #1b2844', borderRadius: '8px', padding: '18px' }}>
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
          </div>
        )}

      </main>

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
