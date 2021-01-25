import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import { useRouteMatch } from 'react-router-dom';
import mapbox from 'mapbox-gl';

import {
  defaultColor,
  borderSymbolSize,
  coloredSymbolSize,
} from '../../utils/map-settings';
import Popover from './popover';
import { square, circle } from './symbols';

export default function NodeLayer({
  activeParameter,
  isDisplayingSelectionTools,
  locationIds,
  map,
  sourceId,
  selectedLocations,
  handleLocationSelection,
}) {
  let match = useRouteMatch();

  const locationIdFilter = [
    'in',
    ['number', ['get', 'locationId']],
    ['literal', locationIds],
  ];

  const iconMatch = [
    'match',
    ['get', 'sensorType'],
    'low-cost sensor',
    'square',
    'reference grade',
    'circle',
    'circle', // fallback
  ];

  useEffect(() => {
    if (!map.hasImage('square')) map.addImage('square', square, { sdf: true });
    if (!map.hasImage('circle')) map.addImage('circle', circle, { sdf: true });
    map.addLayer({
      id: `${activeParameter}-outline`,
      source: sourceId,
      'source-layer': 'default',
      type: 'symbol',
      paint: {
        'icon-color': defaultColor,
      },
      layout: {
        'icon-image': iconMatch,
        'icon-size': borderSymbolSize,
        'icon-allow-overlap': true,
      },
      filter: locationIdFilter,
    });

    map.addLayer({
      id: `${activeParameter}-layer`,
      source: sourceId,
      'source-layer': 'default',
      type: 'symbol',
      paint: {
        'icon-color': defaultColor,
      },
      layout: {
        'icon-image': iconMatch,
        'icon-size': coloredSymbolSize,
        'icon-allow-overlap': true,
      },
      filter: locationIdFilter,
    });

    // Change the cursor to a pointer when the mouse is over the layer.
    map.on('mouseenter', `${activeParameter}-layer`, function () {
      map.getCanvas().style.cursor = 'pointer';
    });

    // Change it back to a pointer when it leaves.
    map.on('mouseleave', `${activeParameter}-layer`, function () {
      map.getCanvas().style.cursor = '';
    });

    return () => {
      if (map.getLayer(`${activeParameter}-layer`))
        map.removeLayer(`${activeParameter}-layer`);
      if (map.getLayer(`${activeParameter}-outline`))
        map.removeLayer(`${activeParameter}-outline`);
    };
  }, [sourceId, activeParameter]);

  useEffect(() => {
    const openPopup = e => {
      let popoverElement = document.createElement('div');
      ReactDOM.render(
        <Popover
          activeParameter={activeParameter}
          isDisplayingSelectionTools={isDisplayingSelectionTools}
          locationId={e.features[0].properties.locationId}
          currentPage={parseInt(match.params.id, 10)}
          selectedLocations={selectedLocations}
          handleLocationSelection={handleLocationSelection}
        />,
        popoverElement
      );
      new mapbox.Popup()
        .setLngLat(e.lngLat)
        .setDOMContent(popoverElement)
        .addTo(map);
    };

    map.on('click', `${activeParameter}-layer`, openPopup);
  }, [isDisplayingSelectionTools, selectedLocations, activeParameter]);

  useEffect(() => {
    if (
      locationIds &&
      locationIds.length &&
      map.getLayer(`${activeParameter}-layer`)
    ) {
      map.setFilter(`${activeParameter}-outline`);
      map.setFilter(`${activeParameter}-layer`);
      map.setFilter(`${activeParameter}-outline`);
      map.setFilter(`${activeParameter}-layer`);
    }
    return () => {
      if (map.getLayer(`${activeParameter}-layer`))
        map.removeLayer(`${activeParameter}-layer`);
      if (map.getLayer(`${activeParameter}-outline`))
        map.removeLayer(`${activeParameter}-outline`);
    };
  }, [locationIds, activeParameter]);

  return null;
}

NodeLayer.propTypes = {
  activeParameter: PropTypes.number.isRequired,
  isDisplayingSelectionTools: PropTypes.bool.isRequired,
  locationIds: PropTypes.array,
  sourceId: PropTypes.string,
  map: PropTypes.object,
  selectedLocations: PropTypes.object,
  handleLocationSelection: PropTypes.func,
};
