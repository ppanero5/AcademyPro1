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
          <div style={{ display: 'flex
