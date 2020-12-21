import React, { useState, useEffect } from 'react';
import { PropTypes as T } from 'prop-types';
import { connect } from 'react-redux';
import _ from 'lodash';

import { formatThousands } from '../../utils/format';
import config from '../../config';
import { openDownloadModal } from '../../actions/action-creators';

import Header, { LoadingHeader, ErrorHeader } from '../../components/header';
import LoadingMessage from '../../components/loading-message';
import InfoMessage from '../../components/info-message';
import LocationCard from '../locations-hub/location-card';
import CountryMap from './map';

const defaultLocations = {
  locationFetching: false,
  locationError: null,
  locations: null,
};

const defaultCountry = {
  countryFetching: false,
  countryError: null,
  country: null,
};

function Country(props) {
  const id = props.match.params.name;
  const [
    { locationFetching, locationError, locations },
    setLocations,
  ] = useState(defaultLocations);
  const [{ countryFetching, countryError, country }, setCountry] = useState(
    defaultCountry
  );

  useEffect(() => {
    const fetchLocations = id => {
      setLocations(state => ({
        ...state,
        locationFetching: true,
        locationError: null,
      }));
      let limit = 10000;
      fetch(`${config.api}/locations?limit=${limit}&country=${id}`)
        .then(response => {
          if (response.status >= 400) {
            throw new Error('Bad response');
          }
          return response.json();
        })
        .then(
          json => {
            setLocations(state => ({
              ...state,
              fetched: true,
              locationFetching: false,
              locations: json.results,
            }));
          },
          e => {
            console.log('e', e);
            setLocations(state => ({
              ...state,
              locationFetching: false,
              locationError: e,
            }));
          }
        );
    };

    const fetchCountry = id => {
      setCountry(state => ({
        ...state,
        countryFetching: true,
        countryError: null,
      }));
      fetch(`${config.api}/countries/${id}`)
        .then(response => {
          if (response.status >= 400) {
            throw new Error('Bad response');
          }
          return response.json();
        })
        .then(
          json => {
            setCountry(state => ({
              ...state,
              countryFetching: false,
              country: json.results[0],
            }));
          },
          e => {
            console.log('e', e);
            setCountry(state => ({
              ...state,
              countryFetching: false,
              countryError: e,
            }));
          }
        );
    };

    fetchLocations(id);
    fetchCountry(id);

    return () => {
      setLocations(defaultLocations);
      setCountry(defaultCountry);
    };
  }, []);

  function onDownloadClick(data) {
    // e && e.preventDefault();
    props._openDownloadModal(data);
  }

  // gets sources from locations and uses set to create an array with no duplicates
  const sourceList = locations
    ? Array.from(
        new Set(locations.map(loc => loc.sources[0]).map(JSON.stringify))
      ).map(JSON.parse)
    : null;

  let locationGroups = _(locations).sortBy('city').groupBy('city').value();

  return (
    <section className="inpage" data-cy="country-page">
      {countryFetching || locationFetching ? (
        <LoadingHeader />
      ) : country && locations && !countryError ? (
        <>
          <Header
            id="country"
            tagline="Country"
            title={country.name}
            stats={[
              { number: country.cities, label: 'areas' },
              {
                number: country.locations,
                label: country.locations > 1 ? 'locations' : 'location',
              },
              {
                number: formatThousands(country.count),
                label: 'measurements',
              },
              {
                number: sourceList.length,
                label: sourceList.length > 1 ? 'sources' : 'source',
              },
            ]}
            action={{
              api: config.apiDocs,
              download: () =>
                onDownloadClick({
                  country: id,
                }),
            }}
          />
          <div className="inpage__body">
            <CountryMap />
            {locationFetching ? (
              <LoadingMessage />
            ) : !locationError ? (
              <div className="countries-list">
                {Object.entries(locationGroups).map(([city, cityLocations]) => (
                  <section
                    className="fold fold--locations"
                    key={city}
                    data-cy="country-list"
                  >
                    <div className="inner">
                      <header className="fold__header">
                        <h1 className="fold__title">
                          {city}{' '}
                          <small>
                            {locations.length}{' '}
                            {locations.length > 1 ? 'locations' : 'location'}
                          </small>
                        </h1>
                        <p className="fold__main-action">
                          <a
                            href="#"
                            className="location-download-button"
                            title={`Download ${city} data`}
                            onClick={() =>
                              onDownloadClick({
                                country: id,
                                area: city,
                              })
                            }
                          >
                            Download
                          </a>
                        </p>
                      </header>
                      <div className="inpage__results">
                        {locations.map(loc => {
                          let openModal = () =>
                            onDownloadClick({
                              country: loc.country,
                              area: loc.city,
                              location: loc.id,
                            });
                          return (
                            <LocationCard
                              mobile={loc.isMobile}
                              key={loc.id}
                              city={loc.city}
                              country={loc.country}
                              firstUpdated={loc.firstUpdated}
                              id={loc.id}
                              lastUpdated={loc.lastUpdated}
                              name={loc.name}
                              onDownloadClick={openModal}
                              parametersList={loc.parameters}
                              sources={loc.sources}
                              sourceType={loc.sourceType}
                              totalMeasurements={loc.measurements}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              <InfoMessage standardMessage />
            )}
          </div>
        </>
      ) : (
        <ErrorHeader />
      )}
    </section>
  );
}

Country.propTypes = {
  match: T.object,

  _openDownloadModal: T.func,

  countries: T.array,
  sources: T.array,
  parameters: T.array,

  latestMeasurements: T.shape({
    fetching: T.bool,
    fetched: T.bool,
    error: T.string,
    data: T.object,
  }),

  locations: T.shape({
    fetching: T.bool,
    fetched: T.bool,
    error: T.string,
    data: T.object,
  }),
};

// /////////////////////////////////////////////////////////////////// //
// Connect functions

function selector() {
  return {};
}

function dispatcher(dispatch) {
  return {
    _openDownloadModal: (...args) => dispatch(openDownloadModal(...args)),
  };
}

export default connect(selector, dispatcher)(Country);
