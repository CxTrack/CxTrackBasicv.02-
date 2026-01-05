export const getUserTimezone = (): string => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

export const getCurrentTimeIn12HourFormat = (): string => {
  const now = new Date();
  const hours = now.getHours();
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 || 12;
  return `${displayHour}:00 ${period}`;
};

export const calculateEndTime = (startTime: string, durationMinutes: number): string => {
  if (!startTime) return '';

  const [time, period] = startTime.split(' ');
  const [hours, minutes] = time.split(':').map(Number);

  let totalMinutes = hours * 60 + minutes + durationMinutes;
  if (period === 'PM' && hours !== 12) totalMinutes += 12 * 60;
  if (period === 'AM' && hours === 12) totalMinutes -= 12 * 60;

  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMinutes = totalMinutes % 60;
  const endPeriod = endHours >= 12 ? 'PM' : 'AM';
  const displayHours = endHours % 12 || 12;

  return `${displayHours}:${endMinutes.toString().padStart(2, '0')} ${endPeriod}`;
};

export const convert12HourTo24Hour = (time12h: string): string => {
  const [time, period] = time12h.split(' ');
  const [hours, minutes] = time.split(':').map(Number);

  let hours24 = hours;
  if (period === 'PM' && hours !== 12) hours24 = hours + 12;
  if (period === 'AM' && hours === 12) hours24 = 0;

  return `${hours24.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

export const convert24HourTo12Hour = (time24h: string): string => {
  const [hours, minutes] = time24h.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;

  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
};

export const formatDateTimeRange = (date: string, startTime: string, endTime: string): string => {
  const dateObj = new Date(date);
  const dateStr = dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return `${dateStr} • ${startTime} - ${endTime}`;
};

export const isTimeConflict = (
  time1Start: string,
  time1Duration: number,
  time2Start: string,
  time2Duration: number
): boolean => {
  const time1End = calculateEndTime(time1Start, time1Duration);
  const time2End = calculateEndTime(time2Start, time2Duration);

  const start1 = convert12HourTo24Hour(time1Start);
  const end1 = convert12HourTo24Hour(time1End);
  const start2 = convert12HourTo24Hour(time2Start);
  const end2 = convert12HourTo24Hour(time2End);

  return (start1 < end2 && end1 > start2);
};
