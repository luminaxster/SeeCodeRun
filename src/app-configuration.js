export class AppConfiguration {
  constructor() {
    this.isDebug = true;
    this.debugConfiguration = {
      isDebug: true,
      mainConfigure: function debugMainConfigure(aurelia) {
        aurelia.use
          .standardConfiguration()
          .developmentLogging()
          .plugin('aurelia-computed', {
            enableLogging: true
          });
      },
      firebaseURL: 'https://seecoderun.firebaseio.com/test'
    };
    this.deployConfiguration = {
      isDebug: false,
      mainConfigure: function deployMainConfigure(aurelia) {
        aurelia.use
          .standardConfiguration()
          .plugin('aurelia-computed');
      },
      firebaseURL: 'https://seecoderun.firebaseio.com/production'
    };
  }
  getConfiguration(isDev = this.isDebug) {
    return isDev ? this.debugConfiguration : this.deployConfiguration;
  }
}
