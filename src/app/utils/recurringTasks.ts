import { addDays, addWeeks, addMonths, addYears, isAfter, isBefore, isSameDay, format } from 'date-fns';
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
 * Generate occurrences of a recurring task within a date range based on frequencyDays
 */
export function generateTaskOccurrences(
  task: Task,
  machine: Machine,
  startRange: Date,
  endRange: Date
): TaskOccurrence[] {
  const occurrences: TaskOccurrence[] = [];
  
  if (task.recurrence === 'weekly' && task.daysOfWeek && task.daysOfWeek.length > 0) {
    // Special handling for weekly tasks with specific days of week
    let currentDate = new Date(startRange);
    while (isBefore(currentDate, endRange) || isSameDay(currentDate, endRange)) {
      const dayOfWeek = currentDate.getDay(); // 0=Sunday, 1=Monday, etc.
      if (task.daysOfWeek.includes(dayOfWeek)) {
        occurrences.push({
          id: `${task.id}-${format(currentDate, 'yyyy-MM-dd')}`,
                  machineId: machine.equipment_number,
        machineName: machine.equipment_description,
          title: task.title,
          date: new Date(currentDate),
          taskId: task.id,
        });
      }
      currentDate = addDays(currentDate, 1);
    }
  } else {
    // Other recurrence patterns
    let currentDate = task.startDate ? new Date(task.startDate) : new Date(startRange);
    let iterationCount = 0;
    const maxIterations = 1000; // Safety limit

    while (
      (isBefore(currentDate, endRange) || isSameDay(currentDate, endRange)) &&
      iterationCount < maxIterations
    ) {
      iterationCount++;

      // Only add if within our date range
      if ((isAfter(currentDate, startRange) || isSameDay(currentDate, startRange)) &&
          (isBefore(currentDate, endRange) || isSameDay(currentDate, endRange))) {
        occurrences.push({
          id: `${task.id}-${format(currentDate, 'yyyy-MM-dd')}`,
                  machineId: machine.equipment_number,
        machineName: machine.equipment_description,
          title: task.title,
          date: new Date(currentDate),
          taskId: task.id,
        });
      }

      // Move to next occurrence based on recurrence
      switch (task.recurrence) {
        case 'daily':
          currentDate = addDays(currentDate, task.interval);
          break;
        case 'weekly':
          currentDate = addWeeks(currentDate, task.interval);
          break;
        case 'monthly':
          currentDate = addMonths(currentDate, task.interval);
          break;
        case 'yearly':
          currentDate = addYears(currentDate, task.interval);
          break;
      }
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