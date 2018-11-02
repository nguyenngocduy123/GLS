/*
 * Copyright (C) 2018 Singapore Institute of Manufacturing Technology - All Rights Reserved
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
'use strict';

const { SCHEMA } = require('./config/config');
const table = {
    tableName: 'VerificationCode',
    schema: SCHEMA,
};

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.sequelize.transaction(async (t) => {
            await queryInterface.createTable(table.tableName, {
                DeliveryDetailId: {
                    primaryKey: true,
                    type: Sequelize.INTEGER,
                    references: {
                        model: {
                            tableName: 'DeliveryDetail',
                            schema: SCHEMA,
                        },
                        key: 'Id',
                    },
                    allowNull: false,
                    onDelete: 'CASCADE',
                },
                Code: {
                    type: Sequelize.STRING(5),
                    allowNull: false,
                },
            }, {
                schema: SCHEMA,
                transaction: t,
            });

            await queryInterface.addConstraint(table, ['Code'], {
                type: 'check',
                transaction: t,
                where: {
                    [Sequelize.Op.and]: [
                        Sequelize.where(Sequelize.fn('LEN', Sequelize.col('Code')), {
                            [Sequelize.Op.eq]: 5,
                        }), {
                            Code: {
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
