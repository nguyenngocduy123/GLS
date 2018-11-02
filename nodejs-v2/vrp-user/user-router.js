/*
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
const User = require('./user');

const router = express.Router(); // not protected from csrf
const csrfRouter = express.Router(); // protected from csrf

exports.setup = (mongoDb, routerType) => {
    User.setup(mongoDb);

    if (routerType === vrpEnum.RouterType.NO_CSRF) {
        return router;
    } else if (routerType === vrpEnum.RouterType.WITH_CSRF) {
        return csrfRouter;
    }
};

/* ================================================================================
 *  Middleware not protected from CSRF (by api)
 * ================================================================================ */
router.put('/v2/password', Auth.m_isAuthDriver, User.m_changePassword);

/* ================================================================================
 *  Middleware protected from CSRF (by web)
 * ================================================================================ */
csrfRouter.put('/v2', Auth.m_isAuthNotDriver, User.m_updateUserDetails); // update user
csrfRouter.get('/v2', Auth.m_isAuthAdminOrPlanner, Auth.m_userGroupFilter, User.m_getUsers); // get users
csrfRouter.post('/v2', Auth.m_isAuthAdmin, User.m_createUser); // create new users
csrfRouter.delete('/v2', Auth.m_isAuthAdmin, User.m_deleteUsers); // delete multiple users

csrfRouter.put('/v2/password', Auth.m_isAuthNotDriver, User.m_changePassword);
csrfRouter.post('/v2/resetPassword', Auth.m_isAuthAdmin, User.m_resetPassword); // reset password

csrfRouter.patch('/v2/disable', Auth.m_isAuthAdmin, User.m_disableUsers); // disable multiple users
csrfRouter.patch('/v2/enable', Auth.m_isAuthAdmin, User.m_enableUsers); // enable multiple users

csrfRouter.post('/v2/forceLogout', Auth.m_isAuthAdmin, Auth.m_forceLogoutByUsername); // logout multiple users
