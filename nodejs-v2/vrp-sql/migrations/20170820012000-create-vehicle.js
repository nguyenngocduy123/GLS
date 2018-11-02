/*
 * Copyright (C) 2018 Singapore Institute of Manufacturing Technology - All Rights Reserved
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
'use strict';

const { SCHEMA } = require('./config/config');
const table = {
    tableName: 'Vehicle',
    schema: SCHEMA,
};

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.sequelize.transaction(async (t) => {
            await queryInterface.createTable(table.tableName, {
                Id: {
                    primaryKey: true,
                    type: Sequelize.STRING(50),
                },
                VehicleTypeId: {
                    type: Sequelize.INTEGER,
                    references: {
                        model: {
                            tableName: 'VehicleType',
                            schema: SCHEMA,
                        },
                        key: 'Id',
                    },
                    allowNull: false,
                    onDelete: 'NO ACTION',
                },
                PlateNumber: {
                    type: Sequelize.STRING(10),
                },
                StartAddressPostal: {
                    type: Sequelize.STRING(6),
                    allowNull: false,
                },
                StartAddressLat: {
                    type: Sequelize.FLOAT,
                    allowNull: false,
                },
                StartAddressLng: {
                    type: Sequelize.FLOAT,
                    allowNull: false,
                },
                EndAddressPostal: {
                    type: Sequelize.STRING(6),
                },
                EndAddressLat: {
                    type: Sequelize.FLOAT,
                },
                EndAddressLng: {
                    type: Sequelize.FLOAT,
                },
                ReturnToEndAddress: {
                    type: Sequelize.BOOLEAN,
                    allowNull: false,
                    defaultValue: false,
                },
                DriverUsername: {
                    type: Sequelize.STRING(100),
                },
                StartTime: {
                    type: Sequelize.TIME,
                    allowNull: false,
                },
                EndTime: {
                    type: Sequelize.TIME,
                    allowNull: false,
                },
            }, {
                schema: SCHEMA,
                transaction: t,
            });

            await queryInterface.addIndex(table, ['DriverUsername'], {
                unique: true,
                transaction: t,
                where: {
                    DriverUsername: {
                        [Sequelize.Op.ne]: null, // this is required because DriverUsername can be null
                    },
                },
            });

            await queryInterface.addConstraint(table, ['StartAddressPostal'], {
                type: 'check',
                transaction: t,
                where: {
                    [Sequelize.Op.and]: [
                        Sequelize.where(Sequelize.fn('LEN', Sequelize.col('StartAddressPostal')), {
                            [Sequelize.Op.eq]: 6,
                        }), {
                            StartAddressPostal: {
                                [Sequelize.Op.notLike]: '%[^0-9]%',
                            },
                        },
                    ],
                },
            });

            await queryInterface.addConstraint(table, ['StartAddressLat'], {
                type: 'check',
                transaction: t,
                where: {
                    StartAddressLat: {
                        [Sequelize.Op.between]: [-90, 90],
                    },
                },
            });

            await queryInterface.addConstraint(table, ['StartAddressLng'], {
                type: 'check',
                transaction: t,
                where: {
                    StartAddressLng: {
                        [Sequelize.Op.between]: [-180, 180],
                    },
                },
            });

            await queryInterface.addConstraint(table, [
                'StartAddressPostal', 'StartAddressLat', 'StartAddressLng',
            ], {
                type: 'check',
                transaction: t,
                where: {
                    [Sequelize.Op.or]: [{
                        StartAddressPostal: {
                            [Sequelize.Op.ne]: null,
                        },
                        StartAddressLat: {
                            [Sequelize.Op.ne]: null,
                        },
                        StartAddressLng: {
                            [Sequelize.Op.ne]: null,
                        },
                    }, {
                        StartAddressPostal: null,
                        StartAddressLat: null,
                        StartAddressLng: null,
                    }],
                },
            });

            await queryInterface.addConstraint(table, ['EndAddressPostal'], {
                type: 'check',
                transaction: t,
                where: {
                    [Sequelize.Op.and]: [
                        Sequelize.where(Sequelize.fn('LEN', Sequelize.col('EndAddressPostal')), {
                            [Sequelize.Op.eq]: 6,
                        }), {
                            EndAddressPostal: {
                                [Sequelize.Op.notLike]: '%[^0-9]%',
                            },
                        },
                    ],
                },
            });

            await queryInterface.addConstraint(table, ['EndAddressLat'], {
                type: 'check',
                transaction: t,
                where: {
                    EndAddressLat: {
                        [Sequelize.Op.between]: [-90, 90],
                    },
                },
            });

            await queryInterface.addConstraint(table, ['EndAddressLng'], {
                type: 'check',
                transaction: t,
                where: {
                    EndAddressLng: {
                        [Sequelize.Op.between]: [-180, 180],
                    },
                },
            });

            await queryInterface.addConstraint(table, ['EndAddressPostal', 'EndAddressLat', 'EndAddressLng'], {
                type: 'check',
                transaction: t,
                where: {
                    [Sequelize.Op.or]: [{
                        EndAddressPostal: {
                            [Sequelize.Op.ne]: null,
                        },
                        EndAddressLat: {
                            [Sequelize.Op.ne]: null,
                        },
                        EndAddressLng: {
                            [Sequelize.Op.ne]: null,
                        },
                    }, {
                        EndAddressPostal: null,
                        EndAddressLat: null,
                        EndAddressLng: null,
                    }],
                },
            });

            await queryInterface.addConstraint(table, ['EndAddressPostal', 'ReturnToEndAddress'], {
                type: 'check',
                transaction: t,
                where: {
                    [Sequelize.Op.or]: [{
                        ReturnToEndAddress: 1,
                        EndAddressPostal: {
                            [Sequelize.Op.ne]: null,
                        },
                    }, {
                        ReturnToEndAddress: 0,
                    }],
                },
            });

            await queryInterface.addConstraint(table, ['StartTime', 'EndTime'], {
                type: 'check',
                transaction: t,
                where: {
                    StartTime: {
                        [Sequelize.Op.lt]: Sequelize.col('EndTime'),
                    },
                },
            });
        });
    },
    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable(table);
    },
};
