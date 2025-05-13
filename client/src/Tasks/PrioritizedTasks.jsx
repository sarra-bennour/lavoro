import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../App.css';
import { Dropdown } from 'react-bootstrap';

// Données de test pour les tâches (utilisées uniquement si l'API ne renvoie pas de données)
const mockTasks = [
  {
    _id: 'mock1',
    title: 'Développer une API REST',
    description: 'Créer une API REST pour le projet',
    status: 'In Progress',
    priority: 'High',
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours à partir d'aujourd'hui
    estimated_duration: 5,
    priority_score: 85,
    project: { name: 'Projet Demo' }
  },
  {
    _id: 'mock2',
    title: 'Concevoir l\'interface utilisateur',
    description: 'Créer les maquettes et l\'interface utilisateur',
    status: 'Not Started',
    priority: 'Medium',
    deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 jours à partir d'aujourd'hui
    estimated_duration: 8,
    priority_score: 60,
    project: { name: 'Projet Demo' }
  },
  {
    _id: 'mock3',
    title: 'Tester l\'application',
    description: 'Effectuer des tests unitaires et d\'intégration',
    status: 'Not Started',
    priority: 'Low',
    deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 jours à partir d'aujourd'hui
    estimated_duration: 3,
    priority_score: 30,
    project: { name: 'Projet Demo' }
  }
];

// Style pour l'animation de l'infobulle
const tooltipStyle = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const PrioritizedTasks = () => {
  const [prioritizedTasks, setPrioritizedTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredTask, setHoveredTask] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  // Définir des valeurs constantes pour les états qui étaient contrôlés par des boutons
  const autoRefresh = true; // Toujours actif
  const darkMode = true; // Toujours en mode sombre
  const [filterOptions, setFilterOptions] = useState({
    status: 'all', // 'all', 'In Progress', 'Not Started', 'Done'
    priority: 'all', // 'all', 'High', 'Medium', 'Low'
    sortBy: 'score', // 'score', 'deadline', 'title'
    maxItems: 10 // Nombre maximum d'éléments à afficher
  });
  const navigate = useNavigate();

  // Référence pour l'intervalle de rafraîchissement
  const refreshIntervalRef = useRef(null);

  // Fonction pour récupérer les tâches normales et priorisées
  const fetchTasks = async () => {
    try {
      console.log('Rafraîchissement des données de priorisation...');
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/signin');
        return;
      }

      // Essayer d'abord de récupérer les données depuis l'API
      try {
        const response = await axios.get('https://lavoro-back.onrender.com/ai-prioritization/my-tasks', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        // Vérifier si nous avons des données valides
        if (response.data && response.data.data) {
          if (response.data.data.length > 0) {
            // Stocker les tâches priorisées
            setPrioritizedTasks(response.data.data);

            setError(null);
            setLoading(false);
            return;
          } else {
            // L'API a répondu mais il n'y a pas de tâches
            console.log("API returned empty tasks array, showing empty state");
            setPrioritizedTasks([]);
            setError(null);
            setLoading(false);
            return;
          }
        }
      } catch (apiError) {
        console.error("API error, using mock data instead:", apiError);
      }

      // Si l'API ne répond pas correctement, utiliser des données de test
      console.log("Using mock data for demonstration");

      // Trier les tâches par score de priorité pour l'affichage priorisé
      setPrioritizedTasks([...mockTasks].sort((a, b) => b.priority_score - a.priority_score));

      setError(null);
    } catch (error) {
      console.error("Error in fetchTasks:", error);
      setError('Une erreur est survenue lors de la récupération des tâches');
      setPrioritizedTasks([]);
    } finally {
      setLoading(false);
    }
  };

  // Charger les tâches au chargement du composant et configurer le rafraîchissement automatique
  useEffect(() => {
    // Charger les tâches immédiatement
    fetchTasks();

    // Configurer l'intervalle de rafraîchissement automatique (toutes les 5 secondes)
    if (autoRefresh) {
      refreshIntervalRef.current = setInterval(() => {
        fetchTasks();
      }, 5000);
    }

    // Nettoyer l'intervalle lors du démontage du composant
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [autoRefresh, navigate]); // Dépendances: rafraîchir si ces états changent

  // La fonction refreshData a été supprimée car elle n'est plus utilisée



  // Fonction pour appliquer les filtres et le tri aux tâches
  const applyFilters = () => {
    let filtered = [...prioritizedTasks];

    // Filtrer par statut
    if (filterOptions.status !== 'all') {
      filtered = filtered.filter(task => task.status === filterOptions.status);
    }

    // Filtrer par priorité
    if (filterOptions.priority !== 'all') {
      filtered = filtered.filter(task => task.priority === filterOptions.priority);
    }

    // Trier les tâches
    switch (filterOptions.sortBy) {
      case 'score':
        filtered.sort((a, b) => b.priority_score - a.priority_score);
        break;
      case 'deadline':
        filtered.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
        break;
      case 'title':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      default:
        filtered.sort((a, b) => b.priority_score - a.priority_score);
    }

    // Limiter le nombre d'éléments
    filtered = filtered.slice(0, filterOptions.maxItems);

    setFilteredTasks(filtered);
  };

  // Fonction pour mettre à jour les options de filtrage
  const updateFilterOption = (key, value) => {
    setFilterOptions(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Appliquer les filtres chaque fois que les options ou les tâches changent
  useEffect(() => {
    applyFilters();
  }, [filterOptions, prioritizedTasks]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <style>{tooltipStyle}</style>

      {/* Infobulle améliorée qui suit le curseur */}
      {hoveredTask && (
        <div style={{
          position: 'fixed',
          top: mousePosition.y + 10,
          left: mousePosition.x + 10,
          backgroundColor: darkMode ? 'rgba(33, 37, 41, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          color: darkMode ? 'white' : '#333',
          padding: '12px 16px',
          borderRadius: '8px',
          zIndex: 9999,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          border: darkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
          fontSize: '12px',
          maxWidth: '320px',
          animation: 'fadeIn 0.15s ease-in-out',
          pointerEvents: 'none', // Pour que l'infobulle n'interfère pas avec les événements de la souris
          backdropFilter: 'blur(5px)'
        }}>
          <div style={{
            marginBottom: '8px',
            fontWeight: '600',
            color: darkMode ? '#fff' : '#333',
            fontSize: '14px',
            borderBottom: darkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
            paddingBottom: '6px'
          }}>
            {hoveredTask.title}
          </div>

          {hoveredTask.description && (
            <div style={{
              marginBottom: '8px',
              fontSize: '12px',
              color: darkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)',
              fontStyle: 'italic'
            }}>
              {hoveredTask.description.length > 100
                ? hoveredTask.description.substring(0, 100) + '...'
                : hoveredTask.description}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '6px' }}>
              <i className="ri-calendar-line" style={{ marginRight: '6px', color: '#ffc107', fontSize: '12px' }}></i>
              <span style={{ fontSize: '11px' }}>
                <strong>Date limite:</strong><br/>
                {hoveredTask.deadline ? new Date(hoveredTask.deadline).toLocaleDateString() : 'Non définie'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '6px' }}>
              <i className="ri-time-line" style={{ marginRight: '6px', color: '#17a2b8', fontSize: '12px' }}></i>
              <span style={{ fontSize: '11px' }}>
                <strong>Durée estimée:</strong><br/>
                {hoveredTask.estimated_duration || hoveredTask.duration || 'Non définie'} {(hoveredTask.estimated_duration || hoveredTask.duration) === 1 ? 'jour' : 'jours'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '6px' }}>
              <i className="ri-flag-line" style={{ marginRight: '6px', color: '#28a745', fontSize: '12px' }}></i>
              <span style={{ fontSize: '11px' }}>
                <strong>Statut:</strong><br/>
                <span className={`badge ${hoveredTask.status === 'Done' ? 'bg-success' : hoveredTask.status === 'In Progress' ? 'bg-warning' : 'bg-secondary'}`}>
                  {hoveredTask.status}
                </span>
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '6px' }}>
              <i className="ri-price-tag-3-line" style={{ marginRight: '6px', color: '#dc3545', fontSize: '12px' }}></i>
              <span style={{ fontSize: '11px' }}>
                <strong>Priorité:</strong><br/>
                <span className={`badge ${hoveredTask.priority === 'High' ? 'bg-danger' : hoveredTask.priority === 'Medium' ? 'bg-warning' : 'bg-success'}`}>
                  {hoveredTask.priority}
                </span>
              </span>
            </div>
          </div>

          <div style={{
            marginTop: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: darkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
            paddingTop: '8px'
          }}>
            <div>
              <i className="ri-ai-generate" style={{ marginRight: '6px', color: '#6f42c1', fontSize: '12px' }}></i>
              <span style={{ fontSize: '11px', fontWeight: '600' }}>Score IA: {Math.round(hoveredTask.priority_score)}</span>
            </div>

            {hoveredTask.project && (
              <div>
                <i className="ri-folder-line" style={{ marginRight: '6px', color: '#fd7e14', fontSize: '12px' }}></i>
                <span style={{ fontSize: '11px' }}>{hoveredTask.project.name}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="card custom-card">
        <div className="card-header">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h5 className="card-title mb-0">Priorisation des Tâches par IA</h5>
              <small className="text-muted d-block">
                <i className="ri-ai-generate me-1"></i>
                Tâches triées par priorité calculée par intelligence artificielle
              </small>
            </div>
            {/* Boutons supprimés */}
          </div>
        </div>

        {/* Barre de filtres */}
        <div className="card-header border-bottom border-block-end-dashed py-2">
          <div className="row g-3 align-items-center">
            <div className="col-md-auto">
              <label className="form-label mb-0 me-2">Statut:</label>
              <Dropdown className="d-inline-block">
                <Dropdown.Toggle variant="outline-secondary" size="sm" id="status-dropdown">
                  {filterOptions.status === 'all' ? 'Tous' : filterOptions.status}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item onClick={() => updateFilterOption('status', 'all')}>Tous</Dropdown.Item>
                  <Dropdown.Item onClick={() => updateFilterOption('status', 'In Progress')}>In Progress</Dropdown.Item>
                  <Dropdown.Item onClick={() => updateFilterOption('status', 'Not Started')}>Not Started</Dropdown.Item>
                  <Dropdown.Item onClick={() => updateFilterOption('status', 'Done')}>Done</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </div>

            <div className="col-md-auto">
              <label className="form-label mb-0 me-2">Priorité:</label>
              <Dropdown className="d-inline-block">
                <Dropdown.Toggle variant="outline-secondary" size="sm" id="priority-dropdown">
                  {filterOptions.priority === 'all' ? 'Toutes' : filterOptions.priority}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item onClick={() => updateFilterOption('priority', 'all')}>Toutes</Dropdown.Item>
                  <Dropdown.Item onClick={() => updateFilterOption('priority', 'High')}>High</Dropdown.Item>
                  <Dropdown.Item onClick={() => updateFilterOption('priority', 'Medium')}>Medium</Dropdown.Item>
                  <Dropdown.Item onClick={() => updateFilterOption('priority', 'Low')}>Low</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </div>

            <div className="col-md-auto">
              <label className="form-label mb-0 me-2">Trier par:</label>
              <Dropdown className="d-inline-block">
                <Dropdown.Toggle variant="outline-secondary" size="sm" id="sort-dropdown">
                  {filterOptions.sortBy === 'score' ? 'Score IA' :
                   filterOptions.sortBy === 'deadline' ? 'Date limite' : 'Titre'}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item onClick={() => updateFilterOption('sortBy', 'score')}>Score IA</Dropdown.Item>
                  <Dropdown.Item onClick={() => updateFilterOption('sortBy', 'deadline')}>Date limite</Dropdown.Item>
                  <Dropdown.Item onClick={() => updateFilterOption('sortBy', 'title')}>Titre</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </div>

            <div className="col-md-auto">
              <label className="form-label mb-0 me-2">Afficher:</label>
              <Dropdown className="d-inline-block">
                <Dropdown.Toggle variant="outline-secondary" size="sm" id="limit-dropdown">
                  {filterOptions.maxItems} tâches
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item onClick={() => updateFilterOption('maxItems', 5)}>5 tâches</Dropdown.Item>
                  <Dropdown.Item onClick={() => updateFilterOption('maxItems', 10)}>10 tâches</Dropdown.Item>
                  <Dropdown.Item onClick={() => updateFilterOption('maxItems', 15)}>15 tâches</Dropdown.Item>
                  <Dropdown.Item onClick={() => updateFilterOption('maxItems', 20)}>20 tâches</Dropdown.Item>
                  <Dropdown.Item onClick={() => updateFilterOption('maxItems', 50)}>50 tâches</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </div>

            {/* Switch de mode sombre supprimé */}
          </div>
        </div>
        <div className="card-body">
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          {!error && filteredTasks.length === 0 && (
            <div className="alert alert-info text-center">
              Aucune tâche trouvée. Essayez de modifier les filtres ou de rafraîchir les données.
            </div>
          )}

          {!error && (
            <div>
              {/* Affichage ML avec pyramide */}
                <div className="row">
                  <div className="col-xl-12">
                    <div className="card custom-card">
                      <div className="card-header">
                        <div className="card-title">Priorité des Tâches</div>
                      </div>
                      <div className="card-body">
                        <div id="pyramid-chart" style={{ height: '700px', width: '100%' }}>
                          {/* Pyramide visuelle créée manuellement */}
                          <div className="pyramid-container" style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-start',
                            marginTop: '40px',
                            marginLeft: '40px',
                            position: 'relative',
                            width: '90%',
                            backgroundColor: darkMode ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.5)',
                            padding: '20px',
                            borderRadius: '10px',
                            boxShadow: darkMode ? 'inset 0 0 10px rgba(0, 0, 0, 0.2)' : 'inset 0 0 10px rgba(0, 0, 0, 0.05)'
                          }}>

                            {/* Titre de la pyramide */}
                            <h5 style={{
                              textAlign: 'left',
                              marginBottom: '15px',
                              color: darkMode ? '#fff' : '#333',
                              textShadow: darkMode ? '0 0 10px rgba(0,0,0,0.5)' : 'none',
                              width: '100%',
                              fontSize: '18px',
                              fontWeight: '600',
                              letterSpacing: '0.5px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}>
                              <i className="ri-ai-generate" style={{ color: '#6f42c1', fontSize: '20px' }}></i>
                              Priorisation Intelligente des Tâches
                            </h5>

                            {/* Légende en haut */}
                            <div style={{
                              display: 'flex',
                              flexDirection: 'row',
                              gap: '15px',
                              marginBottom: '25px',
                              backgroundColor: darkMode ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.7)',
                              padding: '10px 15px',
                              borderRadius: '8px',
                              alignSelf: 'flex-start',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                              border: darkMode ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
                              flexWrap: 'wrap'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{
                                  width: '14px',
                                  height: '14px',
                                  backgroundColor: '#dc3545',
                                  borderRadius: '3px',
                                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                                }}></div>
                                <span style={{
                                  color: darkMode ? '#fff' : '#333',
                                  fontSize: '12px',
                                  fontWeight: '500'
                                }}>Priorité élevée (70+)</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{
                                  width: '14px',
                                  height: '14px',
                                  backgroundColor: '#ffc107',
                                  borderRadius: '3px',
                                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                                }}></div>
                                <span style={{
                                  color: darkMode ? '#fff' : '#333',
                                  fontSize: '12px',
                                  fontWeight: '500'
                                }}>Priorité moyenne (40-70)</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{
                                  width: '14px',
                                  height: '14px',
                                  backgroundColor: '#28a745',
                                  borderRadius: '3px',
                                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                                }}></div>
                                <span style={{
                                  color: darkMode ? '#fff' : '#333',
                                  fontSize: '12px',
                                  fontWeight: '500'
                                }}>Priorité faible (&lt;40)</span>
                              </div>
                            </div>


                            {filteredTasks.map((task, index) => {
                              // Calculer la largeur en fonction du score et de la position
                              const maxWidth = 90; // Largeur maximale en pourcentage
                              const minWidth = 30; // Largeur minimale en pourcentage
                              const totalTasks = filteredTasks.length;
                              const position = index / (totalTasks - 1 || 1); // 0 pour le premier, 1 pour le dernier
                              const width = maxWidth - position * (maxWidth - minWidth);

                              // Déterminer la couleur en fonction du score
                              const color = task.priority_score >= 70 ? '#dc3545' :
                                          task.priority_score >= 40 ? '#ffc107' : '#28a745';

                              return (
                                <div
                                  key={task._id || task.task_id}
                                  className="pyramid-level"
                                  style={{
                                    width: `${width}%`,
                                    backgroundColor: color,
                                    padding: '12px 15px',
                                    marginBottom: '6px',
                                    textAlign: 'center',
                                    color: 'white',
                                    fontWeight: '500',
                                    borderRadius: '4px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    boxShadow: '0 3px 6px rgba(0,0,0,0.2)',
                                    transition: 'all 0.3s ease',
                                    cursor: 'pointer',
                                    border: '1px solid rgba(255,255,255,0.1)'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateX(5px)';
                                    e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.3)';
                                    e.currentTarget.style.width = `${width + 5}%`;
                                    setHoveredTask(task);
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateX(0)';
                                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
                                    e.currentTarget.style.width = `${width}%`;
                                    setHoveredTask(null);
                                  }}
                                  onMouseMove={(e) => {
                                    setMousePosition({ x: e.clientX, y: e.clientY });
                                  }}
                                >
                                  <span style={{
                                    flex: 1,
                                    textAlign: 'left',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    fontSize: index === 0 ? '14px' : index === 1 ? '13px' : '12px',
                                    letterSpacing: '0.3px',
                                    textShadow: '0 1px 1px rgba(0,0,0,0.2)'
                                  }}>
                                    {index === 0 && '🏆 '}
                                    {index === 1 && '🥈 '}
                                    {index === 2 && '🥉 '}
                                    {task.title}
                                  </span>
                                  <span style={{
                                    marginLeft: '10px',
                                    backgroundColor: 'rgba(255,255,255,0.15)',
                                    padding: '3px 8px',
                                    borderRadius: '12px',
                                    fontSize: index === 0 ? '13px' : index === 1 ? '12px' : '11px',
                                    fontWeight: '600',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                                    border: '1px solid rgba(255,255,255,0.2)'
                                  }}>
                                    {Math.round(task.priority_score)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>


                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrioritizedTasks;