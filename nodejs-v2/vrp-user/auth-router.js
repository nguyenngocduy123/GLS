/**
 * Copyright (C) 2018 Singapore Institute of Manufacturing Technology - All Rights Reserved
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
'use strict';

/**
 * @file RESTFUL to update/get User collection
 */
const express = require('express');
const vrpEnum = require('../enum');
const Auth = require('./auth');
const optionalRequire = require('optional-require')(require);
const Scopes = optionalRequire('../vrp-sql/utils/Scopes') || { m_addAuthz: (req, res, next) => { next(); } };

const router = express.Router(); // not protected from csrf
const csrfRouter = express.Router(); // protected from csrf

exports.setup = (mongoDb, routerType) => {
    if (routerType === vrpEnum.RouterType.NO_CSRF) {
        return router;
    } else if (routerType === vrpEnum.RouterType.WITH_CSRF) {
        return csrfRouter;
    }
};

/* ================================================================================
 *  Middleware not protected from CSRF (by api)
 * ================================================================================ */
router.post('/v2/login', Auth.m_login, Auth.m_isAuthPlannerOrDriver, Scopes.m_addAuthz, Auth.m_returnUserInfo);
router.post('/v2/logout', Auth.m_logout);

/* ================================================================================
 *  Middleware protected from CSRF (by web)
 * ================================================================================ */
csrfRouter.post('/v2/login', Auth.m_login, Auth.m_isAuthNotDriver, Auth.m_returnUserInfo);
csrfRouter.post('/v2/logout', Auth.m_logout);
csrfRouter.get('/v2/isLoggedIn', Auth.m_isLoggedIn, Scopes.m_addAuthz, Auth.m_returnUserInfo);

router.use(_forceLogout);
csrfRouter.use(_forceLogout);

function _forceLogout(err, req, res, next) {
    req.logout(); // force log out whenever there is error
    next(err);
}
