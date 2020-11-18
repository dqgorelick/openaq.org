import React, { useState } from 'react';
import T from 'prop-types';
import styled from 'styled-components';
import c from 'classnames';
import DatePicker from '@devseed-ui/date-picker';
import { DevseedUiThemeProvider } from '@devseed-ui/theme-provider';

function DateRange(props) {
  const [state, setState] = useState({
    start: new Date('02/01/20'),
    end: new Date(),
  });

  return (
      <DatePicker
        dateState={state}
        dateDomain={[new Date('01/01/15'), new Date()]}
        onChange={value => setState(value)}
        minRange={2}
      />
  );
}
DateRange.propTypes = {};
export default DateRange;
