import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../app.css';

function ActivitiesPage() {
    const [tasks, setTasks] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    navigate('/auth');
                    return;
                }

                const response = await axios.get('https://lavoro-back.onrender.com/tasks/my-tasks', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    withCredentials: true
                });

                setTasks(response.data);
                setError(null);
            } catch (error) {
                console.error("Error fetching tasks:", error);
                if (error.response?.status === 401) {
                    localStorage.removeItem('token');
                    setError('Votre session a expiré. Veuillez vous reconnecter.');
                    navigate('/auth');
                } else {
                    setError('Une erreur est survenue lors de la récupération des activités');
                }
                setTasks([]);
            } finally {
                setLoading(false);
            }
        };

        fetchTasks();
    }, [navigate]);

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
        <div className={`tab-pane p-0 border-0 ${activeTab === "activities-tab-pane" ? "show active" : ""}`}>
        <div className="container activities-container">
          <h1 className="text-center mb-4">Mes Activités</h1>
          
          {tasks === null ? (
            <div className="text-center my-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Chargement...</span>
              </div>
            </div>
          ) : tasks.length === 0 ? (
            <div className="alert alert-info text-center">
              Aucune activité trouvée pour cet utilisateur.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped table-hover">
                <thead className="thead-dark">
                  <tr>
                    <th scope="col">Titre</th>
                    <th scope="col">Description</th>
                    <th scope="col">Statut</th>
                    <th scope="col">Priorité</th>
                    <th scope="col">Date de début</th>
                    <th scope="col">Date limite</th>
                    <th scope="col">Durée estimée</th>
                    <th scope="col">Projet</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map(task => (
                    <tr key={task._id}>
                      <td>{task.title}</td>
                      <td>{task.description}</td>
                      <td>
                        <span className={`badge ${task.status === 'Done' ? 'bg-success' : task.status === 'In Progress' ? 'bg-warning' : 'bg-secondary'}`}>
                          {task.status}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${task.priority === 'High' ? 'bg-danger' : task.priority === 'Medium' ? 'bg-warning' : 'bg-success'}`}>
                          {task.priority}
                        </span>
                      </td>
                      <td>{task.start_date ? new Date(task.start_date).toLocaleDateString() : 'N/A'}</td>
                      <td>{task.deadline ? new Date(task.deadline).toLocaleDateString() : 'N/A'}</td>
                      <td>{task.estimated_duration ? `${task.estimated_duration} heures` : 'N/A'}</td>
                      <td>{task.project?.name || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
}

export default ActivitiesPage;