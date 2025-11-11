export function filterTasks(tasks = [], status = 'all') {
  if (status === 'all') return tasks.slice()
  return tasks.filter(t => t.status === status)
}
