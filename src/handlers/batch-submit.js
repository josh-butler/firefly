/* eslint-disable max-classes-per-file */

// const { startSFN } = require('../sfn');
// const { publishEvent } = require('../util/events');

// const { EntityTable, Batch: BatchEntity, Job: JobEntity } = require('../util/ddb');
const { submitFile } = require('../util/lambda');

class Job {
  constructor(data) {
    this.data = data;
    this.resp = {};
  }

  get taskId() {
    return this.resp.taskId;
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

    return {
      pk, id, eid, jobs,
    };
  }

  async submit() {
    this.jobs = this.props.jobs.map(item => new Job(item));
    await Promise.all(this.jobs.map(job => job.submit()));

    const taskIds = this.jobs.map(job => job.taskId);
    console.log('taskIds: ', taskIds);

    // - [x] catch & throw API error
    // - [ ] update DDB records w/ status & taskId
    // - [ ] start SFN

    return null;
  }
}

exports.handler = async event => {
  console.log(JSON.stringify(event));
  const batch = new Batch(event);
  return batch.submit();
};
