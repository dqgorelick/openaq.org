'use strict';
import React from 'react';
import { connect } from 'react-redux';
import _ from 'lodash';
import moment from 'moment';
import c from 'classnames';

import { formatThousands } from '../utils/format';
import { fetchLocationIfNeeded, fetchLocations, fetchLatestMeasurements,
    fetchMeasurements, invalidateLocations } from '../actions/action-creators';
import HeaderMessage from '../components/header-message';
import InfoMessage from '../components/info-message';
import MapComponent from '../components/map';

var Location = React.createClass({
  displayName: 'Location',

  propTypes: {
    params: React.PropTypes.object,
    _fetchLocationIfNeeded: React.PropTypes.func,
    _fetchLocations: React.PropTypes.func,
    _fetchLatestMeasurements: React.PropTypes.func,
    _fetchMeasurements: React.PropTypes.func,
    _invalidateLocations: React.PropTypes.func,

    countries: React.PropTypes.array,
    sources: React.PropTypes.array,
    parameters: React.PropTypes.array,

    countryData: React.PropTypes.object,

    locations: React.PropTypes.shape({
      fetching: React.PropTypes.bool,
      fetched: React.PropTypes.bool,
      error: React.PropTypes.string,
      data: React.PropTypes.object
    }),

    loc: React.PropTypes.shape({
      fetching: React.PropTypes.bool,
      fetched: React.PropTypes.bool,
      error: React.PropTypes.string,
      data: React.PropTypes.object
    }),

    latestMeasurements: React.PropTypes.shape({
      fetching: React.PropTypes.bool,
      fetched: React.PropTypes.bool,
      error: React.PropTypes.string,
      data: React.PropTypes.object
    }),

    measurements: React.PropTypes.shape({
      fetching: React.PropTypes.bool,
      fetched: React.PropTypes.bool,
      error: React.PropTypes.string,
      data: React.PropTypes.object
    })
  },

  shouldFetchData: function (prevProps) {
    let prevLoc = prevProps.params.name;
    let currLoc = this.props.params.name;

    return prevLoc !== currLoc;
  },

  //
  // Start life-cycle methods.
  //

  componentDidMount: function () {
    this.props._invalidateLocations();
    this.props._fetchLocationIfNeeded(this.props.params.name);
  },

  componentDidUpdate: function (prevProps) {
    this.shouldFetchData(prevProps) && this.props._fetchLocationIfNeeded(this.props.params.name);

    if (this.props.loc.fetched && !this.props.loc.fetching &&
      !this.props.locations.fetched && !this.props.locations.fetching) {
      // Got the location data!
      // Get the locations nearby.
      let loc = this.props.loc.data;
      this.props._fetchLocations(1, {
        city: loc.city,
        country: loc.country
      }, 100);

      // Get the measurements.
      let toDate = moment.utc();
      let fromDate = toDate.clone().subtract(8, 'days');
      this.props._fetchLatestMeasurements(loc.location);
      this.props._fetchMeasurements(loc.location, fromDate, toDate);
    }
  },

  //
  // Start render methods.
  //

  renderStatsInfo: function () {
    const {fetched: lastMFetched, fetching: lastMFetching, error: lastMError, data: lastM} = this.props.latestMeasurements;
    const {fetched: mFetched, fetching: mFetching, error: mError, data: m} = this.props.measurements;

    const error = lastMError || mError;
    const fetched = lastMFetched || mFetched;
    const fetching = lastMFetching || mFetching;

    if (!fetched && !fetching) {
      return null;
    }

    let content = null;
    let intro = null;

    if (fetching) {
      content = <p>Fetching the data</p>;
    } else if (error) {
      intro = <p>We couldn't get stats.</p>;
      content = (
        <div className='fold__body'>
          <InfoMessage>
            <p>Please try again later.</p>
            <p>If you think there's a problem <a href='#' title='Contact openaq'>contact us.</a></p>
          </InfoMessage>
        </div>
      );
    } else {
      let locData = this.props.loc.data;

      let sDate = moment(locData.firstUpdated).format('YYYY/MM/DD');
      let eDate = moment(locData.lastUpdated).format('YYYY/MM/DD');

      let lng = Math.floor(locData.coordinates.longitude * 1000) / 1000;
      let lat = Math.floor(locData.coordinates.latitude * 1000) / 1000;

      content = (
        <div className='fold__body'>
          <div className='col-main'>
            <dl>
              <dt>Measurements</dt>
              <dd>{formatThousands(m.meta.found)}</dd>
              <dt>Collection Dates</dt>
              <dd>{sDate} - {eDate}</dd>
              <dt>Coordinates</dt>
              <dd>N{lat}, E{lng}</dd>
            </dl>
          </div>
          <div className='col-sec'>
            <p className='heading-alt'>Latest Measurements:</p>
            <ul className='measurements-list'>
              {lastM.measurements.map(o => {
                let param = _.find(this.props.parameters, {id: o.parameter});
                return <li key={o.parameter}><strong>{param.name}</strong>{o.value}{o.unit} at {moment(o.lastUpdated).format('YYYY/MM/DD HH:mm')}</li>
              })}
            </ul>
          </div>
        </div>
      );
    }

    return (
      <section className='fold' id='location-stats'>
        <div className='inner'>
          <header className={c('fold__header', {'visually-hidden': !error})}>
            <h1 className='fold__title'>Stats information</h1>
            <div className='fold__introduction prose prose--responsive'>
              {intro}
            </div>
          </header>
          {content}
        </div>
      </section>
    );
  },

  renderSourceInfo: function () {
    let source = _.find(this.props.sources, {name: this.props.loc.data.sourceName});

    return (
      <section className='fold fold--filled' id='location-source'>
        <div className='inner'>
          <header className='fold__header'>
            <h1 className='fold__title'>Source information</h1>
          </header>
          <div className='fold__body'>
            <div className='col-main'>
              <p>Source: <a href={source.sourceURL} title='View source information'>{source.name}</a></p>
            </div>
            <div className='col-sec'>
              {source.description
                ? <p>{source.description}</p>
                : null}
              For more information contact <a href={`mailto:${source.contacts[0]}`}>{source.contacts[0]}</a>.
            </div>
          </div>
        </div>
      </section>
    );
  },

  renderNearbyLoc: function () {
    let {fetched, fetching, error, data: {results: locations}} = this.props.locations;
    if (!fetched && !fetching) {
      return null;
    }

    let intro = null;
    let content = null;

    if (fetching) {
      intro = <p>Fetching the data</p>;
    } else if (error) {
      intro = <p>We couldn't get any nearby locations.</p>;
      content = (
        <InfoMessage>
          <p>Please try again later.</p>
          <p>If you think there's a problem <a href='#' title='Contact openaq'>contact us.</a></p>
        </InfoMessage>
      );
    } else {
      if (locations.length === 1) {
        intro = <p>There are no other locations in {this.props.loc.data.city}, {this.props.countryData.name}.</p>;
      } else {
        intro = <p>There are <strong>{locations.length - 1}</strong> other locations in {this.props.loc.data.city}, {this.props.countryData.name}.</p>;
      }
      content = _.map(locations, 'location').join(', ');
    }

    return (
      <section className='fold' id='location-nearby'>
        <div className='inner'>
          <header className='fold__header'>
            <h1 className='fold__title'>Nearby locations</h1>
            <div className='fold__introduction prose prose--responsive'>
              {intro}
            {content}
            </div>
          </header>
          <div className='fold__body'>
            <MapComponent />
          </div>
        </div>
      </section>
    );
  },

  render: function () {
    let {fetched, fetching, error, data} = this.props.loc;
    if (!fetched && !fetching) {
      return null;
    }

    if (fetching) {
      return (
        <HeaderMessage>
          <h2>Take a deep breath.</h2>
          <p>Location data is loading...</p>
        </HeaderMessage>
      );
    }

    if (error) {
      return (
        <HeaderMessage>
          <h2>Uhoh, something went wrong</h2>
          <p>There was a problem getting the data. If the problem persists let us know.</p>
          <a href='mailto:info@openaq.org' title='Send us an email'>Send us an Email</a>
        </HeaderMessage>
      );
    }

    return (
      <section className='inpage'>
        <header className='inpage__header'>
          <div className='inner'>
            <div className='inpage__headline'>
              <h1 className='inpage__title'>{data.location} <small>in {data.city}, {this.props.countryData.name}</small></h1>
              <div className='inpage__headline-actions'>
                <button type='button' title='Open share options' className='button-inpage-share'><span>Share</span></button>
              </div>
            </div>
            <div className='inpage__actions'>
              <ul>
                <li><a href='' title='View in api' className='button button--primary-bounded button--medium'>API</a></li>
                <li><button type='button' title='Download data for this location' className='button-inpage-download'>Download</button></li>
                <li><a href='' title='Compare location with another' className='button button--primary button--medium'>Compare With</a></li>
              </ul>
            </div>
          </div>
        </header>
        <div className='inpage__body'>
          {this.renderStatsInfo()}
          {this.renderSourceInfo()}

          <section className='fold'>
            <div className='inner'>
              <header className='fold__header'>
                <h1 className='fold__title'>Values breakdown</h1>
              </header>
              <div className='fold__body'>
                coming soon...
              </div>
            </div>
          </section>

          {this.renderNearbyLoc()}

        </div>
      </section>
    );
  }
});

// /////////////////////////////////////////////////////////////////// //
// Connect functions

function selector (state) {
  return {
    countries: state.baseData.data.countries,
    sources: state.baseData.data.sources,
    parameters: state.baseData.data.parameters,

    countryData: _.find(state.baseData.data.countries, {code: (state.location.data || {}).country}),

    loc: state.location,
    locations: state.locations,
    latestMeasurements: state.latestMeasurements,
    measurements: state.measurements
  };
}

function dispatcher (dispatch) {
  return {
    _fetchLocationIfNeeded: (...args) => dispatch(fetchLocationIfNeeded(...args)),
    _fetchLocations: (...args) => dispatch(fetchLocations(...args)),
    _fetchLatestMeasurements: (...args) => dispatch(fetchLatestMeasurements(...args)),
    _fetchMeasurements: (...args) => dispatch(fetchMeasurements(...args)),
    _invalidateLocations: (...args) => dispatch(invalidateLocations(...args))
  };
}

module.exports = connect(selector, dispatcher)(Location);
