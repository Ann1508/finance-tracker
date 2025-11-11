import { useEffect, useState } from 'react'
import { getCurrentDateTime } from '../utils/dates'

export default function Clock() {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Разделяем дату и время
  const formattedTime = time.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  const formattedDate = time.toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="text-right text-white leading-tight">
      <div className="text-lg font-semibold">{formattedTime}</div>
      <div className="text-sm opacity-90">{formattedDate}</div>
    </div>
  )
}
