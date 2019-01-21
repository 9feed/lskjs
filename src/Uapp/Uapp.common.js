import map from 'lodash/map';
import get from 'lodash/get';
import UniversalRouter from 'universal-router';
import Api from 'apiquery';
import cloneDeep from 'lodash/cloneDeep';
import forEach from 'lodash/forEach';
import autobind from 'core-decorators/lib/autobind';
import { observable } from 'mobx';

import Core from '../Core';

global.DEV = () => null;

export default class Uapp extends Core {
  name = 'Uapp';
  Api = Api;
  Page = require('./Page').default;
  Root = require('./Root').default;
  theme = require('./theme').default;

  getApi() {
    const apiConfig = (this.config && this.config.api || {});

    const url = get(apiConfig, 'url', __CLIENT__ ? '/' : `http://127.0.0.1:${this.app.config.port}`);
    const api = new this.Api({
      ...apiConfig,
      url,
    });

    return api;
  }

  async init() {
    await super.init();
    this.config = this.getConfig();
    this.initConfig = cloneDeep(this.config); // подумать в init или в run


    this.stores = this.getStores();

    this.user = new this.stores.User(this.rootState.user);
    this.auth = new this.stores.Auth();


    // TODO: прокинуть домен (req) когда сервер
    this.api = this.getApi();
    this.initI18();
  }

  getStores() {
    return require('./stores').default();
  }

  async run() {
    await super.run();
    const context = this.provide();
    this.log.trace('router.context', Object.keys(context));
    this.routes = this.getRoutes();
    this.router = new UniversalRouter(this.routes, {
      context,
    });
    await this.lazyRun();
  }


  async lazyRun() {
    await this.auth.init();
    await this.reconnect();
    // await this.initStateStorage();
    // await super.run();
  }


  async reconnect() {
    // await this.auth.reconnect();
    // await this.initStateStorage();
  }


  // ////////////////////
  @observable state2 = {
    testInput: '',
    locale: '',
    helpers: {},
  };
  async setState(data = {}, params = {}) {
    const { ws, localStorage, appstate } = {
      appstate: true,
      ws: true,
      localStorage: true,
      ...params,
    };
    // console.log({ data });
    if (appstate) {
      forEach(data, (value, key) => {
        this.state2[key] = value;
      });
    }
    if (__CLIENT__) {
      // Object.assign(this.state2, data);
      if (localStorage) {
        window.localStorage.setItem('appstate', JSON.stringify(this.state2));
      }
      if (ws) {
        // TODO: websockets
        const state = await this.api.fetch('/api/module/appstate/save', {
          method: 'POST',
          body: {
            userId: this.user?._id,
            ...data,
            // state: data,
          },
        });
        this.setState(state.data, {
          ws: false,
        });
        // forEach(state, (value, key) => {
        //   this.state2[key] = value;
        // });
        // this.setState(state);
      }
    }
  }

  async initStateStorage() {
    // if (__CLIENT__) {
    // this.state = storedObservable('uappState', this.state, 500);
    // this.state = storedObservable('uappState', this.state, 100);
    // console.log('initStateStorage');
    // let storageData = {};
    // let state = {};
    // state = {
    //   ...state,
    //   ...(this.rootState.appstate || {}),
    // };
    // if (__CLIENT__) {
    //   try {
    //     storageData = JSON.parse(window.localStorage.getItem('appstate'));
    //     state = {
    //       ...state,
    //       ...storageData,
    //     };
    //   } catch (err) {
    //     console.error("Uapp.initStateStorage: JSON.parse(window.localStorage.getItem('appstate'))", err); // eslint-disable-line
    //   }
    // }

    let state = {};
    const userId = this.user?._id;
    if (userId) {
      // console.log('-- 1111');
      // console.log('-- 1111', this.api);
      const res = await this.api.fetch('/api/module/appstate/getOrCreate', {
        qs: {
          userId,
        },
      }).catch(err => this.log.error('Uapp.initStateStorage: getOrCreate', err));
      // console.log('-- 2222');
      if (res?.data) {
        state = {
          ...state,
          ...res.data,
        };
      }
    }
    // const updates = {
    //   appstate: true,
    //   ws: false,
    //   localstorage: true,
    // };

    // con
    // if (!DB) {
    //   updates.ws = true;
    // }

    this.setState(state, {
      ws: false,
      localstorage: false,
    });
    // console.log('initStateStorage /api/module/appstate/get', { data: res?.data });


    // if (__CLIENT__) this.setState();
    // autorun(() => {
    //   if (__DEV__ || __CLIENT__) {
    //     // console.log('uapp.state was updated, helpers.dashboard=', this.state.helpers?.dashboard);
    //   }
    //   // console.log(sum.get())
    // }, { delay: 100 });
    // }
  }


  url(str, params = null) {
    let query = '';
    if (params) {
      query = `?${map(params, (val, key) => `${key}=${val}`).join('&')}`;
    }
    return `${this.config.url || ''}${str}${query}`;
  }


  @observable locale = 'ru';
  @observable t = e => e;
  state = {
    secret: false,
  };
  setLocale = require('./helpers/setLocale').default;
  getLocale = require('./helpers/getLocale').default;
  getI18Params = require('./helpers/getI18Params').default;
  getI18 = require('./helpers/getI18').default;
  initI18 = require('./helpers/initI18').default;

  prepareNotificationData = require('./helpers/prepareNotificationData').default;
  toast = require('./helpers/toast').default.bind(this);


  @autobind
  onError(err = {}, err2) {
    this.toast({
      ...this.prepareNotificationData(err, 'error'),
      ...this.prepareNotificationData(err2, 'error'),
    });
  }


  confirm(props) {
    return this.confirmRef?.open(props);
  }

  scrollTo() { }

  getConfig() {
    const { config } = this;
    return config;
  }

  getRoutes() {
    return {};
  }

  resetPage() {
    // console.log('resetPage');
    if (!this.page) {
      this.page = new this.Page();
    }
    this.page.init({
      Root: this.Root,
      uapp: this,
    });
    return this.page;
  }

  async resolve(reqParams = {}) {
    await this.beforeResolve();
    // console.log('resolve');
    const req = Api.createReq(reqParams);
    __CLIENT__ && __DEV__ && this.log.trace('Uapp.resolve', req.path, req.query);
    // this.log.trace('resolve1', req.path, req.query);
    // this.log.trace({r:'resolve2'});
    // this.log.trace('resolve3', 'some');
    // __DEV__ && console.log('Uapp.resolve', req);
    this.resetPage();
    // console.log('page $$$$', this.page);
    // console.log('this.router.resolve');
    try {
      // console.log('Uapp.router.resolve', );
      await this.router.resolve({
        pathname: reqParams.path,
        path: reqParams.path,
        query: reqParams.query,
        req,
        page: this.page,
      });
    } catch (err) {
      console.error('uapp.router.resolve err', err, this.log); //eslint-disable-line
      // this.log.error('resolveErr', err);
    }
    await this.afterResolve();
  }

  async beforeResolve(...args) {
  }
  async afterResolve(...args) {
  }

  restart() {

  }

  provide() {
    return {
      uapp: this,
      log: this.log,
      config: this.config,
      page: this.page,
      rootState: this.rootState,
      state: this.state, // appState

      api: this.api,
      auth: this.auth,
      user: this.user,

      i18: this.i18,
      t: this.t,
      locale: this.locale,
      theme: this.theme,
    };
  }
}

