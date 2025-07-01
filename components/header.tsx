"use client"

import type React from "react"

import Link from "next/link"

interface HeaderProps {
  title: string
  onRefresh?: () => void
  onLogout: () => void
  showRefresh?: boolean
  configLink?: string
}

export default function Header({ title, onRefresh, onLogout, showRefresh = true, configLink }: HeaderProps) {
  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault()
    onLogout()
  }

  return (
    <header className="header">
      <h1>{title}</h1>
      <nav className="nav">
        {configLink && (
          <Link href={configLink} className="button">
            Settings
          </Link>
        )}
        {showRefresh && onRefresh && (
          <button onClick={onRefresh} className="button button-secondary">
            Refresh Data
          </button>
        )}
        <button onClick={handleLogout} className="button button-danger">
          Logout
        </button>
      </nav>
    </header>
  )
}
