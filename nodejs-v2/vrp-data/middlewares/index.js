/*
 * Copyright (C) 2018 Singapore Institute of Manufacturing Technology - All Rights Reserved
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
'use strict';

const Misc = require('./Misc');
const Files = require('./Files');
const Item = require('./Item');
const Vehicle = require('./Vehicle');
const VehicleType = require('./VehicleType');
const VehicleLocationLog = require('./VehicleLocationLog');
const DeliveryPlan = require('./DeliveryPlan');
const DeliveryMaster = require('./DeliveryMaster');
const DeliveryDetail = require('./DeliveryDetail');
const DeliveryDetail_v3 = require('./v3/DeliveryDetail');
const DeliveryItem = require('./DeliveryItem');
const DeliveryPod = require('./DeliveryPod');
const DeliveryNote = require('./DeliveryNote');
const VerificationCode = require('./VerificationCode');

module.exports = {
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
};
