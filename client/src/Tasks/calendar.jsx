import { useState, useEffect, useRef } from "react"
import moment from "moment"
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction"
import SimpleBar from "simplebar-react"
import "simplebar-react/dist/simplebar.min.css"
import 'bootstrap/dist/css/bootstrap.min.css'
import { Draggable } from "@fullcalendar/interaction"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import Swal from "sweetalert2";

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

const Calendar = () => {
  const [allTasks, setAllTasks] = useState([])
  const [calendarTasks, setCalendarTasks] = useState([])
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const calendarRef = useRef(null)
  const draggableRef = useRef(null)
  const tooltipInstances = useRef([])
  const navigate = useNavigate()

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
    if (user?.role.RoleName !== "Team Manager") {
      await Swal.fire({
        title: "Permission Denied",
        text: "You don't have permission to delete tasks",
        icon: "error",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

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
          setAllTasks((prev) => prev.filter((task) => task._id !== taskId));

          await Swal.fire({
            title: "Deleted!",
            text: "The task has been deleted.",
            icon: "success",
            confirmButtonColor: "#3085d6",
          });

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

  useEffect(() => {
    const fetchUserAndTasks = async () => {
      try {
        const token = localStorage.getItem("token")
        if (!token) {
          throw new Error("No token found")
        }

        const userResponse = await axios.get("https://lavoro-back.onrender.com/users/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        })

        if (userResponse.data) {
          setUser(userResponse.data)

          const tasksResponse = await taskService.getTasksList(userResponse.data._id)
          if (tasksResponse.success) {
            const tasks = tasksResponse.data

            if (userResponse.data.role.RoleName === "Team Manager") {
              setCalendarTasks(tasks.filter((task) => task.start_date || task.deadline))
              setAllTasks(tasks.filter((task) => !task.start_date && !task.deadline))
            } else {
              setCalendarTasks(tasks.filter((task) =>
                task.calendar_dates?.start ||
                (task.status === "Done" && (task.start_date || task.deadline))
              ))
              setAllTasks(tasks.filter((task) =>
                !task.calendar_dates?.start &&
                !(task.status === "Done" && (task.start_date || task.deadline))
              ))
            }
          }
        } else {
          navigate("/signin")
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        if (error.response?.status === 401) {
          localStorage.removeItem("token")
          navigate("/signin")
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserAndTasks()
  }, [navigate])

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
        if (draggableRef.current) {
          draggableRef.current.destroy()
        }

        tooltipInstances.current.forEach(tooltip => {
          if (tooltip && typeof tooltip.dispose === 'function') {
            tooltip.dispose();
          }
        });
        tooltipInstances.current = [];
      }
    }
  }, [isLoading, allTasks, user])

  const getTaskClassName = (task) => {
    let baseClass = "";
    if (task.status === "In Progress") {
      baseClass = "bg-warning-transparent border-warning";
    } else if (task.status === "Done") {
      baseClass = "bg-success-transparent border-success";
    } else if (task.status === "Not Started") {
      if (task.priority === "High") {
        baseClass = "bg-danger-transparent border-danger";
      } else if (task.priority === "Medium") {
        baseClass = "bg-info-transparent border-info";
      } else {
        baseClass = "bg-secondary-transparent border-secondary";
      }
    } else {
      baseClass = "bg-primary-transparent border-primary";
    }
    return `${baseClass} border`;
  };

  const getTaskColor = (task) => {
    if (task.status === "In Progress") {
      return "#D97706"; // Darker orange
    } else if (task.status === "Done") {
      return "#15803D"; // Darker green
    } else if (task.status === "Not Started") {
      if (task.priority === "High") {
        return "#B91C1C"; // Darker red
      } else if (task.priority === "Medium") {
        return "#1E40AF"; // Darker blue
      } else {
        return "#4B5563"; // Darker gray
      }
    }
    return "#1E3A8A"; // Darker blue as fallback
  };

  const transformTasksToEvents = (tasks) => {
    return tasks.map((task) => {
      let eventStart, eventEnd;

      const createValidDate = (date) => {
        if (!date) return null;
        const d = new Date(date);
        return isNaN(d.getTime()) ? null : moment(d);
      };

      if (user?.role.RoleName === "Team Manager" || task.status === "Done") {
        eventStart = createValidDate(task.start_date) || createValidDate(task.deadline) || moment();
        eventEnd = createValidDate(task.deadline) || moment(eventStart).add(1, 'day');
      }
      else {
        if (task.calendar_dates?.start) {
          eventStart = createValidDate(task.calendar_dates.start);
          eventEnd = task.calendar_dates.end
            ? createValidDate(task.calendar_dates.end)
            : moment(eventStart).add(1, 'day');

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
        else if (task.start_date || task.deadline) {
          eventStart = task.start_date
            ? createValidDate(task.start_date)
            : createValidDate(task.deadline);
          eventEnd = task.deadline
            ? createValidDate(task.deadline)
            : createValidDate(task.start_date);

          if (!eventEnd || eventEnd.isSameOrBefore(eventStart)) {
            eventEnd = moment(eventStart).add(1, 'day');
          } else {
            eventEnd = moment(eventEnd).add(1, 'day');
          }
        }
        else {
          eventStart = moment();
          eventEnd = moment().add(1, 'day');
        }
      }

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
          realStartDate: task.start_date ? new Date(task.start_date).toLocaleDateString() : "Not set",
          realDeadline: task.deadline ? new Date(task.deadline).toLocaleDateString() : "Not set",
          isCalendarEvent: !!task.calendar_dates,
          userRole: user?.role.RoleName,
          originalStart: task.start_date,
          originalEnd: task.deadline
        },
        allDay: true,
      };
    });
  };

  const handleEventReceive = async (eventInfo) => {
    const taskId = eventInfo.event.id;
    const task = allTasks.find((t) => t._id === taskId);

    if (task && user) {
      try {
        let start = new Date(eventInfo.event.start);
        let end = eventInfo.event.end ? new Date(eventInfo.event.end) : moment(start).add(1, "day").toDate();

        if (user.role.RoleName === "Developer") {
          const taskStartDate = task.start_date ? new Date(task.start_date) : null;
          const taskDeadline = task.deadline ? new Date(task.deadline) : null;

          if (taskStartDate && start < taskStartDate) {
            start = new Date(taskStartDate);
            end = moment(start).add(1, "day").toDate();
          }

          if (taskDeadline && end > new Date(taskDeadline.setDate(taskDeadline.getDate() + 1))) {
            end = new Date(taskDeadline.setDate(taskDeadline.getDate() + 1));
            start = moment(end).subtract(1, "day").toDate();
          }

          if (taskStartDate && taskDeadline) {
            const maxDuration = moment(taskDeadline).diff(moment(taskStartDate), "days") + 1;
            const desiredDuration = moment(end).diff(moment(start), "days");
            const duration = Math.min(desiredDuration, maxDuration);

            end = moment(start).add(duration, "days").toDate();
          }
        }

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

  const handleEventClick = async (clickInfo) => {
    if (clickInfo.event.extendedProps.status === "Done") {
      return
    }
    const taskId = clickInfo.event.id
    const task = calendarTasks.find((t) => t._id === taskId)

    if (task && user) {
      try {
        await taskService.updateTaskCalendarDates(taskId, null, null, user._id)

        let taskWithoutDates

        if (user.role.RoleName === "Team Manager") {
          const { start_date, deadline, ...rest } = task
          taskWithoutDates = rest
        } else {
          const { calendar_dates, ...rest } = task
          taskWithoutDates = rest
        }

        setAllTasks((prev) => [...prev, taskWithoutDates])
        setCalendarTasks((prev) => prev.filter((t) => t._id !== taskId))

        clickInfo.event.remove()
      } catch (error) {
        console.error("Error removing task from calendar:", error)
        alert("Failed to remove task from calendar")
      }
    }
  }

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

      if (!newStart || isNaN(newStart.getTime())) {
        throw new Error("Invalid start date");
      }
      if (!newEnd || isNaN(newEnd.getTime())) {
        throw new Error("Invalid end date");
      }

      if (userRole === "Developer") {
        const originalStart = task.start_date ? new Date(task.start_date) : null;
        const originalEnd = task.deadline ? new Date(task.deadline) : null;

        if (originalStart && originalEnd) {
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

          const originalDuration = moment(originalEnd).diff(moment(originalStart), 'days') + 1;
          const newDuration = moment(newEnd).diff(moment(newStart), 'days');

          if (newDuration > originalDuration) {
            newEnd = moment(newStart).add(originalDuration, 'days').toDate();
          }
        }
      }

      const updateData = {
        start: newStart,
        end: newEnd,
        userId: user._id
      };

      const response = await taskService.updateTaskCalendarDates(taskId, updateData.start, updateData.end, user._id);

      if (!response.success) {
        throw new Error(response.message || "Failed to update dates");
      }

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

  const allEvents = transformTasksToEvents(calendarTasks)

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
    <div className="page">
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
                  Task Calendar
                </li>
              </ol>
            </nav>
            <h1 className="page-title fw-medium fs-18 mb-0">Task Calendar</h1>
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
                          <strong>Status:</strong> ${arg.event.extendedProps.status}<br/>
                          <strong>Priority:</strong> ${arg.event.extendedProps.priority}<br/>
                          <strong>Real Start:</strong> ${arg.event.extendedProps.realStartDate}<br/>
                          <strong>Real Deadline:</strong> ${arg.event.extendedProps.realDeadline}<br/>
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

                      return () => {
                        arg.el.removeEventListener("mouseenter", showTooltip);
                        arg.el.removeEventListener("mouseleave", hideTooltip);
                        document.removeEventListener("click", handleDocumentClick);

                        const index = tooltipInstances.current.indexOf(tooltip);
                        if (index !== -1) {
                          tooltipInstances.current.splice(index, 1);
                        }

                        tooltip.dispose();
                      };
                    }
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
                                  confirmButtonColor: '#3085d6',
                                  confirmButtonText: 'OK'
                                });
                              }
                            }}
                          ></i>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="card custom-card">
              <div className="card-header justify-content-between pb-1">
                <div className="card-title">Activity</div>
              </div>
              <div className="card-body p-0">
                <div className="p-3 border-bottom" id="full-calendar-activity">
                  <SimpleBar style={{ maxHeight: "300px" }} autoHide={true}>
                    <ul className="list-unstyled mb-0 fullcalendar-events-activity">
                      {calendarTasks.slice(0, 5).map((task, index) => (
                        <li key={`task-activity-${index}`} className="mb-3">
                          <div className="d-flex align-items-center justify-content-between flex-wrap">
                            <p className="mb-1 fw-medium">
                              {user?.role.RoleName === "Team Manager"
                                ? `Due: ${task.deadline ? new Date(task.deadline).toLocaleDateString() : "No deadline"}`
                                : `Scheduled: ${task.calendar_dates?.start ? new Date(task.calendar_dates.start).toLocaleDateString() : "Not scheduled"}`}
                            </p>
                            <span
                              className={`badge ${task.status === "In Progress"
                                ? "bg-warning"
                                : task.status === "Completed"
                                  ? "bg-success"
                                  : "bg-info"
                                } mb-1`}
                            >
                              {task.status}
                            </span>
                          </div>
                          <p className="mb-0 text-muted fs-12">{task.title}</p>
                          {task.description && <p className="mb-0 text-muted fs-11">{task.description}</p>}
                        </li>
                      ))}
                    </ul>
                  </SimpleBar>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Calendar