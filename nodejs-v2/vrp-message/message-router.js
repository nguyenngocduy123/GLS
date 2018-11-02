/*
 * Copyright (C) 2018 Singapore Institute of Manufacturing Technology - All Rights Reserved
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
'use strict';

const _ = require('lodash');
const express = require('express');

const Message = require('./message');
const vrpEnum = require('../enum');
const Auth = require('../vrp-user/auth');

const router = express.Router(); // not protected from csrf
const csrfRouter = express.Router(); // protected from csrf

exports.setup = (mongoDb, routerType) => {
    Message.setup(mongoDb);

    if (routerType === vrpEnum.RouterType.NO_CSRF) {
        return router;
    } else if (routerType === vrpEnum.RouterType.WITH_CSRF) {
        return csrfRouter;
    }
};

/* ================================================================================
 *  Middleware not protected from CSRF
 * ================================================================================ */
router.post('/v2', Auth.m_isAuthDriver, Message.m_createMessages, Message.m_addUserDetails, Message.m_broadcastWSToPlanner, (req, res, next) => {
    // return list of job id with inserted message instead of full message contents
    req.answer = _.map(req.answer, 'job.Id');
    next();
}); // create message

/* ================================================================================
 *  Middleware protected from CSRF
 * ================================================================================ */
csrfRouter.get('/v2', Auth.m_isAuthPlannerOrController, Message.m_userGroupFilter, Message.m_getAll, Message.m_addUserDetails);
csrfRouter.get('/v2/unprocessedCount', Auth.m_isAuthAdminOrPlanner, Message.m_userGroupFilter, Message.m_getTotalUnprocessedCount); // get number of unprocessed messages
csrfRouter.put('/v2/process/:id', Auth.m_isAuthPlanner, Message.m_processMessage, Message.m_addUserDetails, Message.m_broadcastWSToPlanner); // update message