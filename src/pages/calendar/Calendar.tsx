import { useState, useEffect } from 'react';
import {
  ChevronLeft, ChevronRight, Calendar as CalendarIcon,
  Plus, List, CheckCircle
} from 'lucide-react';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameMonth, isToday, addMonths, subMonths, startOfWeek,
  endOfWeek, isSameDay, addDays, subDays, addWeeks, subWeeks
} from 'date-fns';
import { useCalendarStore } from '@/stores/calendarStore';
import { useOrganizationStore } from '@/stores/organizationStore';
import { useTaskStore } from '@/stores/taskStore';
import { useThemeStore } from '@/stores/themeStore';
import AgendaPanel from './AgendaPanel';
import EventModal from '@/components/calendar/EventModal';
import AppointmentDetailModal from '@/components/calendar/AppointmentDetailModal';
import TaskModal from '@/components/tasks/TaskModal';
import WeekView from '@/components/calendar/WeekView';
import DayView from '@/components/calendar/DayView';
import AgendaView from '@/components/calendar/AgendaView';
import { Card, PageContainer } from '@/components/theme/ThemeComponents';

type CalendarView = 'month' | 'week' | 'day' | 'agenda';

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>('month');
  const [showAgendaPanel, setShowAgendaPanel] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showEventModal, setShowEventModal] = useState(false);
  const [showAppointmentDetailModal, setShowAppointmentDetailModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showEventTypeModal, setShowEventTypeModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [selectedTask, setSelectedTask] = useState<any>(null);

  const { events, fetchEvents, updateEvent } = useCalendarStore();
  const { currentOrganization, getOrganizationId } = useOrganizationStore();
  const { fetchTasks, getTasksByDate } = useTaskStore();
  const { theme } = useThemeStore();

  useEffect(() => {
    let orgId;
    try {
      orgId = getOrganizationId();
    } catch (err) {
      // Ignore if no org yet
    }
    fetchEvents(orgId);
    fetchTasks();
  }, [currentOrganization, fetchEvents, fetchTasks, getOrganizationId]);

  const getEventsForDate = (date: Date) => {
    return events.filter(event =>
      isSameDay(new Date(event.start_time), date)
    ).sort((a, b) =>
      new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    );
  };

  const getTasksForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return getTasksByDate(dateStr).filter(task => task.show_on_calendar === true);
  };

  const getCalendarDays = () => {
    const start = startOfWeek(startOfMonth(currentDate));
    const end = endOfWeek(endOfMonth(currentDate));
    return eachDayOfInterval({ start, end });
  };

  const handlePrevious = () => {
    if (view === 'month') {
      setCurrentDate(subMonths(currentDate, 1));
    } else if (view === 'week') {
      setCurrentDate(subWeeks(currentDate, 1));
    } else if (view === 'day') {
      setCurrentDate(subDays(currentDate, 1));
    }
  };

  const handleNext = () => {
    if (view === 'month') {
      setCurrentDate(addMonths(currentDate, 1));
    } else if (view === 'week') {
      setCurrentDate(addWeeks(currentDate, 1));
    } else if (view === 'day') {
      setCurrentDate(addDays(currentDate, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setShowEventTypeModal(true);
  };

  const handleEventClick = (event: any) => {
    setSelectedEvent(event);
    setShowAppointmentDetailModal(true);
  };

  return (
    <PageContainer>
      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Calendar
            </h1>
            <span className="hidden sm:block text-sm text-gray-600 dark:text-gray-400">
              Manage your appointments and schedule
            </span>
          </div>

          <div className="flex items-center justify-between sm:justify-end space-x-3">
            <button
              onClick={() => setShowAgendaPanel(!showAgendaPanel)}
              className={
                theme === 'soft-modern'
                  ? showAgendaPanel
                    ? 'p-2.5 rounded-xl bg-blue-100 text-blue-600 shadow-inner transition-all'
                    : 'p-2.5 rounded-xl hover:bg-white text-gray-600 transition-all'
                  : `p-2.5 rounded-xl transition-colors ${showAgendaPanel
                    ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`
              }
              title="Toggle Agenda Panel"
            >
              <List size={22} />
            </button>

            <button
              onClick={() => {
                setSelectedEvent(null);
                setShowEventModal(true);
              }}
              className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all font-bold shadow-lg shadow-blue-500/20 active:scale-95 text-sm"
            >
              <Plus size={20} className="mr-2" />
              <span>New Event</span>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrevious}
                className={
                  theme === 'soft-modern'
                    ? 'p-2 hover:bg-white rounded-lg transition-all text-gray-600'
                    : 'p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-600 dark:text-gray-400'
                }
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={handleToday}
                className={
                  theme === 'soft-modern'
                    ? 'px-4 py-2 text-sm font-medium hover:bg-white rounded-lg transition-all text-gray-700'
                    : 'px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors'
                }
              >
                Today
              </button>
              <button
                onClick={handleNext}
                className={
                  theme === 'soft-modern'
                    ? 'p-2 hover:bg-white rounded-lg transition-all text-gray-600'
                    : 'p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-600 dark:text-gray-400'
                }
              >
                <ChevronRight size={20} />
              </button>
            </div>

            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
          </div>

          <div
            className={
              theme === 'soft-modern'
                ? 'flex items-center space-x-2 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-1 shadow-inner'
                : 'flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1'
            }
          >
            {(['month', 'week', 'day', 'agenda'] as CalendarView[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${view === v
                  ? theme === 'soft-modern'
                    ? 'bg-white shadow-[2px_2px_4px_rgba(0,0,0,0.1)] text-gray-900'
                    : 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <div className={`flex-1 overflow-y-auto ${showAgendaPanel ? 'pr-0' : ''}`}>
          {view === 'month' && (
            <Card className="overflow-hidden p-0">
              <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div
                    key={day}
                    className="px-3 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider"
                  >
                    <span className="hidden sm:inline">{day}</span>
                    <span className="sm:hidden">{day.charAt(0)}</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 auto-rows-[150px]">
                {getCalendarDays().map((day, index) => {
                  const dayEvents = getEventsForDate(day);
                  const dayTasks = getTasksForDate(day);
                  const totalItems = dayEvents.length + dayTasks.length;
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const isCurrentDay = isToday(day);
                  const isSelected = isSameDay(day, selectedDate);

                  return (
                    <button
                      key={index}
                      onClick={() => handleDateClick(day)}
                      className={`relative p-2 border-b border-r border-gray-200 dark:border-gray-700 text-left transition-colors ${!isCurrentMonth
                        ? 'bg-gray-50 dark:bg-gray-900/50 text-gray-400 dark:text-gray-600'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        } ${isSelected ? 'ring-2 ring-inset ring-blue-500' : ''}`}
                    >
                      <span
                        className={`inline-flex items-center justify-center w-7 h-7 text-sm font-medium rounded-full ${isCurrentDay
                          ? 'bg-blue-600 text-white'
                          : isCurrentMonth
                            ? 'text-gray-900 dark:text-white'
                            : 'text-gray-400 dark:text-gray-600'
                          }`}
                      >
                        {format(day, 'd')}
                      </span>

                      <div className="mt-1 space-y-1">
                        {dayEvents.slice(0, 2).map((event) => (
                          <div
                            key={event.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEventClick(event);
                            }}
                            className="px-2 py-1 text-xs rounded truncate hover:opacity-80 transition-opacity cursor-pointer"
                            style={{
                              backgroundColor: `${event.color_code || '#6366f1'}20`,
                              color: event.color_code || '#6366f1',
                              borderLeft: `3px solid ${event.color_code || '#6366f1'}`
                            }}
                          >
                            <span className="font-medium">
                              {format(new Date(event.start_time), 'h:mm a')}
                            </span>
                            {' '}
                            {event.title}
                          </div>
                        ))}
                        {dayTasks.slice(0, 3 - Math.min(dayEvents.length, 2)).map((task) => (
                          <div
                            key={task.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTask(task);
                              setShowTaskModal(true);
                            }}
                            className="px-2 py-1 text-xs rounded truncate hover:opacity-80 transition-opacity cursor-pointer bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-l-3 border-orange-500"
                            style={{
                              borderLeft: '3px solid rgb(249 115 22)'
                            }}
                          >
                            {task.start_time ? (
                              <>
                                <span className="font-medium">{task.start_time}</span>
                                {' '}
                                {task.title}
                              </>
                            ) : (
                              <>
                                <span className="font-medium">✓</span>
                                {' '}
                                {task.title}
                              </>
                            )}
                          </div>
                        ))}
                        {totalItems > 3 && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 px-2">
                            +{totalItems - 3} more
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>
          )}

          {view === 'week' && (
            <WeekView
              currentDate={currentDate}
              events={events}
              onEventClick={handleEventClick}
              onTimeSlotClick={(date, hour) => {
                const newDate = new Date(date);
                newDate.setHours(hour, 0, 0, 0);
                setSelectedDate(newDate);
                setSelectedEvent(null);
                setShowEventModal(true);
              }}
            />
          )}

          {view === 'day' && (
            <DayView
              currentDate={currentDate}
              events={events}
              onEventClick={handleEventClick}
              onTimeSlotClick={(hour) => {
                const newDate = new Date(currentDate);
                newDate.setHours(hour, 0, 0, 0);
                setSelectedDate(newDate);
                setSelectedEvent(null);
                setShowEventModal(true);
              }}
            />
          )}

          {view === 'agenda' && (
            <AgendaView
              events={events}
              onEventClick={handleEventClick}
            />
          )}
        </div>

        {showAgendaPanel && (
          <AgendaPanel
            selectedDate={selectedDate}
            events={getEventsForDate(selectedDate)}
            onEventClick={handleEventClick}
            onScheduleEvent={() => {
              setSelectedEvent(null);
              setShowEventModal(true);
            }}
            onClose={() => setShowAgendaPanel(false)}
          />
        )}
      </div>

      {showEventTypeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              What would you like to create?
            </h2>

            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowEventTypeModal(false);
                  setSelectedEvent(null);
                  setShowEventModal(true);
                }}
                className="w-full flex items-center gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors group"
              >
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <CalendarIcon size={24} className="text-white" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Appointment</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Schedule a meeting or event</p>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowEventTypeModal(false);
                  setSelectedTask(null);
                  setShowTaskModal(true);
                }}
                className="w-full flex items-center gap-4 p-4 bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-200 dark:border-orange-800 rounded-xl hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors group"
              >
                <div className="w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <CheckCircle size={24} className="text-white" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Task</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Create a to-do item</p>
                </div>
              </button>
            </div>

            <button
              onClick={() => setShowEventTypeModal(false)}
              className="w-full mt-4 px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {showEventModal && (
        <EventModal
          event={selectedEvent}
          isOpen={showEventModal}
          onClose={() => {
            setShowEventModal(false);
            setSelectedEvent(null);
            let orgId;
            try { orgId = getOrganizationId(); } catch (err) { }
            fetchEvents(orgId);
          }}
          selectedDate={selectedDate}
        />
      )}

      {showAppointmentDetailModal && selectedEvent && (
        <AppointmentDetailModal
          appointment={selectedEvent}
          isOpen={showAppointmentDetailModal}
          onClose={() => {
            setShowAppointmentDetailModal(false);
            setSelectedEvent(null);
          }}
          onUpdate={async (id, data) => {
            await updateEvent(id, data);
            let orgId;
            try { orgId = getOrganizationId(); } catch (err) { }
            fetchEvents(orgId);
          }}
        />
      )}

      {showTaskModal && (
        <TaskModal
          isOpen={showTaskModal}
          onClose={() => {
            setShowTaskModal(false);
            setSelectedTask(null);
            fetchTasks();
          }}
          task={selectedTask}
          preselectedDate={selectedDate}
          defaultShowOnCalendar={true}
        />
      )}
    </PageContainer>
  );
}
