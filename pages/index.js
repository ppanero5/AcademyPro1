import React, { useState, useEffect, useRef } from 'react';

export default function App() {
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // --- STATO AUTENTICAZIONE E SESSIONE ---
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
  const [regGroup, setRegGroup] = useState('Baby');

  // Codici Invito Separati
  const defaultCodes = {
    coachPulcini: 'CO-PUL26',
    coachGrandi: 'CO26',
    athletePulcini: 'PUL26',
    athleteGrandi: 'AT26'
  };
  const [inviteCodes, setInviteCodes] = useState(defaultCodes);

  // Categorie divise per Macro-Settore
  const pulciniCategories = ['Superbaby', 'Baby', 'Cuccioli'];
  const grandiCategories = ['Ragazzi', 'Allievi', 'Giovani', 'Master'];
  const allCategories = [...pulciniCategories, ...grandiCategories];

  // Membri di default
  const defaultMembers = [
    {
      id: '1',
      name: 'Super Admin',
      email: 'superadmin@skirank.it',
      password: 'admin',
      role: 'superadmin',
      sector: 'all',
      group: 'Tutti',
      club: 'Bardonecchia Ski Academy'
    }
  ];
  const [members, setMembers] = useState([]);

  // Attività di programma
  const defaultActivities = [
    {
      id: 1,
      title: 'Allenamento Gigante - Pista 23',
      type: 'Allenamento',
      sector: 'grandi',
      date: '2026-10-22',
      time: '08:30 - 12:00',
      targetGroup: 'Allievi',
      confirmations: {}
    }
  ];
  const [activities, setActivities] = useState([]);
  const [showNewActivityModal, setShowNewActivityModal] = useState(false);
  const [newActTitle, setNewActTitle] = useState('');
  const [newActType, setNewActType] = useState('Allenamento');
  const [newActGroup, setNewActGroup] = useState('Baby');
  const [newActDate, setNewActDate] = useState('');

  // --- STATO REGISTRO PRESENZE ---
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceCategory, setAttendanceCategory] = useState('Baby');
  const [attendanceRecords, setAttendanceRecords] = useState({});

  // --- LIBRERIA VIDEO & PLAYER ---
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

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawColor, setDrawColor] = useState('#00d2ff');

  // Super Admin Credentials Edit
  const [editAdminEmail, setEditAdminEmail] = useState('');
  const [editAdminPassword, setEditAdminPassword] = useState('');

  // Rilevamento viewport mobile
  useEffect(() => {
    setMounted(true);
    const checkViewport = () => setIsMobile(window.innerWidth < 768);
    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  // --- LETTURA PERSISTENTE LOGIN ALL'AVVIO (LOCALSTORAGE + COOKIE 365 GIORNI) ---
  useEffect(() => {
    try {
      let savedUser = localStorage.getItem('academy_user');
      
      // Controllo cookie nel caso l'app si apra da standalone Home Screen su iPhone
      if (!savedUser) {
        const match = document.cookie.match(new RegExp('(^| )academy_user=([^;]+)'));
        if (match) {
          savedUser = decodeURIComponent(match[2]);
        }
      }

      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        setCurrentUser(parsed);
        // Sincronizza entrambi i sistemi di memoria
        localStorage.setItem('academy_user', JSON.stringify(parsed));
        document.cookie = `academy_user=${encodeURIComponent(JSON.stringify(parsed))}; path=/; max-age=31536000; SameSite=Lax`;
      }

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

      const savedAtt = localStorage.getItem('academy_attendance');
      if (savedAtt) setAttendanceRecords(JSON.parse(savedAtt));
    } catch (e) {
      console.error(e);
    }
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

  const persistAttendance = (att) => {
    setAttendanceRecords(att);
    try { localStorage.setItem('academy_attendance', JSON.stringify(att)); } catch (e) {}
  };

  // --- LOGIN CON SCRITTURA COOKIE PERMANENTE ---
  const handleLogin = (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    const cleanEmail = loginEmail.toLowerCase().trim();
    const user = members.find(m => m.email.toLowerCase() === cleanEmail);

    if (!user) {
      setAuthError('Nessun account registrato con questa email.');
      return;
    }

    if (user.password !== loginPassword) {
      setAuthError('Password errata. Riprova.');
      return;
    }

    setCurrentUser(user);
    try {
      const userStr = JSON.stringify(user);
      localStorage.setItem('academy_user', userStr);
      document.cookie = `academy_user=${encodeURIComponent(userStr)}; path=/; max-age=31536000; SameSite=Lax`;
    } catch (e) {}
    setLoginPassword('');
  };

  // --- REGISTRAZIONE CON SCRITTURA COOKIE PERMANENTE ---
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
      setAuthError('Questa email è già registrata.');
      return;
    }

    const cleanCode = regInviteCode.trim().toUpperCase();
    let assignedRole = '';
    let assignedSector = '';

    if (cleanCode === inviteCodes.coachPulcini.toUpperCase()) {
      assignedRole = 'coach';
      assignedSector = 'pulcini';
    } else if (cleanCode === inviteCodes.coachGrandi.toUpperCase()) {
      assignedRole = 'coach';
      assignedSector = 'grandi';
    } else if (cleanCode === inviteCodes.athletePulcini.toUpperCase()) {
      assignedRole = 'athlete';
      assignedSector = 'pulcini';
    } else if (cleanCode === inviteCodes.athleteGrandi.toUpperCase()) {
      assignedRole = 'athlete';
      assignedSector = 'grandi';
    } else {
      setAuthError('Codice di invito non valido! Controlla con il tuo club.');
      return;
    }

    let finalGroup = regGroup;
    if (assignedRole === 'athlete') {
      if (assignedSector === 'pulcini' && !pulciniCategories.includes(regGroup)) {
        finalGroup = 'Baby';
      }
      if (assignedSector === 'grandi' && !grandiCategories.includes(regGroup)) {
        finalGroup = 'Ragazzi';
      }
    } else {
      finalGroup = 'Tutti';
    }

    const newUser = {
      id: Date.now().toString(),
      name: `${regName.trim()} ${regSurname.trim()}`,
      email: cleanEmail,
      password: regPassword,
      role: assignedRole,
      sector: assignedSector,
      group: finalGroup,
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
    setAuthSuccess('Registrazione completata! Inserisci la password per accedere.');
    setAuthTab('login');
  };

  // --- LOGOUT CON CANCELLAZIONE COOKIE ---
  const logout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('academy_user');
      document.cookie = 'academy_user=; path=/; max-age=0';
    } catch (e) {}
  };

  const isSuperAdmin = currentUser?.role === 'superadmin';
  const isCoach = currentUser?.role === 'coach';
  const isAthlete = currentUser?.role === 'athlete';

  const canManageCategory = (catName) => {
    if (isSuperAdmin) return true;
    if (!isCoach) return false;
    if (currentUser.sector === 'pulcini' && pulciniCategories.includes(catName)) return true;
    if (currentUser.sector === 'grandi' && grandiCategories.includes(catName)) return true;
    return false;
  };

  const toggleAttendance = (athleteId) => {
    const dayRecords = attendanceRecords[attendanceDate] || {};
    const newStatus = !dayRecords[athleteId];
    const updated = {
      ...attendanceRecords,
      [attendanceDate]: {
        ...dayRecords,
        [athleteId]: newStatus
      }
    };
    persistAttendance(updated);
  };

  const markAllPresent = (athletes) => {
    const dayRecords = { ...(attendanceRecords[attendanceDate] || {}) };
    athletes.forEach(a => {
      dayRecords[a.id] = true;
    });
    const updated = {
      ...attendanceRecords,
      [attendanceDate]: dayRecords
    };
    persistAttendance(updated);
  };

  const getAthleteStats = (athleteId) => {
    let attended = 0;
    let absent = 0;
    Object.keys(attendanceRecords).forEach(date => {
      const day = attendanceRecords[date];
      if (day && day[athleteId] !== undefined) {
        if (day[athleteId]) attended++;
        else absent++;
      }
    });
    const total = attended + absent;
    const rate = total > 0 ? Math.round((attended / total) * 100) : 100;
    return { attended, absent, total, rate };
  };

  const handleConfirmActivity = (activityId, response) => {
    const updated = activities.map(act => {
      if (act.id === activityId) {
        return {
          ...act,
          confirmations: {
            ...(act.confirmations || {}),
            [currentUser.id]: response
          }
        };
      }
      return act;
    });
    persistActivities(updated);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setTempVideoFile(URL.createObjectURL(file));
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
    alert('Video caricato con successo!');
  };

  const deleteVideo = (id) => {
    if (confirm('Vuoi cancellare questo video?')) {
      const updated = videos.filter(v => v.id !== id);
      persistVideos(updated);
      if (selectedVideoPlayer?.id === id) setSelectedVideoPlayer(null);
    }
  };

  const getCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX ?? (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const clientY = e.clientY ?? (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDraw = (e) => {
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

  const handleMoveCategory = (athleteId, newCat) => {
    const updated = members.map(m => (m.id === athleteId ? { ...m, group: newCat } : m));
    persistMembers(updated);
  };

  const deleteMember = (id) => {
    if (confirm('Sei sicuro di voler eliminare questo utente?')) {
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

    const isPulc = pulciniCategories.includes(newActGroup);
    const actSector = isPulc ? 'pulcini' : 'grandi';

    const newAct = {
      id: Date.now(),
      title: newActTitle,
      type: newActType,
      sector: actSector,
      date: newActDate || new Date().toISOString().split('T')[0],
      time: '09:00 - 12:30',
      targetGroup: newActGroup,
      confirmations: {}
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
    try {
      const userStr = JSON.stringify(me);
      localStorage.setItem('academy_user', userStr);
      document.cookie = `academy_user=${encodeURIComponent(userStr)}; path=/; max-age=31536000; SameSite=Lax`;
    } catch (e) {}
    alert('Credenziali Super Admin aggiornate!');
  };

  if (!mounted) return null;

  // ==========================================
  // SCHERMATA LOGIN & REGISTRAZIONE
  // ==========================================
  if (!currentUser) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#070b14', color: '#fff', display: 'flex', flexDirection: isMobile ? 'column' : 'row', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
        <div style={{
          flex: isMobile ? 'none' : '1.1',
          height: isMobile ? '160px' : 'auto',
          position: 'relative',
          backgroundImage: 'linear-gradient(rgba(7, 11, 20, 0.4), rgba(7, 11, 20, 0.95)), url("https://images.unsplash.com/photo-1551698618-1dfe5d97d256?q=80&w=1400&auto=format&fit=crop")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: isMobile ? '20px' : '40px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <div style={logoIconStyle}>M</div>
              <h2 style={{ margin: 0, fontSize: isMobile ? '18px' : '24px', fontWeight: 'bold' }}>AcademyPro</h2>
            </div>
            <p style={{ margin: 0, fontSize: isMobile ? '13px' : '22px', color: '#c3d4ee', lineHeight: '1.2' }}>
              Il tuo club sciistico, finalmente organizzato.
            </p>
          </div>
        </div>

        <div style={{
          flex: 1,
          backgroundColor: '#090e1a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: isMobile ? '20px 16px 40px' : '40px'
        }}>
          <div style={{ width: '100%', maxWidth: '380px' }}>
            <div style={{ display: 'flex', borderBottom: '2px solid #1a2742', marginBottom: '20px' }}>
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
                  fontSize: '15px',
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
                  fontSize: '15px',
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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                  <div>
                    <label style={fieldLabelStyle}>Nome</label>
                    <input required placeholder="Mario" value={regName} onChange={(e) => setRegName(e.target.value)} style={inputStyle} />
                  </div>
                  <div>
                    <label style={fieldLabelStyle}>Cognome</label>
                    <input required placeholder="Rossi" value={regSurname} onChange={(e) => setRegSurname(e.target.value)} style={inputStyle} />
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={fieldLabelStyle}>Email</label>
                  <input type="email" required placeholder="mario@email.it" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} style={inputStyle} />
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={fieldLabelStyle}>Password</label>
                  <input type="password" required placeholder="Crea password..." value={regPassword} onChange={(e) => setRegPassword(e.target.value)} style={inputStyle} />
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ ...fieldLabelStyle, color: '#00d2ff', fontWeight: 'bold' }}>
                    Codice di invito
                  </label>
                  <input
                    required
                    placeholder="Inserisci codice invito..."
                    value={regInviteCode}
                    onChange={(e) => setRegInviteCode(e.target.value)}
                    style={{ ...inputStyle, border: '1px solid #00d2ff', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={fieldLabelStyle}>Categoria di appartenenza (Atleti)</label>
                  <select value={regGroup} onChange={(e) => setRegGroup(e.target.value)} style={selectDarkStyle}>
                    {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
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

  const filteredVideos = videos.filter(v => {
    if (isAthlete) return v.athleteId === currentUser.id;
    if (videoFilterAthlete === 'Tutti') return true;
    return v.athleteId === videoFilterAthlete;
  });

  const visibleActivities = activities.filter(a => {
    if (isSuperAdmin) return true;
    if (isAthlete) return a.targetGroup === currentUser.group || a.targetGroup === 'Tutti';
    return true;
  });

  const currentAttendanceAthletes = members
    .filter(m => m.role === 'athlete' && m.group === attendanceCategory)
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', minHeight: '100vh', backgroundColor: '#090e1a', color: '#fff', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
      
      {/* HEADER MOBILE */}
      {isMobile ? (
        <header style={{
          position: 'sticky',
          top: 0,
          zIndex: 900,
          backgroundColor: '#0b1120',
          borderBottom: '1px solid #162238',
          padding: '12px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ ...logoIconStyle, width: '28px', height: '28px', fontSize: '15px' }}>M</div>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '14px', lineHeight: 1.1 }}>AcademyPro</div>
              <div style={{ fontSize: '10px', color: '#7e92b3' }}>Bardonecchia Ski</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: '#00d2ff', backgroundColor: '#13233d', padding: '3px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
              {isSuperAdmin ? 'Admin' : isCoach ? `Coach ${currentUser.sector}` : currentUser.group}
            </span>
            <button onClick={logout} style={{ background: 'none', border: 'none', color: '#ff4d4f', fontSize: '13px', padding: '4px', cursor: 'pointer' }}>
              🚪
            </button>
          </div>
        </header>
      ) : (
        /* SIDEBAR DESKTOP */
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
              <button onClick={() => setActiveTab('presenze')} style={navBtnStyle(activeTab === 'presenze')}>
                📋 Presenze & Statistiche
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
                  {isSuperAdmin ? 'Super Admin' : isCoach ? `Coach (${currentUser.sector})` : `Atleta (${currentUser.group})`}
                </div>
              </div>
            </div>
            <button onClick={logout} style={{ background: 'none', border: 'none', color: '#e63946', fontSize: '12px', cursor: 'pointer', padding: 0 }}>
              🚪 Esci
            </button>
          </div>
        </aside>
      )}

      {/* CONTENUTO CENTRALE */}
      <main style={{
        flex: 1,
        padding: isMobile ? '16px 14px 90px' : '24px 32px',
        overflowY: 'auto'
      }}>
        
        {/* 1. DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div>
            <div style={{ fontSize: '11px', color: '#5f759c', letterSpacing: '1px', textTransform: 'uppercase' }}>
              {currentUser.role.toUpperCase()} • 2026/2027
            </div>
            <h1 style={{ fontSize: isMobile ? '22px' : '28px', margin: '4px 0 16px 0' }}>
              Ciao {currentUser.name.split(' ')[0]} 👋
            </h1>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: '10px', marginBottom: '24px' }}>
              <div style={statCardStyle}>
                <div style={statIconBox('#00b4d8')}>📅</div>
                <div style={{ fontSize: '22px', fontWeight: 'bold', marginTop: '6px' }}>{visibleActivities.length}</div>
                <div style={{ fontSize: '10px', color: '#6d83a7' }}>ATTIVITÀ</div>
              </div>
              <div style={statCardStyle}>
                <div style={statIconBox('#3a86ff')}>🎞️</div>
                <div style={{ fontSize: '22px', fontWeight: 'bold', marginTop: '6px' }}>{filteredVideos.length}</div>
                <div style={{ fontSize: '10px', color: '#6d83a7' }}>VIDEO</div>
              </div>
              <div style={statCardStyle}>
                <div style={statIconBox('#8338ec')}>👥</div>
                <div style={{ fontSize: '22px', fontWeight: 'bold', marginTop: '6px' }}>{members.filter(m => m.role === 'athlete').length}</div>
                <div style={{ fontSize: '10px', color: '#6d83a7' }}>ATLETI</div>
              </div>
              <div style={statCardStyle}>
                <div style={statIconBox('#06d6a0')}>✅</div>
                <div style={{ fontSize: '22px', fontWeight: 'bold', marginTop: '6px' }}>
                  {Object.keys(attendanceRecords).length}
                </div>
                <div style={{ fontSize: '10px', color: '#6d83a7' }}>SESSIONI REG.</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={sectionBoxStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <h3 style={{ margin: 0, fontSize: '15px' }}>Prossime attività</h3>
                  <span onClick={() => setActiveTab('programmazione')} style={{ color: '#00d2ff', fontSize: '12px', cursor: 'pointer' }}>Vedi tutte &gt;</span>
                </div>
                {visibleActivities.length === 0 ? (
                  <p style={{ color: '#5f759c', textAlign: 'center', padding: '20px 0', fontSize: '13px' }}>Nessuna attività in programma.</p>
                ) : (
                  visibleActivities.slice(0, 3).map(a => (
                    <div key={a.id} style={{ padding: '10px', backgroundColor: '#0f1a30', borderRadius: '8px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{a.title}</div>
                        <div style={{ fontSize: '11px', color: '#7c94ba', marginTop: '2px' }}>{a.date} • {a.targetGroup}</div>
                      </div>
                      {isSuperAdmin && (
                        <button onClick={() => deleteActivity(a.id)} style={deleteBtnStyle}>🗑️</button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* 2. PROGRAMMAZIONE */}
        {activeTab === 'programmazione' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h1 style={{ fontSize: isMobile ? '20px' : '24px', margin: 0 }}>Programmazione</h1>
                <p style={{ margin: '2px 0 0', color: '#748cae', fontSize: '12px' }}>Conferma la tua presenza agli allenamenti e alle gare.</p>
              </div>
              {(isSuperAdmin || isCoach) && (
                <button onClick={() => setShowNewActivityModal(true)} style={{ ...actionBtnCyan, padding: isMobile ? '8px 12px' : '8px 16px', fontSize: '12px' }}>
                  + Nuova
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
              {['Tutte', 'Allenamento', 'Gara', 'Trasferta', 'Stage'].map(t => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '16px',
                    border: '1px solid',
                    borderColor: filterType === t ? '#00d2ff' : '#1e2c47',
                    backgroundColor: filterType === t ? '#00d2ff' : 'transparent',
                    color: filterType === t ? '#000' : '#889ebf',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer'
                  }}
                >
                  {t}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {visibleActivities
                .filter(a => filterType === 'Tutte' || a.type === filterType)
                .map(a => {
                  const myStatus = a.confirmations ? a.confirmations[currentUser.id] : null;
                  const yesCount = Object.values(a.confirmations || {}).filter(v => v === 'yes').length;
                  const noCount = Object.values(a.confirmations || {}).filter(v => v === 'no').length;

                  return (
                    <div key={a.id} style={{ backgroundColor: '#0f172a', padding: '14px', borderRadius: '8px', border: '1px solid #192642' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#132b45', color: '#00d2ff', fontWeight: 'bold' }}>{a.type}</span>
                            <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{a.title}</span>
                          </div>
                          <div style={{ fontSize: '11px', color: '#728aa9', marginTop: '4px' }}>
                            📅 {a.date} • 🕒 {a.time} • Gruppo: <strong>{a.targetGroup}</strong>
                          </div>
                        </div>
                        {isSuperAdmin && (
                          <button onClick={() => deleteActivity(a.id)} style={deleteBtnStyle}>🗑️</button>
                        )}
                      </div>

                      {/* AREA CONFERMA PER GLI ATLETI */}
                      {isAthlete && (
                        <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #162238', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '12px', color: '#889dbf' }}>La tua presenza:</span>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => handleConfirmActivity(a.id, 'yes')}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                border: '1px solid #06d6a0',
                                backgroundColor: myStatus === 'yes' ? '#06d6a0' : 'transparent',
                                color: myStatus === 'yes' ? '#000' : '#06d6a0',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                              }}
                            >
                              ✓ Ci sarò
                            </button>
                            <button
                              onClick={() => handleConfirmActivity(a.id, 'no')}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                border: '1px solid #ff4d4f',
                                backgroundColor: myStatus === 'no' ? '#ff4d4f' : 'transparent',
                                color: myStatus === 'no' ? '#fff' : '#ff4d4f',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                              }}
                            >
                              ✗ Non ci sarò
                            </button>
                          </div>
                        </div>
                      )}

                      {(isCoach || isSuperAdmin) && (
                        <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #162238', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                          <span style={{ color: '#06d6a0', fontWeight: 'bold' }}>✓ {yesCount} Presenti confermati</span>
                          <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>✗ {noCount} Assenti</span>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* 3. PRESENZE & STATISTICHE */}
        {activeTab === 'presenze' && (
          <div>
            <div style={{ marginBottom: '14px' }}>
              <h1 style={{ fontSize: isMobile ? '20px' : '24px', margin: 0 }}>Presenze & Statistiche</h1>
              <p style={{ margin: '2px 0 0', color: '#748cae', fontSize: '12px' }}>Appello rapido e monitoraggio frequenza atleti.</p>
            </div>

            <div style={{ backgroundColor: '#0e172a', border: '1px solid #1b2844', borderRadius: '8px', padding: '12px', marginBottom: '16px', display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)', gap: '10px' }}>
              <div>
                <label style={fieldLabelStyle}>Data Appello:</label>
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={fieldLabelStyle}>Categoria:</label>
                <select
                  value={attendanceCategory}
                  onChange={(e) => setAttendanceCategory(e.target.value)}
                  style={selectDarkStyle}
                >
                  {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              {canManageCategory(attendanceCategory) && (
                <div style={{ display: 'flex', alignItems: 'flex-end', gridColumn: isMobile ? 'span 2' : 'auto' }}>
                  <button
                    onClick={() => markAllPresent(currentAttendanceAthletes)}
                    style={{ ...actionBtnCyan, width: '100%', height: '44px' }}
                  >
                    ✓ Segna tutti Presenti
                  </button>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {currentAttendanceAthletes.length === 0 ? (
                <p style={{ color: '#5f759c', textAlign: 'center', padding: '20px 0', fontSize: '13px' }}>Nessun atleta registrato in questa categoria.</p>
              ) : (
                currentAttendanceAthletes.map(a => {
                  const dayRecords = attendanceRecords[attendanceDate] || {};
                  const isPresent = !!dayRecords[a.id];
                  const stats = getAthleteStats(a.id);
                  const canEdit = canManageCategory(attendanceCategory);

                  return (
                    <div
                      key={a.id}
                      style={{
                        backgroundColor: '#0f172a',
                        border: '1px solid #192642',
                        borderRadius: '8px',
                        padding: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          onClick={() => canEdit && toggleAttendance(a.id)}
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '6px',
                            border: '2px solid',
                            borderColor: isPresent ? '#06d6a0' : '#4b5563',
                            backgroundColor: isPresent ? '#06d6a0' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#000',
                            fontWeight: 'bold',
                            fontSize: '16px',
                            cursor: canEdit ? 'pointer' : 'default'
                          }}
                        >
                          {isPresent ? '✓' : ''}
                        </div>
                        <div>
                          <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{a.name}</div>
                          <div style={{ fontSize: '11px', color: '#6882a9' }}>
                            Presenze: <strong style={{ color: '#06d6a0' }}>{stats.attended}</strong> | Assenze: <strong style={{ color: '#ff4d4f' }}>{stats.absent}</strong>
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '14px', fontWeight: 'bold', color: stats.rate >= 80 ? '#06d6a0' : '#f59e0b' }}>
                          {stats.rate}%
                        </span>
                        <div style={{ fontSize: '10px', color: '#6882a9' }}>Frequenza</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* 4. LIBRERIA VIDEO */}
        {activeTab === 'video' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h1 style={{ fontSize: isMobile ? '20px' : '24px', margin: 0 }}>Libreria Video</h1>
                <p style={{ margin: '2px 0 0', color: '#748cae', fontSize: '12px' }}>Analisi tecnica discese.</p>
              </div>

              {!isAthlete && (
                <label style={{ ...actionBtnCyan, padding: isMobile ? '8px 12px' : '8px 16px', fontSize: '12px' }}>
                  📹 Carica
                  <input type="file" accept="video/*" onChange={handleFileSelect} style={{ display: 'none' }} />
                </label>
              )}
            </div>

            {!isAthlete && (
              <div style={{ marginBottom: '14px' }}>
                <select
                  value={videoFilterAthlete}
                  onChange={(e) => setVideoFilterAthlete(e.target.value)}
                  style={{ ...selectDarkStyle, width: '100%', maxWidth: '280px' }}
                >
                  <option value="Tutti">📁 Tutti gli Atleti</option>
                  {members.filter(m => m.role === 'athlete').map(a => (
                    <option key={a.id} value={a.id}>{a.name} ({a.group})</option>
                  ))}
                </select>
              </div>
            )}

            {filteredVideos.length === 0 ? (
              <div style={{ backgroundColor: '#0e172a', border: '1px dashed #1e2c47', borderRadius: '8px', padding: '30px', textAlign: 'center', color: '#6882a9', fontSize: '13px' }}>
                Nessun video presente in questo archivio.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(210px, 1fr))', gap: '10px' }}>
                {filteredVideos.map(v => (
                  <div
                    key={v.id}
                    style={{
                      backgroundColor: '#0e172a',
                      border: '1px solid #1a2742',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                    <div
                      onClick={() => setSelectedVideoPlayer(v)}
                      style={{ position: 'relative', width: '100%', height: isMobile ? '95px' : '120px', backgroundColor: '#000', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <video src={v.url} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }} preload="metadata" />
                      <div style={{ position: 'absolute', width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(0, 210, 255, 0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontSize: '14px', fontWeight: 'bold' }}>
                        ▶
                      </div>
                      <span style={{ position: 'absolute', bottom: '4px', right: '4px', fontSize: '9px', backgroundColor: '#000', padding: '1px 4px', borderRadius: '3px', color: '#00d2ff' }}>
                        {v.specialty}
                      </span>
                    </div>

                    <div style={{ padding: '8px' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        👤 {v.athleteName}
                      </div>
                      <div style={{ fontSize: '10px', color: '#748cae', marginTop: '2px' }}>
                        📍 {v.location}
                      </div>
                      <div style={{ fontSize: '10px', color: '#556c8f', marginTop: '2px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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

        {/* 5. ATLETI */}
        {activeTab === 'atleti' && (
          <div>
            <h1 style={{ fontSize: isMobile ? '20px' : '24px', margin: '0 0 4px 0' }}>Atleti</h1>
            <p style={{ margin: '0 0 16px 0', color: '#748cae', fontSize: '12px' }}>
              Atleti divisi per categoria.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {allCategories.map(catName => {
                const groupAthletes = members.filter(m => m.role === 'athlete' && m.group === catName);
                const canManageThis = canManageCategory(catName);

                return (
                  <div key={catName} style={{ backgroundColor: '#0e172a', border: '1px solid #1b2844', borderRadius: '8px', padding: '12px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '8px', color: '#00d2ff' }}>
                      {catName} ({groupAthletes.length})
                    </div>

                    {groupAthletes.length === 0 ? (
                      <p style={{ color: '#5f759c', fontSize: '12px', margin: 0 }}>Nessun atleta in questa categoria.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {groupAthletes.map(a => (
                          <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#131e36', padding: '8px 10px', borderRadius: '6px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ ...avatarStyle, width: '24px', height: '24px', fontSize: '10px' }}>{a.name.substring(0, 2).toUpperCase()}</div>
                              <span style={{ fontSize: '13px', fontWeight: 500 }}>{a.name}</span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {canManageThis && (
                                <select
                                  value={a.group}
                                  onChange={(e) => handleMoveCategory(a.id, e.target.value)}
                                  style={{ backgroundColor: '#090e1a', color: '#00d2ff', border: '1px solid #1f3357', borderRadius: '4px', padding: '3px 4px', fontSize: '11px' }}
                                >
                                  {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
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

        {/* 6. GESTIONE CLUB */}
        {activeTab === 'club' && !isAthlete && (
          <div>
            <h1 style={{ fontSize: isMobile ? '20px' : '24px', margin: '0 0 4px 0' }}>Gestione Club</h1>
            <p style={{ margin: '0 0 16px 0', color: '#748cae', fontSize: '12px' }}>Bardonecchia Ski Academy ({members.length} iscritti)</p>

            <div style={{ backgroundColor: '#0e172a', border: '1px solid #1b2844', borderRadius: '8px', padding: '14px', marginBottom: '18px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '8px' }}>Codici Invito Attuali</div>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: '10px' }}>
                <div>
                  <span style={{ fontSize: '10px', color: '#748cae', display: 'block' }}>COACH PULCINI</span>
                  <code style={codeBoxStyle}>{inviteCodes.coachPulcini}</code>
                </div>
                <div>
                  <span style={{ fontSize: '10px', color: '#748cae', display: 'block' }}>COACH GRANDI</span>
                  <code style={codeBoxStyle}>{inviteCodes.coachGrandi}</code>
                </div>
                <div>
                  <span style={{ fontSize: '10px', color: '#748cae', display: 'block' }}>ATLETI PULCINI</span>
                  <code style={codeBoxStyle}>{inviteCodes.athletePulcini}</code>
                </div>
                <div>
                  <span style={{ fontSize: '10px', color: '#748cae', display: 'block' }}>ATLETI GRANDI</span>
                  <code style={codeBoxStyle}>{inviteCodes.athleteGrandi}</code>
                </div>
              </div>
            </div>

            <h3 style={{ fontSize: '14px', marginBottom: '10px' }}>Membri Registrati</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {members.map(m => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0e172a', padding: '10px 12px', borderRadius: '6px', border: '1px solid #1b2844' }}>
                  <div style={{ overflow: 'hidden', paddingRight: '8px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.name}</div>
                    <div style={{ fontSize: '11px', color: '#6882a9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.email}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '11px', backgroundColor: '#13233d', padding: '2px 6px', borderRadius: '4px', color: '#00d2ff' }}>
                      {m.role === 'superadmin' ? 'Admin' : m.role === 'coach' ? `Coach (${m.sector})` : m.group}
                    </span>

                    {isSuperAdmin && m.id !== currentUser.id && (
                      <button onClick={() => deleteMember(m.id)} style={deleteBtnStyle}>
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 7. SUPER ADMIN */}
        {activeTab === 'admin' && isSuperAdmin && (
          <div>
            <h1 style={{ fontSize: isMobile ? '20px' : '24px', margin: '0 0 4px 0' }}>Super Admin</h1>
            <p style={{ margin: '0 0 16px 0', color: '#748cae', fontSize: '12px' }}>Recupero password e credenziali del club.</p>

            <div style={{ backgroundColor: '#0e172a', border: '1px solid #1b2844', borderRadius: '8px', padding: '14px', marginBottom: '20px' }}>
              <h3 style={{ marginTop: 0, fontSize: '14px', color: '#00d2ff' }}>🔑 Registro Utenti & Password</h3>
              <p style={{ fontSize: '12px', color: '#748cae', marginBottom: '12px' }}>
                Puoi recuperare o comunicare la password di qualsiasi membro:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {members.map(m => (
                  <div key={m.id} style={{ backgroundColor: '#131e36', padding: '10px 12px', borderRadius: '6px', border: '1px solid #1e2c47' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '13px' }}>{m.name}</span>
                      <span style={{ fontSize: '11px', color: '#00d2ff', backgroundColor: '#090e1a', padding: '1px 6px', borderRadius: '4px' }}>
                        {m.role} {m.group !== 'Tutti' && `• ${m.group}`}
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#7e92b3', marginTop: '3px' }}>✉️ {m.email}</div>
                    <div style={{ fontSize: '12px', color: '#06d6a0', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>Password:</span>
                      <strong style={{ fontFamily: 'monospace', backgroundColor: '#090e1a', padding: '1px 6px', borderRadius: '3px' }}>{m.password}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ backgroundColor: '#0e172a', border: '1px solid #1b2844', borderRadius: '8px', padding: '14px' }}>
              <h3 style={{ marginTop: 0, fontSize: '14px' }}>🛡️ Modifica Tue Credenziali</h3>
              <form onSubmit={handleUpdateAdminCredentials}>
                <div style={{ marginBottom: '10px' }}>
                  <label style={fieldLabelStyle}>Nuova Email:</label>
                  <input type="email" placeholder={currentUser.email} value={editAdminEmail} onChange={(e) => setEditAdminEmail(e.target.value)} style={inputStyle} />
                </div>
                <div style={{ marginBottom: '14px' }}>
                  <label style={fieldLabelStyle}>Nuova Password:</label>
                  <input type="password" placeholder="Nuova password..." value={editAdminPassword} onChange={(e) => setEditAdminPassword(e.target.value)} style={inputStyle} />
                </div>
                <button type="submit" style={actionBtnCyan}>Salva Credenziali</button>
              </form>
            </div>
          </div>
        )}

      </main>

      {/* BOTTOM BAR MOBILE */}
      {isMobile && (
        <nav style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          width: '100%',
          height: '64px',
          backgroundColor: '#0b1120',
          borderTop: '1px solid #162238',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          zIndex: 1000,
          paddingBottom: 'env(safe-area-inset-bottom)'
        }}>
          {[
            { id: 'dashboard', label: 'Home', icon: '📊' },
            { id: 'programmazione', label: 'Programma', icon: '📅' },
            { id: 'presenze', label: 'Presenze', icon: '📋' },
            { id: 'video', label: 'Video', icon: '🎞️' },
            { id: 'atleti', label: 'Atleti', icon: '👥' },
            ...(!isAthlete ? [{ id: 'club', label: 'Club', icon: '⚙️' }] : []),
            ...(isSuperAdmin ? [{ id: 'admin', label: 'Admin', icon: '🛡️' }] : []),
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                background: 'none',
                border: 'none',
                color: activeTab === item.id ? '#00d2ff' : '#6882a9',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
                fontSize: '10px',
                fontWeight: activeTab === item.id ? 'bold' : 'normal',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              <span style={{ fontSize: '18px' }}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      )}

      {/* MODALE DI CARICAMENTO VIDEO */}
      {showUploadModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: '#0e172a', border: '1px solid #1b2844', padding: '20px', borderRadius: isMobile ? '16px 16px 0 0' : '8px', width: '100%', maxWidth: '380px' }}>
            <h3 style={{ margin: '0 0 14px 0', fontSize: '16px', color: '#00d2ff' }}>📁 Scheda Video Discesa</h3>
            <form onSubmit={handleSaveVideo}>
              <div style={{ marginBottom: '10px' }}>
                <label style={fieldLabelStyle}>Specialità:</label>
                <select value={videoSpecialty} onChange={(e) => setVideoSpecialty(e.target.value)} style={selectDarkStyle}>
                  <option value="Slalom Gigante">Slalom Gigante (GS)</option>
                  <option value="Slalom Speciale">Slalom Speciale (SL)</option>
                  <option value="Super-G">Super-G (SG)</option>
                  <option value="Discesa Libera">Discesa Libera (DH)</option>
                  <option value="Campo Libero">Campo Libero</option>
                </select>
              </div>

              <div style={{ marginBottom: '10px' }}>
                <label style={fieldLabelStyle}>Tagga Atleta:</label>
                <select required value={videoTaggedAthleteId} onChange={(e) => setVideoTaggedAthleteId(e.target.value)} style={selectDarkStyle}>
                  <option value="">-- Seleziona Atleta --</option>
                  {members.filter(m => m.role === 'athlete').map(a => (
                    <option key={a.id} value={a.id}>{a.name} ({a.group})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                <div>
                  <label style={fieldLabelStyle}>Luogo:</label>
                  <input value={videoLocation} onChange={(e) => setVideoLocation(e.target.value)} placeholder="Bardonecchia" style={inputStyle} />
                </div>
                <div>
                  <label style={fieldLabelStyle}>Pista:</label>
                  <input value={videoSlope} onChange={(e) => setVideoSlope(e.target.value)} placeholder="Pista 23" style={inputStyle} />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={fieldLabelStyle}>Data discesa:</label>
                <input type="date" value={videoDate} onChange={(e) => setVideoDate(e.target.value)} style={inputStyle} required />
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="submit" style={{ ...actionBtnCyan, flex: 1, padding: '12px' }}>Salva Video</button>
                <button type="button" onClick={() => { setShowUploadModal(false); setTempVideoFile(null); }} style={{ ...controlBtn, flex: 1, padding: '12px' }}>Annulla</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP PLAYER VIDEO TELESTRATOR */}
      {selectedVideoPlayer && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: isMobile ? '8px' : '20px' }}>
          <div style={{ backgroundColor: '#090e1a', border: '1px solid #1a2742', borderRadius: '8px', padding: isMobile ? '10px' : '16px', maxWidth: '780px', width: '100%', maxHeight: '96vh', overflowY: 'auto' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ fontSize: '13px', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {selectedVideoPlayer.specialty} • {selectedVideoPlayer.athleteName}
              </div>
              <button onClick={() => setSelectedVideoPlayer(null)} style={{ background: 'none', border: 'none', color: '#ff4d4f', fontSize: '18px', cursor: 'pointer', padding: '4px' }}>✖</button>
            </div>

            <div style={{ position: 'relative', width: '100%', maxHeight: isMobile ? '55vh' : '480px', backgroundColor: '#000', borderRadius: '6px', overflow: 'hidden' }}>
              <video
                ref={videoRef}
                src={selectedVideoPlayer.url}
                playsInline
                webkit-playsinline="true"
                style={{ width: '100%', maxHeight: isMobile ? '55vh' : '480px', display: 'block', margin: '0 auto' }}
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

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px', alignItems: 'center' }}>
              <button onClick={() => { if (videoRef.current) { isPlaying ? videoRef.current.pause() : videoRef.current.play(); setIsPlaying(!isPlaying); }}} style={{ ...controlBtn, flex: '1 1 auto', padding: '10px' }}>
                {isPlaying ? '⏸ Pausa' : '▶ Play'}
              </button>
              <button onClick={() => { if (videoRef.current) { videoRef.current.pause(); setIsPlaying(false); videoRef.current.currentTime -= 0.04; }}} style={{ ...controlBtn, flex: '1 1 auto', padding: '10px' }}>⏮ Frame</button>
              <button onClick={() => { if (videoRef.current) { videoRef.current.pause(); setIsPlaying(false); videoRef.current.currentTime += 0.04; }}} style={{ ...controlBtn, flex: '1 1 auto', padding: '10px' }}>⏭ Frame</button>
              
              <div style={{ display: 'flex', gap: '4px', width: isMobile ? '100%' : 'auto', justifyContent: 'space-around', marginTop: isMobile ? '4px' : '0' }}>
                {[0.2, 0.5, 1.0].map(rate => (
                  <button key={rate} onClick={() => { if (videoRef.current) videoRef.current.playbackRate = rate; }} style={{ ...controlBtn, flex: isMobile ? 1 : 'none', padding: '8px' }}>
                    {rate}×
                  </button>
                ))}
              </div>

              {!isAthlete && (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '100%', marginTop: '6px', borderTop: '1px solid #162238', paddingTop: '8px' }}>
                  <label style={{ fontSize: '11px', color: '#748cae' }}>Colore:</label>
                  <input type="color" value={drawColor} onChange={(e) => setDrawColor(e.target.value)} style={{ background: 'none', border: 'none', width: '28px', height: '24px', cursor: 'pointer' }} />
                  <button onClick={() => { if (canvasRef.current) canvasRef.current.getContext('2d').clearRect(0, 0, canvasRef.current.width, canvasRef.current.height); }} style={{ ...controlBtn, backgroundColor: '#2d1518', color: '#ff4d4f', border: '1px solid #5a1c24', padding: '6px 10px' }}>
                    Cancella Tratti
                  </button>
                  <span style={{ fontSize: '10px', color: '#6882a9', marginLeft: 'auto' }}>
                    Pausa per disegnare
                  </span>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* MODAL NUOVA ATTIVITÀ */}
      {showNewActivityModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: '#0e172a', border: '1px solid #1b2844', padding: '20px', borderRadius: isMobile ? '16px 16px 0 0' : '8px', width: '100%', maxWidth: '380px' }}>
            <h3 style={{ margin: '0 0 14px 0', fontSize: '16px' }}>Crea Nuova Attività</h3>
            <form onSubmit={handleCreateActivity}>
              <div style={{ marginBottom: '10px' }}>
                <label style={fieldLabelStyle}>Titolo attività:</label>
                <input value={newActTitle} onChange={(e) => setNewActTitle(e.target.value)} placeholder="es. Slalom Gigante" style={inputStyle} required />
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label style={fieldLabelStyle}>Tipo:</label>
                <select value={newActType} onChange={(e) => setNewActType(e.target.value)} style={selectDarkStyle}>
                  <option value="Allenamento">Allenamento</option>
                  <option value="Gara">Gara</option>
                  <option value="Trasferta">Trasferta</option>
                  <option value="Stage">Stage</option>
                </select>
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label style={fieldLabelStyle}>Gruppo di destinazione:</label>
                <select value={newActGroup} onChange={(e) => setNewActGroup(e.target.value)} style={selectDarkStyle}>
                  {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={fieldLabelStyle}>Data:</label>
                <input type="date" value={newActDate} onChange={(e) => setNewActDate(e.target.value)} style={inputStyle} />
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="submit" style={{ ...actionBtnCyan, flex: 1, padding: '12px' }}>Crea</button>
                <button type="button" onClick={() => setShowNewActivityModal(false)} style={{ ...controlBtn, flex: 1, padding: '12px' }}>Annulla</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// --- STILI CSS-IN-JS ---
const sidebarStyle = { width: '230px', backgroundColor: '#0b1120', borderRight: '1px solid #141e33', padding: '24px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' };
const logoIconStyle = { width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#00d2ff', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '18px' };
const navBtnStyle = (active) => ({ width: '100%', textAlign: 'left', padding: '10px 14px', borderRadius: '6px', border: 'none', backgroundColor: active ? '#101d36' : 'transparent', color: active ? '#00d2ff' : '#889ebf', fontWeight: active ? 'bold' : 'normal', fontSize: '14px', cursor: 'pointer' });
const avatarStyle = { width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#1d2d4c', color: '#00d2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' };
const fieldLabelStyle = { display: 'block', fontSize: '12px', color: '#8b9bb4', marginBottom: '4px' };
const inputStyle = { width: '100%', boxSizing: 'border-box', height: '44px', padding: '10px 12px', borderRadius: '6px', border: '1px solid #1d2c4a', backgroundColor: '#0d1527', color: '#fff', fontSize: '14px', outline: 'none' };
const selectDarkStyle = { width: '100%', boxSizing: 'border-box', height: '44px', padding: '10px 12px', borderRadius: '6px', border: '1px solid #1d2c4a', backgroundColor: '#0d1527', color: '#fff', fontSize: '14px', outline: 'none' };
const primarySubmitBtn = { width: '100%', height: '48px', borderRadius: '6px', border: 'none', backgroundColor: '#00d2ff', color: '#000', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', transition: '0.15s' };
const actionBtnCyan = { padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: '#00d2ff', color: '#000', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' };
const controlBtn = { padding: '8px 12px', borderRadius: '4px', border: '1px solid #233454', backgroundColor: '#131e36', color: '#fff', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' };
const deleteBtnStyle = { padding: '4px 8px', borderRadius: '4px', border: '1px solid #4a1d24', backgroundColor: '#261217', color: '#ff4d4f', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' };
const statCardStyle = { backgroundColor: '#0e172a', border: '1px solid #1a2742', borderRadius: '8px', padding: '14px' };
const statIconBox = (bg) => ({ width: '32px', height: '32px', borderRadius: '6px', backgroundColor: bg + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px' });
const sectionBoxStyle = { backgroundColor: '#0e172a', border: '1px solid #1a2742', borderRadius: '8px', padding: '16px' };
const codeBoxStyle = { display: 'inline-block', marginTop: '4px', padding: '4px 8px', backgroundColor: '#132038', color: '#00d2ff', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' };
