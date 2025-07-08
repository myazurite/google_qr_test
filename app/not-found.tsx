import Link from "next/link"

export default function NotFound() {
  return (
    <div className="container">
      <div className="card login-container">
        <h2>Page Not Found</h2>
        <p>Sorry, the page you are looking for does not exist.</p>
        <div className="mt-2">
          <Link href="/" className="button">
            Go to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
