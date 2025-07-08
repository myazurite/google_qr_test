"use client"

import type React from "react"

import { useState, useEffect } from "react"

interface SearchBarProps {
  placeholder?: string
  value: string
  onChange: (value: string) => void
}

export default function SearchBar({ placeholder = "Search...", value, onChange }: SearchBarProps) {
  const [inputValue, setInputValue] = useState(value)

  // Update local state when prop value changes
  useEffect(() => {
    setInputValue(value)
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    onChange(newValue)
  }

  const handleClear = () => {
    setInputValue("")
    onChange("")
  }

  return (
    <div className="search-bar">
      <input
        type="text"
        className="search-input"
        placeholder={placeholder}
        value={inputValue}
        onChange={handleChange}
      />
      {inputValue && (
        <button className="search-clear" onClick={handleClear}>
          ✕
        </button>
      )}
    </div>
  )
}
