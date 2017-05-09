# BitDrop API

Running on Node.js, this app exposes an API for the BitDrop app

### How do I get set up? ###
* clone this repo
* install yarn (or npm)
* install node 7.5.0
* run `yarn install`
* create a `config/config.env` file (see structure below)
* set up postgresql DB (see below)
* run `yarn start`

#### config.env ####
```
ENV=development
PORT=3400
PG_HOST=localhost
PG_PORT=5432
PG_USER=
PG_PASSWORD=
PG_DB=
CACHE_PATH=
```

#### Database ####
Set up a PostgreSQL DB (version 9.6 or greater), then create a database:
```sql
CREATE DATABASE bitdrop_db WITH OWNER = postgres ENCODING = 'UTF8' CONNECTION LIMIT = -1;
REVOKE ALL ON DATABASE bitdrop_db FROM public;
```
Then, create an admin user and set its permissions:
```sql
CREATE ROLE bitdrop_admin LOGIN PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE bitdrop_db TO bitdrop_admin;
```
For RDS/Google-Cloud, grant bitdrop_admin to the default user (postgres):
```sql
GRANT bitdrop_admin TO postgres WITH ADMIN OPTION;
```
Then, create a schema with the admin user as its owner:
```sql
CREATE SCHEMA bitdrop AUTHORIZATION bitdrop_admin;
SET search_path = bitdrop;
ALTER ROLE bitdrop_admin IN DATABASE bitdrop_db SET search_path = bitdrop;
GRANT USAGE, CREATE ON SCHEMA bitdrop TO bitdrop_admin;
```
Then, import a snapshot, or create the essential tables using the `db_migrations/latest.sql` script.
