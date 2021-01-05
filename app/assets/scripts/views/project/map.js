import React from 'react';
import PropTypes from 'prop-types';

import { getCountryBbox } from '../../utils/countries';

import MapComponent from '../../components/map';
import LocationsSource from '../../components/map/locations-source';
import MeasurementsLayer from '../../components/map/measurements-layer';
import LocationLayer from '../../components/map/location-layer';
import Legend from '../../components/map/legend';

export default function DatasetLocations({
  country,
  locationIds,
  parameters,
  activeParameter,
}) {
  return (
    <section className="fold" id="location-fold-dataset">
      <div className="fold__body">
        <MapComponent bbox={getCountryBbox(country)}>
          <LocationsSource activeParameter={activeParameter}>
            <MeasurementsLayer activeParameter={activeParameter} />
            {/* {locationIds.map(location => (
              <LocationLayer
                activeParameter={activeParameter}
                locationId={location}
              />
            ))} */}
            <LocationLayer
              activeParameter={activeParameter}
              locationId={locationIds[0]}
            />
          </LocationsSource>
          <Legend parameters={parameters} activeParameter={activeParameter} />
        </MapComponent>
      </div>
    </section>
  );
}

DatasetLocations.propTypes = {
  locationId: PropTypes.number.isRequired,
  center: PropTypes.arrayOf(PropTypes.number),
  parameters: PropTypes.array,
  city: PropTypes.string,
  country: PropTypes.string,
  activeParameter: PropTypes.string,
};
