/**
 * Event handlers for milestone create, update and delete.
 */
import config from 'config';
import _ from 'lodash';
import Joi from 'joi';
import Promise from 'bluebird';
import util from '../../util';
// import { createEvent } from '../../services/busApi';
import { EVENT, TIMELINE_REFERENCES, MILESTONE_STATUS, REGEX } from '../../constants';
import models from '../../models';

const ES_TIMELINE_INDEX = config.get('elasticsearchConfig.timelineIndexName');
const ES_TIMELINE_TYPE = config.get('elasticsearchConfig.timelineDocType');

const eClient = util.getElasticSearchClient();

/**
 * Handler for milestone creation event
 * @param  {Object} logger  logger to log along with trace id
 * @param  {Object} msg     event payload
 * @param  {Object} channel channel to ack, nack
 */
const milestoneAddedHandler = Promise.coroutine(function* (logger, msg, channel) { // eslint-disable-line func-names
  const data = JSON.parse(msg.content.toString());
  try {
    const doc = yield eClient.get({ index: ES_TIMELINE_INDEX, type: ES_TIMELINE_TYPE, id: data.timelineId });
    const milestones = _.isArray(doc._source.milestones) ? doc._source.milestones : []; // eslint-disable-line no-underscore-dangle

    // Increase the order of the other milestones in the same timeline,
    // which have `order` >= this milestone order
    _.each(milestones, (milestone) => {
      if (milestone.order >= data.order) {
        milestone.order += 1; // eslint-disable-line no-param-reassign
      }
    });

    milestones.push(data);
    const merged = _.assign(doc._source, { milestones }); // eslint-disable-line no-underscore-dangle
    yield eClient.update({
      index: ES_TIMELINE_INDEX,
      type: ES_TIMELINE_TYPE,
      id: data.timelineId,
      body: { doc: merged },
    });
    logger.debug('milestone added to timeline document successfully');
    channel.ack(msg);
  } catch (error) {
    logger.error(`Error processing event (milestoneId: ${data.id})`, error);
    // if the message has been redelivered dont attempt to reprocess it
    channel.nack(msg, false, !msg.fields.redelivered);
  }
});

/**
 * Handler for milestone updated event
 * @param  {Object} logger  logger to log along with trace id
 * @param  {Object} msg     event payload
 * @param  {Object} channel channel to ack, nack
 * @returns {undefined}
 */
const milestoneUpdatedHandler = Promise.coroutine(function* (logger, msg, channel) { // eslint-disable-line func-names
  const data = JSON.parse(msg.content.toString());
  try {
    const doc = yield eClient.get({ index: ES_TIMELINE_INDEX, type: ES_TIMELINE_TYPE, id: data.original.timelineId });
    const milestones = _.map(doc._source.milestones, (single) => { // eslint-disable-line no-underscore-dangle
      if (single.id === data.original.id) {
        return _.assign(single, data.updated);
      }
      return single;
    });

    if (data.cascadedUpdates && data.cascadedUpdates.milestones && data.cascadedUpdates.milestones.length > 0) {
      const otherUpdatedMilestones = data.cascadedUpdates.milestones;
      _.each(milestones, (m) => {
        // finds the updated milestone from the cascaded updates
        const updatedMilestoneData = _.find(otherUpdatedMilestones, oum => oum.updated && oum.updated.id === m.id);
        logger.debug('updatedMilestone=>', updatedMilestoneData);
        if (updatedMilestoneData && updatedMilestoneData.updated) {
          _.assign(m, updatedMilestoneData.updated);
        }
      });
    }

    // if (data.original.order !== data.updated.order) {
    //   const milestoneWithSameOrder =
    //     _.find(milestones, milestone => milestone.id !== data.updated.id && milestone.order === data.updated.order);
    //   if (milestoneWithSameOrder) {
    //     // Increase the order from M to K: if there is an item with order K,
    //     // orders from M+1 to K should be made M to K-1
    //     if (data.original.order < data.updated.order) {
    //       _.each(milestones, (single) => {
    //         if (single.id !== data.updated.id
    //           && (data.original.order + 1) <= single.order
    //           && single.order <= data.updated.order) {
    //           single.order -= 1; // eslint-disable-line no-param-reassign
    //         }
    //       });
    //     } else {
    //       // Decrease the order from M to K: if there is an item with order K,
    //       // orders from K to M-1 should be made K+1 to M
    //       _.each(milestones, (single) => {
    //         if (single.id !== data.updated.id
    //           && data.updated.order <= single.order
    //           && single.order <= (data.original.order - 1)) {
    //           single.order += 1; // eslint-disable-line no-param-reassign
    //         }
    //       });
    //     }
    //   }
    // }

    const merged = _.assign(doc._source, { milestones }); // eslint-disable-line no-underscore-dangle
    yield eClient.update({
      index: ES_TIMELINE_INDEX,
      type: ES_TIMELINE_TYPE,
      id: data.original.timelineId,
      body: {
        doc: merged,
      },
    });
    logger.debug('elasticsearch index updated, milestone updated successfully');
    channel.ack(msg);
  } catch (error) {
    logger.error(`Error processing event (milestoneId: ${data.original.id})`, error);
    // if the message has been redelivered dont attempt to reprocess it
    channel.nack(msg, false, !msg.fields.redelivered);
  }
});

/**
 * Handler for milestone deleted event
 * @param  {Object} logger  logger to log along with trace id
 * @param  {Object} msg     event payload
 * @param  {Object} channel channel to ack, nack
 * @returns {undefined}
 */
const milestoneRemovedHandler = Promise.coroutine(function* (logger, msg, channel) { // eslint-disable-line func-names
  const data = JSON.parse(msg.content.toString());
  try {
    const doc = yield eClient.get({ index: ES_TIMELINE_INDEX, type: ES_TIMELINE_TYPE, id: data.timelineId });
    const milestones = _.filter(doc._source.milestones, single => single.id !== data.id); // eslint-disable-line no-underscore-dangle
    const merged = _.assign(doc._source, { milestones });       // eslint-disable-line no-underscore-dangle
    yield eClient.update({
      index: ES_TIMELINE_INDEX,
      type: ES_TIMELINE_TYPE,
      id: data.timelineId,
      body: {
        doc: merged,
      },
    });
    logger.debug('milestone removed from timeline document successfully');
    channel.ack(msg);
  } catch (error) {
    logger.error(`Error processing event (milestoneId: ${data.id})`, error);
    // if the message has been redelivered dont attempt to reprocess it
    channel.nack(msg, false, !msg.fields.redelivered);
  }
});

/**
 * Kafka event handlers
 */

const payloadSchema = Joi.object().keys({
  projectId: Joi.number().integer().positive().required(),
  projectName: Joi.string().optional(),
  projectUrl: Joi.string().regex(REGEX.URL).optional(),
  userId: Joi.number().integer().positive().required(),
  initiatorUserId: Joi.number().integer().positive().required(),
}).unknown(true).required();

const findProjectPhaseProduct = function (productId) { // eslint-disable-line func-names
  let product;
  return models.PhaseProduct.findOne({
    where: { id: productId },
    raw: true,
  }).then((_product) => {
    if (product) {
      product = _product;
      const phaseId = product.phaseId;
      const projectId = product.projectId;
      return Promise.all([
        models.ProjectPhase.findOne({
          where: { id: phaseId, projectId },
          raw: true,
        }),
        models.Project.findOne({
          where: { id: projectId },
          raw: true,
        }),
      ]);
    }
    return Promise.reject('Unable to find product');
  }).then((projectAndPhase) => {
    if (projectAndPhase) {
      const phase = projectAndPhase[0];
      const project = projectAndPhase[1];
      return Promise.resolve({ product, phase, project });
    }
    return Promise.reject('Unable to find phase/project');
  });
};

/**
 * Raises the project plan modified event
 * @param   {Object}  app       Application object used to interact with RMQ service
 * @param   {String}  topic     Kafka topic
 * @param   {Object}  payload   Message payload
 * @return  {Promise} Promise
 */
async function milestoneUpdatedKafkaHandler(app, topic, payload) {
  app.logger(`Handling Kafka event for ${topic}`);
  // Validate payload
  const result = Joi.validate(payload, payloadSchema);
  if (result.error) {
    throw new Error(result.error);
  }

  const timeline = payload.timeline;
  // process only if timeline is related to a product reference
  if (timeline && timeline.reference === TIMELINE_REFERENCES.PRODUCT) {
    const productId = timeline.referenceId;
    const original = payload.originalMilestone;
    const updated = payload.updatedMilestone;
    const { project, phase } = await findProjectPhaseProduct(productId);
    if (original.status !== updated.status) {
      if (updated.status === MILESTONE_STATUS.COMPLETED) {
        if (timeline.duration) {
          const progress = phase.progress + ((updated.duration / timeline.duration) * 100);
          const updatedPhase = await models.ProjectPhase.update({ progress }, { fields: ['progress'] });
          app.emit(EVENT.ROUTING_KEY.PROJECT_PHASE_UPDATED, {
            req: {
              params: { projectId: project.id, phaseId: phase.id },
              authUser: { userId: payload.userId },
            },
            original: phase,
            updated: _.clone(updatedPhase.get({ plain: true })),
          });
        }
      }
    }
  }
}

module.exports = {
  milestoneAddedHandler,
  milestoneRemovedHandler,
  milestoneUpdatedHandler,
  milestoneUpdatedKafkaHandler,
};