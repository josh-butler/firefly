const { Job: JobEntity } = require('./ddb');
const { taskReport } = require('./lambda');
const { uploadReport } = require('./s3');

const logMsg = (message, params = {}) => {
  const base = { type: 'BatonJobCompleted', message };
  return JSON.stringify({ ...base, ...params });
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
    const status = 'COMPLETE';
    return {
      pk, sk, contentId, taskId, status,
    };
  }

  async getReport() {
    const { taskId } = this.props;
    console.log(logMsg('fetching task report', { taskId }));

    const { data, err } = await getTaskReport(taskId);
    this.report = data;

    return err;
  }

  async uploadReport() {
    const { taskId } = this.props;
    const key = `${taskId}.xml`;
    console.log(logMsg('uploading task report', { key }));

    return uploadReport(key, this.report);
  }

  async process() {
    const { pk, sk, status } = this.props;
    const err = await this.getReport();

    // TODO handle error, updated ddb as failed & send failed event
    if (!err) {
      const res = await this.uploadReport();
      const { Location: report } = res;

      // update Job status to Complete
      await JobEntity.update({
        pk, sk, status, report,
      });
    }
    console.log('err: ', err);
  }
}

module.exports = {
  CompletedJob,
};
