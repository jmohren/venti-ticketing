import { addDays, addWeeks, addMonths, addYears, isAfter, isBefore, isSameDay, parseISO, format } from 'date-fns';
import { Task, Machine } from '@/app/state/MachineProvider';

export interface TaskOccurrence {
  id: string;
  machineId: string;
  machineName: string;
  title: string;
  date: Date;
  taskId: string;
}

/**
 * Generate occurrences of a recurring task within a date range
 * Only generates occurrences that fall within the specified range to avoid infinite loops
 */
export function generateTaskOccurrences(
  task: Task,
  machine: Machine,
  startRange: Date,
  endRange: Date
): TaskOccurrence[] {
  const occurrences: TaskOccurrence[] = [];
  const taskStart = parseISO(task.startDate);
  const taskEnd = task.endDate ? parseISO(task.endDate) : null;
  
  // Don't generate if task starts after our range or ends before our range
  if (isAfter(taskStart, endRange) || (taskEnd && isBefore(taskEnd, startRange))) {
    return occurrences;
  }

  let currentDate = taskStart;
  let iterationCount = 0;
  const maxIterations = 1000; // Safety limit to prevent infinite loops

  while (
    (isBefore(currentDate, endRange) || isSameDay(currentDate, endRange)) &&
    (!taskEnd || isBefore(currentDate, taskEnd) || isSameDay(currentDate, taskEnd)) &&
    iterationCount < maxIterations
  ) {
    iterationCount++;

    // Check if current date is within our display range
    if (
      (isAfter(currentDate, startRange) || isSameDay(currentDate, startRange)) &&
      (isBefore(currentDate, endRange) || isSameDay(currentDate, endRange))
    ) {
      // For weekly recurrence, check if the day of week matches
      if (task.recurrence === 'weekly' && task.daysOfWeek) {
        const dayOfWeek = currentDate.getDay();
        if (task.daysOfWeek.includes(dayOfWeek)) {
          occurrences.push({
            id: `${task.id}-${format(currentDate, 'yyyy-MM-dd')}`,
            machineId: machine.id,
            machineName: machine.name,
            title: task.title,
            date: new Date(currentDate),
            taskId: task.id,
          });
        }
      } else if (task.recurrence !== 'weekly') {
        // For non-weekly recurrence, add the occurrence
        occurrences.push({
          id: `${task.id}-${format(currentDate, 'yyyy-MM-dd')}`,
          machineId: machine.id,
          machineName: machine.name,
          title: task.title,
          date: new Date(currentDate),
          taskId: task.id,
        });
      }
    }

    // Move to next occurrence based on recurrence pattern
    switch (task.recurrence) {
      case 'daily':
        currentDate = addDays(currentDate, task.interval);
        break;
      case 'weekly':
        // For weekly, we advance by the interval in weeks, but we need to check each day
        // within the week to see if it matches our target days
        if (task.daysOfWeek && task.daysOfWeek.length > 0) {
          // Find next matching day in the current week
          let foundInCurrentWeek = false;
          
          // Check remaining days in current week
          for (let i = 1; i < 8; i++) {
            const checkDate = addDays(currentDate, i);
            if (task.daysOfWeek.includes(checkDate.getDay())) {
              currentDate = checkDate;
              foundInCurrentWeek = true;
              break;
            }
          }
          
          if (!foundInCurrentWeek) {
            // Move to next interval of weeks and find first matching day
            currentDate = addWeeks(currentDate, task.interval);
            // Find first matching day in the new week
            for (let i = 0; i < 7; i++) {
              const checkDate = addDays(currentDate, i);
              if (task.daysOfWeek.includes(checkDate.getDay())) {
                currentDate = checkDate;
                break;
              }
            }
          }
        } else {
          currentDate = addWeeks(currentDate, task.interval);
        }
        break;
      case 'monthly':
        currentDate = addMonths(currentDate, task.interval);
        // Adjust for day of month if specified
        if (task.dayOfMonth) {
          const targetDay = Math.min(task.dayOfMonth, new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate());
          currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), targetDay);
        }
        break;
      case 'yearly':
        currentDate = addYears(currentDate, task.interval);
        // Adjust for specific month and day if specified
        if (task.month && task.dayOfMonth) {
          const targetDay = Math.min(task.dayOfMonth, new Date(currentDate.getFullYear(), task.month, 0).getDate());
          currentDate = new Date(currentDate.getFullYear(), task.month - 1, targetDay);
        }
        break;
    }
  }

  return occurrences;
}

/**
 * Generate all recurring task occurrences for a machine within a date range
 */
export function generateMachineTaskOccurrences(
  machine: Machine,
  startRange: Date,
  endRange: Date
): TaskOccurrence[] {
  if (!machine.tasks || machine.tasks.length === 0) {
    return [];
  }

  const allOccurrences: TaskOccurrence[] = [];
  
  for (const task of machine.tasks) {
    const taskOccurrences = generateTaskOccurrences(task, machine, startRange, endRange);
    allOccurrences.push(...taskOccurrences);
  }

  return allOccurrences;
}

/**
 * Generate all recurring task occurrences for multiple machines within a date range
 */
export function generateAllTaskOccurrences(
  machines: Machine[],
  startRange: Date,
  endRange: Date
): TaskOccurrence[] {
  const allOccurrences: TaskOccurrence[] = [];
  
  for (const machine of machines) {
    const machineOccurrences = generateMachineTaskOccurrences(machine, startRange, endRange);
    allOccurrences.push(...machineOccurrences);
  }

  return allOccurrences;
} 