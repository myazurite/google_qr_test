"use client"

import { useEffect, useRef, useState } from "react"
import QRCodeLib from "qrcode"

interface QRCodeProps {
  url: string
  size?: number
}

export default function QRCode({ url, size = 200 }: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    if (canvasRef.current && url) {
      QRCodeLib.toCanvas(
        canvasRef.current,
        url,
        {
          width: size,
          margin: 2,
          color: {
            dark: "#333333",
            light: "#ffffff",
          },
        },
        (error) => {
          if (error) {
            console.error("Error generating QR code:", error)
            setError("Failed to generate QR code")
          } else {
            setError("")
          }
        },
      )
    }
  }, [url, size])

  if (error) {
    return (
      <div className="qr-code">
        <div
          style={{
            width: size,
            height: size,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid #ccc",
            background: "#f5f5f5",
          }}
        >
          <p>QR Code Error</p>
        </div>
      </div>
    )
  }

  return (
    <div className="qr-code">
      <canvas ref={canvasRef} width={size} height={size} />
    </div>
  )
}
