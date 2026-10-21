import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

// Connessione a Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;

export default function App() {
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // --- STATO UTENTE E NAVIGAZIONE ---
  const [currentUser, setCurrentUser] = useState(null);
  const [authTab, setAuthTab] = useState('login');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [filterType, setFilterType] = useState('Tutte');

  // Form Auth
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  const [regName, setRegName] = useState('');
  const [regSurname, setRegSurname] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regInviteCode, setRegInviteCode] = useState('');
  const [regGroup, setRegGroup] = useState('Baby');

  // Codici Invito
  const inviteCodes = {
    coachPulcini: 'CO-PUL26',
    coachGrandi: 'CO26',
    athletePulcini: 'PUL26',
    athleteGrandi: 'AT26'
  };

  const pulciniCategories = ['Superbaby', 'Baby', 'Cuccioli'];
  const grandiCategories = ['Ragazzi', 'Allievi', 'Giovani', 'Master'];
  const allCategories = [...pulciniCategories, ...grandiCategories];

  // Dati sincronizzati dal Cloud
  const [members, setMembers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [videos, setVideos] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState({});

  // Nuova attività
  const [showNewActivityModal, setShowNewActivityModal] = useState(false);
  const [newActTitle, setNewActTitle] = useState('');
  const [newActType, setNewActType] = useState('Allenamento');
  const [newActGroup, setNewActGroup] = useState('Baby');
  const [newActDate, setNewActDate] = useState('');

  // Presenze
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceCategory, setAttendanceCategory] = useState('Baby');

  // Upload Video Cloudflare R2
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedRawFile, setSelectedRawFile] = useState(null);
  const [videoSpecialty, setVideoSpecialty] = useState('Slalom Gigante');
  const [videoDate, setVideoDate] = useState('');
  const [videoLocation, setVideoLocation] = useState('Bardonecchia');
  const [videoSlope, setVideoSlope] = useState('');
  const [videoTaggedAthleteId, setVideoTaggedAthleteId] = useState('');
  const [selectedVideoPlayer, setSelectedVideoPlayer] = useState(null);
  const [videoFilterAthlete, setVideoFilterAthlete] = useState('Tutti');

  // Telestrator
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawColor, setDrawColor] = useState('#00d2ff');

  // Modifica Admin
  const [editAdminEmail, setEditAdminEmail] = useState('');
  const [editAdminPassword, setEditAdminPassword] = useState('');

  useEffect(() => {
    setMounted(true);
    const checkViewport = () => setIsMobile(window.innerWidth < 768);
    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  // --- CARICAMENTO DATI REAL-TIME DA SUPABASE ---
  const fetchData = async () => {
    if (!supabase) return;

    // 1. Membri
    const { data: mems } = await supabase.from('club_members').select('*');
    if (mems) setMembers(mems);

    // 2. Attività
    const { data: acts } = await supabase.from('club_activities').select('*').order('date', { ascending: true });
    if (acts) setActivities(acts);

    // 3. Video
    const { data: vids } = await supabase.from('video_library').select('*').order('created_at', { ascending: false });
    if (vids) setVideos(vids);

    // 4. Presenze
    const { data: atts } = await supabase.from('daily_attendance').select('*');
    if (atts) {
      const map = {};
      atts.forEach(a => {
        if (!map[a.attendance_date]) map[a.attendance_date] = {};
        map[a.attendance_date][a.athlete_id] = a.is_present;
      });
      setAttendanceRecords(map);
    }
  };

  useEffect(() => {
    // Controllo login persistente
    try {
      let saved = localStorage.getItem('academy_user');
      if (!saved) {
        const match = document.cookie.match(new RegExp('(^| )academy_user=([^;]+)'));
        if (match) saved = decodeURIComponent(match[2]);
      }
      if (saved) setCurrentUser(JSON.parse(saved));
    } catch (e) {}

    fetchData();
  }, []);

  // --- LOGIN ---
  const handleLogin = (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    const cleanEmail = loginEmail.toLowerCase().trim();
    const user = members.find(m => m.email.toLowerCase() === cleanEmail);

    if (!user) {
      setAuthError('Nessun account trovato con questa email.');
      return;
    }

    if (user.password !== loginPassword) {
      setAuthError('Password errata.');
      return;
    }

    setCurrentUser(user);
    try {
      const uStr = JSON.stringify(user);
      localStorage.setItem('academy_user', uStr);
      document.cookie = `academy_user=${encodeURIComponent(uStr)}; path=/; max-age=31536000; SameSite=Lax`;
    } catch (e) {}
    setLoginPassword('');
  };

  // --- REGISTRAZIONE SU DATABASE SUPABASE ---
  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    if (!regName.trim() || !regSurname.trim() || !regEmail.trim() || !regPassword.trim() || !regInviteCode.trim()) {
      setAuthError('Compila tutti i campi.');
      return;
    }

    const cleanEmail = regEmail.toLowerCase().trim();
    const cleanCode = regInviteCode.trim().toUpperCase();

    let assignedRole = '';
    let assignedSector = '';

    if (cleanCode === inviteCodes.coachPulcini) { assignedRole = 'coach'; assignedSector = 'pulcini'; }
    else if (cleanCode === inviteCodes.coachGrandi) { assignedRole = 'coach'; assignedSector = 'grandi'; }
    else if (cleanCode === inviteCodes.athletePulcini) { assignedRole = 'athlete'; assignedSector = 'pulcini'; }
    else if (cleanCode === inviteCodes.athleteGrandi) { assignedRole = 'athlete'; assignedSector = 'grandi'; }
    else {
      setAuthError('Codice di invito non valido.');
      return;
    }

    let finalGroup = regGroup;
    if (assignedRole === 'athlete') {
      if (assignedSector === 'pulcini' && !pulciniCategories.includes(regGroup)) finalGroup = 'Baby';
      if (assignedSector === 'grandi' && !grandiCategories.includes(regGroup)) finalGroup = 'Ragazzi';
    } else {
      finalGroup = 'Tutti';
    }

    const newUser = {
      name: `${regName.trim()} ${regSurname.trim()}`,
      email: cleanEmail,
      password: regPassword,
      role: assignedRole,
      sector: assignedSector,
      category: finalGroup,
      club: 'Bardonecchia Ski Academy'
    };

    if (supabase) {
      const { data, error } = await supabase.from('club_members').insert([newUser]).select();
      if (error) {
        setAuthError('Errore durante la registrazione: email già utilizzata.');
        return;
      }
      setMembers([...members, data[0]]);
    }

    setRegName('');
    setRegSurname('');
    setRegEmail('');
    setRegPassword('');
    setRegInviteCode('');
    setLoginEmail(cleanEmail);
    setAuthSuccess('Registrazione completata con successo! Ora accedi.');
    setAuthTab('login');
  };

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

  // --- PRESENZE REAL-TIME ---
  const toggleAttendance = async (athleteId) => {
    const dayRecords = attendanceRecords[attendanceDate] || {};
    const newStatus = !dayRecords[athleteId];

    if (supabase) {
      await supabase.from('daily_attendance').upsert({
        attendance_date: attendanceDate,
        category: attendanceCategory,
        athlete_id: athleteId,
        is_present: newStatus
      }, { onConflict: 'attendance_date,athlete_id' });
    }

    setAttendanceRecords({
      ...attendanceRecords,
      [attendanceDate]: {
        ...dayRecords,
        [athleteId]: newStatus
      }
    });
  };

  const markAllPresent = async (athletes) => {
    const dayRecords = { ...(attendanceRecords[attendanceDate] || {}) };
    const rows = athletes.map(a => {
      dayRecords[a.id] = true;
      return {
        attendance_date: attendanceDate,
        category: attendanceCategory,
        athlete_id: a.id,
        is_present: true
      };
    });

    if (supabase) {
      await supabase.from('daily_attendance').upsert(rows, { onConflict: 'attendance_date,athlete_id' });
    }

    setAttendanceRecords({
      ...attendanceRecords,
      [attendanceDate]: dayRecords
    });
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
    return { attended, absent, rate };
  };

  // --- CONFERMA ATTIVITÀ ---
  const handleConfirmActivity = async (activityId, response) => {
    const act = activities.find(a => a.id === activityId);
    if (!act) return;

    const newConf = { ...(act.confirmations || {}), [currentUser.id]: response };

    if (supabase) {
      await supabase.from('club_activities').update({ confirmations: newConf }).eq('id', activityId);
    }

    setActivities(activities.map(a => a.id === activityId ? { ...a, confirmations: newConf } : a));
  };

 // --- UPLOAD VIDEO DIRETTO SU CLOUDFLARE R2 TRAMITE PRESIGNED URL ---
  const handleUploadToCloudflare = async (e) => {
    e.preventDefault();
    if (!selectedRawFile) return;

    setUploading(true);
    try {
      // 1. Chiediamo a Vercel l'URL autorizzato per Cloudflare
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: selectedRawFile.name || 'video.mp4',
          contentType: selectedRawFile.type || 'video/mp4'
        })
      });

      if (!res.ok) {
        throw new Error('Impossibile ottenere autorizzazione da Vercel');
      }

      const { uploadUrl, publicUrl } = await res.json();
      if (!uploadUrl) throw new Error('Link upload mancante');

      // 2. Inviamo il file video DIRETTAMENTE a Cloudflare R2 (nessun limite di dimensione)
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': selectedRawFile.type || 'video/mp4'
        },
        body: selectedRawFile
      });

      if (!uploadRes.ok) {
        throw new Error('Errore durante il trasferimento del video su Cloudflare');
      }

      const taggedAthlete = members.find(m => m.id === videoTaggedAthleteId);

      const newVideo = {
        video_url: publicUrl,
        specialty: videoSpecialty,
        date: videoDate,
        location: videoLocation || 'Bardonecchia',
        slope: videoSlope || 'Pista Standard',
        athlete_id: videoTaggedAthleteId,
        athlete_name: taggedAthlete ? taggedAthlete.name : 'Non Taggato',
        athlete_group: taggedAthlete ? taggedAthlete.category : 'Generale',
        uploaded_by: currentUser.name
      };

      // 3. Salvataggio metadati nel database Supabase
      if (supabase) {
        const { data, error: sbError } = await supabase.from('video_library').insert([newVideo]).select();
        if (sbError) throw sbError;
        if (data) setVideos([data[0], ...videos]);
      }

      setShowUploadModal(false);
      setSelectedRawFile(null);
      alert('Video caricato con successo!');
    } catch (err) {
      console.error(err);
      alert(`Errore caricamento: ${err.message || 'Verifica le credenziali R2 o la connessione'}`);
    } finally {
      setUploading(false);
    }
  };

  const deleteVideo = async (id) => {
    if (confirm('Vuoi cancellare questo video?')) {
      if (supabase) await supabase.from('video_library').delete().eq('id', id);
      setVideos(videos.filter(v => v.id !== id));
      if (selectedVideoPlayer?.id === id) setSelectedVideoPlayer(null);
    }
  };

  // Telestrator Drawing
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

  const handleMoveCategory = async (athleteId, newCat) => {
    if (supabase) {
      await supabase.from('club_members').update({ category: newCat }).eq('id', athleteId);
    }
    setMembers(members.map(m => m.id === athleteId ? { ...m, category: newCat } : m));
  };

  const deleteMember = async (id) => {
    if (confirm('Eliminare definitivamente questo utente?')) {
      if (supabase) await supabase.from('club_members').delete().eq('id', id);
      setMembers(members.filter(m => m.id !== id));
    }
  };

  const deleteActivity = async (id) => {
    if (confirm('Eliminare questa attività?')) {
      if (supabase) await supabase.from('club_activities').delete().eq('id', id);
      setActivities(activities.filter(a => a.id !== id));
    }
  };

  const handleCreateActivity = async (e) => {
    e.preventDefault();
    if (!newActTitle) return;

    const isPulc = pulciniCategories.includes(newActGroup);
    const newAct = {
      title: newActTitle,
      type: newActType,
      sector: isPulc ? 'pulcini' : 'grandi',
      date: newActDate || new Date().toISOString().split('T')[0],
      time: '09:00 - 12:30',
      target_group: newActGroup,
      confirmations: {}
    };

    if (supabase) {
      const { data } = await supabase.from('club_activities').insert([newAct]).select();
      if (data) setActivities([...activities, data[0]]);
    }

    setShowNewActivityModal(false);
    setNewActTitle('');
  };

  const handleUpdateAdminCredentials = async (e) => {
    e.preventDefault();
    if (supabase) {
      await supabase.from('club_members').update({
        email: editAdminEmail || currentUser.email,
        password: editAdminPassword || currentUser.password
      }).eq('role', 'superadmin');
    }
    const updated = {
      ...currentUser,
      email: editAdminEmail || currentUser.email,
      password: editAdminPassword || currentUser.password
    };
    setCurrentUser(updated);
    try {
      localStorage.setItem('academy_user', JSON.stringify(updated));
    } catch (e) {}
    alert('Credenziali salvate!');
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

        <div style={{ flex: 1, backgroundColor: '#090e1a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '20px 16px 40px' : '40px' }}>
          <div style={{ width: '100%', maxWidth: '380px' }}>
            <div style={{ display: 'flex', borderBottom: '2px solid #1a2742', marginBottom: '20px' }}>
              <button
                type="button"
                onClick={() => { setAuthTab('login'); setAuthError(''); setAuthSuccess(''); }}
                style={{ flex: 1, padding: '12px', background: 'none', border: 'none', borderBottom: authTab === 'login' ? '3px solid #00d2ff' : '3px solid transparent', color: authTab === 'login' ? '#00d2ff' : '#6d83a7', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Accedi
              </button>
              <button
                type="button"
                onClick={() => { setAuthTab('register'); setAuthError(''); setAuthSuccess(''); }}
                style={{ flex: 1, padding: '12px', background: 'none', border: 'none', borderBottom: authTab === 'register' ? '3px solid #00d2ff' : '3px solid transparent', color: authTab === 'register' ? '#00d2ff' : '#6d83a7', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Registrati
              </button>
            </div>

            {authError && <div style={{ backgroundColor: '#2d1518', border: '1px solid #742a2a', color: '#ff6b6b', padding: '10px', borderRadius: '6px', fontSize: '13px', marginBottom: '16px' }}>{authError}</div>}
            {authSuccess && <div style={{ backgroundColor: '#132e27', border: '1px solid #1e5c4a', color: '#06d6a0', padding: '10px', borderRadius: '6px', fontSize: '13px', marginBottom: '16px' }}>{authSuccess}</div>}

            {authTab === 'login' && (
              <form onSubmit={handleLogin}>
                <div style={{ marginBottom: '14px' }}>
                  <label style={fieldLabelStyle}>Email</label>
                  <input type="email" required placeholder="tua@email.it" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} style={inputStyle} />
                </div>
                <div style={{ marginBottom: '22px' }}>
                  <label style={fieldLabelStyle}>Password</label>
                  <input type="password" required placeholder="••••••••••••" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} style={inputStyle} />
                </div>
                <button type="submit" style={primarySubmitBtn}>Accedi al Club</button>
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
                  <label style={{ ...fieldLabelStyle, color: '#00d2ff', fontWeight: 'bold' }}>Codice di invito</label>
                  <input required placeholder="Inserisci codice..." value={regInviteCode} onChange={(e) => setRegInviteCode(e.target.value)} style={{ ...inputStyle, border: '1px solid #00d2ff', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }} />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={fieldLabelStyle}>Categoria (Atleti)</label>
                  <select value={regGroup} onChange={(e) => setRegGroup(e.target.value)} style={selectDarkStyle}>
                    {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <button type="submit" style={primarySubmitBtn}>Completa Registrazione</button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  const filteredVideos = videos.filter(v => {
    if (isAthlete) return v.athlete_id === currentUser.id;
    if (videoFilterAthlete === 'Tutti') return true;
    return v.athlete_id === videoFilterAthlete;
  });

  const visibleActivities = activities.filter(a => {
    if (isSuperAdmin) return true;
    if (isAthlete) return a.target_group === currentUser.category || a.target_group === 'Tutti';
    return true;
  });

  const currentAttendanceAthletes = members
    .filter(m => m.role === 'athlete' && m.category === attendanceCategory)
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', minHeight: '100vh', backgroundColor: '#090e1a', color: '#fff', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
      
      {/* HEADER MOBILE */}
      {isMobile ? (
        <header style={{ position: 'sticky', top: 0, zIndex: 900, backgroundColor: '#0b1120', borderBottom: '1px solid #162238', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ ...logoIconStyle, width: '28px', height: '28px', fontSize: '15px' }}>M</div>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '14px', lineHeight: 1.1 }}>AcademyPro</div>
              <div style={{ fontSize: '10px', color: '#7e92b3' }}>Bardonecchia Ski</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: '#00d2ff', backgroundColor: '#13233d', padding: '3px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
              {isSuperAdmin ? 'Admin' : isCoach ? `Coach ${currentUser.sector}` : currentUser.category}
            </span>
            <button onClick={logout} style={{ background: 'none', border: 'none', color: '#ff4d4f', fontSize: '13px', padding: '4px', cursor: 'pointer' }}>🚪</button>
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
              <button onClick={() => setActiveTab('dashboard')} style={navBtnStyle(activeTab === 'dashboard')}>📊 Dashboard</button>
              <button onClick={() => setActiveTab('programmazione')} style={navBtnStyle(activeTab === 'programmazione')}>📅 Programmazione</button>
              <button onClick={() => setActiveTab('presenze')} style={navBtnStyle(activeTab === 'presenze')}>📋 Presenze & Statistiche</button>
              <button onClick={() => setActiveTab('video')} style={navBtnStyle(activeTab === 'video')}>🎞️ Libreria Video</button>
              <button onClick={() => setActiveTab('atleti')} style={navBtnStyle(activeTab === 'atleti')}>👥 Atleti</button>
              {!isAthlete && <button onClick={() => setActiveTab('club')} style={navBtnStyle(activeTab === 'club')}>⚙️ Gestione Club</button>}
              {isSuperAdmin && <button onClick={() => setActiveTab('admin')} style={navBtnStyle(activeTab === 'admin')}>🛡️ Super Admin</button>}
            </nav>
          </div>

          <div style={{ borderTop: '1px solid #162238', paddingTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <div style={avatarStyle}>{currentUser.name.substring(0, 2).toUpperCase()}</div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '13px', fontWeight: 'bold' }}>{currentUser.name}</div>
                <div style={{ fontSize: '11px', color: '#6882a9', textTransform: 'capitalize' }}>
                  {isSuperAdmin ? 'Super Admin' : isCoach ? `Coach (${currentUser.sector})` : `Atleta (${currentUser.category})`}
                </div>
              </div>
            </div>
            <button onClick={logout} style={{ background: 'none', border: 'none', color: '#e63946', fontSize: '12px', cursor: 'pointer', padding: 0 }}>🚪 Esci</button>
          </div>
        </aside>
      )}

      {/* CONTENUTO CENTRALE */}
      <main style={{ flex: 1, padding: isMobile ? '16px 14px 90px' : '24px 32px', overflowY: 'auto' }}>
        
        {/* DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div>
            <div style={{ fontSize: '11px', color: '#5f759c', letterSpacing: '1px', textTransform: 'uppercase' }}>{currentUser.role.toUpperCase()} • 2026/2027</div>
            <h1 style={{ fontSize: isMobile ? '22px' : '28px', margin: '4px 0 16px 0' }}>Ciao {currentUser.name.split(' ')[0]} 👋</h1>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: '10px', marginBottom: '24px' }}>
              <div style={statCardStyle}>
                <div style={statIconBox('#00b4d8')}>📅</div>
                <div style={{ fontSize: '22px', fontWeight: 'bold', marginTop: '6px' }}>{visibleActivities.length}</div>
                <div style={{ fontSize: '10px', color: '#6d83a7' }}>ATTIVITÀ</div>
              </div>
              <div style={statCardStyle}>
                <div style={statIconBox('#3a86ff')}>🎞️</div>
                <div style={{ fontSize: '22px', fontWeight: 'bold', marginTop: '6px' }}>{filteredVideos.length}</div>
                <div style={{ fontSize: '10px', color: '#6d83a7' }}>VIDEO R2</div>
              </div>
              <div style={statCardStyle}>
                <div style={statIconBox('#8338ec')}>👥</div>
                <div style={{ fontSize: '22px', fontWeight: 'bold', marginTop: '6px' }}>{members.filter(m => m.role === 'athlete').length}</div>
                <div style={{ fontSize: '10px', color: '#6d83a7' }}>ATLETI</div>
              </div>
              <div style={statCardStyle}>
                <div style={statIconBox('#06d6a0')}>✅</div>
                <div style={{ fontSize: '22px', fontWeight: 'bold', marginTop: '6px' }}>{Object.keys(attendanceRecords).length}</div>
                <div style={{ fontSize: '10px', color: '#6d83a7' }}>SESSIONI REG.</div>
              </div>
            </div>

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
                      <div style={{ fontSize: '11px', color: '#7c94ba', marginTop: '2px' }}>{a.date} • {a.target_group}</div>
                    </div>
                    {isSuperAdmin && <button onClick={() => deleteActivity(a.id)} style={deleteBtnStyle}>🗑️</button>}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* PROGRAMMAZIONE */}
        {activeTab === 'programmazione' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h1 style={{ fontSize: isMobile ? '20px' : '24px', margin: 0 }}>Programmazione</h1>
                <p style={{ margin: '2px 0 0', color: '#748cae', fontSize: '12px' }}>Conferma la tua presenza agli allenamenti e alle gare.</p>
              </div>
              {(isSuperAdmin || isCoach) && (
                <button onClick={() => setShowNewActivityModal(true)} style={{ ...actionBtnCyan, padding: isMobile ? '8px 12px' : '8px 16px', fontSize: '12px' }}>+ Nuova</button>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {visibleActivities.map(a => {
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
                        <div style={{ fontSize: '11px', color: '#728aa9', marginTop: '4px' }}>📅 {a.date} • 🕒 {a.time} • Gruppo: <strong>{a.target_group}</strong></div>
                      </div>
                      {isSuperAdmin && <button onClick={() => deleteActivity(a.id)} style={deleteBtnStyle}>🗑️</button>}
                    </div>

                    {isAthlete && (
                      <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #162238', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '12px', color: '#889dbf' }}>La tua presenza:</span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => handleConfirmActivity(a.id, 'yes')} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #06d6a0', backgroundColor: myStatus === 'yes' ? '#06d6a0' : 'transparent', color: myStatus === 'yes' ? '#000' : '#06d6a0', fontSize: '12px', fontWeight: 'bold' }}>✓ Ci sarò</button>
                          <button onClick={() => handleConfirmActivity(a.id, 'no')} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #ff4d4f', backgroundColor: myStatus === 'no' ? '#ff4d4f' : 'transparent', color: myStatus === 'no' ? '#fff' : '#ff4d4f', fontSize: '12px', fontWeight: 'bold' }}>✗ Non ci sarò</button>
                        </div>
                      </div>
                    )}

                    {(isCoach || isSuperAdmin) && (
                      <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #162238', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
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

        {/* PRESENZE & STATISTICHE */}
        {activeTab === 'presenze' && (
          <div>
            <div style={{ marginBottom: '14px' }}>
              <h1 style={{ fontSize: isMobile ? '20px' : '24px', margin: 0 }}>Presenze & Statistiche</h1>
              <p style={{ margin: '2px 0 0', color: '#748cae', fontSize: '12px' }}>Sincronizzato in Cloud per tutti i coach.</p>
            </div>

            <div style={{ backgroundColor: '#0e172a', border: '1px solid #1b2844', borderRadius: '8px', padding: '12px', marginBottom: '16px', display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)', gap: '10px' }}>
              <div>
                <label style={fieldLabelStyle}>Data:</label>
                <input type="date" value={attendanceDate} onChange={(e) => setAttendanceDate(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={fieldLabelStyle}>Categoria:</label>
                <select value={attendanceCategory} onChange={(e) => setAttendanceCategory(e.target.value)} style={selectDarkStyle}>
                  {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              {canManageCategory(attendanceCategory) && (
                <div style={{ display: 'flex', alignItems: 'flex-end', gridColumn: isMobile ? 'span 2' : 'auto' }}>
                  <button onClick={() => markAllPresent(currentAttendanceAthletes)} style={{ ...actionBtnCyan, width: '100%', height: '44px' }}>✓ Segna tutti Presenti</button>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {currentAttendanceAthletes.map(a => {
                const isPres = !!(attendanceRecords[attendanceDate] && attendanceRecords[attendanceDate][a.id]);
                const stats = getAthleteStats(a.id);
                const canEdit = canManageCategory(attendanceCategory);

                return (
                  <div key={a.id} style={{ backgroundColor: '#0f172a', border: '1px solid #192642', borderRadius: '8px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div onClick={() => canEdit && toggleAttendance(a.id)} style={{ width: '28px', height: '28px', borderRadius: '6px', border: '2px solid', borderColor: isPres ? '#06d6a0' : '#4b5563', backgroundColor: isPres ? '#06d6a0' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 'bold', fontSize: '16px', cursor: canEdit ? 'pointer' : 'default' }}>
                        {isPres ? '✓' : ''}
                      </div>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{a.name}</div>
                        <div style={{ fontSize: '11px', color: '#6882a9' }}>Presenze: <strong style={{ color: '#06d6a0' }}>{stats.attended}</strong> | Assenze: <strong style={{ color: '#ff4d4f' }}>{stats.absent}</strong></div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '14px', fontWeight: 'bold', color: stats.rate >= 80 ? '#06d6a0' : '#f59e0b' }}>{stats.rate}%</span>
                      <div style={{ fontSize: '10px', color: '#6882a9' }}>Frequenza</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* LIBRERIA VIDEO CLOUDFLARE R2 */}
        {activeTab === 'video' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h1 style={{ fontSize: isMobile ? '20px' : '24px', margin: 0 }}>Libreria Video R2</h1>
                <p style={{ margin: '2px 0 0', color: '#748cae', fontSize: '12px' }}>Video salvati permanentemente nel Cloud.</p>
              </div>

              {!isAthlete && (
                <label style={{ ...actionBtnCyan, padding: isMobile ? '8px 12px' : '8px 16px', fontSize: '12px' }}>
                  📹 Carica su R2
                  <input type="file" accept="video/*" onChange={(e) => {
                    if (e.target.files[0]) {
                      setSelectedRawFile(e.target.files[0]);
                      setVideoDate(new Date().toISOString().split('T')[0]);
                      setShowUploadModal(true);
                    }
                  }} style={{ display: 'none' }} />
                </label>
              )}
            </div>

            {!isAthlete && (
              <div style={{ marginBottom: '14px' }}>
                <select value={videoFilterAthlete} onChange={(e) => setVideoFilterAthlete(e.target.value)} style={{ ...selectDarkStyle, width: '100%', maxWidth: '280px' }}>
                  <option value="Tutti">📁 Tutti gli Atleti</option>
                  {members.filter(m => m.role === 'athlete').map(a => <option key={a.id} value={a.id}>{a.name} ({a.category})</option>)}
                </select>
              </div>
            )}

            {filteredVideos.length === 0 ? (
              <div style={{ backgroundColor: '#0e172a', border: '1px dashed #1e2c47', borderRadius: '8px', padding: '30px', textAlign: 'center', color: '#6882a9', fontSize: '13px' }}>
                Nessun video presente su Cloudflare R2.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(210px, 1fr))', gap: '10px' }}>
                {filteredVideos.map(v => (
                  <div key={v.id} style={{ backgroundColor: '#0e172a', border: '1px solid #1a2742', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <div onClick={() => setSelectedVideoPlayer(v)} style={{ position: 'relative', width: '100%', height: isMobile ? '95px' : '120px', backgroundColor: '#000', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <video src={v.video_url} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }} preload="metadata" />
                      <div style={{ position: 'absolute', width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(0, 210, 255, 0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontSize: '14px', fontWeight: 'bold' }}>▶</div>
                      <span style={{ position: 'absolute', bottom: '4px', right: '4px', fontSize: '9px', backgroundColor: '#000', padding: '1px 4px', borderRadius: '3px', color: '#00d2ff' }}>{v.specialty}</span>
                    </div>

                    <div style={{ padding: '8px' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>👤 {v.athlete_name}</div>
                      <div style={{ fontSize: '10px', color: '#748cae', marginTop: '2px' }}>📍 {v.location}</div>
                      <div style={{ fontSize: '10px', color: '#556c8f', marginTop: '2px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>📅 {v.date}</span>
                        {!isAthlete && <button onClick={(e) => { e.stopPropagation(); deleteVideo(v.id); }} style={{ background: 'none', border: 'none', color: '#ff4d4f', cursor: 'pointer', padding: 0, fontSize: '11px' }}>🗑️</button>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ATLETI */}
        {activeTab === 'atleti' && (
          <div>
            <h1 style={{ fontSize: isMobile ? '20px' : '24px', margin: '0 0 4px 0' }}>Atleti del Club</h1>
            <p style={{ margin: '0 0 16px 0', color: '#748cae', fontSize: '12px' }}>Sincronizzati dal database Supabase.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {allCategories.map(catName => {
                const groupAthletes = members.filter(m => m.role === 'athlete' && m.category === catName);
                const canManageThis = canManageCategory(catName);

                return (
                  <div key={catName} style={{ backgroundColor: '#0e172a', border: '1px solid #1b2844', borderRadius: '8px', padding: '12px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '8px', color: '#00d2ff' }}>{catName} ({groupAthletes.length})</div>

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
                                <select value={a.category} onChange={(e) => handleMoveCategory(a.id, e.target.value)} style={{ backgroundColor: '#090e1a', color: '#00d2ff', border: '1px solid #1f3357', borderRadius: '4px', padding: '3px 4px', fontSize: '11px' }}>
                                  {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                              )}
                              {isSuperAdmin && <button onClick={() => deleteMember(a.id)} style={{ background: 'none', border: 'none', color: '#e63946', cursor: 'pointer', fontSize: '12px' }}>🗑️</button>}
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

        {/* GESTIONE CLUB */}
        {activeTab === 'club' && !isAthlete && (
          <div>
            <h1 style={{ fontSize: isMobile ? '20px' : '24px', margin: '0 0 4px 0' }}>Gestione Club</h1>
            <p style={{ margin: '0 0 16px 0', color: '#748cae', fontSize: '12px' }}>Bardonecchia Ski Academy ({members.length} registrati)</p>

            <div style={{ backgroundColor: '#0e172a', border: '1px solid #1b2844', borderRadius: '8px', padding: '14px', marginBottom: '18px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '8px' }}>Codici Invito Attuali</div>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: '10px' }}>
                <div><span style={{ fontSize: '10px', color: '#748cae', display: 'block' }}>COACH PULCINI</span><code style={codeBoxStyle}>{inviteCodes.coachPulcini}</code></div>
                <div><span style={{ fontSize: '10px', color: '#748cae', display: 'block' }}>COACH GRANDI</span><code style={codeBoxStyle}>{inviteCodes.coachGrandi}</code></div>
                <div><span style={{ fontSize: '10px', color: '#748cae', display: 'block' }}>ATLETI PULCINI</span><code style={codeBoxStyle}>{inviteCodes.athletePulcini}</code></div>
                <div><span style={{ fontSize: '10px', color: '#748cae', display: 'block' }}>ATLETI GRANDI</span><code style={codeBoxStyle}>{inviteCodes.athleteGrandi}</code></div>
              </div>
            </div>

            <h3 style={{ fontSize: '14px', marginBottom: '10px' }}>Membri Registrati</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {members.map(m => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0e172a', padding: '10px 12px', borderRadius: '6px', border: '1px solid #1b2844' }}>
                  <div style={{ overflow: 'hidden', paddingRight: '8px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{m.name}</div>
                    <div style={{ fontSize: '11px', color: '#6882a9' }}>{m.email}</div>
                  </div>
                  <span style={{ fontSize: '11px', backgroundColor: '#13233d', padding: '2px 6px', borderRadius: '4px', color: '#00d2ff' }}>{m.role === 'superadmin' ? 'Admin' : m.role === 'coach' ? `Coach (${m.sector})` : m.category}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SUPER ADMIN RECUPERO CREDENZIALI */}
        {activeTab === 'admin' && isSuperAdmin && (
          <div>
            <h1 style={{ fontSize: isMobile ? '20px' : '24px', margin: '0 0 4px 0' }}>Super Admin</h1>
            <p style={{ margin: '0 0 16px 0', color: '#748cae', fontSize: '12px' }}>Recupero password centralizzato da Database.</p>

            <div style={{ backgroundColor: '#0e172a', border: '1px solid #1b2844', borderRadius: '8px', padding: '14px', marginBottom: '20px' }}>
              <h3 style={{ marginTop: 0, fontSize: '14px', color: '#00d2ff' }}>🔑 Registro Utenti & Password</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {members.map(m => (
                  <div key={m.id} style={{ backgroundColor: '#131e36', padding: '10px 12px', borderRadius: '6px', border: '1px solid #1e2c47' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '13px' }}>{m.name}</span>
                      <span style={{ fontSize: '11px', color: '#00d2ff' }}>{m.role} • {m.category}</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#7e92b3', marginTop: '3px' }}>✉️ {m.email}</div>
                    <div style={{ fontSize: '12px', color: '#06d6a0', marginTop: '4px' }}>Password: <strong style={{ fontFamily: 'monospace', backgroundColor: '#090e1a', padding: '1px 6px', borderRadius: '3px' }}>{m.password}</strong></div>
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
                <button type="submit" style={actionBtnCyan}>Salva su Database</button>
              </form>
            </div>
          </div>
        )}

      </main>

      {/* BOTTOM BAR MOBILE */}
      {isMobile && (
        <nav style={{ position: 'fixed', bottom: 0, left: 0, width: '100%', height: '64px', backgroundColor: '#0b1120', borderTop: '1px solid #162238', display: 'flex', justifyContent: 'space-around', alignItems: 'center', zIndex: 1000, paddingBottom: 'env(safe-area-inset-bottom)' }}>
          {[
            { id: 'dashboard', label: 'Home', icon: '📊' },
            { id: 'programmazione', label: 'Programma', icon: '📅' },
            { id: 'presenze', label: 'Presenze', icon: '📋' },
            { id: 'video', label: 'Video', icon: '🎞️' },
            { id: 'atleti', label: 'Atleti', icon: '👥' },
            ...(!isAthlete ? [{ id: 'club', label: 'Club', icon: '⚙️' }] : []),
            ...(isSuperAdmin ? [{ id: 'admin', label: 'Admin', icon: '🛡️' }] : []),
          ].map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} style={{ background: 'none', border: 'none', color: activeTab === item.id ? '#00d2ff' : '#6882a9', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', fontSize: '10px', fontWeight: activeTab === item.id ? 'bold' : 'normal', cursor: 'pointer', padding: '4px' }}>
              <span style={{ fontSize: '18px' }}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      )}

      {/* MODALE DI CARICAMENTO VIDEO CON SPEDIZIONE A CLOUDFLARE R2 */}
      {showUploadModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: '#0e172a', border: '1px solid #1b2844', padding: '20px', borderRadius: isMobile ? '16px 16px 0 0' : '8px', width: '100%', maxWidth: '380px' }}>
            <h3 style={{ margin: '0 0 14px 0', fontSize: '16px', color: '#00d2ff' }}>📁 Carica su Cloudflare R2</h3>
            <form onSubmit={handleUploadToCloudflare}>
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
                  {members.filter(m => m.role === 'athlete').map(a => <option key={a.id} value={a.id}>{a.name} ({a.category})</option>)}
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
                <button type="submit" disabled={uploading} style={{ ...actionBtnCyan, flex: 1, padding: '12px' }}>
                  {uploading ? 'Caricamento R2 in corso...' : 'Invia a Cloudflare R2'}
                </button>
                <button type="button" disabled={uploading} onClick={() => { setShowUploadModal(false); setSelectedRawFile(null); }} style={{ ...controlBtn, flex: 1, padding: '12px' }}>Annulla</button>
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
              <div style={{ fontSize: '13px', fontWeight: 'bold' }}>{selectedVideoPlayer.specialty} • {selectedVideoPlayer.athlete_name}</div>
              <button onClick={() => setSelectedVideoPlayer(null)} style={{ background: 'none', border: 'none', color: '#ff4d4f', fontSize: '18px', cursor: 'pointer' }}>✖</button>
            </div>

            <div style={{ position: 'relative', width: '100%', maxHeight: isMobile ? '55vh' : '480px', backgroundColor: '#000', borderRadius: '6px', overflow: 'hidden' }}>
              <video
                ref={videoRef}
                src={selectedVideoPlayer.video_url}
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
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', touchAction: 'none', cursor: (!isPlaying && !isAthlete) ? 'crosshair' : 'default', pointerEvents: (!isPlaying && !isAthlete) ? 'auto' : 'none' }}
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
                  <button key={rate} onClick={() => { if (videoRef.current) videoRef.current.playbackRate = rate; }} style={{ ...controlBtn, flex: isMobile ? 1 : 'none', padding: '8px' }}>{rate}×</button>
                ))}
              </div>

              {!isAthlete && (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '100%', marginTop: '6px', borderTop: '1px solid #162238', paddingTop: '8px' }}>
                  <label style={{ fontSize: '11px', color: '#748cae' }}>Colore:</label>
                  <input type="color" value={drawColor} onChange={(e) => setDrawColor(e.target.value)} style={{ background: 'none', border: 'none', width: '28px', height: '24px', cursor: 'pointer' }} />
                  <button onClick={() => { if (canvasRef.current) canvasRef.current.getContext('2d').clearRect(0, 0, canvasRef.current.width, canvasRef.current.height); }} style={{ ...controlBtn, backgroundColor: '#2d1518', color: '#ff4d4f', border: '1px solid #5a1c24', padding: '6px 10px' }}>Cancella Tratti</button>
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

// Stili
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
