import React from 'react'
import './UseCases.css'

function UseCases() {
  const useCases = [
    {
      id: 1,
      color: '#FA4646',
      title: 'Use Case 1',
      description: 'Lorem ipsum dolor sit amet consectetur. Cras nec ultrices nibh volutpat vitae cras amet.'
    },
    {
      id: 2,
      color: '#FFBF0D',
      title: 'Use Case 2',
      description: 'Lorem ipsum dolor sit amet consectetur. Cras nec ultrices nibh volutpat vitae cras amet.'
    },
    {
      id: 3,
      color: '#DE9FFF',
      title: 'Use Case 3',
      description: 'Lorem ipsum dolor sit amet consectetur. Cras nec ultrices nibh volutpat vitae cras amet.'
    }
  ]

  return (
    <section className="use-cases">
      <div className="use-cases-container">
        <h2 className="use-cases-title">Use Cases</h2>
        
        <div className="use-cases-grid">
          {useCases.map((useCase) => (
            <div key={useCase.id} className="use-case-card">
              <div 
                className="use-case-image"
                style={{ backgroundColor: useCase.color }}
              ></div>
              <p className="use-case-description">{useCase.description}</p>
              <button className="btn btn-primary">Read in Docs</button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default UseCases
