import React, { useEffect, useMemo, useState } from 'react';
import { PropTypes as T } from 'prop-types';
import fetch from 'isomorphic-fetch';
import { connect } from 'react-redux';
import _ from 'lodash';
import c from 'classnames';
import moment from 'moment';
import { stringify as buildAPIQS } from 'qs';
import OpenAQ from 'openaq-design-system';
const { Modal, ModalHeader, ModalBody } = OpenAQ.Modal;

import { toggleValue } from '../../utils/array';
import {
  fetchLocationsByCountry,
  invalidateLocationsByCountry,
} from '../../actions/action-creators';
import config from '../../config';
import { formatThousands } from '../../utils/format';
import { NO_CITY } from '../../utils/constants';

import LocationSelector from './location-selector';
import DateSelector from './date-selector';
import Options from './options';
import LoadingMessage from '../loading-message';
import DownloadType, { downloadTypeDefault } from './download-type-selector';
import ProjectSelector from './project-selector';
import { fetchProjects } from '../../actions/projects';
import { fetchBaseData } from '../../actions/base-data';

const EMPTY = '';
const API_LIMIT = 66536;

const computeApiUrl = (downloadType, values, initalFilters = {}) => {
  let state = _.clone(values);
  _.forEach(state, (o, i) => {
    if (o === null || !o.length) {
      delete state[i];
    }
  });

  if (state.startYear && state.startMonth && state.startDay) {
    const sDate = moment(
      `${state.startYear}/${parseInt(state.startMonth) + 1}/${state.startDay}`,
      'YYYY/M/D'
    );
    if (sDate.isValid()) {
      state.sDate = sDate.toISOString();
    }
  }

  if (state.endYear && state.endMonth && state.endDay) {
    const eDate = moment(
      `${state.endYear}/${parseInt(state.endMonth) + 1}/${state.endDay}`,
      'YYYY/M/D'
    );
    if (eDate.isValid()) {
      state.eDate = eDate.toISOString();
    }
  }

  // Build url.
  let filters = initalFilters;
  filters.limit = filters.limit || API_LIMIT;

  if (downloadType === 'locations') {
    // It's enough to have one of these.
    if (state.locLocation) {
      filters.location = state.locLocation;
    } else if (state.locArea) {
      filters.city = state.locArea === NO_CITY ? '' : state.locArea;
    } else if (state.locCountry) {
      filters.country = state.locCountry;
    }

    // Sensor type as long as there's no location selected.
    if (state.sensorTypes?.length === 1 && !state.locLocation) {
      filters.sensorType = state.sensorTypes[0];
    }
  } else if (downloadType === 'projects') {
    if (state.projDataset) {
      filters.project = state.projDataset;
    } else if (state.projCountry) {
      filters.country = state.projCountry;
    }
  }

  if (state.sDate) {
    filters.date_from = state.sDate;
  }

  if (state.eDate) {
    filters.date_to = state.eDate;
  }

  if (state.parameters?.length) {
    filters.parameter = state.parameters;
  }
  let f = buildAPIQS(filters, { arrayFormat: 'repeat' });

  return `${config.api}/measurements?${f}`;
};

const fetchVal = url =>
  fetch(url)
    .then(response => {
      if (response.status >= 400) {
        throw new Error('Bad response');
      }
      return response.json();
    })
    .then(
      json => json.meta.found,
      e => {
        console.log('Error on url', url, e);
        return -1;
      }
    );

const sensorTypesOptions = [
  {
    id: 'low-cost sensor',
    displayName: 'Low-cost Sensor',
  },
  {
    id: 'reference grade',
    displayName: 'Reference Grade',
  },
];

function ModalDownload(props) {
  const {
    countries,
    revealed,
    downloadType,
    onModalClose,
    locationsByCountry,
    country,
    area,
    location,
    project,
    parameters,
    datasets,
    _invalidateLocationsByCountry,
    _fetchLocationsByCountry,
    _fetchProjects,
    _fetchBaseData,
  } = props;

  const [formState, setFormState] = useState({
    locCountry: EMPTY,
    locArea: EMPTY,
    locLocation: EMPTY,
    startYear: EMPTY,
    startMonth: EMPTY,
    startDay: EMPTY,
    endYear: EMPTY,
    endMonth: EMPTY,
    endDay: EMPTY,
    projCountry: EMPTY,
    projDataset: EMPTY,
    parameters: [],
    sensorTypes: [],
  });

  const [selectionCount, setSelectionCount] = useState(null);
  const [measurementCount, setMeasurementCount] = useState(null);
  const [selectedDownType, setSelectedDownType] = useState(
    downloadType || downloadTypeDefault
  );

  // Do a quick fetch on the measurements api to get the total count.
  useEffect(() => {
    fetchVal(`${config.api}/measurements?limit=1`).then(v =>
      setMeasurementCount(v)
    );
    _fetchBaseData();
  }, []);

  const useRevealed = (fn, deps) => {
    useEffect(() => {
      if (revealed) return fn();
    }, [revealed, ...deps]);
  };

  // Update the state when the input parameters change. This is used to open the
  // modal in a specific location.
  useRevealed(() => {
    setFormState(s => ({
      ...s,
      locCountry: country || EMPTY,
      projCountry: country || EMPTY,
      locArea: area || EMPTY,
      locLocation: String(location || EMPTY),
      projDataset: String(project || EMPTY),
    }));
  }, [country, area, location, project]);

  useRevealed(() => {
    if (downloadType) {
      setSelectedDownType(downloadType);
    }
  }, [downloadType]);

  // Fetch locations/datasets for a given country.
  useRevealed(() => {
    _invalidateLocationsByCountry();
    const country = formState.locCountry || formState.projCountry;
    if (country) {
      if (selectedDownType === 'locations') {
        _fetchLocationsByCountry(country);
      } else if (selectedDownType === 'projects') {
        _fetchProjects(1, { country }, 1000);
      }
    }
  }, [formState.locCountry, formState.projCountry, selectedDownType]);

  // Use case for when a location has no country.
  // In this case we have to load the location data disregarding the country.
  useRevealed(() => {
    if (!country && location) {
      _fetchLocationsByCountry(null, { location });
    }
  }, [country, location]);

  const checkingUrl = computeApiUrl(selectedDownType, formState, { limit: 1 });
  useRevealed(() => {
    // What is going on here?
    // The api is limited to 65,536 results, but some download options
    // combinations yield a lot more results. They could potentially
    // return the whole database (when nothing is selected). This is not
    // really an option, so the results are limited.
    // Nevertheless the user has to be warned of this, so on every parameter
    // change we query the api to know how many results would be returned, and
    // show a message in case the number is above the limit.
    fetchVal(checkingUrl).then(v => setSelectionCount(v));
  }, [checkingUrl]);

  // State change on option select.
  const onOptSelect = (key, e) => {
    let newState = {
      ...formState,
      [key]: e.target.value,
    };

    if (key === 'locCountry') {
      newState.locArea = EMPTY;
      newState.locLocation = EMPTY;
    } else if (key === 'locArea') {
      newState.locLocation = EMPTY;
    } else if (key === 'projCountry') {
      newState.projDataset = EMPTY;
    }
    setFormState(newState);
  };

  // State change on parameter select.
  const onParameterSelect = value => {
    setFormState(s => ({ ...s, parameters: toggleValue(s.parameters, value) }));
  };

  const onSensorTypeSelect = value => {
    setFormState(s => ({
      ...s,
      sensorTypes: toggleValue(s.sensorTypes, value),
    }));
  };

  const [coreParam, additionalParam] = useMemo(
    () => _.partition(parameters, p => p.isCore),
    [parameters]
  );

  return (
    <Modal
      id="modal-download"
      className="modal--medium"
      onCloseClick={onModalClose}
      revealed={revealed}
    >
      <ModalHeader>
        <div className="modal__headline">
          <h1 className="modal__title">Data Download</h1>
        </div>
      </ModalHeader>
      <ModalBody>
        {countries ? (
          <div className="prose">
            <p className="modal__description">
              Customize the data you want to download, now including low cost
              sensor data. For greater customization, use the{' '}
              <a
                href="http://docs.openaq.org/"
                title="View API"
                target="_blank"
                rel="noreferrer"
              >
                API
              </a>
              .{' '}
              <a
                href="https://openaq-fetches.s3.amazonaws.com/index.html"
                title="View realtime data"
                target="_blank"
                rel="noreferrer"
              >
                Realtime
              </a>{' '}
              archives of all {formatThousands(measurementCount)} measurements
              are also available.{' '}
              <a
                href={config.feedbackUrl}
                title="Share feedback"
                target="_blank"
                rel="noreferrer"
              >
                Share your feedback
              </a>{' '}
              on the low cost sensor pilot so we can continue to improve the
              platform!
            </p>

            <form className="form form--download">
              <DownloadType
                selected={selectedDownType}
                onSelect={setSelectedDownType}
              />
              {selectedDownType === 'locations' && (
                <LocationSelector
                  countries={countries}
                  fetching={locationsByCountry.fetching}
                  fetched={locationsByCountry.fetched}
                  locations={locationsByCountry.data.results}
                  locCountry={formState.locCountry}
                  locArea={formState.locArea}
                  locLocation={formState.locLocation}
                  onOptSelect={onOptSelect}
                />
              )}
              {selectedDownType === 'projects' && (
                <ProjectSelector
                  countries={countries}
                  fetching={datasets.fetching}
                  fetched={datasets.fetched}
                  datasets={datasets.data.results}
                  projCountry={formState.projCountry}
                  projDataset={formState.projDataset}
                  onOptSelect={onOptSelect}
                />
              )}
              <DateSelector
                type="start"
                onOptSelect={onOptSelect}
                dateState={formState}
              />
              <DateSelector
                type="end"
                onOptSelect={onOptSelect}
                dateState={formState}
              />
              {selectedDownType === 'locations' && (
                <Options
                  title="Sensor type"
                  name="sensor-type"
                  list={sensorTypesOptions}
                  selected={formState.sensorTypes}
                  onSelect={onSensorTypeSelect}
                  info="When an individual location is selected the sensor type can't be selected since a location only has one type."
                  disabled={!!formState.locLocation}
                />
              )}
              <Options
                title="Core parameters"
                name="core-params"
                list={coreParam}
                selected={formState.parameters}
                onSelect={onParameterSelect}
              />
              <Options
                title="Additional parameters"
                name="add-params"
                list={additionalParam}
                selected={formState.parameters}
                onSelect={onParameterSelect}
              />
              {selectionCount === -1 && (
                <p style={{ textAlign: 'center' }}>
                  The API has a limit of {formatThousands(API_LIMIT)}{' '}
                  measurements and an error occurred while validating your
                  query. Results may be truncated.
                </p>
              )}
              {selectionCount > API_LIMIT && (
                <p style={{ textAlign: 'center' }}>
                  The API has a limit of {formatThousands(API_LIMIT)}{' '}
                  measurements and your query yields{' '}
                  {formatThousands(selectionCount)}, therefore results will be
                  limited.
                </p>
              )}

              <div className="form__actions">
                <button
                  type="button"
                  className="button button--primary-bounded"
                  onClick={onModalClose}
                >
                  Cancel
                </button>
                <a
                  href={computeApiUrl(selectedDownType, formState, {
                    format: 'csv',
                  })}
                  className={c('button-modal-download', { disabled: false })}
                  target="_blank"
                  rel="noreferrer"
                >
                  Download Selection <small>(csv)</small>
                </a>
              </div>
            </form>
          </div>
        ) : (
          <LoadingMessage />
        )}
      </ModalBody>
    </Modal>
  );
}

ModalDownload.propTypes = {
  _fetchLocationsByCountry: T.func,
  _invalidateLocationsByCountry: T.func,
  _fetchProjects: T.func,
  _fetchBaseData: T.func,
  onModalClose: T.func,
  revealed: T.bool,

  countries: T.array,
  parameters: T.array,
  datasets: T.array,

  locationsByCountry: T.object,

  // Preselect
  downloadType: T.string,
  country: T.string,
  area: T.string,
  location: T.string,
  project: T.string,
};

// /////////////////////////////////////////////////////////////////// //
// Connect functions

function selector(state) {
  return {
    countries: state.baseData.data.countries,
    parameters: state.baseData.data.parameters,

    datasets: state.projects,
    locationsByCountry: state.locationsByCountry,
  };
}

function dispatcher(dispatch) {
  return {
    _invalidateLocationsByCountry: (...args) =>
      dispatch(invalidateLocationsByCountry(...args)),
    _fetchLocationsByCountry: (...args) =>
      dispatch(fetchLocationsByCountry(...args)),
    _fetchProjects: (...args) => dispatch(fetchProjects(...args)),
    _fetchBaseData: (...args) => dispatch(fetchBaseData(...args)),
  };
}

module.exports = connect(selector, dispatcher)(ModalDownload);
