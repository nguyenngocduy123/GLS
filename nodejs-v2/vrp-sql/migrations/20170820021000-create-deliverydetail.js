/*
 * Copyright (C) 2018 Singapore Institute of Manufacturing Technology - All Rights Reserved
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
'use strict';

const { SCHEMA } = require('./config/config');
const table = {
    tableName: 'DeliveryDetail',
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
                DeliveryMasterId: {
                    type: Sequelize.STRING(30),
                    references: {
                        model: {
                            tableName: 'DeliveryMaster',
                            schema: SCHEMA,
                        },
                        key: 'Id',
                    },
                    allowNull: false,
                    onDelete: 'CASCADE',
                },
                Status: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    defaultValue: 1,
                },
                JobSequence: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                },
                JobType: {
                    type: Sequelize.ENUM,
                    values: ['PICKUP', 'DELIVERY'],
                    allowNull: false,
                },
                Address: {
                    type: Sequelize.STRING(1024),
                    allowNull: false,
                },
                Postal: {
                    type: Sequelize.STRING(6),
                    allowNull: false,
                },
                Lat: {
                    type: Sequelize.FLOAT,
                    allowNull: false,
                },
                Lng: {
                    type: Sequelize.FLOAT,
                    allowNull: false,
                },
                StartTimeWindow: {
                    type: Sequelize.DATE,
                    allowNull: false,
                },
                EndTimeWindow: {
                    type: Sequelize.DATE,
                    allowNull: false,
                },
                ServiceTime: {
                    type: Sequelize.FLOAT,
                    allowNull: false,
                    defaultValue: 15,
                },
                NoteFromPlanner: {
                    type: Sequelize.STRING('MAX'),
                },
                NoteFromDriver: {
                    type: Sequelize.STRING('MAX'),
                },
                ContactName: {
                    type: Sequelize.STRING(254),
                },
                ContactPhone: {
                    type: Sequelize.STRING(8),
                },
                ContactEmail: {
                    type: Sequelize.STRING(254),
                },
                ActualDeliveryTime: {
                    type: Sequelize.DATE,
                    defaultValue: null,
                },
                EngineRouteSeqNum: {
                    type: Sequelize.INTEGER,
                },
            }, {
                schema: SCHEMA,
                transaction: t,
            });

            await queryInterface.addConstraint(table, ['DeliveryMasterId', 'JobSequence'], {
                type: 'unique',
                transaction: t,
                name: 'DeliveryMasterId_JobSequence_Unique',
            });

            await queryInterface.addConstraint(table, ['Status'], {
                type: 'check',
                transaction: t,
                where: {
                    Status: {
                        [Sequelize.Op.between]: [1, 5],
                    },
                },
            });

            await queryInterface.addConstraint(table, ['Postal'], {
                type: 'check',
                transaction: t,
                where: {
                    [Sequelize.Op.and]: [
                        Sequelize.where(Sequelize.fn('LEN', Sequelize.col('Postal')), {
                            [Sequelize.Op.eq]: 6,
                        }), {
                            Postal: {
                                [Sequelize.Op.notLike]: '%[^0-9]%',
                            },
                        },
                    ],
                },
            });

            await queryInterface.addConstraint(table, ['Lat'], {
                type: 'check',
                transaction: t,
                where: {
                    Lat: {
                        [Sequelize.Op.between]: [-90, 90],
                    },
                },
            });

            await queryInterface.addConstraint(table, ['Lng'], {
                type: 'check',
                transaction: t,
                where: {
                    Lng: {
                        [Sequelize.Op.between]: [-180, 180],
                    },
                },
            });

            await queryInterface.addConstraint(table, ['ContactPhone'], {
                type: 'check',
                transaction: t,
                where: {
                    [Sequelize.Op.and]: [
                        Sequelize.where(Sequelize.fn('LEN', Sequelize.col('ContactPhone')), {
                            [Sequelize.Op.eq]: 8,
                        }), {
                            ContactPhone: {
                                [Sequelize.Op.notLike]: '%[^0-9]%',
                            },
                        },
                    ],
                },
            });

            await queryInterface.addConstraint(table, ['ServiceTime'], {
                type: 'check',
                transaction: t,
                where: {
                    ServiceTime: {
                        [Sequelize.Op.gt]: 0,
                    },
                },
            });

            await queryInterface.addConstraint(table, ['EngineRouteSeqNum'], {
                type: 'check',
                transaction: t,
                where: {
                    EngineRouteSeqNum: {
                        [Sequelize.Op.gt]: 0,
                    },
                },
            });

            await queryInterface.addConstraint(table, ['ActualDeliveryTime'], {
                type: 'check',
                transaction: t,
                where: {
                    [Sequelize.Op.or]: [{
                        ActualDeliveryTime: {
                            [Sequelize.Op.ne]: null,
                        },
                        Status: {
                            [Sequelize.Op.notIn]: [1, 5],
                        },
                    }, {
                        ActualDeliveryTime: {
                            [Sequelize.Op.eq]: null,
                        },
                        Status: {
                            [Sequelize.Op.in]: [1, 5],
                        },
                    }],
                },
            });

            await queryInterface.addConstraint(table, ['NoteFromDriver'], {
                type: 'check',
                transaction: t,
                where: {
                    [Sequelize.Op.or]: [{
                        NoteFromDriver: {
                            [Sequelize.Op.ne]: null,
                        },
                        Status: {
                            [Sequelize.Op.notIn]: [1, 5],
                        },
                    }, {
                        NoteFromDriver: {
                            [Sequelize.Op.eq]: null,
                        },
                        Status: {
                            [Sequelize.Op.between]: [1, 5],
                        },
                    }],
                },
            });

            await queryInterface.addConstraint(table, ['StartTimeWindow', 'EndTimeWindow'], {
                type: 'check',
                transaction: t,
                where: {
                    StartTimeWindow: {
                        [Sequelize.Op.lt]: Sequelize.col('EndTimeWindow'),
                    },
                },
            });
        });
    },
    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable(table);
    },
};
