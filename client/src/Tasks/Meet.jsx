import { useState, useEffect, useRef } from "react"
import moment from "moment"
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction"
import SimpleBar from "simplebar-react"
import "simplebar-react/dist/simplebar.min.css"
// Import Bootstrap CSS but not JS components directly
import 'bootstrap/dist/css/bootstrap.min.css'
import { Draggable } from "@fullcalendar/interaction"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import Swal from "sweetalert2";
import { Calendar, momentLocalizer } from 'react-big-calendar';
import { Modal, Button, Form, List, Typography, Space, Select } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const { Title, Text } = Typography;
const localizer = momentLocalizer(moment);

// Simple custom tooltip class
class CustomTooltip {
  constructor(element, options = {}) {
    this.element = element;
    this.title = options.title || '';
    this.placement = options.placement || 'top';
    this.container = options.container || 'body';
    this.trigger = options.trigger || 'hover';
    this.html = options.html || false;
    this.tooltipEl = null;
    this.createTooltipElement();

    if (this.trigger === 'hover') {
      this.element.addEventListener('mouseenter', () => this.show());
      this.element.addEventListener('mouseleave', () => this.hide());
    } else if (this.trigger === 'manual') {
      // Manual trigger is handled externally
    }
  }

  createTooltipElement() {
    this.tooltipEl = document.createElement('div');
    this.tooltipEl.className = 'custom-tooltip';
    this.tooltipEl.style.position = 'absolute';
    this.tooltipEl.style.zIndex = '1070';
    this.tooltipEl.style.display = 'none';
    this.tooltipEl.style.maxWidth = '200px';
    this.tooltipEl.style.padding = '0.5rem';
    this.tooltipEl.style.color = '#fff';
    this.tooltipEl.style.textAlign = 'center';
    this.tooltipEl.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    this.tooltipEl.style.borderRadius = '0.25rem';

    if (this.html) {
      this.tooltipEl.innerHTML = this.title;
    } else {
      this.tooltipEl.textContent = this.title;
    }

    document.querySelector(this.container).appendChild(this.tooltipEl);
  }

  updateContent(content) {
    if (this.html) {
      this.tooltipEl.innerHTML = content;
    } else {
      this.tooltipEl.textContent = content;
    }
  }

  show() {
    if (!this.tooltipEl) return;

    const rect = this.element.getBoundingClientRect();
    this.tooltipEl.style.display = 'block';

    if (this.placement === 'top') {
      this.tooltipEl.style.top = `${rect.top - this.tooltipEl.offsetHeight - 5}px`;
      this.tooltipEl.style.left = `${rect.left + (rect.width / 2) - (this.tooltipEl.offsetWidth / 2)}px`;
    } else if (this.placement === 'bottom') {
      this.tooltipEl.style.top = `${rect.bottom + 5}px`;
      this.tooltipEl.style.left = `${rect.left + (rect.width / 2) - (this.tooltipEl.offsetWidth / 2)}px`;
    }
  }

  hide() {
    if (this.tooltipEl) {
      this.tooltipEl.style.display = 'none';
    }
  }

  dispose() {
    if (this.tooltipEl) {
      this.tooltipEl.remove();
      this.tooltipEl = null;
    }

    if (this.trigger === 'hover') {
      this.element.removeEventListener('mouseenter', () => this.show());
      this.element.removeEventListener('mouseleave', () => this.hide());
    }
  }
}

const MeetComponent = () => {
  const [allTasks, setAllTasks] = useState([])
  const [calendarTasks, setCalendarTasks] = useState([])
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const calendarRef = useRef(null)
  const draggableRef = useRef(null)
  // Add references for tooltip instances to clean them up properly
  const tooltipInstances = useRef([])
  const navigate = useNavigate()
  const [events, setEvents] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    participants: []
  });
  const [allDevelopers, setAllDevelopers] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);

  // Service intégré pour les tâches
  const taskService = {
    getTasksList: async (userId) => {
      const token = localStorage.getItem("token")
      const response = await axios.get(`https://lavoro-back.onrender.com/tasks/getTasksList/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      })
      return response.data
    },
    updateTaskCalendarDates: async (taskId, start, end, userId) => {
      const token = localStorage.getItem("token")
      const data = { start, end, userId }
      if (start !== undefined) data.start = start
      if (end !== undefined) data.end = end

      const response = await axios.put(`https://lavoro-back.onrender.com/tasks/updateCalendarDates/${taskId}`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      })
      return response.data
    },
  }

  const handleRemoveTask = async (taskId) => {
    // Vérification des permissions
    if (user?.role.RoleName !== "Team Manager") {
      await Swal.fire({
        title: "Permission Denied",
        text: "You don't have permission to delete tasks",
        icon: "error",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    // Confirmation dialog
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    });

    // Si l'utilisateur confirme la suppression
    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.delete(
          `https://lavoro-back.onrender.com/tasks/${taskId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true,
          }
        );

        if (response.data.success) {
          // Mise à jour de l'état local
          setAllTasks((prev) => prev.filter((task) => task._id !== taskId));

          // Message de succès
          await Swal.fire({
            title: "Deleted!",
            text: "The task has been deleted.",
            icon: "success",
            confirmButtonColor: "#3085d6",
          });

          // Rechargement des données si nécessaire
          const tasksResponse = await taskService.getTasksList(user._id);
          if (tasksResponse.success) {
            const tasks = tasksResponse.data;
            if (user.role.RoleName === "Team Manager") {
              setCalendarTasks(tasks.filter((task) => task.start_date || task.deadline));
              setAllTasks(tasks.filter((task) => !task.start_date && !task.deadline));
            } else {
              setCalendarTasks(tasks.filter((task) => task.calendar_dates?.start));
              setAllTasks(tasks.filter((task) => !task.calendar_dates?.start));
            }
          }
        } else {
          await Swal.fire({
            title: "Error",
            text: response.data.message || "Failed to delete task",
            icon: "error",
            confirmButtonColor: "#3085d6",
          });
        }
      } catch (error) {
        console.error("Error deleting task:", error);
        await Swal.fire({
          title: "Error",
          text: error.response?.data?.message || "Failed to delete task",
          icon: "error",
          confirmButtonColor: "#3085d6",
        });
      }
    }
  };

  // Fetch tasks from API
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/signin");
          return;
        }

        const userResponse = await axios.get("https://lavoro-back.onrender.com/users/me", {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });

        if (userResponse.data) {
          setUser(userResponse.data);
          // Fetch tasks after user is set
          const tasksResponse = await taskService.getTasksList(userResponse.data._id);
          if (tasksResponse.success) {
            const tasks = tasksResponse.data;
            if (userResponse.data.role.RoleName === "Team Manager") {
              setCalendarTasks(tasks.filter((task) => task.start_date || task.deadline));
              setAllTasks(tasks.filter((task) => !task.start_date && !task.deadline));
            } else {
              setCalendarTasks(tasks.filter((task) =>
                task.calendar_dates?.start ||
                (task.status === "Done" && (task.start_date || task.deadline))
              ));
              setAllTasks(tasks.filter((task) =>
                !task.calendar_dates?.start &&
                !(task.status === "Done" && (task.start_date || task.deadline))
              ));
            }
          }
          // Fetch meetings after user is set
          await fetchMeetings(); // Call fetchMeetings here
          await fetchDevelopers();
        } else {
          navigate("/signin");
        }
      } catch (error) {
        console.error("Error fetching initial data:", error);
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/signin");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, [navigate]); // taskService is stable, no need to add if it's an object defined outside

  const getTaskClassName = (task) => {
    if (task.status === "In Progress") {
      return "bg-warning-transparent"
    } else if (task.status === "Done") {
      return "bg-success-transparent"
    } else if (task.status === "Not Started") {
      if (task.priority === "High") {
        return "bg-danger-transparent"
      } else if (task.priority === "Medium") {
        return "bg-info-transparent"
      } else {
        return "bg-secondary-transparent"
      }
    }
    return "bg-primary-transparent"
  }

  const getTaskColor = (task) => {
    if (task.status === "In Progress") {
      return "orange"
    } else if (task.status === "Done") {
      return "green"
    } else if (task.status === "Not Started") {
      if (task.priority === "High") {
        return "red"
      } else if (task.priority === "Medium") {
        return "blue"
      } else {
        return "gray"
      }
    }
    return "blue"
  }

  const transformAndCombineEvents = (tasks, meetings) => {
    const taskEvents = tasks.map(task => ({
      id: task._id,
      title: task.title,
      start: task.calendar_dates?.start ? new Date(task.calendar_dates.start) : new Date(task.start_date),
      end: task.calendar_dates?.end ? new Date(task.calendar_dates.end) : (task.deadline ? moment(task.deadline).add(1, 'days').toDate() : moment(task.start_date).add(1,'days').toDate() ),
      allDay: user?.role.RoleName === "Developer" ? !task.calendar_dates?.start : true, // Tasks are allDay unless dev explicitly sets time
      className: getTaskClassName(task),
      color: getTaskColor(task), // Make sure getTaskColor is defined
      extendedProps: {
        ...task,
        type: 'task', // Identify as task
        userRole: user?.role.RoleName // Pass userRole for event change handling
      }
    }));

    const meetingEvents = meetings.map(meeting => ({
      id: meeting.id, // Already mapped in fetchMeetings
      title: meeting.title,
      start: meeting.start, // Already a Date object from fetchMeetings
      end: meeting.end,     // Already a Date object from fetchMeetings
      allDay: meeting.allDay, // Should be false from fetchMeetings
      // You can add specific className or color for meetings if desired
      // className: 'fc-event-meeting', 
      // color: '#007bff', // Example color for meetings
      extendedProps: {
        ...meeting, // Spread all properties from the meeting object (description, meetingLink, etc.)
        type: 'meeting' // Ensure type is correctly set
      }
    }));
    return [...taskEvents, ...meetingEvents];
  };

  // This will be used by FullCalendar's events prop
  const allEvents = transformAndCombineEvents(calendarTasks, events);

  const handleEventClick = async (clickInfo) => {
    const eventType = clickInfo.event.extendedProps.type;

    if (eventType === 'meeting') {
      // For meetings, we directly use the extendedProps which should contain all meeting details
      setSelectedEvent(clickInfo.event.extendedProps);
      setIsModalVisible(true);
    } else if (eventType === 'task') {
      // Existing logic for task click
      if (clickInfo.event.extendedProps.status === "Done") {
        return; // Do nothing for completed tasks
      }
      const taskId = clickInfo.event.id;
      // Find task in calendarTasks as it's the source for calendar task events
      const task = calendarTasks.find((t) => t._id === taskId); 

      if (task && user) {
        // Confirmation before removing from calendar
        const result = await Swal.fire({
          title: 'Remove from Calendar?',
          text: "Do you want to remove this task from your calendar view?",
          icon: 'question',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Yes, remove it!',
          cancelButtonText: 'Cancel'
        });

        if (result.isConfirmed) {
          try {
            // API call to update task (remove calendar_dates or set start_date/deadline to null)
            await taskService.updateTaskCalendarDates(taskId, null, null, user._id);

            // Create a copy of the task without the calendar-specific dates
            let taskToList;
            if (user.role.RoleName === "Team Manager") {
              // For Team Manager, tasks removed from calendar might mean clearing start/deadline
              // Or simply moving it back to allTasks if it was only on calendar due to those dates
              const { start_date, deadline, ...rest } = task;
              taskToList = rest; 
            } else { // Developer
              const { calendar_dates, ...rest } = task;
              taskToList = rest;
            }
            
            // Update UI states
            setAllTasks((prev) => [...prev, taskToList]); // Add back to the "My Tasks" list
            setCalendarTasks((prev) => prev.filter((t) => t._id !== taskId)); // Remove from calendar tasks state

            // No need to call clickInfo.event.remove() as state update will re-render FullCalendar
            // clickInfo.event.remove(); // This might cause issues if FullCalendar re-renders from state change

            await Swal.fire(
              'Removed!',
              'The task has been removed from your calendar.',
              'success'
            );

          } catch (error) {
            console.error("Error removing task from calendar:", error);
            Swal.fire(
              'Error!',
              'Failed to remove task from calendar.',
              'error'
            );
          }
        }
      }
    } else {
      // Handle unknown event type or events without a type
      console.warn("Clicked on an event with unknown type:", clickInfo.event);
    }
  };

  const transformTasksToEvents = (tasks) => {
    return tasks.map((task) => {
      let eventStart, eventEnd;

      const createValidDate = (date) => {
        if (!date) return null;
        const d = new Date(date);
        return isNaN(d.getTime()) ? null : moment(d);
      };

      // Logique inchangée pour Team Manager
      if (user?.role.RoleName === "Team Manager" || task.status === "Done") {
        eventStart = createValidDate(task.start_date) || createValidDate(task.deadline) || moment();
        eventEnd = createValidDate(task.deadline) || moment(eventStart).add(1, 'day');
      }
      // Correction pour les développeurs
      else {
        // Priorité aux dates calendar_dates si définies
        if (task.calendar_dates?.start) {
          eventStart = createValidDate(task.calendar_dates.start);
          eventEnd = task.calendar_dates.end
            ? createValidDate(task.calendar_dates.end)
            : moment(eventStart).add(1, 'day');

          // Contrainte aux dates originales start_date/deadline
          if (task.start_date) {
            const minDate = createValidDate(task.start_date);
            if (eventStart.isBefore(minDate)) {
              eventStart = minDate.clone();
            }
          }
          if (task.deadline) {
            const maxDate = createValidDate(task.deadline);
            if (eventEnd.isAfter(moment(maxDate).add(1, 'day'))) {
              eventEnd = moment(maxDate).add(1, 'day').clone();
            }
          }
        }
        // Fallback sur start_date/deadline si pas de calendar_dates
        else if (task.start_date || task.deadline) {
          eventStart = task.start_date
            ? createValidDate(task.start_date)
            : createValidDate(task.deadline);
          eventEnd = task.deadline
            ? createValidDate(task.deadline)
            : createValidDate(task.start_date);

          // Ajustement pour avoir une durée minimale d'un jour
          if (!eventEnd || eventEnd.isSameOrBefore(eventStart)) {
            eventEnd = moment(eventStart).add(1, 'day');
          } else {
            eventEnd = moment(eventEnd).add(1, 'day'); // Pour inclure le dernier jour
          }
        }
        // Fallback: aujourd'hui si aucune date
        else {
          eventStart = moment();
          eventEnd = moment().add(1, 'day');
        }
      }

      // Validation finale
      if (eventEnd.isSameOrBefore(eventStart)) {
        eventEnd = moment(eventStart).add(1, 'day');
      }

      return {
        id: task._id,
        title: task.title,
        start: eventStart.toDate(),
        end: eventEnd.toDate(),
        className: getTaskClassName(task),
        color: getTaskColor(task),
        editable: task.status !== "Done",
        extendedProps: {
          ...task,
          isCalendarEvent: false,
        },
        allDay: true,
      };
    });
  }

  // Initialize draggable and dark mode
  useEffect(() => {
    if (!isLoading && user) {
      const containerEl = document.getElementById("external-events");
      if (containerEl) {
        draggableRef.current = new Draggable(containerEl, {
          itemSelector: ".fc-event",
          eventData: (eventEl) => {
            const taskId = eventEl.getAttribute("data-task-id");
            const task = allTasks.find((t) => t._id === taskId);

            let start, end;

            if (user.role.RoleName === "Team Manager") {
              start = task.start_date ? new Date(task.start_date) : new Date();
              end = task.deadline ? new Date(task.deadline) : moment(start).add(1, "day").toDate();
            } else {
              // Pour les développeurs, utiliser start_date/deadline comme dates par défaut si elles existent
              if (task.start_date && task.deadline) {
                start = new Date(task.start_date);
                end = new Date(task.deadline);
              } else if (task.start_date) {
                start = new Date(task.start_date);
                end = moment(start).add(1, "day").toDate();
              } else if (task.deadline) {
                start = new Date(task.deadline);
                end = moment(start).add(1, "day").toDate();
              } else {
                start = new Date();
                end = moment(start).add(1, "day").toDate();
              }
            }

            return {
              id: taskId,
              title: task.title,
              start: start,
              end: end,
              className: getTaskClassName(task),
              color: getTaskColor(task),
              extendedProps: {
                ...task,
                isCalendarEvent: false,
              },
              allDay: true,
            };
          },
        });
      }

      const darkModeMediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
      setIsDarkMode(darkModeMediaQuery.matches)
      const handler = (e) => setIsDarkMode(e.matches)
      darkModeMediaQuery.addListener(handler)

      // Initialize any tooltips for static elements
      const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
      tooltipTriggerList.forEach((tooltipTriggerEl) => {
        const tooltip = new CustomTooltip(tooltipTriggerEl, {
          title: tooltipTriggerEl.getAttribute('title') || tooltipTriggerEl.getAttribute('data-bs-original-title'),
          placement: 'top',
          trigger: 'hover'
        });
        tooltipInstances.current.push(tooltip);
      });

      return () => {
        darkModeMediaQuery.removeListener(handler)
        if (draggableRef.current) {
          draggableRef.current.destroy()
        }

        // Cleanup tooltips
        tooltipInstances.current.forEach(tooltip => {
          if (tooltip && typeof tooltip.dispose === 'function') {
            tooltip.dispose();
          }
        });
        tooltipInstances.current = [];
      }
    }
  }, [isLoading, allTasks, user])

  // Appliquer directement les styles au DOM lorsque isDarkMode change
  useEffect(() => {
    if (calendarRef.current) {
      const calendarEl = calendarRef.current.elRef.current
      if (calendarEl) {
        const headerCells = calendarEl.querySelectorAll(".fc-col-header, .fc-col-header-cell")
        const headerTexts = calendarEl.querySelectorAll(".fc-col-header-cell-cushion")

        if (isDarkMode) {
          headerCells.forEach((cell) => {
            cell.style.backgroundColor = "#121212"
            cell.style.borderColor = "rgba(255, 255, 255, 0.2)"
          })

          headerTexts.forEach((text) => {
            text.style.color = "#ffffff"
          })
        } else {
          headerCells.forEach((cell) => {
            cell.style.backgroundColor = "#ffffff"
            cell.style.borderColor = "#ddd"
          })

          headerTexts.forEach((text) => {
            text.style.color = "#212529"
          })
        }
      }
    }
  }, [isDarkMode, calendarTasks]) // Dépend aussi de calendarTasks pour s'assurer que le calendrier est rendu


  const fetchDevelopers = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
          console.warn("No token found, cannot fetch developers.");
          return;
      }
      const response = await axios.get('https://lavoro-back.onrender.com/users/getAllDevelopers', {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        setAllDevelopers(response.data.data);
      } else {
        console.error('Failed to fetch developers or data format is incorrect:', response.data);
        setAllDevelopers([]); 
      }
    } catch (error) {
      console.error('Error fetching developers:', error);
      setAllDevelopers([]); 
      Swal.fire('Error', 'Could not load developer list for participant selection.', 'error');
    }
  };


  const handleEventReceive = async (eventInfo) => {
    const taskId = eventInfo.event.id;
    const task = allTasks.find((t) => t._id === taskId);

    if (task && user) {
      try {
        let start = new Date(eventInfo.event.start);
        let end = eventInfo.event.end ? new Date(eventInfo.event.end) : moment(start).add(1, "day").toDate();

        // Logique spécifique développeur
        if (user.role.RoleName === "Developer") {
          const taskStartDate = task.start_date ? new Date(task.start_date) : null;
          const taskDeadline = task.deadline ? new Date(task.deadline) : null;

          // Contrainte aux dates originales
          if (taskStartDate && start < taskStartDate) {
            start = new Date(taskStartDate);
            end = moment(start).add(1, "day").toDate();
          }

          if (taskDeadline && end > new Date(taskDeadline.setDate(taskDeadline.getDate() + 1))) {
            end = new Date(taskDeadline.setDate(taskDeadline.getDate() + 1));
            start = moment(end).subtract(1, "day").toDate();
          }

          // Calcul de la durée maximale autorisée
          if (taskStartDate && taskDeadline) {
            const maxDuration = moment(taskDeadline).diff(moment(taskStartDate), "days") + 1;
            const desiredDuration = moment(end).diff(moment(start), "days");
            const duration = Math.min(desiredDuration, maxDuration);

            end = moment(start).add(duration, "days").toDate();
          }
        }

        // Mise à jour différenciée
        if (user.role.RoleName === "Team Manager" || task.status === "Done") {
          await taskService.updateTaskCalendarDates(taskId, start, end, user._id);
          const updatedTask = {
            ...task,
            start_date: start,
            deadline: end,
          };
          setCalendarTasks((prev) => [...prev, updatedTask]);
        } else {
          await taskService.updateTaskCalendarDates(taskId, start, end, user._id);
          const updatedTask = {
            ...task,
            calendar_dates: {
              start: start,
              end: end,
              original_start: task.start_date,
              original_end: task.deadline
            },
          };
          setCalendarTasks((prev) => [...prev, updatedTask]);
        }

        eventInfo.event.setDates(start, end);
        setAllTasks((prev) => prev.filter((t) => t._id !== taskId));
      } catch (error) {
        console.error("Error updating calendar dates:", error);
        eventInfo.event.remove();
      }
    }
  };

  const handleEventChange = async (changeInfo) => {
    const taskId = changeInfo.event.id;
    const task = calendarTasks.find((t) => t._id === taskId);
    const userRole = changeInfo.event.extendedProps.userRole;

    if (!task || !userRole) {
      changeInfo.revert();
      return;
    }

    try {
      let newStart = changeInfo.event.start ? new Date(changeInfo.event.start) : null;
      let newEnd = changeInfo.event.end ? new Date(changeInfo.event.end) : moment(newStart).add(1, "day").toDate();

      // Validation des dates
      if (!newStart || isNaN(newStart.getTime())) {
        throw new Error("Invalid start date");
      }
      if (!newEnd || isNaN(newEnd.getTime())) {
        throw new Error("Invalid end date");
      }

      // Pour les développeurs, vérifier les contraintes de dates
      if (userRole === "Developer") {
        const originalStart = task.start_date ? new Date(task.start_date) : null;
        const originalEnd = task.deadline ? new Date(task.deadline) : null;

        // Si la tâche a des dates originales, on vérifie les contraintes
        if (originalStart && originalEnd) {
          // On ne permet pas de sortir de l'intervalle original
          if (newStart < originalStart) {
            newStart = new Date(originalStart);
            newEnd = moment(newStart).add(moment(newEnd).diff(moment(newStart), 'days'), 'days').toDate();
          }

          if (newEnd > moment(originalEnd).add(1, 'day').toDate()) {
            newEnd = moment(originalEnd).add(1, 'day').toDate();
            if (newStart >= newEnd) {
              newStart = moment(newEnd).subtract(1, 'day').toDate();
            }
          }

          // On vérifie que la durée ne dépasse pas la durée originale
          const originalDuration = moment(originalEnd).diff(moment(originalStart), 'days') + 1;
          const newDuration = moment(newEnd).diff(moment(newStart), 'days');

          if (newDuration > originalDuration) {
            newEnd = moment(newStart).add(originalDuration, 'days').toDate();
          }
        }
      }

      // Préparer les données de mise à jour
      const updateData = {
        start: newStart,
        end: newEnd,
        userId: user._id
      };

      // Envoyer la requête
      const response = await taskService.updateTaskCalendarDates(taskId, updateData.start, updateData.end, user._id);

      if (!response.success) {
        throw new Error(response.message || "Failed to update dates");
      }

      // Mettre à jour l'état local
      const updatedTasks = calendarTasks.map((t) => {
        if (t._id === taskId) {
          if (userRole === "Team Manager") {
            return {
              ...t,
              start_date: newStart,
              deadline: newEnd,
            };
          } else {
            return {
              ...t,
              calendar_dates: {
                start: newStart,
                end: newEnd,
                // On conserve les dates originales
                original_start: t.start_date,
                original_end: t.deadline
              },
            };
          }
        }
        return t;
      });

      setCalendarTasks(updatedTasks);
    } catch (error) {
      console.error("Error updating calendar dates:", error);
      await Swal.fire({
        title: "Error",
        text: error.response?.data?.error || error.message || "Failed to update dates",
        icon: "error",
        confirmButtonColor: "#3085d6",
      });
      changeInfo.revert();
    }
  };

  const fetchMeetings = async () => {
    try {
        const token = localStorage.getItem("token");
        const response = await axios.get('https://lavoro-back.onrender.com/meet/getAllMeet', {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            withCredentials: true,
        });
        const meetings = response.data.map(meeting => ({
            id: meeting._id,
            title: meeting.title,
            start: new Date(meeting.start_time),
            end: new Date(meeting.end_time),
            description: meeting.description,
            meetingLink: meeting.meeting_link,
            participants: meeting.participants
        }));
        setEvents(meetings);
    } catch (error) {
        console.error('Error fetching meetings:', error);
    }
  };

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    setIsEditMode(false);
    setIsModalVisible(true);
  };

  const handleAddMeeting = () => {
    setSelectedEvent(null);
    setFormData({
      title: '',
      description: '',
      start_time: '',
      end_time: '',
      participants: []
    });
    setIsEditMode(false);
    setIsModalVisible(true);
  };

  const handleInputChange = (e_or_value, name_for_select) => {
    if (name_for_select === 'participants') { 
      setFormData(prev => ({
        ...prev,
        participants: e_or_value 
      }));
    } else { 
      const { name, value } = e_or_value.target;
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        const token = localStorage.getItem("token");
        if (!token) {
          // Handle missing token, perhaps redirect to login or show an error
          Swal.fire({
              title: "Error",
              text: "Authentication token not found. Please log in again.",
              icon: "error",
              confirmButtonColor: "#3085d6",
          });
          return;
        }

        // Decode the token to get user ID
        const tokenParts = token.split('.');
        if (tokenParts.length !== 3) {
          Swal.fire({
              title: "Error",
              text: "Invalid token format.",
              icon: "error",
              confirmButtonColor: "#3085d6",
          });
          return;
        }
        const payload = JSON.parse(atob(tokenParts[1]));
        const userId = payload._id;
        console.log("Organizer User ID:", userId); // As requested

        const meetingData = {
            ...formData,
            start_time: new Date(formData.start_time).toISOString(),
            end_time: new Date(formData.end_time).toISOString(),
            organizer_id: userId // Use the userId from token
        };
        
        await axios.post('https://lavoro-back.onrender.com/meet/addMeet', meetingData, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            withCredentials: true,
        });
        fetchMeetings();
        setIsModalVisible(false);
        setFormData({
            title: '',
            description: '',
            start_time: '',
            end_time: '',
            participants: []
        });
    } catch (error) {
        console.error('Error creating meeting:', error);
        let errorMessage = "Failed to create meeting";
        if (error.response && error.response.data && error.response.data.message) {
            errorMessage = error.response.data.message;
        } else if (error.message) {
            errorMessage = error.message;
        }
        Swal.fire({
            title: "Error",
            text: errorMessage,
            icon: "error",
            confirmButtonColor: "#3085d6",
        });

    }
  };

  const handleEditMeeting = () => {
    if (!selectedEvent) return;
    setIsEditMode(true);
    // Ensure date-times are in 'YYYY-MM-DDTHH:mm' format for datetime-local input
    const formatDateTimeLocal = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      // Adjust for timezone offset to display correctly in local time input
      const timezoneOffset = date.getTimezoneOffset() * 60000; //offset in milliseconds
      const localISOTime = new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
      return localISOTime;
    };

    setFormData({
      title: selectedEvent.title || '',
      description: selectedEvent.description || '',
      start_time: formatDateTimeLocal(selectedEvent.start),
      end_time: formatDateTimeLocal(selectedEvent.end),
      // Ensure participants are just an array of IDs
      participants: selectedEvent.participants ? selectedEvent.participants.map(p => (typeof p === 'object' && p._id) ? p._id : p).filter(id => id) : []
    });
    // setIsModalVisible(true); // Modal should already be visible
  };

  const handleUpdateMeeting = async (e) => {
    if (e) e.preventDefault(); // Prevent default if called by a form submit event directly
    if (!selectedEvent || !selectedEvent.id) {
      Swal.fire("Error", "No meeting selected for update.", "error");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        Swal.fire("Error", "Authentication token not found.", "error");
        return;
      }
      const tokenParts = token.split('.');
      const payload = JSON.parse(atob(tokenParts[1]));
      const userId = payload._id;

      const meetingData = {
        ...formData,
        organizer_id: userId, // Ensure organizer_id is included
        start_time: new Date(formData.start_time).toISOString(),
        end_time: new Date(formData.end_time).toISOString(),
      };

      await axios.put(`https://lavoro-back.onrender.com/meet/updateMeet/${selectedEvent.id}`, meetingData, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });

      fetchMeetings();
      setIsModalVisible(false);
      setIsEditMode(false);
      Swal.fire("Success", "Meeting updated successfully!", "success");
    } catch (error) {
      console.error('Error updating meeting:', error);
      Swal.fire("Error", error.response?.data?.message || "Failed to update meeting.", "error");
    }
  };

  const handleDeleteMeeting = async () => {
    if (!selectedEvent || !selectedEvent.id) {
      Swal.fire("Error", "No meeting selected for deletion.", "error");
      return;
    }

    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const token = localStorage.getItem("token");
          await axios.delete(`https://lavoro-back.onrender.com/meet/deleteMeet/${selectedEvent.id}`, {
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true,
          });
          fetchMeetings();
          setIsModalVisible(false);
          Swal.fire(
            'Deleted!',
            'Your meeting has been deleted.',
            'success'
          );
        } catch (error) {
          console.error('Error deleting meeting:', error);
          Swal.fire("Error", error.response?.data?.message || "Failed to delete meeting.", "error");
        }
      }
    });
  };

  const eventStyleGetter = (event) => {
    return {
      style: {
        backgroundColor: '#1890ff',
        borderRadius: '5px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    };
  };

  if (isLoading) {
    return (
      <div id="loader" className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`page ${isDarkMode ? "dark-mode" : ""}`}>
      <div className="container-fluid">
        <div className="d-flex align-items-center justify-content-between page-header-breadcrumb flex-wrap gap-2">
          <div>
            <nav>
              <ol className="breadcrumb mb-1">
                <li className="breadcrumb-item">
                  <a href="javascript:void(0);">Tasks</a>
                </li>
                <span className="mx-1">→</span>

                <li className="breadcrumb-item active" aria-current="page">
                  Task Meet
                </li>
              </ol>
            </nav>
            <h1 className="page-title fw-medium fs-18 mb-0">Task Meet</h1>
          </div>
          <div className="btn-list d-flex align-items-center gap-2">
            <button 
              className="btn btn-primary btn-wave" 
              onClick={handleAddMeeting}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <i className="ri-add-line"></i>
              Add Meeting
            </button>
            <button className="btn btn-white btn-wave" data-bs-toggle="tooltip" title="Filter tasks">
              <i className="ri-filter-3-line align-middle me-1 lh-1"></i> Filter
            </button>
          </div>
        </div>

        <div className="row">
          <div className="col-xl-9">
            <div className="card custom-card">
              <div className="card-header">
                <div className="card-title">Task Timeline</div>
              </div>
              <div className="card-body">
                <FullCalendar
                  ref={calendarRef}
                  plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                  initialView="dayGridMonth"
                  headerToolbar={{
                    left: "prev,next today",
                    center: "title",
                    right: "dayGridMonth,timeGridWeek,timeGridDay",
                  }}
                  editable={true}
                  selectable={true}
                  droppable={true}
                  events={allEvents}
                  eventClick={handleEventClick}
                  eventDrop={handleEventChange}
                  eventResize={handleEventChange}
                  eventReceive={handleEventReceive}
                  height="auto"
                  eventDisplay="block"
                  displayEventTime={false}
                  dayMaxEventRows={true}
                  eventMinHeight={30}
                  eventContent={(arg) => (
                    <div className="fc-event-content">
                      <div className="fc-event-title">{arg.event.title}</div>
                      <div className="fc-event-status">{arg.event.extendedProps.status}</div>
                    </div>
                  )}
                  eventDidMount={(arg) => {
                    if (arg.event.extendedProps.status === "Done") {
                      const tooltip = new CustomTooltip(arg.el, {
                        title: "This task is completed and cannot be modified",
                        placement: "top",
                        trigger: "hover",
                        container: "body",
                      });
                      tooltipInstances.current.push(tooltip);
                    } else {
                      const tooltip = new CustomTooltip(arg.el, {
                        title: `
                                            <strong>${arg.event.title}</strong><br/>
                                            <em>${arg.event.extendedProps.description || "No description"}</em><br/>
                                            <strong>Displayed Dates:</strong> ${new Date(arg.event.start).toLocaleDateString()} - ${new Date(arg.event.end).toLocaleDateString()}<br/>
                                            ${arg.event.extendedProps.tags ? "<strong>Tags:</strong> " + arg.event.extendedProps.tags.join(", ") : ""}
                                        `,
                        html: true,
                        placement: "top",
                        trigger: "manual",
                        container: "body",
                      });
                      tooltipInstances.current.push(tooltip);

                      const showTooltip = () => tooltip.show();
                      const hideTooltip = () => tooltip.hide();
                      const handleDocumentClick = (e) => {
                        if (!arg.el.contains(e.target)) {
                          hideTooltip();
                        }
                      };

                      arg.el.addEventListener("mouseenter", showTooltip);
                      arg.el.addEventListener("mouseleave", hideTooltip);
                      document.addEventListener("click", handleDocumentClick);

                      // Return cleanup function for when the event unmounts
                      return () => {
                        arg.el.removeEventListener("mouseenter", showTooltip);
                        arg.el.removeEventListener("mouseleave", hideTooltip);
                        document.removeEventListener("click", handleDocumentClick);

                        // Find and remove this tooltip from the instances array
                        const index = tooltipInstances.current.indexOf(tooltip);
                        if (index !== -1) {
                          tooltipInstances.current.splice(index, 1);
                        }

                        tooltip.dispose();
                      };
                    }
                  }}
                  datesSet={() => {
                    // Force l'application des styles après chaque changement de vue
                    setTimeout(() => {
                      if (calendarRef.current) {
                        const calendarEl = calendarRef.current.elRef.current
                        if (calendarEl) {
                          const headerCells = calendarEl.querySelectorAll(".fc-col-header, .fc-col-header-cell")
                          const headerTexts = calendarEl.querySelectorAll(".fc-col-header-cell-cushion")

                          if (isDarkMode) {
                            headerCells.forEach((cell) => {
                              cell.style.backgroundColor = "#121212"
                              cell.style.borderColor = "rgba(255, 255, 255, 0.2)"
                            })

                            headerTexts.forEach((text) => {
                              text.style.color = "#ffffff"
                            })
                          } else {
                            headerCells.forEach((cell) => {
                              cell.style.backgroundColor = "#ffffff"
                              cell.style.borderColor = "#ddd"
                            })

                            headerTexts.forEach((text) => {
                              text.style.color = "#212529"
                            })
                          }
                        }
                      }
                    }, 0)
                  }}
                />
              </div>
            </div>
          </div>

          <div className="col-xl-3">
            <div className="card custom-card">
              <div className="card-header justify-content-between">
                <div className="card-title">My Tasks</div>
              </div>
              <div className="card-body p-0">
                <div id="external-events" className="mb-0 p-3 list-unstyled column-list">
                  {allTasks.map((task, index) => (
                    <div
                      key={`task-${index}`}
                      className={`fc-event fc-h-event fc-daygrid-event fc-daygrid-block-event mb-1 ${getTaskClassName(task)}`}
                      data-class={getTaskClassName(task)}
                      data-task-id={task._id}
                    >
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <div className="fc-event-main">{task.title}</div>
                          <div className="fc-event-dates">
                            {task.start_date && new Date(task.start_date).toLocaleDateString()}
                            {task.deadline && ` - ${new Date(task.deadline).toLocaleDateString()}`}
                          </div>
                        </div>
                        {user?.role.RoleName === "Team Manager" && (
                          <i
                            className="ri-close-line"
                            style={{
                              cursor: 'pointer',
                              marginLeft: '8px',
                              opacity: '0.7',
                              transition: 'opacity 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                            onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (task.status === 'Not Started') {
                                await handleRemoveTask(task._id);
                              } else {
                                await Swal.fire({
                                  title: 'Cannot Delete Task',
                                  text: 'Only tasks with "Not Started" status can be deleted',
                                  icon: 'error',
                                  confirmButtonColor: "#3085d6",
                                });
                              }
                            }}
                          >
                          </i>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

{isModalVisible && (selectedEvent && isEditMode || !selectedEvent) && (
  <div 
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}
  >
    <div 
      style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        width: '500px',
        maxHeight: '90vh',
        overflowY: 'auto',
        color: isDarkMode ? 'white' : '#333', 
        background: isDarkMode ? '#2c2c2c' : 'white' 
      }}
    >
      <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '20px' }}>
        {isEditMode ? "Edit Meeting" : "Add New Meeting"}
      </h3>
      <form onSubmit={isEditMode ? handleUpdateMeeting : handleSubmit}>
        {/* Form fields (title, description, participants, start_time, end_time) go here */}
        {/* Title */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Title</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            required
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
          />
        </div>
        {/* Description */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', minHeight: '100px' }}
          />
        </div>
        {/* Participants */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Participants</label>
          <Select
            mode="multiple"
            allowClear
            style={{ width: '100%' }}
            placeholder="Select participants"
            value={formData.participants} 
            onChange={(value) => handleInputChange(value, 'participants')}
            optionFilterProp="children"
            filterOption={(input, option) => {
              let label = '';
              if (Array.isArray(option.children)) {
                label = option.children.join('');
              } else if (option.children) {
                label = String(option.children);
              }
              return label.toLowerCase().includes(input.toLowerCase());
            }}
            getPopupContainer={triggerNode => triggerNode.parentNode}
          >
            {allDevelopers.map(dev => (
              <Select.Option key={dev._id} value={dev._id}>
                {dev.firstName} {dev.lastName} ({dev.email})
              </Select.Option>
            ))}
          </Select>
        </div>
        {/* Start Time */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Start Time</label>
          <input
            type="datetime-local"
            name="start_time"
            value={formData.start_time}
            onChange={handleInputChange}
            required
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
          />
        </div>
        {/* End Time */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>End Time</label>
          <input
            type="datetime-local"
            name="end_time"
            value={formData.end_time}
            onChange={handleInputChange}
            required
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
          />
        </div>
        <div style={{ textAlign: 'right', marginTop: '20px' }}>
          <button 
            type="button" 
            onClick={() => { setIsModalVisible(false); setIsEditMode(false); }}
            style={{
              marginRight: '10px',
              padding: '10px 15px',
              backgroundColor: '#ccc',
              color: 'black',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            style={{
              padding: '10px 15px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {isEditMode ? "Save Changes" : "Create Meeting"}
          </button>
        </div>
      </form>
    </div>
  </div>
)}

{isModalVisible && selectedEvent && !isEditMode && (
  <Modal
    title="Meeting Details"
    visible={isModalVisible}
    onCancel={() => {
      setIsModalVisible(false);
      setIsEditMode(false);
    }}
    footer={[
      <Button key="close" onClick={() => { setIsModalVisible(false); setIsEditMode(false); }}>Close</Button>,
      <Button key="delete" type="danger" onClick={handleDeleteMeeting} style={{ backgroundColor: 'red', color: 'white' }}>Delete</Button>,
      <Button key="edit" type="primary" onClick={handleEditMeeting} style={{ backgroundColor: '#1890ff', color: 'white' }}>Edit</Button>,
    ]}
  >
    <div>
      <h4>{selectedEvent.title}</h4>
      <p>Start: {moment(selectedEvent.start).format('MMMM Do YYYY, h:mm a')}</p>
      <p>End: {moment(selectedEvent.end).format('MMMM Do YYYY, h:mm a')}</p>
      <p>Description: {selectedEvent.description}</p>
      <div style={{ marginTop: '20px' }}>
        <a href={selectedEvent.meetingLink} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', padding: '8px 16px', backgroundColor: '#1890ff', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>
          Join Meeting
        </a>
      </div>
      <div style={{ marginTop: '20px' }}>
        <h5>Participants</h5>
        {selectedEvent.participants && selectedEvent.participants.length > 0 ? (
          <ul>
            {selectedEvent.participants.map((participantOrId, index) => {
              let participantToShow = null;
              if (typeof participantOrId === 'object' && participantOrId !== null && participantOrId.firstName && participantOrId.lastName && participantOrId._id) {
                participantToShow = participantOrId;
              } else if (typeof participantOrId === 'string') {
                participantToShow = allDevelopers.find(d => d._id === participantOrId);
              }
              
              if (participantToShow) {
                return <li key={participantToShow._id}>{participantToShow.firstName} {participantToShow.lastName}</li>;
              } else if (typeof participantOrId === 'string') { 
                return <li key={`${participantOrId}-${index}`}>User ID: {participantOrId} (Name not found)</li>;
              }
              return <li key={`invalid-${index}`}>Invalid participant data</li>; 
            })}
          </ul>
        ) : (
          <p>No participants listed for this meeting.</p>
        )}
      </div>
    </div>
  </Modal>
)}
    </div>
);
};
export default MeetComponent
