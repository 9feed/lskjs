import deepmerge from 'deepmerge';
import isFunction from 'lodash/isFunction';
import merge from 'lodash/merge';
import toPlainObject from 'lodash/toPlainObject';
import forEach from 'lodash/forEach';
import set from 'lodash/set';
import defaultsDeep from 'lodash/defaultsDeep';
import reverse from 'lodash/reverse';
import cloneDeep from 'lodash/cloneDeep';
import fs from 'fs';

export default function getConfigFromEnvJson(prePath) {
  let path = prePath;
  if (path[0] !== '/') {
    path = `${process.cwd()}/${path}`;
  }
  let confStr;
  try {
    confStr = fs.readFileSync(path, 'utf-8');
  } catch (err) {
    if (prePath !== '.env.json') {
      console.error(`====================`);
      console.error(`WARNING: Can't read file ${path}\n`, err);
      console.error(`====================`);
    }
    return {};
  }
  try {
    const config = Object.assign({}, { _json: 1 }, JSON.parse(confStr));
    return config;
  } catch (err) {
    console.error(`====================`);
    console.error(`WARNING: Can't parse file ${path}\n`, err);
    console.error(`====================`);
    return {};
  }
  return {};
}