import 'jquery';
import 'jquery-ui';
import 'bootstrap';

import {AppConfiguration} from "app-configuration";

const isDev = /^http:\/\/localhost/.test(location.origin);
export const workerOrigin = isDev ? 'http://localhost:3000' : 'https://gist.host';
export const workerPage = workerOrigin + '/';

export function configure(aurelia) {
  let appConfig = new AppConfiguration().getConfiguration(isDev);
  appConfig.mainConfigure(aurelia);
  //Uncomment the line below to enable animation.
  //aurelia.use.plugin('aurelia-animator-css');
  //if the css animator is enabled, add swap-order="after" to all router-view elements

  //Anyone wanting to use HTMLImports to load views, will need to install the following plugin.
  //aurelia.use.plugin('aurelia-html-import-template-loader')
  aurelia.start().then(a => a.setRoot());
}
