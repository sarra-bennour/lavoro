import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import 'bootstrap/dist/css/bootstrap.min.css';
import './KanbanBoard.css';

const DeveloperKanbanBoard = () => {
    const [loading, setLoading] = useState(true); // State for loading status
    const navigate = useNavigate();

    const [tasks, setTasks] = useState({
        'Not Started': [],
        'In Progress': [],
        'In Review': [],
        'Done': []
    });

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                setLoading(true); // Ensure loading starts
                const response = await axios.get('https://lavoro-back.onrender.com/tasks/developer-kanban', {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                });

                setTasks(response.data.data || {
                    'Not Started': [],
                    'In Progress': [],
                    'In Review': [],
                    'Done': []
                });
            } catch (error) {
                console.error('Error fetching developer tasks:', error);
            } finally {
                setLoading(false); // This ensures loading stops whether successful or not
            }
        };

        fetchTasks();
    }, []);

    // Fetch tasks on component mount


    // Handle drag and drop
    const handleDragEnd = async (result) => {
        console.log('Drag end result:', result);
        if (!result.destination) return;

        const { source, destination, draggableId } = result;
        console.log(`Moving from ${source.droppableId} to ${destination.droppableId}`);

        // Make a deep copy of the current tasks state
        const newTasks = JSON.parse(JSON.stringify(tasks));

        // If dropped in the same column
        if (source.droppableId === destination.droppableId) {
            console.log(`Reordering within ${source.droppableId}`);

            // Get the column tasks
            const column = [...newTasks[source.droppableId]];

            // Remove the task from its original position
            const [removed] = column.splice(source.index, 1);

            // Insert the task at the new position
            column.splice(destination.index, 0, removed);

            // Update the state with the new order
            setTasks({
                ...newTasks,
                [source.droppableId]: column
            });

            console.log('Updated tasks state (same column):', {
                ...newTasks,
                [source.droppableId]: column
            });

            // Log the reordering for debugging
            console.log('Reordered tasks:', column.map((task, index) => ({
                taskId: task._id || `task-${index}`,
                order: index
            })));

            // Update order in database (commented out for now)
            // const updates = column.map((task, index) => ({
            //     taskId: task._id,
            //     order: index
            // }));
            //
            // await axios.post('https://lavoro-back.onrender.com/tasks/update-orders',
            //     { updates },
            //     { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
            // );
        }
        // If moved to a different column
        else {
            console.log(`Moving from ${source.droppableId} to ${destination.droppableId}`);

            // Get the source and destination columns
            const sourceColumn = [...newTasks[source.droppableId]];
            const destColumn = [...newTasks[destination.droppableId]];

            // Find the task to move
            const taskToMove = sourceColumn[source.index];

            if (!taskToMove) {
                console.error('Task not found at source index:', source.index);
                console.log('Source column:', sourceColumn);
                return;
            }

            console.log('Task to move:', taskToMove);

            // Remove the task from the source column
            sourceColumn.splice(source.index, 1);

            // Create a copy of the task with updated status
            const updatedTask = {
                ...taskToMove,
                status: destination.droppableId
            };

            // Insert the task into the destination column
            destColumn.splice(destination.index, 0, updatedTask);

            // Update the state with both columns
            const updatedTasks = {
                ...newTasks,
                [source.droppableId]: sourceColumn,
                [destination.droppableId]: destColumn
            };

            console.log('Updated tasks state:', updatedTasks);
            setTasks(updatedTasks);

            // Update task status in the database
            try {
                const taskId = taskToMove._id || draggableId;
                console.log(`Updating task ${taskId} status to ${destination.droppableId}`);

                await axios.patch(`https://lavoro-back.onrender.com/tasks/${taskId}/status`, {
                    status: destination.droppableId
                }, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });

                console.log(`Task ${taskId} status updated to ${destination.droppableId}`);
            } catch (error) {
                console.error('Error updating task status:', error);
                // Even if the API call fails, we keep the UI updated
            }

            // Log updates for debugging
            console.log('Source column after update:', sourceColumn);
            console.log('Destination column after update:', destColumn);
        }
    };

    // Column colors and icons
    const columnConfig = {
        'Not Started': { bg: 'bg-primary', icon: 'ri-inbox-line' },
        'In Progress': { bg: 'bg-primary2', icon: 'ri-refresh-line' },
        'In Review': { bg: 'bg-primary3', icon: 'ri-eye-line' },
        'Done': { bg: 'bg-secondary', icon: 'ri-checkbox-circle-line' },
        // Add fallback configuration
        'default': { bg: 'bg-light', icon: 'ri-question-line' }
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid">
            {/* Page Header */}
            <div className="d-flex align-items-center justify-content-between page-header-breadcrumb flex-wrap gap-2">
                <div>
                    <nav>
                        <ol className="breadcrumb mb-1">
                           

                            <li className="breadcrumb-item"><a href="javascript:void(0);">Task</a></li>
                            <span className="mx-1">→</span>

                            <li className="breadcrumb-item active" aria-current="page">Kanban Board</li>
                        </ol>
                    </nav>
                    <h1 className="page-title fw-medium fs-18 mb-0">Kanban Board</h1>
                </div>
                
            </div>

            {/* Kanban Board */}
            <DragDropContext onDragEnd={handleDragEnd}>
                <div className="TASK-kanban-board">
                    {Object.entries(tasks).map(([status, tasks]) => (
                        <div key={status} className="kanban-tasks-type">
                            <div className="pe-3 mb-3">
                                <div className={`d-flex justify-content-between align-items-center px-3 py-2 ${(columnConfig[status] || columnConfig.default).bg} text-fixed-white rounded`}>
                                    <span className="d-block fw-medium fs-15">
                                        <i className={`${(columnConfig[status] || columnConfig.default).icon} me-2`}></i>
                                        {status.toUpperCase()}
                                    </span>
                                    <div>
                                        <span className="badge badge-task text-fixed-white">{tasks.length}</span>
                                    </div>
                                </div>
                            </div>

                            <Droppable droppableId={status}>
                                {(provided) => (
                                    <div
                                        className="kanban-tasks"
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        style={{
                                            minHeight: '100px',
                                            padding: '8px',
                                            backgroundColor: provided.isDraggingOver ? '#f8f9fa' : 'transparent',
                                            borderRadius: '6px',
                                            transition: 'background-color 0.2s ease'
                                        }}
                                    >
                                        {tasks.map((task, index) => (
                                            <Draggable
                                                key={task._id || `task-${index}`}
                                                draggableId={task._id || `task-${index}`}
                                                index={index}
                                            >
                                                {(provided) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        className="card custom-card mb-3"
                                                        style={{
                                                            ...provided.draggableProps.style,
                                                            boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                                                            borderLeft: `4px solid ${task.priority === 'High' ? '#dc3545' : task.priority === 'Medium' ? '#0dcaf0' : '#ffc107'}`
                                                        }}
                                                    >
                                                        <div className="card-header justify-content-between">
                                                            <div className="task-badges d-flex gap-1 flex-wrap">
                                                                {task._id && (
                                                                    <span className="badge bg-primary1-transparent">#{task._id.slice(-4)}</span>
                                                                )}
                                                                {task.tags && Array.isArray(task.tags) && task.tags.map(tag => (
                                                                    <span key={tag} className="badge bg-info-transparent">{tag}</span>
                                                                ))}
                                                            </div>
                                                            <div className="dropdown">
                                                                <button className="btn btn-sm btn-light" type="button">
                                                                    <i className="ri-drag-move-fill"></i>
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div className="card-body">
                                                            <h6 className="fw-medium mb-1 fs-15">{task.title || 'Untitled Task'}</h6>
                                                            <p className="kanban-task-description text-muted small mb-2">
                                                                {task.description || 'No description provided'}
                                                            </p>
                                                            <div className="kanban-card-footer d-flex gap-2 mt-3">
                                                                <span className={`badge ${task.priority === 'High' ? 'bg-danger' : task.priority === 'Medium' ? 'bg-info' : 'bg-warning'}`}>
                                                                    {task.priority || 'Low'}
                                                                </span>
                                                                <span className="badge bg-success">
                                                                    {task.status}
                                                                </span>
                                                                <button
                                                                    className="btn btn-sm btn-primary-light ms-auto"
                                                                    onClick={() => navigate(`/developer/taskdetails/${task._id}`)}
                                                                >
                                                                    <i className="ri-eye-line me-1"></i>View
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div className="p-3 border-top border-block-start-dashed">
                                                            <div className="d-flex align-items-center justify-content-between">
                                                                <div className="avatar-list-stacked">
                                                                    {task.assigned_to && Array.isArray(task.assigned_to) && task.assigned_to.length > 0 ? (
                                                                        <>
                                                                            {task.assigned_to.slice(0, 3).map((member, idx) => (
                                                                                <span key={member._id || `member-${idx}`} className="avatar avatar-sm avatar-rounded">
                                                                                    <img src={member.image || '../assets/images/faces/11.jpg'} alt={member.name || 'Team Member'} />
                                                                                </span>
                                                                            ))}
                                                                            {task.assigned_to.length > 3 && (
                                                                                <span className="avatar avatar-sm bg-primary avatar-rounded text-fixed-white">
                                                                                    +{task.assigned_to.length - 3}
                                                                                </span>
                                                                            )}
                                                                        </>
                                                                    ) : (
                                                                        <span className="badge bg-light text-dark">Unassigned</span>
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <span className="me-2 text-secondary small">
                                                                        <i className="ri-calendar-line me-1"></i>
                                                                        {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No deadline'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>

                            <div className="d-flex view-more-button mt-3 gap-2 align-items-center">
                                <button className="btn btn-primary-light btn-wave flex-fill">
                                    View More
                                </button>
                                <button className="btn btn-secondary-light border btn-wave flex-fill">
                                    <i className="ri-add-line align-middle me-1 fw-medium"></i>Add Task
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </DragDropContext>
        </div>
    );
};

export default DeveloperKanbanBoard;