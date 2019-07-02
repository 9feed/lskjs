import Promise from 'bluebird';
import hash from 'object-hash';
import Cacheman from 'cacheman';
import get from 'lodash/get';
import getDocsTemplate from './getDocsTemplate';

export default class Api {
  constructor(app, params = {}) {
    this.app = app;
    this.asyncRouter = app.asyncRouter;
    if (app.helpers && app.helpers.wrapResoursePoint) {
      this.wrapResoursePoint = app.helpers.wrapResoursePoint;
    }
    // this.isAuth = __DEV__ ? () => true : app.helpers.isAuth;
    this.isAuth = () => true; // @TODO: Andruxa, перед релизом исправь
    this.e = app.errors.e;
    this.cacheStore = new Cacheman('api', {
      ttl: 60,
    });
    Object.assign(this, params);
  }
  url(path, params) {
    return this.app.url((this.path || '/api') + path, params);
  }
  getGteLte(item) {
    const $gte = get(item, '[0]');
    const $lte = get(item, '[1]');
    const res = {};
    if ($lte !== null && typeof $lte !== 'undefined') {
      res.$lte = $lte;
    }
    if ($gte !== null && typeof $gte !== 'undefined') {
      res.$gte = $gte;
    }
    if (!Object.keys(res).length) return null;
    return res;
  }
  getRoutes() {
    return {
      '*': () => ({ ok: true, message: 'Api.getRoutes is empty' }),
    };
  }
  isAdmin(req) {
    return true;
    if (get(req, 'user.role') !== 'admin') throw this.e(403, '!admin');
  }
  assign(model, params, fields) {
    fields.forEach((field) => {
      if (params[field] === undefined) return;
      model[field] = params[field];
      if (!model.markModified) return;
      model.markModified(field);
    });
  }
  // isAdmin(req) {
  //   if (req.user?.role !== 'admin') throw this.e(403, '!admin');
  //   // return req.user?.role === 'admin';
  // }
  equal(objectId1, objectId2) {
    return String(objectId1) === String(objectId2);
  }
  findAndCountByParams(Model, params, params2) {
    const { then = a => a } = params2; //  = a => a
    return Promise.props({
      __pack: 1,
      count: params.count || params.count === '' ? Model.countByParams(params) : undefined,
      data: Model.prepare(then(Model.findByParams(params, params2)), params2),
    });
  }
  withSearchParams(data, field) {
    const { search, filter = {}, ...other } = data;
    if (!search) return data;
    return {
      ...other,
      filter: {
        ...filter,
        $and: [{
          [field]: {
            $regex: search,
            $options: 'i',
          },
        }],
      },
    };
  }
  async cache(key, ...args) {
    const [fn, params = { ttl: 60 }] = args.reverse();
    const { ttl } = params;
    const hashedKey = hash(key);
    const value = await this.cacheStore.get(hashedKey);
    if (value) return value;
    const res = await fn();
    this.cacheStore.set(hashedKey, res, ttl);
    return res;
  }

  getDocsRoutes({ path, ...props } = {}) {
    const params = {
      name: get(this, 'app.config.about.title'),
      description: get(this, 'app.config.about.description'),
      docs: path ? this.app.url(`${path}/docs`) : this.url('/docs'),
      docsJson: path ? this.app.url(`${path}/docs.json`) : this.url('/docs.json'),
      path,
      ...props,
    };
    return {
      '': () => params,
      '/docs': (req, res) => res.send(getDocsTemplate(params)),
      '/docs.json': (req, res) => res.json(this.getDocs(this, params)),
    };
  }
}
