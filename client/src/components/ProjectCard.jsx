import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function ProjectCard({ project }) {
  const navigate = useNavigate()

  return (
    <div
      className="p-4 bg-white rounded shadow hover:bg-indigo-50 cursor-pointer"
      onClick={() => navigate(`/projects/${project.id}`)}
    >
      <div className="font-bold text-lg">{project.name}</div>
      <div className="text-sm text-gray-500">Задач: {project.tasks.length}</div>
    </div>
  )
}
