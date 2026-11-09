import React, { useState, useEffect, useRef } from 'react';
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

const CATEGORIES_PICCOLI = ['Superbaby', 'Baby', 'Cuccioli'];
const CATEGORIES_GRANDI = ['Ragazzi', 'Allievi', 'Giovani', 'Senior', 'Master'];
const ALL_CATEGORIES = [...CATEGORIES_PICCOLI, ...CATEGORIES_GRANDI];

// CODICI DI REGISTRAZIONE OBBLIGATORI PER GLI ALLENATORI
const PIN_COACH_PICCOLI = 'COACH-PICCOLI';
const PIN_COACH_GRANDI = 'COACH-GRANDI';

// --- COMPONENTE PLAYER VIDEO VIOLA (CONTROLLI NATIVI FUNZIONANTI + DISEGNO IN PAUSA) ---
const VideoAnalysisPlayer = ({ video, currentUser, onDeleteVideo }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isPaused, setIsPaused] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawColor, setDrawColor] = useState('#ef4444'); // Rosso default

  // Sincronizza le dimensioni del Canvas con quelle reali del Video
  const syncCanvasSize = () => {
    const v = videoRef.current;
    const c = canvasRef.current;
    if (v && c) {
      c.width = v.clientWidth || 300;
      c.height = v.clientHeight || 200;
    }
  };

  useEffect(() => {
    window.addEventListener('resize', syncCanvasSize);
    return () => window.removeEventListener('resize', syncCanvasSize);
  }, []);

  const changeSpeed = (rate) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  };

  const stepFrame = (seconds) => {
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPaused(true);
      videoRef.current.currentTime += seconds;
    }
  };

  const clearCanvas = () => {
    const c = canvasRef.current;
    if (c) {
      const ctx = c.getContext('2d');
      ctx.clearRect(0, 0, c.width, c.height);
    }
  };

  // LOGICA DISEGNO (TOUCH + MOUSE)
  const getCoordinates = (e) => {
    const c = canvasRef.current;
    if (!c) return { x: 0, y: 0 };
    const rect = c.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    if (!isPaused) return; // Disegna solo a video in pausa
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    const { x, y } = getCoordinates(e);

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = drawColor;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing || !isPaused) return;
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    const { x, y } = getCoordinates(e);

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  return (
    <div style={styles.videoCard}>
      <div style={{ position: 'relative', width: '100%', backgroundColor: '#000000' }}>
        <video
          ref={videoRef}
          src={video.video_url}
          controls
          style={styles.videoPlayer}
          preload="metadata"
          onLoadedMetadata={syncCanvasSize}
          onPlay={() => setIsPaused(false)}
          onPause={() => setIsPaused(true)}
        />
        {/* CANVAS OVERLAY PER DISEGNO: ATTIVO SOLO QUANDO IL VIDEO È IN PAUSA PER NON BLOCCARE I TASTI NATIVI DEL VIDEO */}
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: 'calc(100% - 40px)', // Lascia scoperta la barra dei controlli del video
            pointerEvents: isPaused ? 'auto' : 'none',
            touchAction: 'none',
            cursor: isPaused ? 'crosshair' : 'default'
          }}
        />
      </div>

      <div style={styles.videoMeta}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={styles.badgeSpecialty}>{video.specialty}</span>
          {currentUser.role !== 'athlete' && (
            <button onClick={() => onDeleteVideo(video.id)} style={styles.btnDeleteInline}>🗑️ Elimina</button>
          )}
        </div>

        <h4 style={styles.videoTitle}>{video.athlete_name}</h4>
        <p style={styles.videoSub}>📍 {video.location} - {video.slope}</p>
        <p style={styles.videoDate}>📅 {video.date} | Coach: {video.uploaded_by}</p>

        {/* CONTROLLI ANALISI CON PULSANTI IN STILE VIOLA ORIGINALE */}
        <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#6b21a8' }}>Velocità:</span>
            {[0.2, 0.5, 1, 1.5, 2].map(speed => (
              <button
                key={speed}
                onClick={() => changeSpeed(speed)}
                style={{
                  padding: '3px 8px',
                  fontSize: '11px',
                  borderRadius: '4px',
                  border: '1px solid #c084fc',
                  backgroundColor: playbackRate === speed ? '#7e22ce' : '#ffffff',
                  color: playbackRate === speed ? '#ffffff' : '#6b21a8',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                {speed}x
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => stepFrame(-0.04)} style={styles.btnPurpleFrame}>◀ Frame</button>
            <button onClick={() => stepFrame(0.04)} style={styles.btnPurpleFrame}>Frame ▶</button>

            <input
              type="color"
              value={drawColor}
              onChange={(e) => setDrawColor(e.target.value)}
              style={{ width: '28px', height: '28px', padding: 0, border: 'none', background: 'none', cursor: 'pointer' }}
              title="Colore Pennello Disegno"
            />
            <button onClick={clearCanvas} style={styles.btnClearCanvas}>🗑️ Cancella Disegno</button>
          </div>

          {isPaused && (
            <span style={{ fontSize: '11px', color: '#7e22ce', fontWeight: 'bold', fontStyle: 'italic', marginTop: '2px' }}>
              ✏️ Video in pausa: puoi disegnare direttamente sullo schermo!
            </span>
          )}
        </div>
      </div>
    </div>
  );
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

  // --- REGISTRAZIONE UTENTE ---
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState('athlete');
  const [regCategory, setRegCategory] = useState('Cuccioli');
  const [regCoachGroup, setRegCoachGroup] = useState('Piccoli');
  const [regPinCode, setRegPinCode] = useState('');

  // --- NAVIGAZIONE E MODALI ---
  const [activeTab, setActiveTab] = useState('videos');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showRegModal, setShowRegModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [modalAttendance, setModalAttendance] = useState({});
  const [expandedAthleteId, setExpandedAthleteId] = useState(null);
  const [editingTechMember, setEditingTechMember] = useState(null);

  // --- FORM NUOVA ATTIVITÀ & APPELLO DIRETTO ---
  const [actType, setActType] = useState('Allenamento');
  const [actSpecialty, setActSpecialty] = useState('Gigante');
  const [actDate, setActDate] = useState(new Date().toISOString().split('T')[0]);
  const [actNotes, setActNotes] = useState('');
  const [selectedCategories, setSelectedCategories] = useState(['Cuccioli']);

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

  // --- FORM SCHEDA TECNICA E CATEGORIA ATLETA ---
  const [techFormData, setTechFormData] = useState({
    category: 'Cuccioli',
    birth_date: '',
    height_cm: '',
    weight_kg: '',
    ski_gs_length: '',
    ski_sl_length: '',
    boot_size_mm: ''
  });

  // HELPER CATEGORIE E PERMESSI
  const isPiccoli = (cat) => CATEGORIES_PICCOLI.includes(cat);

  const canEditCategory = (category) => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin' || currentUser.role === 'superadmin') return true;
    if (currentUser.role === 'athlete') return false;
    if (!currentUser.coach_group || currentUser.coach_group === 'Tutti') return true;
    if (currentUser.coach_group === 'Piccoli' && isPiccoli(category)) return true;
    if (currentUser.coach_group === 'Grandi' && !isPiccoli(category)) return true;
    return false;
  };

  const isActivityVisibleForUser = (act) => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin' || currentUser.role === 'superadmin' || currentUser.coach_group === 'Tutti') return true;
    
    const catTarget = act.category || '';
    if (catTarget.includes('Tutti')) return true;

    if (currentUser.role === 'athlete') {
      return catTarget.includes(currentUser.category);
    }

    if (currentUser.coach_group === 'Piccoli') {
      return CATEGORIES_PICCOLI.some(c => catTarget.includes(c));
    }
    if (currentUser.coach_group === 'Grandi') {
      return CATEGORIES_GRANDI.some(c => catTarget.includes(c));
    }
    return true;
  };

  const reloadAttendanceLogs = async () => {
    if (!supabase) return;
    const { data: attData, error } = await supabase.from('attendance_history').select('*');
    if (!error && attData) setAttendanceLogs(attData);
  };

  const reloadMembers = async () => {
    if (!supabase) return;
    const { data: membersData } = await supabase.from('club_members').select('*');
    if (membersData) setMembers(membersData);
  };

  // 1. CARICAMENTO DATI
  useEffect(() => {
    const savedUser = localStorage.getItem('skiclub_user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Errore ripristino sessione:', e);
      }
    }

    if (!supabase) return;

    const fetchData = async () => {
      await reloadMembers();

      const { data: videoData } = await supabase.from('video_library').select('*').order('created_at', { ascending: false });
      if (videoData) setVideos(videoData);

      const { data: actData } = await supabase.from('daily_notes').select('*').order('created_at', { ascending: false });
      if (actData) setActivities(actData || []);

      await reloadAttendanceLogs();
    };

    fetchData();
  }, []);

  // SELEZIONE AUTOMATICA ATTIVITÀ DI OGGI
  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayAct = activities.find(a => a.date === todayStr && isActivityVisibleForUser(a));
    if (todayAct) {
      setSelectedActivityId(String(todayAct.id));
    }
  }, [activities, currentUser]);

  // AL CAMBIO ATTIVITÀ SELEZIONATA, CARICA LE PRESENZE UFFICIALI (SOLO QUELLE CON STATUS DEFINITO DALL'ALLENATORE)
  useEffect(() => {
    if (!selectedActivityId) {
      setAttendance({});
      return;
    }
    const act = activities.find(a => String(a.id) === String(selectedActivityId));
    if (!act) return;

    const existingLogs = attendanceLogs.filter(
      l => l.date === act.date && String(l.activity_id) === String(act.id) && l.status !== null
    );
    const newAttState = {};
    existingLogs.forEach(log => {
      newAttState[log.athlete_id] = log.status === 'present';
    });
    setAttendance(newAttState);
  }, [selectedActivityId, attendanceLogs, activities]);

  // 2. LOGIN / LOGOUT
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

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('skiclub_user');
  };

  // 3. REGISTRAZIONE UTENTE CON VERIFICA PIN PER ALLENATORI
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPassword) return;

    if (regRole === 'coach') {
      if (regCoachGroup === 'Piccoli' && regPinCode !== PIN_COACH_PICCOLI) {
        alert('Codice PIN non valido per Allenatore Gruppo Piccoli!');
        return;
      }
      if (regCoachGroup === 'Grandi' && regPinCode !== PIN_COACH_GRANDI) {
        alert('Codice PIN non valido per Allenatore Gruppo Grandi!');
        return;
      }
    }

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
        setRegPinCode('');
      }
    }
  };

  // 4. NUOVA ATTIVITÀ CON CATEGORIE MULTIPLE
  const handleCategoryToggle = (cat) => {
    if (selectedCategories.includes(cat)) {
      if (selectedCategories.length > 1) {
        setSelectedCategories(selectedCategories.filter(c => c !== cat));
      }
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  const handleCreateActivity = async (e) => {
    e.preventDefault();
    if (!supabase) return;
    if (selectedCategories.length === 0) {
      alert('Seleziona almeno una categoria!');
      return;
    }

    const catsString = selectedCategories.join(', ');
    const formattedCategory = `${actType} | ${actSpecialty} | ${catsString}`;

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
      setActNotes('');
      setSelectedActivityId(String(data[0].id));
      alert('Attività creata! Ora puoi fare l\'appello direttamente in questa pagina.');
    }
  };

  // 5. ELIMINAZIONI
  const handleDeleteActivity = async (actId) => {
    if (!confirm('Sei sicuro di voler eliminare questa attività e le sue presenze?')) return;
    if (!supabase) return;

    const actIdStr = String(actId);
    await supabase.from('attendance_history').delete().eq('activity_id', actIdStr);

    const { error } = await supabase.from('daily_notes').delete().eq('id', actId);
    if (error) {
      alert(`Errore eliminazione attività: ${error.message}`);
    } else {
      setActivities(activities.filter(a => a.id !== actId));
      if (String(selectedActivityId) === actIdStr) setSelectedActivityId('');
      await reloadAttendanceLogs();
      alert('Attività eliminata con successo.');
    }
  };

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

  // 6. SALVA PRESENZE UFFICIALI (ALLENATORE)
  const saveAttendanceForActivity = async (actObject, currentAttendanceState) => {
    if (!supabase || !actObject) return;

    const parts = actObject.category.split('|');
    const actTypeTag = parts[0] ? parts[0].trim() : 'Allenamento';
    const specialtyName = parts[1] ? parts[1].trim() : 'Generale';
    const targetCatsRaw = parts[2] ? parts[2].trim() : 'Tutti';
    const targetCatsArray = targetCatsRaw.split(',').map(c => c.trim());
    const actIdStr = String(actObject.id);

    const targetAthletes = members.filter(m => {
      if (m.role !== 'athlete') return false;
      if (targetCatsRaw.includes('Tutti')) return true;
      return targetCatsArray.includes(m.category);
    });

    try {
      const { error: delError } = await supabase
        .from('attendance_history')
        .delete()
        .eq('date', actObject.date)
        .eq('activity_id', actIdStr);

      if (delError) console.warn('Note eliminazione pregressa:', delError.message);

      const newEntries = targetAthletes.map(athlete => {
        const isPresent = !!currentAttendanceState[athlete.id];
        return {
          date: actObject.date,
          athlete_id: String(athlete.id),
          specialty: specialtyName,
          status: isPresent ? 'present' : 'absent',
          event_type: actTypeTag,
          activity_id: actIdStr
        };
      });

      if (newEntries.length > 0) {
        const { error: insError } = await supabase.from('attendance_history').insert(newEntries);
        if (insError) throw insError;
      }

      await reloadAttendanceLogs();
      alert('Presenze ufficiali salvate e grafici aggiornati!');
    } catch (err) {
      alert(`Impossibile salvare le presenze: ${err.message}`);
    }
  };

  // RISPOSTA ATLETA: AGGIORNA SOLO LA DISPONIBILITÀ (NON INFLUENZA I GRAFICI)
  const handleAthleteSelfAvailability = async (actObject, choice) => {
    if (!supabase || !currentUser || currentUser.role !== 'athlete') return;

    const actIdStr = String(actObject.id);

    try {
      const { data: existing } = await supabase
        .from('attendance_history')
        .select('*')
        .eq('activity_id', actIdStr)
        .eq('athlete_id', String(currentUser.id))
        .single();

      if (existing) {
        await supabase
          .from('attendance_history')
          .update({ availability: choice })
          .eq('id', existing.id);
      } else {
        const parts = actObject.category.split('|');
        await supabase.from('attendance_history').insert([{
          date: actObject.date,
          athlete_id: String(currentUser.id),
          specialty: parts[1] ? parts[1].trim() : 'Generale',
          status: null, // Nessun impatto sui grafici finché il coach non fa l'appello
          event_type: parts[0] ? parts[0].trim() : 'Allenamento',
          activity_id: actIdStr,
          availability: choice
        }]);
      }

      await reloadAttendanceLogs();
      alert(`Hai segnalato: ${choice === 'present' ? 'Ci sarò ✅' : 'Non ci sarò ❌'}`);
    } catch (err) {
      alert(`Errore salvataggio risposta: ${err.message}`);
    }
  };

  const handleSaveAttendance = () => {
    const selectedAct = activities.find(a => String(a.id) === String(selectedActivityId));
    if (!selectedAct) {
      alert('Seleziona prima un\'attività!');
      return;
    }
    saveAttendanceForActivity(selectedAct, attendance);
  };

  // APERTURA MODALE MODIFICA PRESENZE DA STORICO
  const openEditAttendanceModal = (act) => {
    setEditingActivity(act);
    const existingLogs = attendanceLogs.filter(
      l => l.date === act.date && String(l.activity_id) === String(act.id) && l.status !== null
    );
    const initialMap = {};
    existingLogs.forEach(log => {
      initialMap[log.athlete_id] = log.status === 'present';
    });
    setModalAttendance(initialMap);
  };

  const handleSaveModalAttendance = async () => {
    if (!editingActivity) return;
    await saveAttendanceForActivity(editingActivity, modalAttendance);
    setEditingActivity(null);
  };

  // 7. SALVATAGGIO SCHEDA TECNICA E CATEGORIA ATLETA
  const openTechModal = (member) => {
    setEditingTechMember(member);
    setTechFormData({
      category: member.category || 'Cuccioli',
      birth_date: member.birth_date || '',
      height_cm: member.height_cm || '',
      weight_kg: member.weight_kg || '',
      ski_gs_length: member.ski_gs_length || '',
      ski_sl_length: member.ski_sl_length || '',
      boot_size_mm: member.boot_size_mm || ''
    });
  };

  const handleSaveTechData = async (e) => {
    e.preventDefault();
    if (!supabase || !editingTechMember) return;

    const { error } = await supabase
      .from('club_members')
      .update({
        category: techFormData.category,
        birth_date: techFormData.birth_date || null,
        height_cm: techFormData.height_cm ? parseFloat(techFormData.height_cm) : null,
        weight_kg: techFormData.weight_kg ? parseFloat(techFormData.weight_kg) : null,
        ski_gs_length: techFormData.ski_gs_length ? parseFloat(techFormData.ski_gs_length) : null,
        ski_sl_length: techFormData.ski_sl_length ? parseFloat(techFormData.ski_sl_length) : null,
        boot_size_mm: techFormData.boot_size_mm ? parseFloat(techFormData.boot_size_mm) : null
      })
      .eq('id', editingTechMember.id);

    if (error) {
      alert(`Errore salvataggio dati: ${error.message}`);
    } else {
      await reloadMembers();
      setEditingTechMember(null);
      alert('Profilo e dati tecnici aggiornati!');
    }
  };

  // 8. ESPORTAZIONE EXCEL / CSV NATIVA PER GRUPPI (SENZA DIPENDENZE ESTERNE)
  const handleExportExcelByGroup = (groupType) => {
    const isExportPiccoli = groupType === 'Piccoli';
    const targetCategories = isExportPiccoli ? CATEGORIES_PICCOLI : CATEGORIES_GRANDI;
    const existingActivityIds = new Set(activities.map(a => String(a.id)));

    const filteredAthletes = members.filter(
      m => m.role === 'athlete' && targetCategories.includes(m.category)
    );

    if (filteredAthletes.length === 0) {
      alert(`Nessun atleta trovato per il Gruppo ${groupType}.`);
      return;
    }

    const headers = [
      'Nome e Cognome', 'Email', 'Categoria', 'Data Nascita', 
      'Altezza (cm)', 'Peso (kg)', 'Sci GS (cm)', 'Sci SL (cm)', 'Scarpone (mm)',
      'Presenze Gigante', 'Presenze Slalom', 'Presenze SuperG', 'Presenze Campo Libero', 
      'Gare Svolte', 'TOTALE PRESENZE UFFICIALI', 'TOTALE ASSENZE UFFICIALI'
    ];

    const rows = filteredAthletes.map(athlete => {
      const athleteLogs = attendanceLogs.filter(l => {
        if (String(l.athlete_id) !== String(athlete.id)) return false;
        if (l.activity_id && !existingActivityIds.has(String(l.activity_id))) return false;
        return l.status !== null;
      });

      const presentLogs = athleteLogs.filter(l => l.status === 'present');
      const absentLogs = athleteLogs.filter(l => l.status === 'absent');

      const raceCount = presentLogs.filter(l => (l.event_type || '').includes('Gara')).length;
      const gsCount = presentLogs.filter(l => l.specialty === 'Gigante' && !(l.event_type || '').includes('Gara')).length;
      const slCount = presentLogs.filter(l => (l.specialty === 'Slalom' || l.specialty === 'Special') && !(l.event_type || '').includes('Gara')).length;
      const sgCount = presentLogs.filter(l => l.specialty === 'SuperG' && !(l.event_type || '').includes('Gara')).length;
      const clCount = presentLogs.filter(l => ['Campo Libero', 'Esercizi', 'Neve Fresca'].includes(l.specialty) && !(l.event_type || '').includes('Gara')).length;

      return [
        `"${athlete.name}"`,
        `"${athlete.email}"`,
        `"${athlete.category}"`,
        `"${athlete.birth_date || '-'}"`,
        `"${athlete.height_cm || '-'}"`,
        `"${athlete.weight_kg || '-'}"`,
        `"${athlete.ski_gs_length || '-'}"`,
        `"${athlete.ski_sl_length || '-'}"`,
        `"${athlete.boot_size_mm || '-'}"`,
        gsCount,
        slCount,
        sgCount,
        clCount,
        raceCount,
        presentLogs.length,
        absentLogs.length
      ].join(';');
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Report_Presenze_${groupType}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  // CALCOLO ATLETI PER ATTIVITÀ SELEZIONATA
  const selectedActivityObject = activities.find(a => String(a.id) === String(selectedActivityId));
  const selectedActivityCategoryTarget = selectedActivityObject ? selectedActivityObject.category.split('|')[2]?.trim() || 'Tutti' : 'Tutti';
  const targetCatsArray = selectedActivityCategoryTarget.split(',').map(c => c.trim());

  const filteredMembersForPresence = members.filter(m => {
    if (m.role !== 'athlete') return false;
    if (!selectedActivityCategoryTarget.includes('Tutti') && selectedActivityCategoryTarget !== '') {
      if (!targetCatsArray.includes(m.category)) return false;
    }
    return m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.email.toLowerCase().includes(searchQuery.toLowerCase());
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
                      {ALL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </>
                ) : (
                  <>
                    <label style={styles.label}>Gruppo Allenatore</label>
                    <select style={styles.input} value={regCoachGroup} onChange={(e) => setRegCoachGroup(e.target.value)}>
                      <option value="Piccoli">Piccoli (Superbaby / Baby / Cuccioli)</option>
                      <option value="Grandi">Grandi (Ragazzi / Allievi / Giovani / Senior / Master)</option>
                    </select>

                    <label style={styles.label}>Codice PIN Registrazione Allenatore</label>
                    <input
                      type="password"
                      style={styles.input}
                      value={regPinCode}
                      onChange={(e) => setRegPinCode(e.target.value)}
                      placeholder="Inserisci il codice segreto Allenatori"
                      required
                    />
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
        
        {currentUser.role !== 'athlete' ? (
          <>
            <button style={activeTab === 'activity_appello' ? styles.tabActive : styles.tab} onClick={() => setActiveTab('activity_appello')}>
              📅 Attività & Appello
            </button>
            <button style={activeTab === 'history' ? styles.tabActive : styles.tab} onClick={() => setActiveTab('history')}>
              📜 Storico Attività
            </button>
          </>
        ) : (
          <button style={activeTab === 'athlete_program' ? styles.tabActive : styles.tab} onClick={() => setActiveTab('athlete_program')}>
            📅 Programma & Disponibilità
          </button>
        )}

        <button style={activeTab === 'members_schede' ? styles.tabActive : styles.tab} onClick={() => setActiveTab('members_schede')}>
          👥 {currentUser.role === 'athlete' ? 'La Mia Scheda' : 'Atleti & Schede'}
        </button>
      </nav>

      {/* TAB 1: VIDEO LIBRARY CON PLAYER VIOLA ORIGINALE */}
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
                  {ALL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
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
                <VideoAnalysisPlayer
                  key={video.id}
                  video={video}
                  currentUser={currentUser}
                  onDeleteVideo={handleDeleteVideo}
                />
              ))}
            </div>
          )}
        </main>
      )}

      {/* TAB PER ATLETI: INDICAZIONI DISPONIBILITÀ (NON MODIFICA I GRAFICI) */}
      {activeTab === 'athlete_program' && currentUser.role === 'athlete' && (
        <main style={styles.mainContent}>
          <div style={styles.sectionHeader}>
            <h3>Programma Attività Categoria {currentUser.category}</h3>
          </div>

          <div style={{ marginTop: '16px' }}>
            {groupVisibleActivities.length === 0 ? (
              <div style={styles.emptyState}><p>Nessuna attività in programma per la tua categoria.</p></div>
            ) : (
              groupVisibleActivities.map(act => {
                const myLog = attendanceLogs.find(
                  l => l.date === act.date && String(l.activity_id) === String(act.id) && String(l.athlete_id) === String(currentUser.id)
                );
                const myAvailability = myLog ? myLog.availability : null;

                return (
                  <div key={act.id} style={styles.athleteActCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                      <div>
                        <span style={styles.badgeSpecialty}>{act.category.split('|')[0]} - {act.category.split('|')[1]}</span>
                        <h4 style={{ margin: '8px 0 4px 0', color: '#1e3a8a' }}>📅 Data: {act.date}</h4>
                        <p style={{ margin: '4px 0', color: '#334155', whiteSpace: 'pre-wrap' }}>{act.content}</p>
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>Inserito da: {act.author_name}</span>
                      </div>

                      {/* PULSANTI DI RISPOSTA PER L'ATLETA */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '160px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', textAlign: 'center' }}>
                          La tua risposta: {myAvailability === 'present' ? 'Ci sarò ✅' : myAvailability === 'absent' ? 'Non ci sarò ❌' : 'Non ancora indicata'}
                        </span>
                        <button
                          onClick={() => handleAthleteSelfAvailability(act, 'present')}
                          style={{
                            padding: '8px 12px',
                            borderRadius: '6px',
                            border: 'none',
                            backgroundColor: myAvailability === 'present' ? '#15803d' : '#22c55e',
                            color: '#ffffff',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                          }}
                        >
                          Ci sarò ✅
                        </button>
                        <button
                          onClick={() => handleAthleteSelfAvailability(act, 'absent')}
                          style={{
                            padding: '8px 12px',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            backgroundColor: myAvailability === 'absent' ? '#ef4444' : '#ffffff',
                            color: myAvailability === 'absent' ? '#ffffff' : '#64748b',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                          }}
                        >
                          Non ci sarò ❌
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </main>
      )}

      {/* TAB 2: ATTIVITÀ & APPELLO UNIFICATA (COACH) */}
      {activeTab === 'activity_appello' && currentUser.role !== 'athlete' && (
        <main style={styles.mainContent}>
          <div style={styles.sectionHeader}>
            <h3>Crea Attività & Appello Diretto ({currentUser.coach_group || 'Tutti'})</h3>
          </div>

          {/* BOX CREAZIONE ATTIVITÀ MULTI-CATEGORIA */}
          <div style={styles.cardBox}>
            <h4 style={{ margin: '0 0 16px 0', color: '#1e3a8a' }}>➕ Nuova Attività del Giorno</h4>
            <form onSubmit={handleCreateActivity} style={styles.form}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={styles.label}>Tipo Evento</label>
                  <select style={{ ...styles.input, width: '100%' }} value={actType} onChange={(e) => setActType(e.target.value)}>
                    <option value="Allenamento">Allenamento</option>
                    <option value="Gara">Gara</option>
                    <option value="Stage">Stage</option>
                    <option value="Trasferta">Trasferta</option>
                  </select>
                </div>

                <div>
                  <label style={styles.label}>Specialità / Disciplina</label>
                  <select style={{ ...styles.input, width: '100%' }} value={actSpecialty} onChange={(e) => setActSpecialty(e.target.value)}>
                    <option value="Gigante">Gigante</option>
                    <option value="Slalom">Slalom</option>
                    <option value="SuperG">SuperG</option>
                    <option value="Campo Libero">Campo Libero</option>
                    <option value="Esercizi">Esercizi</option>
                    <option value="Neve Fresca">Neve Fresca</option>
                  </select>
                </div>

                <div>
                  <label style={styles.label}>Data</label>
                  <input type="date" style={{ ...styles.input, width: '100%' }} value={actDate} onChange={(e) => setActDate(e.target.value)} required />
                </div>
              </div>

              {/* SELEZIONE MULTIPLA CATEGORIE */}
              <div style={{ marginTop: '12px' }}>
                <label style={styles.label}>Seleziona Categorie Coinvolte (Multi-Scelta):</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
                  {ALL_CATEGORIES.map(cat => {
                    const isSelected = selectedCategories.includes(cat);
                    return (
                      <button
                        type="button"
                        key={cat}
                        onClick={() => handleCategoryToggle(cat)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '20px',
                          border: isSelected ? '2px solid #2563eb' : '1px solid #cbd5e1',
                          backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
                          color: isSelected ? '#1e40af' : '#475569',
                          fontWeight: isSelected ? 'bold' : 'normal',
                          cursor: 'pointer',
                          fontSize: '13px'
                        }}
                      >
                        {cat} {isSelected ? '✓' : ''}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ marginTop: '12px' }}>
                <label style={styles.label}>Note / Programma</label>
                <textarea
                  style={styles.textArea}
                  value={actNotes}
                  onChange={(e) => setActNotes(e.target.value)}
                  placeholder="Orario ritrovo, tracciato o programma di giornata..."
                />
              </div>

              <button type="submit" style={{ ...styles.btnPrimary, width: 'auto', alignSelf: 'flex-start' }}>
                Crea Attività & Apri Appello
              </button>
            </form>
          </div>

          {/* BANNER ATTIVITÀ DI OGGI SELEZIONABILE */}
          <div style={{ marginTop: '30px' }}>
            <h4>📋 Appello Presenze Attività Odierne</h4>
            {todayActivities.length > 0 ? (
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
            ) : (
              <div style={styles.noTodayBanner}>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>ℹ️ Nessuna attività per oggi. Creane una dal modulo sopra.</p>
              </div>
            )}
          </div>

          {/* LISTA APPELLO DINAMICA */}
          {selectedActivityId && (
            <div style={{ marginTop: '24px' }}>
              <div style={styles.categoryBadgeInfo}>
                <span>Appello per Categorie: <strong>{selectedActivityCategoryTarget}</strong></span>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <input
                  type="text"
                  style={styles.searchInput}
                  placeholder="🔍 Cerca atleta nell'appello..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div style={styles.membersList}>
                {filteredMembersForPresence.length === 0 ? (
                  <div style={styles.emptyState}>
                    <p>Nessun atleta trovato per le categorie <strong>{selectedActivityCategoryTarget}</strong>.</p>
                  </div>
                ) : (
                  filteredMembersForPresence.map(athlete => {
                    const editable = canEditCategory(athlete.category);
                    const isChecked = !!attendance[athlete.id];

                    // Mostra la risposta informativa dell'atleta se presente
                    const athleteLog = attendanceLogs.find(
                      l => l.date === selectedActivityObject?.date && String(l.activity_id) === String(selectedActivityId) && String(l.athlete_id) === String(athlete.id)
                    );
                    const availabilityNote = athleteLog?.availability;

                    return (
                      <div
                        key={athlete.id}
                        onClick={() => editable && setAttendance({ ...attendance, [athlete.id]: !isChecked })}
                        style={{
                          ...styles.memberRow,
                          cursor: editable ? 'pointer' : 'default',
                          backgroundColor: isChecked ? '#f0fdf4' : '#f8fafc',
                          borderColor: isChecked ? '#86efac' : '#e2e8f0',
                          opacity: editable ? 1 : 0.6
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            ...styles.checkboxSquare,
                            backgroundColor: isChecked ? '#16a34a' : '#ffffff',
                            borderColor: isChecked ? '#16a34a' : '#cbd5e1',
                            color: '#ffffff'
                          }}>
                            {isChecked ? '✓' : ''}
                          </div>
                          <div>
                            <strong style={{ color: isChecked ? '#15803d' : '#0f172a' }}>{athlete.name}</strong> ({athlete.category})
                            {availabilityNote && (
                              <span style={{ fontSize: '11px', marginLeft: '8px', color: availabilityNote === 'present' ? '#16a34a' : '#dc2626', fontWeight: 'bold' }}>
                                💬 Atleta: {availabilityNote === 'present' ? 'Ci sarà' : 'Non ci sarà'}
                              </span>
                            )}
                            {!editable && <span style={styles.readOnlyTag}> (Sola Lettura)</span>}
                          </div>
                        </div>

                        <span style={{ fontSize: '13px', fontWeight: 'bold', color: isChecked ? '#16a34a' : '#94a3b8' }}>
                          {isChecked ? 'PRESENTE' : 'ASSENTE'}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              <button onClick={handleSaveAttendance} style={{ ...styles.btnPrimary, marginTop: '20px', width: '100%' }}>
                Salva Presenze Ufficiali Attività
              </button>
            </div>
          )}
        </main>
      )}

      {/* TAB 3: STORICO ATTIVITÀ */}
      {activeTab === 'history' && (
        <main style={styles.mainContent}>
          <div style={styles.sectionHeader}>
            <h3>Storico Registro Attività ({currentUser.coach_group || 'Tutti'})</h3>
          </div>

          <div style={{ marginTop: '20px' }}>
            {groupVisibleActivities.length === 0 ? (
              <p style={{ color: '#94a3b8' }}>Nessuna attività registrata nello storico.</p>
            ) : (
              groupVisibleActivities.map(act => (
                <div key={act.id} style={styles.noteCard}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <strong>📅 {act.date} — {act.category}</strong>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button onClick={() => openEditAttendanceModal(act)} style={styles.btnEditPresence}>
                        📋 Gestisci / Modifica Presenze
                      </button>
                      <button onClick={() => handleDeleteActivity(act.id)} style={styles.btnDeleteInline}>🗑️ Elimina</button>
                    </div>
                  </div>
                  <p style={{ margin: '8px 0', color: '#334155', whiteSpace: 'pre-wrap' }}>{act.content}</p>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>Creato da: {act.author_name}</span>
                </div>
              ))
            )}
          </div>
        </main>
      )}

      {/* TAB 4: ATLETI & SCHEDE (PRIVACY: ATLETA VEDE SOLO LA SUA SCHEDA) */}
      {activeTab === 'members_schede' && (
        <main style={styles.mainContent}>
          <div style={styles.sectionHeader}>
            <h3>{currentUser.role === 'athlete' ? 'La Mia Scheda Profilo & Statistiche' : 'Elenco Atleti, Dati Tecnici & Schede'}</h3>
            
            {/* PULSANTI DI DOWNLOAD EXCEL / CSV SOLO PER GLI ALLENATORI */}
            {currentUser.role !== 'athlete' && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button onClick={() => handleExportExcelByGroup('Piccoli')} style={styles.btnExcel}>
                  📥 Excel Piccoli
                </button>
                <button onClick={() => handleExportExcelByGroup('Grandi')} style={styles.btnExcel}>
                  📥 Excel Grandi
                </button>
              </div>
            )}
          </div>

          {currentUser.role !== 'athlete' && (
            <div style={{ marginBottom: '16px' }}>
              <input
                type="text"
                style={styles.searchInput}
                placeholder="🔍 Cerca atleta per nome o email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          )}

          {/* FILTRAGGIO PRIVACY: ATLETI VEDONO SOLO SE STESSI, COACH VEDONO IL LORO GRUPPO/CATEGORIA */}
          {ALL_CATEGORIES.map(categoryName => {
            const categoryAthletes = members
              .filter(m => m.role === 'athlete' && m.category === categoryName)
              .filter(m => {
                if (currentUser.role === 'athlete') {
                  return String(m.id) === String(currentUser.id);
                }
                return m.name.toLowerCase().includes(searchQuery.toLowerCase());
              })
              .sort((a, b) => a.name.localeCompare(b.name));

            if (categoryAthletes.length === 0) return null;

            return (
              <div key={categoryName} style={{ marginBottom: '28px' }}>
                <h4 style={{ color: '#1e3a8a', borderBottom: '2px solid #e2e8f0', paddingBottom: '6px', marginBottom: '12px' }}>
                  Categoria {categoryName} ({categoryAthletes.length})
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {categoryAthletes.map(athlete => {
                    const isExpanded = currentUser.role === 'athlete' ? true : expandedAthleteId === athlete.id;
                    const canEditTech = canEditCategory(athlete.category);

                    // CALCOLO GRAFICO E STATISTICHE ATLETA (SOLO CONTEGGI UFFICIALI COACH)
                    const existingActivityIds = new Set(activities.map(a => String(a.id)));
                    const athleteLogs = attendanceLogs.filter(l => {
                      if (String(l.athlete_id) !== String(athlete.id)) return false;
                      if (l.activity_id && !existingActivityIds.has(String(l.activity_id))) return false;
                      return l.status !== null;
                    });

                    const presentLogs = athleteLogs.filter(l => l.status === 'present');
                    const totalPresences = presentLogs.length;
                    const absentLogs = athleteLogs.filter(l => l.status === 'absent');
                    const totalAbsences = absentLogs.length;

                    const raceCount = presentLogs.filter(l => (l.event_type || '').includes('Gara')).length;
                    const gsCount = presentLogs.filter(l => l.specialty === 'Gigante' && !(l.event_type || '').includes('Gara')).length;
                    const slCount = presentLogs.filter(l => (l.specialty === 'Slalom' || l.specialty === 'Special') && !(l.event_type || '').includes('Gara')).length;
                    const sgCount = presentLogs.filter(l => l.specialty === 'SuperG' && !(l.event_type || '').includes('Gara')).length;
                    const clCount = presentLogs.filter(l => ['Campo Libero', 'Esercizi', 'Neve Fresca'].includes(l.specialty) && !(l.event_type || '').includes('Gara')).length;

                    const grandTotal = totalPresences + totalAbsences;

                    const gsDeg = grandTotal ? (gsCount / grandTotal) * 360 : 0;
                    const slDeg = grandTotal ? (slCount / grandTotal) * 360 : 0;
                    const sgDeg = grandTotal ? (sgCount / grandTotal) * 360 : 0;
                    const raceDeg = grandTotal ? (raceCount / grandTotal) * 360 : 0;
                    const clDeg = grandTotal ? (clCount / grandTotal) * 360 : 0;

                    const pieConic = `conic-gradient(
                      #2563eb 0deg ${gsDeg}deg,
                      #0284c7 ${gsDeg}deg ${gsDeg + slDeg}deg,
                      #059669 ${gsDeg + slDeg}deg ${gsDeg + slDeg + sgDeg}deg,
                      #9333ea ${gsDeg + slDeg + sgDeg}deg ${gsDeg + slDeg + sgDeg + raceDeg}deg,
                      #d97706 ${gsDeg + slDeg + sgDeg + raceDeg}deg ${gsDeg + slDeg + sgDeg + raceDeg + clDeg}deg,
                      #ef4444 ${gsDeg + slDeg + sgDeg + raceDeg + clDeg}deg 360deg
                    )`;

                    return (
                      <div key={athlete.id} style={styles.accordionCard}>
                        {/* INTESTAZIONE ATLETA */}
                        <div
                          onClick={() => currentUser.role !== 'athlete' && setExpandedAthleteId(isExpanded ? null : athlete.id)}
                          style={{
                            ...styles.accordionHeader,
                            cursor: currentUser.role === 'athlete' ? 'default' : 'pointer'
                          }}
                        >
                          <div>
                            <strong style={{ fontSize: '16px', color: '#0f172a' }}>{athlete.name}</strong>
                            <span style={{ fontSize: '13px', color: '#64748b', marginLeft: '10px' }}>({athlete.email})</span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '13px', color: '#16a34a', fontWeight: 'bold' }}>{totalPresences} Presenze</span>
                            {(currentUser.role === 'admin' || currentUser.role === 'superadmin') && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteMember(athlete.id); }}
                                style={styles.btnDeleteInline}
                              >
                                🗑️ Elimina
                              </button>
                            )}
                            {currentUser.role !== 'athlete' && <span style={{ fontSize: '16px' }}>{isExpanded ? '▲' : '▼'}</span>}
                          </div>
                        </div>

                        {/* CONTENUTO ESPANDIBILE (DATI TECNICI + GRAFICO) */}
                        {isExpanded && (
                          <div style={styles.accordionBody}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                              <h5 style={{ margin: 0, color: '#1e3a8a' }}>⚙️ Dati Anagrafici, Categoria & Attrezzatura</h5>
                              {canEditTech && (
                                <button onClick={() => openTechModal(athlete)} style={styles.btnEditPresence}>
                                  ✏️ Modifica Categoria e Dati Tecnici
                                </button>
                              )}
                            </div>

                            {/* GRIGLIA SCHEDA TECNICA */}
                            <div style={styles.techGrid}>
                              <div>🏆 Categoria: <strong>{athlete.category}</strong></div>
                              <div>🎂 Data di Nascita: <strong>{athlete.birth_date || 'Non inserita'}</strong></div>
                              <div>📏 Altezza: <strong>{athlete.height_cm ? `${athlete.height_cm} cm` : 'n.d.'}</strong></div>
                              <div>⚖️ Peso: <strong>{athlete.weight_kg ? `${athlete.weight_kg} kg` : 'n.d.'}</strong></div>
                              <div>🎿 Sci GS: <strong>{athlete.ski_gs_length ? `${athlete.ski_gs_length} cm` : 'n.d.'}</strong></div>
                              <div>🎿 Sci SL: <strong>{athlete.ski_sl_length ? `${athlete.ski_sl_length} cm` : 'n.d.'}</strong></div>
                              <div>👟 Scarpone: <strong>{athlete.boot_size_mm ? `${athlete.boot_size_mm} mm` : 'n.d.'}</strong></div>
                            </div>

                            {/* GRAFICO E RESOCONTO */}
                            <h5 style={{ margin: '20px 0 12px 0', color: '#1e3a8a' }}>📊 Report Stagionale Presenze Ufficiali</h5>
                            <div style={styles.statsSummaryGrid}>
                              <div style={styles.summaryBox}>
                                <span style={{ color: '#16a34a', fontSize: '18px', fontWeight: 'bold' }}>{totalPresences}</span>
                                <span style={{ fontSize: '11px', color: '#64748b' }}>Presenze</span>
                              </div>
                              <div style={styles.summaryBox}>
                                <span style={{ color: '#9333ea', fontSize: '18px', fontWeight: 'bold' }}>{raceCount}</span>
                                <span style={{ fontSize: '11px', color: '#64748b' }}>Gare</span>
                              </div>
                              <div style={styles.summaryBox}>
                                <span style={{ color: '#dc2626', fontSize: '18px', fontWeight: 'bold' }}>{totalAbsences}</span>
                                <span style={{ fontSize: '11px', color: '#64748b' }}>Assenze</span>
                              </div>
                            </div>

                            <div style={styles.statsLayout}>
                              <div style={{ textAlign: 'center' }}>
                                <div style={{ ...styles.pieChart, background: grandTotal > 0 ? pieConic : '#e2e8f0' }} />
                              </div>

                              <div style={styles.legendList}>
                                <div><span style={{ ...styles.legendDot, backgroundColor: '#2563eb' }} /> Gigante: {gsCount}</div>
                                <div><span style={{ ...styles.legendDot, backgroundColor: '#0284c7' }} /> Slalom: {slCount}</div>
                                <div><span style={{ ...styles.legendDot, backgroundColor: '#059669' }} /> SuperG: {sgCount}</div>
                                <div><span style={{ ...styles.legendDot, backgroundColor: '#9333ea' }} /> Gare: {raceCount}</div>
                                <div><span style={{ ...styles.legendDot, backgroundColor: '#d97706' }} /> Campo Libero / Altro: {clCount}</div>
                                <div><span style={{ ...styles.legendDot, backgroundColor: '#ef4444' }} /> Assenze: {totalAbsences}</div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </main>
      )}

      {/* BOTTOM BAR MOBILE */}
      <nav style={styles.bottomBarMobile}>
        <button style={activeTab === 'videos' ? styles.bottomTabActive : styles.bottomTab} onClick={() => setActiveTab('videos')}>
          <span>📹</span>
          <span style={styles.bottomTabLabel}>Video</span>
        </button>

        {currentUser.role !== 'athlete' ? (
          <>
            <button style={activeTab === 'activity_appello' ? styles.bottomTabActive : styles.bottomTab} onClick={() => setActiveTab('activity_appello')}>
              <span>📅</span>
              <span style={styles.bottomTabLabel}>Appello</span>
            </button>
            <button style={activeTab === 'history' ? styles.bottomTabActive : styles.bottomTab} onClick={() => setActiveTab('history')}>
              <span>📜</span>
              <span style={styles.bottomTabLabel}>Storico</span>
            </button>
          </>
        ) : (
          <button style={activeTab === 'athlete_program' ? styles.bottomTabActive : styles.bottomTab} onClick={() => setActiveTab('athlete_program')}>
            <span>📅</span>
            <span style={styles.bottomTabLabel}>Programma</span>
          </button>
        )}

        <button style={activeTab === 'members_schede' ? styles.bottomTabActive : styles.bottomTab} onClick={() => setActiveTab('members_schede')}>
          <span>👥</span>
          <span style={styles.bottomTabLabel}>{currentUser.role === 'athlete' ? 'Scheda' : 'Atleti'}</span>
        </button>
      </nav>

      {/* MODALE MODIFICA CATEGORIA E DATI TECNICI ATLETA */}
      {editingTechMember && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <h3 style={styles.modalTitle}>Scheda Profilo: {editingTechMember.name}</h3>
            <form onSubmit={handleSaveTechData} style={styles.form}>
              <label style={styles.label}>Categoria Atleta</label>
              <select
                style={styles.input}
                value={techFormData.category}
                onChange={(e) => setTechFormData({ ...techFormData, category: e.target.value })}
              >
                {ALL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              <label style={styles.label}>Data di Nascita</label>
              <input type="date" style={styles.input} value={techFormData.birth_date} onChange={(e) => setTechFormData({ ...techFormData, birth_date: e.target.value })} />

              <label style={styles.label}>Altezza (cm)</label>
              <input type="number" step="0.5" style={styles.input} value={techFormData.height_cm} onChange={(e) => setTechFormData({ ...techFormData, height_cm: e.target.value })} placeholder="Es. 155" />

              <label style={styles.label}>Peso (kg)</label>
              <input type="number" step="0.5" style={styles.input} value={techFormData.weight_kg} onChange={(e) => setTechFormData({ ...techFormData, weight_kg: e.target.value })} placeholder="Es. 48" />

              <label style={styles.label}>Lunghezza Sci GS (cm)</label>
              <input type="number" step="1" style={styles.input} value={techFormData.ski_gs_length} onChange={(e) => setTechFormData({ ...techFormData, ski_gs_length: e.target.value })} placeholder="Es. 165" />

              <label style={styles.label}>Lunghezza Sci SL (cm)</label>
              <input type="number" step="1" style={styles.input} value={techFormData.ski_sl_length} onChange={(e) => setTechFormData({ ...techFormData, ski_sl_length: e.target.value })} placeholder="Es. 145" />

              <label style={styles.label}>Misura Scarpone (mm)</label>
              <input type="number" step="1" style={styles.input} value={techFormData.boot_size_mm} onChange={(e) => setTechFormData({ ...techFormData, boot_size_mm: e.target.value })} placeholder="Es. 285" />

              <div style={styles.modalActions}>
                <button type="submit" style={styles.btnPrimary}>Salva Modifiche</button>
                <button type="button" onClick={() => setEditingTechMember(null)} style={styles.btnCancel}>Annulla</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE MODIFICA PRESENZE DA STORICO */}
      {editingActivity && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCardLarge}>
            <h3 style={styles.modalTitle}>Gestisci Presenze: {editingActivity.category}</h3>
            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '-10px', marginBottom: '16px' }}>
              Data: <strong>{editingActivity.date}</strong>
            </p>

            <div style={{ maxHeight: '350px', overflowY: 'auto', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {members.filter(m => {
                if (m.role !== 'athlete') return false;
                const targetCat = editingActivity.category.split('|')[2]?.trim() || 'Tutti';
                if (targetCat !== 'Tutti' && targetCat !== '' && !targetCat.includes(m.category)) return false;
                return true;
              }).map(athlete => {
                const isChecked = !!modalAttendance[athlete.id];
                return (
                  <div
                    key={athlete.id}
                    onClick={() => setModalAttendance({ ...modalAttendance, [athlete.id]: !isChecked })}
                    style={{
                      ...styles.memberRow,
                      cursor: 'pointer',
                      backgroundColor: isChecked ? '#f0fdf4' : '#f8fafc',
                      borderColor: isChecked ? '#86efac' : '#e2e8f0'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        ...styles.checkboxSquare,
                        backgroundColor: isChecked ? '#16a34a' : '#ffffff',
                        borderColor: isChecked ? '#16a34a' : '#cbd5e1',
                        color: '#ffffff'
                      }}>
                        {isChecked ? '✓' : ''}
                      </div>
                      <strong style={{ color: isChecked ? '#15803d' : '#0f172a' }}>{athlete.name}</strong>
                    </div>

                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: isChecked ? '#16a34a' : '#dc2626' }}>
                      {isChecked ? 'PRESENTE ✅' : 'ASSENTE ❌'}
                    </span>
                  </div>
                );
              })}
            </div>

            <div style={styles.modalActions}>
              <button onClick={handleSaveModalAttendance} style={styles.btnPrimary}>Salva Modifiche</button>
              <button onClick={() => setEditingActivity(null)} style={styles.btnCancel}>Annulla</button>
            </div>
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

// DEFINIZIONE STILI AGGIORNATA
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
  btnDeleteInline: { backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', padding: '6px 10px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' },
  btnEditPresence: { backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' },
  btnExcel: { backgroundColor: '#16a34a', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '8px 14px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' },
  btnPurpleFrame: { padding: '4px 10px', fontSize: '11px', borderRadius: '4px', border: '1px solid #c084fc', backgroundColor: '#f3e8ff', color: '#6b21a8', fontWeight: 'bold', cursor: 'pointer' },
  btnClearCanvas: { padding: '4px 8px', fontSize: '11px', borderRadius: '4px', border: '1px solid #fca5a5', backgroundColor: '#fef2f2', color: '#991b1b', fontWeight: 'bold', cursor: 'pointer' },
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
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' },
  btnPrimarySmall: { padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: '#1e3a8a', color: '#ffffff', fontWeight: 'bold', cursor: 'pointer' },

  filterRow: { display: 'flex', gap: '20px', marginBottom: '20px', backgroundColor: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' },
  filterLabel: { fontSize: '13px', color: '#475569', marginRight: '8px', fontWeight: '600' },
  filterSelect: { padding: '6px 10px', borderRadius: '6px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a' },

  cardBox: { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' },
  todayGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px', marginTop: '8px' },
  todayCard: { padding: '12px', borderRadius: '8px', border: '2px solid', cursor: 'pointer', transition: 'all 0.2s ease' },
  activeTag: { display: 'inline-block', marginTop: '8px', fontSize: '10px', fontWeight: 'bold', color: '#2563eb' },
  noTodayBanner: { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px' },
  categoryBadgeInfo: { backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', color: '#1e40af' },

  videoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' },
  videoCard: { backgroundColor: '#ffffff', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.03)' },
  videoPlayer: { width: '100%', maxHeight: '450px', backgroundColor: '#000000', display: 'block' },
  videoMeta: { padding: '12px' },
  badgeSpecialty: { backgroundColor: '#2563eb', color: '#ffffff', fontSize: '10px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px' },
  videoTitle: { margin: '8px 0 4px 0', fontSize: '16px', color: '#0f172a' },
  videoSub: { margin: 0, fontSize: '12px', color: '#475569' },
  videoDate: { margin: '8px 0 0 0', fontSize: '11px', color: '#94a3b8' },

  membersList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  memberRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', transition: 'all 0.2s ease' },
  checkboxSquare: { width: '22px', height: '22px', borderRadius: '4px', border: '2px solid', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', fontSize: '14px' },

  readOnlyTag: { fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' },
  emptyState: { textAlign: 'center', padding: '40px', color: '#94a3b8' },
  noteCard: { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', marginTop: '12px' },
  athleteActCard: { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', marginBottom: '12px' },

  accordionCard: { backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' },
  accordionHeader: { padding: '14px 18px', backgroundColor: '#f8fafc', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', userSelect: 'none' },
  accordionBody: { padding: '18px', borderTop: '1px solid #e2e8f0', backgroundColor: '#ffffff' },

  techGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', backgroundColor: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', color: '#334155' },

  statsSummaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '12px', marginBottom: '16px' },
  summaryBox: { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px', textAlign: 'center', display: 'flex', flexDirection: 'column' },
  statsLayout: { display: 'flex', gap: '30px', alignItems: 'center', marginTop: '12px', flexWrap: 'wrap' },
  pieChart: { width: '120px', height: '120px', borderRadius: '50%', border: '2px solid #ffffff', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' },
  legendList: { display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: '#334155' },
  legendDot: { display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', marginRight: '8px' },

  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,23,42,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalCard: { backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '450px', border: '1px solid #e2e8f0' },
  modalCardLarge: { backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '550px', border: '1px solid #e2e8f0' },
  modalTitle: { margin: '0 0 16px 0', fontSize: '18px', color: '#1e3a8a' },
  modalActions: { display: 'flex', gap: '10px', marginTop: '16px' }
};
