/* eslint-disable max-classes-per-file */
const xml2js = require('xml2js');

const { taskReport } = require('../util/lambda');
const { uploadReport } = require('../util/s3');

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

class CompletedJob {
  constructor(event) {
    this.event = event;
    this.props = this.defaultProps();
  }

  defaultProps() {
    const { contentId, taskId } = this.event;
    const [pk, sk] = contentId.split('|');
    return {
      pk, sk, contentId, taskId,
    };
  }

  async getReport() {
    const { taskId } = this.props;
    const { data, err } = await getTaskReport(taskId);
    this.report = data;
    return err;
  }

  async uploadReport() {
    const { taskId } = this.props;
    return uploadReport(`${taskId}.xml`, this.report);
  }

  async process() {
    const err = await this.getReport();

    // TODO handle error, updated ddb as failed & send failed event
    if (!err) {
      const res = await this.uploadReport();
      console.log('res: ', res);
    }
    console.log('err: ', err);
    console.log('this.report: ', this.report);
  }
}

const handleTaskCompleted = async alert => {
  const job = new CompletedJob(alert);
  return job.process();
};

const handleAlert = async alert => {
  let res;
  const { eventCode } = alert;

  switch (eventCode) {
    case 'TaskCompleted':
      res = handleTaskCompleted(alert);
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
