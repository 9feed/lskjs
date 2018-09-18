import React, { Component } from 'react';
import PropTypes from 'prop-types';
import importcss from 'importcss';
import { inject } from 'mobx-react';
import get from 'lodash/get';
import filter from 'lodash/filter';
import SocialButton from '../SocialButton';
import buttons from '../../socials';

@inject('config')
export default class SocialButtons extends Component {
  static propTypes = {
    onClick: PropTypes.func.isRequired,
    config: PropTypes.object.isRequired,
  }
  render() {
    const { config } = this.props;
    const socials = get(config, 'auth.socials', []);
    const buttons2 = filter(buttons, (value, name) => {
      if (socials.indexOf(value.name) === -1) return false;
      return true;
    });

    if (buttons2.length === 0) return null;

    return (
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        {buttons2.map((value, i) => (
          <SocialButton
            key={value.name}
            name={value.name}
            clickable
            onClick={() => this.props.onClick(value.name)}
            size={40}
            style={{ marginLeft: i ? 10 : 0 }}
          />
        ))}
      </div>
    );
  }
}