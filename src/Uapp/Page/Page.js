import React from 'react';
import merge from 'lodash/merge';
import get from 'lodash/get';
import map from 'lodash/map';
import ReactDOM from 'react-dom/server';
import Root from '../Root';
const DEBUG = false;

export default class Page {

  Root = Root;

  state = {
    favicon: '/favicon.ico',
  }

  defaultProps = {
  }

  constructor(...args) {
    this.init(...args);
  }

  async init(props = {}, state = {}) {
    this._page = true;

    this.props = {
      ...this.defaultProps,
      ...props,
    };
    this.state = {
      ...this.defaultState,
      ...state,
    };

    this.uapp = this.props.uapp || {};

    this.state.titles = [];
    this.disabled = false;
  }

  toTop() {
    if (__CLIENT__) document.body.scrollTop = 0;
    return this;
  }

  setState(state = {}) {
    this.state = {
      ...this.state,
      ...state,
    };
  }

  getState() {
    return this.state;
  }


  // useRes(res) {
  //   if (this.state.redirect) {
  //     return res.redirect(this.state.redirect);
  //   }
  //   return res
  //     .status(200)
  //     .send(this.render());
  // }

  getRes(isRenderHtml = false) {
    if (this.state.redirect) {
      return {
        redirect: this.state.redirect,
      };
    }
    if (isRenderHtml) {
      return {
        status: 200,
        content: this.renderHtml(),
      };
    }
    return {
      status: 200,
      component: this.renderRoot(),
    };
  }

  enable() {
    this.disabled = false;
    return this;
  }
  disable() {
    this.disabled = true;
    return this;
  }

  error(err) {
    if (__DEV__) {
      if (err.message) {
        console.error(err.message);
        console.error(err.stack);
      } else {
        console.error(err);
      }
    }
    if (this.disabled) return this;
    return this
      .layout(this.state.errorLayout)
      .component('div', { children: err });
  }

  loading() {
    return this.component('Loading...');
  }


  async next(next) {
    if (this.disabled) return this;
    try {
      const res = await next();
      return res;
    } catch(err) {
      return this.error(err);
    }
  }

  title(...args) {
    return this.pushTitle(...args);
  }


  pushTitle(...args) {
    return this.meta({ title: args[0] });
  }

  composeMeta(metas = []) {
    return merge({}, ...metas);
  }

  getMeta(name, def = null) {
    if (name) return (this.state.meta || {})[name] || def;
    return this.state.meta || {};
  }

  meta(meta) {
    if (this.disabled) return this;
    if (!this.state.metas) this.state.metas = [];
    this.state.metas.push(meta);
    this.state.meta = this.composeMeta(this.state.metas);
    return this;
  }

  errorLayout(errorLayout) {
    if (this.disabled) return this;
    this.state.errorLayout = errorLayout;
    return this;
  }

  layout(layout) {
    if (this.disabled) return this;
    this.state.layout = layout;
    return this;
  }

  async component(...args) {
    if (this.disabled) return this;
    DEBUG && console.log('args[0]', args[0]);
    const result = await args[0];
    if (result.default) {
      args[0] = result.default;
    } else {
      args[0] = result;
    }
    // }
    if (args.length > 1) {
      this.state.component = args;
    } else {
      this.state.component = args[0];
    }
    DEBUG && console.log('this.state.component', this.state.component);
    return this.toTop();
  }

  content(content) {
    if (this.disabled) return this;
    this.state.content = content;
    return this;
  }

  redirect(redirect) {
    if (this.disabled) return this;
    this.state.redirect = redirect;
    return this;
  }

  /////////////////////////////////////////////////////////////////////////

  renderLayout(props = {}, layout = null) {
    // console.log('page.renderLayout', props);
    // if (typeof props.children === 'undefined') {
    //   props.children = 'undefined'
    // }
    if (!this.state.layout) {
      return props.children;
    }
    if (!layout) layout = this.state.layout;
    const Layout = layout;
    // console.log('page.render');

    return <Layout {...props} />;
  }

  renderComponent() {
    DEBUG && console.log('Page.renderComponent', this.state);
    DEBUG && console.log('Array.isArray(this.state.component)', Array.isArray(this.state.component));
    if (!Array.isArray(this.state.component)) {
      return this.state.component;
    }
    DEBUG && console.log('return !@#!@#!@#!@');
    return React.createElement(this.state.component[0], this.state.component[1]);
  }

  renderComponentWithLayout() {
    let children = this.renderComponent();
    // console.log('page.children111', children, typeof children, typeof children === 'undefined');
    if (typeof children === 'undefined') {
      if (__DEV__) {
        children = '@undefined';
      } else {
        children = '';
      }
    };
    // console.log('page.children222', children, typeof children, typeof children === 'undefined');

    return this.renderLayout({
      children,
    });
  }

  getRootComponentProps() {
    return {
      uapp: this.uapp,
      history: this.uapp.history,
      insertCss: this.uapp.insertCss,
    };
  }

  renderRoot() {
    const Root = this.Root;
    return (
      <Root {...this.getRootComponentProps()}>
        {this.renderComponentWithLayout()}
      </Root>
    );
  }

  getTitle() {
    const metas = this.state.metas || [];
    return get(metas, `${metas.length - 1}.title`) || '';
  }

  renderTitle() {
    return this.renderFullTitle();
  }

  // RENDER
  renderFullTitle() {
    return (this.state.metas || []).reverse().map(t => t.title).join(' - ');
  }

  renderOGMeta() {
    return `\
<meta property="og:title" content="${this.getMeta('title')}" />
<meta property="og:description" content="${this.getMeta('description')}" />
<meta property="og:url" content="${this.getMeta('url')}" />
<meta property="og:image" content="${this.getMeta('image')}" />
`;
  }

  renderFavicon() {
    return `\
${!this.state.favicon ? '' : `<link rel="shortcut icon" href="${this.state.favicon}" type="image/x-icon" />`}
<link rel="apple-touch-icon" sizes="57x57" href="/assets/icons/apple-icon-57x57.png" />
<link rel="apple-touch-icon" sizes="60x60" href="/assets/icons/apple-icon-60x60.png" />
<link rel="apple-touch-icon" sizes="72x72" href="/assets/icons/apple-icon-72x72.png" />
<link rel="apple-touch-icon" sizes="76x76" href="/assets/icons/apple-icon-76x76.png" />
<link rel="apple-touch-icon" sizes="114x114" href="/assets/icons/apple-icon-114x114.png" />
<link rel="apple-touch-icon" sizes="120x120" href="/assets/icons/apple-icon-120x120.png" />
<link rel="apple-touch-icon" sizes="144x144" href="/assets/icons/apple-icon-144x144.png" />
<link rel="apple-touch-icon" sizes="152x152" href="/assets/icons/apple-icon-152x152.png" />
<link rel="apple-touch-icon" sizes="180x180" href="/assets/icons/apple-icon-180x180.png" />
<link rel="icon" type="image/png" sizes="192x192"  href="/assets/icons/android-icon-192x192.png" />
<link rel="icon" type="image/png" sizes="32x32" href="/assets/icons/favicon-32x32.png" />
<link rel="icon" type="image/png" sizes="96x96" href="/assets/icons/favicon-96x96.png" />
<link rel="icon" type="image/png" sizes="16x16" href="/assets/icons/favicon-16x16.png" />
<link rel="manifest" href="/assets/icons/manifest.json" />
<meta name="msapplication-TileImage" content="/assets/icons/ms-icon-144x144.png" />
<meta name="msapplication-TileColor" content="#ff0000" />
<meta name="theme-color" content="#ff0000" />
`;
  }


  getRootState() {
    return this.uapp.rootState;
  }

  renderHead() {
    return `\
<title>${this.renderTitle()}</title>
<meta charset="utf-8">
<meta http-equiv="x-ua-compatible" content="ie=edge" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="description" content="${this.getMeta('description')}"/>
${this.renderFavicon()}
${this.renderOGMeta()}
${this.renderAssets('css')}
${this.renderStyle()}
`;
  }


  getHtmlClass() {
    const ua = {};// useragent.is(req.headers['user-agent'])
    ua.js = false;
    ua.touchable = false;

    const postfix = __DEV__ ? ' __DEV__' : '';
    return (map(ua, (val, key) => `ua_${key}_${val ? 'yes' : 'no'}`).join(' ') || '') + postfix;
  }


  renderStyle() {
    const styles = this.uapp.styles || [];
    return `<style id="css">${(styles).join('\n')}</style>`;
  }



  renderChunks(type, chunk = 'client') {
    const props = this.uapp;
    if (!props || !props.assets) return '';
    // console.log('props.assets', props.assets);
    const assets = props.assets[chunk];
    if (type === 'css' && assets) {
      return assets
        .filter(filename => filename.includes('.css'))
        .map(filename => (
          `<link rel="stylesheet" href="${filename}">`
        ))
        .join('\n')
    }
    if (type === 'js' && assets) {
      return assets
        .filter(filename => filename.includes('.js'))
        .map(filename => (
          `<script id="js" src="${filename}"></script>`
        ))
        .join('\n')
    }
    return '';
  }

  renderAssets(type) {
    const props = this.uapp;
    if (!props || !props.assets) return '';
    if (type === 'css' && props.assets) {
      return `<link rel="stylesheet" href="${props.assets['client.css']}">`;
    }
    if (type === 'js' && props.assets) {
      return `<script id="js" src="${props.assets['client.js']}"></script>`;
    }
    return '';
  }

  renderFooter() {
    const util = require('util');
    const debug = __DEV__ && __SERVER__ ? `<!--
DEBUG INFO

__SERVER__: ${__SERVER__}
__DEV__: ${__DEV__}
__PROD__: ${__PROD__}
__STAGE__: ${__STAGE__}

uapp.keys: ${Object.keys(this.uapp)}
uapp.config:
${util.inspect(this.uapp.config)}
uapp.page.state:
${util.inspect(this.uapp.page.state)}
-->` : '';
      // const debug = __DEV__ && __SERVER__ ? `<!-- ${util.inspect({ ...this.props, style: undefined, req: undefined, ctx: null })} -->` : '';
      // ${debug}
    return `\
${debug}
${this.state.footerHtml || ''}
`;
  }

  renderHtml() {
    let root;
    let rootDom;
    try {
      rootDom = this.renderRoot();
      root = ReactDOM.renderToStaticMarkup(rootDom); // because async style render
    } catch (err) {
      const text = ['Error', 'Page.renderHtml', 'ReactDOM.renderToStaticMarkup', ''].join(':\n');
      console.error(text, err);
      // __DEV__ && console.log(err);
      if (__DEV__) {
        return `<pre>${text}${err.stack}</pre>`;
      }
      return err.message;
    }
    return `\
  <!doctype html>
  <html class="${this.getHtmlClass()}">
    <head>
      ${this.renderHead()}
    </head>
    <body>
      <div id="root"/>
        ${root}
      </div>
      <script>
        window.__ROOT_STATE__ = ${JSON.stringify(this.getRootState(), null, __DEV__ ? 4 : 0)};
      </script>
      ${this.renderAssets('js')}
      ${this.renderFooter()}
    </body>
  </html>
      `;
  }


}
