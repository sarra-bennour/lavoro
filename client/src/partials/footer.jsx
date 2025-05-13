const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="footer mt-auto py-3 bg-white text-center">
      <div className="container">
        <span className="text-muted">
          Copyright © <span id="year">{currentYear}</span>{" "}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault()
            }}
            className="text-dark fw-medium"
          >
            Lavoro
          </a>
          . Designed with <span className="ri-heart-line text-danger"></span> by{" "}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault()
            }}
          >
            <span className="fw-medium text-primary">Astrum</span>
          </a>{" "}
          All rights reserved
        </span>
      </div>
    </footer>
  )
}

export default Footer

