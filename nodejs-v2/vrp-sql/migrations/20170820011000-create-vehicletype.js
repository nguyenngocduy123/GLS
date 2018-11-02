/*
 * Copyright (C) 2018 Singapore Institute of Manufacturing Technology - All Rights Reserved
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
'use strict';

const { SCHEMA } = require('./config/config');
const table = {
    tableName: 'VehicleType',
    schema: SCHEMA,
};

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.sequelize.transaction(async (t) => {
            await queryInterface.createTable(table.tableName, {
                Id: {
                    primaryKey: true,
                    autoIncrement: true,
                    type: Sequelize.INTEGER,
                },
                Name: {
                    type: Sequelize.STRING(50),
                    allowNull: false,
                },
                Capacity: {
                    type: Sequelize.FLOAT,
                },
                FixedCost: {
                    type: Sequelize.FLOAT,
                    defaultValue: 1,
                },
                DistanceCost: {
                    type: Sequelize.FLOAT,
                    defaultValue: 1,
                },
                TravelTimeCost: {
                    type: Sequelize.FLOAT,
                    defaultValue: 1,
                },
                WaitingTimeCost: {
                    type: Sequelize.FLOAT,
                    defaultValue: 1,
                },
            }, {
                schema: SCHEMA,
                transaction: t,
            });

            await queryInterface.addConstraint(table, ['Name'], {
                type: 'unique',
                transaction: t,
                name: 'Name_Unique',
            });

            await queryInterface.addConstraint(table, ['Capacity'], {
                type: 'check',
                transaction: t,
                where: {
                    Capacity: {
                        [Sequelize.Op.gte]: 0,
                    },
                },
            });

            await queryInterface.addConstraint(table, ['FixedCost'], {
                type: 'check',
                transaction: t,
                where: {
                    FixedCost: {
                        [Sequelize.Op.gte]: 0,
                    },
                },
            });

            await queryInterface.addConstraint(table, ['DistanceCost'], {
                type: 'check',
                transaction: t,
                where: {
                    DistanceCost: {
                        [Sequelize.Op.gte]: 0,
                    },
                },
            });

            await queryInterface.addConstraint(table, ['TravelTimeCost'], {
                type: 'check',
                transaction: t,
                where: {
                    TravelTimeCost: {
                        [Sequelize.Op.gte]: 0,
                    },
                },
            });

            await queryInterface.addConstraint(table, ['WaitingTimeCost'], {
                type: 'check',
                transaction: t,
                where: {
                    WaitingTimeCost: {
                        [Sequelize.Op.gte]: 0,
                    },
                },
            });
        });
    },
    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable(table);
    },
};
