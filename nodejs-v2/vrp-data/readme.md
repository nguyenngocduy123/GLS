Last updated on 23 May 2018.

# API

## How are the routes organised?

* `data-protected.js` contains routes that are consumed by the planner front-end web application.
    - `csrf` is **enabled**
    - full list of routes available
* `data-unprotected.js` contains `POST` and `PUT` routes that are consumed either by headless scripts or driver application.
    - `csrf` is **disabled**
    - limited routes available

**Rule of Thumb**:

* If the application is for browser, **only** use the APIs in `data-router-protected.js`
* If you are using headless scripts or driver application, **only** use the APIs in `data-router-unprotected.js`

# Database

**Library Used**: Sequelize

## Folders

* `/migrations`
    - Purpose: database migration
    - `npm run db:migrate` to create tables in database based on connection string stated in setting.js
    - `npm run db:migrate -- -- --vrpSetting setting-local.js` to create tables based on another settings file
* `/vrpSql`
    - Purpose: object relational mapping (orm) for application

Refer to [https://stackoverflow.com/questions/21105748/sequelize-js-how-to-use-migrations-and-sync#answer-29941038](https://stackoverflow.com/questions/21105748/sequelize-js-how-to-use-migrations-and-sync#answer-29941038) for instructions on how to create migration scripts.

## What is the associations or relationships between tables?

Associations must be specified in Sequelize vrpSql (i.e. `/vrpSql`) in order to do eager-loading.

For example, `DeliveryMaster.findAll({ include: DeliveryDetail })` will only work if `DeliveryMaster.belongsTo(DeliveryDetail)` is specified.

Refer to [http://docs.sequelizejs.com/en/latest/docs/associations/](http://docs.sequelizejs.com/en/latest/docs/associations/) for details

Refer to #Association Guide

## Association Guide

**Associations**

`Parent` and `Child` are Sequelize vrpSql (i.e. tables in MSSQL).

* One to One (O:O, Parent:Child)
    * `Parent.hasOne(Child, {foreignKey: "ParentId", onDelete: "CASCADE"});`
    * `Child.belongsTo(Parent, {foreignKey: "ParentId"});`
* One to Many (O:M, Parent:Child)
    * `Parent.hasMany(Child, {foreignKey: "ParentId", onDelete: "CASCADE"});`
    * `Child.belongsTo(Parent, {foreignKey: "ParentId"});`
* Many to Many (N:M*, Parent:Child)
    * `Parent.belongsToMany(Child, {through: "Parent_Child", foreignKey: "ParentId"});`
    * `Child.belongsToMany(Parent, {through: "Parent_Child", foreignKey: "ChildId"});`

**ON UPDATE**

Note that `ON UPDATE` is not supported. If a column can be modified, it must _NOT_ be primary key.