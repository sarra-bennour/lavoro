import { useState, useEffect, useRef } from "react"
import Swal from "sweetalert2"
import { useParams } from 'react-router-dom';


export default function TaskAssignement() {
  const [members, setMembers] = useState([])
  const [task, setTask] = useState(null)
  const [isSpinning, setIsSpinning] = useState(false)
  const [counter, setCounter] = useState(0)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [speed, setSpeed] = useState(0)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [assignmentResult, setAssignmentResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [isAssigned, setIsAssigned] = useState(false);
  const { taskId } = useParams();


  const intervalRef = useRef(null)
  const spinTimeoutRef = useRef(null)


  // Récupérer la liste des membres
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await fetch('https://lavoro-back.onrender.com/teamMember/getAll')
        const data = await response.json()
        setMembers(data.data || [])
      } catch (error) {
        console.error("Erreur lors de la récupération des membres:", error)
      }
    }

    fetchMembers()
  }, [])

  // Récupérer les détails de la tâche
  useEffect(() => {
    const fetchTask = async () => {
      if (!taskId) return;
      try {
        const response = await fetch(`https://lavoro-back.onrender.com/tasks/getTaskByIdMember/${taskId}`)
        const data = await response.json()
        setTask(data.data || null)
      } catch (error) {
        console.error("Erreur lors de la récupération de la tâche:", error)
      }
    }

    fetchTask()
  }, [taskId])

  // Fonction pour assigner la tâche
  // Fonction pour assigner la tâche
const assignTask = async () => {
  if (!taskId) return -1;
  
  setLoading(true);
  try {
    // 1. Récupérer le meilleur match depuis l'API
    const response = await fetch(
      `https://lavoro-back.onrender.com/ai-assignment/tasks/${taskId}/matches?topN=1`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log("Résultat de l'assignation:", result);
    // 2. Vérifier la structure de la réponse
    if (!result.success || !result.matches || result.matches.length === 0) {
      throw new Error("Aucun membre correspondant trouvé");
    }
    // 3. Stocker le résultat pour confirmation ultérieure
    setAssignmentResult(result);
    setIsAssigned(true);
    
    // 4. Trouver l'index du membre dans le tableau local
    const bestMatch = result.matches[0];
    const assignedMemberId = bestMatch.member_id;
    
    return members.findIndex(member => 
      member._id === assignedMemberId || 
      member.user?._id === assignedMemberId
    );
    
  } catch (error) {
    console.error("Erreur lors de l'assignation:", error);
    Swal.fire({
      title: 'Erreur',
      text: error.message || "Échec de l'assignation",
      icon: 'error'
    });
    return -1;
  } finally {
    setLoading(false);
  }
};

  // Fonction pour simuler des sons
  const simulateSound = (type) => {
    if (!soundEnabled) return
    
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
  
      switch (type) {
        case "click":
          // Son original pour les clics
          oscillator.type = "sine"
          oscillator.frequency.value = 800
          gainNode.gain.value = 0.1
          oscillator.start()
          setTimeout(() => oscillator.stop(), 100)
          break
        case "cash": // Nouveau son de machine à billets
          oscillator.type = "square" // Forme d'onde carrée pour un son plus métallique
          oscillator.frequency.value = 150 + Math.random() * 50 // Légère variation aléatoire
          gainNode.gain.value = 0.08
          gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.08)
          oscillator.start()
          setTimeout(() => oscillator.stop(), 80)
          break
        case "win":
          // Son de victoire inchangé
          oscillator.type = "sine"
          oscillator.frequency.value = 600
          gainNode.gain.value = 0.1
          oscillator.start()
          setTimeout(() => { oscillator.frequency.value = 800 }, 100)
          setTimeout(() => { oscillator.frequency.value = 1000 }, 200)
          setTimeout(() => { oscillator.frequency.value = 1200 }, 300)
          setTimeout(() => oscillator.stop(), 500)
          break
      }
    } catch (error) {
      console.log("Audio API non supportée ou désactivée")
    }
  }


  const confirmAssignment = async () => {
    try {
      if (!assignmentResult || !assignmentResult?.matches) {
        throw new Error("No assignment result available");
      }
      console.log("***********",assignmentResult.matches[0].member_id)
      console.log("***********",taskId)

  
      const response = await fetch('https://lavoro-back.onrender.com/tasks/confirm-assignment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId: taskId,
          teamMemberId: assignmentResult.matches[0].member_id
        })
      });
  
      const result = await response.json();
      console.log("Confirmation de l'assignation:", result);
  
      if (result.success) {
        Swal.fire({
          title: 'Success!',
          text: 'Task has been assigned successfully',
          icon: 'success',
          confirmButtonText: 'OK'
        });
        
        // Mettre à jour l'état local si nécessaire
        setTask(prev => ({
          ...prev,
          assigned_to: [...(prev?.assigned_to || []), {
            member: assignmentResult.matches.member_id,
            assigned_at: new Date()
          }]
        }));
        
        // Réinitialiser l'état
        setAssignmentResult(null);
        setIsAssigned(false);
      } else {
        throw new Error(result.message || 'Failed to confirm assignment');
      }
    } catch (error) {
      console.error('Error confirming assignment:', error);
      Swal.fire({
        title: 'Error!',
        text: error.message || 'Failed to confirm assignment',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
  };

  // Fonction pour démarrer la rotation et l'assignation
  const startSpin = async () => {
    if (!isSpinning && members.length > 0) {
      simulateSound("click")
      setCounter(prev => prev + 1)
      setIsSpinning(true)
      setSpeed(20)
  
      // Démarrer l'animation avec le son de machine à billets
      intervalRef.current = setInterval(() => {
        setCurrentImageIndex(prev => (prev + 1) % members.length)
        simulateSound("cash") // Son de machine à billets à chaque changement
      }, 100)
  
      // Effectuer l'assignation après un délai
      setTimeout(async () => {
        const assignedIndex = await assignTask()
        
        // Ralentir l'animation
        clearInterval(intervalRef.current)
        let slowdownSpeed = 200
        
        const slowdownInterval = setInterval(() => {
          slowdownSpeed += 50
          setCurrentImageIndex(prev => (prev + 1) % members.length)
          simulateSound("cash") // Toujours le son de machine à billets
  
          if (slowdownSpeed > 500) {
            clearInterval(slowdownInterval)
            
            // Arrêter sur le membre assigné
            setTimeout(() => {
              setCurrentImageIndex(assignedIndex >= 0 ? assignedIndex : 0)
              setIsSpinning(false)
              simulateSound("win")
              setIsAssigned(true)
            }, 500)
          }
        }, slowdownSpeed)
      }, 2000)
    }
  }

  // Composants d'icônes
  const ArrowRightIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14"></path>
      <path d="m12 5 7 7-7 7"></path>
    </svg>
  )

  const RotateCwIcon = ({ spinning }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={spinning ? "spin-animation" : ""}>
      <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"></path>
      <path d="M21 3v5h-5"></path>
    </svg>
  )

  const SoundIcon = ({ enabled }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {enabled ? (
        <>
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
        </>
      ) : (
        <>
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
          <line x1="23" y1="9" x2="17" y2="15"></line>
          <line x1="17" y1="9" x2="23" y2="15"></line>
        </>
      )}
    </svg>
  )

  return (
    <div className="container-fluid">
      {/* Page Header avec le bouton son en haut à droite */}
      <div className="d-flex align-items-center justify-content-between page-header-breadcrumb flex-wrap gap-2">
        <div>
          <nav>
            <ol className="breadcrumb mb-1">
              <li className="breadcrumb-item"><a href="#!">Apps</a></li>
              <li className="breadcrumb-item"><a href="#!">Jobs</a></li>
              <li className="breadcrumb-item active">Candidate Details</li>
            </ol>
          </nav>
          <h1 className="page-title fw-medium fs-18 mb-0">Candidate Details</h1>
        </div>
        <div className="btn-list">
          <button className="btn btn-white btn-wave">
            <i className="ri-filter-3-line align-middle me-1"></i> Filter
          </button>
          <button className="btn btn-primary btn-wave">
            <i className="ri-share-forward-line me-1"></i> Share
          </button>
        </div>
      </div>
      
      <div className="wrapper">
        <div className="card">
            <div className="d-flex justify-content-end mb-3">
            <button 
            className="btn btn-primary rounded-pill btn-wave sound-toggle"
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? "Turn off sound" : "Turn on sound"}
          >
            <SoundIcon enabled={soundEnabled} />
            {soundEnabled ? "Sound on" : "Sound off"}
          </button>
            </div>
          <div className="grid-container">
            {/* Section de gauche */}
            <div className="text-section">
              <div className="text-container">
                <h2 className="task-title">{task ? task.taskTitle : "Loading task..."}</h2>

                {task && task.requiredSkills && (
                  <>
                    <p className="text-muted mb-2">Required Skills:</p>
                    <div className="d-flex flex-wrap gap-1 mb-3">
                      {task.requiredSkills.map((skill, index) => (
                        <span key={index} className="badge rounded-pill bg-info-transparent">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </>
                )}

                <div className="stat-row">
                  <div className="stat-dot pink-dot"></div>
                  <span className="text-muted">
                    Status: <span className="fw-bold stat-value" style={{ color: '#1a365d' }}>{isSpinning ? "In progress..." : "Ready"}</span>
                  </span>
                </div>
                <div className="text-decorative-circle"></div>
              </div>
            </div>
            {/* Flèche au milieu */}
            <div className="arrow-container">
              <div className="arrow-circle">
                <ArrowRightIcon />
              </div>
            </div>
            

            {/* Section de droite avec l'image */}
            <div className="image-section">
              <div className="image-container">
                <div className="image-round">
                  {members.length > 0 ? (
                    <>
                      <img
                        src={
                            members[currentImageIndex]?.user?.image?.startsWith('http') || 
                            members[currentImageIndex]?.user?.image?.startsWith('//')
                            ? members[currentImageIndex].user.image
                            : members[currentImageIndex]?.user?.image
                                ? `https://lavoro-back.onrender.com${members[currentImageIndex].user.image}`
                                : '/placeholder.svg'
                        }
                        alt={`Membre ${currentImageIndex + 1}`}
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                            e.target.src = '/placeholder.svg';
                            e.target.onerror = null;
                        }}
                        className={`member-image ${isSpinning ? 'image-blur' : ''}`}
                      />
                      {isSpinning && (
                        <div className="spin-overlay">
                          <RotateCwIcon spinning={true} />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="loading-members">
                      Chargement des membres...
                    </div>
                  )}
                </div>
                <div className="decorative-circle"></div>
              </div>
              
              {/* Nom du membre */}
              {members.length > 0 && (
                <div className="member-name" style={{ color: '#1a365d' }}>
                  {(members[currentImageIndex]?.user?.firstName || "Nom inconnu") + " " + (members[currentImageIndex]?.user?.lastName || "Nom inconnu")}
                </div>
              )}

              <div className="buttons-container">
                <button
                  onClick={startSpin}
                  className={`spin-button ${isSpinning || loading || members.length === 0 ? 'disabled' : ''}`}
                  disabled={isSpinning || loading || members.length === 0}
                >
                  <RotateCwIcon spinning={isSpinning} />
                  {loading ? "Assignation..." : isSpinning ? "Loading..." : "Assign Task"}
                </button>

                {isAssigned && !isSpinning && (
                  <button
                    className="confirm-button btn btn-success btn-wave"
                    onClick={confirmAssignment}
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    ) : (
                      "Confirm Assign"
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .wrapper {
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .card {
          border-radius: 0.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          padding: 1.5rem;
        }
        
        .grid-container {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
          align-items: center;
        }
        
        @media (min-width: 768px) {
          .grid-container {
            grid-template-columns: 3fr 1fr 3fr;
          }
        }
        
        .text-section {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        .gradient-text {
          font-size: 1.25rem;
          font-weight: 700;
          background: linear-gradient(to right, #6366F1, #D946EF);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        
        .description {
          color: #D1D5DB;
        }
        
        /* Conteneur pour la section de texte avec un léger fond et une ombre */
.text-container {
  position: relative;
  padding: 1.5rem;
  border-radius: 0.5rem;
  background-color: rgba(255, 255, 255, 0.05);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.text-decorative-circle {
  position: absolute;
  inset: -0.5rem;
  border-radius: 0.5rem;
  border: 2px dashed #6366F1;
  pointer-events: none;
}
        .stat-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .stat-dot {
          height: 0.75rem;
          width: 0.75rem;
          border-radius: 9999px;
        }
        
        .blue-dot {
          background-color: #6366F1;
        }
        
        .pink-dot {
          background-color: #D946EF;
        }
        
        .stat-text {
          color: #D1D5DB;
        }
        
        .stat-value {
          color: #FFFFFF;
          font-weight: 700;
        }
        
        .arrow-container {
          display: flex;
          justify-content: center;
        }
        
        .arrow-circle {
          background: linear-gradient(to right, #6366F1, #D946EF);
          padding: 0.75rem;
          border-radius: 9999px;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        
        .image-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }
        
        .image-container {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }
        
        .image-round {
          width: 12rem;
          height: 12rem;
          border-radius: 9999px;
          overflow: hidden;
          border: 4px solid #D946EF;
          box-shadow: 0 0 15px rgba(217, 70, 239, 0.2);
        }
        
        .member-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .image-blur {
          filter: blur(4px);
        }
        
        .spin-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: rgba(0, 0, 0, 0.3);
          border-radius: 9999px;
        }
        
        .decorative-circle {
          position: absolute;
          inset: -0.5rem;
          border-radius: 9999px;
          border: 2px dashed #6366F1;
          animation: spin 8s linear infinite;
        }
        
        .member-name {
          font-size: 1.25rem;
          font-weight: bold;
          color: #FFFFFF;
          text-align: center;
          margin-top: 0.5rem;
        }
          .buttons-container {
            display: flex;
            gap: 1rem;
            justify-content: center;
            width: 100%;
            max-width: 30rem;
            align-items: stretch;
          }
        
        .spin-button {
          margin-top: 0;
          flex: 1;
          margin-top: 1.5rem;
          width: 100%;
          max-width: 20rem;
          padding: 0.75rem 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          background: linear-gradient(to right, #6366F1, #D946EF);
          color: white;
          border-radius: 0.375rem;
          font-weight: 500;
          border: none;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          transform: translateY(0);
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        
        .spin-button:hover:not(.disabled) {
          opacity: 0.9;
          transform: translateY(-3px);
          box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        }
        
        .spin-button.disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        
        .skill-tag {
          display: inline-block;
          padding: 0.25rem 0.5rem;
          margin: 0.25rem;
          background-color: #6366F1;
          border-radius: 0.25rem;
          font-size: 0.8rem;
        }
        
        .loading-members {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100%;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .spin-animation {
          animation: spin 1s linear infinite;
        }

        /* Style pour le bouton son */
        .sound-toggle {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
         

.task-title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 1rem;
  background: linear-gradient(to right, #6366F1, #D946EF, #6366F1);
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 2px 4px rgba(0,0,0,0.1);
  position: relative;
  display: inline-block;
  animation: shine 3s linear infinite;
}

@keyframes shine {
  to {
    background-position: 200% center;
  }
}
  .confirm-button {
          flex: 1;
          height: 45px;
          margin-top: 1.5rem;
          min-width: 0;
          color: white;
          padding: 0.75rem 1.5rem;
          border-radius: 0.375rem;
          border: none;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            animation: fadeIn 0.5s ease-out;

        }
            @keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

        .confirm-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }

        .confirm-button:active {
          transform: translateY(0);
        }
      `}</style>
    </div>
  )
}