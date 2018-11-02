/*
 * Copyright (C) 2018 Singapore Institute of Manufacturing Technology - All Rights Reserved
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
'use strict';

const express = require('express');
const vrpEnum = require('../enum');
const MeasureV2 = require('./vrp-measure-v2');
const Auth = require('../vrp-user/auth');

const router = express.Router(); // not protected from csrf
const csrfRouter = express.Router(); // protected from csrf

exports.setup = (mongoDb, routerType) => {
    MeasureV2.setup(mongoDb);

    if (routerType === vrpEnum.RouterType.NO_CSRF) {
        return router;
    } else if (routerType === vrpEnum.RouterType.WITH_CSRF) {
        return csrfRouter;
    }
};

/* ================================================================================
 *  Middleware not protected from CSRF
 * ================================================================================ */
router.post('/v2/distanceMatrix', MeasureV2.m_distanceMatrixOnTheFly);

router.post('/v2/route', MeasureV2.m_route); // get direction routes using OSMap

/* ================================================================================
 *  Middleware protected from CSRF
 * ================================================================================ */
csrfRouter.post('/v2/coords', Auth.m_isAuthPlanner, MeasureV2.m_upsertUserLatLon); // add user-specific coordinates
csrfRouter.delete('/v2/coords/:postal', Auth.m_isAuthPlanner, MeasureV2.m_deleteUserLatLon); // remove user-specific coordinates

csrfRouter.get('/v2/searchAddress', Auth.m_isAuthNotDriver, MeasureV2.m_searchSimilarAddress); // get addresses similar to input

csrfRouter.post('/v2/geocode', Auth.m_isAuthNotDriver, MeasureV2.m_searchAddressInDb, MeasureV2.m_geocode); // postal/address to lat/lng
