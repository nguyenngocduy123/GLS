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
const vrpEnum = require('../enum');
const Auth = require('./auth');
const UserGroup = require('./user-group');

const csrfRouter = require('express').Router(); // protected from csrf

exports.setup = (mongoDb, routerType) => {
    UserGroup.setup(mongoDb);

    if (routerType === vrpEnum.RouterType.WITH_CSRF) {
        return csrfRouter;
    }
};

csrfRouter.get('/v2', Auth.m_isAuthAdminOrPlanner, UserGroup.m_get);
csrfRouter.post('/v2', Auth.m_isAuthAdmin, UserGroup.m_create);
csrfRouter.delete('/v2', Auth.m_isAuthAdmin, UserGroup.m_delete);
