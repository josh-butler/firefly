/* eslint-disable max-classes-per-file */

// const { startSFN } = require('../sfn');
// const { publishEvent } = require('../util/events');
// const { ksuid } = require('../util/util');

// const { EntityTable, Batch: BatchEntity, Job: JobEntity } = require('../util/ddb');
const { submitFile } = require('../util/lambda');

class Job {
  constructor(data) {
    this.data = data;
  }

  async submitJob() {
    let err;
    let res;
    const { sk, plan, path } = this.data;

    // TODO pass job id from batch manager and use here vvv instead
    const id = sk.split('#')[1];

    try {
      const result = await submitFile({ type: 'submitFile', params: { plan, path, id } });
      console.log('result: ', result);
      const { Payload } = result;
      res = Payload;
    } catch (e) {
      console.error(e);
      err = e;
    }

    if (res && !err) {
      const { data, error } = JSON.parse(res);
      err = error;
      // TODO get taskId from response
      // this.taskId = ?;
    }

    return err;
  }

  async submit() {
    // console.log('this.data: ', this.data);
    return this.submitJob();
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
    const submitted = await Promise.all(this.jobs.map(job => job.submit()));
    console.log('submitted: ', submitted);

    // - [ ] catch & throw API error
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
