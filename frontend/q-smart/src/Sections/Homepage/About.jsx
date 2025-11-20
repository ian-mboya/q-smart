import React from 'react'
import './About.css'

function About() {
  return (
    <section className="about">
      <div className="about-container">
        <div className="divider"></div>
        
        <div className="about-content">
          <div className="about-text">
            <h2 className="about-title">All About Q-smart</h2>
            <p className="about-description">Lorem ipsum dolor sit amet consectetur. Cras nec ultrices nibh volutpat vitae cras amet.</p>
            <p className="about-description">Lorem ipsum dolor sit amet consectetur. Cras nec ultrices nibh volutpat vitae cras amet.</p>
            <button className="btn btn-secondary">Get Started</button>
          </div>
          
          <div className="about-logo">
            <div className="logo-placeholder">QSMART</div>
          </div>
        </div>
        
        <div className="divider"></div>
      </div>
    </section>
  )
}

export default About
