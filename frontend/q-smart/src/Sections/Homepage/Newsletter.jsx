import React from 'react'
import './Newsletter.css'

function Newsletter() {
  return (
    <section className="newsletter">
      <div className="newsletter-container">
        <h2 className="newsletter-title">Stay Tuned for More</h2>
        <p className="newsletter-subtitle">Subscribe to our Newsletter for more news on Qsmart</p>
        <button className="btn btn-secondary">Subscribe</button>
      </div>
    </section>
  )
}

export default Newsletter
