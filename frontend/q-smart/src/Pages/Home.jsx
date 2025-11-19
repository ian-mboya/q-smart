import React from 'react'
import NavBar from '../components/navbar/NavBar'
import Hero from '../Sections/Homepage/Hero'
import About from '../Sections/Homepage/About'
import UseCases from '../Sections/Homepage/UseCases'
import ForDevelopers from '../Sections/Homepage/ForDevelopers'
import Newsletter from '../Sections/Homepage/Newsletter'
import Footer from '../Sections/Homepage/Footer'
import "./Home.css"

function Home() {
  return (
    <>
      <NavBar />
      <Hero />
      <About />
      <UseCases />
      <ForDevelopers />
      <Newsletter />
      <Footer />
    </>
  )
}

export default Home
