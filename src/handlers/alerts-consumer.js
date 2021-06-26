const xml2js = require('xml2js');

const logMsg = (message, params = {}) => {
  const base = { type: 'BatonAlert', message };
  return JSON.stringify({ ...base, ...params });
};

const parseAlertXml = async xml => {
  let res;
  try {
    res = await xml2js.parseStringPromise(xml);
  } catch (error) {
    console.error(logMsg('failed to parse alert xml', { xml, error }));
  }

  const { TaskInfo = {} } = res || {};

  return TaskInfo.$;
};

const parseAlerts = async xmls => {
  const alerts = await Promise.all(xmls.map(parseAlertXml));
  return alerts.filter(i => i);
};

class BatonAlerts {
  constructor(event) {
    this.event = event;
    this.props = this.defaultProps();
  }

  defaultProps() {
    const { Records = [] } = this.event;
    const xmls = Records.map(r => r.body).filter(i => i);
    return { xmls };
  }

  async process() {
    const { xmls } = this.props;
    const alerts = await parseAlerts(xmls);
    console.log(logMsg('alerts received', { alerts }));
  }
}

exports.handler = async event => {
  console.log(JSON.stringify(event));
  const alerts = new BatonAlerts(event);
  return alerts.process();
};
