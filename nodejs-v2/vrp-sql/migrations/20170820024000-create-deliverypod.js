/*
 * Copyright (C) 2018 Singapore Institute of Manufacturing Technology - All Rights Reserved
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
'use strict';

const { SCHEMA } = require('./config/config');
const table = {
    tableName: 'DeliveryPOD',
    schema: SCHEMA,
};

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.sequelize.transaction(async (t) => {
            await queryInterface.createTable(table.tableName, {
                DeliveryDetailId: {
                    type: Sequelize.INTEGER,
                    references: {
                        model: {
                            tableName: 'DeliveryDetail',
                            schema: SCHEMA,
                        },
                        key: 'Id',
                    },
                    allowNull: false,
                    primaryKey: true,
                    onDelete: 'CASCADE',
                },
                Signature: {
                    type: Sequelize.BLOB,
                },
                Photo: {
                    type: Sequelize.BLOB,
                },
            }, {
                schema: SCHEMA,
                transaction: t,
            });

            await queryInterface.addConstraint(table, ['Signature', 'Photo'], {
                type: 'check',
                transaction: t,
                where: {
                    [Sequelize.Op.or]: [{
                        Signature: {
                            [Sequelize.Op.ne]: null,
                        },
                    }, {
                        Photo: {
                            [Sequelize.Op.ne]: null,
                        },
                    }],
                },
            });
        });
    },
    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable(table);
    },
};
