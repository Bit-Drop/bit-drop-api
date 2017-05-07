CREATE TABLE bitdrop.tiles
(
    id character varying NOT NULL,
    z integer NOT NULL,
    x integer NOT NULL,
    y integer NOT NULL,
    data_type character varying NOT NULL DEFAULT 'color',
    data jsonb NOT NULL DEFAULT '[255, 255, 255, 0]',
    last_change timestamp without time zone NOT NULL,
    "user" character varying,
    is_cached boolean NOT NULL DEFAULT false,
    PRIMARY KEY (id),
    CONSTRAINT zxy UNIQUE (z, x, y)
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

ALTER TABLE bitdrop.tiles
    OWNER to bitdrop_admin;
