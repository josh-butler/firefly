const xml2js = require('xml2js');

const { taskReport } = require('../util/lambda');

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

const getTaskReport = async taskId => {
  let err;
  let res;
  let data;

  try {
    const result = await taskReport({ type: 'taskReport', params: { taskId } });
    const { Payload } = result;
    res = Payload;
  } catch (e) {
    console.error(e);
    err = e.message;
  }

  if (res && !err) {
    const { data: d, error } = JSON.parse(res);
    err = error;
    data = d;
  }

  return { data, err };
};

const handleTaskCompleted = async alert => {
  const { contentId, taskId } = alert;
  console.log('taskId: ', taskId);

  // getTaskReport

  // const [pk, sk] = contentId.split('|');
  // console.log('pk: ', pk);
  // console.log('sk: ', sk);

  const { data, err } = await getTaskReport(taskId);
  console.log('data: ', data);
  console.log('err: ', err);
  return 1;
};

const handleAlert = async alert => {
  let res;
  const { eventCode } = alert;

  switch (eventCode) {
    case 'TaskCompleted':
      res = handleTaskCompleted(alert);
      // res = {};
      console.log(`handle: ${eventCode}`);
      break;
    default:
      console.log(`unhandled event: ${eventCode}`);
  }
  return res;
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

  async processAlerts() {
    const res = this.alerts.map(handleAlert);
    await Promise.all(res);
  }

  async process() {
    const { xmls } = this.props;
    this.alerts = await parseAlerts(xmls);
    console.log(logMsg('alerts received', { alerts: this.alerts }));
    return this.processAlerts();
  }
}

exports.handler = async event => {
  console.log(JSON.stringify(event));
  const alerts = new BatonAlerts(event);
  return alerts.process();
};
