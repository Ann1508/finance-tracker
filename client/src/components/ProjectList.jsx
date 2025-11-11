import React from 'react'
import { useNavigate } from 'react-router-dom'
import ProjectCard from './ProjectCard'

export default function ProjectList({ projects }) {
  const navigate = useNavigate()

  const handleOpenProject = (id) => {
    navigate(`/projects/${id}`)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {projects.map(p => (
        <ProjectCard
          key={p.id}
          project={p}
          onSelect={() => handleOpenProject(p.id)}
        />
      ))}
    </div>
  )
}
