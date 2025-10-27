import React from 'react';
import { useNavigate } from 'react-router-dom';
import './primary-cta-button.css'


/* function PrimaryCTAButton ({value}) {
  return (
        <button className='primarybutton'>{value}</button>
  );
}

export default PrimaryCTAButton
 */


const PrimaryCTAButton = ({label, navigateTo, customStyles}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(navigateTo);
  };

  return (
    <button className='primarybutton'  onClick={handleClick} style={customStyles}>{label}</button>
  );
}

export default PrimaryCTAButton;