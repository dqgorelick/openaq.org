import React from 'react';
import PropTypes from 'prop-types';
import c from 'classnames';

export default function OptionCard({ toggleAllLocations, isAllLocations }) {
  console.log('card isAllLocations', isAllLocations);
  const handle = e => {
    console.log('CLICK');
    toggleAllLocations(!e.target.checked);
  };

  return (
    <div className="map__legend" style={{ top: `2rem`, height: `4rem` }}>
      <form onChange={e => handle(e)}>
        <input
          type="radio"
          id="isAllLocations"
          name="selectLocations"
          checked={isAllLocations}
          value={true}
        />
        <label htmlFor="isAllLocations">All locations selected</label>
        <input
          type="radio"
          id="isNodeSelection"
          name="selectLocations"
          checked={!isAllLocations}
          value={false}
        />
        <label htmlFor="isNodeSelection">Select locations</label>
      </form>
    </div>
  );
}

OptionCard.propTypes = {
  setAllLocations: PropTypes.func.isRequired,
};
