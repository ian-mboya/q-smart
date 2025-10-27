import React from "react";
import PrimaryCTAButton from "../../components/Buttons/primary-cta-button";
import isometricIllust from "../../assets/3d-isometric.png";
import phoneMockup from "../../assets/phone-mockup.png";

import "./Hero.css";

function Hero() {
  return (
    <>
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-left">
            <h1>Queues Made Smarter</h1>
          </div>
          <div className="hero-right">
            <p className="hero-text">
              Quickly understand your queues. Better decisions start here.
            </p>
            <PrimaryCTAButton label="Begin" navigateTo="/dashboard"/>
          </div>
        </div>
        <div className="hero-cards">
          <div className="card card-green">
            <img src={isometricIllust} alt="..." />
          </div>
          <div className="card card-purple">
            <img src={phoneMockup} alt="..." />
          </div>
        </div>
      </section>
    </>
  );
}

export default Hero;
