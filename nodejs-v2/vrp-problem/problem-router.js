/*
 * Copyright (C) 2018 Singapore Institute of Manufacturing Technology - All Rights Reserved
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
'use strict';

const express = require('express');

const Problem = require('./problem');
const vrpEnum = require('../enum');
const Auth = require('../vrp-user/auth');

const router = express.Router(); // not protected from csrf
const csrfRouter = express.Router(); // protected from csrf

exports.setup = (mongoDb, routerType) => {
    Problem.setup(mongoDb);

    if (routerType === vrpEnum.RouterType.NO_CSRF) {
        return router;
    } else if (routerType === vrpEnum.RouterType.WITH_CSRF) {
        return csrfRouter;
    }
};

// navigation guards (authorisation)
const Authorize = {
    nonDriver: Auth.m_isAuthNotDriver, // some queries cannot have user filter in query
    nonDriverWithFilter: [Auth.m_isAuthNotDriver, Auth.m_userFilter],
};

/* ================================================================================
 *  Middleware not protected from CSRF (No authentication) - For API calls
 * ================================================================================ */
router.post('/v2/optimize_problem', Problem.m_getProblem, Problem.m_optimize); // optimize problem

/* ================================================================================
 *  Middleware protected from CSRF
 * ================================================================================ */
csrfRouter.get('/v2/p-:problemId', Authorize.nonDriverWithFilter, Problem.m_getProblem); // get a problem
csrfRouter.get('/v2/abstract', Authorize.nonDriverWithFilter, Problem.m_getAbstractProblems); // get abstract info of problems
csrfRouter.post('/v2', Authorize.nonDriverWithFilter, Problem.m_createProblem); // create problem
csrfRouter.post('/v2/destroy', Authorize.nonDriverWithFilter, Problem.m_deleteProblems); // delete problems

// an user can edit properties of any problem (other api must have username in problem.username property)
csrfRouter.patch('/v2/:problemId/update', Authorize.nonDriver, Problem.m_setMongoOps('$set'), Problem.m_updateOne); // update problem
csrfRouter.patch('/v2/:problemId/remove', Authorize.nonDriver, Problem.m_setMongoOps('$pull'), Problem.m_updateOne); // update problem

csrfRouter.post('/v2/geocode/:problemId', Authorize.nonDriverWithFilter, Problem.m_getProblem, Problem.m_geocode, Problem.m_saveProblem); // geocode problem
csrfRouter.get('/v2/distanceMatrix/:problemId', Authorize.nonDriverWithFilter, Problem.m_getProblem, Problem.m_queryDistanceMatrix);
csrfRouter.post('/v2/optimize/:problemId', Authorize.nonDriverWithFilter, Problem.m_getProblem, Problem.m_optimize); // optimize problem
