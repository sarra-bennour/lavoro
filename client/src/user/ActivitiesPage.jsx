import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css'; // Import Bootstrap first

function ActivitiesPage() {
    const [tasks, setTasks] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const response = await axios.get('https://lavoro-back.onrender.com/users/mytasks', { withCredentials: true });
                setTasks(response.data);
            } catch (err) {
                console.error("Error fetching tasks:", err);
                if (err.response?.status === 404) {
                    alert("The tasks endpoint was not found. Please check the backend.");
                } else {
                    alert("An error occurred while fetching tasks. Please try again later.");
                }
                navigate('/signin'); // Redirect to login if there's an error
            }
        };

        fetchTasks();
    }, [navigate]);

    return (
        <div className="d-flex justify-content-center align-items-center vh-100">
            <div className="container activities-container"> {/* Ajoutez la classe ici */}
                <h1 className="text-center mb-4">Mes Activités</h1>
                <div className="table-responsive">
                    <table className="table table-striped table-hover">
                        <thead className="thead-dark">
                            <tr>
                                <th scope="col">Titre</th>
                                <th scope="col">Description</th>
                                <th scope="col">Statut</th>
                                <th scope="col">Priorité</th>
                                <th scope="col">Date de début</th>
                                <th scope="col">Date de fin</th>
                                <th scope="col">Durée estimée</th>
                                <th scope="col">Tags</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tasks.map(task => (
                                <tr key={task._id}>
                                    <td>{task.title}</td>
                                    <td>{task.description}</td>
                                    <td>
                                        <span className={`badge ${task.status === 'Completed' ? 'bg-success' : task.status === 'In Progress' ? 'bg-warning' : 'bg-secondary'}`}>
                                            {task.status}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`badge ${task.priority === 'High' ? 'bg-danger' : task.priority === 'Medium' ? 'bg-warning' : 'bg-success'}`}>
                                            {task.priority}
                                        </span>
                                    </td>
                                    <td>{new Date(task.start_date).toLocaleDateString()}</td>
                                    <td>{new Date(task.deadline).toLocaleDateString()}</td>
                                    <td>{task.estimated_duration} jours</td>
                                    <td>
                                        {task.tags && task.tags.join(', ')} {/* Affiche les tags séparés par une virgule */}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default ActivitiesPage;