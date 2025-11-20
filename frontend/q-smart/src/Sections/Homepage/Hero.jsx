import React from 'react'
import PrimaryCTAButton from '../../components/Buttons/primary-cta-button'
import './Hero.css'

function Hero() {
  return (
    <section className="hero">
      <div className="hero-container">
        <div className="hero-top">
          <div className="hero-title-section">
            <h1 className="hero-title">
              <span>Queues Made</span>
              <span className="highlight">Smarter</span>
            </h1>
          </div>
          
          <div className="hero-cta-section">
            <p className="hero-subtitle">Quickly understand your queues. Better decisions start here.</p>
            <PrimaryCTAButton label="Get Started" navigateTo="/signup" />
          </div>
        </div>
        
        <div className="hero-images">
          <div className="hero-image hero-image-1"></div>
          <div className="hero-image hero-image-2"></div>
        </div>
      </div>
    </section>
  )
}

export default Hero
