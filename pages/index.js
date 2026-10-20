import React, { useState, useEffect, useRef } from 'react';

export default function App() {
  const [mounted, setMounted] = useState(false);

  // Ruoli: 'superadmin', 'coach', 'athlete'
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [filterType, setFilterType] = useState('Tutte');

  // Gruppi
  const [groups, setGroups] = useState([
    { id: 'allievi', name: 'Allievi', coaches: ['Pietro Panero'] },
    { id: 'baby', name: 'Baby', coaches: [] },
    { id: 'cuccioli', name: 'Cuccioli', coaches: [] },
    { id: 'giovani', name: 'Giovani', coaches: [] },
    { id: 'master', name: 'Master', coaches: [] },
    { id: 'ragazzi', name: 'Ragazzi', coaches: [] },
    { id: 'superbaby', name: 'Superbaby', coaches: [] },
  ]);

  // Utenti / Membri iniziali
  const defaultMembers = [
    { id: '1', name: 'Super Admin', email: 'superadmin@skirank.it', role: 'superadmin', group: 'Tutti', club: 'Bardonecchia Ski Academy' },
    { id: '2', name: 'Pietro Panero', email: 'pietro@panero.biz', role: 'coach', group: 'Allievi', club: 'Bardonecchia Ski Academy' },
    { id: '3', name: 'Matteo Rossi', email: 'matteo.rossi@gmail.com', role: 'athlete', group: 'Allievi', club: 'Bardonecchia Ski Academy' },
    { id: '4', name: 'Sofia Bianchi', email: 'sofia.bianchi@gmail.com', role: 'athlete', group: 'Ragazzi', club: 'Bardonecchia Ski Academy' },
  ];

  const [members, setMembers] = useState([]);

  // Attività iniziali
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

  // Modale Aggiungi Atleta
  const [showNewAthleteModal, setShowNewAthleteModal] = useState(false);
  const [newAthleteName, setNewAthleteName] = useState('');
  const [newAthleteEmail, setNewAthleteEmail] = useState('');
  const [newAthleteGroup, setNewAthleteGroup] = useState('Allievi');

  // Video Player
  const [videos, setVideos] = useState([]);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [currentVideoSrc, setCurrentVideoSrc] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);

  // Caricamento sicuro da memoria locale
  useEffect(() => {
    setMounted(true);
    try {
      const savedUser = localStorage.getItem('academy_user');
      if (savedUser) setCurrentUser(JSON.parse(savedUser));

      const savedActs = localStorage.getItem('academy_acts');
      if (savedActs) {
        setActivities(JSON.parse(savedActs));
      } else {
        setActivities(defaultActivities);
      }

      const savedMembers = localStorage.getItem('academy_members');
      if (savedMembers) {
        setMembers(JSON.parse(savedMembers));
      } else {
        setMembers(defaultMembers);
      }
    } catch (e) {}
  }, []);

  // Salva stato membri
  const persistMembers = (newMembers) => {
    setMembers(newMembers);
    try { localStorage.setItem('academy_members', JSON.stringify(newMembers)); } catch (e) {}
  };

  // Salva stato attività
  const persistActivities = (newActs) => {
    setActivities(newActs);
    try { localStorage.setItem('academy_acts', JSON.stringify(newActs)); } catch (e) {}
  };

  const loginAs = (role) => {
    let user = members.find(m => m.role === role) || defaultMembers.find(m => m.role === role);
    setCurrentUser(user);
    try { localStorage.setItem('academy_user', JSON.stringify(user)); } catch (e) {}
  };

  const logout = () => {
    setCurrentUser(null);
    try { localStorage.removeItem('academy_user'); } catch (e) {}
  };

  // --- AZIONI SUPER ADMIN: ELIMINAZIONE ---
  const deleteMember = (id) => {
    if (confirm('Sei sicuro di voler eliminare definitivamente questo utente/atleta?')) {
      const updated = members.filter(m => m.id !== id);
      persistMembers(updated);
    }
  };

  const deleteActivity = (id) => {
    if (confirm('Vuoi eliminare questa attività dal programma?')) {
      const updated = activities.filter(a => a.id !== id);
      persistActivities(updated);
    }
  };

  // Aggiungi nuova attività
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

  // Aggiungi nuovo atleta
  const handleAddAthlete = (e) => {
    e.preventDefault();
    if (!newAthleteName) return;
    const newAth = {
      id: Date.now().toString(),
      name: newAthleteName,
      email: newAthleteEmail || `${newAthleteName.toLowerCase().replace(/\s+/g, '.')}@club.it`,
      role: 'athlete',
      group: newAthleteGroup,
      club: 'Bardonecchia Ski Academy'
    };
    const updated = [...members, newAth];
    persistMembers(updated);
    setShowNewAthleteModal(false);
    setNewAthleteName('');
    setNewAthleteEmail('');
  };

  // Gestione Canvas Video
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

  // --- LOGIN ---
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
          <div style={{ width: '100%', maxWidth: '360px' }}>
            <h2 style={{ fontSize: '28px', margin: '0 0 6px 0', fontWeight: 'bold' }}>Bentornato</h2>
            <p style={{ color: '#8b9bb4', fontSize: '14px', margin: '0 0 24px 0' }}>Accedi per gestire il tuo club.</p>

            <div style={{ marginBottom: '24px' }}>
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#52668d', letterSpacing: '1px' }}>ACCESSO RAPIDO DEMO</span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '10px' }}>
                <button onClick={() => loginAs('superadmin')} style={demoBtnStyle}>🛡️ Dirigente</button>
                <button onClick={() => loginAs('coach')} style={demoBtnStyle}>🚩 Allenatore</button>
                <button onClick={() => loginAs('athlete')} style={demoBtnStyle}>👤 Atleta</button>
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={fieldLabelStyle}>Email</label>
              <input readOnly value="superadmin@skirank.it" style={inputStyle} />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={fieldLabelStyle}>Password</label>
              <input readOnly type="password" value="••••••••••••" style={inputStyle} />
            </div>

            <button onClick={() => loginAs('superadmin')} style={primarySubmitBtn}>
              Accedi come Super Admin
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- APP PRINCIPALE ---
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
            <button onClick={() => setActiveTab('club')} style={navBtnStyle(activeTab === 'club')}>
              ⚙️ Gestione Club
            </button>
            {currentUser.role === 'superadmin' && (
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
              <div style={{ fontSize: '11px', color: '#6882a9', textTransform: 'capitalize' }}>{currentUser.role}</div>
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
                <div style={{ fontSize: '26px', fontWeight: 'bold', marginTop: '10px' }}>{videos.length}</div>
                <div style={{ fontSize: '11px', color: '#6d83a7', letterSpacing: '0.5px' }}>VIDEO</div>
              </div>
              <div style={statCardStyle}>
                <div style={statIconBox('#8338ec')}>👥</div>
                <div style={{ fontSize: '26px', fontWeight: 'bold', marginTop: '10px' }}>{members.filter(m => m.role === 'athlete').length}</div>
                <div style={{ fontSize: '11px', color: '#6d83a7', letterSpacing: '0.5px' }}>ATLETI</div>
              </div>
              <div style={statCardStyle}>
                <div style={statIconBox('#06d6a0')}>✅</div>
                <div style={{ fontSize: '26px', fontWeight: 'bold', marginTop: '10px' }}>{activities.reduce((sum, a) => sum + (a.confirmedCount || 0), 0)}</div>
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
                      {currentUser.role === 'superadmin' && (
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
              {(currentUser.role === 'coach' || currentUser.role === 'superadmin') && (
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
              {activities.length === 0 ? (
                <p style={{ color: '#748cae', textAlign: 'center', padding: '30px' }}>Nessuna attività registrata.</p>
              ) : (
                activities
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '13px', color: '#06d6a0', fontWeight: 'bold' }}>{a.confirmedCount}/{a.totalCount} Conferme</span>
                        {/* TASTO ELIMINA PER SUPER ADMIN */}
                        {currentUser.role === 'superadmin' && (
                          <button onClick={() => deleteActivity(a.id)} style={deleteBtnStyle}>
                            🗑️ Elimina
                          </button>
                        )}
                      </div>
                    </div>
                  ))
              )}
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

        {/* 4. ATLETI */}
        {activeTab === 'atleti' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h1 style={{ fontSize: '24px', margin: '0 0 4px 0' }}>Atleti</h1>
                <p style={{ margin: 0, color: '#748cae', fontSize: '14px' }}>Atleti divisi per gruppo con allenatori assegnati.</p>
              </div>
              {currentUser.role === 'superadmin' && (
                <button onClick={() => setShowNewAthleteModal(true)} style={actionBtnCyan}>
                  + Nuovo Atleta
                </button>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {groups.map(g => {
                const groupAthletes = members.filter(m => m.role === 'athlete' && m.group === g.name);
                return (
                  <div key={g.id} style={{ backgroundColor: '#0e172a', border: '1px solid #1b2844', borderRadius: '8px', padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{g.name} ({groupAthletes.length})</div>
                      <span style={{ fontSize: '12px', color: '#00d2ff' }}>Allenatori: {g.coaches.join(', ') || 'nessuno'}</span>
                    </div>

                    {groupAthletes.length === 0 ? (
                      <p style={{ color: '#5f759c', fontSize: '13px', margin: 0 }}>Nessun atleta in questo gruppo.</p>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '8px' }}>
                        {groupAthletes.map(a => (
                          <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#131e36', padding: '8px 12px', borderRadius: '6px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ ...avatarStyle, width: '26px', height: '26px', fontSize: '11px' }}>{a.name.substring(0, 2).toUpperCase()}</div>
                              <span style={{ fontSize: '13px', fontWeight: 500 }}>{a.name}</span>
                            </div>
                            {/* TASTO ELIMINA ATLETA PER SUPER ADMIN */}
                            {currentUser.role === 'superadmin' && (
                              <button onClick={() => deleteMember(a.id)} style={{ background: 'none', border: 'none', color: '#e63946', cursor: 'pointer', fontSize: '12px', padding: '2px 6px' }}>
                                🗑️
                              </button>
                            )}
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
        {activeTab === 'club' && (
          <div>
            <h1 style={{ fontSize: '24px', margin: '0 0 4px 0' }}>Bardonecchia Ski Academy</h1>
            <p style={{ margin: '0 0 20px 0', color: '#748cae', fontSize: '14px' }}>Stagione 2026/2027 • {members.length} membri</p>

            <div style={{ backgroundColor: '#0e172a', border: '1px solid #1b2844', borderRadius: '8px', padding: '16px', marginBottom: '24px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '6px' }}>Codici invito</div>
              <p style={{ color: '#6d83a7', fontSize: '13px', marginTop: 0, marginBottom: '12px' }}>
                Condividi questi codici: chi si registra entra automaticamente nel club con il ruolo corretto.
              </p>
              <div style={{ display: 'flex', gap: '20px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: '#748cae', display: 'block' }}>ALLENATORI</span>
                  <code style={codeBoxStyle}>CO-DEM01</code>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#748cae', display: 'block' }}>ATLETI</span>
                  <code style={codeBoxStyle}>AT-DEM01</code>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '16px', margin: 0 }}>Membri del club ({members.length})</h3>
              {currentUser.role === 'superadmin' && (
                <button onClick={() => setShowNewAthleteModal(true)} style={{ ...actionBtnCyan, padding: '6px 12px', fontSize: '12px' }}>
                  + Aggiungi Utente
                </button>
              )}
            </div>

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
                    <span style={{ fontSize: '12px', backgroundColor: '#13233d', padding: '3px 8px', borderRadius: '4px', color: '#00d2ff', textTransform: 'capitalize' }}>
                      {m.role} {m.group !== 'Tutti' && `• ${m.group}`}
                    </span>
                    {/* SUPER ADMIN PUÒ ELIMINARE CHIUNQUE (tranne se stesso) */}
                    {currentUser.role === 'superadmin' && m.id !== currentUser.id && (
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

        {/* 6. SUPER ADMIN */}
        {activeTab === 'admin' && currentUser.role === 'superadmin' && (
          <div>
            <h1 style={{ fontSize: '24px', margin: '0 0 4px 0' }}>Pannello Super Admin</h1>
            <p style={{ margin: '0 0 20px 0', color: '#748cae', fontSize: '14px' }}>Gestione totale dei club, utenti, atleti e programmazione.</p>

            <div style={{ backgroundColor: '#0e172a', border: '1px solid #1b2844', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '15px', color: '#00d2ff', marginBottom: '6px' }}>Bardonecchia Ski Academy</div>
              <div style={{ fontSize: '13px', color: '#7e92b3' }}>Stagione 2026/2027 • {members.length} membri • Inviti: CO-DEM01 / AT-DEM01</div>
            </div>

            <div style={{ backgroundColor: '#0e172a', border: '1px solid #1b2844', borderRadius: '8px', padding: '16px' }}>
              <h3 style={{ fontSize: '15px', marginTop: 0 }}>Controllo Rapido Dati</h3>
              <p style={{ fontSize: '13px', color: '#748cae' }}>Come Super Admin hai i diritti per eliminare o modificare qualsiasi elemento presente nelle schede "Programmazione", "Atleti" e "Gestione Club".</p>
              <button 
                onClick={() => {
                  if (confirm('Vuoi ripristinare i dati iniziali di fabbrica?')) {
                    persistMembers(defaultMembers);
                    persistActivities(defaultActivities);
                    alert('Dati ripristinati con successo!');
                  }
                }}
                style={{ ...controlBtn, backgroundColor: '#374151' }}
              >
                🔄 Ripristina Dati Iniziali Demo
              </button>
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
                  {groups.map(g => <option key={g.id} value={g.name}>{g.name}</option>)}
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

      {/* MODAL NUOVO ATLETA (SUPER ADMIN) */}
      {showNewAthleteModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: '#0e172a', border: '1px solid #1b2844', padding: '24px', borderRadius: '8px', width: '380px' }}>
            <h3 style={{ margin: '0 0 16px 0' }}>Aggiungi Nuovo Atleta</h3>
            <form onSubmit={handleAddAthlete}>
              <div style={{ marginBottom: '12px' }}>
                <label style={fieldLabelStyle}>Nome e Cognome:</label>
                <input value={newAthleteName} onChange={(e) => setNewAthleteName(e.target.value)} placeholder="es. Marco Rossi" style={inputStyle} required />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={fieldLabelStyle}>Email (opzionale):</label>
                <input value={newAthleteEmail} onChange={(e) => setNewAthleteEmail(e.target.value)} placeholder="marco@email.it" style={inputStyle} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={fieldLabelStyle}>Gruppo / Categoria:</label>
                <select value={newAthleteGroup} onChange={(e) => setNewAthleteGroup(e.target.value)} style={selectDarkStyle}>
                  {groups.map(g => <option key={g.id} value={g.name}>{g.name}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="submit" style={{ ...actionBtnCyan, flex: 1 }}>Salva Atleta</button>
                <button type="button" onClick={() => setShowNewAthleteModal(false)} style={{ ...controlBtn, flex: 1 }}>Annulla</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// --- STILI GRAFICI ---
const loginContainerStyle = {
  display: 'flex',
  minHeight: '100vh',
  backgroundColor: '#070b14',
  color: '#fff',
  fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
};

const loginHeroStyle = {
  flex: 1.2,
  position: 'relative',
  backgroundImage: 'url("https://images.unsplash.com/photo-1551698618-1dfe5d97d256?q=80&w=1400&auto=format&fit=crop")',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-end',
};

const loginFormStyle = {
  flex: 1,
  backgroundColor: '#090e1a',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '40px'
};

const sidebarStyle = {
  width: '240px',
  backgroundColor: '#0b1120',
  borderRight: '1px solid #141e33',
  padding: '24px 16px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between'
};

const logoIconStyle = {
  width: '32px',
  height: '32px',
  borderRadius: '8px',
  backgroundColor: '#00d2ff',
  color: '#000',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 'bold',
  fontSize: '18px'
};

const navBtnStyle = (active) => ({
  width: '100%',
  textAlign: 'left',
  padding: '10px 14px',
  borderRadius: '6px',
  border: 'none',
  backgroundColor: active ? '#101d36' : 'transparent',
  color: active ? '#00d2ff' : '#889ebf',
  fontWeight: active ? 'bold' : 'normal',
  fontSize: '14px',
  cursor: 'pointer',
});

const avatarStyle = {
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  backgroundColor: '#1d2d4c',
  color: '#00d2ff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '12px',
  fontWeight: 'bold'
};

const demoBtnStyle = {
  padding: '8px 4px',
  borderRadius: '6px',
  border: '1px solid #1c2a47',
  backgroundColor: '#0f172a',
  color: '#a0b3d1',
  fontSize: '11px',
  fontWeight: 'bold',
  cursor: 'pointer'
};

const fieldLabelStyle = {
  display: 'block',
  fontSize: '12px',
  color: '#8b9bb4',
  marginBottom: '5px'
};

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '10px 12px',
  borderRadius: '6px',
  border: '1px solid #1d2c4a',
  backgroundColor: '#0d1527',
  color: '#fff',
  fontSize: '14px'
};

const selectDarkStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: '6px',
  border: '1px solid #1d2c4a',
  backgroundColor: '#0d1527',
  color: '#fff',
  fontSize: '14px'
};

const primarySubmitBtn = {
  width: '100%',
  padding: '12px',
  borderRadius: '6px',
  border: 'none',
  backgroundColor: '#00d2ff',
  color: '#000',
  fontWeight: 'bold',
  fontSize: '15px',
  cursor: 'pointer'
};

const actionBtnCyan = {
  padding: '8px 16px',
  borderRadius: '6px',
  border: 'none',
  backgroundColor: '#00d2ff',
  color: '#000',
  fontWeight: 'bold',
  fontSize: '13px',
  cursor: 'pointer'
};

const controlBtn = {
  padding: '6px 12px',
  borderRadius: '4px',
  border: '1px solid #233454',
  backgroundColor: '#131e36',
  color: '#fff',
  fontSize: '12px',
  cursor: 'pointer'
};

const deleteBtnStyle = {
  padding: '4px 8px',
  borderRadius: '4px',
  border: '1px solid #4a1d24',
  backgroundColor: '#261217',
  color: '#ff4d4f',
  fontSize: '12px',
  fontWeight: 'bold',
  cursor: 'pointer'
};

const statCardStyle = {
  backgroundColor: '#0e172a',
  border: '1px solid #1a2742',
  borderRadius: '8px',
  padding: '18px'
};

const statIconBox = (bg) => ({
  width: '36px',
  height: '36px',
  borderRadius: '8px',
  backgroundColor: bg + '22',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '16px'
});

const sectionBoxStyle = {
  backgroundColor: '#0e172a',
  border: '1px solid #1a2742',
  borderRadius: '8px',
  padding: '18px'
};

const codeBoxStyle = {
  display: 'inline-block',
  marginTop: '4px',
  padding: '6px 10px',
  backgroundColor: '#132038',
  color: '#00d2ff',
  borderRadius: '4px',
  fontSize: '14px',
  fontWeight: 'bold'
};
