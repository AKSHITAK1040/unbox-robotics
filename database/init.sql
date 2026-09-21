CREATE TABLE IF NOT EXISTS speed_data (
    id BIGSERIAL PRIMARY KEY,
    speed DOUBLE PRECISION NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_speed_data_recorded_at ON speed_data(recorded_at DESC);
