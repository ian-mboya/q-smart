import React from 'react'
import NavBar from '../components/navbar/NavBar'
import Hero from '../Sections/Homepage/Hero'
import About from '../Sections/Homepage/About';
import "./Home.css";


function Home() {
  return (
    <>
    <NavBar/>
    <Hero />
    <About />

    </>
  )
}

export default Home
