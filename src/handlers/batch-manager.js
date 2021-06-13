/* eslint-disable max-classes-per-file */
const { EntityTable, Batch: BatchEntity, Job: JobEntity } = require('../util/ddb');
// const { postBatonRequest } = require('../utils/lambda');
// const { logBase64 } = require('../utils/util');

const { BATCH_LIMIT } = require('../config');

const logInfo = (message, params = {}) => {
  const base = { type: 'BatchJobSubmit', message };
  console.info(JSON.stringify({ ...base, ...params }));
};

const submittedParams = ({ data: { pk, sk } }) => ({ pk, sk, status: 'SUBMITTED' });

// async getOrder() {
//   let err;
//   let res;
//   const { orderId: id } = this.props;

//   try {
//     const result = await queryOrdersInterface({ type: 'getOrder', params: { id } });
//     const { Payload } = result;
//     res = Payload;
//   } catch (e) {
//     console.error(e);
//     err = e;
//   }

//   if (res && !err) {
//     const { data, err } = JSON.parse(res);
//     err = error;
//     this.order = data;
//   }

//   return err;
// }

// const getBatonTasks = async () => {
//   let err;

//   const res = await postBatonRequest({ type: 'listTasks', params: {} });
//   const { LogResult, Payload } = res;

//   if (Payload === 'null') {
//     err = 'translator message failed';
//     logBase64(LogResult);
//   }

//   // return err ? resp500({ message: err }) : null
//   return err ? resp500({ message: err }) : null
// }

class Job {
  constructor(data) {
    this.data = data;
    this.props = this.defaultProps();
  }

  defaultProps() {
    const { plan, path } = this.data;
    return { plan, path };
  }

  async submit() {
    const { plan, path } = this.props;
    logInfo('submitting job', { plan, path });

    // TODO:
    // - [ ] submit VerifyFile job to Baton (via Lambda invoke?)
    // - [ ] store return taskId on Job
    // - [ ] throw if error
    // - [ ] consder Q for retries? since Baton is not reliable

    return null;
  }
}

class Batch {
  constructor(data) {
    this.data = data;
    this.props = this.defaultProps();
  }

  defaultProps() {
    const { pk } = this.data;
    return { pk };
  }

  async getJobItems() {
    const { pk } = this.props;

    const result = await EntityTable.query(pk, { beginsWith: 'JOB#' });

    this.items = result.Items || [];
  }

  async process() {
    const { pk } = this.props;
    logInfo('processing batch', { pk });

    await this.getJobItems();
    this.jobs = this.items.map(item => new Job(item));
    console.log('this.jobs: ', this.jobs);

    // // submit jobs to Baton
    // await Promise.all(this.jobs.map(job => job.submit()));

    // update Batch status to SUBMITTED
    // TODO: add taskId to the update
    // await BatchEntity.update({ pk, sk: pk, status: 'SUBMITTED' });

    // // update Jobs status to SUBMITTED
    // return Promise.all(this.jobs.map(job => JobEntity.update(submittedParams(job))));

    return this.jobs;
  }
}

class Batches {
  constructor(limit = 1) {
    this.limit = limit;
    this.props = this.defaultProps();
  }

  defaultProps() {
    return { pk: 'READY', limit: this.limit };
  }

  async getBatchItems() {
    const { pk, limit } = this.props;

    const params = { limit, beginsWith: 'BATCH#', index: 'GSI1' };
    const result = await EntityTable.query(pk, params);

    this.items = result.Items || [];
  }

  async process() {
    const { limit } = this.props;
    logInfo('fetching oldest batches', { limit });

    await this.getBatchItems();
    this.batches = this.items.map(item => new Batch(item));
    console.log('this.batches: ', this.batches);

    return Promise.all(this.batches.map(batch => batch.process()));
  }
}

exports.handler = async () => {
  const batches = new Batches(BATCH_LIMIT);
  return batches.process();
};
