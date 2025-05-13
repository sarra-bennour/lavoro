import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PerformancePodium = () => {
  const [topPerformers, setTopPerformers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTopPerformers = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');

        // Récupérer les 3 meilleurs performeurs parmi les membres d'équipe
        const response = await axios.get('https://lavoro-back.onrender.com/teamMember/top-performers?limit=3', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        console.log('Top performers data:', response.data);
        setTopPerformers(response.data || []);
        setLoading(false);
      } catch (err) {
        console.error('Erreur lors de la récupération des meilleurs performeurs:', err);
        setError('Impossible de charger les données des meilleurs performeurs');
        setLoading(false);
      }
    };

    fetchTopPerformers();
  }, []);

  if (loading) {
    return (
      <div className="card custom-card">
        <div className="card-body text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card custom-card">
        <div className="card-body text-center">
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (topPerformers.length === 0) {
    return (
      <div className="card custom-card">
        <div className="card-header">
          <div className="card-title">Podium des Performances</div>
          <span className="ms-auto shadow-lg fs-17"><i className="ri-award-fill text-warning"></i></span>
        </div>
        <div className="card-body text-center">
          <div className="alert alert-info">
            <i className="ri-information-line me-2"></i>
            Aucun membre avec des points de performance trouvé.
          </div>
          <p className="text-muted">Les employés apparaîtront sur le podium lorsqu'ils auront accumulé des points en complétant des tâches.</p>
        </div>
      </div>
    );
  }

  // S'assurer que les performeurs sont triés par points (au cas où l'API ne les trie pas)
  const sortedPerformers = [...topPerformers].sort((a, b) => {
    const pointsA = a.points || a.performancePoints || 0;
    const pointsB = b.points || b.performancePoints || 0;
    return pointsB - pointsA; // Tri décroissant
  });

  // Organiser les performeurs pour le podium (2e, 1er, 3e)
  const podiumOrder = [];

  if (sortedPerformers.length >= 1) podiumOrder[1] = sortedPerformers[0]; // 1er au milieu
  if (sortedPerformers.length >= 2) podiumOrder[0] = sortedPerformers[1]; // 2e à gauche
  if (sortedPerformers.length >= 3) podiumOrder[2] = sortedPerformers[2]; // 3e à droite

  // Couleurs pour chaque position
  const positionColors = ['bg-secondary', 'bg-warning', 'bg-danger-transparent text-danger'];
  const positionIcons = [
    <i className="ri-medal-fill"></i>,
    <i className="ri-trophy-fill"></i>,
    <i className="ri-award-fill"></i>
  ];
  const podiumHeights = ['150px', '180px', '120px'];

  // Styles pour les animations
  const podiumAnimation = {
    animation: 'slideUp 0.8s ease-out forwards',
    opacity: 0,
    transform: 'translateY(20px)'
  };

  const avatarAnimation = {
    animation: 'pulse 2s infinite'
  };

  // CSS pour les animations
  const animationStyles = `
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }
  `;

  return (
    <div className="card custom-card">
      <style>{animationStyles}</style>
      <div className="card-header">
        <div className="card-title">Performance Podium</div>
        <span className="ms-auto shadow-lg fs-17"><i className="ri-award-fill text-warning"></i></span>
      </div>
      <div className="card-body">
        <div className="row align-items-end justify-content-center text-center mb-4" style={{ height: '250px' }}>
          {podiumOrder.map((performer, index) => (
            performer ? (
              <div key={index} className="col-4">
                <div className="d-flex flex-column align-items-center">
                  {/* Position */}
                  <div className="position-relative mb-2">
                    <span className={`badge ${positionColors[index]} position-absolute top-0 start-100 translate-middle rounded-pill`} style={{ zIndex: 1 }}>
                      {index === 0 ? '2' : index === 1 ? '1' : '3'}
                    </span>
                    {/* Avatar */}
                    <span className="avatar avatar-lg avatar-rounded">
                      <img
                        src={performer.image?.startsWith('http') ? performer.image : `https://lavoro-back.onrender.com${performer.image}`}
                        alt={`${performer.firstName || performer.fullName?.split(' ')[0]} ${performer.lastName || performer.fullName?.split(' ')[1]}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          ...avatarAnimation
                        }}
                      />
                    </span>
                  </div>

                  {/* Nom et points */}
                  <h6 className="mb-1 fs-13">{performer.firstName || performer.fullName?.split(' ')[0]} {performer.lastName || performer.fullName?.split(' ')[1]}</h6>
                  <span className={`badge ${positionColors[index]} mb-3`}>
                    {positionIcons[index]} {performer.points || performer.performancePoints} pts
                  </span>

                  {/* Podium */}
                  <div
                    className={`${positionColors[index].replace('text-danger', '')} rounded-top d-flex align-items-center justify-content-center shadow-sm`}
                    style={{
                      width: '80%',
                      height: podiumHeights[index],
                      marginTop: 'auto',
                      transition: 'all 0.3s ease',
                      ...podiumAnimation,
                      animationDelay: `${index * 0.2}s`
                    }}
                  >
                    <span className="text-white fw-bold">{index === 0 ? '2' : index === 1 ? '1' : '3'}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div key={index} className="col-4">
                <div className="d-flex flex-column align-items-center">
                  <div className="avatar avatar-lg avatar-rounded bg-light mb-2 d-flex align-items-center justify-content-center">
                    <i className="ri-user-add-line text-muted"></i>
                  </div>
                  <h6 className="mb-1 fs-13 text-muted">Position {index === 0 ? '2' : index === 1 ? '1' : '3'}</h6>
                  <span className="badge bg-light text-muted mb-3">En attente</span>

                  <div
                    className="bg-light rounded-top d-flex align-items-center justify-content-center"
                    style={{
                      width: '80%',
                      height: podiumHeights[index],
                      marginTop: 'auto',
                      opacity: 0.5
                    }}
                  >
                    <span className="text-muted">{index === 0 ? '2' : index === 1 ? '1' : '3'}</span>
                  </div>
                </div>
              </div>
            )
          ))}
        </div>

        <div className="bg-light rounded-3 py-2 text-center mb-3 " >
          <span className="text-muted"></span>
        </div>

        <div className="alert alert-primary-transparent mt-3">
          <div className="d-flex">
            <div className="me-3">
              <i className="ri-trophy-line fs-24"></i>
            </div>
            <div>
              <h6 className="fw-semibold">Congratulations!</h6>
              <p className="mb-0">These employees achieved the highest performance scores this month.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformancePodium;
