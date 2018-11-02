/*
 * Copyright (C) 2018 Singapore Institute of Manufacturing Technology - All Rights Reserved
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
'use strict';

const { SCHEMA } = require('./config/config');
const table = {
    tableName: 'DeliveryItem',
    schema: SCHEMA,
};

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.sequelize.transaction(async (t) => {
            await queryInterface.createTable(table.tableName, {
                Id: {
                    type: Sequelize.INTEGER,
                    autoIncrement: true,
                    // primaryKey: true cannot be set here because the primary key is added in deliveryitem-index script instead
                    allowNull: false, // aka primary key
                },
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
                    onDelete: 'CASCADE',
                },
                ItemId: {
                    type: Sequelize.STRING(30),
                    references: {
                        model: {
                            tableName: 'Item',
                            schema: SCHEMA,
                        },
                        key: 'Id',
                    },
                    allowNull: false,
                    onDelete: 'NO ACTION',
                },
                ItemQty: {
                    type: Sequelize.FLOAT,
                    allowNull: false,
                },
                ActualItemQty: {
                    type: Sequelize.FLOAT,
                },
            }, {
                schema: SCHEMA,
                transaction: t,
            });

            await queryInterface.addConstraint(table, ['DeliveryDetailId', 'ItemId'], {
                type: 'unique',
                transaction: t,
                name: 'DeliveryDetailId_ItemId_Unique',
            });

            await queryInterface.addConstraint(table, ['ItemQty'], {
                type: 'check',
                transaction: t,
                where: {
                    ItemQty: {
                        [Sequelize.Op.gt]: 0,
                    },
                },
            });

            await queryInterface.addConstraint(table, ['ActualItemQty'], {
                type: 'check',
                transaction: t,
                where: {
                    ActualItemQty: {
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
