/*
 * Copyright (C) 2018 Singapore Institute of Manufacturing Technology - All Rights Reserved
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
'use strict';

const { SCHEMA } = require('./config/config');
const table = {
    tableName: 'DeliveryMaster',
    schema: SCHEMA,
};

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.sequelize.transaction(async (t) => {
            await queryInterface.createTable(table.tableName, {
                Id: {
                    primaryKey: true,
                    type: Sequelize.STRING(30),
                },
                VehicleId: {
                    type: Sequelize.STRING(50),
                    references: {
                        model: {
                            tableName: 'Vehicle',
                            schema: SCHEMA,
                        },
                        key: 'Id',
                    },
                    onDelete: 'NO ACTION',
                },
                LastAttemptedByDriver: {
                    type: Sequelize.STRING(100),
                },
                LastAttemptedByPlateNumber: {
                    type: Sequelize.STRING(10),
                },
                Priority: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    defaultValue: 2,
                },
                CustomerName: {
                    type: Sequelize.STRING(254),
                },
                CustomerPhone: {
                    type: Sequelize.STRING(8),
                },
                CustomerEmail: {
                    type: Sequelize.STRING(254),
                },
                VehicleRestriction: {
                    type: Sequelize.STRING('MAX'),
                },
            }, {
                schema: SCHEMA,
                transaction: t,
            });

            await queryInterface.addConstraint(table, ['Priority'], {
                type: 'check',
                transaction: t,
                where: {
                    Priority: {
                        [Sequelize.Op.between]: [1, 10],
                    },
                },
            });

            await queryInterface.addConstraint(table, ['CustomerPhone'], {
                type: 'check',
                transaction: t,
                where: {
                    [Sequelize.Op.and]: [
                        Sequelize.where(Sequelize.fn('LEN', Sequelize.col('CustomerPhone')), {
                            [Sequelize.Op.eq]: 8,
                        }), {
                            CustomerPhone: {
                                [Sequelize.Op.notLike]: '%[^0-9]%',
                            },
                        },
                    ],
                },
            });
        });
    },
    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable(table);
    },
};
