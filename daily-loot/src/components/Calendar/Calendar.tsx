import { useMemo } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from 'date-fns';
import { useStore } from '../../store/useStore';
import './Calendar.css';

export function Calendar() {
  const selectedDate = useStore(s => s.selectedDate);
  const setSelectedDate = useStore(s => s.setSelectedDate);
  const getDatesWithItems = useStore(s => s.getDatesWithItems);
  const getDailyTotal = useStore(s => s.getDailyTotal);

  const currentMonth = new Date(selectedDate + 'T00:00:00');
  const datesWithItems = getDatesWithItems();

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart);
    const calEnd = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth.getMonth(), currentMonth.getFullYear()]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = direction === 'prev'
      ? subMonths(currentMonth, 1)
      : addMonths(currentMonth, 1);
    setSelectedDate(format(newDate, 'yyyy-MM-dd'));
  };

  const today = new Date();
  const isViewingToday = isSameDay(currentMonth, today) || selectedDate === format(today, 'yyyy-MM-dd');

  const jumpToToday = () => {
    setSelectedDate(format(today, 'yyyy-MM-dd'));
  };

  return (
    <div className="calendar">
      <div className="calendar-header">
        <div>
          <h1 className="calendar-title">Daily Loot</h1>
          <div className="calendar-month-nav">
            <button className="month-nav-btn" onClick={() => navigateMonth('prev')}>&#8249;</button>
            <span className="calendar-month">{format(currentMonth, 'MMMM yyyy')}</span>
            <button className="month-nav-btn" onClick={() => navigateMonth('next')}>&#8250;</button>
          </div>
        </div>
        {!isViewingToday && (
          <button className="today-btn" onClick={jumpToToday}>
            Today
          </button>
        )}
      </div>

      <div className="calendar-grid">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
          <div key={i} className="calendar-day-header">{day}</div>
        ))}
        {calendarDays.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isSelected = selectedDate === dateStr;
          const hasItems = datesWithItems.has(dateStr);
          const dailyTotal = hasItems ? getDailyTotal(dateStr) : 0;
          const isToday = isSameDay(day, new Date());

          return (
            <button
              key={dateStr}
              className={[
                'calendar-day',
                !isCurrentMonth && 'other-month',
                isSelected && 'selected',
                isToday && 'today',
                hasItems && 'has-items',
              ].filter(Boolean).join(' ')}
              onClick={() => setSelectedDate(dateStr)}
            >
              <span className="day-number">{format(day, 'd')}</span>
              {hasItems && (
                <span className="day-indicator" title={`${dailyTotal} pts`}>
                  {dailyTotal > 0 && <span className="day-score">{dailyTotal}</span>}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
