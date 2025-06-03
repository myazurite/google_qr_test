import Link from "next/link"

export default function UserNotFound() {
  return (
    <div className="container">
      <div className="card login-container">
        <h2>User Not Found</h2>
        <p>Sorry, the user you are looking for does not exist.</p>
        <div className="mt-2">
          <Link href="/" className="button">
            Go to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
