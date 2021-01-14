import React, { useState } from 'react';
import { PropTypes as T } from 'prop-types';
import { useHistory, useLocation } from 'react-router-dom';
import qs from 'qs';
import c from 'classnames';
import _ from 'lodash';
import { Dropdown } from 'openaq-design-system';

import { buildQS } from '../../utils/url';
import { toggleValue } from '../../utils/array';

const defaultSelected = {
  parameters: [],
  countries: [],
  sources: [],
  order_by: [],
};

const sortOptions = ['name', 'count'];
const initFromLocation = ({ parameters, countries, sources, order_by }) => {
  return {
    parameters: parameters ? parameters.split(',').map(Number) : [],
    countries: countries ? countries.split(',') : [],
    sources: sources ? sources.split(',') : [],
    order_by: order_by ? order_by.split(',') : [],
  };
};

export default function Filter({ parameters, countries, sources }) {
  let history = useHistory();
  let location = useLocation();

  const [selected, setSelected] = useState(
    initFromLocation(qs.parse(location.search, { ignoreQueryPrefix: true }))
  );

  parameters.sort((a, b) => a.name.localeCompare(b.name));

  function onFilterSelect(what, value) {
    let query = qs.parse(location.search, {
      ignoreQueryPrefix: true,
    });

    switch (what) {
      case 'order_by': {
        if (query.order_by && query.order_by.includes(value)) {
          query.order_by = [];
          setSelected(prev => ({
            ...prev,
            ['order_by']: [],
          }));
        } else {
          query.order_by = [value];
          setSelected(prev => ({
            ...prev,
            ['order_by']: [value],
          }));
        }
        break;
      }

      case 'parameters': {
        // Parameters are tracked by id which is a Number so it needs to be cast
        const parameters =
          query && query.parameters
            ? query.parameters.split(',').map(Number)
            : [];

        query.parameters = toggleValue(parameters, value);

        setSelected(prev => ({
          ...prev,
          ['parameters']: toggleValue(prev['parameters'], value),
        }));
        break;
      }

      case 'countries': {
        const countries =
          query && query.countries ? query.countries.split(',') : [];

        query.countries = toggleValue(countries, value);

        setSelected(prev => ({
          ...prev,
          ['countries']: toggleValue(prev['countries'], value),
        }));
        break;
      }

      case 'sources': {
        const sources = query && query.sources ? query.sources.split(',') : [];

        query.sources = toggleValue(sources, value);

        setSelected(prev => ({
          ...prev,
          ['sources']: toggleValue(prev['sources'], value),
        }));
        break;
      }

      case 'clear':
        query = null;
        setSelected(defaultSelected);
        break;
    }

    // update url
    history.push(`/projects?${buildQS(query)}`);
  }

  return (
    <>
      <div className="hub-filters">
        <div className="inner">
          <div className="filters__group">
            <h2>Filter by</h2>
            <div className="filter__values">
              <Dropdown
                triggerElement="a"
                triggerTitle="View parameter options"
                triggerText="Parameter"
                triggerClassName="button--drop-filter filter--drop  "
              >
                <ul
                  role="menu"
                  data-cy="filter-parameters"
                  className="drop__menu drop__menu--select scrollable"
                >
                  {_.sortBy(_.uniq(parameters, 'id')).map(param => {
                    return (
                      <li key={param.id}>
                        <div
                          data-cy="filter-menu-item"
                          className={c('drop__menu-item', {
                            'drop__menu-item--active': selected.parameters.includes(
                              param.id
                            ),
                          })}
                          data-hook="dropdown:close"
                          onClick={() => onFilterSelect('parameters', param.id)}
                        >
                          <span data-cy={param.id}>{param.displayName}</span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </Dropdown>

              <Dropdown
                triggerElement="a"
                triggerTitle="View country options"
                triggerText="Country"
                triggerClassName="button--drop-filter filter--drop  "
              >
                <ul
                  role="menu"
                  data-cy="filter-countries"
                  className="drop__menu drop__menu--select scrollable"
                >
                  {_.sortBy(countries).map(o => {
                    return (
                      <li key={o.code}>
                        <div
                          data-cy="filter-menu-item"
                          className={c('drop__menu-item', {
                            'drop__menu-item--active': selected.countries.includes(
                              o.code
                            ),
                          })}
                          data-hook="dropdown:close"
                          onClick={() => {
                            onFilterSelect('countries', o.code);
                          }}
                        >
                          <span data-cy={o.name}>{o.name}</span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </Dropdown>

              {sources && (
                <Dropdown
                  triggerElement="a"
                  triggerTitle="View source options"
                  triggerText="Data Source"
                  triggerClassName="button--drop-filter filter--drop  "
                >
                  <ul
                    role="menu"
                    data-cy="filter-sources"
                    className="drop__menu drop__menu--select scrollable"
                  >
                    {_.sortBy(sources).map(o => {
                      return (
                        <li key={o.sourceSlug}>
                          <div
                            data-cy="filter-menu-item"
                            className={c('drop__menu-item', {
                              'drop__menu-item--active': selected.sources.includes(
                                o.sourceSlug
                              ),
                            })}
                            data-hook="dropdown:close"
                            onClick={() => {
                              onFilterSelect('sources', o.sourceSlug);
                            }}
                          >
                            <span data-cy={o.sourceSlug}>{o.sourceName}</span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </Dropdown>
              )}
            </div>
          </div>
          <div className="filters__group">
            <h2>Order by</h2>
            <div className="filter__values">
              <Dropdown
                triggerElement="a"
                triggerTitle="View sort options"
                triggerText="Order By"
                triggerClassName="button--drop-filter filter--drop sort-order"
              >
                <ul
                  role="menu"
                  className="drop__menu drop__menu--select scrollable"
                >
                  {_.sortBy(sortOptions).map(o => {
                    return (
                      <li key={o}>
                        <div
                          className={c('drop__menu-item', {
                            'drop__menu-item--active': selected.order_by.includes(
                              o
                            ),
                          })}
                          data-hook="dropdown:close"
                          onClick={() => onFilterSelect('order_by', o)}
                        >
                          <span>{`${o[0].toUpperCase()}${o.slice(1)}`}</span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </Dropdown>
            </div>
          </div>
        </div>
      </div>

      {Object.values(selected).find(o => o.length > 0) && (
        <div className="filters-summary">
          {!!parameters.length &&
            selected.parameters.map(o => {
              const parameter = parameters.find(x => x.id === o);
              return (
                <button
                  type="button"
                  className="button--filter-pill"
                  data-cy="filter-pill"
                  key={parameter.id}
                  onClick={() => onFilterSelect('parameters', parameter.id)}
                >
                  <span>{parameter.displayName}</span>
                </button>
              );
            })}

          {!!countries.length &&
            selected.countries.map(o => {
              const country = countries.find(x => x.code === o);
              return (
                <button
                  type="button"
                  className="button--filter-pill"
                  data-cy="filter-pill"
                  key={country.code}
                  onClick={() => onFilterSelect('countries', country.code)}
                >
                  <span>{country.name}</span>
                </button>
              );
            })}

          {sources &&
            !!sources.length &&
            selected.sources.map(o => {
              const source = sources.find(x => x.sourceSlug === o);
              return (
                <button
                  type="button"
                  className="button--filter-pill"
                  data-cy="filter-pill"
                  key={source.sourceSlug}
                  onClick={() => onFilterSelect('sources', source.sourceSlug)}
                >
                  <span>{source.sourceName}</span>
                </button>
              );
            })}

          {selected.order_by.map(o => {
            return (
              <button
                type="button"
                className="button--filter-pill orderBy"
                key={o}
                onClick={() => onFilterSelect('order_by', o)}
              >
                <span>{o}</span>
              </button>
            );
          })}

          <button
            type="button"
            className="button button--small button--primary-unbounded"
            title="Clear all selected filters"
            data-cy="filter-clear"
            onClick={e => {
              e.preventDefault();
              onFilterSelect('clear');
            }}
          >
            <small> (Clear Filters)</small>
          </button>
        </div>
      )}
    </>
  );
}

Filter.propTypes = {
  organizations: T.array,
  parameters: T.array,
  sources: T.array,
  countries: T.array,
  order_by: T.array,
};
