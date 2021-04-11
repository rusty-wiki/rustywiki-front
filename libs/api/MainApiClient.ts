import Axios from 'axios';
import { STORAGE_KEY } from '../const/storageKey';
import util from '../util';
import { AuthApi } from './AuthApi';
import { DocApi } from './DocApi';
import { UserApi } from './UserApi';

export class MainApi {
  axios = Axios.create({
    baseURL: util.isServer() ? 'http://125.133.80.144:11111' : '/api',
    withCredentials: true,
  });

  auth: AuthApi;
  user: UserApi;
  doc: DocApi;

  constructor() {
    this.auth = new AuthApi(this.axios);
    this.user = new UserApi(this.axios);
    this.doc = new DocApi(this.axios);
    this.axios.defaults.headers = { 'Content-Type': 'application/json' };

    if (util.isServer()) {
      return;
    }

    this.axios.interceptors.response.use(
      (res) => {
        if (res.status === 401 && !(res.config as any).__isRetryRequest) {
          const token = localStorage.getItem(STORAGE_KEY.REFRESH_TOKEN);
          if (!token) {
            return Promise.reject({
              ...res.data,
            });
          }
          return this.auth
            .refresh(token)
            .catch((err) => {
              if (!err.success) {
                localStorage.removeItem(STORAGE_KEY.REFRESH_TOKEN);
                return Promise.reject();
              }
              return;
            })
            .then(() => Axios.request(res.config));
        }
        if (!res.data.success) {
          return Promise.reject({
            ...res.data,
          });
        }
        return res;
      },
      () => {
        // console.log(err)
      }
    );
  }
}

const api = new MainApi();

export default api;
