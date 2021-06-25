/* eslint-disable max-classes-per-file */
const { startManagerSFN } = require('../util/sfn');
// const { publishEvent } = require('../util/events');

const { Batch: BatchEntity, Job: JobEntity } = require('../util/ddb');
const { submitFile } = require('../util/lambda');

class Job {
  constructor(data) {
    this.data = data;
    this.resp = {};
  }

  get taskId() {
    return this.resp.taskId;
  }

  get attrs() {
    const { pk, sk } = this.data;
    return { pk, sk };
  }

  async submitJob() {
    let err;
    let res;
    let data;

    const { id, plan, path } = this.data;

    try {
      const result = await submitFile({ type: 'submitFile', params: { plan, path, id } });
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
  }

  async updateStatus() {
    const { pk, sk } = this.data;
    const { taskId } = this;
    return JobEntity.update({
      pk, sk, status: 'SUBMITTED', taskId,
    });
  }

  async submit() {
    const { data = {}, err } = await this.submitJob();
    if (err) {
      throw new Error(err);
    }

    this.resp = data;
  }
}

class Batch {
  constructor(event) {
    this.event = event;
    this.props = this.defaultProps();
  }

  defaultProps() {
    const {
      detail: {
        pk, id, eid, jobs = [],
      } = {},
    } = this.event;

    const intervalSeconds = '60';
    const maxAttempts = '3';

    return {
      pk, id, eid, jobs, intervalSeconds, maxAttempts,
    };
  }

  async updateStatus() {
    const { pk } = this.props;
    return BatchEntity.update({ pk, sk: pk, status: 'SUBMITTED' });
  }

  async startManagerSFN() {
    const { pk, intervalSeconds, maxAttempts } = this.props;
    const jobs = this.jobs.map(job => job.attrs);
    const batch = {
      pk, jobs, intervalSeconds, maxAttempts,
    };
    return startManagerSFN({ batch });
  }

  async submit() {
    this.jobs = this.props.jobs.map(item => new Job(item));

    // submit all jobs
    await Promise.all(this.jobs.map(job => job.submit()));

    // update status on all jobs
    await Promise.all(this.jobs.map(job => job.updateStatus()));

    // update status on parent batch
    await this.updateStatus();

    return this.startManagerSFN();
  }
}

exports.handler = async event => {
  console.log(JSON.stringify(event));
  const batch = new Batch(event);
  return batch.submit();
};
