/*
 * Copyright (C) 2018 Singapore Institute of Manufacturing Technology - All Rights Reserved
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
'use strict';

const express = require('express');
const vrpEnum = require('../enum');
const tasks = require('./utils/tasks');
const vrpAuth = require('../vrp-user/auth');
const Scopes = require('../vrp-sql/utils/Scopes');

require('./data-cron');

// middlewares
const {
    Misc,
    Files,
    Item,
    Vehicle,
    VehicleType,
    VehicleLocationLog,
    DeliveryPlan,
    DeliveryMaster,
    DeliveryDetail,
    DeliveryDetail_v3,
    DeliveryItem,
    DeliveryPod,
    DeliveryNote,
    VerificationCode,
} = require('./middlewares');
const Problem = require('../vrp-problem/problem');

const router = express.Router(); // not protected from csrf
const csrfRouter = express.Router(); // protected from csrf
const tokenRouter = express.Router(); // not protected from csrf + token only

exports.setup = (mongoDb, routerType) => {
    // pass mongodb connection to files where necessary
    tasks.setup(mongoDb);
    VehicleLocationLog.setup(mongoDb);

    if (routerType === vrpEnum.RouterType.AUTH_BY_TOKEN_ONLY) {
        return tokenRouter;
    } else if (routerType === vrpEnum.RouterType.NO_CSRF) {
        return router;
    } else if (routerType === vrpEnum.RouterType.WITH_CSRF) {
        return csrfRouter;
    }
};

// navigation guards (authorisation)
const Authorize = {
    planner: [vrpAuth.m_isAuthPlanner, Scopes.m_addAuthz],
    driver: [vrpAuth.m_isAuthDriver, Scopes.m_addAuthz],
    planner_controller: [vrpAuth.m_isAuthPlannerOrController, Scopes.m_addAuthz],
    all: [vrpAuth.m_isLoggedIn, Scopes.m_addAuthz],

};

/* ================================================================================
 *  Misc Routes
 * ================================================================================ */
csrfRouter.get(`/${Misc.version}/misc/app/version`, Misc.m_getMinimumAppVersion);
csrfRouter.get(`/${Misc.version}/misc/summary`, Authorize.planner, Scopes.m_addDate, Misc.m_getSummary);

/* ================================================================================
 *  Files Routes
 * ================================================================================ */
csrfRouter.get(`/${Files.version}/files/transactionLog`, Authorize.planner, Scopes.m_addDate, Files.m_transactionLog);
csrfRouter.get(`/${Files.version}/files/serviceChit/:deliveryDetailId`, Authorize.planner, Files.m_serviceChit);
csrfRouter.get(`/${Files.version}/files/template`, Authorize.planner, Files.m_dataTemplate);

/* ================================================================================
 *  Item Routes
 * ================================================================================ */
csrfRouter.post(`/${Item.version}/item/destroy`, Authorize.planner, Item.m_bulkDelete);
csrfRouter.post(`/${Item.version}/item/`, Authorize.planner, Item.m_create);

csrfRouter.get(`/${Item.version}/item/:itemId`, Authorize.all, Item.m_getOne);
csrfRouter.get(`/${Item.version}/item/`, Authorize.planner, Item.m_getAll);

csrfRouter.put(`/${Item.version}/item/:itemId`, Authorize.planner, Item.m_update);

/* ================================================================================
 *  Vehicle Routes
 * ================================================================================ */
csrfRouter.post(`/${Vehicle.version}/vehicle/destroy`, Authorize.planner, Vehicle.m_bulkDelete);
csrfRouter.post(`/${Vehicle.version}/vehicle/`, Authorize.planner, Vehicle.m_create);

csrfRouter.get(`/${Vehicle.version}/vehicle/:vehicleId`, Authorize.planner, Vehicle.m_getOne);
csrfRouter.get(`/${Vehicle.version}/vehicle/`, Authorize.planner_controller, Vehicle.m_getAll);

csrfRouter.put(`/${Vehicle.version}/vehicle/:vehicleId`, Authorize.all, Vehicle.m_update);
router.put(`/${Vehicle.version}/vehicle/:vehicleId`, Authorize.driver, Vehicle.m_update);

csrfRouter.post(`/${Vehicle.version}/vehicle/duplicates`, Authorize.planner, Misc.m_checkDuplicates('Vehicle'));

/* ================================================================================
 *  VehicleType Routes
 * ================================================================================ */
csrfRouter.post(`/${Vehicle.version}/vehicleType/destroy`, Authorize.planner, VehicleType.m_bulkDelete);
csrfRouter.post(`/${Vehicle.version}/vehicleType/`, Authorize.planner, VehicleType.m_create);

csrfRouter.get(`/${Vehicle.version}/vehicleType/:vehicleTypeId`, Authorize.planner, VehicleType.m_getOne);
csrfRouter.get(`/${Vehicle.version}/vehicleType/`, Authorize.planner, VehicleType.m_getAll);

csrfRouter.put(`/${Vehicle.version}/vehicleType/:vehicleTypeId`, Authorize.planner, VehicleType.m_update);

/* ================================================================================
 *  VehicleLocationLog Routes
 * ================================================================================ */
tokenRouter.post(`/${VehicleLocationLog.version}/vehicleLog`, Authorize.driver, VehicleLocationLog.m_create);

csrfRouter.get(`/${VehicleLocationLog.version}/vehicleLog/last`, Authorize.planner, VehicleLocationLog.m_getLast);

/* ================================================================================
 *  DeliveryPlan Routes
 * ================================================================================ */
csrfRouter.get(`/${DeliveryPlan.version}/plan/problem`, Authorize.planner, Scopes.m_addDate, DeliveryPlan.m_getProblemJson, Problem.m_attachSolutionsToProblem);

csrfRouter.put(`/${DeliveryPlan.version}/plan/`, Authorize.planner, DeliveryPlan.m_approve);

/* ================================================================================
 *  DeliveryMaster Routes
 * ================================================================================ */
csrfRouter.post(`/${DeliveryMaster.version}/order/destroy`, Authorize.planner, DeliveryMaster.m_bulkDelete);
csrfRouter.post(`/${DeliveryMaster.version}/order/`, Authorize.planner, DeliveryMaster.m_create);

csrfRouter.get(`/${DeliveryMaster.version}/order/:deliveryMasterId`, Authorize.planner, DeliveryMaster.m_getOne);
csrfRouter.get(`/${DeliveryMaster.version}/order/`, Authorize.planner, Scopes.m_addDate, DeliveryMaster.m_getAll);

csrfRouter.put(`/${DeliveryMaster.version}/order/:deliveryMasterId`, Authorize.planner, DeliveryMaster.m_update);

csrfRouter.post(`/${DeliveryMaster.version}/order/duplicates`, Authorize.planner, Misc.m_checkDuplicates('DeliveryMaster'));

/* ================================================================================
 *  DeliveryDetail Routes
 * ================================================================================ */
router.post(`/${DeliveryDetail.version}/job/sync`, Authorize.all, DeliveryDetail.m_offlineJobFiles, DeliveryDetail.m_sync);
router.post(`/${DeliveryDetail.version}/job/syncB64`, Authorize.all, DeliveryDetail_v3.m_offlineJobBase64, DeliveryDetail.m_sync);
csrfRouter.post(`/${DeliveryDetail.version}/job/destroy`, Authorize.planner, DeliveryDetail.m_bulkDelete);
csrfRouter.post(`/${DeliveryDetail.version}/job/`, Authorize.planner, DeliveryDetail.m_create);

csrfRouter.get(`/${DeliveryMaster.version}/order/:deliveryMasterId/job`, Authorize.planner, DeliveryDetail.m_getByDeliveryMaster);
csrfRouter.get(`/${DeliveryDetail.version}/job/:deliveryDetailId`, Authorize.all, DeliveryDetail.m_getOne);
csrfRouter.get(`/${DeliveryDetail.version}/job/`, Authorize.all, Scopes.m_addDate, DeliveryDetail.m_getAll);

router.put(`/${DeliveryDetail.version}/job/:deliveryDetailId/attempt`, Authorize.driver, DeliveryDetail.m_attemptJobFiles, DeliveryDetail.m_attemptJob);
router.put(`/${DeliveryDetail.version}/job/:deliveryDetailId/attemptB64`, Authorize.driver, DeliveryDetail_v3.m_attemptJobBase64, DeliveryDetail.m_attemptJob);
csrfRouter.put(`/${DeliveryDetail.version}/job/:deliveryDetailId`, Authorize.planner, DeliveryDetail.m_update);

/* ================================================================================
 *  DeliveryItem Routes
 * ================================================================================ */
csrfRouter.post(`/${DeliveryDetail.version}/job/:deliveryDetailId/item`, Authorize.planner, DeliveryItem.m_create);

csrfRouter.get(`/${DeliveryDetail.version}/job/:deliveryDetailId/item`, Authorize.planner, DeliveryItem.m_getByDeliveryDetail);
csrfRouter.get(`/${DeliveryItem.version}/jobItem/:deliveryItemId`, Authorize.planner, DeliveryItem.m_getOne);
csrfRouter.get(`/${DeliveryItem.version}/jobItem/`, Authorize.planner, DeliveryItem.m_getAll);

// no delete, only replace
csrfRouter.put(`/${DeliveryDetail.version}/job/:deliveryDetailId/item`, Authorize.planner, DeliveryItem.m_replaceByDeliveryDetail);

csrfRouter.put(`/${DeliveryItem.version}/jobItem/:deliveryItemId`, Authorize.planner, DeliveryItem.m_update);

/* ================================================================================
 *  DeliveryPod Routes
 * ================================================================================ */
csrfRouter.get(`/${DeliveryPod.version}/pod/:deliveryDetailId`, Authorize.all, DeliveryPod.m_getOne);

/* ================================================================================
 *  DeliveryNote Routes
 * ================================================================================ */
csrfRouter.get(`/${DeliveryNote.version}/note/:deliveryDetailId`, Authorize.all, DeliveryNote.m_getAll);

/* ================================================================================
 *  VerificationCode Routes
 * ================================================================================ */
csrfRouter.post(`/${VerificationCode.version}/code/:deliveryDetailId/notify`, Authorize.planner, VerificationCode.m_send);

csrfRouter.get(`/${VerificationCode.version}/code/:deliveryDetailId`, Authorize.planner, VerificationCode.m_getOne);

csrfRouter.delete(`/${VerificationCode.version}/code/:deliveryDetailId`, Authorize.planner, VerificationCode.m_delete);

csrfRouter.put(`/${VerificationCode.version}/code/:deliveryDetailId`, Authorize.planner, VerificationCode.m_upsert);